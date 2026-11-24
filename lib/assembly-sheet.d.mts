import type {Shipment,ShippingOP,ShippingItem} from "./shipping.mjs";
import type {BoxModel} from "./box-models.mjs";
export type AssemblyColumn={id:string;key:string;parentId?:string;codigo:string;tipo?:"bag";itens:ShippingItem[];inner:boolean;locked:boolean};
export function assemblySheetColumns(s:Shipment):AssemblyColumn[];
export function createSheetOuter(s:Shipment,model?:BoxModel,makeId?:()=>string):Shipment;
export function moveSheetSmallBox(s:Shipment,boxId:string,parentId:string|undefined,targetId:string,makeId?:()=>string):Shipment;
export function addSheetSmallBoxes(s:Shipment,targetId:string,count?:number,tipo?:"bag",makeId?:()=>string):Shipment;
export function duplicateSheetSmallBox(s:Shipment,column:AssemblyColumn,ops:ShippingOP[],makeId?:()=>string):Shipment;
export function removeEmptySheetSmallBox(s:Shipment,column:AssemblyColumn):Shipment;