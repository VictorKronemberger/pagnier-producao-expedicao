import type {Invoice} from "./invoice.mjs";
export function invoiceDefinition(value:Invoice,options?:{draft?:boolean}):any;
export function invoicePdfBlob(value:Invoice,options?:{draft?:boolean}):Promise<Blob>;
export function partyText(value:any):string;
