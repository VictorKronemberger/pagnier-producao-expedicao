import {shipmentOwner} from "./shipment-groups.mjs";
export const carrierFilters=["Todas","FedEx","DHL","Outras","A definir","Múltiplas"];
function category(value){const v=value.trim();return /\bfed[ -]?ex\b/i.test(v)?"FedEx":/\bdhl\b/i.test(v)?"DHL":v?"Outras":"A definir"}
export function orderCarrier(board,id){
 const owner=shipmentOwner(board,id),shipment=board.details?.[owner]?.envio;
 const value=shipment?.transportadora?.trim();
 if(value)return {value,category:category(value),source:"envio"};
 const ids=shipment?.agrupamento?.pedidos??[id];
 const carriers=[...new Set(Object.values(board.invoices??{}).filter(i=>i.orderIds?.some(order=>ids.includes(order))).map(i=>i.carrier).filter(c=>c==="FedEx"||c==="DHL"))];
 if(carriers.length===1)return {value:carriers[0],category:carriers[0],source:"invoice"};
 return {value:"",category:carriers.length>1?"Múltiplas":"A definir",source:carriers.length>1?"invoice":""};
}
