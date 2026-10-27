import {Check,Package} from "lucide-react";
import {smallBoxProgress} from "../lib/small-box-progress.mjs";
import {smallBoxQuantity} from "../lib/small-box-search.mjs";
import type {Shipment,ShippingOP} from "../lib/shipping.mjs";
export default function SmallBoxProgress({shipment,ops,onOpen}:{shipment:Shipment;ops:ShippingOP[];onOpen:(id:string,outerId:string)=>void}) {
 const hasBags=[...(shipment.caixasEmMontagem??[]),...shipment.caixas.flatMap(b=>b.caixasInternas??[])].some(b=>b.tipo==="bag");
 const {ready,pending,draftCount}=smallBoxProgress(shipment,ops);
 return <section className="small-progress" aria-label="Progresso das caixas menores">
  <section className="small-progress-panel" aria-label="Produtos que faltam montar">
   <header><div><h4>O que falta montar</h4><p>Veja o que ainda precisa separar ou finalizar.</p></div><span>{pending.length} {pending.length===1?"produto":"produtos"}</span></header>
   <div className="small-progress-list">{pending.map(row=><div className="small-progress-product" key={row.opId}>
    <div><strong>{row.produto}</strong><small>{row.opId} · Pedido: {row.target??"a confirmar"} {row.unidade}</small>{row.hasDraft&&<small>{row.draft} {row.unidade} em caixas ainda não finalizadas</small>}</div>
    <b className={row.invalid||row.excess?"needs-review":""}>{row.invalid?"Revisar quantidades":row.excess?"Excesso: "+row.remaining+" "+row.unidade:row.remaining===null?"Confirmar pedido":row.remainingScaled===BigInt(0)?"Finalizar caixas":"Faltam "+row.remaining+" "+row.unidade}</b>
   </div>)}</div>
   {!pending.length&&<p className="small-progress-empty"><Check size={16}/>Todos os produtos estão separados nas caixas.</p>}
   <p className="small-progress-note">{draftCount?draftCount+" caixa(s) em montagem. Confira e finalize para deixá-las prontas.":(hasBags?"Nenhuma bag em montagem.":"Nenhuma caixa menor em montagem.")} O saldo já desconta os produtos separados, inclusive nas caixas em montagem.</p>
  </section>
  <section className="small-progress-panel" aria-label="Caixas menores já montadas">
   <header><div><h4>{hasBags?"Bags e caixas já montadas":"Caixas menores já montadas"}</h4><p>Prontas para distribuir ou já colocadas nas Caixas 40.</p></div><span>{ready.length} {ready.length===1?"caixa":"caixas"}</span></header>
   <div className="small-progress-list">{ready.map(box=><div className="small-progress-ready" key={box.outerId+":"+box.id}>
    <Package size={17}/><div><strong>{box.codigo}</strong><small>{box.location}</small><details><summary>Ver produtos</summary>{box.itens.map(item=><p key={item.id}>{item.produto} · {smallBoxQuantity([item])}</p>)}</details></div><b>{smallBoxQuantity(box.itens)}</b><button type="button" className="text-action" onClick={()=>onOpen(box.id,box.outerId)}>{hasBags?"Ver embalagem":"Ver caixa"}</button>
   </div>)}</div>
   {!ready.length&&<p className="small-progress-empty">{hasBags?"Nenhuma embalagem finalizada ainda.":"Nenhuma caixa menor finalizada ainda."}</p>}
  </section>
 </section>;
}
