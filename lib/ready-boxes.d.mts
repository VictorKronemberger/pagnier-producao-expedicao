import type {Shipment,ShippingOP,ShippingBox} from "./shipping.mjs";
export function isMounted(box:ShippingBox|undefined):boolean;
export function finishOuterBox(shipment:Shipment,id:string,ops:ShippingOP[]):Shipment;
export function reopenOuterBox(shipment:Shipment,id:string):Shipment;
