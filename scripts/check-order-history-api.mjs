import assert from "node:assert/strict";
import fs from "node:fs";import path from "node:path";import vm from "node:vm";import {pathToFileURL} from "node:url";import ts from "typescript";
import {PGlite} from "@electric-sql/pglite";
import {createClient} from "@libsql/client";
import {createPostgresDatabase} from "../lib/postgres-adapter.mjs";
import {createTursoDatabase} from "../lib/turso-adapter.mjs";
import {saveBoardWithHistory,readOrderHistory} from "../lib/order-history-store.mjs";
import {scopeBoard} from "../lib/company-scope.mjs";
import {emptyInvoice} from "../lib/invoice.mjs";
for(const provider of ["postgres","turso"]){
 const pg=provider==="postgres"?new PGlite():null,client=pg?null:createClient({url:":memory:"});
 const sql=pg?{query:(text,values)=>({text,values,then:(yes,no)=>pg.query(text,values).then(yes,no)}),transaction:queries=>pg.transaction(async tx=>{const result=[];for(const q of queries)result.push(await tx.query(q.text,q.values));return result})}:null;
 const db=pg?createPostgresDatabase(sql):createTursoDatabase(client);
 await db.prepare("CREATE TABLE production_board (id TEXT PRIMARY KEY,payload TEXT NOT NULL,revision INTEGER NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL)").run();
 const cache=new Map(),testEnv={DB:db};let actor="Funcionário teste",hidden={};
 const orders=["A","B"].map(id=>({id,codigo:id,cliente:"Cliente fictício "+id,liberacao:"released",vinculo:"linked",ordens:[{id:"op-"+id,nome:"OP teste "+id,produto:"Produto teste",unidade:"UNID",quantidade:"10"}]}));
 const snapshot={grupos:orders,pedidos:orders,semVinculo:[]};
 cache.set(path.resolve("lib/server-env.ts"),{env:testEnv});
 cache.set(path.resolve("app/employee-auth.ts"),{getPanelUser:async()=>actor?{displayName:actor}:null});
 cache.set(path.resolve("lib/nomus-store.ts"),{readNomus:async()=>({state:{snapshot,hiddenOrderCodes:hidden}})});
 cache.set(path.resolve("lib/order-visibility.mjs"),{visibleOrderState:s=>s});
 cache.set(path.resolve("lib/nomus-sync.mjs"),{publicSync:s=>({snapshot:s.snapshot})});
 async function load(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file);if(file.endsWith(".mjs"))return import(pathToFileURL(file).href);
 const source=ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,imports={};
 for(const [,name] of source.matchAll(/require\("([^"\n]+)"\)/g)){let dependency=path.resolve(path.dirname(file),name);if(!/\.(ts|mjs)$/.test(dependency))dependency+=".ts";imports[name]=await load(dependency)}
 const exports={};vm.runInNewContext(source,{exports,require:n=>imports[n],Response,Request,Headers,URL,TextEncoder,Date,console},{filename:file});cache.set(file,exports);return exports;
 }
 const boardAPI=await load("app/api/board/route.ts"),historyAPI=await load("app/api/order-history/route.ts");
 const request=(method,body,query="")=>new Request("https://panel.test/api/board"+query,{method,headers:{origin:"https://panel.test"},...(body?{body:JSON.stringify(body)}:{})});
 const history=async(id="A",before)=>{const response=await historyAPI.GET(new Request("https://panel.test/api/order-history?"+new URLSearchParams({orderId:id,...(before?{before:String(before)}:{})})));return {status:response.status,...await response.json()}};
 const current=async()=> (await boardAPI.GET(request("GET"))).json();
 let board={sequence:["A","B"],details:Object.fromEntries(orders.map(o=>[o.id,{responsavel:"",nota:"",situacao:"Programado"}]))};
 let response=await boardAPI.PUT(request("PUT",{revision:0,board,actor:"Impostor",history:[{actor:"Impostor"}]}));assert.equal(response.status,200,JSON.stringify(await response.json()));
 let h=await history();assert.equal(h.entries.length,1);assert.equal(h.entries[0].actor,actor);assert.equal(h.nextCursor,null);
 let saved=await current();assert(!("_historyCommit" in saved.board),"internal marker is never returned to clients");
 const initial=h.entries[0].id;
 response=await boardAPI.PUT(request("PUT",{revision:1,board:saved.board}));assert.equal(response.status,200);assert.equal((await history()).entries.length,1,"no-op save does not invent events");
 response=await boardAPI.PUT(request("PUT",{revision:1,board}));assert.equal(response.status,409);assert.equal((await history()).entries.length,1);
 for(let n=0;n<23;n++){saved=await current();saved.board.details.A.nota="Observação fictícia "+n;response=await boardAPI.PUT(request("PUT",{revision:saved.revision,board:saved.board}));assert.equal(response.status,200,JSON.stringify(await response.json()))}
 h=await history();assert.equal(h.entries.length,20);assert(h.nextCursor);const older=await history("A",h.nextCursor);assert.equal(older.entries.length,4);assert.equal(older.entries.at(-1).id,initial);assert.equal(older.nextCursor,null);
 const field=h.entries[0].changes.find(c=>c.field==="Orientações do supervisor");assert.equal(field.before,"Observação fictícia 21");assert.equal(field.after,"Observação fictícia 22");
 saved=await current();const inv={...emptyInvoice("test"),orderIds:["A"],number:"DEMO"};saved.board.invoices={test:inv};
 response=await boardAPI.PUT(request("PUT",{revision:saved.revision,board:saved.board}));assert.equal(response.status,200);
 saved=await current();response=await boardAPI.DELETE(request("DELETE",{kind:"invoice",invoiceId:"test",revision:saved.revision}));assert.equal(response.status,200);
 assert((await history()).entries[0].changes.some(c=>c.field.includes("Invoice")&&c.after==="Excluída"));
 saved=await current();response=await boardAPI.POST(request("POST",{action:"archive",orderId:"A",archived:true,reason:"manual",revision:saved.revision}));assert.equal(response.status,200,JSON.stringify(await response.json()));
 assert((await history()).entries[0].changes.some(c=>c.field==="Arquivado"&&c.after==="Sim"));
 // Failure in any audit statement rolls back the board CAS and all event rows.
 saved=await current();const revision=saved.revision,previousCount=(await history()).entries[0].id;
 testEnv.DB={...db,batch:statements=>db.batch([...statements,db.prepare("INSERT INTO absent_history_failure VALUES (?)").bind("fail")])};
 saved.board.details.A.nota="Não pode persistir";
 response=await boardAPI.PUT(request("PUT",{revision,board:saved.board}));assert.equal(response.status,503);testEnv.DB=db;
 assert.equal((await current()).revision,revision);assert.equal((await history()).entries[0].id,previousCount);
 // Same actor/timestamp/revision race: only the winning exact commit gets events.
 const raw=await db.prepare("SELECT payload FROM production_board WHERE id=?").bind("main").first(),before=JSON.parse(raw.payload);
 const winner=structuredClone(before),loser=structuredClone(before);winner.details.A.nota="Primeiro";loser.details.A.nota="Segundo";loser.details.B.nota="Não registrar";
 assert(await saveBoardWithHistory(db,before,winner,revision,actor,"2026-10-27T15:00:00.000Z"));
 assert.equal(await saveBoardWithHistory(db,before,loser,revision,actor,"2026-10-27T15:00:00.000Z"),null);
 assert.equal((await history("B")).entries.length,1);assert.equal((await history()).entries[0].changes[0].after,"Primeiro");
 actor=null;assert.equal((await history()).status,401);actor="Funcionário teste";
 hidden={A:true};assert.equal((await history()).status,404);hidden={};assert.equal((await history("missing")).status,404);
 for(const cursor of ["0","-1","x","9007199254740992"])assert.equal((await historyAPI.GET(new Request("https://panel.test/api/order-history?orderId=A&before="+cursor))).status,400);
 // A shared event cannot reveal another order that has since left the permitted scope.
 saved=await current();const shared=structuredClone(saved.board);shared.details.A.envio={referencia:"Compartilhado",agrupamento:{pedidos:["A","B"]}};
 await saveBoardWithHistory(db,saved.board,shared,saved.revision,actor,"2026-10-27T15:01:00.000Z");
 assert((await readOrderHistory(db,"A")).entries[0].changes.some(c=>c.after==="Compartilhado"));
 assert(!(await readOrderHistory(db,"A",undefined,{B:true})).entries.some(e=>e.changes.some(c=>c.after==="Compartilhado")));
 await pg?.close();client?.close();
 console.log("OK "+provider+": API actor, before/after, pagination, auth/scope, no-op, delete, archive, atomic rollback and CAS race.");
}
