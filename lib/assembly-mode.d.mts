import type {Shipment} from "./shipping.mjs";
export type AssemblyMode="direct"|"inner"|"bags"|"mixed";
export const ASSEMBLY_MODES:{id:AssemblyMode;label:string;description:string}[];
export function assemblyMode(s?:Shipment):AssemblyMode|"";
export function assemblyModeIssue(s:Shipment,mode:string):string;
export function selectAssemblyMode(s:Shipment,mode:AssemblyMode):Shipment;
