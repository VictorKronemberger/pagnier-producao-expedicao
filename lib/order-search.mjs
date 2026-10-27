const normalize=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim().replace(/\s+/g," ");
const number=value=>value.replace(/^0+(?=\d)/,"");
export function matchesOrderSearch(order,search){
 const query=normalize(search);if(!query)return true;
 const text=normalize([order.codigo,order.cliente,...(order.itens??[]).flatMap(i=>[i.produto,i.sku]),...(order.ordens??[]).flatMap(o=>[o.nome,o.produto,o.sku])].join(" "));
 if(text.includes(query))return true;
 const requested=query.match(/^(?:(?:pd|pv|pedido(?: de venda)?)\s*[-:#º°]?\s*)?#?\s*(\d+)$/);
 const code=normalize(order.codigo).match(/^(?:(?:pd|pv)\s*[-:#]?\s*)?(\d+)$/);
 return !!(requested&&code&&number(requested[1])===number(code[1]));
}
