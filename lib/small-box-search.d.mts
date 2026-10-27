import type {PreparedBox, ShippingItem} from "./shipping.mjs";
export function smallBoxContents(items: ShippingItem[]): string;
export function smallBoxQuantity(items: ShippingItem[]): string;
export function smallBoxOptions(boxes?: PreparedBox[], query?: string): {id: string; label: string; title: string; number: number; quantity: string; contents: string; type:"bag"|"box"}[];
