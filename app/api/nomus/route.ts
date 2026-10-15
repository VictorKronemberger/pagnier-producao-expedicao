import {getChatGPTUser} from "../../chatgpt-auth";
import {pollNomus,readNomus,nomusKey} from "../../../lib/nomus-store";
import {publicSync} from "../../../lib/nomus-sync.mjs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(){if(!await getChatGPTUser())return json({error:"Entre para acessar."},401);try{return json(publicSync((await readNomus()).state,!!nomusKey()))}catch{return json({error:"Não foi possível consultar a conexão."},503)}}
export async function POST(request:Request){
 if(!await getChatGPTUser())return json({error:"Entre para atualizar."},401);
 if(request.headers.get("origin")!==new URL(request.url).origin)return json({error:"Origem inválida."},403);
 try{return json(await pollNomus())}catch{return json({error:"Consulta indisponível. Dados anteriores preservados."},503)}
}
