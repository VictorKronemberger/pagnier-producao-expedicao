import {releaseState} from './order-release.mjs';
// List freshness must not postpone individual verification indefinitely.
export function priorityOrder(state, visibleOrders, stamp){
 const cutoff=new Date(stamp-14*86400000).toISOString().slice(0,10);
 return Object.entries(visibleOrders).filter(([id,o])=>{
  if(!/^[1-9]\d*$/.test(id)||!Number.isSafeInteger(Number(id)))return false;
  const failure=state.orderReviewFailures?.[id];
  if(failure&&stamp<(failure.nextAt??Date.parse(failure.at)+3600000))return false;
  const waiting=['waiting','partial'].includes(releaseState(o.items));
  if(!waiting&&(!o.createdDate||o.createdDate<cutoff))return false;
  return stamp>=(Date.parse(o.detailCheckedAt??'')||0)+(waiting?300000:900000);
 }).sort(([,a],[,b])=>(Date.parse(a.detailCheckedAt??'')||0)-(Date.parse(b.detailCheckedAt??'')||0)||(b.createdDate??'').localeCompare(a.createdDate??''))[0]?.[0];
}
