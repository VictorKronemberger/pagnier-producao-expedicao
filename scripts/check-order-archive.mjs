import assert from "node:assert/strict";
import {archiveOrders,archiveReasonKey,archiveEvents,changeArchive} from "../lib/order-archive.mjs";
import {receiveOrders} from "../lib/intake.mjs";
import {syncStep,initialSync,publicSync} from "../lib/nomus-sync.mjs";
const order={id:"PD TEST",codigo:"PD TEST",cliente:"Cliente teste",ordens:[{id:"OP1"}],liberacao:"released"};
const board={sequence:[order.id],details:{[order.id]:{responsavel:"Victor",nota:"Preservar nota",situacao:"Em acompanhamento",envio:{caixas:[{id:"box",itens:[]}],packing:{invoiceNumero:"PL-1"}}}},invoices:{invoice:{id:"invoice",orderIds:[order.id]}}};
assert.throws(()=>changeArchive(board,order,{archived:true,reason:"nomus_deleted"},"Victor","2026-10-20T12:00:00Z"),/Confirme/);
for(const reason of ["unknown",["manual"],{},null])assert.throws(()=>changeArchive(board,order,{archived:true,reason},"Victor","now"),/Revise/);
const archived=changeArchive(board,order,{archived:true,reason:"nomus_deleted",confirmedDeleted:true,note:"Conferido no ERP"},"Victor","2026-10-20T12:00:00Z");
assert.equal(archived.details[order.id].arquivo.por,"Victor");assert.equal(archived.details[order.id].arquivo.motivo,"nomus_deleted");assert.deepEqual(archived.sequence,board.sequence);assert.deepEqual(archived.invoices,board.invoices);assert.deepEqual(archived.details[order.id].envio,board.details[order.id].envio);assert.deepEqual(receiveOrders(archived,[order]),archived);
assert.equal(archiveOrders({grupos:[order]},archived).length,1);assert.equal(archiveOrders({grupos:[]},archived)[0].cliente,"Cliente teste","missing ERP record still has an archive entry");
const restored=changeArchive(archived,order,{archived:false},"Romulo","2026-10-20T13:00:00Z");assert(!restored.details[order.id].arquivado);assert.equal(restored.details[order.id].situacao,board.details[order.id].situacao);assert.equal(restored.details[order.id].nota,"Preservar nota");assert.equal(restored.details[order.id].arquivo.restauradoPor,"Romulo");assert.equal(archiveOrders({grupos:[order]},restored).length,0);
const seed=()=>({...initialSync({grupos:[order],semVinculo:[]}),ordersComplete:true,orders:{1:{code:order.id,companyId:1,clientId:2,createdDate:"2026-10-01",checkedAt:"2026-10-19T12:00:00Z",items:[{productId:3,quantity:"1",status:2}]}},clients:{2:"Cliente teste"},products:{3:{name:"Teste",unit:"UNID"}}});
for(const status of [400,404,410,401,403,429,503]){const state=await syncStep(seed(),"test",{now:"2026-10-20T12:00:00Z",requestedOrder:order.id,refreshOrder:true,fetcher:async()=>new Response("",{status})});assert(state.orders[1]);assert.equal(publicSync(state,true).snapshot.pedidos[0].pedidoConsultaFalhou,true);assert.equal(state.orders[1].deleted,undefined,"HTTP error is not deletion proof")}
let state=await syncStep(seed(),"test",{now:"2026-10-20T12:00:00Z",fetcher:async()=>Response.json([])});assert.equal(state.orderReviewFailures?.[1],undefined,"a missing list entry does not schedule deletion checks");assert(state.orders[1]);
const present={id:1,codigoPedido:order.id,idEmpresa:1,idPessoaCliente:2,dataCriacao:"01/10/2026",itensPedido:[{idProduto:3,quantidade:1,status:2}]};state=await syncStep({...state,nextAt:0},"test",{now:"2026-10-20T13:00:00Z",requestedOrder:order.id,refreshOrder:true,fetcher:async()=>Response.json(present)});assert.equal(publicSync(state,true).snapshot.pedidos[0].pedidoConsultaFalhou,false);
const partial=await syncStep(seed(),"test",{now:"2026-10-20T12:00:00Z",fetcher:async()=>Response.json(Array.from({length:50},(_,i)=>({...present,id:i+2,codigoPedido:"TEST"+i})))});assert.equal(partial.orderReviewFailures?.[1],undefined,"partial listing cannot infer absence");
for(const reason of ["manual","cancelled","duplicate","other"]){
 const changed=changeArchive(board,order,{archived:true,reason,note:"Motivo informado"},"Romulo","2026-10-20T14:00:00Z");
 assert.equal(changed.details[order.id].arquivo.motivo,reason);assert.equal(changed.details[order.id].arquivo.por,"Romulo");assert.deepEqual(changed.details[order.id].envio,board.details[order.id].envio);
}
assert.throws(()=>changeArchive(board,order,{archived:true,reason:"other",note:"  "},"Victor","now"),/Descreva/);
assert.throws(()=>changeArchive(board,order,{archived:true,reason:"nomus_missing"},"Victor","now"),/Revise/);
// Persisted absence evidence must neither trigger extra detail reads nor show a pending deletion check.
const legacy=seed();legacy.ordersComplete=true;legacy.turn=4;legacy.clients={2:"Cliente teste"};legacy.products={3:{name:"Teste",unit:"UNID"}};
legacy.orderReviewFailures={1:{reason:"missing_from_list"}};legacy.orderAbsences={1:{code:order.id,scans:2,detailMisses:2,confirmedAt:"2026-10-20T11:00:00Z"}};
legacy.orderScan={nextPage:2,seen:{}};legacy.orderSweepNextAt=0;
assert.equal(publicSync(legacy,true).snapshot.pedidos[0].pedidoConsultaFalhou,false);
const paths=[];const cleaned=await syncStep(legacy,"test",{now:"2026-10-20T14:00:00Z",fetcher:async url=>{paths.push(url);return Response.json([])}});
assert.equal(paths.length,1);assert(paths[0].includes("/ordens?"),"absence must not prioritize a detail request");assert.equal(cleaned.orderAbsences,undefined);assert.equal(cleaned.orderScan,undefined);assert.equal(publicSync(cleaned,true).pedidoVarredura,undefined);
console.log("OK archive: explicit deletion confirmation, durable history, restore, no automatic requeue; ERP errors/partial lists never delete records; no deletion inference from complete lists, recovery and explicit manual reasons.");

