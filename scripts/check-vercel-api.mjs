import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {createPostgresDatabase} from '../lib/postgres-adapter.mjs';
const pg=new PGlite();
const sql={query:(text,values)=>({text,values,then:(yes,no)=>pg.query(text,values).then(yes,no)}),transaction:queries=>pg.transaction(async tx=>{const results=[];for(const q of queries)results.push(await tx.query(q.text,q.values));return results})};
const db=createPostgresDatabase(sql),root=process.cwd(),cache=new Map();let currentHeaders=new Headers();
cache.set(path.resolve('lib/server-env.ts'),{env:{DB:db,NOMUS_API_KEY:''}});
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
 vm.runInNewContext(source,{exports,require:name=>imports[name],Response,Request,Headers,URL,TextEncoder,Date,console,fetch:()=>{throw Error('Network access forbidden in API test')}},{filename:file});
 cache.set(file,exports);return exports;
}
const origin='https://panel.test';let cookie='';
async function call(route,method='GET',body,options={}){
 const headers=new Headers({origin,...options.headers});if(cookie&&!options.anonymous)headers.set('cookie',cookie);
 currentHeaders=headers;
 const request=new Request(origin+'/api/'+route,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})});
 return (await load('app/api/'+route+'/route.ts'))[method](request);
}
try{
 await pg.exec(readFileSync('migrations/postgres/001_initial.sql','utf8'));
 for(const [route,methods] of [['board',['GET','PUT','DELETE']],['nomus',['GET','POST']],['packing-clients',['GET']],['chat',['GET','POST']],['chat/read',['POST']]]){
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
 assert.equal((await call('board','PUT',{revision:1,board},{headers:{origin:'https://foreign.test'}})).status,403);
 response=await call('chat','POST',{channel:'general',body:'@Cythia confira o pedido',clientId:'vercel-api-test-1'});assert.equal(response.status,201);
 const message=(await response.json()).message;assert.deepEqual(message.mentions,['Cythia']);assert.equal(typeof message.id,'number');
 assert.equal((await call('chat/read','POST',{channel:'general',id:message.id})).status,200);
 assert.equal((await call('chat','POST',{channel:'order:missing',body:'teste',clientId:'vercel-api-test-2'})).status,404);
 const summary=await (await call('chat')).json();assert.equal(summary.messages.length,1);assert.equal(summary.threads[0].lastId,message.id);
 assert.equal((await call('chat/session','DELETE')).status,200);
 assert.equal((await call('board')).status,401,'revoked cookie cannot read board');
 assert.equal((await call('chat')).status,401,'revoked cookie cannot read chat');
 assert.equal((await pg.query('SELECT COUNT(*) FROM chat_sessions')).rows[0].count,0);
 console.log('OK Vercel APIs: PIN login, origin checks, forged identity rejection, protected routes, revision conflict, PostgreSQL chat and logout. No real database or ERP used.');
}finally{await pg.close()}
