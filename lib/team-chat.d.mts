export class ChatError extends Error {status:number;constructor(message:string,status?:number)}
export const SESSION_DAYS:number;
export const randomToken:()=>string;
export function tokenHash(token:string):Promise<string>;
export function pinHash(pin:string,salt:string):Promise<string>;
export type ChatMessage={id:number;channel:string;author:string;body:string;mentions:string[];reference:string;createdAt:string};
export type ChatChannel={channel:string;lastId:number;lastAt:string;count:number;unread:number;mentions:number};
export function loginChat(db:any,input:{name:string;pin:string;register?:boolean},now?:number):Promise<{token:string;name:string}>;
export function sessionEmployee(db:any,token:string,now?:number):Promise<string|null>;
export function assertChannel(channel:string,allowed:Set<string>):string;
export function validateMessage(input:any,allowed:Set<string>):{channel:string;body:string;clientId:string;reference:string;mentions:string[]};
export function sendMessage(db:any,employee:string,input:any,allowed:Set<string>,now?:string):Promise<ChatMessage>;
export function publicMessage(m:any):ChatMessage;
export function chatSummary(db:any,employee:string,allowed:Set<string>):Promise<ChatChannel[]>;
export function readMessages(db:any,channel:string,before?:number):Promise<{messages:ChatMessage[];hasOlder:boolean}>;
export function markRead(db:any,employee:string,channel:string,id:number):Promise<void>;