const repeated=changeArchive(restored,order,{archived:true,reason:"duplicate",note:"Segundo motivo"},"Cyntia","2026-10-20T14:00:00Z");
const events=repeated.details[order.id].arquivo.historico;
assert.deepEqual(events.map(e=>e.acao),["arquivar","restaurar","arquivar"]);
assert.deepEqual(events.map(e=>e.por),["Victor","Romulo","Cyntia"]);
assert.equal(events[0].observacao,"Conferido no ERP");assert.equal(events[2].motivo,"duplicate");
assert.equal(restored.details[order.id].arquivo.historico.length,2,"events cannot mutate previous snapshots");
const oldRecord={motivo:"manual",em:"2026-10-01T12:00:00Z",por:"Victor",restauradoEm:"2026-10-02T12:00:00Z",restauradoPor:"Romulo"};
assert.deepEqual(archiveEvents(oldRecord).map(e=>e.acao),["arquivar","restaurar"]);
const migrated=changeArchive({...board,details:{[order.id]:{...board.details[order.id],arquivo:oldRecord}}},order,{archived:true},"Cyntia","2026-10-20T15:00:00Z");
assert.equal(migrated.details[order.id].arquivo.historico.length,3);
assert.equal(archiveReasonKey(undefined),"unknown");assert.equal(archiveReasonKey({motivo:"invalid"}),"unknown");assert.equal(archiveReasonKey({motivo:"manual"}),"manual");
assert.equal(archiveEvents(undefined,true)[0].motivo,undefined,"legacy reason must stay unknown");
assert.equal(archiveOrders({grupos:[]},archived)[0].restauravel,false);
assert.equal(archiveOrders({grupos:[order]},archived)[0].restauravel,true);
console.log("OK archive corrections: append-only decisions, legacy migration, unknown reason and restoration availability.");
