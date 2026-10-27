const value=v=>String(v??'').trim().slice(0,700);
const fact=(label,v)=>({label,value:value(v)});
export function opFacts(o,orders={}){
 const fields={sku:fact('SKU do produto',o.codigoProduto),produto:fact('Produto',o.descricaoProduto),quantidade:fact('Quantidade',o.qtde),unidade:fact('Unidade',o.unidadeMedida),situacao:fact('Situação',o.status),tipo:fact('Tipo de ordem',o.tipoOrdem),criacao:fact('Criação',o.dataHoraCriacao),entrega:fact('Entrega prevista',o.dataHoraEntrega),inicio:fact('Início planejado',o.dataHoraInicialPlanejada),liberacao:fact('Liberação',o.dataHoraLiberacao)};
 const links=[...new Set((o.itensPedido??[]).map(i=>orders[i.idPedido]?.code||'Pedido #'+i.idPedido))].sort();
 fields.pedidos=fact('Pedidos vinculados',links.join(', '));return fields;
}
export function orderFacts(p,clients={},products={}){
 const fields={codigo:fact('Código do pedido',p.codigoPedido),cliente:fact('Cliente',clients[p.idPessoaCliente]||'Cliente #'+p.idPessoaCliente),criacao:fact('Criação do pedido',p.dataCriacao),emissao:fact('Emissão',p.dataEmissao),entrega:fact('Entrega prevista',p.dataEntregaPadrao)};
 for(const [index,i] of (p.itensPedido??[]).entries()){
 const key=String(i.id??i.item??index),label='Item '+String(i.item??index+1);
 fields[key+':produto']=fact(label+' · produto',products[i.idProduto]?.name||'Produto #'+i.idProduto);
 fields[key+':quantidade']=fact(label+' · quantidade',i.quantidade);
 fields[key+':situacao']=fact(label+' · situação (código Nomus)',i.status);
 }
 return fields;
}
export function diffFacts(before,after){if(!before)return [];return [...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>before[k]?.value!==after[k]?.value).map(k=>({label:after[k]?.label||before[k].label,before:before[k]?.value??'Não existia',after:after[k]?.value??'Removido'}));}
export function newFacts(facts){return Object.values(facts??{}).filter(f=>f.value).map(f=>({label:f.label,before:'Não existia',after:f.value}));}
