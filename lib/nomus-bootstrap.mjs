import {SITE_START_DATE} from "./date-filter.mjs";
import {syncStep,nomusGet,publicSync} from './nomus-sync.mjs';
import {applyCompanyScope} from './company-scope.mjs';
export async function bootstrapNomus(previous,key,{fetcher=fetch,checkpoint=async()=>{},pause=async()=>{},maxPages=1000,refresh=false,now=()=>new Date().toISOString()}={}){
 let state=structuredClone(previous);
 if(state.opsScopeStart!==SITE_START_DATE){state.opsScopeStart=SITE_START_DATE;state.opsComplete=false;state.pages.ops=1;state.cycleCount=0;delete state.bootstrapCompletedAt}
 if(state.bootstrapCompletedAt&&!refresh&&state.ordersComplete&&state.opsComplete&&!state.partial)return state;
 if(refresh)delete state.bootstrapCompletedAt;
 // Resume saved stages; only an explicit refresh repeats completed pagination.
 if(refresh&&state.ordersComplete){state.pages.orders=1;state.ordersComplete=false}
 if(refresh&&state.opsComplete){state.pages.ops=1;state.opsComplete=false;state.cycleCount=0}
 async function step(kind,turn){
  await pause();
  const page=state.pages[kind];
  const next=await syncStep({...state,nextAt:0,turn},key,{fetcher,now:now(),refreshRecentOrders:false});
  state=next;await checkpoint(state,{kind,page});
  if(state.retryAt)throw Error('Nomus capture paused after an API failure. Saved progress retained.');
 }
 let count=0;
 while(!state.ordersComplete){if(++count>maxPages)throw Error('Order page limit reached.');await step('orders',0)}
 count=0;
 while(!state.opsComplete){if(++count>maxPages)throw Error('Production page limit reached.');await step('ops',1)}
 // Hydrate only the customers/products used by visible orders, not whole catalogs.
 const visible=new Set(publicSync(state,true).snapshot.pedidos.map(order=>order.id));
 const orders=Object.values(state.orders).filter(order=>visible.has(order.code));
 const clients=[...new Set(orders.map(order=>order.clientId).filter(id=>Number.isSafeInteger(id)&&id>0&&!state.clients[id]))];
 const products=[...new Set(orders.flatMap(order=>order.items??[]).map(item=>item.productId).filter(id=>Number.isSafeInteger(id)&&id>0&&!state.products[id]?.name))];
 for(const [kind,ids] of [['clientes',clients],['produtos',products]])for(const id of ids){
  await pause();let result;
  try{result=await nomusGet(kind+'/'+id,key,fetcher)}catch(error){
   state.partial=true;state.retryAt=Date.parse(now())+Math.max(60000,error.retryAfterMs??0);state.nextAt=state.retryAt;
   state.message='Consulta temporariamente indisponível. Dados anteriores preservados.';
   await checkpoint(state,{kind,failed:true});throw error;
  }
  if(kind==='clientes'){
   if(typeof result.nome!=='string')throw Error('Customer response is missing its name.');
   state.clients[id]=result.nome;
  }else{
   const name=result.descricao??result.nome;
   if(typeof name!=='string')throw Error('Product response is missing its name.');
   state.products[id]={name,unit:String(result.siglaUnidadeMedida??'')};
  }
  await checkpoint(state,{kind,hydrated:1});
 }
 const byCode=new Map(Object.values(state.orders).map(order=>[order.code,order]));
 for(const group of state.snapshot.grupos){const order=byCode.get(group.id);if(order&&state.clients[order.clientId])group.cliente=state.clients[order.clientId]}
 state=applyCompanyScope(state);state.lastChecked=now();state.partial=!state.ordersComplete||!state.opsComplete;state.nextAt=Date.parse(state.lastChecked)+22000;
 delete state.retryAt;state.message='Carga inicial concluída. Consulta periódica em andamento.';
 state.bootstrapCompletedAt=state.lastChecked;
 state.catalogNextAt={clients:Date.parse(state.lastChecked)+86400000,products:Date.parse(state.lastChecked)+86400000};
 await checkpoint(state,{kind:'complete'});return state;
}
