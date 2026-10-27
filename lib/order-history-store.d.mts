import type {PostgresDatabase} from "./postgres-adapter.mjs";
export type HistoryChange={field:string;before:string;after:string};
export type HistoryEntry={id:string;revision:number;at:string;actor:string;changes:HistoryChange[]};
export function saveBoardWithHistory(db:PostgresDatabase,previous:any,next:any,revision:number,actor:string,at:string):Promise<any>;
export function readOrderHistory(db:PostgresDatabase,orderId:string,before?:number,hidden?:Record<string,boolean>):Promise<{entries:HistoryEntry[];nextCursor:number|null}>;
