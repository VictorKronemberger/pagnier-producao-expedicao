import type {Shipment,ShippingOP} from "./shipping.mjs";
export function packingDefinition(shipment:Shipment,ops:ShippingOP[],options?:{draft?:boolean;orderCode?:string}):any;
export function packingBlob(shipment:Shipment,ops:ShippingOP[],options?:{draft?:boolean;orderCode?:string}):Promise<Blob>;
