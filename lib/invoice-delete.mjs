import {packingOrderIds} from "./packing-delete.mjs";
export function invoiceDeletionReason(board,id){
 const invoice=Object.hasOwn(board.invoices??{},id)?board.invoices[id]:undefined;
 if(!invoice)return "Esta invoice não está mais disponível.";
 if(invoice.dataEnvio?.trim())return "Invoice finalizada: existe data de envio registrada.";
 for(const orderId of invoice.orderIds??[]){
  for(const linked of packingOrderIds(board,orderId)){
   const detail=board.details?.[linked];
   if(detail?.situacao==="Atendido totalmente e enviado"||detail?.envio?.dataEnvio?.trim())return "Invoice finalizada: existe data de envio ou um pedido do envio na coluna Enviados.";
  }
 }
 return "";
}
export function deleteDraftInvoice(board,id){
 const reason=invoiceDeletionReason(board,id);if(reason)throw Error(reason);
 const invoices={...board.invoices};delete invoices[id];return {...board,invoices};
}
export function assertNoInvoiceRemoval(previous,next){
 if(Object.keys(previous??{}).some(id=>!Object.hasOwn(next??{},id)))throw Error("Para excluir uma invoice, use Excluir na lista de invoices. A proteção será verificada antes da exclusão.");
}
