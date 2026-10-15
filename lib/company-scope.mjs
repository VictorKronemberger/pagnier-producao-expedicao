import {invoiceInScope} from "./invoice.mjs";
// Nomus empresas/2 confirmed as Medicina Sagrada. Scope by company, never by client name.
export const EXCLUDED_COMPANY_ID=2;
export function isMedicineName(value){return /(?:^|[^a-z])medicina(?:$|[^a-z])/.test(String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase());}
export function companyId(value){const text=String(value??"").trim();if(!/^\d+$/.test(text))return null;const id=Number(text);return Number.isSafeInteger(id)&&id>0?id:null}
export function excludeCompanyOrder(state,id,code){
 state.excludedOrders??={};state.excludedOrderCodes??={};
 const old=state.orders?.[id]??state.pendingCompanyOrders?.[id];const actual=code||old?.code||"";
 state.excludedOrders[id]=actual;if(actual)state.excludedOrderCodes[actual]=true;
 if(state.orders)delete state.orders[id];if(state.pendingCompanyOrders)delete state.pendingCompanyOrders[id];
}
export function applyCompanyScope(state){
 state.excludedOrders??={};state.excludedOrderCodes??={};state.excludedOps??={};state.orders??={};
 state.pendingCompanyOrders??={};state.pendingCompanyGroups??={};
 for(const [id,o] of Object.entries({...state.pendingCompanyOrders,...state.orders})){
 const company=companyId(o.companyId);
 if(isMedicineName(o.code)||isMedicineName(state.clients?.[o.clientId])||company===EXCLUDED_COMPANY_ID||company===null&&Object.hasOwn(state.excludedOrders,id)){excludeCompanyOrder(state,id,o.code);continue}
 if(company===null){state.pendingCompanyOrders[id]=o;delete state.orders[id];continue}
 state.orders[id]={...o,companyId:company};delete state.pendingCompanyOrders[id];
 delete state.excludedOrders[id];delete state.excludedOrderCodes[o.code];
 }
 const codes=state.excludedOrderCodes,allowedCodes=new Set(Object.values(state.orders).map(o=>o.code));
 const allGroups=new Map([...Object.values(state.pendingCompanyGroups),...state.snapshot.grupos].map(g=>[g.id,g]));
 for(const g of allGroups.values())if(isMedicineName(g.codigo)||isMedicineName(g.cliente)){state.excludedOrderCodes[g.id]=true;for(const o of g.ordens)state.excludedOps[o.id]=true;}
 for(const [id,o] of Object.entries(state.orders))if(codes[o.code])excludeCompanyOrder(state,id,o.code);
 for(const g of allGroups.values())g.ordens=g.ordens.filter(o=>{if(companyId(o.companyId)===EXCLUDED_COMPANY_ID)state.excludedOps[o.id]=true;return !state.excludedOps[o.id]});
 const includedGroups=[...allGroups.values()].filter(g=>allowedCodes.has(g.id)&&!codes[g.id]);
 const includedOps=new Set(includedGroups.flatMap(g=>g.ordens.map(o=>o.id)));
 const hiddenOps=new Set();state.pendingCompanyGroups={};
 for(const g of allGroups.values()){
 if(allowedCodes.has(g.id)&&!codes[g.id])continue;
 if(!codes[g.id])state.pendingCompanyGroups[g.id]=g;
 for(const o of g.ordens)if(!includedOps.has(o.id)){hiddenOps.add(o.id);if(codes[g.id])state.excludedOps[o.id]=true}
 }
 state.hiddenOrderCodes={...codes,...Object.fromEntries(Object.keys(state.pendingCompanyGroups).map(code=>[code,true])),...Object.fromEntries(Object.values(state.pendingCompanyOrders).filter(o=>o.code).map(o=>[o.code,true]))};
 state.snapshot.grupos=includedGroups;
 if(state.snapshot.pedidos)state.snapshot.pedidos=state.snapshot.pedidos.filter(p=>allowedCodes.has(p.id)&&!codes[p.id]);
 for(const code of Object.keys(state.hiddenOrderCodes))if(state.changes)delete state.changes[code];
 for(const [name,entry] of Object.entries(state.pendingOps??{})){
 if(entry.links.length&&entry.links.every(l=>Object.hasOwn(state.excludedOrders,l.orderId))){state.excludedOps[name]=true;delete state.pendingOps[name]}
 }
 state.snapshot.semVinculo=state.snapshot.semVinculo.filter(o=>companyId(o.companyId)!==EXCLUDED_COMPANY_ID&&!state.excludedOps[o.id]&&!hiddenOps.has(o.id));
 for(const [name,entry] of Object.entries(state.ops??{})){
 if(state.excludedOps[name])delete state.ops[name];else entry.groups=(entry.groups??[]).filter(code=>allowedCodes.has(code)&&!codes[code]);
 }
 return state;
}
export function scopeBoard(board,codes={}){
 return {...board,...(board.invoices?{invoices:Object.fromEntries(Object.entries(board.invoices).filter(([,v])=>invoiceInScope(v,codes)))}:{}),sequence:board.sequence.filter(id=>!codes[id]),details:Object.fromEntries(Object.entries(board.details).filter(([id])=>!codes[id]))};
}
export function preserveExcludedNotes(previous,visible,codes={}){
 return {...visible,...(previous.invoices||visible.invoices?{invoices:{...Object.fromEntries(Object.entries(previous.invoices??{}).filter(([,v])=>!invoiceInScope(v,codes))),...(visible.invoices??{})}}:{}),details:{...Object.fromEntries(Object.entries(previous.details??{}).filter(([id])=>codes[id])),...visible.details}};
}
