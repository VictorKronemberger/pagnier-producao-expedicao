import type {Shipment} from "./shipping.mjs";
export function shipmentProducts(shipment:Shipment|undefined,owner:string,groups:{id:string;itens?:{produto:string}[];ordens:{produto:string}[]}[]):string[];
export function directBoxOnly(products:string[]):boolean;
export function hasInnerBoxes(s:Shipment):boolean;
export function applyDirectBoxRule(s:Shipment,products:string[]):Shipment;
