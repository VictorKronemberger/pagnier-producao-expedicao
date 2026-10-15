import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as deletion from "../lib/packing-delete.mjs";
import * as scope from "../lib/company-scope.mjs";
import {emptyShipment,newBox} from "../lib/shipping.mjs";
import {shipmentOwner} from "../lib/shipment-groups.mjs";
const {deleteDraftPacking,packingDeletionReason}=deletion;
const detail=()=>({responsavel:"",nota:"Preservar esta nota",situacao:"Programado",empresa:"Maya"});
const shipment=()=>({...emptyShipment(),caixas:[newBox([],"box1")]});
const board={sequence:["P1","P2"],invoices:{kept:{id:"kept",orderIds:["P1"]}},details:{P1:{...detail(),envio:{...shipment(),agrupamento:{pedidos:["P1","P2"],titularKey:"a".repeat(64),titularNome:"Titular",confirmadoEm:"2026-10-14T12:00:00.000Z"}}},P2:{...detail(),envio:shipment()},P3:{...detail(),envio:shipment()},HIDDEN:{...detail(),envio:shipment()}}};
const before=structuredClone(board),deleted=deleteDraftPacking(board,"P2");
assert.deepEqual(board,before);assert(deleted.details.P1.envio.packingExcluido);assert.deepEqual(deleted.details.P1.envio.caixas,board.details.P1.envio.caixas);assert.deepEqual(deleted.details.P2.envio,board.details.P2.envio);
assert.equal(deleted.details.P1.nota,board.details.P1.nota);assert.deepEqual(deleted.sequence,board.sequence);assert.deepEqual(deleted.invoices,board.invoices);
assert.deepEqual(deleted.details.P3,board.details.P3);assert.deepEqual(deleted.details.HIDDEN,board.details.HIDDEN);assert.equal(shipmentOwner(deleted,"P2"),"P1");
assert.throws(()=>deleteDraftPacking(deleted,"P1"),/disponível/);
for(const id of ["P1","P2"])for(const field of ["date","stage"]){const finalized=structuredClone(board);if(field==="date")finalized.details[id].envio.dataEnvio="2026-10-14";else finalized.details[id].situacao="Atendido totalmente e enviado";assert.match(packingDeletionReason(finalized,"P1"),/finalizado/);assert.throws(()=>deleteDraftPacking(finalized,"P2"),/finalizado/)}
const single={...board,details:{P3:board.details.P3}};assert(deleteDraftPacking(single,"P3").details.P3.envio.packingExcluido);
// Exercise the real DELETE route with isolated authentication and database adapters.
let stored=structuredClone(board),revision=4,authenticated=true,race=false,updates=0;
const db={prepare(sql){return {bind(...args){return {async first(){
 if(sql.startsWith("SELECT payload, revision"))return {payload:JSON.stringify(stored),revision};
 if(sql.startsWith("UPDATE production_board")){assert(sql.includes("AND revision=?"));if(race){revision++;race=false}if(args[4]!==revision)return null;stored=JSON.parse(args[0]);revision++;updates++;return {revision}}
 throw Error("Unexpected database request");
 }}}}}};
const imports={"../../../lib/stock-orders.mjs":await import("../lib/stock-orders.mjs"),"../../../lib/dispatch.mjs":await import("../lib/dispatch.mjs"),
 "../../../lib/invoice-delete.mjs":await import("../lib/invoice-delete.mjs"),
 "../../../lib/box-models.mjs":await import("../lib/box-models.mjs"),
 "../../../lib/packing-delete.mjs":deletion,
 "../../../lib/order-visibility.mjs":{visibleOrderState:s=>s},
 "../../../lib/invoice.mjs":{},"../../../lib/shipment-groups.mjs":{},
 "../../../lib/company-scope.mjs":scope,"cloudflare:workers":{env:{DB:db}},
 "../../chatgpt-auth":{getChatGPTUser:async()=>authenticated?{displayName:"Teste"}:null},
 "../../../lib/nomus-sync.mjs":{publicSync:s=>({snapshot:s.snapshot})},
 "../../../lib/nomus-store":{readNomus:async()=>({state:{hiddenOrderCodes:{HIDDEN:true},snapshot:{grupos:[{id:"P1"},{id:"P2"},{id:"P3"}]}}})},
 "../../../lib/shipping.mjs":{}
};
const context={exports:{},require:name=>{assert(name in imports,name);return imports[name]},Response,Request,TextEncoder,URL};
vm.runInNewContext(ts.transpileModule(readFileSync("app/api/board/route.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
const request=(body={owner:"P1",revision},origin="http://site.test")=>new Request("http://site.test/api/board",{method:"DELETE",headers:{origin,"Content-Type":"application/json"},body:JSON.stringify(body)});
const run=(...args)=>context.exports.DELETE(request(...args));
authenticated=false;assert.equal((await run()).status,401);authenticated=true;
assert.equal((await run(undefined,"http://other.test")).status,403);
assert.equal((await run({owner:"P1",revision:0})).status,400);
assert.equal((await run({owner:"P1",revision:3})).status,409);
assert.equal((await run({owner:"HIDDEN",revision})).status,400);
stored.details.P2.situacao="Atendido totalmente e enviado";assert.equal((await run()).status,400);stored=structuredClone(board);
race=true;assert.equal((await run()).status,409);assert.equal(updates,0);assert(stored.details.P1.envio);
const response=await run();assert.equal(response.status,200);const result=await response.json();assert.equal(updates,1);
assert(stored.details.P1.envio.packingExcluido);assert.deepEqual(stored.details.P1.envio.caixas,board.details.P1.envio.caixas);assert.deepEqual(stored.details.P2.envio,board.details.P2.envio);assert(stored.details.P3.envio);assert(stored.details.HIDDEN.envio);assert.equal(result.board.details.HIDDEN,undefined);assert.deepEqual(stored.invoices,board.invoices);
assert.equal((await run()).status,400);
console.log("OK exclusão: caixas e agrupamento preservados sem reaparecer cópias, pedidos e invoices preservados, finalizados protegidos, autenticação, origem, escopo, conflito de revisão e rota DELETE com banco isolado.");
