"use client";
import {useEffect,useRef,useState} from "react";
import {History,RefreshCw} from "lucide-react";
import type {HistoryEntry} from "../lib/order-history-store.mjs";
import styles from "./order-history.module.css";
function date(value:string){if(/^\d{4}-\d{2}-\d{2}T/.test(value)&&!Number.isNaN(Date.parse(value)))return new Date(value).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value.split("-").reverse().join("/");return value||"Não informado"}
export default function OrderHistory({orderId,revision,pending=false}:{orderId:string;revision:number;pending?:boolean}){
 const [open,setOpen]=useState(false),[entries,setEntries]=useState<HistoryEntry[]>([]),[cursor,setCursor]=useState<number|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[refresh,setRefresh]=useState(0);
 const controller=useRef<AbortController|null>(null),generation=useRef(0),retryCursor=useRef<number|null>(null);
 async function load(before:number|null){
 controller.current?.abort();const request=new AbortController();controller.current=request;const token=++generation.current;retryCursor.current=before;setBusy(true);setError("");
 try{const query=new URLSearchParams({orderId});if(before!==null)query.set("before",String(before));const response=await fetch("/api/order-history?"+query,{cache:"no-store",signal:request.signal});const result=await response.json() as {error?:string;entries:HistoryEntry[];nextCursor:number|null};if(!response.ok)throw Error(result.error||"Não foi possível carregar o histórico.");
 if(token!==generation.current)return;
 setEntries(old=>before===null?result.entries:[...old,...result.entries.filter((entry:HistoryEntry)=>!old.some(e=>e.id===entry.id))]);setCursor(result.nextCursor);
 }catch(e){if(!request.signal.aborted&&token===generation.current)setError(e instanceof Error?e.message:"Não foi possível carregar o histórico.")}
 finally{if(token===generation.current)setBusy(false)}
 }
 useEffect(()=>{if(open){setEntries([]);setCursor(null);void load(null)}return()=>{controller.current?.abort();generation.current++}},[open,orderId,revision,refresh]);
 return <details className={styles.history} data-order-history={orderId} onToggle={e=>setOpen(e.currentTarget.open)}>
 <summary><History size={17}/><span>Histórico do pedido</span></summary>
 {open&&<div className={styles.content}>
 <div className={styles.toolbar}><p>Quem alterou, quando e o que mudou.</p><button type="button" className="text-action" disabled={busy} onClick={()=>setRefresh(v=>v+1)}><RefreshCw size={14}/>Atualizar</button></div>
 {pending&&<p className={styles.pending}>Há alterações aguardando gravação. Elas aparecerão aqui depois de salvas.</p>}
 {error&&<p role="alert" className={styles.error}>{error} <button type="button" className="text-action" onClick={()=>void load(retryCursor.current)} disabled={busy}>Tentar novamente</button></p>}
 {busy&&<p role="status" className={styles.hint}>Carregando histórico…</p>}
 {!busy&&!error&&!entries.length&&<p className={styles.empty}>Ainda não há alterações registradas para este pedido.</p>}
 <ol className={styles.timeline}>{entries.map(entry=><li key={entry.id}>
 <div className={styles.meta}><strong>{entry.actor}</strong><time dateTime={entry.at}>{date(entry.at)}</time></div>
 <details className={styles.event}><summary><span>{entry.changes[0]?.field??"Pedido atualizado"}</span><small>{entry.changes.length} {entry.changes.length===1?"alteração":"alterações"}</small></summary>
 <ul className={styles.changes}>{entry.changes.map((change,i)=><li key={i}><strong>{change.field}</strong><dl><div><dt>Antes</dt><dd>{date(change.before)}</dd></div><div><dt>Depois</dt><dd>{date(change.after)}</dd></div></dl></li>)}</ul>
 </details></li>)}</ol>
 {cursor!==null&&<button type="button" className="button" disabled={busy} onClick={()=>void load(cursor)}>Carregar anteriores</button>}
 <p className={styles.hint}>Registros a partir desta atualização, após cada gravação confirmada no painel. Alterações do ERP continuam em “Novidades neste pedido”.</p>
 </div>}
 </details>;
}
