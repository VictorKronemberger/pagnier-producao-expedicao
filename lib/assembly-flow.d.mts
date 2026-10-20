import type {Shipment,PreparedBox,ShippingOP,ShippingItem} from "./shipping.mjs";
export function smallBoxCopyCapacity(shipment:Shipment,id:string,ops:ShippingOP[]):{max:number;reason:string};
export function duplicateSmallBox(shipment:Shipment,id:string,count:number,ops:ShippingOP[],makeId?:()=>string):Shipment;
export function startSmallBox(shipment:Shipment,id:string):Shipment;
export function smallBoxIssue(box:PreparedBox|undefined,ops:ShippingOP[]):string;
export function finishSmallBox(shipment:Shipment,id:string,ops:ShippingOP[]):Shipment;
export function placeSmallBox(shipment:Shipment,id:string,targetId:string,ops:ShippingOP[]):Shipment;
export function unpackSmallBox(shipment:Shipment,outerId:string,innerId:string,newId:string):Shipment;
export function recoverLooseItems(shipment:Shipment,outerId:string,id:string):Shipment;

export function updateBoxContents(shipment:Shipment,boxId:string,itens:ShippingItem[]):Shipment;
