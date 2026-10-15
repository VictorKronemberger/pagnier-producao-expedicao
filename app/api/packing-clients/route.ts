import {visibleOrderState} from "../../../lib/order-visibility.mjs";
import {getChatGPTUser} from "../../chatgpt-auth";
import {readNomus,readNomusClient} from "../../../lib/nomus-store";
import {clientOptions,clientDocument,clientKey} from "../../../lib/packing-client.mjs";
export const dynamic="force-dynamic";
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:Request){
 if(!await getChatGPTUser())return json({error:"Entre para acessar os dados documentais."},401);
 try{
 const state=visibleOrderState((await readNomus()).state),url=new URL(request.url),options=await clientOptions(state);
 const key=url.searchParams.get("key");
 if(key){const selected=options.find(c=>c.key===key);if(!selected)return json({error:"Cliente não encontrado nos pedidos permitidos."},404);return json({key,cliente:clientDocument(await readNomusClient(selected.id))})}
 const order=Object.values(state.orders??{}).find((o:any)=>o.code===url.searchParams.get("order")) as any;
 return json({clientes:options.map(({key,nome})=>({key,nome})).sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")),selecionado:order?await clientKey(order.clientId):"",porPedido:Object.fromEntries(await Promise.all(Object.values(state.orders??{}).map(async(o:any)=>[o.code,await clientKey(o.clientId)])))});
 }catch{return json({error:"Não foi possível consultar o cadastro do Nomus. Tente novamente; os campos manuais continuam disponíveis."},503)}
}
