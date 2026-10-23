import type {Shipment,ShippingOP} from "./shipping.mjs";
export type ProductDocumentData={opId:string;produto:string;unidade:string;sku:string;hsCode:string};
export function productDocumentData(product:any,op:ShippingOP):ProductDocumentData;
export function documentProductId(state:any,op:ShippingOP):number|null;
export function applyProductDocumentData(shipment:Shipment,rows:ProductDocumentData[]):{shipment:Shipment;filled:number};
