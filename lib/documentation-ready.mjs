import {inspectBoxReview} from "./box-review.mjs";
import {shipmentOwner,shipmentOps} from "./shipment-groups.mjs";

// Readiness is physical: document fields may still be empty.
export function documentationReady(board,groups){
 const byId=new Map(groups.map(g=>[g.id,g]));
 const entries=[];
 for(const owner of new Set(groups.map(g=>shipmentOwner(board,g.id)))){
  const shipment=board.details[owner]?.envio;
  if(!shipment||shipment.dataEnvio)continue;
  const ids=shipment.agrupamento?.pedidos??[owner];
  if(!ids.includes(owner)||ids.some(id=>!byId.has(id)||board.details[id]?.situacao==="Atendido totalmente e enviado"))continue;
  const ops=shipmentOps(shipment,owner,groups);
  if(!inspectBoxReview(shipment,ops).reviewed)continue;
  entries.push({owner,orders:ids.map(id=>({id,codigo:byId.get(id).codigo,cliente:byId.get(id).cliente})),boxes:shipment.caixas.length,reviewedBy:shipment.conferenciaPor,reviewedAt:shipment.conferenciaEm,carrier:shipment.transportadora||""});
 }
 return entries.sort((a,b)=>a.reviewedAt.localeCompare(b.reviewedAt)||a.owner.localeCompare(b.owner));
}
