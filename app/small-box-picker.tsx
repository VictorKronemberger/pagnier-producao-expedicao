"use client";
import {useId,useState} from "react";
import {ArrowRight,Check,Package,Search,X} from "lucide-react";
import {smallBoxOptions} from "../lib/small-box-search.mjs";
import type {PreparedBox} from "../lib/shipping.mjs";

export default function SmallBoxPicker({boxes, target, onPlace}: {boxes: PreparedBox[]; target: string; onPlace: (id: string) => void}) {
 const groupId = useId();
 const [query, setQuery] = useState("");
 const [selectedId, setSelectedId] = useState("");
 const options = smallBoxOptions(boxes, query);
 const selected = options.find(option => option.id === selectedId);
 function search(value: string) {setQuery(value); setSelectedId("");}
 return <section className="small-box-picker" aria-label={"Escolher caixa menor para " + target}>
  <div className="small-picker-heading"><div><strong>Escolha uma caixa menor</strong><p>Confira a quantidade e adicione à Caixa 40.</p></div><span className="small-picker-count" aria-live="polite">{options.length} {options.length === 1 ? "disponível" : "disponíveis"}</span></div>
  <div className="small-picker-search"><Search size={17} aria-hidden="true"/><input type="search" aria-label={"Pesquisar caixa menor para " + target} placeholder="Buscar caixa, produto ou quantidade…" value={query} onChange={event => search(event.target.value)}/>{query && <button type="button" aria-label="Limpar pesquisa de caixas" onClick={() => search("")}><X size={16}/></button>}</div>
  <div className="small-picker-list" role="group" aria-label="Caixas menores prontas">
   {options.map(option => <label className={"small-picker-option" + (selected?.id === option.id ? " is-selected" : "")} key={option.id}>
    <input type="radio" name={groupId} value={option.id} checked={selected?.id === option.id} onChange={() => setSelectedId(option.id)} aria-label={option.label}/>
    <span className="small-picker-icon"><Package size={18} aria-hidden="true"/></span>
    <span className="small-picker-name"><strong>{option.title}</strong><small>Caixa menor {option.number}</small></span>
    <span className="small-picker-quantity">{option.quantity}</span>
    <span className="small-picker-check" aria-hidden="true">{selected?.id === option.id && <Check size={13}/>}</span>
   </label>)}
   {!options.length && <div className="small-picker-empty"><Search size={24}/><strong>Nenhuma caixa encontrada</strong><span>Tente outro nome ou limpe a pesquisa.</span></div>}
  </div>
  {selected && <details className="small-picker-details" key={selected.id}><summary>Ver conteúdo da caixa selecionada</summary><p>{selected.contents}</p></details>}
  <div className="small-picker-footer"><span role="status">{selected ? <><strong>{selected.quantity}</strong><small>na caixa selecionada</small></> : "Selecione uma caixa acima"}</span><button type="button" className="button primary" disabled={!selected} onClick={() => {if (selected) {onPlace(selected.id); setSelectedId("");}}}>Adicionar à Caixa 40<ArrowRight size={15}/></button></div>
 </section>;
}
