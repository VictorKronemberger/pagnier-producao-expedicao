import assert from "node:assert/strict";
import {restoreReleaseItems,pendingFulfillmentItems,releaseState,awaitsRelease,pendingReleaseItems,assertReleaseTransitions} from "../lib/order-release.mjs";
import {receiveOrders} from "../lib/intake.mjs";
import {initialSync,syncStep,publicSync} from "../lib/nomus-sync.mjs";
for(const [statuses,expected] of [[[1],"waiting"],[[2],"released"],[[3],"released"],[[1,2],"partial"],[[1,3],"partial"],[[4,5,6,7,8],"closed"],[[],"unknown"],[[undefined],"unknown"]])assert.equal(releaseState(statuses.map(status=>({status}))),expected);
const group=(id,liberacao,op=true)=>({id,codigo:id,liberacao,ordens:op?[{id:"OP"+id}]:[],vinculo:op?"linked":"none"});
const waiting=group("waiting","waiting"),partial=group("partial","partial"),released=group("released","released"),noOP=group("noOP","released",false),started=group("started","waiting");
const previous={sequence:["waiting","started"],details:{waiting:{situacao:"Programado",nota:"Manter orientação",envio:{caixas:[{id:"b"}]}},started:{situacao:"Em acompanhamento",nota:"Preservar"}}};
const groups=[waiting,partial,released,noOP,started,group("unknown","unknown")];
const next=receiveOrders(previous,groups);
assert.deepEqual(next.sequence,["started","partial","released"]);
assert.equal(next.details.waiting.nota,"Manter orientação");assert.deepEqual(next.details.waiting.envio,previous.details.waiting.envio);assert.equal(next.details.started.situacao,"Em acompanhamento");assert.equal(receiveOrders(next,groups),next);
assert(awaitsRelease(waiting));assert(!awaitsRelease(partial));assert(awaitsRelease(group("p","partial",false)));assert(!awaitsRelease(started,previous.details.started));
for(const situacao of ["Concluído","Pronto para envio e documentação","Pronto para envio","Atendido totalmente e enviado"]){const board={sequence:[started.id],details:{[started.id]:{situacao,nota:"Manter"}}};assert.equal(receiveOrders(board,[started]),board)}
assert.deepEqual(pendingReleaseItems({itens:[{status:1,item:"00020",produto:"Pendente"},{status:2,produto:"Liberado"}]}).map(i=>i.item),["00020"]);
assert.throws(()=>assertReleaseTransitions({sequence:[],details:{}},{sequence:[waiting.id],details:{waiting:{situacao:"Programado"}}},[waiting]),/liberação/);
assert.throws(()=>assertReleaseTransitions(previous,{...previous,details:{...previous.details,waiting:{situacao:"Em acompanhamento"}}},[waiting]),/liberação/);
assert.doesNotThrow(()=>assertReleaseTransitions(previous,next,groups));
assert.doesNotThrow(()=>assertReleaseTransitions({sequence:[],details:{}},{sequence:[partial.id],details:{partial:{situacao:"Programado"}}},[partial]));
let state=initialSync({grupos:[],semVinculo:[]});let status=1;const methods=[];
const order=()=>({id:1,idEmpresa:1,codigoPedido:"PD QA",idPessoaCliente:2,dataCriacao:"15/10/2026",itensPedido:[{idProduto:3,quantidade:4,status,item:"00010"}]});
const fetcher=async(url,options)=>{methods.push(options.method);return Response.json(url.includes("/ordens?")?[{nome:"OP QA",dataHoraCriacao:"15/10/2026 00:00:00",descricaoProduto:"Produto QA",qtde:"4",unidadeMedida:"UNID",itensPedido:[{idPedido:1,nomeCliente:"Cliente QA"}]}]:url.includes("/pedidos/")?order():[order()])};
state=await syncStep(state,"dummy",{fetcher});state=await syncStep({...state,nextAt:0,turn:1},"dummy",{fetcher});
let view=publicSync(state,true);assert.equal(view.snapshot.grupos[0].liberacao,"waiting");assert.equal(view.snapshot.pedidos[0].itens[0].status,1);assert.equal(view.snapshot.pedidos[0].itens[0].item,"00010");assert.equal(receiveOrders({sequence:[],details:{}},view.snapshot.grupos).sequence.length,0);
status=2;state=await syncStep({...state,nextAt:0,turn:0},"dummy",{fetcher});view=publicSync(state,true);assert.equal(receiveOrders({sequence:[],details:{}},view.snapshot.grupos).sequence[0],"PD QA");
delete state.orders[1].items[0].status;assert.equal(publicSync(state,true).snapshot.pedidos[0].liberacao,"released");
delete state.orders[1].listFacts;delete state.orders[1].detailFacts;assert.equal(publicSync(state,true).snapshot.pedidos[0].liberacao,"unknown");
let detailPath;state=await syncStep({...state,nextAt:0,turn:4},"dummy",{fetcher:async(url,opts)=>{detailPath=url;return fetcher(url,opts)}});assert(detailPath.endsWith("pedidos/1"));assert.equal(publicSync(state,true).snapshot.grupos[0].liberacao,"released");assert(methods.every(m=>m==="GET"));
console.log("OK liberação: estados por item, fila parcial, pendentes, dados preservados, guardas do servidor, atualização e migração de consultas antigas; somente GET no Nomus.");

