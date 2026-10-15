import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as deletion from "../lib/invoice-delete.mjs";
import * as invoice from "../lib/invoice.mjs";
import * as scope from "../lib/company-scope.mjs";
import {emptyShipment} from "../lib/shipping.mjs";
const {invoiceDeletionReason,deleteDraftInvoice,assertNoInvoiceRemoval}=deletion;
const detail=()=>({responsavel:"",nota:"Preservar",situacao:"A programar",envio:emptyShipment()});
const fedex={...invoice.emptyInvoice("fedex"),orderIds:["P1"],exportDate:"2026-10-14",date:"2026-10-14"};
const dhl={...invoice.emptyInvoice("dhl","DHL"),orderIds:["P2"]};
const base={sequence:["P1","P2"],details:{P1:detail(),P2:detail()},invoices:{fedex,dhl,blank:invoice.emptyInvoice("blank"),catalog:{...invoice.emptyInvoice("catalog"),orderIds:["CAT"]},hidden:{...invoice.emptyInvoice("hidden"),orderIds:["HIDDEN"]}}};
const before=structuredClone(base);for(const id of ["fedex","dhl","blank","catalog"]){assert.equal(invoiceDeletionReason(base,id),"");const next=deleteDraftInvoice(base,id);assert(!next.invoices[id]);assert.deepEqual(next.details,base.details);assert.deepEqual(next.sequence,base.sequence);assert.equal(Object.keys(next.invoices).length,4)}assert.deepEqual(base,before);
assert.throws(()=>deleteDraftInvoice(base,"missing"),/disponível/);assert.throws(()=>deleteDraftInvoice(base,"constructor"),/disponível/);
for(const id of ["fedex","dhl"])for(const mode of ["invoice-date","shipment-date","sent","group-date","group-sent"]){
 const b=structuredClone(base),order=b.invoices[id].orderIds[0];
 if(mode==="invoice-date")b.invoices[id].dataEnvio="2026-10-14";
 if(mode==="shipment-date")b.details[order].envio.dataEnvio="2026-10-14";
 if(mode==="sent")b.details[order].situacao="Atendido totalmente e enviado";
 if(mode.startsWith("group")){b.details.OWNER={...detail(),envio:{...emptyShipment(),agrupamento:{pedidos:["OWNER",order]}}};if(mode==="group-date")b.details.OWNER.envio.dataEnvio="2026-10-14";else b.details.OWNER.situacao="Atendido totalmente e enviado"}
 assert.match(invoiceDeletionReason(b,id),/finalizada/);assert.throws(()=>deleteDraftInvoice(b,id),/finalizada/);
}
assert.throws(()=>assertNoInvoiceRemoval(base.invoices,{}),/Excluir/);assert.doesNotThrow(()=>assertNoInvoiceRemoval(base.invoices,base.invoices));
assert.equal(invoice.normalizeInvoices({dhl:{...dhl,dataEnvio:"2026-10-14"}},["P2"]).dhl.dataEnvio,"2026-10-14");assert.throws(()=>invoice.normalizeInvoices({dhl:{...dhl,dataEnvio:"2026-02-30"}},["P2"]));
let stored=structuredClone(base),revision=4,authenticated=true,race=false,updates=0;
const db={prepare(sql){return {bind(...args){return {async first(){
 if(sql.startsWith("SELECT payload"))return {payload:JSON.stringify(stored),revision};
 if(sql.startsWith("UPDATE production_board")){assert(sql.includes("AND revision=?"));if(race){revision++;race=false}if(args[4]!==revision)return null;stored=JSON.parse(args[0]);revision++;updates++;return {revision}}
 throw Error("Unexpected database request");
 }}}}}};
const imports={"../../../lib/order-release.mjs":await import("../lib/order-release.mjs"),"../../../lib/stock-orders.mjs":await import("../lib/stock-orders.mjs"),"../../../lib/dispatch.mjs":await import("../lib/dispatch.mjs"),
 "../../../lib/invoice-delete.mjs":deletion,"../../../lib/box-models.mjs":await import("../lib/box-models.mjs"),"../../../lib/packing-delete.mjs":await import("../lib/packing-delete.mjs"),"../../../lib/order-visibility.mjs":{visibleOrderState:s=>s},"../../../lib/invoice.mjs":invoice,"../../../lib/shipment-groups.mjs":await import("../lib/shipment-groups.mjs"),"../../../lib/company-scope.mjs":scope,"cloudflare:workers":{env:{DB:db}},"../../chatgpt-auth":{getChatGPTUser:async()=>authenticated?{displayName:"Teste"}:null},"../../../lib/nomus-sync.mjs":{publicSync:s=>({snapshot:s.snapshot})},"../../../lib/nomus-store":{readNomus:async()=>({state:{hiddenOrderCodes:{HIDDEN:true},snapshot:{grupos:[{id:"P1",ordens:[]},{id:"P2",ordens:[]}],pedidos:[{id:"CAT",ordens:[]}]}}})},"../../../lib/shipping.mjs":await import("../lib/shipping.mjs")};
const context={Error,exports:{},require:name=>{assert(name in imports,name);return imports[name]},Response,Request,TextEncoder,URL};vm.runInNewContext(ts.transpileModule(readFileSync("app/api/board/route.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
const run=(id="fedex",rev=revision,origin="http://site.test")=>context.exports.DELETE(new Request("http://site.test/api/board",{method:"DELETE",headers:{origin,"Content-Type":"application/json"},body:JSON.stringify({kind:"invoice",invoiceId:id,revision:rev})}));
authenticated=false;assert.equal((await run()).status,401);authenticated=true;assert.equal((await run("fedex",revision,"http://other.test")).status,403);assert.equal((await run("fedex",0)).status,400);assert.equal((await run("fedex",3)).status,409);assert.equal((await run("hidden")).status,400);assert.equal((await run("missing")).status,400);
for(const kind of ["invoice","shipment","sent"]){stored=structuredClone(base);if(kind==="invoice")stored.invoices.fedex.dataEnvio="2026-10-14";if(kind==="shipment")stored.details.P1.envio.dataEnvio="2026-10-14";if(kind==="sent")stored.details.P1.situacao="Atendido totalmente e enviado";assert.equal((await run()).status,400)}
stored=structuredClone(base);race=true;assert.equal((await run()).status,409);assert.equal(updates,0);assert(stored.invoices.fedex);
// A full-board autosave cannot bypass the deletion endpoint by omitting invoices.
const put=await context.exports.PUT(new Request("http://site.test/api/board",{method:"PUT",headers:{origin:"http://site.test","Content-Type":"application/json"},body:JSON.stringify({revision,board:{...base,invoices:{}}})}));assert.equal(put.status,400);assert.match((await put.json()).error,/Excluir/);assert.equal(updates,0);
for(const id of ["fedex","dhl","blank","catalog"]){const response=await run(id);assert.equal(response.status,200);const result=await response.json();assert(!result.board.invoices[id]);assert(!result.board.invoices.hidden);assert(stored.invoices.hidden);assert.deepEqual(stored.details,base.details);assert.deepEqual(stored.sequence,base.sequence)}
assert.equal(updates,4);assert.equal((await run("fedex")).status,400);
console.log("OK invoices: FedEx/DHL, data real de envio, Enviados, agrupamento, rascunho sem pedido, catálogo sem OP, escopo, confirmação de revisão, concorrência e bloqueio de exclusão por autosave. Rota real com banco isolado.");
