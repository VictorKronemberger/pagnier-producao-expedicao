import type {Shipment,ShippingOP,ShippingItem} from "./shipping.mjs";
import {packingBalance} from "./packing-assistant.mjs";
export function smallBoxProgress(shipment:Shipment,ops:ShippingOP[]):{
 ready:{id:string;codigo:string;itens:ShippingItem[];outerId:string;location:string}[];
 pending:(ReturnType<typeof packingBalance>[number]&{draft:string;hasDraft:boolean})[];
 draftCount:number;
};
