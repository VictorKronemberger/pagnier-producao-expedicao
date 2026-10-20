"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {MessageSquare,X,Send,AtSign,ArrowLeft,Search,Link2,ChevronDown} from "lucide-react";
import {staffNames} from "../lib/staff.mjs";
import type {ChatChannel,ChatMessage} from "../lib/team-chat.mjs";
type Order={id:string;codigo:string;cliente:string};
type Draft={body:string;reference:string;clientId:string};
type ChatResponse={employee:string|null;employees:{name:string;registered:boolean}[];threads:ChatChannel[];messages:ChatMessage[];message:ChatMessage;hasOlder:boolean;error?:string};
async function api(path:string,options:RequestInit={}){const response=await fetch(path,{...options,cache:"no-store",signal:AbortSignal.timeout(15000),headers:{"Content-Type":"application/json",...options.headers}});const result=await response.json() as ChatResponse;if(!response.ok)throw Object.assign(new Error(result.error||"Não foi possível carregar o chat."),{status:response.status});return result}
const stamp=(value:string)=>new Date(value).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"});
export default function TeamChat({open,onOpen,onClose,channel,onChannel,orders,onOpenOrder,onThreads,employee,sessionActive,onSessionExpired}:{employee:string;sessionActive:boolean;onSessionExpired:()=>void;open:boolean;onOpen:()=>void;onClose:()=>void;channel:string;onChannel:(channel:string)=>void;orders:Order[];onOpenOrder:(id:string)=>void;onThreads:(threads:ChatChannel[])=>void}){
 const [threads,setThreads]=useState<ChatChannel[]>([]),[messages,setMessages]=useState<ChatMessage[]>([]),[drafts,setDrafts]=useState<Record<string,Draft>>({}),[error,setError]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[hasOlder,setHasOlder]=useState(false),[choosing,setChoosing]=useState(false),[search,setSearch]=useState(""),[referenceOpen,setReferenceOpen]=useState(false),[mentionOpen,setMentionOpen]=useState(false),[newBelow,setNewBelow]=useState(false);
 const initialHistory=useRef(true),lastLoaded=useRef(0),refreshing=useRef(new Set<string>()),retry=useRef({failures:0,after:0});
 const area=useRef<HTMLTextAreaElement>(null),scroller=useRef<HTMLDivElement>(null),panel=useRef<HTMLElement>(null),atBottom=useRef(true),active=useRef({open,channel,employee,sessionActive}),lastRead=useRef<Record<string,number>>({}),requestVersion=useRef(0),sending=useRef(false),previousFocus=useRef<HTMLElement|null>(null);
 active.current={open,channel,employee,sessionActive};
 const draft=drafts[channel]??{body:"",reference:"",clientId:""};
 const unread=threads.reduce((sum,t)=>sum+t.unread,0),mentions=threads.reduce((sum,t)=>sum+t.mentions,0),currentOrder=orders.find(o=>"order:"+o.id===channel),title=channel==="general"?"Conversa geral":currentOrder?.codigo||"Pedido indisponível";
 const originalTitle=useRef("");
 useEffect(()=>{originalTitle.current=document.title;return()=>{document.title=originalTitle.current}},[]);
 useEffect(()=>{document.title=unread?`(${unread}) Pagnier · Mensagens`:originalTitle.current},[unread]);
 const updateThreads=useCallback((value:ChatChannel[])=>{setThreads(value);onThreads(value)},[onThreads]);
 const authLost=useCallback(()=>{onSessionExpired()},[onSessionExpired]);
 useEffect(()=>{if(!open)return;previousFocus.current=document.activeElement as HTMLElement;panel.current?.querySelector<HTMLButtonElement>("button")?.focus();return()=>{previousFocus.current?.focus()}},[open]);
 const acknowledge=useCallback(async(id:number,target:string)=>{
  if(!active.current.sessionActive||!active.current.open||active.current.channel!==target||document.visibilityState!=="visible"||!atBottom.current||id<=(lastRead.current[target]??0))return;
  const person=active.current.employee;
  try{await api("/api/chat/read",{method:"POST",body:JSON.stringify({channel:target,id})});if(active.current.employee!==person)return;lastRead.current[target]=id;setThreads(old=>{const next=old.map(t=>t.channel===target&&t.lastId<=id?{...t,unread:0,mentions:0}:t);return next})}catch{}
 },[]);
 useEffect(()=>{onThreads(threads)},[threads,onThreads]);
 const refresh=useCallback(async(force=false)=>{
  const state=active.current;if(!state.sessionActive||!state.employee||document.visibilityState!=="visible")return;
  const version=requestVersion.current,key=state.employee+":"+version;
  if(refreshing.current.has(key)||!force&&Date.now()<retry.current.after)return;
  refreshing.current.add(key);
  try{
   const result=await api("/api/chat?"+(state.open?"channel="+encodeURIComponent(state.channel):"summary=1"));
   if(version!==requestVersion.current||active.current.employee!==state.employee)return;
   retry.current={failures:0,after:0};updateThreads(result.threads);setError("");
   if(state.open&&active.current.open&&state.channel===active.current.channel){
    setMessages(old=>{const map=new Map(old.map(m=>[m.id,m]));for(const m of result.messages as ChatMessage[])map.set(m.id,m);return [...map.values()].sort((a,b)=>a.id-b.id)});
    if(initialHistory.current){setHasOlder(result.hasOlder);initialHistory.current=false}setLoading(false);
    const last=result.messages.at(-1)?.id;
    if(atBottom.current){requestAnimationFrame(()=>{if(scroller.current)scroller.current.scrollTop=scroller.current.scrollHeight});if(last)void acknowledge(last,state.channel)}else if(last&&last>lastLoaded.current){setNewBelow(true)}
    lastLoaded.current=Math.max(lastLoaded.current,last??0);
   }
  }catch(e){if(version!==requestVersion.current)return;if((e as {status?:number}).status===401)authLost();else{retry.current.failures++;retry.current.after=Date.now()+Math.min(300000,15000*2**Math.min(retry.current.failures-1,5))}setError((e as Error).message);setLoading(false)}finally{refreshing.current.delete(key)}
 },[acknowledge,authLost,updateThreads]);
 useEffect(()=>{requestVersion.current++;initialHistory.current=true;lastLoaded.current=0;setMessages([]);setHasOlder(false);atBottom.current=true;setNewBelow(false);setLoading(!!employee&&open);setMentionOpen(false);setReferenceOpen(false);if(employee)void refresh(true)},[channel,open,employee,sessionActive,refresh]);
 useEffect(()=>{const timer=setInterval(()=>void refresh(),open?5000:15000);const visible=()=>{if(document.visibilityState==="visible")void refresh()};document.addEventListener("visibilitychange",visible);return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",visible)}},[refresh,open]);
 function setDraft(patch:Partial<Draft>){setDrafts(old=>({...old,[channel]:{...(old[channel]??{body:"",reference:"",clientId:""}),...patch,clientId:crypto.randomUUID()}}))}
 function choose(next:string){onChannel(next);setChoosing(false);setSearch("");setReferenceOpen(false)}
 async function send(e:React.FormEvent){e.preventDefault();if(sending.current||!draft.body.trim())return;const target=channel,person=employee,message={...draft,clientId:draft.clientId||crypto.randomUUID()};sending.current=true;setBusy(true);setError("");setDrafts(old=>({...old,[target]:message}));try{const result=await api("/api/chat",{method:"POST",body:JSON.stringify({...message,channel:target})});if(active.current.employee!==person)return;setDrafts(old=>({...old,[target]:{body:"",reference:"",clientId:""}}));if(active.current.channel===target){setMessages(old=>[...old.filter(m=>m.id!==result.message.id),result.message].sort((a,b)=>a.id-b.id));atBottom.current=true;requestAnimationFrame(()=>{if(scroller.current)scroller.current.scrollTop=scroller.current.scrollHeight});void acknowledge(result.message.id,target)}void refresh();area.current?.focus()}catch(e){if((e as {status?:number}).status===401)authLost();setError((e as Error).message)}finally{sending.current=false;setBusy(false)}}
 async function older(){if(!messages.length)return;const target=channel,before=messages[0].id,version=requestVersion.current,height=scroller.current?.scrollHeight??0;setLoading(true);try{const result=await api("/api/chat?channel="+encodeURIComponent(target)+"&before="+before);if(version!==requestVersion.current)return;setMessages(old=>{const map=new Map([...result.messages,...old].map(m=>[m.id,m]));return [...map.values()].sort((a,b)=>a.id-b.id)});setHasOlder(result.hasOlder);requestAnimationFrame(()=>{if(scroller.current)scroller.current.scrollTop+=scroller.current.scrollHeight-height})}catch(e){setError((e as Error).message)}finally{setLoading(false)}}
 function addMention(person:string){const body=draft.body.replace(/@[\p{L}]*$/u,"");setDraft({body:body+(body&&!/\s$/.test(body)?" ":"")+"@"+person+" "});setMentionOpen(false);area.current?.focus()}
 function textWithMentions(body:string){return body.split(/(@[\p{L}\p{N}_]+)/gu).map((part,i)=>staffNames.some(name=>part.toLowerCase()==="@"+name.toLowerCase())?<mark key={i}>{part}</mark>:part)}
 const orderedConversations=[...orders].sort((a,b)=>{const ta=threads.find(t=>t.channel==="order:"+a.id),tb=threads.find(t=>t.channel==="order:"+b.id);return Number(!!tb?.mentions)-Number(!!ta?.mentions)||Number(!!tb?.unread)-Number(!!ta?.unread)||(tb?.lastId??0)-(ta?.lastId??0)});
 const foundOrders=orderedConversations.filter(o=>[o.codigo,o.cliente].join(" ").toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))).slice(0,60);
 return <>
 <span className="team-chat-announcement" role="status" aria-live="polite">{unread?unread+" mensagens não lidas"+(mentions?"; "+mentions+" menções a você":""):"Nenhuma mensagem não lida"}</span>
 <button className={"team-chat-launcher "+(open?"is-open ":"")+(unread>0?"has-unread":"")} onClick={open?onClose:onOpen} aria-expanded={open} aria-controls="team-chat-panel" title={mentions?"Você foi mencionado em "+mentions+" mensagem(ns)":unread?unread+" mensagem(ns) não lida(s)":"Mensagens da equipe"} aria-label={open?"Recolher mensagens":"Abrir mensagens"}><MessageSquare size={19}/><span>Mensagens</span>{unread>0&&<b>{unread>99?"99+":unread}</b>}{mentions>0&&<AtSign size={14} aria-label="Você foi mencionado"/>}</button>
 {open&&<aside ref={panel} id="team-chat-panel" className="team-chat-panel" role="dialog" aria-label="Chat da equipe" onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();onClose()}}}>
 <header className="team-chat-header"><div><strong>Mensagens</strong><small>{employee?"Conectado como "+employee:"Comunicação da equipe"}</small></div><div><button aria-label="Fechar mensagens" onClick={onClose}><X size={19}/></button></div></header>
 {error&&<div className="team-chat-error" role="alert">{error}<button onClick={()=>void refresh(true)}>Tentar novamente</button></div>}
 <div className="team-chat-channel"><button aria-expanded={choosing} onClick={()=>{setChoosing(!choosing);setReferenceOpen(false);setSearch("")}}>{choosing?<ArrowLeft size={16}/>:<MessageSquare size={16}/>}<span>{choosing?"Escolher conversa":title}</span><ChevronDown size={15}/></button>{currentOrder&&!choosing&&<button className="text-action" onClick={()=>onOpenOrder(currentOrder.id)}>Abrir pedido</button>}</div>
 {choosing?<div className="team-chat-chooser"><label className="team-chat-search"><Search size={15}/><input aria-label="Buscar conversa por pedido" placeholder="Pedido ou cliente" value={search} onChange={e=>setSearch(e.target.value)}/></label><button className="team-chat-thread" onClick={()=>choose("general")}><span><strong>Conversa geral</strong><small>Recados e dúvidas da equipe</small></span>{!!threads.find(t=>t.channel==="general")?.unread&&<b>{threads.find(t=>t.channel==="general")?.unread}</b>}</button><p>Conversas por pedido</p>{foundOrders.map(order=>{const thread=threads.find(t=>t.channel==="order:"+order.id);return <button className="team-chat-thread" key={order.id} onClick={()=>choose("order:"+order.id)}><span><strong>{order.codigo}</strong><small>{order.cliente}</small></span>{!!thread?.mentions&&<AtSign size={14}/>} {!!thread?.unread&&<b>{thread.unread}</b>}</button>})}{!foundOrders.length&&<p>Nenhum pedido encontrado.</p>}{foundOrders.length===60&&<small>Refine a busca para encontrar outros pedidos.</small>}</div>:<>
 <div ref={scroller} className="team-chat-messages" aria-label="Histórico da conversa" onScroll={()=>{const node=scroller.current;if(!node)return;atBottom.current=node.scrollHeight-node.scrollTop-node.clientHeight<45;if(atBottom.current){setNewBelow(false);const last=messages.at(-1);if(last)void acknowledge(last.id,channel)}}}>
 {hasOlder&&<button className="text-action team-chat-older" disabled={loading} onClick={()=>void older()}>Carregar mensagens anteriores</button>}{loading&&!messages.length&&<p className="team-chat-empty">Carregando conversa…</p>}{!loading&&!messages.length&&<p className="team-chat-empty">Comece a conversa{channel==="general"?" da equipe":" sobre este pedido"}. Use @ para chamar um funcionário.</p>}
 {messages.map(message=><article key={message.id} className={"team-chat-message "+(message.author===employee?"own ":"")+(message.mentions.includes(employee)?"mentioned":"")}><div><strong>{message.author}</strong><time dateTime={message.createdAt}>{stamp(message.createdAt)}</time></div>{message.reference&&<button className="team-chat-reference" disabled={!orders.some(o=>o.id===message.reference)} onClick={()=>onOpenOrder(message.reference)}><Link2 size={12}/>{orders.find(o=>o.id===message.reference)?.codigo||"Pedido indisponível"}</button>}<p>{textWithMentions(message.body)}</p></article>)}
 </div>
 {newBelow&&<button className="team-chat-new" onClick={()=>{if(scroller.current)scroller.current.scrollTop=scroller.current.scrollHeight}}>Ir para as mensagens recentes<ChevronDown size={14}/></button>}
 <form className="team-chat-composer" onSubmit={send}>
 {referenceOpen&&<div className="team-chat-reference-picker"><input aria-label="Buscar pedido para referenciar" placeholder="Buscar pedido ou cliente" value={search} onChange={e=>setSearch(e.target.value)}/>{foundOrders.slice(0,15).map(order=><button type="button" key={order.id} onClick={()=>{setDraft({reference:order.id});setReferenceOpen(false);area.current?.focus()}}>{order.codigo} · {order.cliente}</button>)}</div>}
 {mentionOpen&&<div className="team-chat-mentions" aria-label="Mencionar funcionário">{staffNames.map(person=><button type="button" key={person} onClick={()=>addMention(person)}> @{person}</button>)}</div>}
 {draft.reference&&<div className="team-chat-attached"><Link2 size={13}/>{orders.find(o=>o.id===draft.reference)?.codigo||draft.reference}<button type="button" aria-label="Remover referência ao pedido" disabled={busy} onClick={()=>setDraft({reference:""})}><X size={13}/></button></div>}
 <textarea ref={area} aria-label="Mensagem para a equipe" rows={2} maxLength={2000} placeholder="Escreva uma mensagem… @ para mencionar" value={draft.body} disabled={busy} onChange={e=>{setDraft({body:e.target.value});setMentionOpen(/@[\p{L}]*$/u.test(e.target.value))}} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing&&!mentionOpen){e.preventDefault();e.currentTarget.form?.requestSubmit()}}}/>
 <div className="team-chat-compose-actions"><div><button type="button" aria-label="Mencionar funcionário" title="Mencionar funcionário" disabled={busy} onClick={()=>setMentionOpen(!mentionOpen)}><AtSign size={17}/></button><button type="button" aria-label="Referenciar pedido" title="Referenciar pedido" disabled={busy} onClick={()=>{setReferenceOpen(!referenceOpen);setSearch("");setMentionOpen(false)}}><Link2 size={17}/></button><small>{draft.body.length}/2000</small></div><button className="button primary" disabled={busy||!draft.body.trim()} type="submit"><Send size={15}/>{busy?"Enviando…":"Enviar"}</button></div>
 </form></>}
 </aside>}
 </>
}
