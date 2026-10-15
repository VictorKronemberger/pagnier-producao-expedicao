import type {Shipment,ShippingOP,Packing,ShippingBox,ShippingItem} from "./shipping.mjs";
export function scaled(value:unknown):bigint|null;
export function weightText(grams:bigint|null):string;
export type PackingReport={shipment:Shipment;packing:Packing;boxes:(ShippingBox&{rows:(ShippingItem&{units:number;unitWeight:bigint|null;net:bigint|null;content:bigint|null})[];net:bigint;gross:bigint|null;units:number})[];totalNet:bigint;totalGross:bigint;totalUnits:number;issues:string[]};
export function inspectPacking(value:Shipment,ops:ShippingOP[],options?:{physicalOnly?:boolean}):PackingReport;
