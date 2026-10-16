import {env} from "cloudflare:workers";
import {getChatGPTUser} from "../app/chatgpt-auth";
import {ChatError,sessionEmployee} from "./team-chat.mjs";
import {readNomus} from "./nomus-store";
import {visibleOrderState} from "./order-visibility.mjs";
import {publicSync} from "./nomus-sync.mjs";
export function chatJson(data:unknown,status=200,headers:Record<string,string>={}){return Response.json(data,{status,headers:{"Cache-Control":"no-store",...headers}})}
export function chatFailure(error:unknown){return chatJson({error:error instanceof ChatError?error.message:"Não foi possível acessar as mensagens. Tente novamente."},error instanceof ChatError?error.status:503)}
export function chatToken(request:Request){return request.headers.get("cookie")?.split(";").map(s=>s.trim()).find(s=>s.startsWith("pagnier_chat="))?.slice(13)??""}
export function chatCookie(request:Request,token:string){return `pagnier_chat=${token}; Path=/api/chat; HttpOnly; SameSite=Strict; Max-Age=${token?30*86400:0}${new URL(request.url).protocol==="https:"?"; Secure":""}`}
export async function chatDatabase(request:Request,write=false){
 if(!await getChatGPTUser())throw new ChatError("Entre no painel para acessar as mensagens.",401);
 if(write&&request.headers.get("origin")!==new URL(request.url).origin)throw new ChatError("Origem inválida.",403);
 if(!env.DB)throw new ChatError("Banco de mensagens indisponível.",503);
 return env.DB;
}
export async function chatIdentity(request:Request,write=false){const db=await chatDatabase(request,write);const employee=await sessionEmployee(db,chatToken(request));if(!employee)throw new ChatError("Entre com seu nome e PIN para usar as mensagens.",401);return {db,employee}}
export async function chatBody(request:Request){if(Number(request.headers.get("content-length"))>12000)throw new ChatError("Mensagem muito grande.",413);const raw=await request.text();if(new TextEncoder().encode(raw).length>12000)throw new ChatError("Mensagem muito grande.",413);try{const value=JSON.parse(raw);if(!value||typeof value!=="object"||Array.isArray(value))throw new Error();return value}catch{throw new ChatError("Dados inválidos.")}}
export async function chatAllowedOrders(){const snapshot=publicSync(visibleOrderState((await readNomus()).state),false).snapshot;return new Set<string>([...snapshot.grupos,...(snapshot.pedidos??[])].map((g:any)=>g.id))}
