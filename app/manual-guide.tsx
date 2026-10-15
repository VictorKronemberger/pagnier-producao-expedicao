"use client";
import {useEffect,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,CheckCircle2} from "lucide-react";
import {manual} from "../lib/manual";
import {manualCategories,manualEdition,tutorials} from "../lib/tutorials";
const normalize=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();
export default function ManualGuide({topic,onNavigate,onBack}:{topic:string;onNavigate:(target:string)=>void;onBack:()=>void}){
 const initial=tutorials.find(t=>t.id===topic);
 const [search,setSearch]=useState(""),[category,setCategory]=useState(initial?.category??""),[active,setActive]=useState(initial?.id??""),[reference,setReference]=useState("");
 const view=useRef<HTMLDivElement>(null);
 useEffect(()=>{const t=tutorials.find(t=>t.id===topic);if(t){setCategory(t.category);setSearch("");setActive(t.id);setReference("")}},[topic]);
 useEffect(()=>{if(!category&&!active&&!reference)return;const frame=requestAnimationFrame(()=>{view.current?.scrollIntoView({block:"start",behavior:"auto"});view.current?.focus({preventScroll:true})});return()=>cancelAnimationFrame(frame)},[category,active,reference]);
 const q=normalize(search),current=tutorials.find(t=>t.id===active),note=manual.find(t=>t.title===reference),group=manualCategories.find(c=>c.id===category);
 const chapters=tutorials.filter(t=>q?normalize([t.code,t.title,t.owner,t.objective,t.before,t.done,t.records,t.deviation,...t.steps.map(s=>s.title+" "+s.short+" "+s.text)].join(" ")).includes(q):t.category===category);
 const references=manual.filter(t=>q?normalize(t.title+" "+t.text).includes(q):t.category===category);
 function home(){setCategory("");setSearch("");setActive("");setReference("");requestAnimationFrame(()=>{view.current?.scrollIntoView({block:"start",behavior:"auto"});view.current?.focus({preventScroll:true})})}
 function chooseCategory(id:string){setCategory(id);setSearch("");setActive("");setReference("")}
 function showProcedure(id:string){const t=tutorials.find(t=>t.id===id);if(t){setSearch("");setCategory(t.category);setActive(id);setReference("")}}
 function showReference(title:string){const t=manual.find(t=>t.title===title);if(t){setSearch("");setCategory(t.category);setActive("");setReference(title)}}
 function find(value:string){setSearch(value);setActive("");setReference("");setCategory("")}
 return <div className="manual-guide manual-light">
 <div className="manual-toolbar"><button className="text-action" onClick={onBack}><ArrowLeft size={15}/>Voltar ao trabalho</button><label className="search"><input aria-label="Buscar no manual" placeholder="O que você precisa fazer?" value={search} onChange={e=>find(e.target.value)}/></label>{search&&<button className="text-action" onClick={home}>Limpar busca</button>}</div>
 <div className="manual-reading-area" ref={view} tabIndex={-1}>
 {!q&&!category?<><h2 className="manual-view-title">Por onde você quer começar?</h2><p className="manual-view-intro">Escolha uma área. Você verá apenas as orientações daquela etapa.</p><nav className="manual-categories" aria-label="Categorias do manual">{manualCategories.map((c,i)=><button type="button" key={c.id} data-manual-category={c.id} onClick={()=>chooseCategory(c.id)}><b>{i+1}</b><span><strong>{c.title}</strong><small>{c.description}</small></span><ArrowRight size={15}/></button>)}</nav></>:
 <><nav className="manual-breadcrumb" aria-label="Você está no manual"><button onClick={home}>Categorias</button>{group&&<><span aria-hidden="true">/</span>{current||note?<button onClick={()=>chooseCategory(group.id)}>{group.title}</button>:<span>{group.title}</span>}</>}</nav>
 {q?<><h2 className="manual-view-title">Resultados da busca</h2><p className="manual-view-intro" role="status">{chapters.length+references.length} orientações encontradas em todas as categorias.</p></>:!current&&!note?<><h2 className="manual-view-title">{group?.title}</h2><p className="manual-view-intro">Escolha o que precisa fazer agora.</p></>:null}
 {current&&!q?<article className="manual-tutorial manual-reader" id={"tutorial-"+current.id} key={current.id}>
 <header><small>{current.steps.length} passos</small><h2>{current.title}</h2><p>{current.before}</p></header>
 <ol className="manual-short-steps">{current.steps.map((s,i)=><li key={i}><strong>{s.title}</strong><p>{s.short}</p></li>)}</ol>
 <div className="manual-done"><CheckCircle2 size={17}/><p>{current.done}</p></div>
 <details className="manual-full-details"><summary>Ver detalhes e responsabilidades</summary><div><p className="manual-edition">{current.code} · Revisão {manualEdition.revision} · {manualEdition.updatedAt}</p><dl className="pop-metadata"><div><dt>Responsável</dt><dd>{current.owner}</dd></div><div><dt>Objetivo</dt><dd>{current.objective}</dd></div></dl><ol>{current.steps.map((s,i)=><li key={i}><strong>{s.title}</strong><p>{s.text}</p></li>)}</ol><h3>O que fica registrado</h3><p>{current.records}</p><h3>Se algo estiver diferente</h3><p>{current.deviation}</p></div></details>
 <div className="manual-procedure-actions"><button className="button primary" onClick={()=>onNavigate(current.target)}>{current.action}</button>{current.id==="cleanup"&&<button className="button" onClick={()=>onNavigate("invoices")}>Abrir invoices</button>}</div>
 {current.next.length>0&&<div className="manual-next"><span>{current.next.length>1?"Qual documento você precisa?":"Depois disso"}</span>{current.next.map(id=><button className="text-action" key={id} onClick={()=>showProcedure(id)}>{tutorials.find(v=>v.id===id)?.title}<ArrowRight size={14}/></button>)}</div>}
 </article>:note&&!q?<article className="manual-note manual-reader"><h2>{note.title}</h2><p>{note.text}</p><button className="button" onClick={()=>chooseCategory(note.category)}>Voltar às orientações</button></article>:<>
 {!!chapters.length&&<div className="manual-topic-list" aria-label="Orientações">{chapters.map(t=><button type="button" key={t.id} data-manual-topic={t.id} onClick={()=>showProcedure(t.id)}><span>{q&&<small>{manualCategories.find(c=>c.id===t.category)?.title}</small>}<strong>{t.title}</strong></span><small>{t.steps.length} passos</small><ArrowRight size={16}/></button>)}</div>}
 {!!references.length&&(q?<div className="manual-faq-results"><h3>Perguntas relacionadas</h3>{references.map(t=><button className="manual-reference-link" key={t.title} onClick={()=>showReference(t.title)}>{t.title}<ArrowRight size={14}/></button>)}</div>:<details className="manual-category-questions"><summary>Dúvidas desta etapa</summary>{references.map(t=><button className="manual-reference-link" key={t.title} onClick={()=>showReference(t.title)}>{t.title}<ArrowRight size={14}/></button>)}</details>)}
 {!chapters.length&&!references.length&&<p className="packing-empty">Nenhuma orientação encontrada. Tente outro termo.</p>}
 </>}
 </>}
 </div></div>
}
