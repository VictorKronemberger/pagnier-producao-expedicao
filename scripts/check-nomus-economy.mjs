import assert from 'node:assert/strict';
import {initialSync,syncStep,opsPath} from '../lib/nomus-sync.mjs';
import {runNomusBatch,CAPTURE_INTERVAL_MS} from '../lib/nomus-batch.mjs';
import {priorityOrder} from '../lib/nomus-priority.mjs';
const now=Date.parse('2026-10-29T12:00:00Z');
const seed=()=>({...initialSync({grupos:[],semVinculo:[],pedidos:[]}),ordersComplete:true,opsComplete:true,opsScopeStart:'2026-09-01',nextAt:0});
const order=(code,date,status)=>({code,companyId:1,clientId:9,createdDate:date,checkedAt:new Date(now).toISOString(),items:[{productId:8,quantity:'4',status}]});
let s=seed();s.orders={7:order('PD QA 7','2026-10-28',1),8:order('PD QA 8','2026-10-26',2),9:order('PD QA 9','2026-09-01',4)};
assert.equal(priorityOrder(s,s.orders,now),'7','fresh list does not postpone direct verification');
s.orders[7].detailCheckedAt=new Date(now).toISOString();assert.equal(priorityOrder(s,s.orders,now),'8');
s.orderReviewFailures={8:{at:new Date(now).toISOString(),nextAt:now+3600000}};assert.equal(priorityOrder(s,s.orders,now),undefined);
assert.equal(priorityOrder(s,s.orders,now+300001),'7','pending release becomes eligible again');
s=seed();s.orders={7:order('PD QA 7','2026-10-28',1)};s.pages.orders=8;s.pages.ops=4;s.clients={9:'Fixture'};s.products={8:{name:'Fixture',type:'Acabado',sku:'0008'}};
const paths=[];let active=0,maxActive=0,time=now,pauses=[];
const result=await runNomusBatch(s,'fixture',{clock:()=>time,pause:async ms=>{pauses.push(ms);time+=ms},fetcher:async(url,options)=>{
 assert.equal(options.method,'GET');active++;maxActive=Math.max(maxActive,active);const path=url.split('/rest/')[1];paths.push(path);active--;
 if(path==='pedidos/7')return Response.json({id:7,idEmpresa:1,codigoPedido:'PD QA 7',idPessoaCliente:9,dataCriacao:'28/10/2026',itensPedido:[{idProduto:8,quantidade:4,status:2}]});
 return Response.json([]);
}});
assert.deepEqual(paths,['pedidos?pagina=1','pedidos/7','pedidos?pagina=8']);
assert.equal(maxActive,1);assert.deepEqual(pauses,[2000,2000]);assert.equal(result.orders[7].items[0].status,2);
assert(result.orders[7].detailCheckedAt);assert.equal(result.nextAt,time+CAPTURE_INTERVAL_MS);
assert.equal(s.orders[7].items[0].status,1,'original state stays intact until saved');
let calls=0;
const failed=await runNomusBatch(seed(),'fixture',{clock:()=>now,pause:async()=>{},fetcher:async()=>{calls++;return new Response('',{status:429,headers:{'Retry-After':'600'}})}});
assert.equal(calls,1);assert.equal(failed.nextAt,now+600000);assert.equal(failed.lastChecked,null);
time=now;calls=0;
await runNomusBatch(seed(),'fixture',{clock:()=>time,pause:async ms=>{time+=ms},fetcher:async()=>{calls++;time+=25000;return Response.json([])}});
assert.equal(calls,1,'slow ERP leaves time for final save');
// Discovery and details cannot starve the historical cursor, even with production requested.
s=seed();s.pages.orders=8;s.pages.ops=4;s.priorityTurn=2;s.historyTurn=1;
let path;
await syncStep(s,'fixture',{now:new Date(now).toISOString(),economy:true,fetcher:async url=>{path=url.split('/rest/')[1];return Response.json([])}});
assert.equal(path,opsPath(4));
// A missing saved order is preserved and backed off without freezing other orders.
s=seed();s.priorityTurn=1;s.orders={7:order('PD QA 7','2026-10-28',1)};
const missing=await syncStep(s,'fixture',{now:new Date(now).toISOString(),economy:true,fetcher:async()=>new Response('',{status:404})});
assert(missing.orders[7]);assert.equal(missing.retryAt,undefined);assert.equal(missing.orderReviewFailures[7].nextAt,now+3600000);
// An overdue order page must not starve the recent OP page on slower schedules.
s=seed();s.priorityTurn=0;s.recentOrdersNextAt=now-1000;s.recentOpsNextAt=now-5000;
await syncStep(s,'fixture',{now:new Date(now).toISOString(),economy:true,fetcher:async url=>{path=url.split('/rest/')[1];return Response.json([])}});
assert.equal(path,opsPath(1));
console.log('OK economical capture: bounded sequential batch, 90s interval, priority fairness, full history progress, detail freshness, request deadline and failure backoff.');
