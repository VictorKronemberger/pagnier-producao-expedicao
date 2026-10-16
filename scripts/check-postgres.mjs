import assert from "node:assert/strict";
import {PGlite} from "@electric-sql/pglite";
import {migratePostgres} from "./postgres-migrations.mjs";
import {importTransfer,digest,validateTransfer,tables} from "./db-transfer.mjs";
import {createPostgresDatabase,translatePostgresSql} from "../lib/postgres-adapter.mjs";
import {loginChat,sessionEmployee,tokenHash,validateMessage,sendMessage,chatSummary,readMessages,markRead} from "../lib/team-chat.mjs";

// Neon returns lazy query promises: constructing a transaction must not execute
// its statements outside that transaction. Keep that behavior in the test driver.
const postgres=new PGlite();
function lazyQuery(text,values,options){
 return {text,values,options,then(resolve,reject){return postgres.query(text,values).then(resolve,reject)}};
}
const sql={query:lazyQuery,transaction:queries=>postgres.transaction(async tx=>{
 const results=[];for(const query of queries)results.push(await tx.query(query.text,query.values));return results;
})};
const db=createPostgresDatabase(sql);
try {
 await migratePostgres(sql);await migratePostgres(sql);
 assert.equal(await db.prepare("SELECT COUNT(*) AS count FROM schema_migrations").first("count"),1);
 const literalSql="SELECT '?' AS literal, ? AS parameter, $$?$$ AS dollar, $tag$?$tag$ AS tagged /* ? */ -- ?\n";
 const translated=translatePostgresSql(literalSql);
 assert.equal(translated.parameters,1);assert(translated.text.includes("$1 AS parameter"));
 const literal=await db.prepare(literalSql).bind("kept as data").first();
 assert.deepEqual(literal,{literal:"?",parameter:"kept as data",dollar:"?",tagged:"?"});
 const injection="'); DROP TABLE chat_messages; --";
 assert.equal((await db.prepare("SELECT ?::text AS body").bind(injection).first()).body,injection);
 assert.equal((await db.prepare("SELECT MIN(3,MAX(2,4)), MAX(v) AS aggregate FROM (VALUES (1),(2)) t(v)").first()).aggregate,2);
 await assert.rejects(()=>db.prepare("SELECT ?::text").first(),/parameter count/);
 assert.deepEqual(await db.batch([]),[]);
 await assert.rejects(()=>db.batch([createPostgresDatabase(sql).prepare("SELECT 1")]),/another database/);
 assert.equal(await db.prepare("SELECT 7 AS result").first("result"),7);
 assert.equal(await db.prepare("SELECT 1 WHERE FALSE").first(),null);
 // Neon sends int8 and numeric as strings. Convert only typed numeric columns.
 const numericDb=createPostgresDatabase({query:()=>Promise.resolve({rows:[{id:"42",unread:"3",body:"0123"}],fields:[{name:"id",dataTypeID:20},{name:"unread",dataTypeID:1700},{name:"body",dataTypeID:25}],rowCount:1}),transaction:()=>{}});
 assert.deepEqual(await numericDb.prepare("SELECT 1").first(),{id:42,unread:3,body:"0123"});
 const unsafeDb=createPostgresDatabase({query:()=>Promise.resolve({rows:[{id:"9007199254740993"}],fields:[{name:"id",dataTypeID:20}]}),transaction:()=>{}});
 await assert.rejects(()=>unsafeDb.prepare("SELECT 1").first(),/safe range/);

 const allowed=new Set(["PV1","PV2"]),now=Date.now();
 const account=await loginChat(db,{name:"Pedro",pin:"2846",register:true},now);
 assert.equal(await sessionEmployee(db,account.token,now),"Pedro");
 assert.equal(await sessionEmployee(db,"fake",now),null);
 assert.equal(await sessionEmployee(db,account.token,now+31*86400000),null);
 assert.notEqual(await db.prepare("SELECT pin_hash FROM chat_employees").first("pin_hash"),"2846");
 assert.notEqual(await db.prepare("SELECT token_hash FROM chat_sessions").first("token_hash"),account.token);
 await assert.rejects(()=>loginChat(db,{name:"Pedro",pin:"9999",register:true},now),e=>e.status===409);
 await assert.rejects(()=>loginChat(db,{name:"Unknown",pin:"2846",register:true},now));
 for(let i=0;i<5;i++)await assert.rejects(()=>loginChat(db,{name:"Pedro",pin:"9999"},now),e=>e.status===401);
 await assert.rejects(()=>loginChat(db,{name:"Pedro",pin:"2846"},now),e=>e.status===429);
 await loginChat(db,{name:"Pedro",pin:"2846"},now+300001);
 const base={channel:"order:PV1",body:"@Victor, confira com @Pedro. @Pedroza não é uma menção.",clientId:"test-message-1",reference:"PV2"};
 assert.deepEqual(validateMessage(base,allowed).mentions,["Pedro","Victor"]);
 for(const input of [{...base,channel:"order:fora"},{...base,reference:"fora"},{...base,body:" "},{...base,body:"x".repeat(2001)}])assert.throws(()=>validateMessage(input,allowed));
 const message=await sendMessage(db,"Pedro",base,allowed);
 assert.equal(typeof message.id,"number");
 assert.equal((await sendMessage(db,"Pedro",base,allowed)).id,message.id);
 await assert.rejects(()=>sendMessage(db,"Pedro",{...base,body:"changed"},allowed),e=>e.status===409);
 let summary=await chatSummary(db,"Victor",allowed);
 assert.equal(summary[0].lastId,message.id);assert.equal(summary[0].lastAt,message.createdAt);
 assert.equal(summary[0].count,1);assert.equal(summary[0].unread,1);assert.equal(summary[0].mentions,1);
 assert.equal((await chatSummary(db,"Pedro",allowed))[0].unread,0);
 await markRead(db,"Victor","order:PV1",message.id);
 assert.equal((await chatSummary(db,"Victor",allowed))[0].unread,0);
 const second=await sendMessage(db,"Pedro",{...base,clientId:"test-message-2",body:"Nova mensagem"},allowed);
 await markRead(db,"Victor","order:PV1",message.id);
 assert.equal((await chatSummary(db,"Victor",allowed))[0].unread,1);
 await markRead(db,"Victor","order:PV1",999999);
 assert.equal(await db.prepare("SELECT last_id FROM chat_reads WHERE employee=? AND channel=?").bind("Victor","order:PV1").first("last_id"),second.id);
 await markRead(db,"Victor","order:PV1",message.id);
 assert.equal((await chatSummary(db,"Victor",allowed))[0].unread,0,"read cursor never moves backwards");
 assert.equal((await chatSummary(db,"Victor",new Set())).length,0);
 for(let i=0;i<65;i++)await sendMessage(db,"Victor",{channel:"general",body:"Recado "+i,clientId:"history-message-"+i},allowed);
 const page=await readMessages(db,"general");assert.equal(page.messages.length,60);assert(page.hasOlder);
 const older=await readMessages(db,"general",page.messages[0].id);assert.equal(older.messages.length,5);assert(!older.hasOlder);
 assert.equal((await readMessages(db,"order:PV2")).messages.length,0);
 await db.prepare("DELETE FROM chat_sessions WHERE token_hash=?").bind(await tokenHash(account.token)).run();
 assert.equal(await sessionEmployee(db,account.token,now),null);

 await db.prepare("INSERT INTO production_board(id,payload,revision,updated_at,updated_by) VALUES(?,?,1,?,?)").bind("main","{}",new Date().toISOString(),"Test").run();
 const updates=await Promise.all(["a","b"].map(value=>db.prepare("UPDATE production_board SET payload=?,revision=revision+1 WHERE id=? AND revision=? RETURNING revision").bind(JSON.stringify({writer:value}),"main",1).first()));
 assert.equal(updates.filter(Boolean).length,1,"only one stale-revision writer wins");
 assert.equal(await db.prepare("SELECT revision FROM production_board WHERE id=?").bind("main").first("revision"),2);
 const baseline=await db.prepare("SELECT payload FROM production_board WHERE id=?").bind("main").first("payload");
 await assert.rejects(()=>db.batch([
  db.prepare("UPDATE production_board SET payload=? WHERE id=?").bind("must rollback","main"),
  db.prepare("INSERT INTO chat_employees(name,pin_hash,salt) VALUES(?,?,?)").bind("Pedro","duplicate","duplicate")
 ]));
 assert.equal(await db.prepare("SELECT payload FROM production_board WHERE id=?").bind("main").first("payload"),baseline);
 // Match the importer: retain old IDs and reset identity before the next send.
 await db.prepare("INSERT INTO chat_messages(id,client_id,channel,author,body,mentions,reference_order,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(5000,"imported-message","general","Victor","Imported","[]","",new Date().toISOString()).run();
 await postgres.query("SELECT setval(pg_get_serial_sequence('chat_messages','id'), COALESCE(MAX(id),1), COUNT(*)>0) FROM chat_messages");
 assert.equal((await sendMessage(db,"Pedro",{channel:"general",body:"After import",clientId:"after-import-1"},allowed)).id,5001);
 const source={};for(const table of Object.keys(tables))source[table]=(await db.prepare("SELECT * FROM "+table).all()).results;
 const file={format:"pagnier-local-v1",tables:source,checksum:digest(source)};
 assert.deepEqual(validateTransfer(file),source);
 assert.throws(()=>validateTransfer({...file,checksum:"broken"}));
 const beforeImportMax=await db.prepare("SELECT MAX(id) AS id FROM chat_messages").first("id");
 await postgres.exec("TRUNCATE production_board,chat_employees,chat_sessions,chat_messages,chat_reads RESTART IDENTITY");
 const invalid=structuredClone(file);invalid.tables.chat_employees.push({...invalid.tables.chat_employees[0]});invalid.checksum=digest(invalid.tables);
 await assert.rejects(()=>importTransfer(sql,invalid),/duplicate key/);
 for(const table of Object.keys(tables))assert.equal(await db.prepare("SELECT COUNT(*) AS count FROM "+table).first("count"),0,"failed import rolls back "+table);
 const counts=await importTransfer(sql,file);
 for(const table of Object.keys(tables)){
  assert.equal(counts[table],source[table].length);
  const rows=(await db.prepare("SELECT * FROM "+table).all()).results;
  assert.deepEqual(rows,source[table],"import preserves "+table);
 }
 assert.equal(await db.prepare("SELECT COUNT(*) AS count FROM chat_sessions").first("count"),0,"sessions require fresh login after migration");
 const migratedLogin=await loginChat(db,{name:"Pedro",pin:"2846"});
 assert.equal(await sessionEmployee(db,migratedLogin.token),"Pedro","existing PIN survives migration");
 assert.equal((await sendMessage(db,"Pedro",{channel:"general",body:"After transfer",clientId:"after-transfer-1"},allowed)).id,beforeImportMax+1);
 await assert.rejects(()=>importTransfer(sql,file),/Destination must be empty/);
 assert.equal(await db.prepare("SELECT COUNT(*) AS count FROM chat_messages").first("count"),source.chat_messages.length+1);
 console.log("OK PostgreSQL: parameter binding, numeric types, PIN/session, lockout, chat mentions, unread, pagination, revision conflict, transaction rollback imported identity, idempotent migrations, transfer integrity, occupied target and import rollback.");
} finally {await postgres.close();}
