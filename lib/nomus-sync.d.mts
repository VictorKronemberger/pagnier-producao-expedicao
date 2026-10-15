export function creationDate(value:unknown):string;
export function initialSync(snapshot:any):any;
export function publicSync(state:any,configured:boolean):any;
export function syncStep(previous:any,key:string,options?:{fetcher?:typeof fetch;now?:string;requestedLots?:string[]}):Promise<any>;
export function nomusGet(path:string,key:string,fetcher?:typeof fetch):Promise<any>;