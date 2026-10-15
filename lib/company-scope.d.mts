export const EXCLUDED_COMPANY_ID:2;
export function excludeCompanyOrder(state:any,id:string|number,code:string):void;
export function applyCompanyScope(state:any):any;
export function scopeBoard<T extends {sequence:string[];details:Record<string,any>}>(board:T,codes?:Record<string,boolean>):T;
export function preserveExcludedNotes(previous:any,visible:any,codes?:Record<string,boolean>):any;

export function companyId(value:unknown):number|null;

export function isMedicineName(value:unknown):boolean;
