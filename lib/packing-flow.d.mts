import type {Packing} from "./shipping.mjs";
import type {ClientDocument} from "./packing-client.mjs";
export function recipientPatch(existing:Partial<Packing>|undefined,doc:ClientDocument,address:string,replace?:boolean):Partial<Packing>;
export function pendingOrderSelection(ids:string[],confirmed:string[]):boolean;
export function bridgeDestination(previous:import("./shipping.mjs").Shipment|undefined,next:import("./shipping.mjs").Shipment):import("./shipping.mjs").Shipment;
