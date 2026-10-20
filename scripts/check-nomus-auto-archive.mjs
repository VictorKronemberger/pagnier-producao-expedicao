import assert from "node:assert/strict";
import {initialSync,syncStep,publicSync} from "../lib/nomus-sync.mjs";
import {archiveMissingOrders,changeArchive} from "../lib/order-archive.mjs";
import {orderAbsenceCandidate,orderIdentity} from "../lib/nomus-order-presence.mjs";
const code="PD 900001",group={id:code,codigo:code,cliente:"Cliente teste",ordens:[{id:"OP1",nome:"OP1"}]};
const present={id:22,codigoPedido:"PD 900002",idEmpresa:1,idPessoaCliente:2,dataCriacao:"01/10/2026",itensPedido:[{idProduto:3,quantidade:1,status:4}]};
const original=()=>({...initialSync({grupos:[group],semVinculo:[]}),ordersComplete:true,opsComplete:true,orders:{11:{code,companyId:1,clientId:2,createdDate:"2026-10-01",checkedAt:"2026-10-19T12:00:00Z",items:[{productId:3,quantity:"1",status:2}]}},clients:{2:"Cliente teste"},products:{3:{name:"Produto teste",unit:"UNID"}}});
const board={sequence:[code],details:{[code]:{responsavel:"Victor",nota:"Não perder",situacao:"Em acompanhamento",envio:{caixas:[{id:"box"}],agrupamento:{pedidos:[code,"PD 900002"]}}}},invoices:{inv:{orderIds:[code]}}};
let tick=Date.parse("2026-10-20T12:00:00Z");
async function step(state,result,{turn=0,path="pedidos?pagina=1",status=200,now}={}){
 tick+=120000;
 let requested,method;
 const next=await syncStep({...state,nextAt:0,turn},"test",{now:now??new Date(tick).toISOString(),fetcher:async(url,options)=>{requested=url;method=options.method;return status===200?Response.json(result):new Response("",{status})}});
 assert(requested?.endsWith(path),requested);assert.equal(method,"GET");return next;
}
assert.equal(orderIdentity("PD900001"),orderIdentity("pd 0900001"));assert.notEqual(orderIdentity("OP900001"),orderIdentity(code));
let first=await step(original(),[present]);assert.equal(first.orderAbsences[11].scans,1);assert.equal(orderAbsenceCandidate(first,new Date(tick).toISOString()),undefined);assert.equal(archiveMissingOrders(board,first,new Date(tick).toISOString()),board);
let missing=await step(first,[present]);assert.equal(missing.orderAbsences[11].scans,2);assert.equal(orderAbsenceCandidate(missing,new Date(tick).toISOString()),"11");
for(const status of [400,404,410]){
 const one=await step(missing,null,{turn:4,path:"pedidos/11",status});assert.equal(one.orderAbsences[11].detailMisses,1);assert(!one.orderAbsences[11].confirmedAt);
 const two=await step(one,null,{turn:4,path:"pedidos/11",status});assert(two.orderAbsences[11].confirmedAt);
 const automatic=archiveMissingOrders(board,two,new Date(tick).toISOString());const detail=automatic.details[code];
 assert(detail.arquivado);assert(detail.arquivo.automatico);assert.equal(detail.arquivo.nomusId,11);assert.equal(detail.arquivo.motivo,"nomus_missing");assert.equal(detail.arquivo.verificacao.status,status);
 assert.deepEqual(detail.envio,board.details[code].envio);assert.equal(detail.nota,"Não perder");assert.deepEqual(automatic.sequence,board.sequence);assert.deepEqual(automatic.invoices,board.invoices);
 assert.equal(archiveMissingOrders(automatic,two,new Date(tick+1).toISOString()),automatic,"idempotent replay");
 const restored=changeArchive(automatic,group,{archived:false},"Victor",new Date(tick+1).toISOString());assert.equal(archiveMissingOrders(restored,two,new Date(tick+2).toISOString()),restored,"respect explicit restore for same episode");
 const alias={...board,sequence:["PD900001"],details:{PD900001:board.details[code]}};assert(archiveMissingOrders(alias,two,new Date(tick).toISOString()).details.PD900001.arquivado);
 const duplicate={...two,orders:{...two.orders,33:{...two.orders[11],code:"PD900001"}}};assert.equal(archiveMissingOrders(board,duplicate,new Date(tick).toISOString()),board,"ambiguous identity cannot archive");
 const pub=publicSync(two,true).snapshot.pedidos.find(o=>o.id===code);assert.equal(pub.nomusId,11);assert(pub.pedidoAusenteDesde);assert(!pub.pedidoConsultaFalhou);
}
for(const status of [401,403,429,500,503]){
 let state=await step(missing,null,{turn:4,path:"pedidos/11",status:400});
 state=await step(state,null,{turn:4,path:"pedidos/11",status});assert.equal(state.orderAbsences[11].detailMisses,0);
 state=await step(state,null,{turn:4,path:"pedidos/11",status:400});assert(!state.orderAbsences[11].confirmedAt);assert.equal(archiveMissingOrders(board,state,new Date(tick).toISOString()),board);
}
// Successful data (including fulfilled/cancelled orders) cancels suspicion.
for(const status of [4,6]){
 const back={...present,id:11,codigoPedido:code,itensPedido:[{idProduto:3,quantidade:1,status}]};
 const state=await step(missing,back,{turn:4,path:"pedidos/11"});assert(!state.orderAbsences[11]);assert(!state.orderReviewFailures[11]);
}
const wrong=await step(missing,{...present,id:999},{turn:4,path:"pedidos/11"});assert(!wrong.orderAbsences[11].confirmedAt);assert.equal(wrong.orderAbsences[11].detailMisses,0);
// Partial, interrupted, malformed and duplicate-page listings never count as absence.
const fifty=Array.from({length:50},(_,i)=>({...present,id:100+i,codigoPedido:"PD "+(100+i)}));
const partial=await step(original(),fifty);assert.equal(partial.orderAbsences,undefined);
const interrupted=await step(partial,null,{path:"pedidos?pagina=2",status:503});assert.equal(interrupted.orderScan,undefined);assert.equal(interrupted.pages.orders,1);
const duplicate=await step(partial,[fifty[0]],{path:"pedidos?pagina=2"});assert.equal(duplicate.orderAbsences,undefined);
const malformed=await step(partial,[{}],{path:"pedidos?pagina=2"});assert.equal(malformed.orderAbsences,undefined);assert.equal(malformed.orderScan,undefined);
const resumed=await step({...original(),pages:{...original().pages,orders:2}},[],{path:"pedidos?pagina=2"});assert.equal(resumed.orderAbsences,undefined);
const malformedDetail=await step(missing,[],{turn:4,path:"pedidos/11"});assert(!malformedDetail.orderAbsences[11].confirmedAt);
// New ID with the same PD code in the live list prevents an absence inference.
const reused=await step(original(),[{...present,codigoPedido:code}]);assert(!reused.orderAbsences[11]);
assert.throws(()=>changeArchive(board,group,{archived:true,reason:"nomus_missing"},"User",new Date(tick).toISOString()),/Revise/);
console.log("OK automatic archives: repeated complete scans plus two detail failures; 400/404/410; outage, malformed/partial/duplicate lists and cancelled orders excluded; identity, history, idempotence and intentional restore.");
