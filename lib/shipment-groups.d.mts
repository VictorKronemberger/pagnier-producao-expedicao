import type {Shipment,ShippingOP,Packing} from "./shipping.mjs";
export type ShipmentGroup={pedidos:string[];titularKey:string;titularNome:string;confirmadoEm:string};
export function shipmentOwner(board:any,id:string):string;
export function shipmentOps(shipment:Shipment|undefined,owner:string,groups:{id:string;ordens:ShippingOP[]}[]):ShippingOP[];
export function normalizeGrouping(g:unknown):ShipmentGroup|undefined;
export function validateGroups(board:any,groups:{id:string}[]):void;
export function mergeShipment(board:any,owner:string,ids:string[],holder:{key:string;nome:string},packingPatch:Partial<Packing>,now:string,idFactory:()=>string):Shipment;
