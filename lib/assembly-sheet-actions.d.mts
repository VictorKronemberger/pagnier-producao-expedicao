import type {Shipment,ShippingOP} from "./shipping.mjs";
export function fillSheetSmallBoxes(s:Shipment,ops:ShippingOP[],targetId:string,count:number,opId:string,quantity:string,tipo?:"bag",makeId?:()=>string):Shipment;
export function moveSheetSmallBoxes(s:Shipment,keys:string[],targetId:string,makeId?:()=>string):Shipment;
export type SheetUndo={before:Pick<Shipment,"caixas"|"caixasEmMontagem">;after:string};
export function sheetUndoEntry(before:Shipment,after:Shipment):SheetUndo|null;
export function canUndoSheet(s:Shipment,entry:SheetUndo|null):boolean;
export function undoSheet(s:Shipment,entry:SheetUndo|null):Shipment;
