import {env} from "../../../../lib/server-env";
import {pollNomus} from "../../../../lib/nomus-store";
export const dynamic="force-dynamic";
export const maxDuration=60;
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(request:Request){
 const secret=env.CRON_SECRET;
 // Fail closed before any DB access. Never accept a query-string credential.
 if(!secret||secret.length<32)return json({error:"Agendamento nao configurado."},503);
 if(request.headers.get("authorization")!=="Bearer "+secret)return json({error:"Nao autorizado."},401);
 try{
  const result=await pollNomus();
  return json({status:result.refreshStatus,lastChecked:result.lastChecked},result.refreshStatus==="failed"||result.refreshStatus==="unconfigured"?503:200);
 }catch{return json({error:"Captura indisponivel; dados anteriores preservados."},503)}
}
