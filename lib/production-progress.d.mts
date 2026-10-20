import type {ShippingOP} from "./shipping.mjs";
export function productionProgress(op:ShippingOP):{state:string;label:string;remaining:number|null;percent:number|null};
export function productionSummary(ops:ShippingOP[]):{total:number;complete:number;unconfirmed:number;state:string};
