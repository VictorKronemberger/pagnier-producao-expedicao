import type {Shipment} from "./shipping.mjs";
export function deleteShippingBox(shipment:Shipment,kind:"small"|"outer",id:string,confirmation:string,outerId?:string):Shipment;
