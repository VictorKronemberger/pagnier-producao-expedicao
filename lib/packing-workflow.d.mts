import type {Shipment,ShippingOP} from "./shipping.mjs";
export const PACKING_STEPS:{id:string;title:string}[];
export function packingWorkflow(shipment:Shipment|undefined,ops:ShippingOP[]):{physical:ReturnType<typeof import("./box-review.mjs").inspectBoxReview>;report:ReturnType<typeof import("./packing-list.mjs").inspectPacking>;recipientIssues:string[];itemIssues:string[];documentIssues:string[];ready:boolean;next:string;states:Record<string,{done:boolean;count:number}>;action:string};
