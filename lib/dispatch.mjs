import {shipmentOwner,shipmentOps} from "./shipment-groups.mjs";
import {inspectBoxReview} from "./box-review.mjs";
import {analyzeShipment,validDate} from "./shipping.mjs";
export function dispatchIssues(board,id,groups){
 const owner=shipmentOwner(board,id),shipment=board.details?.[owner]?.envio,group=groups.find(g=>g.id===id),ops=shipmentOps(shipment,owner,groups),issues=[];
 if(!group?.ordens.length)return ["O pedido ainda não tem produtos disponíveis para conferência."];
 if(!inspectBoxReview(shipment,ops).reviewed)issues.push("Confira os volumes na expedição antes de marcar como enviado.");
 if(analyzeShipment(shipment,group.ordens).allocation.some(a=>a.status!=="complete"))issues.push("Ainda há produtos sem alocação completa nas caixas. Mantenha o envio parcial em Preparar envio.");
 const date=shipment?.dataEnvio||Object.values(board.invoices??{}).find(v=>v.orderIds?.includes(id)&&v.dataEnvio)?.dataEnvio;
 if(!date||!validDate(date))issues.push("Registre a data real de envio após o despacho.");
 return issues;
}
export function assertDispatchTransitions(previous,next,groups){
 for(const [id,d] of Object.entries(next.details??{}))if(d.situacao==="Atendido totalmente e enviado"&&previous.details?.[id]?.situacao!==d.situacao){const issues=dispatchIssues(next,id,groups);if(issues.length)throw Error(issues.join(" "))}
}
