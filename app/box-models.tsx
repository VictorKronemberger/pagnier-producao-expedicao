"use client";
import SectionAction from "./section-action";
import {useState} from "react";
import {normalizeBoxModels,type BoxModel} from "../lib/box-models.mjs";
import {isDecimalDraft} from "../lib/shipping.mjs";
const empty=():BoxModel=>({id:crypto.randomUUID(),nome:"",comprimentoCm:"",larguraCm:"",alturaCm:"",pesoMaximoKg:"",taraKg:""});
export default function BoxModels({models,onChange,onSelect,disabled,expanded=false}:{expanded?:boolean;models:BoxModel[];onChange:(models:BoxModel[])=>void;onSelect:(id:string)=>void;disabled:boolean}){
 const [draft,setDraft]=useState<BoxModel|null>(null),[error,setError]=useState("");
 function save(){if(!draft)return;try{const next=normalizeBoxModels([...models.filter(m=>m.id!==draft.id),draft]);onChange(next);onSelect(draft.id);setDraft(null);setError("")}catch(e){setError(e instanceof Error?e.message:"Revise o modelo.")}}
 return <details className="box-model-manager" open={expanded||undefined}><SectionAction title="Cadastrar ou editar modelos de caixa" description={models.length?models.length+" modelos disponíveis":"Opcional: salve as medidas para reutilizar"}/>
 <p className="check-help">Cadastre uma vez e reutilize em outros pedidos. Alterações valem para novas caixas.</p>
 {models.map(m=><div className="box-model-row" key={m.id}><span><strong>{m.nome}</strong><small>{m.comprimentoCm} × {m.larguraCm} × {m.alturaCm} cm{m.pesoMaximoKg?" · limite bruto "+m.pesoMaximoKg+" kg":" · sem limite de peso"}</small></span><button type="button" className="text-action" disabled={disabled} onClick={()=>{setDraft({...m});setError("")}}>Editar</button><button type="button" className="text-action" disabled={disabled} onClick={()=>{if(confirm("Remover o modelo "+m.nome+"? As caixas já montadas serão mantidas.")){onChange(models.filter(v=>v.id!==m.id));if(draft?.id===m.id)setDraft(null)}}}>Remover</button></div>)}
 {!draft?<button type="button" className="button" disabled={disabled||models.length>=50} onClick={()=>{setDraft(empty());setError("")}}>Novo modelo de caixa</button>:<div className="box-model-form"><div className="shipping-grid">{([["nome","Nome"],["comprimentoCm","Comprimento externo (cm)"],["larguraCm","Largura externa (cm)"],["alturaCm","Altura externa (cm)"],["pesoMaximoKg","Limite de peso bruto (kg)"],["taraKg","Tara: caixa e proteções (kg)"]] as [keyof BoxModel,string][]).map(([key,label])=><label key={key}>{label}<input aria-label={label+" do modelo"} maxLength={key==="nome"?80:13} inputMode={key==="nome"?undefined:"decimal"} value={draft[key]} onChange={e=>{if(key==="nome"||isDecimalDraft(e.target.value))setDraft({...draft,[key]:e.target.value})}}/></label>)}</div><p className="check-help">O limite bruto é opcional. Para sugerir pelo peso, informe também a tara. As medidas externas não garantem o encaixe dos produtos.</p><div className="flow-actions"><button type="button" className="button primary" disabled={disabled} onClick={save}>Salvar modelo</button><button type="button" className="text-action" onClick={()=>{setDraft(null);setError("")}}>Cancelar</button></div></div>}
 {error&&<p className="dialog-error" role="alert">{error}</p>}
 </details>
}
