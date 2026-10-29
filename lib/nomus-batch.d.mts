export const CAPTURE_INTERVAL_MS:number;
export function runNomusBatch(previous:any,key:string,options?:{fetcher?:typeof fetch;clock?:()=>number;pause?:(ms:number)=>Promise<void>;requestedLots?:string[];requestedProduction?:string[];requestedOrder?:string}):Promise<any>;
