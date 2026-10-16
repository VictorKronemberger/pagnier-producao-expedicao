import type {Shipment,ShippingOP} from "./shipping.mjs";
export type DocumentationEntry={owner:string;orders:{id:string;codigo:string;cliente:string}[];boxes:number;reviewedBy:string;reviewedAt:string;carrier:string};
export function documentationReady(board:{details:Record<string,{envio?:Shipment;situacao?:string}>},groups:{id:string;codigo:string;cliente:string;ordens:ShippingOP[]}[]):DocumentationEntry[];
