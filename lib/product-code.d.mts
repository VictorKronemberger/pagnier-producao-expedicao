import type {Shipment,ShippingOP,ShippingItem} from "./shipping.mjs";
export function productSku(product:any):string;
export function sourceProductSku(item:Pick<ShippingItem,"opId"|"produto"|"unidade"> & {sku?:string},ops?:ShippingOP[]):string;
export function fillShipmentCodes<T extends Shipment|undefined>(shipment:T,ops?:ShippingOP[]):T;
export function withProductCodes(snapshot:any,state:any):any;
