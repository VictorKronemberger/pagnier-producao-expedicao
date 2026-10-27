import ProductIdentity from "./product-identity";
import {pendingReleaseItems,pendingFulfillmentItems} from "../lib/order-release.mjs";
import styles from "./order-status.module.css";
type Item={sku?:string;status?:number;item?:string;produto:string;quantidade:string;unidade:string};
export default function OrderReleaseNotice({order,compact=false}:{order:{pedidoConsultaFalhou?:boolean;pedidoConsultadoEm?:string|null;liberacao?:string;itens?:Item[]};compact?:boolean}){
 if(order.pedidoConsultaFalhou)return <span className="release-state release-unknown" title="Não foi possível atualizar este pedido na última consulta ao Nomus. Isso não confirma exclusão nem alteração do atendimento. Os dados anteriores foram preservados.">Consulta do pedido indisponível · dados anteriores preservados</span>;
 if(order.liberacao==="unknown")return <span className="release-state release-unknown" title="O pedido permanece na etapa salva enquanto a consulta ao Nomus confirma a liberação.">Consultando liberação</span>;
 const waiting=pendingReleaseItems(order),commercial=pendingFulfillmentItems(order).filter(i=>Number(i.status)!==1);
 const checked=order.pedidoConsultadoEm?new Date(order.pedidoConsultadoEm):null;
 const timestamp=checked&&!Number.isNaN(checked.getTime())?<p>Pedido consultado em {checked.toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})} (Brasília).</p>:null;
 const rows=(items:Item[],showStatus=false)=><ul>{items.map((item,i)=><li key={item.item||i}><span>{item.item&&<small>Item {item.item} · </small>}<ProductIdentity sku={item.sku} name={item.produto}/>{showStatus&&<small className="fulfillment-item-status">Status no pedido: {Number(item.status)===3?"Atendido parcialmente":"Liberado"}</small>}</span><strong>{showStatus&&"Pedido: "}{item.quantidade} {item.unidade}</strong></li>)}</ul>;
 const waitingTitle=waiting.length+(waiting.length===1?" item aguardando liberação":" itens aguardando liberação");
 return <>{waiting.length>0&&(compact?<details className="release-notice compact"><summary>{waitingTitle}</summary>{rows(waiting)}</details>:<section className="release-notice" aria-label="Itens aguardando liberação"><strong>{waitingTitle}</strong>{rows(waiting)}{timestamp}</section>)}{commercial.length>0&&<details className={styles.commercial+" order-commercial"+(compact?" "+styles.compact:"")}><summary>Ver situação do pedido no Nomus</summary><p>Estes são os status do pedido de venda. Para saber o que já foi feito, veja a coluna <strong>Produzido</strong> na Expedição.</p>{rows(commercial,true)}{timestamp}</details>}</>;
}
