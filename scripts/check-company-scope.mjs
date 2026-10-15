import assert from "node:assert/strict";
import {initialSync,syncStep,publicSync} from "../lib/nomus-sync.mjs";
import {applyCompanyScope,excludeCompanyOrder,scopeBoard,preserveExcludedNotes} from "../lib/company-scope.mjs";
const snapshot={grupos:[],semVinculo:[]};
const methods=[];
const order=(id,companyId)=>({id,dataCriacao:"01/10/2026 12:00:00",idEmpresa:companyId,codigoPedido:"P"+id,idPessoaCliente:99,itensPedido:[{idProduto:5,quantidade:"1",status:2}]});
let state=await syncStep(initialSync(snapshot),"test",{fetcher:async(_u,options)=>{methods.push(options.method);return Response.json([order(1,1),order(2,2)])}});
assert(state.orders[1]);assert(!state.orders[2]);assert(state.excludedOrders[2]);assert(!JSON.stringify(publicSync(state,true)).includes("P2"));
state=await syncStep({...state,turn:1,nextAt:0},"test",{fetcher:async(_u,options)=>{methods.push(options.method);return Response.json([
{nome:"SO_EXCLUIDA",descricaoProduto:"Produto restrito",status:"Liberada",itensPedido:[{idPedido:2,nomeCliente:"Mesmo cliente"}]},
{nome:"COMPARTILHADA",descricaoProduto:"Produto compartilhado",status:"Liberada",itensPedido:[{idPedido:1,nomeCliente:"Mesmo cliente"},{idPedido:2,nomeCliente:"Mesmo cliente"}]}
])}});
assert.equal(state.snapshot.semVinculo.length,0);assert(!state.pendingOps.SO_EXCLUIDA);assert.equal(state.snapshot.grupos[0].ordens[0].id,"COMPARTILHADA");
assert(!JSON.stringify(publicSync(state,true)).includes("SO_EXCLUIDA"));
const saved={sequence:["P1","P2"],details:{P1:{nota:"manter"},P2:{nota:"anotação antiga"}}};
const scoped=scopeBoard(saved,state.excludedOrderCodes);assert.deepEqual(scoped.sequence,["P1"]);assert(!scoped.details.P2);
assert.equal(preserveExcludedNotes(saved,scoped,state.excludedOrderCodes).details.P2.nota,"anotação antiga");
const legacy=initialSync({grupos:[{id:"P2",codigo:"P2",cliente:"Cliente",ordens:[{id:"O2"}]}],semVinculo:[{id:"O2"}]});
legacy.orders[2]={code:"P2",companyId:2,items:[{productId:5}]};legacy.changes.P2={at:"hoje",items:["aviso"]};
const projected=publicSync(legacy,true);assert.equal(projected.snapshot.grupos.length,0);assert.equal(projected.snapshot.semVinculo.length,0);assert(!projected.changes.P2);assert(legacy.orders[2],"Projeção não muta o estado original.");
excludeCompanyOrder(legacy,2,"P2");applyCompanyScope(legacy);assert(!legacy.orders[2]);
const failed=await syncStep({...state,nextAt:0},"test",{fetcher:async()=>new Response("",{status:503})});assert(!JSON.stringify(publicSync(failed,true)).includes("P2"));
assert(methods.every(m=>m==="GET"));console.log("OK: empresa 2 excluída, mesmo cliente preservado na empresa 1, OPs exclusivas e compartilhadas, cache, avisos, anotações preservadas e somente GET.");

