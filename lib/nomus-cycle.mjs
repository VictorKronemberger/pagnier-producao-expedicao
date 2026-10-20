import {syncStep} from "./nomus-sync.mjs";
import {visibleOrderState} from "./order-visibility.mjs";
import {orderScanProgress} from "./nomus-order-presence.mjs";

// At most five sequential ERP GETs, spaced by three seconds. Reserve time for
// the final request (18s timeout), database writes and the browser's 45s timeout.
export async function runNomusCycle(previous,key,{fetcher=fetch,checkpoint=async()=>{},pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),clock=Date.now,...options}={}){
 const started=clock();
 let state=await syncStep(previous,key,{...options,fetcher,now:new Date(clock()).toISOString()});
 await checkpoint(state);
 if(options.requestedOrder&&options.refreshOrder)return state;
 const normalTurn=state.turn;
 for(let requests=1;requests<5;requests++){
  if(state.retryAt||clock()-started+3000>=20000)break;
  const pending=orderScanProgress(visibleOrderState(state)).pending;
  if(state.ordersComplete&&!state.orderScan&&!pending)break;
  if(state.pages.orders===1&&clock()<(state.orderSweepNextAt??0))break;
  await pause(3000);
  if(clock()-started>=20000)break;
  // Older versions may have a page cursor without a complete scan's evidence.
  // Restart only such an unverifiable/invalid scan, never a valid checkpoint.
  if(!state.orderScan?.valid||state.orderScan.nextPage!==state.pages.orders){state={...state,pages:{...state.pages,orders:1}};delete state.orderScan}
  state=await syncStep({...state,nextAt:0},key,{fetcher,now:new Date(clock()).toISOString(),orderSweep:true});
  state.turn=normalTurn; // Keep production/catalog turns fair despite extra pages.
  await checkpoint(state);
  if(state.pages.orders===1&&!state.orderScan)break; // Never begin two scans in one request.
 }
 return state;
}
