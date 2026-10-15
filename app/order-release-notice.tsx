import {pendingReleaseItems} from "../lib/order-release.mjs";
type Item={status?:number;item?:string;produto:string;quantidade:string;unidade:string};
export default function OrderReleaseNotice({order,compact=false}:{order:{itens?:Item[]};compact?:boolean}){
 const pending=pendingReleaseItems(order);if(!pending.length)return null;
 const content=<ul>{pending.map((item,i)=><li key={item.item||i}><span>{item.item&&<small>Item {item.item} · </small>}{item.produto||"Produto aguardando consulta"}</span><strong>{item.quantidade} {item.unidade}</strong></li>)}</ul>;
 const title=pending.length+(pending.length===1?" item aguardando liberação":" itens aguardando liberação");
 return compact?<details className="release-notice compact"><summary>{title}</summary>{content}</details>:<section className="release-notice" aria-label="Itens aguardando liberação"><strong>{title}</strong>{content}</section>;
}
