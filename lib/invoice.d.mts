import type {Shipment} from "./shipping.mjs";
export type Party=Record<"company"|"taxId"|"stateReg"|"address"|"city"|"state"|"country"|"zip"|"phone"|"email"|"contact"|"department",string>;
export type InvoiceLine={sourceRef:string;sourceData:string;id:string;sourceOrder:string;sourceKey:string;marks:string;packages:string;packaging:string;description:string;hsCode:string;partNumber:string;quantity:string;unit:string;unitWeightKg:string;unitValue:string};
export type Invoice={id:string;carrier:"FedEx"|"DHL";orderIds:string[];shipper:Party;consignee:Party;buyer:Party;items:InvoiceLine[]}&Record<"sourceBase"|"passport"|"number"|"date"|"dataEnvio"|"exportDate"|"waybill"|"exportReferences"|"countryExport"|"countryManufacture"|"countryDestination"|"currency"|"freight"|"packagesTotal"|"location"|"signerName"|"signerTitle"|"signerId"|"signatureDate"|"notes",string>;
export const partyFields:Record<keyof Party,number>;
export const invoiceFields:Record<string,number>;
export const lineFields:Record<string,number>;
export function emptyParty():Party;
export function emptyInvoice(id:string,carrier?:"FedEx"|"DHL"):Invoice;
export function newInvoiceLine(id:string):InvoiceLine;
export function canonicalInvoice(value:Invoice):Invoice;
export function canonicalInvoices(values?:Record<string,Invoice>):Record<string,Invoice>;
export function normalizeInvoices(values:unknown,allowedIds:string[]):Record<string,Invoice>;
export function numericDraft(v:string,places?:number):boolean;
export function inspectInvoice(value:Invoice):{invoice:Invoice;rows:(InvoiceLine&{amount:bigint|null;weight:bigint|null})[];subtotal:bigint;freight:bigint|null;total:bigint;weight:bigint;quantity:bigint;issues:string[]};
export function fixedText(n:bigint|null,places?:number):string;
export function addInvoiceSources(invoice:Invoice,orders:any[],shipment:Shipment|undefined,idFactory:()=>string):Invoice;
export function fillInvoiceFromShipment(invoice:Invoice,shipment:Shipment|undefined):Invoice;
export function invoiceInScope(invoice:Invoice,codes?:Record<string,boolean>):boolean;

export function invoiceSourceStatus(invoice:Invoice,orders:any[],shipment:Shipment|undefined):{linked:boolean;changed:boolean;fingerprint:string;fromBoxes:boolean;packagesTotal:string;rows:any[];physical:string};
export function previewInvoiceSources(invoice:Invoice,orders:any[],shipment:Shipment|undefined,idFactory:()=>string):ReturnType<typeof invoiceSourceStatus>&{next:Invoice;changes:{product:string;before:string;after:string;note:string}[];removedDuplicates:number};

export function fillInvoiceCodes(invoice:Invoice,orders:any[],shipment?:Shipment):Invoice;
