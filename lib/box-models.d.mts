import type {ShippingBox} from "./shipping.mjs";
export type BoxModel={id:string;nome:string;comprimentoCm:string;larguraCm:string;alturaCm:string;pesoMaximoKg:string;taraKg:string};
export const modelFields:(keyof Omit<BoxModel,"id">)[];
export function normalizeBoxModels(value?:unknown):BoxModel[];
export function boxFromModel(boxes:ShippingBox[],id:string,model?:BoxModel):ShippingBox;