assert.equal(releaseState([{status:4},{status:1}]),"partial");
assert.deepEqual(pendingFulfillmentItems({itens:[{item:"1",status:4},{item:"2",status:2},{item:"3",status:3},{item:"4",status:1}]}).map(i=>i.item),["2","3","4"]);
assert.deepEqual(pendingFulfillmentItems({itens:[{status:4},{status:5}]}),[]);
const legacy={items:[{productId:1,quantity:"4"},{productId:2,quantity:"2"}],listFacts:{"a:produto":{value:"Produto #1"},"a:quantidade":{value:"4"},"a:situacao":{value:"4"},"b:produto":{value:"Produto #2"},"b:quantidade":{value:"2"},"b:situacao":{value:"1"}}};
assert.deepEqual(restoreReleaseItems(legacy).map(i=>i.status),[4,1]);assert.equal(legacy.items[0].status,undefined);
const conflicting=structuredClone(legacy);conflicting.detailFacts=structuredClone(legacy.listFacts);conflicting.detailFacts["b:situacao"].value="2";assert.equal(restoreReleaseItems(conflicting),conflicting.items);
const mismatched=structuredClone(legacy);mismatched.items[0].quantity="5";assert.equal(restoreReleaseItems(mismatched),mismatched.items);
const reordered=structuredClone(legacy);reordered.items.reverse();assert.equal(restoreReleaseItems(reordered),reordered.items);
const recentPaths=[];const time="2026-10-15T17:00:00.000Z";
let recent=await syncStep({...state,nextAt:0,pages:{...state.pages,orders:22}},"dummy",{refreshRecentOrders:true,now:time,fetcher:async(url,opts)=>{recentPaths.push(url);return fetcher(url,opts)}});
assert(recentPaths[0].endsWith("pedidos?pagina=1"));assert.equal(recent.pages.orders,22);assert.equal(recent.recentOrdersNextAt,Date.parse(time)+60000);
let requests=0;await syncStep(recent,"dummy",{refreshRecentOrders:true,now:time,fetcher:async()=>{requests++;return Response.json([])}});assert.equal(requests,0);
console.log("OK recuperação: fatos por item consistentes, conflitos preservados, atendimento parcial destacado e pedidos recentes consultados sem reiniciar paginação ou ignorar intervalo.");

// An older selected order must refresh directly, without resetting the catalog cursor.
const focusedSeed=structuredClone(state);focusedSeed.nextAt=0;focusedSeed.pages.orders=22;
focusedSeed.orders[1].checkedAt="2026-10-01T00:00:00Z";status=4;
const focusedPaths=[];
const focused=await syncStep(focusedSeed,"dummy",{now:time,requestedOrder:"PD QA",refreshRecentOrders:true,fetcher:async(url,opts)=>{focusedPaths.push(url);return fetcher(url,opts)}});
assert(focusedPaths[0].endsWith("pedidos/1"));assert.equal(focusedPaths.length,1);assert.equal(focused.pages.orders,22);
assert.equal(publicSync(focused,true).snapshot.pedidos[0].pedidoConsultadoEm,time);
assert.equal(publicSync(focused,true).snapshot.grupos[0].liberacao,"closed");
assert.deepEqual(pendingFulfillmentItems(publicSync(focused,true).snapshot.grupos[0]),[]);
const repeat=[];await syncStep({...focused,nextAt:0},"dummy",{now:time,requestedOrder:"PD QA",refreshRecentOrders:true,fetcher:async(url,opts)=>{repeat.push(url);return fetcher(url,opts)}});
assert(!repeat[0].endsWith("pedidos/1"));
const forced=[];await syncStep({...focused,nextAt:0},"dummy",{now:time,requestedOrder:"PD QA",refreshOrder:true,fetcher:async(url,opts)=>{forced.push(url);return fetcher(url,opts)}});assert(forced[0].endsWith("pedidos/1"));
for(const response of [()=>new Response('',{status:503}),()=>Response.json({id:999,itensPedido:[]}),()=>Response.json([])]){
 const failed=await syncStep(focusedSeed,"dummy",{now:time,requestedOrder:"PD QA",fetcher:async()=>response()});
 assert.deepEqual(failed.orders,focusedSeed.orders);assert(failed.retryAt);assert.equal(failed.orders[1].checkedAt,focusedSeed.orders[1].checkedAt);
}
const unknown=[];await syncStep(focusedSeed,"dummy",{now:time,requestedOrder:"../../clientes/1",fetcher:async(url,opts)=>{unknown.push(url);return fetcher(url,opts)}});assert(!unknown[0].includes('../'));
console.log("OK focused order: direct GET, catalog cursor preserved, per-order timestamp, cache interval, manual refresh and failed-response preservation.");

