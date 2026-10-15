"use client";
import {isMounted} from "../lib/ready-boxes.mjs";
import {inspectBoxReview,confirmBoxReview} from "../lib/box-review.mjs";
import {weightText} from "../lib/packing-list.mjs";
import type {Shipment,ShippingOP} from "../lib/shipping.mjs";
export default function BoxConference({value,ops,person,disabled,onChange,onDocuments}:{value?:Shipment;ops:ShippingOP[];person:string;disabled:boolean;onChange:(value:Shipment)=>void;onDocuments:()=>void}){
 const state=inspectBoxReview(value,ops);
 const ready=state.report.boxes.filter(isMounted);
 return <section className="box-conference" aria-label="Conferir volumes físicos">
 <h3>Conferir caixas montadas</h3>
 <details className="assembly-review-summary"><summary>Resumo das {ready.length} caixa(s) maior(es) · volumes do documento</summary>
 {ready.map(b=><article className="shipping-box" key={b.id}><div className="box-body"><strong>{b.codigo}{b.modeloNome?" · "+b.modeloNome:""} · {b.itens.length} {b.itens.length===1?"item":"itens"}</strong><p>{b.comprimentoCm||"—"} × {b.larguraCm||"—"} × {b.alturaCm||"—"} cm · Bruto {b.pesoBrutoKg||"—"} kg · Líquido {weightText(b.net)} kg</p>{b.itens.map(i=><p key={i.id}>{i.caixaInternaId?(b.caixasInternas?.find(inner=>inner.id===i.caixaInternaId)?.codigo||"Embalagem a revisar")+" · ":"Direto na caixa maior · "}{i.produto||"Produto a selecionar"} · {i.quantidade||"—"} {i.unidade} · {i.unidadesEmbaladas||"—"} embalagens</p>)}</div></article>)}
 </details>
 {state.issues.length>0&&<div className="document-warning" role="status"><p>{state.issues[0]}</p>{state.issues.length>1&&<details><summary>Ver todas as pendências ({state.issues.length})</summary><ul>{state.issues.map(issue=><li key={issue}>{issue}</li>)}</ul></details>}</div>}
 {state.changed&&<p className="document-warning" role="status">O envio mudou desde a última conferência. Confira os volumes novamente para continuar a documentação.</p>}
 {state.reviewed?<p className="document-help" role="status">Caixas conferidas por {value?.conferenciaPor} em {new Date(value!.conferenciaEm!).toLocaleString("pt-BR")}.</p>:<p className="check-help">Compare o cadastro com as caixas prontas antes de confirmar.</p>}
 <div className="flow-actions">{state.reviewed?<button className="button primary" onClick={onDocuments}>Continuar para documentos</button>:<button className="button primary confirm-boxes" disabled={disabled||!value||!!state.issues.length||!person.trim()} onClick={()=>{if(value)onChange(confirmBoxReview(value,ops,person,new Date().toISOString()))}}>Conferi as caixas físicas</button>}</div>
 {!state.reviewed&&!person.trim()&&<p className="check-help">Selecione o responsável em 1. Conferir produtos.</p>}
 </section>
}
