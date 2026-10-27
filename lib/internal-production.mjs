export function isInternal(op){return [op.unidade,op.nome,op.produto].some(v=>/(?:^|[\s\d(])kg(?=$|[\s.,;:/)\-])/i.test(String(v??"")))}
export function groupInternal(ops){
 const groups=new Map();
 for(const op of ops){const key=op.sku||op.produto.trim()||"Produto não identificado";if(!groups.has(key))groups.set(key,[]);groups.get(key).push(op)}
 return [...groups].sort(([a],[b])=>a.localeCompare(b,"pt-BR")).map(([key,orders])=>({product:orders[0].produto,sku:orders[0].sku??"",key,orders:orders.sort((a,b)=>(a.criacao||"9999").localeCompare(b.criacao||"9999")||a.nome.localeCompare(b.nome,"pt-BR",{numeric:true}))}));
}
