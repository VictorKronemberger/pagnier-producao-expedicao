import assert from 'node:assert/strict';
import {receiveOrders} from '../lib/intake.mjs';
import {initialSync} from '../lib/nomus-sync.mjs';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {createPostgresDatabase} from '../lib/postgres-adapter.mjs';
import {createClient} from '@libsql/client';
import {createTursoDatabase} from '../lib/turso-adapter.mjs';
import {migrateTurso} from './turso-migrations.mjs';
const turso=process.argv.includes('--turso')?createClient({url:':memory:',intMode:'bigint'}):null;
const pg=turso?null:new PGlite();
const sql={query:(text,values)=>({text,values,then:(yes,no)=>pg.query(text,values).then(yes,no)}),transaction:queries=>pg.transaction(async tx=>{const results=[];for(const q of queries)results.push(await tx.query(q.text,q.values));return results})};
const db=turso?createTursoDatabase(turso):createPostgresDatabase(sql);
const root=process.cwd(),cache=new Map();let currentHeaders=new Headers();
const testEnv={DB:db,NOMUS_API_KEY:''};
cache.set(path.resolve('lib/server-env.ts'),{env:testEnv});
let nomusFetch=()=>{throw Error('Network access forbidden in API test')};
async function load(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file);
 if(file.endsWith('.mjs'))return import(pathToFileURL(file).href);
 if(file.endsWith('.json'))return JSON.parse(readFileSync(file,'utf8'));
 const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const imports={};
 for(const [,name] of source.matchAll(/require\("([^"\n]+)"\)/g)){
  if(name==='next/headers'){imports[name]={headers:async()=>currentHeaders};continue}
  if(!name.startsWith('.'))throw Error('Unexpected dependency '+name);
  let dependency=path.resolve(path.dirname(file),name);if(!/\.(?:ts|mjs|json)$/.test(dependency))dependency+='.ts';
  imports[name]=await load(dependency);
 }
 const exports={};
 vm.runInNewContext(source,{exports,require:name=>imports[name],Response,Request,Headers,URL,TextEncoder,Date,console,fetch:(...args)=>nomusFetch(...args)},{filename:file});
 cache.set(file,exports);return exports;
}
const origin='https://panel.test';let cookie='';
async function call(route,method='GET',body,options={}){
 const headers=new Headers({origin,...options.headers});if(cookie&&!options.anonymous)headers.set('cookie',cookie);
 currentHeaders=headers;
 const request=new Request(origin+'/api/'+route+(options.query??''),{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})});
 return (await load('app/api/'+route+'/route.ts'))[method](request);
}
try{
 if(turso)await migrateTurso(turso);else await pg.exec(readFileSync('migrations/postgres/001_initial.sql','utf8'));
 // A database quota refusal must not be reported as a bad PIN or expose provider details.
 const quotaError=Object.assign(new Error('Server error (HTTP status 402): {"message":"Your account or project has exceeded the quota. Upgrade your plan to increase limits."} PRIVATE_CONNECTION_DETAIL'),{name:'NeonDbError'});
 testEnv.DB={prepare(){throw quotaError}};
 for(const method of ['GET','POST']){
  const failed=await call('chat/session',method,method==='POST'?{name:'Victor',pin:'5826'}:undefined);
  assert.equal(failed.status,503);
  assert.equal(failed.headers.get('set-cookie'),null);
  const body=await failed.json();assert.equal(body.code,'DATABASE_QUOTA_EXCEEDED');assert.match(body.error,/limite de uso/);assert.doesNotMatch(JSON.stringify(body),/PRIVATE_CONNECTION_DETAIL|5826|Upgrade your plan/);
 }
 testEnv.DB={prepare(){throw new Error('PRIVATE_CONNECTION_DETAIL')}};
 const unavailable=await call('chat/session');assert.equal(unavailable.status,503);
 const unavailableBody=await unavailable.json();assert.equal(unavailableBody.code,'SERVICE_UNAVAILABLE');assert.doesNotMatch(unavailableBody.error,/PRIVATE_CONNECTION_DETAIL|mensagens/);
 testEnv.DB=db;
 assert.equal((await call('chat/session')).status,200,'session recovers once database is available');

 for(const [route,methods] of [['board',['GET','PUT','POST','DELETE']],['nomus',['GET','POST']],['packing-clients',['GET']],['chat',['GET','POST']],['chat/read',['POST']]]){
  for(const method of methods){
   const response=await call(route,method,method==='GET'?undefined:{},{anonymous:true,headers:{'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'forged@example.test'}});
   assert.equal(response.status,401,route+' '+method+' must reject anonymous/forged identity');
  }
 }
 let response=await call('chat/session','POST',{name:'Victor',pin:'5826',register:true},{headers:{origin:'https://foreign.test'}});assert.equal(response.status,403);
 response=await call('chat/session','POST',{name:'Victor',pin:'5826',register:true});assert.equal(response.status,200);
 const cookies=response.headers.get('set-cookie');assert.match(cookies,/HttpOnly/);assert.match(cookies,/Secure/);assert.match(cookies,/SameSite=Strict/);
 cookie=cookies.match(/pagnier_employee=[a-f0-9]+/)[0];
 assert.equal((await (await call('chat/session')).json()).employee,'Victor');
 for(const route of ['board','nomus','chat'])assert.equal((await call(route)).status,200,route);
 const board={sequence:[],details:{}};
 response=await call('board','PUT',{revision:0,board});assert.equal(response.status,200,await response.text());
 assert.equal((await call('board','PUT',{revision:0,board})).status,409,'stale revisions rejected');
 const compactBoard=await (await call('board','GET',undefined,{query:'?revision=1&boardOnly=1'})).json();
 assert.equal(compactBoard.unchanged,true);assert.equal(compactBoard.revision,1);assert.equal(compactBoard.board,undefined);assert.equal(compactBoard.snapshot,undefined);
 const freshBoardResponse=await call('board','GET',undefined,{query:'?revision=0&boardOnly=1'});
 assert.equal(freshBoardResponse.headers.get('cache-control'),'no-store');
 const freshBoard=await freshBoardResponse.json();assert.equal(freshBoard.revision,1);assert.deepEqual(freshBoard.board.sequence,[]);assert.equal(freshBoard.snapshot,undefined);
 assert.equal((await call('board','GET',undefined,{query:'?revision=-1'})).status,400);
 assert.equal((await call('board','GET',undefined,{query:'?revision=1',anonymous:true})).status,401);
 assert.equal((await call('board','PUT',{revision:0,board:{invalid:true}})).status,409,'stale writes are detected before domain validation');
 console.log('OK conditional board reads: compact unchanged result, fresh board without ERP snapshot, no cache, authentication and stale-write guard.');
 assert.equal((await call('board','PUT',{revision:1,board},{headers:{origin:'https://foreign.test'}})).status,403);
 response=await call('chat','POST',{channel:'general',body:'@Cyntia confira o pedido',clientId:'vercel-api-test-1'});assert.equal(response.status,201);
 const message=(await response.json()).message;assert.deepEqual(message.mentions,['Cyntia']);assert.equal(typeof message.id,'number');
 assert.equal((await call('chat/read','POST',{channel:'general',id:message.id})).status,200);
 assert.equal((await call('chat','POST',{channel:'order:missing',body:'teste',clientId:'vercel-api-test-2'})).status,404);
 const summary=await (await call('chat')).json();assert.equal(summary.messages.length,1);assert.equal(summary.threads[0].lastId,message.id);

 // Manual refresh: bypass only the normal timer, never a shared lease or retry backoff.
 assert.equal((await call('nomus','POST',{productionOps:[],refresh:'yes'})).status,400);
 assert.equal((await call('nomus','POST',{productionOps:[],refresh:true},{headers:{origin:'https://foreign.test'}})).status,403);
 assert.equal((await (await call('nomus','POST',{productionOps:[],refresh:true})).json()).refreshStatus,'unconfigured');
 testEnv.NOMUS_API_KEY='test-only';
 let captures=0,finishCapture,enteredCapture;
 nomusFetch=async(_url,options)=>{captures++;assert.equal(options.method,'GET');return Response.json([])};
 const savedCapture='2026-10-01T12:00:00.000Z';
 const seed=()=>({...initialSync({grupos:[],semVinculo:[],pedidos:[]}),lastChecked:savedCapture,nextAt:Date.now()+22000});
 async function saveSync(state){await db.prepare('INSERT INTO production_board(id,payload,revision,updated_at,updated_by) VALUES(?,?,1,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,revision=production_board.revision+1').bind('nomus',JSON.stringify(state),savedCapture,'Test').run()}
 await saveSync(seed());
 const automatic=await (await call('nomus','POST',{productionOps:[]})).json();assert.equal(automatic.refreshStatus,'cached');assert.equal(captures,0);
 const manual=await (await call('nomus','POST',{productionOps:[],refresh:true})).json();assert.equal(manual.refreshStatus,'updated');assert.notEqual(manual.lastChecked,savedCapture);assert.equal(captures,1);
 const unchanged=await (await call('nomus','POST',{productionOps:[],knownRevision:manual.nomusRevision})).json();
 assert.equal(unchanged.unchanged,true);assert.equal(unchanged.snapshot,undefined);assert.equal(unchanged.nomusRevision,manual.nomusRevision);assert.equal(captures,1);
 assert.equal((await call('nomus','POST',{productionOps:[],knownRevision:-1})).status,400);

 assert.equal((await (await call('nomus','POST',{productionOps:[],refresh:true})).json()).refreshStatus,'cooldown');assert.equal(captures,1);
 await saveSync(seed());
 const entered=new Promise(r=>enteredCapture=r);
 nomusFetch=async(_url,options)=>{captures++;assert.equal(options.method,'GET');enteredCapture();return new Promise(r=>finishCapture=()=>r(Response.json([])))};
 const running=call('nomus','POST',{productionOps:[],refresh:true});await entered;
 const concurrent=await (await call('nomus','POST',{productionOps:[],refresh:true})).json();assert.equal(concurrent.refreshStatus,'busy');assert.equal(captures,2);
 finishCapture();assert.equal((await (await running).json()).refreshStatus,'updated');
 await saveSync(seed());nomusFetch=async()=>{captures++;return new Response('',{status:503})};
 const failed=await (await call('nomus','POST',{productionOps:[],refresh:true})).json();assert.equal(failed.refreshStatus,'failed');assert.equal(failed.lastChecked,savedCapture);assert.deepEqual(failed.snapshot.grupos,[]);
 assert.equal((await (await call('nomus','POST',{productionOps:[],refresh:true})).json()).refreshStatus,'cooldown');assert.equal(captures,3);
 const expiredLease={...seed(),leaseUntil:Date.now()-1,nextAt:Date.now()-1};await saveSync(expiredLease);nomusFetch=async()=>Response.json([]);
 assert.equal((await (await call('nomus','POST',{productionOps:[],refresh:true})).json()).refreshStatus,'updated');
 for(const orderCode of [null,7,[],{},'', ' '.repeat(2), 'x'.repeat(101)])assert.equal((await call('nomus','POST',{productionOps:[],orderCode})).status,400);
 const focusedState=seed();focusedState.orders={7:{code:'PV SELECTED',companyId:1,clientId:9,createdDate:'2026-10-19',items:[{productId:8,quantity:'4',status:2}]}};focusedState.pages.orders=22;
 await saveSync(focusedState);let focusedPath;
 nomusFetch=async(url,options)=>{focusedPath=url;assert.equal(options.method,'GET');return Response.json({id:7,idEmpresa:1,codigoPedido:'PV SELECTED',idPessoaCliente:9,itensPedido:[{idProduto:8,quantidade:'4',status:4}]})};
 const focusedReply=await (await call('nomus','POST',{productionOps:[],orderCode:'PV SELECTED',refresh:true})).json();
 assert(focusedPath.endsWith('pedidos/7'));assert.equal(focusedReply.snapshot.pedidos[0].itens[0].status,4);assert(focusedReply.snapshot.pedidos[0].pedidoConsultadoEm);assert.equal(focusedReply.paginaPedidos,22);
 // Normal sync reads one page per poll, even with old scan state queued.
 const legacyScan=seed();legacyScan.orderScan={nextPage:1,seen:{}};legacyScan.orderAbsences={11:{scans:2,detailMisses:1}};
 await saveSync(legacyScan);let pageCalls=0;
 nomusFetch=async(url,options)=>{
  assert.equal(options.method,'GET');pageCalls++;assert(url.endsWith('pedidos?pagina=1'));
  return Response.json(Array.from({length:50},(_,i)=>({id:100+i,codigoPedido:'PD QA '+i,idEmpresa:1,idPessoaCliente:9,itensPedido:[]})));
 };
 const pageResponse=await call('nomus','POST',{productionOps:[],refresh:true});assert.equal(pageResponse.status,200);
 const pageView=await pageResponse.json();assert.equal(pageView.refreshStatus,'updated');assert.equal(pageView.paginaPedidos,2);assert.equal(pageView.pedidoVarredura,undefined);assert.equal(pageCalls,1,'no additional deletion sweep');
 const persisted=JSON.parse((await db.prepare('SELECT payload FROM production_board WHERE id=?').bind('nomus').first()).payload);
 assert.equal(persisted.orderAbsences,undefined);assert.equal(persisted.orderScan,undefined);
 console.log('OK normal paginated sync: one GET per poll and obsolete deletion checks discarded.');
 testEnv.NOMUS_API_KEY='';
 console.log('OK Nomus refresh: immediate GET, unchanged timestamp on failure, one request across concurrent tabs, cooldown, expired lease recovery and authenticated same-origin access.');
 // Archiving is independent of physical completion and survives a fresh board read.
 const archiveSeed=seed();
 archiveSeed.orders={1:{code:'OLD-PV',companyId:1,clientId:9,createdDate:'2026-09-01',items:[{productId:7,quantity:'2',status:1}]}};
 await saveSync(archiveSeed);
 const loaded=await (await call('board')).json(),archiveBoard={...loaded.board,details:{...loaded.board.details,'OLD-PV':{responsavel:'',nota:'Preservar orientação',situacao:'A programar',arquivado:true}}};
 const readsBeforeArchive=captures;
 response=await call('board','PUT',{revision:loaded.revision,board:archiveBoard});assert.equal(response.status,200,await response.text());
 const archived=await (await call('board')).json();assert.equal(archived.board.details['OLD-PV'].arquivado,true);assert.equal(archived.board.details['OLD-PV'].situacao,'A programar');assert.equal(archived.board.details['OLD-PV'].envio,undefined);assert.equal(captures,readsBeforeArchive);
 assert.equal((await call('board','PUT',{revision:loaded.revision,board:archiveBoard})).status,409);
 const released=[{id:'OLD-PV',codigo:'OLD-PV',liberacao:'released',ordens:[{id:'OP1'}]}];
 assert.deepEqual(receiveOrders(archived.board,released),archived.board,'Nomus refresh must not requeue an archived order');
 const invalid=structuredClone(archived.board);invalid.details['OLD-PV'].arquivado='yes';
 assert.equal((await call('board','PUT',{revision:archived.revision,board:invalid})).status,400);
 archived.board.details['OLD-PV'].arquivado=false;
 response=await call('board','PUT',{revision:archived.revision,board:archived.board});assert.equal(response.status,200,await response.text());
 const restored=await (await call('board')).json();assert(!restored.board.details['OLD-PV'].arquivado);assert.equal(restored.board.details['OLD-PV'].nota,'Preservar orientação');assert.equal(restored.board.details['OLD-PV'].situacao,'A programar');
 assert(receiveOrders(restored.board,released).sequence.includes('OLD-PV'));
 console.log('OK archive/restore without OP, shipment or procedures; durable metadata, conflict checks and no automatic requeue.');
 // The ready stage is durable and does not bypass actual dispatch validation.
 restored.board.details['OLD-PV'].situacao='Pronto para envio';
 response=await call('board','PUT',{revision:restored.revision,board:restored.board});assert.equal(response.status,200,await response.text());
 const ready=await (await call('board')).json();assert.equal(ready.board.details['OLD-PV'].situacao,'Pronto para envio');assert.equal(ready.board.details['OLD-PV'].envio,undefined);
 ready.board.details['OLD-PV'].situacao='Atendido totalmente e enviado';
 assert.equal((await call('board','PUT',{revision:ready.revision,board:ready.board})).status,400,'Ready does not bypass dispatch requirements');
 assert.equal((await (await call('board')).json()).board.details['OLD-PV'].situacao,'Pronto para envio');
 console.log('OK ready-for-shipping status: saved, reloaded and dispatch validation preserved.');
 const archiveInput={action:'archive',orderId:'OLD-PV',revision:ready.revision,archived:true,reason:'nomus_deleted',note:'Confirmado no ERP'};
 assert.equal((await call('board','POST',archiveInput)).status,400,'deleted reason requires explicit confirmation');
 assert.equal((await call('board','POST',{...archiveInput,confirmedDeleted:true},{headers:{origin:'https://foreign.test'}})).status,403);
 response=await call('board','POST',{...archiveInput,confirmedDeleted:true,por:'Forged actor'});assert.equal(response.status,200,await response.clone().text());
 const archiveResult=await response.json();assert.equal(archiveResult.board.details['OLD-PV'].arquivo.por,'Victor');assert.equal(archiveResult.board.details['OLD-PV'].arquivo.motivo,'nomus_deleted');assert(archiveResult.board.details['OLD-PV'].arquivo.em);
 assert.equal(archiveResult.board.details['OLD-PV'].nota,'Preservar orientação');assert.equal(archiveResult.board.details['OLD-PV'].situacao,'Pronto para envio');
 assert.equal((await call('board','POST',{...archiveInput,confirmedDeleted:true})).status,409,'stale archive cannot overwrite another session');
 const modified=structuredClone(archiveResult.board);modified.details['OLD-PV'].nota='Nota posterior';delete modified.details['OLD-PV'].arquivo;
 response=await call('board','PUT',{board:modified,revision:archiveResult.revision});assert.equal(response.status,200,await response.text());
 const preserved=await (await call('board')).json();assert.equal(preserved.board.details['OLD-PV'].arquivo.por,'Victor','normal autosave cannot erase archive metadata');
 response=await call('board','POST',{action:'archive',orderId:'OLD-PV',revision:preserved.revision,archived:false});assert.equal(response.status,200,await response.clone().text());const unarchived=await response.json();assert(!unarchived.board.details['OLD-PV'].arquivado);assert.equal(unarchived.board.details['OLD-PV'].arquivo.restauradoPor,'Victor');assert.equal(unarchived.board.details['OLD-PV'].nota,'Nota posterior');
 assert.equal(unarchived.board.details['OLD-PV'].arquivo.historico.at(-1).acao,'restaurar');
 assert.equal(unarchived.board.details['OLD-PV'].arquivo.historico.at(-2).observacao,'Confirmado no ERP');
 console.log('OK archive API: confirmation, server actor/time, preserved notes, restore, revision/origin/auth guards and metadata survives autosave.');
 // Old confirmed absence evidence must never mutate the shared board, even on cached polls.
 const automaticState=seed(),missingCode='PD 900001',confirmedAt=new Date(Date.now()-60000).toISOString();
 automaticState.orders={11:{code:missingCode,companyId:1,clientId:9,createdDate:'2026-10-01',items:[{productId:7,quantity:'2',status:2}]} };
 automaticState.orderAbsences={11:{code:missingCode,scans:2,detailMisses:2,status:400,firstMissingAt:confirmedAt,lastScanAt:confirmedAt,confirmedAt}};
 automaticState.clients={9:'Cliente sintético'};
 await saveSync(automaticState);testEnv.NOMUS_API_KEY='test-only';
 const manualBase=await (await call('board')).json(),beforeCaptures=captures;
 for(let i=0;i<3;i++){
  response=await call('nomus','POST',{productionOps:[]});assert.equal(response.status,200);assert.equal((await response.json()).refreshStatus,'cached');
  const current=await (await call('board')).json();assert.equal(current.revision,manualBase.revision);assert.deepEqual(current.board,manualBase.board);
 }
 assert.equal(captures,beforeCaptures,'cached sync does not make extra deletion requests');
 // A person can archive that very same order with their chosen reason.
 response=await call('board','POST',{action:'archive',orderId:missingCode,revision:manualBase.revision,archived:true,reason:'cancelled',note:'Cancelamento confirmado pela equipe'});
 assert.equal(response.status,200,await response.clone().text());const manualResult=await response.json();
 assert.equal(manualResult.revision,manualBase.revision+1);assert(manualResult.board.details[missingCode].arquivado);
 assert.equal(manualResult.board.details[missingCode].arquivo.por,'Victor');assert.equal(manualResult.board.details[missingCode].arquivo.motivo,'cancelled');
 const otherSession=await (await call('board','GET',undefined,{query:'?boardOnly=1&revision='+manualBase.revision})).json();assert(otherSession.board.details[missingCode].arquivado);
 assert.equal((await call('board','POST',{action:'archive',orderId:missingCode,revision:manualBase.revision,archived:false})).status,409);
 response=await call('board','POST',{action:'archive',orderId:missingCode,revision:manualResult.revision,archived:false});assert.equal(response.status,200);
 await call('nomus','POST',{productionOps:[]});assert(!(await (await call('board')).json()).board.details[missingCode].arquivado);
 testEnv.NOMUS_API_KEY='';
 console.log('OK manual-only archive: cached absence evidence is inert; chosen reason, actor, shared revision, stale-write guard and restoration preserved.');
 // Archive metadata survives old autosave clients and missing orders cannot silently disappear from history.
 const historyBase=await (await call('board')).json();
 response=await call('board','POST',{action:'archive',orderId:missingCode,revision:historyBase.revision,archived:true,reason:'duplicate'});assert.equal(response.status,200);const archivedAgain=await response.json();
 assert.deepEqual(archivedAgain.board.details[missingCode].arquivo.historico.map(e=>e.acao),['arquivar','restaurar','arquivar']);
 assert.equal(archivedAgain.board.details[missingCode].arquivo.historico[0].motivo,'cancelled');
 await saveSync(seed());
 response=await call('board','POST',{action:'archive',orderId:missingCode,revision:archivedAgain.revision,archived:false});assert.equal(response.status,400);assert.match((await response.json()).error,/Restauração indisponível/);
 const retained=await (await call('board')).json();assert.equal(retained.revision,archivedAgain.revision);assert(retained.board.details[missingCode].arquivado);assert.equal(retained.board.details[missingCode].arquivo.historico.length,3);
 assert.equal((await call('chat/session','DELETE')).status,200);
 assert.equal((await call('board')).status,401,'revoked cookie cannot read board');
 assert.equal((await call('chat')).status,401,'revoked cookie cannot read chat');
 assert.equal(await db.prepare('SELECT COUNT(*) AS count FROM chat_sessions').first('count'),0);
 console.log('OK Vercel APIs: PIN login, origin checks, forged identity rejection, protected routes, revision conflict, chat and logout ('+(turso?'Turso/libSQL':'PostgreSQL')+'). No real database or ERP used.');
}finally{if(turso)turso.close();else await pg.close()}
