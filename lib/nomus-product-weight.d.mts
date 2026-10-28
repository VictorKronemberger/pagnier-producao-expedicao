import type {Shipment,ShippingItem} from "./shipping.mjs";
export type NomusWeightRow={opId:string;produto:string;unidade:string;pesoLiquidoUnitarioKg:string};
export function netWeight(value:unknown):string;
export function packWeightFactor(item:ShippingItem):bigint|null;
export function needsNomusWeight(item:ShippingItem):boolean;
export function applyNomusWeights(shipment:Shipment,rows:NomusWeightRow[]):{filled:number;shipment:Shipment};
