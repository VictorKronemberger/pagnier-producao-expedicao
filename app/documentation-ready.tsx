"use client";
import {useState} from "react";
import {ArrowRight,PackageCheck,Search,ChevronDown} from "lucide-react";
import type {DocumentationEntry} from "../lib/documentation-ready.mjs";
export default function DocumentationReady({entries,kind,onOpen,disabled}:{entries:DocumentationEntry[];kind:"packing"|"invoices";onOpen:(id:string)=>void;disabled:boolean}){
 const [search,setSearch]=useState("");
 const rows=entries.flatMap(entry=>kind==="packing"?[{...entry,id:entry.owner,displayOrders:entry.orders}]:entry.orders.map(order=>({...entry,id:order.id,displayOrders:[order]})));
 const visible=rows.filter(row=>[...row.displayOrders.flatMap(o=>[o.codigo,o.cliente]),row.carrier,row.reviewedBy].join(" ").toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
 return <details className="documentation-ready" aria-label="Prontos para documentação">
 <summary><h2><PackageCheck size={20}/>Prontos para documentação<span className="documentation-count">{rows.length}</span></h2><ChevronDown size={18} aria-hidden="true"/></summary>
 <header><div><p>Caixas embaladas e conferidas. Continue o preenchimento dos documentos.</p></div>{rows.length>0&&<label className="search"><Search size={16}/><input aria-label="Buscar pedidos prontos para documentação" placeholder="Pedido ou cliente" value={search} onChange={e=>setSearch(e.target.value)}/></label>}</header>
 {visible.length>0?<div className="documentation-ready-list">{visible.map(row=><article key={row.id} data-documentation-order={row.id}><div><strong>{row.displayOrders.map(o=>o.codigo).join(" · ")}</strong><p>{[...new Set(row.displayOrders.map(o=>o.cliente).filter(Boolean))].join(" · ")||"Cliente aguardando consulta"}</p><small>{row.boxes} {row.boxes===1?"volume":"volumes"}{kind==="invoices"&&row.orders.length>1?" no envio agrupado":""}{row.carrier?" · "+row.carrier:""} · Conferido por {row.reviewedBy}</small></div><button className="button" disabled={disabled} onClick={()=>onOpen(row.id)}>{kind==="packing"?"Abrir packing list":"Preparar invoice"}<ArrowRight size={15}/></button></article>)}</div>:<p className="documentation-empty">{search?"Nenhum pedido encontrado nesta busca.":"Os pedidos aparecerão aqui após a conferência final das caixas na expedição."}</p>}
 </details>
}