// Released sales without an OP remain visible in the backlog, then enter the queue.
for(const vinculo of ["none","unknown"]){
 const sale={...group("new-sale","released",false),vinculo};
 const board={sequence:[],details:{"new-sale":{nota:"Preserve notes",envio:{caixas:[]}}}};
 assert(awaitsRelease(sale,board.details[sale.id]));
 assert.equal(receiveOrders(board,[sale]),board);
 const linked={...sale,ordens:[{id:"OP-new"}],vinculo:"linked"};
 const queued=receiveOrders(board,[linked]);
 assert(!awaitsRelease(linked,queued.details[sale.id]));
 assert.deepEqual(queued.sequence,[sale.id]);
 assert.equal(queued.details[sale.id].situacao,"Programado");
 assert.equal(queued.details[sale.id].nota,"Preserve notes");
 assert.deepEqual(queued.details[sale.id].envio,{caixas:[]});
 assert.equal(receiveOrders(queued,[linked]),queued);
}
assert(awaitsRelease(group("unknown-no-op","unknown",false)));
assert(!awaitsRelease(group("closed-no-op","closed",false)));
assert(!awaitsRelease(noOP,{atendimentoEstoque:true}));
assert(!awaitsRelease(noOP,{situacao:"Em acompanhamento"}));
console.log("OK backlog: new sales without OP stay visible; linked OP enters queue; closed and started orders preserved.");

// Fresh OPs must attach without waiting for the historical OP cursor to wrap.
const freshSeed=structuredClone(state);freshSeed.nextAt=0;freshSeed.recentOrdersNextAt=Date.parse(time)+300000;
freshSeed.pages.ops=9;freshSeed.cycleCount=400;freshSeed.ordersComplete=false;
const freshPaths=[];
const fresh=await syncStep(freshSeed,"dummy",{now:time,refreshRecentOrders:true,requestedProduction:["OP999"],fetcher:async(url)=>{freshPaths.push(url);return Response.json([{id:9000,nome:"OP9000",idEmpresa:1,status:"Liberada",dataHoraCriacao:"15/10/2026",descricaoProduto:"QA",qtde:"4",unidadeMedida:"UNID",itensPedido:[{idPedido:1,nomeCliente:"QA"}]}])}});
assert(freshPaths[0].includes("ordens?pagina=1&query="));assert.equal(fresh.pages.ops,9);assert.equal(fresh.cycleCount,400);
assert.equal(fresh.recentOpsNextAt,Date.parse(time)+60000);
assert(publicSync(fresh,true).snapshot.grupos.find(g=>g.id==="PD QA").ordens.some(o=>o.id==="OP9000"));
assert(freshPaths.length===1);
const failedOP=await syncStep(freshSeed,"dummy",{now:time,refreshRecentOrders:true,fetcher:async()=>new Response("",{status:503})});
assert.deepEqual(failedOP.snapshot,freshSeed.snapshot);assert.equal(failedOP.pages.ops,9);assert(failedOP.retryAt);
console.log("OK recent OPs: priority over history, links attached, cursor preserved, single GET and failure preservation.");

const cyclePaths=[];let rapid=structuredClone(freshSeed);rapid.recentOrdersNextAt=0;rapid.recentOpsNextAt=0;rapid.pages.orders=22;
for(let i=0;i<8;i++)rapid=await syncStep(rapid,"dummy",{now:new Date(Date.parse(time)+i*22000).toISOString(),refreshRecentOrders:true,fetcher:async(url)=>{cyclePaths.push(url);return Response.json([])}});
assert(cyclePaths.filter(url=>url.endsWith("pedidos?pagina=1")).length>=2);
assert(cyclePaths.filter(url=>url.includes("ordens?pagina=1&query=")).length>=2);
assert(cyclePaths.some(url=>url.includes("pagina=22")));
assert(cyclePaths.length===8);
console.log("OK fast sync: both recent feeds refreshed repeatedly, historical progress maintained, one GET per interval.");
