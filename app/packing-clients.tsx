"use client";
import {useLayoutEffect,useEffect,useRef,useState} from "react";
import {Users,Download,AlertCircle} from "lucide-react";
import {shipmentOwner} from "../lib/shipment-groups.mjs";
import {recipientPatch,pendingOrderSelection} from "../lib/packing-flow.mjs";
import type {ClientDocument} from "../lib/packing-client.mjs";
import type {Packing} from "../lib/shipping.mjs";
type Group={id:string;codigo:string;cliente:string};
type Holder={key:string;nome:string};
export default function PackingClients({owner,groups,board,disabled,onApply,onPending}:{owner:string;groups:Group[];board:any;disabled:boolean;onApply:(ids:string[],holder:Holder,patch:Partial<Packing>)=>void;onPending?:(pending:boolean)=>void}){
 const shipment=board.details[owner]?.envio,current=shipment?.agrupamento;
 const confirmed:string[]=current?.pedidos??[owner];
 const [options,setOptions]=useState<Holder[]>([]),[key,setKey]=useState(current?.titularKey??""),[doc,setDoc]=useState<ClientDocument|null>(null),[address,setAddress]=useState(""),[ids,setIds]=useState<string[]>(confirmed),[busy,setBusy]=useState(false),[error,setError]=useState(""),[search,setSearch]=useState(""),[loaded,setLoaded]=useState(false),[orderClients,setOrderClients]=useState<Record<string,string>>({});
 const [applyClient,setApplyClient]=useState(false),[replace,setReplace]=useState(false);
 const selectionPending=pendingOrderSelection(ids,confirmed),pending=selectionPending||applyClient;
 const requestId=useRef(0);
 useLayoutEffect(()=>{onPending?.(pending)},[pending,onPending]);
 useEffect(()=>()=>{requestId.current++},[]);
 async function get(url:string){const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(45000)});const d:any=await r.json();if(!r.ok)throw Error(d.error||"Consulta indisponível.");return d}
 async function select(value:string){const token=++requestId.current;setKey(value);setDoc(null);setAddress("");setApplyClient(!!value);if(!value){setBusy(false);return}setBusy(true);setError("");try{const d=await get("/api/packing-clients?key="+encodeURIComponent(value));if(token!==requestId.current)return;setDoc(d.cliente);setAddress(d.cliente.enderecos[0]?.value??"")}catch(e){if(token===requestId.current)setError(e instanceof Error?e.message:"Falha na consulta.")}finally{if(token===requestId.current)setBusy(false)}}
 async function load(){setBusy(true);setError("");try{const d=await get("/api/packing-clients?order="+encodeURIComponent(owner));setOptions(d.clientes);setOrderClients(d.porPedido??{});setLoaded(true);await select(current?.titularKey||d.selecionado||"")}catch(e){setError(e instanceof Error?e.message:"Falha na consulta.");setBusy(false)}}
 const selected=groups.filter(g=>ids.includes(g.id));
 const holder=applyClient&&doc&&key?{key,nome:doc.nome}:current?{key:current.titularKey,nome:current.titularNome}:null;
 const different=selected.some(g=>orderClients[g.id]?orderClients[g.id]!==holder?.key:g.cliente!==holder?.nome);
 const changedHolder=!!current&&applyClient&&key!==current.titularKey;
 function reset(){setIds([...confirmed]);setApplyClient(false);setKey(current?.titularKey??"");setDoc(null);setLoaded(false);setReplace(false);setError("")}
 function apply(){
 if(!holder||applyClient&&!doc)return;
 const patch=applyClient&&doc?recipientPatch(shipment?.packing,doc,address,replace||changedHolder):{};
 if(changedHolder)Object.assign(patch,{contatoNome:"",contatoFax:""});
 const listing=selected.map(g=>g.codigo+" — "+(g.cliente||"Cliente a identificar")).join("\n");
 const warning=(different?"ATENÇÃO: há pedidos com clientes diferentes do titular.\n\n":"")+"Titular / destinatário: "+holder.nome+"\n\n"+listing+"\n\n"+(applyClient?(replace||changedHolder?"Os dados do destinatário serão substituídos pelo cadastro selecionado.":"Somente campos vazios serão preenchidos; correções existentes serão preservadas."):"O destinatário e os dados documentais já salvos serão mantidos.")+" As caixas dos pedidos adicionados serão reunidas neste envio.\n\nConfirma?";
 if(!confirm(warning))return;
 try{onApply(ids,holder,patch);setApplyClient(false);setReplace(false);setError("")}catch(e){setError(e instanceof Error?e.message:"Não foi possível reunir os pedidos.")}
 }
 return <details className="client-document-section" open><summary><Users size={17}/>Pedidos e destinatário do packing list</summary>
 {current&&<p className="group-notice"><strong>{current.titularNome}</strong> · Destinatário confirmado. Você pode acrescentar pedidos sem consultar o cadastro novamente.</p>}
 <p className="document-help">Selecione os pedidos que viajam juntos. As caixas já cadastradas serão aproveitadas; cada pedido mantém sua etapa e prioridade.</p>
 <fieldset disabled={busy||disabled} className="client-fields"><label>Selecione os pedidos para reunir<input aria-label="Buscar pedidos para agrupar" placeholder="Buscar pedido ou cliente…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 <div className="group-order-list">{groups.filter(g=>[g.codigo,g.cliente].join(" ").toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(g=>{const other=shipmentOwner(board,g.id)!==g.id&&shipmentOwner(board,g.id)!==owner||g.id!==owner&&!!board.details[g.id]?.envio?.agrupamento;const fixed=g.id===owner||current?.pedidos.includes(g.id);return <label key={g.id}><input type="checkbox" checked={ids.includes(g.id)} disabled={fixed||other||!ids.includes(g.id)&&ids.length>=50} onChange={e=>setIds(e.target.checked?[...ids,g.id]:ids.filter(id=>id!==g.id))}/><span><strong>{g.codigo}</strong> · {g.cliente}{other&&<small>Já pertence a outro envio</small>}</span></label>})}</div>
 <p className="document-help">{ids.length} de 50 pedidos selecionados. {selectionPending?"Seleção ainda não confirmada.":"Pedidos já confirmados são mantidos para preservar as caixas."}</p>
 </fieldset>
 <button className="button" type="button" disabled={busy||disabled} onClick={()=>void load()}><Download size={15}/>{busy?"Consultando…":current||loaded?"Consultar / atualizar destinatário":"Consultar clientes no Nomus"}</button>
 {loaded&&<fieldset disabled={busy||disabled} className="client-fields">
 <label>Cliente titular<select aria-label="Cliente titular do envio" value={key} onChange={e=>void select(e.target.value)}><option value="">Selecione o cliente titular</option>{options.map(c=><option key={c.key} value={c.key}>{c.nome}</option>)}</select></label>
 {doc&&<div className="client-preview"><strong>{doc.razaoSocial||doc.nome}</strong><label>Endereço para entrega<select aria-label="Endereço do titular" value={address} onChange={e=>{setAddress(e.target.value);setApplyClient(true)}}><option value="">Preencher manualmente no packing list</option>{doc.enderecos.map((a,i)=><option key={i} value={a.value}>{a.label} · {a.value.replaceAll("\n",", ")}</option>)}</select></label><p>{address||"Sem endereço selecionado."}</p><p>{[doc.registro,doc.telefone,doc.email].filter(Boolean).join(" · ")}</p></div>}
 {shipment?.packing?.destinatarioNome&&!changedHolder&&<label className="packing-ack"><input type="checkbox" checked={replace} onChange={e=>{setReplace(e.target.checked);setApplyClient(true)}}/>Substituir também os dados do destinatário já preenchidos</label>}
 {changedHolder&&<p className="document-warning">A troca de titular substituirá os dados do destinatário após sua confirmação.</p>}
 </fieldset>}
 {different&&holder&&<p className="document-warning"><AlertCircle size={16}/>Há pedidos de clientes diferentes do titular. Confira o destinatário antes de confirmar.</p>}
 <div className="flow-actions"><button className="button client-apply" type="button" disabled={busy||disabled||!holder||applyClient&&!doc||!pending&&!!current||ids.length>50} onClick={apply}>{current&&!applyClient?"Confirmar pedidos e manter destinatário":ids.length>1?"Confirmar titular e reunir pedidos":"Confirmar titular e preencher documento"}</button>{pending&&<button className="button" type="button" disabled={busy} onClick={reset}>Descartar seleção não confirmada</button>}</div>
 {error&&<p className="dialog-error" role="alert">{error}</p>}
 </details>
}
