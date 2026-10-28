import type {ShippingItem} from "./shipping.mjs";
export function contentWeights(items:ShippingItem[]):{rows:{item:ShippingItem;weight:bigint|null;units:number;net:bigint|null}[];total:bigint;missing:number;complete:boolean};
export function contentWeightLabel(items:ShippingItem[]):string;
