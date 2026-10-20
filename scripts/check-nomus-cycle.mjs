import assert from "node:assert/strict";
import {runNomusCycle} from "../lib/nomus-cycle.mjs";
import {initialSync,syncStep} from "../lib/nomus-sync.mjs";
import {archiveMissingOrders} from "../lib/order-archive.mjs";
const start=Date.parse("2026-10-20T12:00:00Z"),code="PD 900001";
const seed=()=>({...initialSync({grupos:[],semVinculo:[]}),ordersComplete:true,opsComplete:true,orders:{11:{code,companyId:1,clientId:2,createdDate:"2026-10-01",items:[{productId:3,quantity:"1",status:2}]}},clients:{2:"Cliente teste"},products:{3:{name:"Produto teste",unit:"UNID"}},pages:{orders:28,ops:1,clients:1,products:1},orderReviewFailures:{11:{at:new Date(start-60000).toISOString(),status:400}}});
const pageRows=page=>Array.from({length:page===20?1:50},(_,i)=>({id:1000+page*50+i,codigoPedido:"PD "+(1000+page*50+i),idEmpresa:1,idPessoaCliente:2,dataCriacao:"01/10/2026",itensPedido:[{idProduto:3,quantidade:1,status:2}]}));
let time=start,calls=[],saved=[],sleeps=[];
const fetcher=async(url,init)=>{assert.equal(init.method,"GET");const path=url.split('/rest/')[1];calls.push(path);if(path==='pedidos/11')return new Response('',{status:400});if(path.startsWith('pedidos?'))return Response.json(pageRows(Number(new URL(url).searchParams.get('pagina'))));return Response.json([])};
const opts={fetcher,clock:()=>time,pause:async ms=>{sleeps.push(ms);time+=ms},checkpoint:async state=>saved.push(structuredClone(state)),requestedOrder:code,refreshRecentOrders:true};
let state=await runNomusCycle(seed(),'test',opts);
assert.deepEqual(calls,['pedidos/11','pedidos?pagina=1','pedidos?pagina=2','pedidos?pagina=3','pedidos?pagina=4']);assert.equal(state.pages.orders,5);assert.equal(state.turn,1);assert.equal(saved.length,5);assert(!state.retryAt,'a missing PD does not freeze the whole sync');assert(state.orderReviewFailures[11].nextAt>time);assert(sleeps.every(ms=>ms===3000));
let rounds=1,totalCalls=calls.length;
while(!state.orderAbsences?.[11]?.confirmedAt&&rounds<40){time+=22000;calls=[];saved=[];state=await runNomusCycle(state,'test',opts);assert(calls.length<=5,'bounded batch');assert.equal(saved.length,calls.length,'each completed read is checkpointed');totalCalls+=calls.length;rounds++}
assert(state.orderAbsences?.[11]?.confirmedAt,'known missing PD eventually confirms while its card stays open');assert(state.orderAbsences[11].scans>=2);assert(state.orderAbsences[11].detailMisses>=2);assert(time-start<15*60000,'20-page catalog finishes the review within a bounded simulated period');
const board={sequence:[],details:{}};assert(archiveMissingOrders(board,state,new Date(time).toISOString()).details[code].arquivado);
console.log('OK accelerated scan:',JSON.stringify({pagesPerScan:20,rounds,requests:totalCalls,simulatedSeconds:(time-start)/1000}));
// Losing the lease aborts before any further ERP request; progress was persisted.
time=start;calls=[];saved=[];
await assert.rejects(()=>runNomusCycle(seed(),'test',{...opts,checkpoint:async s=>{saved.push(structuredClone(s));if(saved.length===3)throw Error('lease lost')}}),/lease lost/);assert.equal(calls.length,3);assert.equal(saved.at(-1).pages.orders,3);
// A valid saved cursor resumes; missing/legacy or duplicate-page evidence restarts.
time+=22000;calls=[];saved=[];let resumed=await runNomusCycle({...state,nextAt:0,turn:1,pages:{...state.pages,orders:3},orderScan:{valid:true,nextPage:3,seen:{},codes:{},startedAt:new Date(time-30000).toISOString()}},'test',{...opts,requestedOrder:'',refreshRecentOrders:false});assert(calls.includes('pedidos?pagina=3'));assert(!calls.includes('pedidos?pagina=1'));
// A slow first response leaves no budget for a second ERP call.
time=start;calls=[];await runNomusCycle(seed(),'test',{...opts,fetcher:async(url,init)=>{time+=18000;return fetcher(url,init)}});assert.equal(calls.length,1);
// Authentication, throttling and server outages retain the global retry backoff.
for(const status of [400,401,403,429,503]){time=start;calls=[];const next=await runNomusCycle(seed(),'test',{...opts,fetcher:async()=>{calls.push('failure');return new Response('',{status,headers:{'Retry-After':'120'}})}});assert.equal(calls.length,1);assert(next.retryAt>=start+120000)}
// Explicit manual focus remains one immediate individual request.
time=start;calls=[];await runNomusCycle(seed(),'test',{...opts,refreshOrder:true});assert.deepEqual(calls,['pedidos/11']);
// Pending individual checks win a slot even with visible production/lot requests.
const evidence={code,scans:2,firstMissingAt:new Date(start-120000).toISOString(),lastScanAt:new Date(start-120000).toISOString()};
const priority={...seed(),turn:2,orderAbsences:{11:evidence},productionIds:{OP1:1},production:{},opLotSources:{OP1:{}}};
calls=[];await syncStep(priority,'test',{fetcher,now:new Date(start).toISOString(),requestedLots:['OP1'],requestedProduction:['OP1'],refreshRecentOrders:true});assert.equal(calls[0],'pedidos/11');
console.log('OK cycle: five-request cap, three-second spacing, fair primary turns, durable resume, legacy repair, shared-lease loss, time budget, per-order cooldown, priority and global backoff.');
