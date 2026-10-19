import assert from 'node:assert/strict';
import {createClient} from '@libsql/client';
import {PGlite} from '@electric-sql/pglite';
import {createTursoDatabase} from '../lib/turso-adapter.mjs';
import {createPostgresDatabase} from '../lib/postgres-adapter.mjs';
import {databaseProvider,tursoConfig} from '../lib/database-config.mjs';
import {createRevisionReader} from '../lib/revision-reader.mjs';
import {migrateTurso} from './turso-migrations.mjs';
import {migratePostgres} from './postgres-migrations.mjs';
import {exportNeon} from './neon-export.mjs';
import {importTurso} from './turso-transfer.mjs';
import {tables,digest} from './db-transfer.mjs';
import {loginChat,sessionEmployee,sendMessage,chatSummary,markRead,readMessages} from '../lib/team-chat.mjs';
const client=createClient({url:':memory:',intMode:'bigint'}),db=createTursoDatabase(client),pg=new PGlite();
const sql={query:(text,values)=>({text,values,then:(resolve,reject)=>pg.query(text,values).then(resolve,reject)}),transaction:(queries,options)=>pg.transaction(async tx=>{
 if(options?.readOnly!==undefined){assert.equal(options.readOnly,true);assert.equal(options.isolationLevel,'RepeatableRead')}
 const results=[];for(const q of queries)results.push(await tx.query(q.text,q.values));return results;
})};
const source=createPostgresDatabase(sql),allowed=new Set(['PV1']);
try{
 assert.equal(databaseProvider({TURSO_DATABASE_URL:'libsql://test.turso.io'}),'neon','cutover must be explicit');
 assert.equal(databaseProvider({DATABASE_PROVIDER:'turso'}),'turso');
 assert.throws(()=>databaseProvider({DATABASE_PROVIDER:'unknown'}));
 assert.throws(()=>tursoConfig({TURSO_DATABASE_URL:'libsql://test.turso.io'}));
 assert.throws(()=>tursoConfig({TURSO_DATABASE_URL:'http://test.turso.io',TURSO_AUTH_TOKEN:'fixture'}));
 await migratePostgres(sql);await migrateTurso(client);await migrateTurso(client);
 assert.equal(await db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').first('n'),1);
 const migration=await db.prepare('SELECT checksum FROM schema_migrations').first('checksum');
 await client.execute("UPDATE schema_migrations SET checksum='wrong'");await assert.rejects(()=>migrateTurso(client));
 await client.execute({sql:'UPDATE schema_migrations SET checksum=?',args:[migration]});
 const oldSession=await loginChat(source,{name:'Pedro',pin:'2846',register:true});
 const board=JSON.stringify({sequence:['PV1'],details:{PV1:{nota:'Observação de teste',envio:{caixas:[{id:'BOX1'}]}}},invoices:{I1:{orderIds:['PV1']}}});
 await source.prepare('INSERT INTO production_board VALUES(?,?,?,?,?)').bind('main',board,7,'2026-10-19T12:00:00Z','Pedro').run();
 await source.prepare('INSERT INTO production_board VALUES(?,?,?,?,?)').bind('nomus',JSON.stringify({orders:{a:{code:'PV1'}},snapshot:{grupos:[],pedidos:[],semVinculo:[]}}),3,'2026-10-19T12:00:00Z','Nomus').run();
 await sendMessage(source,'Pedro',{channel:'general',body:'@Victor conferência',clientId:'source-message-1'},allowed);
 await markRead(source,'Victor','general',1);
 await source.prepare('INSERT INTO chat_messages(id,client_id,channel,author,body,mentions,reference_order,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(5000,'source-message-2','order:PV1','Pedro','Histórico preservado','[]','PV1','2026-10-19T12:00:00Z').run();
 const file=await exportNeon(sql);
 const invalid=structuredClone(file);invalid.tables.chat_employees.push({...invalid.tables.chat_employees[0]});invalid.checksum=digest(invalid.tables);
 await assert.rejects(()=>importTurso(client,invalid));
 for(const table of Object.keys(tables))assert.equal(await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first('n'),0,'rollback '+table);
 assert.equal(await db.prepare("SELECT name FROM sqlite_master WHERE name='_pagnier_import_guard'").first(),null);
 const counts=await importTurso(client,file);
 for(const [table,columns] of Object.entries(tables)){
  const rows=(await db.prepare(`SELECT ${columns.join(',')} FROM ${table}`).all()).results;
  const sort=rows=>rows.map(row=>JSON.stringify(row)).sort();
  assert.deepEqual(sort(rows),sort(file.tables[table]),table+' preserves exact content');assert.equal(counts[table],rows.length);
 }
 assert.equal(await sessionEmployee(db,oldSession.token),null,'old sessions are not copied');
 const session=await loginChat(db,{name:'Pedro',pin:'2846'});assert.equal(await sessionEmployee(db,session.token),'Pedro');
 for(let i=0;i<5;i++)await assert.rejects(()=>loginChat(db,{name:'Pedro',pin:'9999'}),e=>e.status===401);
 await assert.rejects(()=>loginChat(db,{name:'Pedro',pin:'2846'}),e=>e.status===429);
 await loginChat(db,{name:'Pedro',pin:'2846'},Date.now()+300001);
 const sent=await sendMessage(db,'Pedro',{channel:'general',body:'@Victor após migração',clientId:'after-transfer-1'},allowed);assert.equal(sent.id,5001);
 await assert.rejects(()=>importTurso(client,file));assert.equal(await db.prepare('SELECT COUNT(*) AS n FROM chat_messages').first('n'),3);
 assert.equal((await readMessages(db,'general',5001)).messages[0].id,1);
 assert.equal(await db.prepare('SELECT ? AS value').bind("'); DROP TABLE chat_messages; --").first('value'),"'); DROP TABLE chat_messages; --");
 await assert.rejects(()=>db.prepare('SELECT 9007199254740993 AS unsafe').first(),/safe range/);
 await assert.rejects(()=>db.batch([createTursoDatabase(client).prepare('SELECT 1')]),/another database/);
 await assert.rejects(()=>db.batch([db.prepare('UPDATE production_board SET payload=? WHERE id=?').bind('rollback','main'),db.prepare('INSERT INTO chat_employees(name,pin_hash,salt) VALUES(?,?,?)').bind('Pedro','duplicate','duplicate')]));
 assert.equal(await db.prepare('SELECT payload FROM production_board WHERE id=?').bind('main').first('payload'),board);
 const updates=await Promise.all(['one','two'].map(value=>db.prepare('UPDATE production_board SET updated_by=?,revision=revision+1 WHERE id=? AND revision=? RETURNING revision').bind(value,'main',7).first()));
 assert.equal(updates.filter(Boolean).length,1);
 // Instrument actual returned payload bytes and SQL aggregation calls.
 let bytes=0,aggregations=0;
 const measured={prepare(text){if(text.includes('GROUP BY m.channel'))aggregations++;const stmt=db.prepare(text);return {bind(...args){const bound=stmt.bind(...args);return {async first(){const row=await bound.first();bytes+=row?.payload?.length??0;return row},all:()=>bound.all()}}}}};
 const read=createRevisionReader('nomus');const first=await read(measured);const initialBytes=bytes;
 for(let i=0;i<20;i++)assert.deepEqual(await read(measured),first);
 assert.equal(bytes,initialBytes,'20 unchanged reads transfer no repeated payload');
 await db.prepare('UPDATE production_board SET payload=?,revision=revision+1 WHERE id=?').bind('{"changed":true}','nomus').run();
 assert.equal((await read(measured)).payload,'{"changed":true}','revision changes invalidate immediately');
 const summary=await chatSummary(measured,'Victor',allowed);for(let i=0;i<20;i++)assert.deepEqual(await chatSummary(measured,'Victor',allowed),summary);
 assert.equal(aggregations,1,'unchanged polls avoid full history aggregation');
 await markRead(db,'Victor','general',5001);assert.equal((await chatSummary(measured,'Victor',allowed)).find(x=>x.channel==='general').unread,0);assert.equal(aggregations,2);
 await sendMessage(db,'Pedro',{channel:'general',body:'@Victor nova mensagem',clientId:'cache-invalidation-1'},allowed);
 assert.equal((await chatSummary(measured,'Victor',allowed)).find(x=>x.channel==='general').unread,1);assert.equal(aggregations,3,'new messages invalidate immediately');

 const onlyGeneral=await chatSummary(measured,'Victor',new Set());assert(onlyGeneral.every(x=>x.channel==='general'),'cached summaries still enforce current order visibility');
 const plan=await client.execute({sql:'EXPLAIN QUERY PLAN SELECT * FROM chat_messages WHERE channel=? AND id<? ORDER BY id DESC LIMIT 61',args:['general',5001]});
 assert(plan.rows.some(row=>String(row.detail).includes('chat_message_channel')),'history uses channel/id index');
 console.log('OK Turso: idempotent schema, checksum guard, exact Neon transfer, rollback, occupied target refusal, existing PIN, lockout, sessions, message IDs, pagination index, atomic writes and revision conflicts.');
 console.log('Measured: 20 unchanged Nomus reads returned 0 extra payload bytes; 21 unchanged chat polls performed 1 history aggregation, with immediate invalidation after reads/messages.');
}finally{client.close();await pg.close()}
