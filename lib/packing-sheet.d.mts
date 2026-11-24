import type {Shipment,ShippingOP,ShippingItem} from "./shipping.mjs";
export type SheetChange={boxId:string;opId:string;quantity:string};
export function sheetItems(box:{itens:ShippingItem[]},opId:string,inner?:boolean):ShippingItem[];
export function applySheetQuantities(shipment:Shipment,ops:ShippingOP[],changes:SheetChange[],makeId?:()=>string):Shipment;