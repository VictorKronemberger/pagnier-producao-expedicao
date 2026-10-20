export type ArchiveRecord={motivo?:"manual"|"nomus_deleted";observacao?:string;em?:string;por?:string;cliente?:string;restauradoEm?:string;restauradoPor?:string};
export const archiveReasons:Record<string,string>;
export function archiveOrders(snapshot:any,board:any):any[];
export function changeArchive(board:any,order:any,input:{archived:boolean;reason?:string;note?:string;confirmedDeleted?:boolean},actor:string,now:string):any;
