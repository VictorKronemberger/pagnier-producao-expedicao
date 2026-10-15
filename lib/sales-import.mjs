import {applyCompanyScope} from "./company-scope.mjs";
const mergeRecords=(baseline,latest,incoming)=>Object.fromEntries([...new Set([...Object.keys(latest??{}),...Object.keys(incoming??{})])].map(id=>[id,JSON.stringify(latest?.[id])!==JSON.stringify(baseline?.[id])?latest?.[id]:incoming?.[id]??latest?.[id]]).filter(([,v])=>v!==undefined));
export function mergeSalesImport(baseline,latest,incoming){
 const s=structuredClone(latest);
 for(const key of ["orders","clients","products","excludedOrders","excludedOrderCodes","pendingCompanyOrders","pendingCompanyGroups"])s[key]=mergeRecords(baseline[key],latest[key],incoming[key]);
 s.ordersComplete=incoming.ordersComplete;s.pages.orders=incoming.pages.orders;
 s.lastSalesImport=incoming.lastSalesImport;s.lastChecked=incoming.lastChecked;
 s.snapshot.consultadoEm=incoming.snapshot.consultadoEm;
 applyCompanyScope(s);
 const groups=new Map(s.snapshot.grupos.map(g=>[g.id,g]));
 for(const o of Object.values(s.orders)){
 let g=groups.get(o.code);if(!g&&o.active){g={id:o.code,codigo:o.code,cliente:"",ordens:[],vinculo:"unknown"};groups.set(o.code,g)}
 if(!g)continue;
 g.cliente=s.clients[o.clientId]??g.cliente;
 g.itens=o.items.map(i=>({produto:s.products[i.productId]?.name??"Produto aguardando consulta",quantidade:i.quantity,unidade:s.products[i.productId]?.unit??""}));
 }
 s.snapshot.grupos=[...groups.values()];
 for(const [code,change] of Object.entries(incoming.changes??{}))if(!s.changes[code]||s.changes[code].at<change.at)s.changes[code]=change;
 s.partial=!s.ordersComplete||!s.opsComplete;
 return applyCompanyScope(s);
}
