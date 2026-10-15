import {shipmentOwner} from "./shipment-groups.mjs";

export function packingOrderIds(board,id){
 const owner=shipmentOwner(board,id),shipment=board.details?.[owner]?.envio;
 return [...new Set([owner,...(shipment?.agrupamento?.pedidos??[])])];
}
export function packingDeletionReason(board,id){
 const owner=shipmentOwner(board,id);
 if(!board.details?.[owner]?.envio||board.details[owner].envio.packingExcluido)return "Este packing list não está mais disponível.";
 for(const orderId of packingOrderIds(board,owner)){
 const d=board.details?.[orderId];
 if(d?.situacao==="Atendido totalmente e enviado"||d?.envio?.dataEnvio?.trim())return "Packing list finalizado: existe data de envio ou um pedido na coluna Enviados.";
 }
 return "";
}
export function deleteDraftPacking(board,id){
 const reason=packingDeletionReason(board,id);if(reason)throw Error(reason);
 const owner=shipmentOwner(board,id),envio=board.details[owner].envio;
 // The document is removed from the list; physical work and group ownership stay intact.
 const packing={...envio.packing,invoiceNumero:"",invoiceData:"",assinante:"",assinaturaData:""};
 return {...board,details:{...board.details,[owner]:{...board.details[owner],envio:{...envio,packing,packingExcluido:true}}}};
}
