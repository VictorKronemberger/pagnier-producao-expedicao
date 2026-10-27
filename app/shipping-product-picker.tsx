"use client";
import {useEffect,useId,useRef,useState} from "react";
import {Search,X,Check} from "lucide-react";
import ImportantField from "./important-field";
import ProductIdentity from "./product-identity";
import type {ShippingOP} from "../lib/shipping.mjs";

const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();

export default function ShippingProductPicker({ops,value,valid,label,onChange}:{ops:ShippingOP[];value:string;valid:boolean;label:string;onChange:(id:string)=>void}){
 const [query,setQuery]=useState(""),[open,setOpen]=useState(false),[active,setActive]=useState(0);
 const listId=useId(),input=useRef<HTMLInputElement>(null),options=useRef<(HTMLButtonElement|null)[]>([]);
 const terms=normalize(query).split(/\s+/).filter(Boolean);
 const matches=ops.filter(op=>terms.every(term=>normalize((op.sku??"")+" "+op.nome+" "+op.produto).includes(term)));
 const selected=ops.find(op=>op.id===value),showResults=open&&!!query.trim();
 const activeIndex=Math.min(active,matches.length-1);
 useEffect(()=>{if(showResults)options.current[activeIndex]?.scrollIntoView({block:"nearest"})},[activeIndex,showResults,query]);
 function choose(id:string){onChange(id);setQuery("");setOpen(false);setActive(0);input.current?.focus()}
 return <div className="packed-product" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false)}}>
  <div className="small-picker-search product-picker-search">
   <Search size={17} aria-hidden="true"/>
   <input ref={input} type="search" role="combobox" aria-label={"Pesquisar produto: "+label} aria-autocomplete="list" aria-expanded={showResults} aria-controls={showResults?listId:undefined} aria-activedescendant={showResults&&activeIndex>=0?listId+"-"+activeIndex:undefined} autoComplete="off" placeholder="Buscar SKU, produto ou OP…" value={query}
    onFocus={()=>setOpen(true)}
    onChange={event=>{setQuery(event.target.value);setActive(0);setOpen(true)}}
    onKeyDown={event=>{
     if(event.key==="Escape"&&showResults){event.preventDefault();event.stopPropagation();setOpen(false);return}
     if(!query.trim())return;
     if(event.key==="ArrowDown"||event.key==="ArrowUp"){event.preventDefault();setOpen(true);setActive(current=>event.key==="ArrowDown"?Math.min(current+1,matches.length-1):Math.max(current-1,0))}
     if(event.key==="Enter"&&showResults){event.preventDefault();if(matches[activeIndex])choose(matches[activeIndex].id)}
    }}/>
   {query&&<button type="button" aria-label="Limpar pesquisa de produtos" onClick={()=>{setQuery("");setActive(0);input.current?.focus()}}><X size={16}/></button>}
  </div>
  {showResults&&<div className="product-suggestions">
   <div className="product-suggestions-heading">Selecione um produto</div>
   <div id={listId} role="listbox" aria-label={"Produtos encontrados: "+label} className="product-suggestions-list">
    {matches.map((op,index)=><button type="button" role="option" tabIndex={-1} id={listId+"-"+index} key={op.id} ref={node=>{options.current[index]=node}} aria-selected={op.id===value} className={"product-suggestion"+(index===activeIndex?" is-active":"")} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(op.id)}>
     <span><ProductIdentity sku={op.sku} name={op.produto}/><small className="product-suggestion-op">{op.nome}</small></span>
     {op.id===value&&<Check size={16} aria-hidden="true"/>}
    </button>)}
   </div>
   {!matches.length&&<p className="product-suggestions-empty">Nenhum produto encontrado. Tente outro SKU ou nome.</p>}
  </div>}
  <div hidden={showResults}>
   <ImportantField label="Produto" value={value} valid={valid}><select aria-label={label} value={value} onChange={event=>{onChange(event.target.value);setQuery("");setOpen(false)}}><option value="">Escolha o produto</option>{value&&!selected&&<option value={value}>{value} · vínculo a revisar</option>}{selected&&!matches.includes(selected)&&<option value={selected.id}>{selected.sku?selected.sku+" · ":""}{selected.produto} · {selected.nome}</option>}{matches.map(op=><option key={op.id} value={op.id}>{op.sku?op.sku+" · ":""}{op.produto} · {op.nome}</option>)}</select></ImportantField>
  </div>
  {query&&<small role="status" className="product-picker-status">{matches.length?matches.length+" produto(s) encontrado(s)":"Nenhum resultado"}</small>}
 </div>;
}