// Numeric strings and missing company metadata must never bypass the company boundary.
let varied=await syncStep(initialSync({grupos:[],semVinculo:[]}),"test",{fetcher:async()=>Response.json([order(10,"2"),order(11," 02 "),order(12,"1"),order(13,null)])});
assert(!varied.orders[10]);assert(!varied.orders[11]);assert(varied.orders[12]);assert(!varied.orders[13]);assert(varied.pendingCompanyOrders[13]);
assert.deepEqual(publicSync(varied,true).snapshot.pedidos.map(p=>p.id),["P12"]);
const historical=initialSync({grupos:[{id:"OLD",codigo:"OLD",cliente:"Antigo",ordens:[{id:"OLD-OP"}]}],semVinculo:[{id:"OLD-OP"}]});
historical.orders[20]={code:"OLD",clientId:9,items:[]};historical.ordersComplete=true;
const hidden=applyCompanyScope(structuredClone(historical));assert(!hidden.orders[20]);assert(hidden.pendingCompanyOrders[20]);assert.equal(hidden.snapshot.grupos.length,0);assert.equal(hidden.snapshot.semVinculo.length,0);assert(hidden.hiddenOrderCodes.OLD);
const oldNotes={sequence:["OLD"],details:{OLD:{nota:"Preservar trabalho"}}};assert(!scopeBoard(oldNotes,hidden.hiddenOrderCodes).details.OLD);assert.equal(preserveExcludedNotes(oldNotes,{sequence:[],details:{}},hidden.hiddenOrderCodes).details.OLD.nota,"Preservar trabalho");
let reviewedPath="";
const reviewed=await syncStep({...hidden,turn:4,nextAt:0},"test",{fetcher:async u=>{reviewedPath=u;return Response.json({...order(20,1),codigoPedido:"OLD"})}});
assert(reviewedPath.endsWith("pedidos/20"));assert(reviewed.orders[20]);assert(!reviewed.pendingCompanyOrders[20]);assert.equal(reviewed.snapshot.grupos[0].ordens[0].id,"OLD-OP");assert(!reviewed.hiddenOrderCodes.OLD);
const denied=await syncStep({...hidden,turn:4,nextAt:0},"test",{fetcher:async()=>Response.json({...order(20,"2"),codigoPedido:"OLD"})});assert(denied.excludedOrderCodes.OLD);assert.equal(publicSync(denied,true).snapshot.grupos.length,0);
const unavailable=await syncStep({...hidden,turn:4,nextAt:0},"test",{fetcher:async()=>new Response("",{status:400})});assert(unavailable.companyRetryAt[20]);assert.equal(publicSync(unavailable,true).snapshot.pedidos.length,0);
// A payload without company metadata must not clear a prior exclusion.
const incomplete=await syncStep({...denied,turn:0,nextAt:0},"test",{fetcher:async()=>Response.json([{...order(20,undefined),codigoPedido:"OLD"}])});assert(incomplete.excludedOrderCodes.OLD);assert(!incomplete.orders[20]);
// Same client, different allowed company stays in scope.
assert.equal(publicSync(varied,true).snapshot.pedidos.length,1);
console.log("OK: IDs numéricos/textuais, cache legado sem empresa, recuperação após confirmação, falha fechada e preservação de exclusões.");

// The OP company must be enforced even without sales-order links.
const direct=await syncStep({...state,turn:1,nextAt:0},"test",{fetcher:async()=>Response.json([
{nome:"MEDICINA_SEM_PEDIDO",idEmpresa:"2",descricaoProduto:"Produto",status:"Liberada",itensPedido:[]},
{nome:"INTERNA_KG",idEmpresa:1,descricaoProduto:"Mistura KG",unidadeMedida:"KG",status:"Liberada",itensPedido:[]},
{nome:"COMPARTILHADA",idEmpresa:2,descricaoProduto:"Produto",status:"Liberada",itensPedido:[{idPedido:1}]}
])});
assert(!JSON.stringify(publicSync(direct,true)).includes("MEDICINA_SEM_PEDIDO"));
assert(!direct.snapshot.grupos.some(g=>g.ordens.some(o=>o.id==='COMPARTILHADA')));
assert(direct.snapshot.semVinculo.some(o=>o.id==='INTERNA_KG'));
assert(direct.excludedOps.MEDICINA_SEM_PEDIDO);
console.log('OK: empresa da OP Medicina Sagrada excluída mesmo sem pedido; produção interna em KG preservada.');

const byName=initialSync({grupos:[],semVinculo:[]});byName.clients[99]='Medicina Sagrada';
const named=await syncStep(byName,'test',{fetcher:async()=>Response.json([order(80,1)])});
assert(!named.orders[80]);assert(named.excludedOrderCodes.P80);
const codeNamed=await syncStep(initialSync({grupos:[],semVinculo:[]}),'test',{fetcher:async()=>Response.json([{...order(81,1),codigoPedido:'PV MEDICINA 81'}])});assert(!codeNamed.orders[81]);
const linkNamed=await syncStep({...state,turn:1,nextAt:0},'test',{fetcher:async()=>Response.json([{nome:'OP-NOME-MEDICINA',idEmpresa:1,status:'Liberada',itensPedido:[{idPedido:1,nomeCliente:'MEDICINA SAGRADA'}]}])});assert(!JSON.stringify(publicSync(linkNamed,true)).includes('OP-NOME-MEDICINA'));assert(!linkNamed.orders[1]);
console.log('OK: Medicina no nome do cliente ou identificação do pedido exclui pedido e OP, mesmo em outra empresa.');

const legacyName=initialSync({grupos:[{id:'PV-NAME',codigo:'PV-NAME',cliente:'Medicina Sagrada',ordens:[{id:'OP-NAME'}]}],semVinculo:[]});legacyName.orders[88]={companyId:1,code:'PV-NAME',createdDate:'2026-10-01',clientId:123,items:[]};
const nameView=publicSync(legacyName,true);assert.equal(nameView.snapshot.grupos.length,0);assert.equal(nameView.snapshot.pedidos.length,0);assert(!applyCompanyScope(legacyName).orders[88]);
console.log('OK: nome Medicina no cache do pedido também exclui catálogo quando o cadastro do cliente ainda não foi lido.');
