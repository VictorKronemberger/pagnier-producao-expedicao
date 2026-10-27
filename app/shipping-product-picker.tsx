"use client";
import {useState} from "react";
import {Search,X} from "lucide-react";
import ImportantField from "./important-field";
import type {ShippingOP} from "../lib/shipping.mjs";

const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();

export default function ShippingProductPicker({ops,value,valid,label,onChange}:{ops:ShippingOP[];value:string;valid:boolean;label:string;onChange:(id:string)=>void}){
 const [query,setQuery]=useState("");
 const terms=normalize(query).split(/\s+/).filter(Boolean);
 const matches=ops.filter(op=>terms.every(term=>normalize((op.sku??"")+" "+op.nome+" "+op.produto).includes(term)));
 const selected=ops.find(op=>op.id===value);
 return <div className="packed-product">
  <div className="small-picker-search" style={{margin:"0 0 7px"}}><Search size={17} aria-hidden="true"/><input type="search" aria-label={"Pesquisar produto: "+label} placeholder="Buscar SKU, produto ou OP…" value={query} onChange={event=>setQuery(event.target.value)}/>{query&&<button type="button" aria-label="Limpar pesquisa de produtos" onClick={()=>setQuery("")}><X size={16}/></button>}</div>
  <ImportantField label="Produto" value={value} valid={valid}><select aria-label={label} value={value} onChange={event=>{onChange(event.target.value);setQuery("")}}><option value="">Escolha o produto</option>{value&&!selected&&<option value={value}>{value} · vínculo a revisar</option>}{selected&&!matches.includes(selected)&&<option value={selected.id}>{selected.sku?selected.sku+" · ":""}{selected.produto} · {selected.nome}</option>}{matches.map(op=><option key={op.id} value={op.id}>{op.sku?op.sku+" · ":""}{op.produto} · {op.nome}</option>)}</select></ImportantField>
  {query&&<small role="status">{matches.length?matches.length+" produto(s) encontrado(s)":"Nenhum produto encontrado. Tente outro nome ou limpe a pesquisa."}</small>}
 </div>;
}
