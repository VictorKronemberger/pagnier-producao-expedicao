import type {Shipment,ShippingOP} from "./shipping.mjs";
export function packingBalance(value:Shipment|undefined,ops:ShippingOP[],exceptId?:string):{opId:string;produto:string;unidade:string;target:string|null;packed:string;remaining:string|null;excess:boolean;invalid:boolean;remainingScaled:bigint|null}[];
export function suggestPackingQuantity(value:Shipment,ops:ShippingOP[],boxId:string,itemId:string):{quantity:string;packages:string;reason:string;limited:boolean};
