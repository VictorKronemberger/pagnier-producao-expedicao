import type {ShippingItem,Shipment,ShippingOP} from "./shipping.mjs";
export function contentPerPack(item:ShippingItem):bigint|null;
export function updatePackingItem(item:ShippingItem,patch:Partial<ShippingItem>):ShippingItem;
export function productFieldsForOP(shipment:Shipment,op:ShippingOP|undefined,exceptId:string):Partial<ShippingItem>;

export function fillProductWeights(shipment:Shipment,ops:ShippingOP[]):Shipment;

export function needsPackContent(item:ShippingItem):boolean;
export function isUnitQuantity(item:ShippingItem):boolean;
export function fillProductLots(shipment:Shipment,ops:ShippingOP[]):Shipment;
export function lotDefaults(item:Partial<ShippingItem>,op:ShippingOP|undefined):Partial<ShippingItem>;
