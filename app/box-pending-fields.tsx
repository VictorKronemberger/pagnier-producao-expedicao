"use client";
import {useState} from "react";
import ImportantField from "./important-field";
import {decimal,isDecimalDraft,type ShippingBox,type ShippingItem} from "../lib/shipping.mjs";
import {needsPackContent,updatePackingItem} from "../lib/packing-reuse.mjs";

export function issuesForBox(issues:string[],box:ShippingBox){
 const name=box.codigo||"Caixa sem identificação";
 return issues.filter(issue=>issue.startsWith(name+":")||issue.startsWith(name+" / ")||(!box.codigo&&issue==="Uma caixa está sem identificação."));
}
export default function BoxPendingFields({box,issues,onSave}:{box:ShippingBox;issues:string[];onSave:(patches:Record<string,Partial<ShippingItem>>)=>boolean}){
 const [patches,setPatches]=useState<Record<string,Partial<ShippingItem>>>({});
 const rows=box.itens.map((item,index)=>({item,index,issues:issues.filter(issue=>issue.startsWith(box.codigo+" / item "+(index+1)+":"))})).filter(row=>row.issues.length);
 if(!rows.length)return null;
 function patch(id:string,value:Partial<ShippingItem>){setPatches(current=>({...current,[id]:{...current[id],...value}}))}
 return <section className="box-pending-fields" aria-label={"Preencher pendências de "+box.codigo}>
 <h5>Preencher dados dos produtos</h5><p className="check-help">Confira os campos abaixo. Ao salvar, finalize e pese esta caixa novamente.</p>
 {rows.map(({item,index,issues:pending})=>{const current={...item,...patches[item.id]},preview=updatePackingItem(item,patches[item.id]??{});return <article className="packed-item" key={item.id}>
 <strong>{item.produto||"Produto a identificar"}</strong><p className="check-help">Item {index+1} · {item.opId}{item.caixaInternaId?" · "+(box.caixasInternas?.find(inner=>inner.id===item.caixaInternaId)?.codigo||"Caixa menor"):""}</p>
 <ul className="box-pending-messages">{pending.map(issue=><li key={issue}>{issue.slice(issue.indexOf(":")+1).trim()}</li>)}</ul>
 <div className="shipping-grid">
 <ImportantField label="Unidades embaladas" value={current.unidadesEmbaladas} valid={/^\d{1,6}$/.test(current.unidadesEmbaladas??"")&&Number(current.unidadesEmbaladas)>0}><input aria-label={"Unidades embaladas do item "+(index+1)+" de "+box.codigo} inputMode="numeric" maxLength={6} value={current.unidadesEmbaladas??""} onChange={e=>{if(/^\d{0,6}$/.test(e.target.value))patch(item.id,{unidadesEmbaladas:e.target.value})}}/></ImportantField>
 <ImportantField label="Peso líquido por unidade · kg" value={current.pesoUnitarioKg} valid={(decimal(current.pesoUnitarioKg??"")??0)>0}><input aria-label={"Peso unitário do item "+(index+1)+" de "+box.codigo} inputMode="decimal" maxLength={13} placeholder="0,000" value={current.pesoUnitarioKg??""} onChange={e=>{if(isDecimalDraft(e.target.value))patch(item.id,{pesoUnitarioKg:e.target.value,origemPeso:"manual"})}}/></ImportantField>
 {needsPackContent(current)&&<ImportantField label={"Conteúdo por embalagem · "+item.unidade} value={current.conteudoPorEmbalagem} required={false}><input aria-label={"Conteúdo por embalagem do item "+(index+1)+" de "+box.codigo} inputMode="decimal" maxLength={13} placeholder="Derivado do peso, quando aplicável" value={current.conteudoPorEmbalagem??""} onChange={e=>{if(isDecimalDraft(e.target.value))patch(item.id,{conteudoPorEmbalagem:e.target.value})}}/></ImportantField>}
 </div><p className="check-help">Quantidade resultante: {preview.quantidade||"—"} {item.unidade}</p>
 </article>})}
 <button type="button" className="button primary" disabled={!Object.keys(patches).length} onClick={()=>{if(onSave(patches))setPatches({})}}>Salvar dados e revisar montagem</button>
 </section>;
}
