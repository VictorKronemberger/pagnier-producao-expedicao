// A failed detail request alone never proves deletion. Confirm repeated absence
// from complete, unfiltered listings before scheduling two individual checks.
export const PRESENCE_INTERVAL=60000;
const MAX_EVIDENCE_AGE=86400000;
export function orderIdentity(code){
 const match=String(code??"").trim().match(/^PD\s*0*(\d+)$/i);
 return match?"PD:"+match[1]:String(code??"").trim();
}
export function observeOrderPage(state,rows,page,now){
 if(rows.some(p=>!Number.isSafeInteger(p?.id)||p.id<1||typeof p.codigoPedido!=="string"||!p.codigoPedido.trim()))throw Error("Página de pedidos incompleta ou inválida.");
 if(page===1)state.orderScan={seen:{},codes:{},startedAt:now,nextPage:1,valid:true};
 const scan=state.orderScan;if(!scan)return;
 if(scan.nextPage!==page)scan.valid=false;
 for(const row of rows){if(scan.seen[row.id])scan.valid=false;scan.seen[row.id]=true;scan.codes??={};scan.codes[orderIdentity(row.codigoPedido)]=true}
 scan.nextPage=page+1;
}
export function observeOrderPresence(state,id){
 delete state.orderAbsences?.[id];
 delete state.orderReviewFailures?.[id];
}
export function finishOrderScan(state,now){
 const scan=state.orderScan;delete state.orderScan;
 if(!scan?.valid)return;
 state.orderReviewFailures??={};state.orderAbsences??={};
 const stamp=Date.parse(now);
 for(const [id,order] of Object.entries(state.orders)){
  if(scan.seen[id]||scan.codes?.[orderIdentity(order.code)])continue;
  if(order.checkedAt&&order.checkedAt>=scan.startedAt)continue;
  state.orderReviewFailures[id]={at:now,reason:"missing_from_list"};
  const previous=state.orderAbsences[id];
  const old=previous?.code===order.code&&(previous.confirmedAt||stamp-Date.parse(previous.lastScanAt)<=MAX_EVIDENCE_AGE)?previous:null;
  if(old&&Date.parse(scan.startedAt)<Date.parse(old.lastScanAt)+PRESENCE_INTERVAL)continue;
  state.orderAbsences[id]={...old,code:order.code,firstMissingAt:old?.firstMissingAt??now,scans:(old?.scans??0)+1,lastScanAt:now};
 }
}
export function orderAbsenceCandidate(state,now){
 const stamp=Date.parse(now);
 return Object.entries(state.orderAbsences??{}).filter(([id,e])=>state.orders[id]?.code===e.code&&!e.confirmedAt&&e.scans>=2&&stamp>=Date.parse(e.lastDetailAt??"1970-01-01")+PRESENCE_INTERVAL&&stamp-Date.parse(e.lastScanAt)<=MAX_EVIDENCE_AGE)
  .sort((a,b)=>(a[1].lastDetailAt??"").localeCompare(b[1].lastDetailAt??"")||a[1].firstMissingAt.localeCompare(b[1].firstMissingAt))[0]?.[0];
}
export function observeOrderFailure(state,id,status,now){
 const e=state.orderAbsences?.[id],stamp=Date.parse(now);
 if(!e||e.code!==state.orders[id]?.code||e.confirmedAt||e.scans<2||stamp-Date.parse(e.lastScanAt)>MAX_EVIDENCE_AGE)return;
 // Nomus also returns a generic JSON HTTP 400 for a missing known order.
 // It is usable only with the independent, repeated full-list evidence above.
 if(![400,404,410].includes(status)){e.detailMisses=0;e.lastDetailAt=now;return}
 if(e.lastDetailAt&&stamp-Date.parse(e.lastDetailAt)<PRESENCE_INTERVAL)return;
 e.detailMisses=(e.detailMisses??0)+1;e.lastDetailAt=now;e.status=status;
 if(e.detailMisses>=2)e.confirmedAt=now;
}
