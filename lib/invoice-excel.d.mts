import type {Invoice} from "./invoice.mjs";
export function invoiceWorkbook(value:Invoice):Promise<any>;
export function invoiceExcelBlob(value:Invoice):Promise<Blob>;
