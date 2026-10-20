import assert from 'node:assert/strict';
import {bootstrapNomus} from '../lib/nomus-bootstrap.mjs';
import {initialSync,publicSync,syncStep,opsPath} from '../lib/nomus-sync.mjs';
const paths=[];let checkpoints=0;
const empty={consultadoEm:'',ordensConsultadas:0,grupos:[],pedidos:[],semVinculo:[]};
const state=await bootstrapNomus(initialSync(empty),'fixture',{checkpoint:async()=>checkpoints++,fetcher:async(url,options)=>{
 assert.equal(options.method,'GET');const path=url.split('/rest/')[1];paths.push(path);
 if(path==='pedidos?pagina=1')return Response.json([
  {id:1,idEmpresa:1,codigoPedido:'PV1',idPessoaCliente:9,dataCriacao:'15/10/2026',itensPedido:[{idProduto:8,quantidade:2,status:2}]},
  {id:2,idEmpresa:2,codigoPedido:'PV2',idPessoaCliente:10,dataCriacao:'15/10/2026',itensPedido:[]},
  {id:3,idEmpresa:1,codigoPedido:'OLD',idPessoaCliente:11,dataCriacao:'01/08/2026',itensPedido:[]}
 ]);
 if(path===opsPath(1))return Response.json([{id:20,nome:'OP20',idEmpresa:1,idProduto:7,descricaoProduto:'Produto teste',unidadeMedida:'UNID',qtde:2,status:'Cancelada',dataHoraCriacao:'15/10/2026',itensPedido:[{idPedido:1,nomeCliente:'Cliente teste'}]}]);
 if(path==='produtos/8')return Response.json({descricao:'Segundo produto',siglaUnidadeMedida:'KG'});
 throw Error('Unexpected request: '+path);
}});
const view=publicSync(state,true);assert.equal(view.partial,false);assert.equal(view.snapshot.pedidos.length,1);assert.equal(view.pedidosIdentificados,1);assert.equal(view.snapshot.grupos[0].ordens[0].situacaoNomus,'Cancelada');assert(!paths.some(path=>path.includes('clientes/11')));assert.equal(paths.length,3);assert.equal(checkpoints,4);
let saved;await assert.rejects(()=>bootstrapNomus(initialSync(empty),'fixture',{checkpoint:async state=>saved=state,fetcher:async()=>new Response('',{status:429})}));assert(saved.retryAt);assert.equal(saved.ordersComplete,false);
console.log('OK bootstrap: read-only ERP, full pagination completion, visible-only hydration, company/date scope, cancellations and checkpoint on throttling.');

// Saved completion is a durable cache: another run does not query the ERP.
const cached=await bootstrapNomus(state,'fixture',{fetcher:()=>{throw Error('Unexpected duplicate read')}});
assert.deepEqual(cached,state);
// A failed OP scan resumes without querying the already completed order catalog.
const resume=initialSync(empty);resume.ordersComplete=true;resume.pages.ops=3;
const resumedPaths=[];const serverTime='2026-10-19T20:00:00.000Z';
const resumed=await bootstrapNomus(resume,'fixture',{now:()=>serverTime,fetcher:async url=>{resumedPaths.push(url.split('/rest/')[1]);return Response.json([])}});
assert.deepEqual(resumedPaths,[opsPath(3)]);assert.equal(resumed.bootstrapCompletedAt,serverTime);
assert.equal(resumed.nextAt,Date.parse(serverTime)+22000);
// Full pages advance exactly once, followed by the final short page.
const paged=[];
await bootstrapNomus(initialSync(empty),'fixture',{fetcher:async url=>{
 const path=url.split('/rest/')[1];paged.push(path);
 return Response.json(path==='pedidos?pagina=1'?Array.from({length:50},(_,i)=>({id:i+1,idEmpresa:2,codigoPedido:'Excluded'+i})):[]);
}});
assert.deepEqual(paged,['pedidos?pagina=1','pedidos?pagina=2',opsPath(1)]);
console.log('OK persisted completion cache, interrupted-stage resume, pagination and server-clock timestamps.');

// Background polling reuses the completed catalog cache, but revalidates after expiry.
const reused=[];
for(const turn of [2,3])await syncStep({...resumed,nextAt:0,turn},'fixture',{now:serverTime,fetcher:async url=>{reused.push(url.split('/rest/')[1]);return Response.json([])}});
assert.deepEqual(reused,[opsPath(1),opsPath(1)]);
let expiredPath;
const expired=await syncStep({...resumed,nextAt:0,turn:2},'fixture',{now:'2026-10-21T20:00:00.000Z',fetcher:async url=>{expiredPath=url.split('/rest/')[1];return Response.json([])}});
assert.equal(expiredPath,'clientes?pagina=1');assert(expired.catalogNextAt.clients>Date.parse('2026-10-21T20:00:00.000Z'));
console.log('OK persistent catalog cache and daily revalidation.');

