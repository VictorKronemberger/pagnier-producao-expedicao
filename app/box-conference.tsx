"use client";
import ProductIdentity from "./product-identity";
import {Box,Package,ClipboardCheck,ChevronDown,Ruler,ShoppingBag} from "lucide-react";
import {sourceProductSku} from "../lib/product-code.mjs";
import {isMounted} from "../lib/ready-boxes.mjs";
import {inspectBoxReview,confirmBoxReview} from "../lib/box-review.mjs";
import {weightText} from "../lib/packing-list.mjs";
import type {Shipment,ShippingOP} from "../lib/shipping.mjs";
const innerLabel=(code:string)=>code.replace(/(?: \(\d+\))+$/,suffix=>suffix.replace(/ \((\d+)\)/g," · Cópia $1"));
export default function BoxConference({value,ops,person,disabled,onChange,onDocuments}:{value?:Shipment;ops:ShippingOP[];person:string;disabled:boolean;onChange:(value:Shipment)=>void;onDocuments:()=>void}){
 const state=inspectBoxReview(value,ops);
 const ready=state.report.boxes.filter(isMounted);
 return <section className="box-conference" aria-label="Conferir volumes físicos">
 <div className="conference-heading"><span className="conference-heading-icon"><ClipboardCheck size={22} aria-hidden="true"/></span><div><h3>Conferir caixas montadas</h3><p>Compare os volumes e abra cada caixa para conferir o conteúdo.</p></div></div>
 <details className="assembly-review-summary conference-summary" open>
 <summary><span><Package size={17} aria-hidden="true"/>Volumes do envio <b>{ready.length}</b></span><ChevronDown size={17} className="conference-chevron" aria-hidden="true"/></summary>
 <div className="conference-boxes">
 {ready.map(b=><details className="conference-box" key={b.id}>
 <summary>
 <span className="conference-identity"><span className="conference-box-icon"><Box size={23} aria-hidden="true"/></span><span><strong>{b.codigo}</strong>{b.modeloNome&&<small>{b.modeloNome}</small>}<small>{b.itens.length} {b.itens.length===1?"item":"itens"} no volume</small></span></span>
 <span className="conference-metrics">
 <span className="conference-dimensions"><span><Ruler size={13} aria-hidden="true"/>Medidas</span><strong>{b.comprimentoCm||"—"} × {b.larguraCm||"—"} × {b.alturaCm||"—"} <small>cm</small></strong></span>
 <span><span>Peso bruto</span><strong>{weightText(b.gross)} <small>kg</small></strong></span>
 <span><span>Peso líquido</span><strong>{weightText(b.net)} <small>kg</small></strong></span>
 </span>
 <span className="conference-expand"><span>Conteúdo</span><ChevronDown size={17} className="conference-chevron" aria-hidden="true"/></span>
 </summary>
 <div className="conference-content">
 <table><caption className="conference-table-caption">Conteúdo de {b.codigo}</caption><thead><tr><th scope="col">SKU / produto</th><th scope="col">Quantidade</th><th scope="col">Embalagens</th></tr></thead>
 <tbody>{b.itens.map(i=>{const inner=b.caixasInternas?.find(inner=>inner.id===i.caixaInternaId);return <tr key={i.id}>
 <td><ProductIdentity sku={sourceProductSku(i,ops)} name={i.produto}/><span className="conference-package" title={inner?.codigo}>{i.caixaInternaId?<>{inner?.tipo==="bag"?<ShoppingBag size={13} aria-hidden="true"/>:<Package size={13} aria-hidden="true"/>}{inner?.tipo==="bag"?"Bag":"Caixa menor"} · {inner?.codigo?innerLabel(inner.codigo):"Embalagem a revisar"}</>:<><Box size={13} aria-hidden="true"/>Direto na caixa maior</>}</span></td>
 <td><span className="conference-mobile-label">Quantidade</span><span className="conference-quantity">{i.quantidade||"—"} <small>{i.unidade}</small></span></td>
 <td><span className="conference-mobile-label">Embalagens</span><span className="conference-count">{i.unidadesEmbaladas||"—"}</span></td>
 </tr>})}</tbody></table>
 {!b.itens.length&&<p className="check-help">Nenhum produto nesta caixa.</p>}
 </div>
 </details>)}
 {!ready.length&&<p className="check-help">As caixas aparecerão aqui quando forem finalizadas.</p>}
 </div>
 </details>
 {state.issues.length>0&&<div className="document-warning" role="status"><p>{state.issues.length} pendência(s) para concluir. Os campos estão indicados na aba das caixas.</p><button type="button" className="text-action" onClick={()=>{const panel=document.getElementById("box-pending-overview");panel?.scrollIntoView({block:"start",behavior:"smooth"});panel?.focus({preventScroll:true})}}>Ver pendências nas caixas</button></div>}
 {state.changed&&<p className="document-warning" role="status">O envio mudou desde a última conferência. Confira os volumes novamente para continuar a documentação.</p>}
 {state.reviewed?<p className="document-help" role="status">Caixas conferidas por {value?.conferenciaPor} em {new Date(value!.conferenciaEm!).toLocaleString("pt-BR")}.</p>:<p className="check-help">Compare o cadastro com as caixas prontas antes de confirmar.</p>}
 <div className="flow-actions">{state.reviewed?<button className="button primary" onClick={onDocuments}>Continuar para documentos</button>:<button className="button primary confirm-boxes" disabled={disabled||!value||!!state.issues.length||!person.trim()} onClick={()=>{if(value)onChange(confirmBoxReview(value,ops,person,new Date().toISOString()))}}>Conferi as caixas físicas</button>}</div>
 {!state.reviewed&&!person.trim()&&<p className="check-help">Selecione o responsável em 1. Conferir produtos.</p>}
 </section>
}
