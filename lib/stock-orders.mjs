import {canQueue} from "./order-release.mjs";
import {decimal} from "./shipping.mjs";
// Identity excludes quantity so updates retain allocation; duplicate sale lines are aggregated.
export function stockItems(order){
 const items=new Map();
 for(const item of order.itens??[]){
 const product=String(item.produto??"").trim(),unit=String(item.unidade??"").trim(),q=decimal(String(item.quantidade??""));
 if(!product||product==="Produto aguardando consulta"||!unit||q===null||q<=0)return [];
 const key=JSON.stringify([order.id,product,unit]);let h=14695981039346656037n;
 for(let i=0;i<key.length;i++){h^=BigInt(key.charCodeAt(i));h=BigInt.asUintN(64,h*1099511628211n)}
 const id="stock-"+h.toString(16),old=items.get(id);
 items.set(id,{id,nome:"Estoque",produto:product,unidade:unit,quantidade:String(Math.round(((old?Number(old.quantidade):0)+q)*1000)/1000),criacao:order.criacao??"",estoque:true});
 }
 return [...items.values()].sort((a,b)=>a.id.localeCompare(b.id));
}
export function stockEligibility(order){
 if(order&&!canQueue(order))return "Aguarde a liberação do pedido no Nomus.";
 if(!order||order.ordens?.length||order.vinculo!=="none")return "Aguarde a confirmação de que o pedido não possui OP.";
 if(!stockItems(order).length)return "Aguarde os produtos, unidades e quantidades do pedido no Nomus.";
 return "";
}
export function operationalGroups(snapshot,board){
 const groups=new Map((snapshot?.grupos??[]).map(g=>[g.id,g]));
 for(const g of snapshot?.pedidos??[]){const current=groups.get(g.id);if(current)groups.set(g.id,{...g,...current,criacao:current.criacao||g.criacao,itens:current.itens?.length?current.itens:g.itens});else if(board.details?.[g.id]?.atendimentoEstoque)groups.set(g.id,g)}
 return [...groups.values()].map(g=>board.details?.[g.id]?.atendimentoEstoque&&!g.ordens.length?{...g,estoque:true,ordens:stockItems(g)}:g);
}

// Whole-order routing: never bypass production for mixed or unclassified orders.
export function autoResaleShipping(order){
 return order?.liberacao==="released"&&!stockEligibility(order)&&order.itens.every(item=>
  String(item.tipoProduto??"").trim().toLowerCase()==="mercadoria para revenda"&&[2,3].includes(Number(item.status)));
}
