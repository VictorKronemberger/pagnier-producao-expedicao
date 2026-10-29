import {syncStep} from './nomus-sync.mjs';
export const CAPTURE_INTERVAL_MS=90000;
// One lease and final save for up to three reads. Reserve time for the 18s
// ERP timeout and the final DB save within the 60s server invocation.
export async function runNomusBatch(previous,key,{fetcher=fetch,clock=Date.now,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),...options}={}){
 let state=previous;const started=clock();
 for(let step=0;step<3;step++){
  if(step){await pause(2000);if(clock()-started>=24000)break;}
  state=await syncStep({...state,nextAt:0},key,{...options,fetcher,now:new Date(clock()).toISOString(),economy:true,refreshRecentOrders:false});
  if(state.retryAt)break;
 }
 state.nextAt=Math.max(clock()+CAPTURE_INTERVAL_MS,state.retryAt??0);
 return state;
}
