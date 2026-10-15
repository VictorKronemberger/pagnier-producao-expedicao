import {pendingReleaseItems,pendingFulfillmentItems} from "../lib/order-release.mjs";
type Item={status?:number;item?:string;produto:string;quantidade:string;unidade:string};
export default function OrderReleaseNotice({order,compact=false}:{order:{liberacao?:string;itens?:Item[]};compact?:boolean}){
 if(order.liberacao==="unknown")return <span className="release-state release-unknown" title="O pedido permanece na etapa salva enquanto a consulta ao Nomus confirma a liberação.">Consultando liberação</span>;
 const fulfillment=pendingFulfillmentItems(order),pending=fulfillment.length?fulfillment:pendingReleaseItems(order);if(!pending.length)return null;
 const content=<ul>{pending.map((item,i)=><li key={item.item||i}><span>{item.item&&<small>Item {item.item} · </small>}{item.produto||"Produto aguardando consulta"}{fulfillment.length>0&&<small className="fulfillment-item-status">{item.status===3?"Atendido parcialmente":item.status===1?"Aguardando liberação":"Ainda não atendido · liberado"}</small>}</span><strong title={fulfillment.length?"Quantidade pedida; o saldo atendido não é informado pela API":undefined}>{item.quantidade} {item.unidade}</strong></li>)}</ul>;
 const title=pending.length+(fulfillment.length?(pending.length===1?" item com atendimento pendente":" itens com atendimento pendente"):(pending.length===1?" item aguardando liberação":" itens aguardando liberação"));
 return compact?<details className="release-notice compact"><summary>{title}</summary>{content}</details>:<section className="release-notice" aria-label={fulfillment.length?"Itens com atendimento pendente":"Itens aguardando liberação"}><strong>{title}</strong>{content}</section>;
}
