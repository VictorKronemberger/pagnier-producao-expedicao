"use client";
import {orderCarrier,carrierFilters} from "../lib/shipping-carrier.mjs";
import {emptyShipment} from "../lib/shipping.mjs";
import {isMounted} from "../lib/ready-boxes.mjs";
import {operationalGroups,stockEligibility} from "../lib/stock-orders.mjs";
import {dispatchIssues} from "../lib/dispatch.mjs";
import {quantityDifference} from "../lib/production-quantity.mjs";
import ImportantField from "./important-field";
import CarrierMark,{CarrierControl} from "./carrier-mark";
import {matchesOrderSearch} from "../lib/order-search.mjs";
import OrderCreated from "./order-created";
import ProductConference from "./product-conference";
import ProductionQuantities from "./production-quantities";
import PendingWorkspace from "./pending-workspace";
import type {BoxModel} from "../lib/box-models.mjs";
import BoxModels from "./box-models";
import ShipmentEditor from "./shipment-editor";
import BoxConference from "./box-conference";
import {inspectBoxReview} from "../lib/box-review.mjs";
import OrderShippingSummary from "./order-shipping-summary";
import InvoiceWorkspace from "./invoice-workspace";
import type {ChangeEvent} from "../lib/nomus-changes.mjs";
import type {Invoice} from "../lib/invoice.mjs";
import {shipmentOwner,shipmentOps,mergeShipment} from "../lib/shipment-groups.mjs";
import {bridgeDestination} from "../lib/packing-flow.mjs";
import PackingWorkspace from "./packing-workspace";
import {useEffect,useMemo,useRef,useState} from "react";
import {FileText,Factory,LayoutDashboard,Layers3,Search,RefreshCw,X,GripVertical,ArrowUp,ArrowDown,Check,CheckSquare,MessageSquare,UserRound,ShieldCheck,Download,LoaderCircle,ArrowRight,Flag,PanelLeftClose,PanelLeftOpen,BookOpen,Bell,CalendarDays,AlertCircle,ExternalLink,ClipboardCheck,Package,Truck} from "lucide-react";
import {move} from "../lib/queue.mjs";
import {createAutosave} from "../lib/autosave.mjs";
import {matchesCreation,SITE_START_DATE,SITE_START_LABEL,clampStart} from "../lib/date-filter.mjs";
import {isInternal,groupInternal} from "../lib/internal-production.mjs";
import {receiveOrders} from "../lib/intake.mjs";
import SalesCatalog from "./sales-catalog";
import StaffPicker,{staffStyle,staffNames} from "./staff-picker";
import type {Shipment} from "../lib/shipping.mjs";
import ManualGuide from "./manual-guide";
type OP={id:string;nome:string;produto:string;quantidade:string;unidade:string;criacao?:string;quantidadeProgramada?:string;quantidadeAnterior?:string;quantidadeAlteradaEm?:string};
type Group={estoque?:boolean;criacao?:string;id:string;codigo:string;cliente:string;ordens:OP[];vinculo?:"none"|"unknown"|"linked";itens?:{produto:string;quantidade:string;unidade:string}[]};
type Detail={atendimentoEstoque?:boolean;envio?:Shipment;responsavel:string;responsavelConferencia?:string;nota:string;situacao:string;etiqueta?:string;conferidas?:string[];expedicao?:string[];empresa?:string;vistoNomus?:string};
type Board={boxModels?:BoxModel[];invoices?:Record<string,Invoice>;sequence:string[];details:Record<string,Detail>};
type Snapshot={consultadoEm:string;ordensConsultadas:number;grupos:Group[];semVinculo:OP[];pedidos?:Group[]};
type Data={snapshot:Snapshot;board:Board;revision:number;updatedAt:string|null;updatedBy:string|null};
type Sync={changes:Record<string,{at:string;items:string[];events?:ChangeEvent[]}>;configured:boolean;lastChecked:string|null;lastCycle:string|null;partial:boolean;message:string;page:number;paginaPedidos?:number;pedidosConsultados?:number;pedidosCoberturaCompleta?:boolean;pedidosIdentificados?:number};
type Stage="backlog"|"queue"|"doing"|"blocked"|"done"|"shipping"|"sent";
const columns:{id:Stage;title:string;color:string;status:string}[]=[
{id:"backlog",title:"Pedido de venda",color:"#98aaa3",status:"A programar"},
{id:"queue",title:"Na fila",color:"#6a947c",status:"Programado"},
{id:"doing",title:"Produzindo",color:"#2e8b62",status:"Em acompanhamento"},
{id:"blocked",title:"Bloqueados",color:"#cc9760",status:"Bloqueado"},
{id:"done",title:"Conferir",color:"#154f3b",status:"Concluído"},
{id:"shipping",title:"Preparar envio",color:"#318984",status:"Pronto para envio e documentação"},
{id:"sent",title:"Enviados",color:"#447253",status:"Atendido totalmente e enviado"}];
const companies=["Maya","Sacred Connection","Four visions","Katukina","Haux Haux","Nayaku"];
const labels=["","Urgente","Atenção","Normal"];
const fresh=():Detail=>({responsavel:"",nota:"",situacao:"A programar",etiqueta:"",conferidas:[],expedicao:[],vistoNomus:""});
function stage(board:Board,id:string):Stage{if(!board.sequence.includes(id))return "backlog";const s=board.details[id]?.situacao;return s==="Atendido totalmente e enviado"?"sent":s==="Pronto para envio e documentação"?"shipping":s==="Em acompanhamento"?"doing":s==="Bloqueado"?"blocked":s==="Concluído"?"done":"queue"}
const date=(v:string)=>new Date(v).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});
const shortDate=(v?:string)=>v?v.split("-").reverse().join("/"):"Sem data";
async function request(url:string,options?:RequestInit){const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(45000),...options});let d:any;try{d=await r.json()}catch{throw Error("Não foi possível confirmar a operação. Verifique sua conexão.")}if(!r.ok)throw Error(d.error||"Operação indisponível.");return d}
export default function Dashboard(){
 const [data,setData]=useState<Data|null>(null),[board,setBoard]=useState<Board>({sequence:[],details:{}});
 const [status,setStatus]=useState("saved"),[dirty,setDirty]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [sync,setSync]=useState<Sync|null>(null),[syncError,setSyncError]=useState("");
 const [search,setSearch]=useState(""),[label,setLabel]=useState("Todas"),[company,setCompany]=useState("Todas"),[carrier,setCarrier]=useState("Todas"),[month,setMonth]=useState("all"),[start,setStart]=useState(new Date().toLocaleDateString("sv-SE",{timeZone:"America/Sao_Paulo"}).slice(0,8)+"01"),[end,setEnd]=useState(new Date().toLocaleDateString("sv-SE",{timeZone:"America/Sao_Paulo"})),[collapsed,setCollapsed]=useState(false),[prefsReady,setPrefsReady]=useState(false);
 const [selected,setSelected]=useState<string|null>(null),[tab,setTab]=useState("board"),[dragged,setDragged]=useState<string|null>(null),[over,setOver]=useState<Stage|null>(null);
 const [detailTab,setDetailTab]=useState("overview");
 const [expeditionStep,setExpeditionStep]=useState("review");
 const [focusedBox,setFocusedBox]=useState("");
 const [assemblyStep,setAssemblyStep]=useState<"small"|"outer"|"measure">("outer");
 useEffect(()=>{setExpeditionStep("review");setAssemblyStep("outer");setFocusedBox("")},[selected]);
 const [filtersOpen,setFiltersOpen]=useState(false),[changeOpen,setChangeOpen]=useState(false);
 const [invoiceId,setInvoiceId]=useState<string|null>(null),[invoiceSeed,setInvoiceSeed]=useState<string|null>(null);
 function openInvoice(id:string){setInvoiceSeed(id);setInvoiceId(null);setSelected(null);setTab("invoices")}
 const [packingOwner,setPackingOwner]=useState<string|null>(null);
 const [packingSection,setPackingSection]=useState("orders"),[packingPending,setPackingPending]=useState(false),[manualTopic,setManualTopic]=useState(""),[helpReturn,setHelpReturn]=useState("board");
 function navigate(next:string){if(next==="pending")next="unlinked";if(next===tab)return;if(packingPending&&!confirm("Descartar a seleção de pedidos / destinatário ainda não confirmada e sair? Os dados já salvos serão mantidos."))return;if(next==="help"){setHelpReturn(tab);setManualTopic("")}setPackingPending(false);setTab(next)}
 async function deletePacking(id:string){
 if(!data||loading||saving||saver.current?.isDirty())throw Error("Aguarde o salvamento antes de excluir.");
 setLoading(true);
 try{
 const result=await request("/api/board",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({owner:id,revision:data.revision})});
 boardRef.current=result.board;setBoard(result.board);saver.current?.reset(result.board,result.revision);
 setData(old=>old?{...old,board:result.board,revision:result.revision,updatedAt:result.updatedAt,updatedBy:result.updatedBy}:old);
 setPackingOwner(null);setPackingPending(false);setPackingSection("orders");
 }finally{setLoading(false)}
 }
 async function deleteInvoice(id:string){
 if(!data||loading||saving||saver.current?.isDirty())throw Error("Aguarde o salvamento antes de excluir.");
 setLoading(true);
 try{
 const result=await request("/api/board",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"invoice",invoiceId:id,revision:data.revision})});
 boardRef.current=result.board;setBoard(result.board);saver.current?.reset(result.board,result.revision);
 setData(old=>old?{...old,board:result.board,revision:result.revision,updatedAt:result.updatedAt,updatedBy:result.updatedBy}:old);
 setInvoiceId(null);
 }finally{setLoading(false)}
 }
 function showTutorial(){if(packingPending)return;setHelpReturn(tab);setManualTopic(tab==="invoices"?"invoices":tab==="unlinked"?"recovery":tab==="internal"?"production":tab==="sales"?"orders":"packing");setTab("help")}
 function openPacking(id:string){const next=shipmentOwner(boardRef.current,id);if(next!==packingOwner)setPackingSection("orders");setPackingOwner(next);setSelected(null);setTab("packing")}
 const lastDragEnd=useRef(0);
 const searchInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{
 if(selected||!["board","internal","unlinked","sales"].includes(tab))return;
 const shortcut=(e:KeyboardEvent)=>{
 if(e.defaultPrevented||e.isComposing||e.altKey)return;
 const target=e.target as HTMLElement;
 const typing=!!target.closest("input,textarea,select,[contenteditable=true],[role=textbox]");
 if((e.key.toLowerCase()==="k"&&(e.ctrlKey||e.metaKey))||(!typing&&!e.ctrlKey&&!e.metaKey&&e.key==="/")){
 e.preventDefault();searchInput.current?.focus();searchInput.current?.select();
 }else if(!typing&&!e.ctrlKey&&!e.metaKey&&e.key.toLowerCase()==="f"&&tab!=="sales"){
 e.preventDefault();setFiltersOpen(value=>!value);
 }
 };
 document.addEventListener("keydown",shortcut);return()=>document.removeEventListener("keydown",shortcut);
 },[selected,tab]);
 const boardRef=useRef<Board>({sequence:[],details:{}});
 const saver=useRef<ReturnType<typeof createAutosave>|null>(null);
 const saving=status==="saving";const saveText=error&&dirty?"Não salvo":saving?"Salvando…":dirty?"Aguardando gravação…":"Salvo";
 async function load(){
 setLoading(true);setError("");
 try{const d:Data=await request("/api/board");setData(d);const received=receiveOrders(d.board,d.snapshot.grupos);boardRef.current=received;setBoard(received);saver.current?.reset(d.board,d.revision);if(received!==d.board)saver.current?.enqueue(received)}
 catch(e){setError(e instanceof Error?e.message:"Não foi possível carregar.")}finally{setLoading(false)}
 }
 useEffect(()=>{
 saver.current=createAutosave({
 write:(next,revision)=>{const body=JSON.stringify({board:next,revision});return request("/api/board",{method:"PUT",headers:{"Content-Type":"application/json"},body,keepalive:new TextEncoder().encode(body).length<60000})},
 read:()=>request("/api/board"),
 onState:s=>{setStatus(s.status);setDirty(s.dirty);setError(s.error)},
 onSaved:d=>setData(old=>old?{...old,revision:d.revision,updatedAt:d.updatedAt,updatedBy:d.updatedBy}:old)
 });
 void load();
 return()=>saver.current?.dispose();
 },[]);
 useEffect(()=>{const aba=new URLSearchParams(window.location.search).get("aba");if(aba==="pedidos")setTab("sales");if(aba==="packing")setTab("packing");if(aba==="invoices")setTab("invoices");if(aba==="unlinked"||aba==="internal"||aba==="help"||aba==="box-settings")setTab(aba)},[]);
 useEffect(()=>{try{const p=JSON.parse(localStorage.getItem("pagnier-view")||"{}");setCollapsed(p.collapsed===true);if(carrierFilters.includes(p.carrier))setCarrier(p.carrier);if(["all","unknown","range"].includes(p.month))setMonth(p.month);if(/^\d{4}-\d{2}-\d{2}$/.test(p.start))setStart(clampStart(p.start));if(/^\d{4}-\d{2}-\d{2}$/.test(p.end))setEnd(clampStart(p.end));if(p.month==="range"&&p.end<SITE_START_DATE){setMonth("all");setStart(SITE_START_DATE);setEnd(new Date().toLocaleDateString("sv-SE",{timeZone:"America/Sao_Paulo"}))}if(["Todas",...labels].includes(p.label))setLabel(p.label);if(["Todas",...companies].includes(p.company))setCompany(p.company)}catch{}setPrefsReady(true)},[]);
 useEffect(()=>{if(prefsReady)try{localStorage.setItem("pagnier-view",JSON.stringify({collapsed,month,label,start,end,company,carrier}))}catch{}},[collapsed,month,label,start,end,company,carrier,prefsReady]);
 useEffect(()=>{const fn=(e:BeforeUnloadEvent)=>{if(saver.current?.isDirty()){void saver.current.flush();e.preventDefault();e.returnValue=""}};
 const flush=()=>{if(document.visibilityState==="hidden")void saver.current?.flush()};
 window.addEventListener("beforeunload",fn);document.addEventListener("visibilitychange",flush);
 return()=>{window.removeEventListener("beforeunload",fn);document.removeEventListener("visibilitychange",flush)}},[]);
 const ready=!!data;
 useEffect(()=>{
 if(!ready)return;let stopped=false,busy=false;
 async function poll(){if(busy||document.visibilityState==="hidden")return;busy=true;try{const d=await request("/api/nomus",{method:"POST"});if(!stopped){setSync(d);setSyncError("");setData(old=>old?{...old,snapshot:d.snapshot}:old);const received=receiveOrders(boardRef.current,d.snapshot.grupos);if(received!==boardRef.current){boardRef.current=received;setBoard(received);saver.current?.enqueue(received)}}}catch(e){if(!stopped)setSyncError(e instanceof Error?e.message:"Consulta ao Nomus indisponível.")}finally{busy=false}}
 void poll();const id=setInterval(poll,22000);const focus=()=>void poll();window.addEventListener("focus",focus);
 return()=>{stopped=true;clearInterval(id);window.removeEventListener("focus",focus)}
 },[ready]);
 useEffect(()=>{if(!selected)return;const previous=document.activeElement as HTMLElement;const modal=document.querySelector<HTMLElement>(".card-dialog");modal?.querySelector<HTMLButtonElement>("button")?.focus();const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setSelected(null);if(e.key==="Tab"&&modal){const els=[...modal.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],summary,[tabindex]')].filter(el=>el.tabIndex>=0&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=="hidden"&&!el.closest("[inert]"));const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener("keydown",key);return()=>{document.removeEventListener("keydown",key);previous?.focus()}},[selected]);
 function edit(next:Board){boardRef.current=next;setBoard(next);saver.current?.enqueue(next)}
 function update(id:string,patch:Partial<Detail>){const latest=boardRef.current;if(patch.envio)patch={...patch,envio:bridgeDestination(latest.details[id]?.envio,patch.envio)};edit({...latest,details:{...latest.details,[id]:{...fresh(),...latest.details[id],...patch}}})}
 function transfer(id:string,to:Stage,before?:string){
 const board=boardRef.current;
 const group=groups.find(g=>g.id===id);if(loading||!group||id===before||(!group.ordens.length&&to!=="backlog")||(group.ordens.length>0&&to==="backlog"))return;
 if(to==="sent"){const issues=dispatchIssues(board,id,groups);if(issues.length){setError(issues.join(" "));setSelected(id);setDetailTab("expedition");setExpeditionStep("boxes");setAssemblyStep("outer");setDragged(null);setOver(null);return}}
 if(group.estoque&&(to==="queue"||to==="doing")){setError("Este pedido sai do estoque. Continue em Conferir ou Preparar envio.");setDragged(null);setOver(null);return}
 setError("");
 let sequence=board.sequence.filter(x=>x!==id);
 if(to!=="backlog"){const i=before?sequence.indexOf(before):-1;if(i>=0)sequence.splice(i,0,id);else if(board.sequence.includes(id)&&stage(board,id)!==to)sequence=[...board.sequence];else sequence.push(id)}
 edit({...board,sequence,details:{...board.details,[id]:{...fresh(),...board.details[id],situacao:columns.find(c=>c.id===to)!.status}}});setDragged(null);setOver(null)
 }
 function reload(){if(packingPending){setError("Confirme ou descarte a seleção de pedidos e destinatário antes de recarregar.");return}if(!saving&&(!dirty||confirm("Descartar as edições ainda não salvas e carregar a versão compartilhada?"))){saver.current?.pause();void load()}}
 function startStock(id:string){
 const raw=[...(data?.snapshot.pedidos??[]),...(data?.snapshot.grupos??[])].find(g=>g.id===id),reason=stockEligibility(raw);
 if(reason){setError(reason);return}
 const current=boardRef.current;edit({...current,sequence:[...new Set([...current.sequence,id])],details:{...current.details,[id]:{...fresh(),...current.details[id],atendimentoEstoque:true,situacao:"Concluído"}}});setTab("board");setSelected(id);setDetailTab("expedition");setExpeditionStep("review");
 }
 const groups:Group[]=operationalGroups(data?.snapshot,board);
 const matchesMonth=(o:OP)=>matchesCreation(o,month,start,end);
 const uncertain=groups.filter(g=>!g.ordens.length&&g.vinculo!=="none");
 const inMonth=groups.filter(g=>g.ordens.length?g.ordens.some(matchesMonth):month==="all"&&g.vinculo==="none").map(g=>({...g,ordens:g.ordens.filter(matchesMonth)}));
 const visible=useMemo(()=>inMonth.filter(g=>g.ordens.length>0).filter(g=>{return(carrier==="Todas"||orderCarrier(board,g.id).category===carrier)&&(company==="Todas"||(board.details[g.id]?.empresa??"")===company)&&(label==="Todas"||(board.details[g.id]?.etiqueta??"")===label)&&matchesOrderSearch(g,search)}),[inMonth,search,label,company,carrier,board.details,board.invoices]);
 const ordered=[...board.sequence.map(id=>visible.find(g=>g.id===id)).filter(Boolean) as Group[],...visible.filter(g=>!board.sequence.includes(g.id))];
 const active=groups.find(g=>g.id===selected),activeOps=active?.ordens.filter(matchesMonth)??[];
 const owner=active?shipmentOwner(board,active.id):"",shipment=board.details[owner]?.envio;
 const shippingOps=shipmentOps(shipment,owner,groups),boxReview=inspectBoxReview(shipment,shippingOps);
 const activeCarrier=active?orderCarrier(board,active.id):{value:"",category:"A definir",source:""};
 function changeShipmentCarrier(transportadora:string){if(active)update(owner,{envio:{...(boardRef.current.details[owner]?.envio??emptyShipment()),transportadora}})}
 function showBox(id:string){if(!active)return;setFocusedBox(id);setAssemblyStep(isMounted(shipment?.caixas.find(b=>b.id===id))?"measure":"outer");setDetailTab("expedition");setExpeditionStep("boxes");setTimeout(()=>{const el=document.getElementById("shipment-box-"+id) as HTMLElement|null;if(el){el.scrollIntoView({block:"center",behavior:"smooth"})}},100)}
 const detail=active?{...fresh(),...board.details[active.id]}:fresh();
 const unlinked=(data?.snapshot.semVinculo??[]).filter(matchesMonth).filter(o=>[o.nome,o.produto].join(" ").toLowerCase().includes(search.toLowerCase()));
 const internal=groupInternal(unlinked.filter(isInternal));
 const pendingLinks=unlinked.filter(o=>!isInternal(o));
 const unlinkedCount=(data?.snapshot.semVinculo??[]).filter(o=>!isInternal(o)&&matchesCreation(o,"all","","")).length;
 function openUnlinked(){setSearch("");setMonth("all");navigate("unlinked")}
 const unknown=[...groups.flatMap(g=>g.ordens),...(data?.snapshot.semVinculo??[])].filter(o=>!o.criacao).length;
 const change=active?sync?.changes[active.id]:null;
 function unseen(id:string){const c=sync?.changes[id];return c&&c.at>(board.details[id]?.vistoNomus??"")}
 function exportCsv(){
 const rows=[["Prioridade","Pedido","Cliente","Coluna","Responsável pela conferência","Etiqueta","Empresa","Observação","Recorte criação OP"],...visible.map(g=>[board.sequence.includes(g.id)?String(board.sequence.indexOf(g.id)+1):"",g.codigo,g.cliente,columns.find(c=>c.id===stage(board,g.id))!.title,board.details[g.id]?.responsavelConferencia??"",board.details[g.id]?.etiqueta??"",board.details[g.id]?.empresa??"",board.details[g.id]?.nota??"",month==="range"?start+" a "+end:month])];
 const csv="\uFEFF"+rows.map(r=>r.map(x=>'"'+String(x).replace(/^[=+@-]/,"'"+String(x)[0]).replaceAll('"','""')+'"').join(";")).join("\r\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="quadro-producao.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
 }
 const saveIndicator=<span className={"autosave-status "+(error&&dirty?"failed":"")} role="status" aria-live="polite">{saving?<LoaderCircle size={15} className="spin"/>:error&&dirty?<AlertCircle size={15}/>:<Check size={15}/>}<span>{saveText}</span></span>;
 function openCard(id:string){if(Date.now()-lastDragEnd.current<300)return;setSelected(id);setDetailTab("overview");setChangeOpen(false)}
 function nextLabel(id:string){return ({backlog:"Ver pedido",queue:"Iniciar produção",doing:"Concluir produção",blocked:"Ver o impedimento",done:"Conferir pedido",shipping:"Preparar envio",sent:"Ver rastreio"})[stage(board,id)]}
 function nextAction(id:string){const current=stage(boardRef.current,id);if(current==="queue"||current==="doing"){transfer(id,current==="queue"?"doing":"done");return;}if(current==="shipping"){openCard(id);setDetailTab("expedition");return;}openCard(id);setDetailTab(current==="done"?"expedition":current==="sent"?"shipping":"overview")}
 const laneColumns=columns.filter(c=>c.id!=="backlog");
 function clearFilters(){setCarrier("Todas");setSearch("");setCompany("Todas");setLabel("Todas");setMonth("all")}
 const activeFilters=[
 ...(tab==="board"&&carrier!=="Todas"?[{key:"carrier",text:"Envio: "+carrier,clear:()=>setCarrier("Todas")}]:[]),
 ...(tab!=="sales"&&month!=="all"?[{key:"date",text:month==="unknown"?"Sem data de criação":"Criação: "+shortDate(start)+" a "+shortDate(end),clear:()=>setMonth("all")}]:[]),
 ...(tab==="board"&&company!=="Todas"?[{key:"company",text:"Empresa: "+company,clear:()=>setCompany("Todas")}]:[]),
 ...(tab==="board"&&label!=="Todas"?[{key:"label",text:"Prioridade: "+label,clear:()=>setLabel("Todas")}]:[])
 ];
 function card(g:Group){
 const carrierInfo=orderCarrier(board,g.id);
 const d={...fresh(),...board.details[g.id],envio:board.details[shipmentOwner(board,g.id)]?.envio},pos=board.sequence.indexOf(g.id),reduced=g.ordens.filter(o=>quantityDifference(o).reduced),increased=g.ordens.filter(o=>quantityDifference(o).increased);
 return <article key={g.id} onClick={e=>{if((e.target as Element).closest("button,a,input,select,textarea,summary")||dragged)return;openCard(g.id)}} draggable={!loading&&g.ordens.length>0} onDragStart={e=>{e.dataTransfer.setData("text/plain",g.id);e.dataTransfer.effectAllowed="move";setDragged(g.id)}} onDragEnd={()=>{lastDragEnd.current=Date.now();setDragged(null);setOver(null)}} onDragOver={e=>{if(dragged){e.preventDefault();e.stopPropagation();setOver(stage(board,g.id))}}} onDrop={e=>{e.preventDefault();e.stopPropagation();transfer(e.dataTransfer.getData("text/plain"),stage(board,g.id),g.id)}} className={"kanban-card stage-"+stage(board,g.id)+" "+(dragged===g.id?"dragging":"")}>
 <div className="card-top"><span className="order-heading"><span className="order-code">{g.codigo}</span><OrderCreated value={g.criacao}/></span><div>{d.etiqueta&&<span className={"label label-"+d.etiqueta}>{d.etiqueta}</span>}<GripVertical size={16} className="grip"/></div></div>
 <button className="card-open" onClick={()=>openCard(g.id)}><h3>{g.cliente||"Cliente aguardando consulta"}</h3></button>
 {carrierInfo.category!=="A definir"&&<span className={"carrier-tag carrier-"+carrierInfo.category.toLowerCase()}><CarrierMark value={carrierInfo.value||carrierInfo.category}/></span>}
 {g.estoque&&<span className="company-tag">Estoque · sem OP</span>}
 {d.empresa&&<span className={"company-tag company-"+companies.indexOf(d.empresa??"")}>{d.empresa}</span>}
 {unseen(g.id)&&<button className="change-badge" onClick={()=>{openCard(g.id);setChangeOpen(true)}}><Bell size={12}/>Atualização no Nomus</button>}
 {(reduced.length>0||increased.length>0)&&<button className="change-badge quantity-change" onClick={()=>openCard(g.id)}><AlertCircle size={12}/>{reduced.length?reduced.length+" OP(s) com quantidade reduzida":increased.length+" OP(s) com quantidade aumentada"}</button>}
 <div className="product-preview">{g.ordens.slice(0,2).map(o=><p key={o.id} title={o.produto}>{o.produto}</p>)}{g.ordens.length>2&&<span>+ {g.ordens.length-2} OPs</span>}{!g.ordens.length&&<><span>Aguardando criação da OP</span>{g.itens?.slice(0,2).map((item,i)=><p key={i}>{item.produto}</p>)}</>}</div>
 <div className="card-bottom"><div className="badges">{pos>=0&&<span className="priority" title="Prioridade global">#{pos+1}</span>}<span><Layers3 size={14}/>{g.ordens.length} {g.estoque?"produtos":"OPs"}</span>{d.envio?.caixas?.length?<span><Package size={14}/>{d.envio.caixas.length} caixas</span>:null}{!!d.envio?.caixasEmMontagem?.length&&<span title="Embalagens aguardando acomodação na maior"><Package size={14}/>{d.envio.caixasEmMontagem.length} embalagens em preparo</span>}{d.nota&&<MessageSquare size={14} aria-label="Possui observações"/>}</div><span style={staffStyle(d.responsavelConferencia)} className={"avatar "+(!d.responsavelConferencia?"empty-avatar":"")} title={d.responsavelConferencia?"Conferência: "+d.responsavelConferencia:"Conferência sem responsável"}>{d.responsavelConferencia?d.responsavelConferencia.trim().split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase():<UserRound size={14}/>}</span></div>
 {d.envio?.rastreio&&<div className="tracking-card" title={d.envio.rastreio}><Truck size={14}/><span>{d.envio.rastreio}</span></div>}
 <div className="card-quick"><button className="card-next-action card-open-hint" disabled={loading} onClick={()=>nextAction(g.id)}>{nextLabel(g.id)}<ArrowRight size={14}/></button>{pos>=0&&<div><button aria-label={"Subir prioridade de "+g.codigo} disabled={loading||pos===0} onClick={()=>edit({...board,sequence:move(board.sequence,g.id,-1)})}><ArrowUp size={15}/></button><button aria-label={"Descer prioridade de "+g.codigo} disabled={loading||pos===board.sequence.length-1} onClick={()=>edit({...board,sequence:move(board.sequence,g.id,1)})}><ArrowDown size={15}/></button></div>}</div>
 </article>
 }
 return <div className={"trello-shell "+(collapsed?"sidebar-collapsed":"")}>
 <aside className="sidebar">
 <div className="brand brand-pagnier" aria-label="Pagnier — Produção e expedição"><img className="brand-logo-full" src="/pagnier-logo.png" alt="Pagnier Comércio LTDA - ME" width="901" height="370"/><span className="brand-logo-compact" aria-hidden="true"><img src="/pagnier-logo.png" alt="" width="901" height="370"/></span><span className="brand-caption"><i aria-hidden="true"/>Produção e expedição</span></div>
 <button className="collapse-button" title={collapsed?"Expandir menu":"Recolher menu"} aria-label={collapsed?"Expandir menu":"Recolher menu"} aria-expanded={!collapsed} onClick={()=>setCollapsed(!collapsed)}>{collapsed?<PanelLeftOpen size={19}/>:<PanelLeftClose size={19}/>}<span>Recolher menu</span></button>
 <nav aria-label="Navegação principal">{[["board","Produção",LayoutDashboard],["sales","Pedidos de venda",ClipboardCheck],["packing","Packing lists",Package],["invoices","Invoices FedEx / DHL",FileText],["unlinked","Pendências",AlertCircle],["box-settings","Configurações de caixas",Package],["help","Manual de boas práticas",BookOpen]].map(([key,title,Icon])=>{const I=Icon as typeof Factory;return <button key={key as string} title={key==="unlinked"&&unlinkedCount?"Pendências · "+unlinkedCount+" OP(s) sem vínculo com pedido":title as string} aria-label={title as string} aria-describedby={key==="unlinked"&&unlinkedCount?"pending-count":undefined} className={tab===key||key==="board"&&tab==="internal"?"active":""} onClick={()=>key==="unlinked"?openUnlinked():navigate(key as string)}><I size={20}/><span className="nav-label">{title as string}</span>{key==="unlinked"&&unlinkedCount>0&&<span id="pending-count" className="pending-count" role="status" aria-label={unlinkedCount+" OP(s) com vínculo pendente"}>{unlinkedCount>99?"99+":unlinkedCount}</span>}</button>})}</nav>
 <div className="side-bottom" title="Integração com Nomus somente leitura"><ShieldCheck size={20}/><span className="nav-label">Nomus · somente leitura</span></div>
 </aside>
 <main className="board-main">
 <header className="global-bar"><div><span className="header-dot"/><h1>{tab==="box-settings"?"Configurações de caixas":tab==="invoices"?"Invoices FedEx / DHL":tab==="packing"?"Packing lists":tab==="board"?"Produção":tab==="internal"?"Produção":tab==="unlinked"?"Pendências":tab==="sales"?"Pedidos de venda":"Manual de boas práticas"}</h1></div><div className="heading-actions">{saveIndicator}<button className="icon-button" onClick={reload} disabled={saving||loading} aria-label="Recarregar quadro" title="Recarregar quadro"><RefreshCw size={17} className={loading?"spin":""}/></button>{tab==="board"&&<button className="button ghost" onClick={exportCsv} disabled={!data}><Download size={16}/><span>Exportar</span></button>}</div></header>
 {(tab==="board"||tab==="internal")&&<div className="production-view-switch" aria-label="Tipo de produção"><button className={tab==="board"?"active":""} aria-pressed={tab==="board"} onClick={()=>navigate("board")}><ClipboardCheck size={16}/>Pedidos de clientes</button><button className={tab==="internal"?"active":""} aria-pressed={tab==="internal"} onClick={()=>navigate("internal")}><Factory size={16}/>Interna em KG</button></div>}
 {tab!=="invoices"&&tab!=="packing"&&tab!=="help"&&<div className="board-tools simple-tools"><div className="search" role="search" aria-label="Pesquisar pedidos"><Search size={19} aria-hidden="true"/><input type="search" autoComplete="off" ref={searchInput} aria-keyshortcuts="/ Control+k Meta+k" aria-label="Buscar no quadro" placeholder="Nº do pedido, cliente, OP ou produto" title="Buscar pelo número do pedido de venda, cliente, OP ou produto" value={search} onChange={e=>setSearch(e.target.value)}/>{!search&&<kbd className="search-shortcut" aria-hidden="true" title="Buscar: / ou Ctrl/Cmd + K">/</kbd>}{search&&<button type="button" className="search-clear" aria-label="Limpar busca" onClick={()=>{setSearch("");searchInput.current?.focus()}}><X size={16} aria-hidden="true"/></button>}</div>{tab!=="sales"&&<button className={"button filter-toggle "+(filtersOpen?"active":"")} aria-expanded={filtersOpen} aria-controls="board-filter-panel" title="Mostrar ou ocultar filtros (F)" onClick={()=>setFiltersOpen(!filtersOpen)}><CalendarDays size={16}/>Filtros{activeFilters.length>0&&<span className="filter-count" aria-label={activeFilters.length+" filtros ativos"}>{activeFilters.length}</span>}</button>}{(search||activeFilters.length>0)&&<button className="text-action" onClick={clearFilters}>Limpar filtros</button>}
 {tab!=="sales"&&filtersOpen&&<div id="board-filter-panel" className="filters-panel"><div className="month-filter"><label htmlFor="month-mode">Criação da OP</label><select id="month-mode" value={month} onChange={e=>setMonth(e.target.value)}><option value="all">Desde {SITE_START_LABEL}</option><option value="range">Intervalo de datas</option><option value="unknown">Sem data</option></select>{month==="range"&&<div className="date-range"><label>De<input type="date" aria-label="Data inicial de criação das OPs" min={SITE_START_DATE} value={start} onChange={e=>setStart(clampStart(e.target.value))}/></label><label>Até<input type="date" aria-label="Data final de criação das OPs" min={start||SITE_START_DATE} value={end} onChange={e=>setEnd(clampStart(e.target.value))}/></label></div>}</div>{tab==="board"&&<><label>Empresa<select aria-label="Filtrar empresas" value={company} onChange={e=>setCompany(e.target.value)}><option value="Todas">Todas as empresas</option>{companies.map(v=><option key={v}>{v}</option>)}</select></label><label>Envio<select aria-label="Filtrar transportadora" value={carrier} onChange={e=>setCarrier(e.target.value)}>{carrierFilters.map(c=><option key={c} value={c}>{c==="Todas"?"Todas as transportadoras":c}</option>)}</select></label><label>Prioridade<select aria-label="Filtrar etiquetas" value={label} onChange={e=>setLabel(e.target.value)}><option value="Todas">Todas as etiquetas</option>{labels.filter(Boolean).map(v=><option key={v}>{v}</option>)}</select></label></>}</div>}
 {activeFilters.length>0&&<div className="active-filters" aria-label="Filtros ativos">{activeFilters.map(filter=><button key={filter.key} onClick={filter.clear} aria-label={"Remover filtro: "+filter.text}>{filter.text}<X size={12}/></button>)}</div>}</div>}

 {tab!=="invoices"&&tab!=="packing"&&tab!=="help"&&tab!=="sales"&&month==="range"&&(!start||!end||start>end)&&<div role="alert" className="error-banner">Informe as duas datas. A data inicial deve ser anterior ou igual à final.</div>}
 {tab!=="invoices"&&tab!=="packing"&&tab!=="help"&&tab!=="sales"&&<div className="data-strip"><span role="status" aria-live="polite">{tab==="board"?visible.length===0&&(search||activeFilters.length>0)?"Nenhum pedido encontrado. Ajuste a busca ou limpe os filtros.":visible.length+ (visible.length===1?" pedido exibido":" pedidos exibidos"):(tab==="internal"?unlinked.filter(isInternal).length+" OPs internas":pendingLinks.length+" correções · "+uncertain.length+" aguardando consulta")}{month!=="all"&&" no recorte"}{unknown>0&&<button onClick={()=>{setMonth("unknown");setFiltersOpen(true)}}>{unknown} sem data</button>}</span><button className={"sync-status "+(syncError||sync?.partial?"partial":"")} onClick={()=>navigate("help")} title={syncError||sync?.message||"Verificando conexão"}><span className="status-dot"/>{syncError?"Consulta indisponível":!sync?"Conectando ao Nomus…":!sync.configured?"Nomus não conectado":sync.partial?"Base parcial":"Nomus conectado"}{sync?.lastChecked&&" · "+new Date(sync.lastChecked).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"})}</button></div>}
 {error&&<div role="alert" className="error-banner"><span>{error}</span>{dirty&&<button disabled={saving} onClick={()=>void saver.current?.retry()}>Tentar novamente</button>}<button disabled={saving} onClick={reload}>Recarregar</button></div>}

 {loading&&!data?<div className="loading"><LoaderCircle className="spin"/>Carregando…</div>:!data?<div className="loading"><button onClick={reload}>Tentar novamente</button></div>:tab==="box-settings"?<section className="box-settings-page shipment-section"><header><h2>Modelos de caixas</h2><p>Cadastre medidas e limites para reutilizar ao criar novas caixas.</p></header><BoxModels expanded models={board.boxModels??[]} onChange={boxModels=>edit({...boardRef.current,boxModels})} onSelect={()=>{}} disabled={loading}/></section>:tab==="invoices"?<InvoiceWorkspace onDelete={deleteInvoice} invoices={board.invoices??{}} orders={[...new Map([...(data.snapshot.pedidos??[]),...groups].map(o=>[o.id,o])).values()]} board={board} selected={invoiceId} onSelect={setInvoiceId} seedOrder={invoiceSeed} onChange={invoice=>edit({...boardRef.current,invoices:{...boardRef.current.invoices,[invoice.id]:invoice}})} onHelp={showTutorial} onOpenPacking={openPacking} disabled={loading} canExport={!dirty&&!saving&&!loading}/>:tab==="packing"?<PackingWorkspace onDelete={deletePacking} onInvoice={openInvoice} section={packingSection} onSection={setPackingSection} onPending={setPackingPending} onHelp={showTutorial} onOpenOrder={id=>{setSelected(id);setDetailTab("expedition");setTab("board")}} groups={groups} board={board} owner={packingOwner} onSelect={setPackingOwner} disabled={loading} canExport={!dirty&&!saving&&!loading} onChange={(id,envio)=>update(id,{envio})} onGroup={(id,ids,holder,patch)=>{const envio=mergeShipment(boardRef.current,id,ids,holder,patch,new Date().toISOString(),()=>crypto.randomUUID());update(id,{envio})}}/>:tab==="sales"?<SalesCatalog onStock={startStock} stockIds={new Set(Object.keys(board.details).filter(id=>board.details[id].atendimentoEstoque))} onInvoice={openInvoice} onPacking={openPacking} orders={data.snapshot.pedidos??[]} search={search} complete={sync?.pedidosCoberturaCompleta??false} identified={sync?.pedidosIdentificados??0} nextPage={sync?.paginaPedidos??1} boardIds={new Set(groups.filter(g=>g.ordens.length).map(g=>g.id))} onOpen={id=>{setSelected(id);setDetailTab("overview")}}/>:tab==="board"?<section className="kanban" aria-label="Quadro de produção">{laneColumns.map(c=>{const cards=ordered.filter(g=>stage(board,g.id)===c.id);return <section className={"kanban-list "+(over===c.id?"drop-active":"")} key={c.id} style={{borderTopColor:c.color}} onDragOver={e=>{if(dragged){e.preventDefault();setOver(c.id)}}} onDrop={e=>{e.preventDefault();transfer(e.dataTransfer.getData("text/plain"),c.id)}} aria-label={c.title}><div className="list-heading"><span className="list-dot" style={{background:c.color}}/><h2>{c.title}</h2><span className="list-count">{cards.length}</span></div><div className="list-cards">{cards.map(card)}{!cards.length&&<div className="empty-list">{search||label!=="Todas"||company!=="Todas"||month!=="all"?"Sem cartões neste recorte":"Nenhum pedido"}</div>}</div></section>})}</section>:tab==="internal"?<section className="content-panel internal-panel"><p className="pending-help"><strong>Produção interna em KG não exige pedido de venda.</strong> Estas OPs são acompanhadas por produto e não contam como pendência de vínculo. Medicina Sagrada permanece fora do painel.</p><button className="button ghost" onClick={showTutorial}>Ver orientação no manual</button><div className="internal-summary"><span>{internal.length} produtos</span><span>OPs sem pedido · produção em KG</span></div>{internal.map(g=><details key={g.product} className="internal-group" open><summary><span className="internal-icon"><Factory size={18}/></span><h2>{g.product}</h2><span>{g.orders.length} OPs</span></summary><div className="internal-orders">{g.orders.map(o=><article key={o.id}><strong>{o.nome}</strong><span>Criada em {shortDate(o.criacao)}</span><b>{o.quantidade}<small>{o.unidade}</small></b></article>)}</div></details>)}{!internal.length&&<p>Nenhuma OP de produção interna neste recorte.</p>}</section>:tab==="unlinked"?<PendingWorkspace ops={pendingLinks} orders={uncertain.filter(g=>[g.codigo,g.cliente].join(" ").toLowerCase().includes(search.toLowerCase()))} onHelp={showTutorial} onOrder={id=>{setSelected(id);setDetailTab("overview")}}/>:<section className="manual-panel"><div className="manual-intro"><BookOpen size={28}/><div><h2>Manual de boas práticas</h2><p>Orientações simples para cada etapa do trabalho.</p></div></div><ManualGuide topic={manualTopic} onNavigate={navigate} onBack={()=>navigate(helpReturn)}/><details className="manual-system-info"><summary>Conexão, empresas e responsáveis</summary><div className="connection-detail"><ShieldCheck size={18}/><div><strong>Nomus · acesso somente leitura</strong><p>{syncError||sync?.message||"Consultando a conexão."} {sync?.lastChecked?"Última página consultada: "+date(sync.lastChecked)+".":""} {sync?.configured?"Consulta por páginas enquanto o painel estiver aberto.":"Configure a conexão no servidor para acompanhar alterações."}</p></div></div><details className="label-guide"><summary>Empresas e responsáveis disponíveis</summary><strong>Empresas</strong><div>{companies.map((name,i)=><span key={name} className={"company-tag company-"+i}>{name}</span>)}</div><strong>Funcionários</strong><div>{staffNames.map(name=><span key={name} className="staff-tag"><i style={staffStyle(name)}/>{name}</span>)}</div><strong>Etiquetas</strong><div>{labels.filter(Boolean).map(name=><span key={name} className={"label label-"+name}>{name}</span>)}</div></details></details></section>}
 <footer className="board-footer"><span>Prioridade definida pelo supervisor</span><span>{data?.updatedAt?"Quadro salvo às "+new Date(data.updatedAt).toLocaleTimeString("pt-BR",{timeZone:"America/Sao_Paulo"}):"Salvamento automático"}</span></footer>
 </main>
 {active&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><section className="card-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={e=>e.stopPropagation()}>
 <button className="close" aria-label="Fechar cartão" onClick={()=>setSelected(null)}><X size={22}/></button>
 <div className="dialog-header"><Layers3 size={24}/><div><p className="order-heading">{active.codigo}<OrderCreated value={active.criacao}/></p><h2 id="dialog-title">{active.cliente||"Cliente aguardando consulta"}</h2><span>{columns.find(c=>c.id===stage(board,active.id))!.title}{board.sequence.includes(active.id)?" · Prioridade #"+(board.sequence.indexOf(active.id)+1):""}</span></div></div>
 {change&&<details hidden={detailTab!=="overview"} className="change-detail compact-changes" open={changeOpen} onToggle={e=>setChangeOpen(e.currentTarget.open)}><summary><Bell size={17}/><strong>{unseen(active.id)?"Novidades neste pedido":"Histórico do pedido"}</strong><span>Ver o que mudou</span></summary><div><small>Detectada em {date(change.at)}</small><div className="change-events">{(change.events??[]).map((event,i)=><article className="change-event" key={event.at+event.summary+i}><h4>{event.summary}</h4><small>{date(event.at)}</small>{event.fields.length>0&&<div className="change-table-wrap"><table><thead><tr><th>Campo</th><th>Antes</th><th>Agora</th></tr></thead><tbody>{event.fields.map((f,j)=><tr key={f.label+j}><th>{f.label}</th><td>{f.before||"Não informado"}</td><td>{f.after||"Não informado"}</td></tr>)}</tbody></table></div>}{event.note&&<p>{event.note}</p>}</article>)}</div>{change.items.some(t=>!(change.events??[]).some(e=>e.summary===t))&&<div className="change-legacy"><p>Avisos anteriores: o sistema não guardou o comparativo destes registros.</p><ul>{change.items.filter(t=>!(change.events??[]).some(e=>e.summary===t)).map(t=>{const op=t.startsWith("Nova OP ")?active.ordens.find(o=>o.id===t.slice(8)):undefined;return <li key={t}>{t}{op&&<span className="change-current">Dados atuais: {op.produto} · {op.quantidade} {op.unidade}</span>}</li>})}</ul></div>}{unseen(active.id)&&<button onClick={()=>update(active.id,{vistoNomus:change.at})}><Check size={14}/>Marcar como visto</button>}</div></details>}
 <nav className="detail-tabs" aria-label="Seções do cartão">{[["overview","Geral",LayoutDashboard],["expedition","Expedição",Package],["shipping","Documentos",FileText]].map(([key,title,Icon])=>{const I=Icon as typeof Factory;return <button type="button" key={key as string} data-detail-tab={key} aria-pressed={detailTab===key} className={detailTab===key?"active":""} onClick={()=>setDetailTab(key as string)}><I size={16}/><span>{title as string}</span></button>})}</nav>
 <div className="detail-panel" hidden={detailTab!=="overview"}>{active.estoque?<p className="check-help">Pedido atendido com produtos do estoque. Confira, embale e documente sem criar OP. O painel não realiza baixa de estoque no Nomus.</p>:<ProductionQuantities ops={activeOps}/>}
 <fieldset disabled={loading} className="dialog-fields carrier-fields"><label><ArrowRight size={15}/>Mover para<select value={stage(board,active.id)} onChange={e=>transfer(active.id,e.target.value as Stage)}>{columns.filter(c=>active.estoque?["blocked","done","shipping","sent"].includes(c.id):active.ordens.length?c.id!=="backlog":c.id==="backlog").map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label><Flag size={15}/>Etiqueta<select className={"label-select label-"+(detail.etiqueta??"")} value={detail.etiqueta??""} onChange={e=>update(active.id,{etiqueta:e.target.value})}>{labels.map(l=><option key={l} value={l}>{l||"Sem etiqueta"}</option>)}</select></label><label><Factory size={15}/>Empresa<select className={"company-select company-"+companies.indexOf(detail.empresa??"")} value={detail.empresa??""} onChange={e=>update(active.id,{empresa:e.target.value})}><option value="">Sem empresa</option>{companies.map(c=><option key={c}>{c}</option>)}</select></label><label><Truck size={15}/>Envio<CarrierControl value={activeCarrier.value}><select aria-label="Etiqueta de envio" className={"carrier-select carrier-"+activeCarrier.category.toLowerCase()} value={activeCarrier.value} onChange={e=>changeShipmentCarrier(e.target.value)}><option value="" disabled={activeCarrier.source==="invoice"}>{activeCarrier.category==="Múltiplas"?"Múltiplas nas invoices":"A definir"}</option><option>FedEx</option><option>DHL</option><option value="Outra">Outra transportadora</option>{activeCarrier.value&&!["FedEx","DHL","Outra"].includes(activeCarrier.value)&&<option value={activeCarrier.value}>{activeCarrier.value}</option>}</select></CarrierControl></label></fieldset>
 <div className="dialog-section supervisor-notes"><h3><MessageSquare size={18}/>Orientações do supervisor</h3><p className="check-help">Orientações e pendências para a equipe. Preenchimento pelo supervisor de produção.</p><textarea aria-label="Orientações e pendências do supervisor de produção" disabled={loading} maxLength={1500} rows={3} value={detail.nota} placeholder="Supervisor: registre as orientações, pendências e responsáveis pela resolução." onChange={e=>update(active.id,{nota:e.target.value})}/></div>
 </div><div className="detail-panel" hidden={detailTab!=="expedition"}>
 <nav className="detail-tabs expedition-tabs" aria-label="Etapas da expedição">{[["review","1. Conferir produtos"],["boxes","2. Montar caixas"]].map(([key,title])=><button key={key} data-expedition-step={key} className={expeditionStep===key?"active":""} aria-pressed={expeditionStep===key} onClick={()=>setExpeditionStep(key)}>{title}</button>)}</nav>
 {shipment?.agrupamento&&shipment.agrupamento.pedidos.length>1&&<p className="group-notice">Caixas compartilhadas: {shipment.agrupamento.pedidos.join(", ")}. Alterações valem para todo o envio.</p>}
 {detailTab==="expedition"&&expeditionStep==="boxes"&&<><ShipmentEditor initialBoxId={focusedBox} assemblyStep={assemblyStep} onAssemblyStepChange={setAssemblyStep} models={board.boxModels??[]} value={shipment} ops={shippingOps} disabled={loading} onChange={envio=>update(owner,{envio})}/><div className="flow-actions"><button className="text-action" onClick={()=>setExpeditionStep("review")}>Voltar à conferência dos produtos</button></div>{assemblyStep==="measure"&&!!shipment?.caixas.length&&<BoxConference value={shipment} ops={shippingOps} person={detail.responsavelConferencia??""} disabled={loading||dirty||saving} onChange={envio=>update(owner,{envio})} onDocuments={()=>setDetailTab("shipping")}/>}</>}
 {expeditionStep==="review"&&<ProductConference key={active.id} ops={active.ordens} value={shipment} carrier={activeCarrier.value} carrierSource={activeCarrier.source} onCarrier={changeShipmentCarrier} person={detail.responsavelConferencia??""} stock={active.estoque} disabled={loading} onPerson={value=>update(active.id,{responsavelConferencia:value})} onBox={showBox} onContinue={()=>setExpeditionStep("boxes")}/>}
 </div>
 <div className="detail-panel" hidden={detailTab!=="shipping"}><OrderShippingSummary reviewed={boxReview.reviewed} onExpedition={()=>{setDetailTab("expedition");setAssemblyStep(shipment?.caixasEmMontagem?.length?"small":"outer");setExpeditionStep(shipment?.caixas.length||shipment?.caixasEmMontagem?.length?"boxes":"review")}} shipment={shipment} orderIds={shipment?.agrupamento?.pedidos??[active.id]} onPacking={()=>{openPacking(active.id);setPackingSection("orders")}} onInvoice={()=>openInvoice(active.id)}/></div>
 <div className="dialog-footer">{saveIndicator}<button className="button" onClick={()=>setSelected(null)}>Fechar</button></div>{error&&<div className="dialog-error" role="alert">{error}<button disabled={saving} onClick={()=>void saver.current?.retry()}>Tentar novamente</button></div>}
 </section></div>}
 </div>
}
