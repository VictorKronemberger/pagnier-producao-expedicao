import type {Shipment,ShippingOP} from "./shipping.mjs";
import type {PackingReport} from "./packing-list.mjs";
export function boxReviewKey(value:Shipment|undefined,ops:ShippingOP[]):string;
export function inspectBoxReview(value:Shipment|undefined,ops:ShippingOP[]):{reviewed:boolean;changed:boolean;issues:string[];report:PackingReport};
export function confirmBoxReview(value:Shipment,ops:ShippingOP[],person:string,at:string):Shipment;
