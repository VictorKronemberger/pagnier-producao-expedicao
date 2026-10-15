import {addInvoiceSources,fillInvoiceFromShipment,previewInvoiceSources} from "./invoice.mjs";
// Grouped shipments have a shared recipient and AWB: a direct invoice must confirm its own destination.
export function directInvoiceShipment(shipment){return shipment?.agrupamento?.pedidos?.length>1?undefined:shipment}
export function prepareInvoiceOrder(invoice,order,shipment,idFactory){
 if(invoice.items.length&&invoice.orderIds[0]!==order.id)throw Error("Remova os itens antes de trocar o pedido, ou crie outra invoice para a nova encomenda.");
 const selected={...invoice,orderIds:[order.id]};
 return addInvoiceSources(fillInvoiceFromShipment(selected,directInvoiceShipment(shipment)),[order],shipment,idFactory);
}
export function previewConnectedInvoice(invoice,orders,shipment,idFactory){
 const plan=previewInvoiceSources(invoice,orders,shipment,idFactory);
 return {...plan,next:fillInvoiceFromShipment(plan.next,directInvoiceShipment(shipment))};
}
export function reuseConnectedInvoice(invoice,orders,shipment,idFactory){return addInvoiceSources(fillInvoiceFromShipment(invoice,directInvoiceShipment(shipment)),orders,shipment,idFactory)}
export function relatedInvoiceIds(invoices,orderId){return Object.values(invoices??{}).filter(v=>v.orderIds?.includes(orderId)).map(v=>v.id)}
