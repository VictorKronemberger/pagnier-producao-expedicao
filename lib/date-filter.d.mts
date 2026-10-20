export const SITE_START_DATE:string;
export const SITE_START_LABEL:string;
export function clampStart(value:string):string;
export function matchesCreation(op:{criacao?:string},mode:string,start:string,end:string):boolean;export function matchesOrderCreation(order:{criacao?:string;ordens?:{criacao?:string}[]},mode:string,start:string,end:string):boolean;
