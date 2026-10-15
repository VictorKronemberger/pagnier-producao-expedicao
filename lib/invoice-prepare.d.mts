import type {Invoice} from "./invoice.mjs";
import type {Shipment} from "./shipping.mjs";
import {previewInvoiceSources} from "./invoice.mjs";
export function directInvoiceShipment(shipment:Shipment|undefined):Shipment|undefined;
export function prepareInvoiceOrder(invoice:Invoice,order:any,shipment:Shipment|undefined,idFactory:()=>string):Invoice;
export function reuseConnectedInvoice(invoice:Invoice,orders:any[],shipment:Shipment|undefined,idFactory:()=>string):Invoice;
export function previewConnectedInvoice(invoice:Invoice,orders:any[],shipment:Shipment|undefined,idFactory:()=>string):ReturnType<typeof previewInvoiceSources>;
export function relatedInvoiceIds(invoices:Record<string,Invoice>|undefined,orderId:string):string[];
