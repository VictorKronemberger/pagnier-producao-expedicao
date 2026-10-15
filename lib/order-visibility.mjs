import {SITE_START_DATE} from "./date-filter.mjs";
// Project the site's date boundary without erasing ERP history or production links.
export function visibleOrderState(state){
 const hidden={...state.hiddenOrderCodes},linked=new Set(state.snapshot.grupos.filter(g=>g.ordens?.length).map(g=>g.id));
 const orders={};let old=0,unknown=0;
 for(const [id,o] of Object.entries(state.orders??{})){
 if(hidden[o.code])continue;
 const hasOP=linked.has(o.code)||!!state.seenLinks?.[id]||Object.values(state.pendingOps??{}).some(e=>e.links?.some(l=>String(l.orderId)===id));
 if(!hasOP&&(!o.createdDate||o.createdDate<SITE_START_DATE)){hidden[o.code]=true;if(o.createdDate)old++;else unknown++;continue;}
 orders[id]=o;
 }
 return {...state,orders,hiddenOrderCodes:hidden,orderDateScope:{start:SITE_START_DATE,old,unknown},changes:Object.fromEntries(Object.entries(state.changes??{}).filter(([id])=>!hidden[id])),snapshot:{...state.snapshot,grupos:state.snapshot.grupos.filter(g=>!hidden[g.id]),...(state.snapshot.pedidos?{pedidos:state.snapshot.pedidos.filter(g=>!hidden[g.id])}:{})}};
}
