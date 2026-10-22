"use client";
import {useState} from "react";
import {smallBoxOptions} from "../lib/small-box-search.mjs";
import type {PreparedBox} from "../lib/shipping.mjs";

export default function SmallBoxPicker({boxes, target, onPlace}: {boxes: PreparedBox[]; target: string; onPlace: (id: string) => void}) {
 const [query, setQuery] = useState("");
 const [selectedId, setSelectedId] = useState("");
 const options = smallBoxOptions(boxes, query);
 const selected = options.find(option => option.id === selectedId);
 return <div className="small-box-picker">
  <label>Pesquisar caixa menor<input type="search" aria-label={"Pesquisar caixa menor para " + target} placeholder="Digite o nome da caixa, produto ou quantidade" value={query} onChange={event => {setQuery(event.target.value); setSelectedId("");}} /></label>
  <div className="place-small-controls">
   <label>Caixas menores prontas<select aria-label={"Caixa menor para " + target} value={selected?.id ?? ""} onChange={event => setSelectedId(event.target.value)} disabled={!options.length}>
    <option value="">{options.length ? "Selecione uma caixa menor" : "Nenhuma caixa encontrada"}</option>
    {options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
   </select></label>
   <button type="button" className="button primary" disabled={!selected} onClick={() => {if (selected) {onPlace(selected.id); setSelectedId("");}}}>Colocar nesta caixa</button>
  </div>
  <p className="check-help" role="status">{selected ? selected.label : options.length ? options.length + " caixa(s) encontrada(s). Selecione para conferir o conteúdo." : "Nenhuma caixa menor pronta corresponde à pesquisa. Tente outro nome ou limpe a busca."}</p>
 </div>;
}
