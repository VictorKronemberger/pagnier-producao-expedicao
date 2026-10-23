import type {ShippingItem} from "./shipping.mjs";
export function standardPackingDescription(item:Partial<ShippingItem>):string|null;
export function packingProductDescription(item:Partial<ShippingItem>):string;
