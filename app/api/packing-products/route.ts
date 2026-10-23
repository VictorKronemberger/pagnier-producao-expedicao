import {getPanelUser} from "../../employee-auth";
import {readNomus,readNomusProduct} from "../../../lib/nomus-store";
import {publicSync} from "../../../lib/nomus-sync.mjs";
import {stockItems} from "../../../lib/stock-orders.mjs";
import {documentProductId,productDocumentData} from "../../../lib/packing-product-data.mjs";
export const dynamic="force-dynamic";
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:Request){
 if(!await getPanelUser())return json({error:"Entre para consultar os produtos."},401);
 const id=new URL(request.url).searchParams.get("op");if(!id||id.length>150)return json({error:"Informe a OP do item."},400);
 try{
 const {state}=await readNomus(),snapshot=publicSync(state,true).snapshot;
 const ops=[...snapshot.grupos.flatMap((g:any)=>g.ordens),...(snapshot.pedidos??[]).flatMap((g:any)=>g.ordens.length?g.ordens:stockItems(g))];
 const op=ops.find((op:any)=>op.id===id);if(!op)return json({error:"Item fora dos pedidos disponíveis."},404);
 const productId=documentProductId(state,op);if(!productId)return json({error:"Atualize o pedido no Nomus para identificar o produto."},409);
 const product=await readNomusProduct(productId);
 if(product?.id!==productId)return json({error:"Produto não confirmado pelo Nomus."},502);
 return json(productDocumentData(product,op));
 }catch{return json({error:"Não foi possível confirmar a referência e o NCM do produto. Atualize o pedido ou tente novamente."},503)}
}
