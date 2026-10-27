import {env} from "../../../lib/server-env";
import {getPanelUser} from "../../employee-auth";
import {readNomus} from "../../../lib/nomus-store";
import {visibleOrderState} from "../../../lib/order-visibility.mjs";
import {publicSync} from "../../../lib/nomus-sync.mjs";
import {scopeBoard} from "../../../lib/company-scope.mjs";
import {readOrderHistory} from "../../../lib/order-history-store.mjs";
export const dynamic="force-dynamic";
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(request:Request){
 if(!await getPanelUser())return json({error:"Entre para consultar o histórico."},401);
 if(!env.DB)return json({error:"Banco indisponível."},503);
 const query=new URL(request.url).searchParams,orderId=query.get("orderId"),cursor=query.get("before");
 if(!orderId||orderId.length>150||cursor!==null&&(!/^[1-9]\d*$/.test(cursor)||!Number.isSafeInteger(Number(cursor))))return json({error:"Pedido ou página inválida."},400);
 try{
 const state=visibleOrderState((await readNomus()).state),snapshot=publicSync(state,false).snapshot;
 const row=await env.DB.prepare("SELECT payload FROM production_board WHERE id=?").bind("main").first<{payload:string}>();
 const board=scopeBoard(row?JSON.parse(row.payload):{sequence:[],details:{}},state.hiddenOrderCodes);
 const allowed=[...snapshot.grupos,...(snapshot.pedidos??[])].some((o:{id:string})=>o.id===orderId)||!!board.details[orderId]?.arquivado;
 if(state.hiddenOrderCodes?.[orderId]||!allowed)return json({error:"Pedido indisponível."},404);
 return json(await readOrderHistory(env.DB,orderId,cursor?Number(cursor):undefined,state.hiddenOrderCodes));
 }catch{return json({error:"Não foi possível carregar o histórico. Tente novamente."},503)}
}
