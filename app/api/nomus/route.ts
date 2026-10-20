import {getPanelUser} from "../../employee-auth";
import {pollNomus,readNomus,nomusKey} from "../../../lib/nomus-store";
import {publicSync} from "../../../lib/nomus-sync.mjs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(){if(!await getPanelUser())return json({error:"Entre para acessar."},401);try{return json(publicSync((await readNomus()).state,!!nomusKey()))}catch{return json({error:"Não foi possível consultar a conexão."},503)}}
export async function POST(request:Request){
 if(!await getPanelUser())return json({error:"Entre para atualizar."},401);
 if(request.headers.get("origin")!==new URL(request.url).origin)return json({error:"Origem inválida."},403);
 let requestedProduction:string[]=[],manualRefresh=false,requestedOrder="",knownRevision:number|undefined;
 const body=await request.text();
 if(body){try{const value=JSON.parse(body);if(value?.orderCode!==undefined&&(typeof value.orderCode!=="string"||value.orderCode.length>100||!value.orderCode.trim()))return json({error:"Pedido inválido."},400);requestedOrder=value?.orderCode??"";if(typeof value?.refresh!=="undefined"&&typeof value.refresh!=="boolean")return json({error:"Atualização inválida."},400);manualRefresh=value?.refresh===true;if(value.knownRevision!==undefined&&(!Number.isSafeInteger(value.knownRevision)||value.knownRevision<0))return json({error:"Revisão inválida."},400);knownRevision=value.knownRevision;if(!Array.isArray(value.productionOps)||value.productionOps.length>20||value.productionOps.some((n:unknown)=>typeof n!=="string"||!/^OP[0-9]{1,12}$/.test(n)))return json({error:"Lista de OPs inválida."},400);requestedProduction=value.productionOps}catch{return json({error:"Consulta inválida."},400)}}
 try{return json(await pollNomus(requestedProduction,manualRefresh,knownRevision,requestedOrder))}catch{return json({error:"Consulta indisponível. Dados anteriores preservados."},503)}
}
