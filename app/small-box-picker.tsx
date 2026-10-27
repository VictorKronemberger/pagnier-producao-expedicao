"use client";
import {useState} from "react";
import {ArrowRight,Check,Package,ShoppingBag,Search,X} from "lucide-react";
import {smallBoxOptions,smallBoxQuantity} from "../lib/small-box-search.mjs";
import type {PreparedBox} from "../lib/shipping.mjs";

export default function SmallBoxPicker({boxes, target, onPlace}: {boxes: PreparedBox[]; target: string; onPlace: (ids: string[]) => boolean | void}) {
 const [query, setQuery] = useState("");
 const [selectedIds, setSelectedIds] = useState<string[]>([]);
 const hasBags=boxes.some(b=>b.tipo==="bag"),onlyBags=hasBags&&boxes.every(b=>b.tipo==="bag");
 const options = smallBoxOptions(boxes, query);
 const selected = smallBoxOptions(boxes).filter(option => selectedIds.includes(option.id));
 const selectedSet = new Set(selected.map(option => option.id));
 const allVisibleSelected = options.length > 0 && options.every(option => selectedSet.has(option.id));
 const quantity = smallBoxQuantity(boxes.filter(box => selectedSet.has(box.id)).flatMap(box => box.itens));
 const hiddenCount = selected.filter(option => !options.some(visible => visible.id === option.id)).length;
 function toggle(id: string) {setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);}
 function toggleVisible() {setSelectedIds(current => allVisibleSelected ? current.filter(id => !options.some(option => option.id === id)) : [...new Set([...current, ...options.map(option => option.id)])]);}
 function search(value: string) {setQuery(value);}
 return <section className="small-box-picker" aria-label={(onlyBags?"Escolher bag para ":hasBags?"Escolher embalagem para ":"Escolher caixa menor para ") + target}>
  <div className="small-picker-heading"><div><strong>{onlyBags?"Escolha as bags":hasBags?"Escolha as caixas menores e bags":"Escolha as caixas menores"}</strong><p>Selecione as embalagens e adicione à Caixa 40.</p></div><span className="small-picker-count" aria-live="polite">{options.length} {options.length === 1 ? "disponível" : "disponíveis"}</span></div>
  <div className="small-picker-search"><Search size={17} aria-hidden="true"/><input type="search" aria-label={(hasBags?"Pesquisar embalagem para ":"Pesquisar caixa menor para ") + target} placeholder="Buscar caixa, produto ou quantidade…" value={query} onChange={event => search(event.target.value)}/>{query && <button type="button" aria-label="Limpar pesquisa de caixas" onClick={() => search("")}><X size={16}/></button>}</div>
  <div className="small-picker-heading"><button type="button" className="text-action" disabled={!options.length} onClick={toggleVisible}>{allVisibleSelected ? "Desmarcar resultados" : "Selecionar todos os resultados"}</button>{selected.length > 0 && <button type="button" className="text-action" onClick={() => setSelectedIds([])}>Limpar seleção</button>}</div>
  <div className="small-picker-list" role="group" aria-label={hasBags?"Embalagens prontas":"Caixas menores prontas"}>
   {options.map(option => <label className={"small-picker-option" + (selectedSet.has(option.id) ? " is-selected" : "")} key={option.id}>
    <input type="checkbox" value={option.id} checked={selectedSet.has(option.id)} onChange={() => toggle(option.id)} aria-label={option.label}/>
    <span className="small-picker-icon">{option.type==="bag"?<ShoppingBag size={18} aria-hidden="true"/>:<Package size={18} aria-hidden="true"/>}</span>
    <span className="small-picker-name"><strong>{option.title}</strong><small>{option.type==="bag"?"Bag":"Caixa menor"} {option.number}</small></span>
    <span className="small-picker-quantity">{option.quantity}</span>
    <span className="small-picker-check" aria-hidden="true">{selectedSet.has(option.id) && <Check size={13}/>}</span>
   </label>)}
   {!options.length && <div className="small-picker-empty"><Search size={24}/><strong>Nenhuma embalagem encontrada</strong><span>Tente outro nome ou limpe a pesquisa.</span></div>}
  </div>
  {selected.length > 0 && <details className="small-picker-details"><summary>Ver conteúdo das embalagens selecionadas</summary>{selected.map(option => <p key={option.id}><strong>{option.title}</strong> · {option.contents}</p>)}</details>}
  <div className="small-picker-footer"><span role="status">{selected.length ? <><strong>{quantity}</strong><small>{selected.length} {selected.length === 1 ? "embalagem selecionada" : "embalagens selecionadas"}{hiddenCount > 0 ? " · " + hiddenCount + " fora da pesquisa" : ""}</small></> : "Selecione as embalagens acima"}</span><button type="button" className="button primary" disabled={!selected.length} onClick={() => {if (selected.length && onPlace(selected.map(option => option.id)) !== false) setSelectedIds([]);}}>Adicionar à Caixa 40{selected.length > 0 ? " (" + selected.length + ")" : ""}<ArrowRight size={15}/></button></div>
 </section>;
}
