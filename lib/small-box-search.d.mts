import type {PreparedBox, ShippingItem} from "./shipping.mjs";
export function smallBoxContents(items: ShippingItem[]): string;
export function smallBoxOptions(boxes?: PreparedBox[], query?: string): {id: string; label: string}[];