// Hydration failure also saves cooldown; resume only fetches the missing detail.
let hydrationSaved;const needsName=initialSync(empty);needsName.ordersComplete=true;needsName.opsComplete=true;needsName.bootstrapCompletedAt=serverTime;
needsName.orders[1]={code:'PV',companyId:1,clientId:9,createdDate:'2026-10-19',items:[]};
await assert.rejects(()=>bootstrapNomus(needsName,'fixture',{now:()=>serverTime,checkpoint:async s=>hydrationSaved=structuredClone(s),fetcher:async()=>new Response('',{status:429,headers:{'Retry-After':'120'}})}));
assert.equal(hydrationSaved.retryAt,Date.parse(serverTime)+120000);assert.equal(hydrationSaved.partial,true);assert(!hydrationSaved.bootstrapCompletedAt);
const hydratedPaths=[];const hydrated=await bootstrapNomus(hydrationSaved,'fixture',{now:()=>serverTime,fetcher:async url=>{hydratedPaths.push(url.split('/rest/')[1]);return Response.json({nome:'Cliente teste'})}});
assert.deepEqual(hydratedPaths,['clientes/9']);assert.equal(hydrated.partial,false);assert(!hydrated.retryAt);
console.log('OK hydration throttle checkpoint and missing-detail-only resume.');

let interruptedRefresh;
await assert.rejects(()=>bootstrapNomus(state,'fixture',{refresh:true,checkpoint:async next=>interruptedRefresh=next,fetcher:async()=>new Response('',{status:503})}));
assert(!interruptedRefresh.bootstrapCompletedAt);assert.equal(interruptedRefresh.ordersComplete,false);
console.log('OK failed explicit refresh cannot reuse a stale completion marker.');

// Expanding the date scope invalidates only the OP completion marker, retaining saved orders.
const priorScope={...state,opsScopeStart:'2026-10-01',pages:{...state.pages,ops:4}};
const expandedPaths=[];
const expanded=await bootstrapNomus(priorScope,'fixture',{fetcher:async url=>{expandedPaths.push(url.split('/rest/')[1]);return Response.json([])}});
assert.deepEqual(expandedPaths,[opsPath(1)]);
assert.equal(expanded.opsScopeStart,'2026-09-01');assert(expanded.bootstrapCompletedAt);
assert.match(decodeURIComponent(expandedPaths[0]),/dataHoraCriacao>=2026-09-01T00:00:00/);
console.log('OK expanded September scope reloads OPs without repeating saved order pagination.');

const legacyCompleted={...initialSync(empty),opsScopeStart:'2026-10-01',bootstrapCompletedAt:serverTime,ordersComplete:true,opsComplete:true,partial:false,turn:1};
const automaticExpansion=await syncStep(legacyCompleted,'fixture',{now:serverTime,fetcher:async()=>Response.json(Array.from({length:50},(_,i)=>({nome:'EXCLUDED'+i,idEmpresa:2})))});
assert(!automaticExpansion.bootstrapCompletedAt);assert.equal(automaticExpansion.opsComplete,false);assert.equal(automaticExpansion.pages.ops,2);
const remainingPaths=[];
await bootstrapNomus({...automaticExpansion,bootstrapCompletedAt:serverTime},'fixture',{fetcher:async url=>{remainingPaths.push(url.split('/rest/')[1]);return Response.json([])}});
assert.deepEqual(remainingPaths,[opsPath(2)]);
console.log('OK automatic scope expansion invalidates old completion; bootstrap resumes partial scopes even with a legacy marker.');

// Full capture also reads final-operation quantities, beyond the first visible 20 OPs.
const productionSeed=initialSync(empty);productionSeed.ordersComplete=true;productionSeed.opsComplete=true;
productionSeed.snapshot.semVinculo=Array.from({length:22},(_,i)=>({id:'OP'+(i+1),nome:'OP'+(i+1),companyId:1,criacao:'2026-10-19',situacaoNomus:i===21?'Cancelada':'Encerrada'}));
productionSeed.productionIds=Object.fromEntries(Array.from({length:22},(_,i)=>['OP'+(i+1),i+1]));
productionSeed.production={OP1:{quantity:'0',nextAt:0}};
const productionPaths=[];
const fullyCaptured=await bootstrapNomus(productionSeed,'fixture',{includeProduction:true,now:()=>serverTime,fetcher:async(url,options)=>{
 assert.equal(options.method,'GET');productionPaths.push(url);
 const ids=new URL(url).searchParams.get('query').split(',').map(q=>Number(q.split('==')[1]));
 return Response.json(ids.flatMap(id=>[1,2].map(operacao=>({id:id*10+operacao,idOrdem:id,nomeOrdem:'OP'+id,operacao,qtdeProduzida:operacao===2?'10':'20',descricao:'Etapa '+operacao}))));
}});
assert.equal(productionPaths.length,2);assert.equal(Object.keys(fullyCaptured.production).length,21);
for(const value of Object.values(fullyCaptured.production)){assert.equal(value.quantity,'10');assert.equal(value.checkedAt,serverTime)}
assert.equal(fullyCaptured.production.OP22,undefined);
let productionFailure;
await assert.rejects(()=>bootstrapNomus(productionSeed,'fixture',{includeProduction:true,now:()=>serverTime,checkpoint:async s=>productionFailure=s,fetcher:async()=>new Response('',{status:429})}));
assert(productionFailure.retryAt);assert.equal(productionFailure.production.OP1.quantity,'0');assert(!productionFailure.bootstrapCompletedAt);
console.log('OK full production capture: all batches, final operation only, cancelled OP exclusion and failure checkpoint.');
