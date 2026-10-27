import {enableHistoryBatch} from "./history-mock-db.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
let stored={sequence:["P1"],details:{P1:{responsavel:"",nota:"",situacao:"Programado"}}},revision=4,authenticated=true;
const snapshot={grupos:[{id:"P1",ordens:[]}],pedidos:[]};
const db={prepare(sql){return {bind(...args){return {async first(){
 if(sql.startsWith("SELECT"))return {payload:JSON.stringify(stored),revision,updated_at:null,updated_by:null};
 if(sql.startsWith("UPDATE")){if(args[4]!==revision)return null;stored=JSON.parse(args[0]);revision++;return {revision}}
 throw Error("Unexpected SQL");
 }}}}}};
enableHistoryBatch(db);
const imports={"../../../lib/order-history-store.mjs":await import("../lib/order-history-store.mjs"),"../../../lib/order-archive.mjs":await import("../lib/order-archive.mjs"),"../../../lib/stock-orders.mjs":await import("../lib/stock-orders.mjs"),"../../../lib/dispatch.mjs":await import("../lib/dispatch.mjs"),"../../../lib/server-env":{env:{DB:db}},"../../employee-auth":{getPanelUser:async()=>authenticated?{displayName:"Teste"}:null},"../../../lib/order-visibility.mjs":{visibleOrderState:s=>s},"../../../lib/nomus-sync.mjs":{publicSync:s=>({snapshot:s.snapshot})},"../../../lib/nomus-store":{readNomus:async()=>({state:{snapshot,hiddenOrderCodes:{}}})}};
for(const name of ["order-release","invoice-delete","packing-delete","box-models","invoice","shipment-groups","company-scope","shipping"])imports["../../../lib/"+name+".mjs"]=await import("../lib/"+name+".mjs");
const context={exports:{},require:name=>{assert(name in imports,name);return imports[name]},Response,Request,TextEncoder,URL};
vm.runInNewContext(ts.transpileModule(readFileSync("app/api/board/route.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
const put=(board,rev=revision,origin="http://site.test")=>context.exports.PUT(new Request("http://site.test/api/board",{method:"PUT",headers:{origin},body:JSON.stringify({board,revision:rev})}));
const model={id:"m1",nome:"Caixa",comprimentoCm:"40",larguraCm:"30",alturaCm:"20",pesoMaximoKg:"10",taraKg:"0,2"};
authenticated=false;assert.equal((await put(stored)).status,401);authenticated=true;
assert.equal((await put(stored,revision,"http://other.test")).status,403);
assert.equal((await put({...stored,boxModels:[{...model,taraKg:""}]})).status,400);
assert.equal((await put({...stored,boxModels:[model]})).status,200);
assert.deepEqual(stored.boxModels,[model]);
const result=await(await context.exports.GET()).json();assert.deepEqual(result.board.boxModels,[model]);
const oldClient=structuredClone(stored);delete oldClient.boxModels;assert.equal((await put(oldClient)).status,200);assert.deepEqual(stored.boxModels,[model]);
assert.equal((await put({...stored,boxModels:[]},revision-1)).status,409);assert.equal(stored.boxModels.length,1);
assert.equal((await put({...stored,boxModels:[]})).status,200);assert.equal(stored.boxModels.length,0);
console.log("OK API modelos: autenticação, origem, validação, PUT/GET persistentes, cliente antigo preservado, revisão concorrente e remoção explícita.");
