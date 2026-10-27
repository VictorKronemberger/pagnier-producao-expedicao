"use client";
import ProductIdentity from "./product-identity";
import ArchiveActions from "./archive-actions";
import OrderHistory from "./order-history";
import ArchiveHistory from "./archive-history";
import archiveStyles from "./archive.module.css";
import {isCancelledOP,cancelledProduction} from "../lib/op-status.mjs";
import ThemeToggle from "./theme-toggle";
import HeaderMenu from "./header-menu";
import NomusCapture from "./nomus-capture";
import {shipmentProducts} from "../lib/direct-box-rule.mjs";
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
import OrderReleaseNotice from "./order-release-notice";
import OrderProductionSummary from "./order-production-summary";
import {awaitsRelease,canQueue,hasStarted,type ReleaseState} from "../lib/order-release.mjs";
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
import DocumentationReady from "./documentation-ready";
import TeamChat from "./team-chat";
import type {ChatChannel} from "../lib/team-chat.mjs";
import {documentationReady} from "../lib/documentation-ready.mjs";
import {useEffect,useMemo,useRef,useState,useCallback} from "react";
import {SlidersHorizontal,ChevronDown,Ellipsis,LogOut,Archive,FileText,Factory,LayoutDashboard,Layers3,Search,RefreshCw,X,GripVertical,ArrowUp,ArrowDown,Check,CheckSquare,MessageSquare,UserRound,ShieldCheck,Download,LoaderCircle,ArrowRight,Flag,BookOpen,Bell,CalendarDays,AlertCircle,ExternalLink,ClipboardCheck,Package,Truck} from "lucide-react";
import {move} from "../lib/queue.mjs";
import {createAutosave} from "../lib/autosave.mjs";
import {matchesCreation,matchesOrderCreation,SITE_START_DATE,SITE_START_LABEL,clampStart} from "../lib/date-filter.mjs";
import {isInternal,groupInternal} from "../lib/internal-production.mjs";
import {receiveOrders} from "../lib/intake.mjs";
import SalesCatalog from "./sales-catalog";
import StaffPicker,{staffStyle,staffNames} from "./staff-picker";
import type {Shipment} from "../lib/shipping.mjs";
import {packingWorkflow} from "../lib/packing-workflow.mjs";
import {relatedInvoiceIds} from "../lib/invoice-prepare.mjs";
import ArchiveDialog from "./archive-dialog";
import ArchivedOrders from "./archived-orders";
import {archiveOrders,type ArchiveRecord} from "../lib/order-archive.mjs";
import ManualGuide from "./manual-guide";
type OP={sku?:string;productId?:number;situacaoNomus?:string;id:string;nome:string;produto:string;quantidade:string;unidade:string;criacao?:string;quantidadeProgramada?:string;quantidadeAnterior?:string;quantidadeAlteradaEm?:string};
type Group={pedidoConsultaFalhou?:boolean;pedidoConsultadoEm?:string|null;liberacao?:ReleaseState;estoque?:boolean;criacao?:string;id:string;codigo:string;cliente:string;ordens:OP[];vinculo?:"none"|"unknown"|"linked";itens?:{sku?:string;productId?:number;status?:number;item?:string;produto:string;quantidade:string;unidade:string}[]};
type Detail={arquivo?:ArchiveRecord;arquivado?:boolean;atendimentoEstoque?:boolean;envio?:Shipment;responsavel:string;responsavelConferencia?:string;nota:string;situacao:string;etiqueta?:string;conferidas?:string[];expedicao?:string[];empresa?:string;vistoNomus?:string};
type Board={boxModels?:BoxModel[];invoices?:Record<string,Invoice>;sequence:string[];details:Record<string,Detail>};
type Snapshot={consultadoEm:string;ordensConsultadas:number;grupos:Group[];semVinculo:OP[];pedidos?:Group[]};
type Data={snapshot:Snapshot;board:Board;revision:number;updatedAt:string|null;updatedBy:string|null};
type Sync={refreshStatus?:"unconfigured"|"busy"|"cooldown"|"cached"|"failed"|"updated";changes:Record<string,{at:string;items:string[];events?:ChangeEvent[]}>;configured:boolean;lastChecked:string|null;lastCycle:string|null;partial:boolean;message:string;page:number;paginaPedidos?:number;pedidosConsultados?:number;pedidosCoberturaCompleta?:boolean;pedidosIdentificados?:number};
type Stage="backlog"|"queue"|"doing"|"blocked"|"done"|"shipping"|"ready"|"sent";
const columns:{id:Stage;title:string;color:string;status:string}[]=[
{id:"backlog",title:"Aguardando liberação",color:"#c69b52",status:"A programar"},
{id:"queue",title:"Na fila",color:"#6a947c",status:"Programado"},
{id:"doing",title:"Produzindo",color:"#2e8b62",status:"Em acompanhamento"},
{id:"blocked",title:"Bloqueados",color:"#cc9760",status:"Bloqueado"},
{id:"done",title:"Conferir",color:"#154f3b",status:"Concluído"},
{id:"shipping",title:"Preparar envio",color:"#318984",status:"Pronto para envio e documentação"},
{id:"ready",title:"Pronto para envio",color:"#468477",status:"Pronto para envio"},
{id:"sent",title:"Enviados",color:"#447253",status:"Atendido totalmente e enviado"}];
const companies=["Maya","Sacred Connection","Four visions","Katukina","Haux Haux","Nayaku"];
const labels=["","Urgente","Atenção","Normal","Aguardando documentação","Documentação concluída"];
const fresh=():Detail=>({responsavel:"",nota:"",situacao:"A programar",etiqueta:"",conferidas:[],expedicao:[],vistoNomus:""});
function stage(board:Board,id:string):Stage{if(!board.sequence.includes(id))return "backlog";const s=board.details[id]?.situacao;return s==="Atendido totalmente e enviado"?"sent":s==="Pronto para envio"?"ready":s==="Pronto para envio e documentação"?"shipping":s==="Em acompanhamento"?"doing":s==="Bloqueado"?"blocked":s==="Concluído"?"done":"queue"}
const date=(v:string)=>new Date(v).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});
const shortDate=(v?:string)=>v?v.split("-").reverse().join("/"):"Sem data";
async function request(url:string,options?:RequestInit){const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(45000),...options});let d:any;try{d=await r.json()}catch{throw Error("Não foi possível confirmar a operação. Verifique sua conexão.")}if(r.status===401)window.dispatchEvent(new Event("pagnier-session-expired"));if(!r.ok)throw Error(d.error||"Operação indisponível.");return d}
export default function Dashboard({employee,sessionActive,onSessionExpired,onSignOut}:{employee:string;sessionActive:boolean;onSessionExpired:()=>void;onSignOut:()=>Promise<void>}){
 const [data,setData]=useState<Data|null>(null),[board,setBoard]=useState<Board>({sequence:[],details:{}});
 const [status,setStatus]=useState("saved"),[dirty,setDirty]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [nomusBusy,setNomusBusy]=useState(false),[syncNotice,setSyncNotice]=useState("");
 const refreshNomus=useRef<(manual?:boolean)=>Promise<void>>(async()=>{});
 const [sync,setSync]=useState<Sync|null>(null),[syncError,setSyncError]=useState("");
 const [search,setSearch]=useState(""),[label,setLabel]=useState("Todas"),[company,setCompany]=useState("Todas"),[carrier,setCarrier]=useState("Todas"),[month,setMonth]=useState("all"),[start,setStart]=useState(new Date().toLocaleDateString("sv-SE",{timeZone:"America/Sao_Paulo"}).slice(0,8)+"01"),[end,setEnd]=useState(new Date().toLocaleDateString("sv-SE",{timeZone:"America/Sao_Paulo"})),[prefsReady,setPrefsReady]=useState(false);
 const [selected,setSelected]=useState<string|null>(null),[tab,setTab]=useState("board"),[dragged,setDragged]=useState<string|null>(null),[over,setOver]=useState<Stage|null>(null);
 const [detailTab,setDetailTab]=useState("overview");
 const [expeditionStep,setExpeditionStep]=useState("review");
 const [focusedBox,setFocusedBox]=useState("");
 const [assemblyStep,setAssemblyStep]=useState<"small"|"outer"|"measure">("outer");
 const expeditionEntry=useRef<{step:"review"|"boxes";assembly:"outer"|"measure"}|null>(null);
 useEffect(()=>{const entry=expeditionEntry.current;setExpeditionStep(entry?.step??"review");setAssemblyStep(entry?.assembly??"outer");setFocusedBox("");expeditionEntry.current=null},[selected]);
 function openExpedition(id:string){const shipment=boardRef.current.details[shipmentOwner(boardRef.current,id)]?.envio;expeditionEntry.current={step:shipment?.caixas.length||shipment?.caixasEmMontagem?.length?"boxes":"review",assembly:shipment?.caixas.length&&shipment.caixas.every(b=>b.montada!==false)?"measure":"outer"};setSelected(id);setDetailTab("expedition");setTab("board")}
 const [filtersOpen,setFiltersOpen]=useState(false),[changeOpen,setChangeOpen]=useState(false);
 const [invoiceId,setInvoiceId]=useState<string|null>(null),[invoiceSeed,setInvoiceSeed]=useState<string|null>(null);
 function openInvoice(id:string){const matches=relatedInvoiceIds(boardRef.current.invoices,id);setInvoiceSeed(id);setInvoiceId(matches.length===1?matches[0]:null);setSelected(null);setTab("invoices")}
 const [leaving,setLeaving]=useState(false);
 async function leavePanel(){if(loading||dirty||saving||packingPending){setError("Aguarde o salvamento e conclua a seleção em andamento antes de sair.");return}setLeaving(true);try{await onSignOut()}catch(e){setError(e instanceof Error?e.message:"Não foi possível sair. Tente novamente.")}finally{setLeaving(false)}}
 const [chatOpen,setChatOpen]=useState(false),[chatChannel,setChatChannel]=useState("general"),[chatThreads,setChatThreads]=useState<ChatChannel[]>([]);
 function openOrderChat(id:string){setSelected(null);setChatChannel("order:"+id);setChatOpen(true)}
 const [archiveTarget,setArchiveTarget]=useState<{id:string;restoring:boolean;reason:string}|null>(null);
 const [packingOwner,setPackingOwner]=useState<string|null>(null);
 const [packingSection,setPackingSection]=useState("orders"),[packingPending,setPackingPending]=useState(false),[manualTopic,setManualTopic]=useState(""),[helpReturn,setHelpReturn]=useState("board");
 useEffect(()=>{document.querySelector<HTMLElement>('.app-navigation [aria-current="page"]')?.scrollIntoView({block:"nearest",inline:"nearest",behavior:"smooth"})},[tab]);
 function navigate(next:string){if(next==="release")next="board";if(next==="pending")next="unlinked";if(next===tab)return;if(packingPending&&!confirm("Descartar a seleção de pedidos / destinatário ainda não confirmada e sair? Os dados já salvos serão mantidos."))return;if(next==="help"){setHelpReturn(tab);setManualTopic("")}if(next==="invoices"){setInvoiceSeed(null);setInvoiceId(null)}if(next==="packing")setPackingOwner(null);setPackingPending(false);setTab(next)}
 async function deletePacking(id:string){
 if(!data||loading||saving||saver.current?.isDirty())throw Error("Aguarde o salvamento antes de excluir.");
 boardBusy.current=true;setLoading(true);
 try{
 const result=await request("/api/board",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({owner:id,revision:saver.current?.getRevision()??data.revision})});
 boardRef.current=result.board;setBoard(result.board);saver.current?.reset(result.board,result.revision);
 setData(old=>old?{...old,board:result.board,revision:result.revision,updatedAt:result.updatedAt,updatedBy:result.updatedBy}:old);
 setPackingOwner(null);setPackingPending(false);setPackingSection("orders");
 }finally{boardBusy.current=false;setLoading(false)}
 }
 async function deleteInvoice(id:string){
 if(!data||loading||saving||saver.current?.isDirty())throw Error("Aguarde o salvamento antes de excluir.");
 boardBusy.current=true;setLoading(true);
 try{
 const result=await request("/api/board",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"invoice",invoiceId:id,revision:saver.current?.getRevision()??data.revision})});
 boardRef.current=result.board;setBoard(result.board);saver.current?.reset(result.board,result.revision);
 setData(old=>old?{...old,board:result.board,revision:result.revision,updatedAt:result.updatedAt,updatedBy:result.updatedBy}:old);
 setInvoiceId(null);
 }finally{boardBusy.current=false;setLoading(false)}
 }
 function showTutorial(){if(packingPending)return;setHelpReturn(tab);setManualTopic(tab==="invoices"?"invoices":tab==="unlinked"?"recovery":tab==="internal"?"production":tab==="sales"?"orders":"packing");setTab("help")}
 function openPacking(id:string){const next=shipmentOwner(boardRef.current,id),shipment=boardRef.current.details[next]?.envio;setPackingSection(packingWorkflow(shipment,shipmentOps(shipment,next,groups)).next);setPackingOwner(next);setSelected(null);setTab("packing")}
 const lastDragEnd=useRef(0);
 const searchInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{
 if(!sessionActive||selected||!["board","internal","unlinked","sales"].includes(tab))return;
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
 },[selected,tab,sessionActive]);
 const boardRef=useRef<Board>({sequence:[],details:{}});
 const saver=useRef<ReturnType<typeof createAutosave>|null>(null);
 const boardBusy=useRef(true);
 const [liveError,setLiveError]=useState(""),[liveNotice,setLiveNotice]=useState("");
 const packingView=useRef({owner:packingOwner,pending:packingPending});packingView.current={owner:packingOwner,pending:packingPending};
 const saving=status==="saving";const saveText=error&&dirty?"Não salvo":saving?"Salvando…":dirty?"Aguardando gravação…":liveError?"Sem sincronização":"Salvo";
 async function load(){
 boardBusy.current=true;setLoading(true);setError("");setLiveNotice("");
 try{const d:Data=await request("/api/board");setData(d);setLiveError("");const received=receiveOrders(d.board,d.snapshot.grupos);boardRef.current=received;setBoard(received);saver.current?.reset(d.board,d.revision);if(received!==d.board)saver.current?.enqueue(received)}
 catch(e){setError(e instanceof Error?e.message:"Não foi possível carregar.")}finally{boardBusy.current=false;setLoading(false)}
 }
 useEffect(()=>{
 saver.current=createAutosave({
 write:(next,revision)=>{const body=JSON.stringify({board:next,revision});return request("/api/board",{method:"PUT",headers:{"Content-Type":"application/json"},body,keepalive:new TextEncoder().encode(body).length<60000})},
 read:()=>request("/api/board"),
 onState:s=>{setStatus(s.status);setDirty(s.dirty);setError(s.error)},
 onRemote:(next,remote)=>{
  boardRef.current=next;setBoard(next);
  setInvoiceId(id=>id&&!next.invoices?.[id]?null:id);
  const owner=packingView.current.owner;
  if(owner&&next.details[owner]?.envio?.packingExcluido&&!packingView.current.pending){setPackingOwner(null);setPackingPending(false);setPackingSection("orders")}
  setLiveNotice("Alterações da equipe recebidas"+(remote.updatedBy?" · "+remote.updatedBy:"")+".");
 },
 onSaved:d=>setData(old=>old?{...old,revision:d.revision,updatedAt:d.updatedAt,updatedBy:d.updatedBy}:old)
 });
 void load();
 return()=>saver.current?.dispose();
 },[]);
 useEffect(()=>{
 if(!sessionActive)return;
 let stopped=false,busy=false;
 async function refresh(){
  if(stopped||busy||boardBusy.current||document.visibilityState==="hidden"||!saver.current)return;
  busy=true;
  try{
   const remote=await request("/api/board?boardOnly=1&revision="+saver.current.getRevision(),{signal:AbortSignal.timeout(12000)});
   if(stopped||boardBusy.current)return;
   setLiveError("");if(!remote.unchanged)saver.current?.receive(remote);
  }catch{if(!stopped)setLiveError("Não foi possível receber as alterações da equipe. Esta tela pode estar desatualizada. Tentando reconectar…")}
  finally{busy=false}
 }
 const tick=setInterval(()=>void refresh(),3000);
 const resume=()=>void refresh();window.addEventListener("focus",resume);window.addEventListener("online",resume);document.addEventListener("visibilitychange",resume);
 void refresh();
 return()=>{stopped=true;clearInterval(tick);window.removeEventListener("focus",resume);window.removeEventListener("online",resume);document.removeEventListener("visibilitychange",resume)};
 },[sessionActive]);
 useEffect(()=>{const aba=new URLSearchParams(window.location.search).get("aba");if(aba==="arquivados")setTab("archived");if(aba==="pedidos")setTab("sales");if(aba==="packing")setTab("packing");if(aba==="invoices")setTab("invoices");if(aba==="unlinked"||aba==="internal"||aba==="help"||aba==="box-settings")setTab(aba)},[]);
 useEffect(()=>{try{const p=JSON.parse(localStorage.getItem("pagnier-view")||"{}");if(carrierFilters.includes(p.carrier))setCarrier(p.carrier);if(["all","unknown","range"].includes(p.month))setMonth(p.month);if(/^\d{4}-\d{2}-\d{2}$/.test(p.start))setStart(clampStart(p.start));if(/^\d{4}-\d{2}-\d{2}$/.test(p.end))setEnd(clampStart(p.end));if(p.month==="range"&&p.end<SITE_START_DATE){setMonth("all");setStart(SITE_START_DATE);setEnd(new Date().toLocaleDateString("sv-SE",{timeZone:"America/Sao_Paulo"}))}if(["Todas",...labels].includes(p.label))setLabel(p.label);if(["Todas",...companies].includes(p.company))setCompany(p.company)}catch{}setPrefsReady(true)},[]);
 useEffect(()=>{if(prefsReady)try{localStorage.setItem("pagnier-view",JSON.stringify({month,label,start,end,company,carrier}))}catch{}},[month,label,start,end,company,carrier,prefsReady]);
 useEffect(()=>{const fn=(e:BeforeUnloadEvent)=>{if(saver.current?.isDirty()){void saver.current.flush();e.preventDefault();e.returnValue=""}};
 const flush=()=>{if(document.visibilityState==="hidden")void saver.current?.flush()};
 window.addEventListener("beforeunload",fn);document.addEventListener("visibilitychange",flush);
 return()=>{window.removeEventListener("beforeunload",fn);document.removeEventListener("visibilitychange",flush)}},[]);
 const selectedOrder=useRef<string|null>(null);
 useEffect(()=>{selectedOrder.current=selected;if(selected)window.dispatchEvent(new Event("nomus-production-request"))},[selected]);
 const productionRequests=useRef<string[]>([]),nomusRevision=useRef<number|undefined>(undefined);
 const requestProduction=useCallback((names:string[])=>{const changed=names.join(",")!==productionRequests.current.join(",");productionRequests.current=names;if(changed&&names.length)window.dispatchEvent(new Event("nomus-production-request"))},[]);
 const ready=!!data;
 useEffect(()=>{
 if(!ready||!sessionActive)return;let stopped=false,busy=false,failures=0,retryAfter=0;
 async function poll(manual=false){
 if(busy||!manual&&(document.visibilityState==="hidden"||Date.now()<retryAfter))return;
 busy=true;setNomusBusy(true);if(manual)setSyncNotice("");
 try{
 const d:Partial<Sync>&{snapshot?:Snapshot;nomusRevision?:number}=await request("/api/nomus",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productionOps:productionRequests.current,...(selectedOrder.current?{orderCode:selectedOrder.current}:{}),knownRevision:nomusRevision.current,...(manual?{refresh:true}:{})})});
 if(!stopped){
 failures=0;retryAfter=0;nomusRevision.current=d.nomusRevision;
 setSync(old=>({...old,...d}) as Sync);setSyncError(d.refreshStatus==="failed"?d.message||"Consulta indisponível.":"");
 if(d.snapshot){
 const snapshot=d.snapshot;setData(old=>old?{...old,snapshot}:old);
 const received=receiveOrders(boardRef.current,snapshot.grupos);if(received!==boardRef.current){boardRef.current=received;setBoard(received);saver.current?.enqueue(received)}
 }
 if(manual)setSyncNotice(d.refreshStatus==="busy"?"Já existe uma captura em andamento. Aguarde a próxima atualização.":d.refreshStatus==="cooldown"?"Aguarde alguns segundos antes de tentar novamente; após uma falha, o intervalo é de um minuto.":d.refreshStatus==="unconfigured"?"A conexão com o Nomus não está configurada.":d.refreshStatus==="failed"?"":d.refreshStatus==="updated"?"Etapa capturada. As demais páginas continuam na atualização automática.":"Dados consultados. A captura continua por páginas.");
 else if(d.refreshStatus==="updated")setSyncNotice("");
 }
 }catch(e){failures++;retryAfter=Date.now()+Math.min(300000,30000*2**Math.min(failures-1,4));if(!stopped){setSyncError(e instanceof Error?e.message:"Consulta ao Nomus indisponível.");setSyncNotice("")}}finally{busy=false;if(!stopped)setNomusBusy(false)}
 }
 refreshNomus.current=poll;
 void poll();const id=setInterval(()=>void poll(),22000);const focus=()=>void poll();window.addEventListener("focus",focus);window.addEventListener("nomus-production-request",focus);
 return()=>{stopped=true;refreshNomus.current=async()=>{};clearInterval(id);window.removeEventListener("focus",focus);window.removeEventListener("nomus-production-request",focus)}
 },[ready,sessionActive]);
 useEffect(()=>{if(!selected)return;const previous=document.activeElement as HTMLElement;const modal=document.querySelector<HTMLElement>(".card-dialog");modal?.querySelector<HTMLButtonElement>("button")?.focus();const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setSelected(null);if(e.key==="Tab"&&modal){const els=[...modal.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],summary,[tabindex]')].filter(el=>el.tabIndex>=0&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=="hidden"&&!el.closest("[inert]"));const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener("keydown",key);return()=>{document.removeEventListener("keydown",key);previous?.focus()}},[selected]);
 function edit(next:Board){boardRef.current=next;setBoard(next);saver.current?.enqueue(next)}
 function update(id:string,patch:Partial<Detail>){const latest=boardRef.current;if(patch.envio)patch={...patch,envio:bridgeDestination(latest.details[id]?.envio,patch.envio)};edit({...latest,details:{...latest.details,[id]:{...fresh(),...latest.details[id],...patch}}})}
 function archiveOrder(id:string,arquivado:boolean,reason="manual"){if(loading||saving||dirty||packingPending){setError("Conclua as alterações em andamento antes de arquivar ou restaurar.");return}setArchiveTarget({id,restoring:!arquivado,reason})}
 async function confirmArchive(options:{archived:boolean;reason:string;note:string;confirmedDeleted:boolean}){
 if(!archiveTarget||boardBusy.current||saving||saver.current?.isDirty())throw Error("Aguarde o salvamento das alterações em andamento.");
 boardBusy.current=true;setLoading(true);
 try{const result=await request("/api/board",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"archive",orderId:archiveTarget.id,revision:saver.current?.getRevision()??0,...options})});boardRef.current=result.board;setBoard(result.board);saver.current?.reset(result.board,result.revision);setData(old=>old?{...old,...result}:old);setSelected(null);setError("")}
 finally{boardBusy.current=false;setLoading(false)}
 }
 function transfer(id:string,to:Stage,before?:string){
 const board=boardRef.current;if(to==="backlog")return;
 const group=groups.find(g=>g.id===id);if(loading||!group||id===before||!group.ordens.length)return;
 if(!canQueue(group)&&!hasStarted(board.details[id])){setError("Aguarde a liberação no Nomus.");return}
 if(to==="sent"){const issues=dispatchIssues(board,id,groups);if(issues.length){setError(issues.join(" "));setSelected(id);setDetailTab("expedition");setExpeditionStep("boxes");setAssemblyStep("outer");setDragged(null);setOver(null);return}}
 if(group.estoque&&(to==="queue"||to==="doing")){setError("Este pedido sai do estoque. Continue em Preparar envio.");setDragged(null);setOver(null);return}
 setError("");
 let sequence=board.sequence.filter(x=>x!==id);
 {const i=before?sequence.indexOf(before):-1;if(i>=0)sequence.splice(i,0,id);else if(board.sequence.includes(id)&&stage(board,id)!==to)sequence=[...board.sequence];else sequence.push(id)}
 edit({...board,sequence,details:{...board.details,[id]:{...fresh(),...board.details[id],situacao:columns.find(c=>c.id===to)!.status}}});setDragged(null);setOver(null)
 }
 function reload(){if(packingPending){setError("Confirme ou descarte a seleção de pedidos e destinatário antes de recarregar.");return}if(!saving&&(!dirty||confirm("Descartar as edições ainda não salvas e carregar a versão compartilhada?"))){saver.current?.pause();void load()}}
 function startStock(id:string){
 const raw=[...(data?.snapshot.pedidos??[]),...(data?.snapshot.grupos??[])].find(g=>g.id===id),reason=stockEligibility(raw);
 if(reason){setError(reason);return}
 const current=boardRef.current;edit({...current,sequence:[...new Set([...current.sequence,id])],details:{...current.details,[id]:{...fresh(),...current.details[id],atendimentoEstoque:true,situacao:"Concluído"}}});setTab("board");setSelected(id);setDetailTab("expedition");setExpeditionStep("review");
 }
 const groups:Group[]=operationalGroups(data?.snapshot,board);
 const archived:(Group&{arquivo?:ArchiveRecord})[]=archiveOrders(data?.snapshot,board);
 const archiveOrderTarget=archiveTarget?[...groups,...(data?.snapshot.pedidos??[]),...archived].find(g=>g.id===archiveTarget.id):null;
 const readyDocumentation=documentationReady(board,groups).filter(entry=>entry.orders.some(order=>!board.details[order.id]?.arquivado));
 const readyDocumentationOrders=readyDocumentation.reduce((total,entry)=>total+entry.orders.length,0);
 const waitingOrders=(data?.snapshot.pedidos??[]).filter(g=>!board.details[g.id]?.arquivado&&awaitsRelease(g,board.details[g.id])&&matchesOrderCreation(g,month,start,end)).map(g=>({...g,ordens:g.ordens.filter(o=>matchesCreation(o,month,start,end))}));
 const matchesMonth=(o:OP)=>matchesCreation(o,month,start,end);
 const uncertain=groups.filter(g=>!board.details[g.id]?.arquivado&&!g.ordens.length&&g.vinculo!=="none");
 const inMonth=groups.filter(g=>g.ordens.length?g.ordens.some(matchesMonth):month==="all"&&g.vinculo==="none").map(g=>({...g,ordens:g.ordens.filter(matchesMonth)}));
 const visible=useMemo(()=>[...new Map([...waitingOrders,...inMonth.filter(g=>g.ordens.length>0&&(canQueue(g)||hasStarted(board.details[g.id])||g.liberacao==="unknown"&&board.sequence.includes(g.id)))].map(g=>[g.id,g])).values()].filter(g=>{return !board.details[g.id]?.arquivado&&(carrier==="Todas"||orderCarrier(board,g.id).category===carrier)&&(company==="Todas"||(board.details[g.id]?.empresa??"")===company)&&(label==="Todas"||(board.details[g.id]?.etiqueta??"")===label)&&matchesOrderSearch(g,search)}),[inMonth,waitingOrders,search,label,company,carrier,board.details,board.invoices,board.sequence]);
 const ordered=[...board.sequence.map(id=>visible.find(g=>g.id===id)).filter(Boolean) as Group[],...visible.filter(g=>!board.sequence.includes(g.id))];
 const active=groups.find(g=>g.id===selected)??waitingOrders.find(g=>g.id===selected)??archived.find(g=>g.id===selected)??data?.snapshot.pedidos?.find(g=>g.id===selected),activeOps=active?(board.details[active.id]?.arquivado?active.ordens:active.ordens.filter(matchesMonth)):[];
 const owner=active?shipmentOwner(board,active.id):"",shipment=board.details[owner]?.envio;
 const shippingOps=shipmentOps(shipment,owner,groups),boxReview=inspectBoxReview(shipment,shippingOps);
 const activeCarrier=active?orderCarrier(board,active.id):{value:"",category:"A definir",source:""};
 function changeShipmentCarrier(transportadora:string){if(active)update(owner,{envio:{...(boardRef.current.details[owner]?.envio??emptyShipment()),transportadora}})}
 function showBox(id:string){if(!active)return;setFocusedBox(id);setAssemblyStep(isMounted(shipment?.caixas.find(b=>b.id===id))?"measure":"outer");setDetailTab("expedition");setExpeditionStep("boxes");setTimeout(()=>{const el=document.getElementById("shipment-box-"+id) as HTMLElement|null;if(el){el.scrollIntoView({block:"center",behavior:"smooth"})}},100)}
 const detail=active?{...fresh(),...board.details[active.id]}:fresh();
 const unlinked=(data?.snapshot.semVinculo??[]).filter(matchesMonth).filter(o=>[o.sku,o.nome,o.produto].join(" ").toLowerCase().includes(search.toLowerCase()));
 const cancelledOps=cancelledProduction(data?.snapshot).filter(matchesMonth).filter(o=>[o.sku,o.nome,o.produto,...o.pedidos].join(" ").toLowerCase().includes(search.toLowerCase()));
 const internal=groupInternal(unlinked.filter(o=>!isCancelledOP(o)&&isInternal(o)));
 const pendingLinks=unlinked.filter(o=>!isCancelledOP(o)&&!isInternal(o));
 const unlinkedCount=(data?.snapshot.semVinculo??[]).filter(o=>!isCancelledOP(o)&&!isInternal(o)&&matchesCreation(o,"all","","")).length;
 function openUnlinked(){setSearch("");setMonth("all");navigate("unlinked")}
 const unknown=[...groups.flatMap(g=>g.ordens),...(data?.snapshot.semVinculo??[])].filter(o=>!isCancelledOP(o)&&!o.criacao).length;
 const change=active?sync?.changes[active.id]:null;
 const changeEvents=(change?.events??[]).map(event=>({...event,fields:event.entity.startsWith("OP ")?event.fields.filter(field=>["Produto","Quantidade","Unidade"].includes(field.label)):event.fields}));
 function unseen(id:string){const c=sync?.changes[id];return c&&c.at>(board.details[id]?.vistoNomus??"")}
 function exportCsv(){
 const rows=[["Prioridade","Pedido","Cliente","Coluna","Responsável pela conferência","Etiqueta","Empresa","Observação","Recorte criação OP","SKUs dos produtos"],...visible.map(g=>[board.sequence.includes(g.id)?String(board.sequence.indexOf(g.id)+1):"",g.codigo,g.cliente,columns.find(c=>c.id===orderStage(g))!.title,board.details[g.id]?.responsavelConferencia??"",board.details[g.id]?.etiqueta??"",board.details[g.id]?.empresa??"",board.details[g.id]?.nota??"",month==="range"?start+" a "+end:month,[...new Set([...g.ordens,...(g.itens??[])].map(o=>o.sku).filter(Boolean))].join(", ")])];
 const csv="\uFEFF"+rows.map(r=>r.map(x=>'"'+String(x).replace(/^[=+@-]/,"'"+String(x)[0]).replaceAll('"','""')+'"').join(";")).join("\r\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="quadro-producao.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
 }
 const showCaptureInStrip=!["invoices","packing","help","sales","archived"].includes(tab);
 const nomusCapture=<NomusCapture lastChecked={sync?.lastChecked} configured={sync?.configured} busy={nomusBusy} disabled={!data||!sessionActive} error={syncError} notice={syncNotice} partial={sync?.partial} onRefresh={()=>void refreshNomus.current(true)}/>;
 const saveIndicator=<span title={saveText+" · "+(liveNotice||"Salvamento das alterações do painel")} className={"autosave-status "+(error&&dirty||liveError?"failed":saving?"is-saving":dirty?"is-pending":"is-saved")} role="status" aria-live="polite">{saving||dirty&&!error?<LoaderCircle size={15} className="spin"/>:error&&dirty||liveError?<AlertCircle size={15}/>:<Check size={15}/>}<span>{saveText}</span></span>;
 function openCard(id:string){if(Date.now()-lastDragEnd.current<300)return;setSelected(id);setDetailTab("overview");setChangeOpen(false)}
 function nextLabel(id:string){const g=groups.find(g=>g.id===id);if(g&&(awaitsRelease(g,board.details[id])||!canQueue(g)&&!hasStarted(board.details[id])))return "Ver pedido";return ({backlog:"Ver pedido",queue:"Iniciar produção",doing:"Concluir produção",blocked:"Ver o impedimento",done:"Conferir pedido",shipping:"Preparar envio",ready:"Ver envio",sent:"Ver rastreio"})[stage(board,id)]}
 function nextAction(id:string){const g=groups.find(g=>g.id===id);if(g&&(awaitsRelease(g,boardRef.current.details[id])||!canQueue(g)&&!hasStarted(boardRef.current.details[id]))){openCard(id);return}const current=stage(boardRef.current,id);if(current==="queue"||current==="doing"){transfer(id,current==="queue"?"doing":"done");return;}if(current==="shipping"){openCard(id);setDetailTab("expedition");return;}openCard(id);setDetailTab(current==="done"?"expedition":(current==="ready"||current==="sent")?"shipping":"overview")}
 const laneColumns=columns.filter(c=>c.id!=="blocked"&&c.id!=="done");
 function orderStage(g:Group):Stage{if(awaitsRelease(g,board.details[g.id]))return "backlog";const saved=stage(board,g.id);return saved==="blocked"?"doing":saved==="done"?"shipping":saved}
 function clearFilters(){setCarrier("Todas");setSearch("");setCompany("Todas");setLabel("Todas");setMonth("all")}
 const activeFilters=[
 ...(tab==="board"&&carrier!=="Todas"?[{key:"carrier",text:"Envio: "+carrier,clear:()=>setCarrier("Todas")}]:[]),
 ...(tab!=="archived"&&tab!=="sales"&&month!=="all"?[{key:"date",text:month==="unknown"?"Sem data de criação":"Criação: "+shortDate(start)+" a "+shortDate(end),clear:()=>setMonth("all")}]:[]),
 ...(tab==="board"&&company!=="Todas"?[{key:"company",text:"Empresa: "+company,clear:()=>setCompany("Todas")}]:[]),
 ...(tab==="board"&&label!=="Todas"?[{key:"label",text:"Prioridade: "+label,clear:()=>setLabel("Todas")}]:[])
 ];
 function card(g:Group){
 const carrierInfo=orderCarrier(board,g.id);
 const d={...fresh(),...board.details[g.id],envio:board.details[shipmentOwner(board,g.id)]?.envio},pos=board.sequence.indexOf(g.id),reduced=g.ordens.filter(o=>quantityDifference(o).reduced),increased=g.ordens.filter(o=>quantityDifference(o).increased);
 return <article key={g.id} onClick={e=>{if((e.target as Element).closest("button,a,input,select,textarea,summary")||dragged)return;openCard(g.id)}} draggable={!loading&&g.ordens.length>0&&!awaitsRelease(g,board.details[g.id])} onDragStart={e=>{e.dataTransfer.setData("text/plain",g.id);e.dataTransfer.effectAllowed="move";setDragged(g.id)}} onDragEnd={()=>{lastDragEnd.current=Date.now();setDragged(null);setOver(null)}} onDragOver={e=>{if(dragged){e.preventDefault();e.stopPropagation();setOver(orderStage(g))}}} onDrop={e=>{e.preventDefault();e.stopPropagation();transfer(e.dataTransfer.getData("text/plain"),orderStage(g),g.id)}} className={"kanban-card stage-"+orderStage(g)+" "+(dragged===g.id?"dragging":"")}>
 <div className="card-top"><span className="order-heading"><span className="order-code">{g.codigo}</span><OrderCreated value={g.criacao}/></span><div>{!awaitsRelease(g,board.details[g.id])&&<GripVertical size={16} className="grip"/>}</div></div>
 <button className="card-open" onClick={()=>openCard(g.id)}><h3>{g.cliente||"Cliente aguardando consulta"}</h3></button>
 {d.etiqueta&&<div className="card-label"><span className={"label label-"+d.etiqueta.replaceAll(" ","-")}>{d.etiqueta}</span></div>}
 <div className="card-metadata">
 {carrierInfo.category!=="A definir"&&<span className={"carrier-tag carrier-"+carrierInfo.category.toLowerCase()}><CarrierMark value={carrierInfo.value||carrierInfo.category}/></span>}
 {g.estoque&&<span className="company-tag">Estoque · sem OP</span>}
 {d.empresa&&<span className={"company-tag company-"+companies.indexOf(d.empresa??"")}>{d.empresa}</span>}
 </div>
 <div className="card-notices">
 <OrderReleaseNotice order={g} compact/>
 {d.situacao==="Bloqueado"&&<span className="release-state release-waiting" title={d.nota||"Abra o pedido e confira as orientações do supervisor"}>Impedimento registrado</span>}
 {unseen(g.id)&&<button className="change-badge" onClick={()=>{openCard(g.id);setChangeOpen(true)}}><Bell size={13}/><span>Atualização no Nomus</span></button>}
 {(reduced.length>0||increased.length>0)&&<button className="change-badge quantity-change" onClick={()=>openCard(g.id)}><AlertCircle size={13}/><span>{reduced.length?reduced.length+" OP(s) com quantidade reduzida":increased.length+" OP(s) com quantidade aumentada"}</span></button>}
 </div>
 <div className="product-preview">{g.ordens.slice(0,2).map(o=><div key={o.id}><ProductIdentity sku={o.sku} name={o.produto}/></div>)}{g.ordens.length>2&&<span>+ {g.ordens.length-2} OPs</span>}{!g.ordens.length&&<>{g.itens?.slice(0,2).map((item,i)=><div key={i}><ProductIdentity sku={item.sku} name={item.produto}/></div>)}</>}</div>
 <div className="card-bottom"><div className="badges">{pos>=0&&<span className="priority" title="Prioridade global">#{pos+1}</span>}<span><Layers3 size={14}/>{g.ordens.length||g.itens?.length||0} {g.estoque?"produtos":g.ordens.length?(g.ordens.length===1?"OP":"OPs"):(g.itens?.length===1?"item":"itens")}</span>{d.envio?.caixas?.length?<span><Package size={14}/>{d.envio.caixas.length} caixas</span>:null}{!!d.envio?.caixasEmMontagem?.length&&<span title="Embalagens aguardando acomodação na maior"><Package size={14}/>{d.envio.caixasEmMontagem.length} embalagens em preparo</span>}{d.nota&&<MessageSquare size={14} aria-label="Possui observações"/>}</div><span style={staffStyle(d.responsavelConferencia)} className={"avatar "+(!d.responsavelConferencia?"empty-avatar":"")} title={d.responsavelConferencia?"Conferência: "+d.responsavelConferencia:"Conferência sem responsável"}>{d.responsavelConferencia?d.responsavelConferencia.trim().split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase():<UserRound size={14}/>}</span></div>
 {d.envio?.rastreio&&<div className="tracking-card" title={d.envio.rastreio}><Truck size={14}/><span>{d.envio.rastreio}</span></div>}
 <div className="card-quick"><button className="card-next-action card-open-hint" disabled={loading} onClick={()=>nextAction(g.id)}>{nextLabel(g.id)}<ArrowRight size={14}/></button><button className="card-chat" aria-label={"Conversar sobre o pedido "+g.codigo} title="Conversar sobre este pedido" onClick={()=>openOrderChat(g.id)}><MessageSquare size={14}/>{(chatThreads.find(t=>t.channel==="order:"+g.id)?.unread??0)>0&&<span>{chatThreads.find(t=>t.channel==="order:"+g.id)?.unread}</span>}</button>{pos>=0&&<div><button aria-label={"Subir prioridade de "+g.codigo} disabled={loading||pos===0} onClick={()=>edit({...board,sequence:move(board.sequence,g.id,-1)})}><ArrowUp size={15}/></button><button aria-label={"Descer prioridade de "+g.codigo} disabled={loading||pos===board.sequence.length-1} onClick={()=>edit({...board,sequence:move(board.sequence,g.id,1)})}><ArrowDown size={15}/></button></div>}</div>
 </article>
 }
 return <div className="trello-shell software-shell minimal-chrome">
 <header className="app-topbar">
 <button className="app-brand" aria-label="Pagnier — início" onClick={()=>navigate("board")}><img src="/pagnier-logo-botanico.png" alt="Pagnier Comércio" width="2172" height="724"/><span>Produção e expedição</span></button>
 <nav className="app-navigation" aria-label="Navegação principal">{[["board","Produção",LayoutDashboard],["sales","Pedidos de venda",ClipboardCheck],["packing","Packing lists",Package],["invoices","Invoices FedEx / DHL",FileText]].map(([key,title,Icon])=>{const I=Icon as typeof Factory;return <button key={key as string} title={title as string} aria-label={title as string} aria-current={tab===key||key==="board"&&tab==="internal"?"page":undefined} className={tab===key||key==="board"&&tab==="internal"?"active":""} onClick={()=>navigate(key as string)}><I size={16}/><span>{key==="sales"?"Pedidos":key==="invoices"?"Invoices":title as string}</span>{(key==="packing"||key==="invoices")&&readyDocumentation.length>0&&<span className="documentation-count" aria-label={(key==="packing"?readyDocumentation.length+" envios":readyDocumentationOrders+" pedidos")+" prontos para documentação"}>{key==="packing"?readyDocumentation.length:readyDocumentationOrders}</span>}</button>})}</nav>
 <HeaderMenu className={"app-more-menu "+(["unlinked","archived","box-settings","help"].includes(tab)?"is-active":"")} label="Mais opções de navegação" trigger={<><span>{tab==="unlinked"?"Pendências":tab==="archived"?"Arquivados":tab==="box-settings"?"Caixas":tab==="help"?"Manual":"Mais"}</span>{unlinkedCount>0&&<span className="menu-alert" aria-label={unlinkedCount+" OP(s) com vínculo pendente"}>{unlinkedCount>99?"99+":unlinkedCount}</span>}<ChevronDown size={14}/></>}>
  <button aria-label="Pendências" aria-current={tab==="unlinked"?"page":undefined} onClick={openUnlinked}><AlertCircle size={16}/>Pendências{unlinkedCount>0&&<span className="menu-count">{unlinkedCount}</span>}</button>
  <button aria-label="Arquivados" aria-current={tab==="archived"?"page":undefined} onClick={()=>navigate("archived")}><Archive size={16}/>Arquivados</button>
  <hr className="menu-divider"/>
  <button aria-label="Configurações de caixas" aria-current={tab==="box-settings"?"page":undefined} onClick={()=>navigate("box-settings")}><Package size={16}/>Modelos de caixas</button>
  <button aria-label="Manual de boas práticas" aria-current={tab==="help"?"page":undefined} onClick={()=>navigate("help")}><BookOpen size={16}/>Manual</button>
 </HeaderMenu>
 <HeaderMenu className="account-menu" label={"Conta e aparência · "+employee} trigger={<><span className="account-avatar">{employee.trim().split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase()}</span><span className="account-name">{employee}</span><ChevronDown size={13}/></>}>
  <span className="menu-caption"><UserRound size={14}/>{employee}</span>
  <div data-menu-stay><ThemeToggle/></div>
  <button type="button" aria-label="Sair do painel" disabled={leaving||saving} onClick={()=>void leavePanel()}><LogOut size={16}/>{leaving?"Saindo…":"Sair ou trocar funcionário"}</button>
  <hr className="menu-divider"/>
  <span className="menu-caption"><ShieldCheck size={14}/>Nomus · somente leitura</span>
 </HeaderMenu>
 </header>
 <main className="board-main">
 <div className={"workspace-heading "+(tab==="board"||tab==="internal"?"production-heading":"")}><header className="global-bar"><div><span className="header-dot"/><h1>{tab==="archived"?"Arquivados":tab==="box-settings"?"Configurações de caixas":tab==="invoices"?"Invoices FedEx / DHL":tab==="packing"?"Packing lists":tab==="board"?"Produção":tab==="internal"?"Produção":tab==="unlinked"?"Pendências":tab==="sales"?"Pedidos de venda":"Manual de boas práticas"}</h1></div><div className="heading-actions">{saveIndicator}<HeaderMenu className="workspace-actions-menu" label="Ações do quadro" trigger={<Ellipsis size={20}/>}>
 <button onClick={reload} disabled={saving||loading} aria-label="Recarregar quadro"><RefreshCw size={16} className={loading?"spin":""}/>Recarregar quadro</button>
 {tab==="board"&&<button onClick={exportCsv} disabled={!data}><Download size={16}/>Exportar planilha</button>}
 </HeaderMenu>{!showCaptureInStrip&&nomusCapture}</div></header>
 <div className="workspace-toolbar">
 {(tab==="board"||tab==="internal")&&<HeaderMenu className="production-view-menu" align="start" label="Tipo de produção" trigger={<><span>{tab==="board"?"Pedidos de clientes":"Interna em KG"}</span><ChevronDown size={14}/></>}>
 <button aria-pressed={tab==="board"} onClick={()=>navigate("board")}><ClipboardCheck size={16}/>Pedidos de clientes</button>
 <button aria-pressed={tab==="internal"} onClick={()=>navigate("internal")}><Factory size={16}/>Interna em KG</button>
 </HeaderMenu>}
 {tab!=="archived"&&tab!=="invoices"&&tab!=="packing"&&tab!=="help"&&<div className="board-tools simple-tools"><div className="search" role="search" aria-label="Pesquisar pedidos"><Search size={19} aria-hidden="true"/><input type="search" autoComplete="off" ref={searchInput} aria-keyshortcuts="/ Control+k Meta+k" aria-label="Buscar no quadro" placeholder="SKU, pedido, cliente, OP ou produto" title="Buscar pelo número do pedido de venda, cliente, OP ou produto" value={search} onChange={e=>setSearch(e.target.value)}/>{!search&&<kbd className="search-shortcut" aria-hidden="true" title="Buscar: / ou Ctrl/Cmd + K">/</kbd>}{search&&<button type="button" className="search-clear" aria-label="Limpar busca" onClick={()=>{setSearch("");searchInput.current?.focus()}}><X size={16} aria-hidden="true"/></button>}</div>{tab!=="sales"&&<button className={"button filter-toggle "+(filtersOpen?"active":"")} aria-expanded={filtersOpen} aria-controls="board-filter-panel" title="Mostrar ou ocultar filtros (F)" onClick={()=>setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16}/>Filtros{activeFilters.length>0&&<span className="filter-count" aria-label={activeFilters.length+" filtros ativos"}>{activeFilters.length}</span>}</button>}{tab==="sales"&&search&&<button className="text-action" onClick={clearFilters}>Limpar busca</button>}

 </div>}

 </div>
 {tab!=="archived"&&tab!=="invoices"&&tab!=="packing"&&tab!=="help"&&tab!=="sales"&&filtersOpen&&<div id="board-filter-panel" className="filters-panel"><div className="month-filter"><label htmlFor="month-mode">Criação da OP</label><select id="month-mode" value={month} onChange={e=>setMonth(e.target.value)}><option value="all">Desde {SITE_START_LABEL}</option><option value="range">Intervalo de datas</option><option value="unknown">Sem data</option></select>{month==="range"&&<div className="date-range"><label>De<input type="date" aria-label="Data inicial de criação das OPs" min={SITE_START_DATE} value={start} onChange={e=>setStart(clampStart(e.target.value))}/></label><label>Até<input type="date" aria-label="Data final de criação das OPs" min={start||SITE_START_DATE} value={end} onChange={e=>setEnd(clampStart(e.target.value))}/></label></div>}</div>{tab==="board"&&<><label>Empresa<select aria-label="Filtrar empresas" value={company} onChange={e=>setCompany(e.target.value)}><option value="Todas">Todas as empresas</option>{companies.map(v=><option key={v}>{v}</option>)}</select></label><label>Envio<select aria-label="Filtrar transportadora" value={carrier} onChange={e=>setCarrier(e.target.value)}>{carrierFilters.map(c=><option key={c} value={c}>{c==="Todas"?"Todas as transportadoras":c}</option>)}</select></label><label>Etiqueta<select aria-label="Filtrar etiquetas" value={label} onChange={e=>setLabel(e.target.value)}><option value="Todas">Todas as etiquetas</option>{labels.filter(Boolean).map(v=><option key={v}>{v}</option>)}</select></label></>}</div>}
 </div>
 {tab!=="archived"&&tab!=="invoices"&&tab!=="packing"&&tab!=="help"&&tab!=="sales"&&month==="range"&&(!start||!end||start>end)&&<div role="alert" className="error-banner">Informe as duas datas. A data inicial deve ser anterior ou igual à final.</div>}
 {tab!=="archived"&&tab!=="invoices"&&tab!=="packing"&&tab!=="help"&&tab!=="sales"&&<div className="data-strip"><span role="status" aria-live="polite">{tab==="board"?visible.length===0&&(search||activeFilters.length>0)?"Nenhum pedido encontrado. Ajuste a busca ou limpe os filtros.":visible.length+ (visible.length===1?" pedido exibido":" pedidos exibidos"):(tab==="internal"?unlinked.filter(o=>!isCancelledOP(o)&&isInternal(o)).length+" OPs internas":pendingLinks.length+" correções · "+uncertain.length+" aguardando consulta")}{month!=="all"&&" no recorte"}{unknown>0&&<button onClick={()=>{setMonth("unknown");setFiltersOpen(true)}}>{unknown} sem data</button>}</span>{activeFilters.length>0&&<div className="active-filters" aria-label="Filtros ativos">{activeFilters.map(filter=><button key={filter.key} onClick={filter.clear} aria-label={"Remover filtro: "+filter.text}>{filter.text}<X size={12}/></button>)}</div>}{(search||activeFilters.length>0)&&<button className="text-action" onClick={clearFilters}>Limpar filtros</button>}{nomusCapture}</div>}
 {liveError&&<div role="alert" className="error-banner">{liveError}</div>}
 {error&&<div role="alert" className="error-banner"><span>{error}</span>{dirty&&<button disabled={saving} onClick={()=>void saver.current?.retry()}>Tentar novamente</button>}<button disabled={saving} onClick={reload}>Recarregar</button></div>}

 {data&&(tab==="invoices"&&!invoiceId&&!invoiceSeed)&&<DocumentationReady key={tab} entries={readyDocumentation} kind="invoices" onOpen={openInvoice} disabled={loading||saving}/> }
 {loading&&!data?<div className="loading"><LoaderCircle className="spin"/>Carregando…</div>:!data?<div className="loading"><button onClick={reload}>Tentar novamente</button></div>:tab==="archived"?<ArchivedOrders snapshot={data.snapshot} board={board} disabled={loading||saving||dirty} onRestore={id=>archiveOrder(id,false)} onOpen={openCard} onPacking={openPacking} onInvoice={openInvoice}/>:tab==="box-settings"?<section className="box-settings-page shipment-section"><header><h2>Modelos de caixas</h2><p>Cadastre medidas e limites para reutilizar ao criar novas caixas.</p></header><BoxModels expanded models={board.boxModels??[]} onChange={boxModels=>edit({...boardRef.current,boxModels})} onSelect={()=>{}} disabled={loading}/></section>:tab==="invoices"?<InvoiceWorkspace onDelete={deleteInvoice} invoices={board.invoices??{}} orders={[...new Map([...(data.snapshot.pedidos??[]),...groups].map(o=>[o.id,o])).values()]} board={board} selected={invoiceId} onSelect={setInvoiceId} seedOrder={invoiceSeed} onChange={invoice=>edit({...boardRef.current,invoices:{...boardRef.current.invoices,[invoice.id]:invoice}})} onHelp={showTutorial} onOpenPacking={openPacking} onOpenExpedition={openExpedition} disabled={loading} canExport={!dirty&&!saving&&!loading&&!liveError}/>:tab==="packing"?<PackingWorkspace readyEntries={readyDocumentation} onDelete={deletePacking} onInvoice={openInvoice} section={packingSection} onSection={setPackingSection} onPending={setPackingPending} onHelp={showTutorial} onOpenOrder={openExpedition} groups={groups} board={board} owner={packingOwner} onSelect={setPackingOwner} confirmationBlockedReason={error&&dirty?error+" Use Tentar novamente no aviso de salvamento. Se precisar recarregar, descarte primeiro a seleção não confirmada.":liveError?"A confirmação aguarda a sincronização com a equipe. Sua seleção está preservada e será liberada quando a conexão voltar.":""} disabled={loading} canExport={!dirty&&!saving&&!loading&&!liveError} onChange={(id,envio)=>update(id,{envio})} onGroup={(id,ids,holder,patch)=>{const envio=mergeShipment(boardRef.current,id,ids,holder,patch,new Date().toISOString(),()=>crypto.randomUUID());update(id,{envio})}}/>:tab==="sales"?<SalesCatalog archivedIds={new Set(Object.keys(board.details).filter(id=>board.details[id].arquivado))} onArchive={archiveOrder} disabled={loading} onStock={startStock} stockIds={new Set(Object.keys(board.details).filter(id=>board.details[id].atendimentoEstoque))} onInvoice={openInvoice} onPacking={openPacking} orders={data.snapshot.pedidos??[]} search={search} complete={sync?.pedidosCoberturaCompleta??false} identified={sync?.pedidosIdentificados??0} nextPage={sync?.paginaPedidos??1} boardIds={new Set(groups.filter(g=>g.ordens.length).map(g=>g.id))} onOpen={id=>{setSelected(id);setDetailTab("overview")}}/>:tab==="board"?<section className="kanban" aria-label="Quadro de produção">{laneColumns.map(c=>{const cards=ordered.filter(g=>orderStage(g)===c.id);return <section className={"kanban-list "+(over===c.id?"drop-active":"")} key={c.id} style={{borderTopColor:c.color}} onDragOver={e=>{if(dragged&&c.id!=="backlog"){e.preventDefault();setOver(c.id)}}} onDrop={e=>{e.preventDefault();transfer(e.dataTransfer.getData("text/plain"),c.id)}} data-stage={c.id} aria-label={c.title}><div className="list-heading" title={c.id==="backlog"?"Situação consultada no Nomus":undefined}><span className="list-dot" style={{background:c.color}}/><h2>{c.title}</h2><span className="list-count">{cards.length}</span></div><div className="list-cards">{cards.map(card)}{!cards.length&&<div className="empty-list">{search||label!=="Todas"||company!=="Todas"||month!=="all"?"Sem cartões neste recorte":"Nenhum pedido"}</div>}</div></section>})}</section>:tab==="internal"?<section className="content-panel internal-panel"><p className="pending-help"><strong>Produção interna em KG não exige pedido de venda.</strong> Estas OPs são acompanhadas por produto e não contam como pendência de vínculo. Medicina Sagrada permanece fora do painel.</p><button className="button ghost" onClick={showTutorial}>Ver orientação no manual</button><div className="internal-summary"><span>{internal.length} produtos</span><span>OPs sem pedido · produção em KG</span></div>{internal.map(g=><details key={g.key} className="internal-group" open><summary><span className="internal-icon"><Factory size={18}/></span><ProductIdentity sku={g.sku} name={g.product}/><span>{g.orders.length} OPs</span></summary><div className="internal-orders">{g.orders.map(o=><article key={o.id}><strong>{o.nome}</strong><ProductIdentity sku={o.sku} name={o.produto}/><span>Criada em {shortDate(o.criacao)}</span><b>{o.quantidade}<small>{o.unidade}</small></b></article>)}</div></details>)}{!internal.length&&<p>Nenhuma OP de produção interna neste recorte.</p>}</section>:tab==="unlinked"?<PendingWorkspace cancelled={cancelledOps} ops={pendingLinks} orders={uncertain.filter(g=>[g.codigo,g.cliente].join(" ").toLowerCase().includes(search.toLowerCase()))} onHelp={showTutorial} onOrder={id=>{setSelected(id);setDetailTab("overview")}}/>:<section className="manual-panel"><ManualGuide topic={manualTopic} onNavigate={navigate} onBack={()=>navigate(helpReturn)}/><details className="manual-system-info"><summary>Conexão, empresas e responsáveis</summary><div className="connection-detail"><ShieldCheck size={18}/><div><strong>Nomus · acesso somente leitura</strong><p>{syncError||sync?.message||"Consultando a conexão."} {sync?.lastChecked?"Última página consultada: "+date(sync.lastChecked)+".":""} {sync?.configured?"Consulta por páginas enquanto o painel estiver aberto.":"Configure a conexão no servidor para acompanhar alterações."}</p></div></div><details className="label-guide"><summary>Empresas e responsáveis disponíveis</summary><strong>Empresas</strong><div>{companies.map((name,i)=><span key={name} className={"company-tag company-"+i}>{name}</span>)}</div><strong>Funcionários</strong><div>{staffNames.map(name=><span key={name} className="staff-tag"><i style={staffStyle(name)}/>{name}</span>)}</div><strong>Etiquetas</strong><div>{labels.filter(Boolean).map(name=><span key={name} className={"label label-"+name}>{name}</span>)}</div></details></details></section>}
 {data&&<TeamChat employee={employee} sessionActive={sessionActive} onSessionExpired={onSessionExpired} open={chatOpen} onOpen={()=>{setSelected(null);setChatOpen(true)}} onClose={()=>setChatOpen(false)} channel={chatChannel} onChannel={setChatChannel} orders={[...new Map([...(data.snapshot.pedidos??[]),...groups].map(g=>[g.id,g])).values()]} onThreads={setChatThreads} onOpenOrder={id=>{setChatOpen(false);if(groups.some(g=>g.id===id)||waitingOrders.some(g=>g.id===id))openCard(id);else{setSearch(data.snapshot.pedidos?.find(g=>g.id===id)?.codigo||id);setTab("sales")}}}/>}
 <footer className="board-footer"><span>Prioridade definida pelo supervisor</span><span>{data?.updatedAt?"Quadro salvo às "+new Date(data.updatedAt).toLocaleTimeString("pt-BR",{timeZone:"America/Sao_Paulo"}):"Salvamento automático"}</span></footer>
 </main>
 {active&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><section className="card-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={e=>e.stopPropagation()}>
 <button className="close" aria-label="Fechar cartão" onClick={()=>setSelected(null)}><X size={22}/></button>
 <div className="dialog-header"><Layers3 size={24}/><div><p className="order-heading">{active.codigo}<OrderCreated value={active.criacao}/></p><h2 id="dialog-title">{active.cliente||"Cliente aguardando consulta"}</h2><span>{awaitsRelease(active,detail)?"Aguardando liberação":columns.find(c=>c.id===orderStage(active))!.title}{board.sequence.includes(active.id)?" · Prioridade #"+(board.sequence.indexOf(active.id)+1):""}</span></div></div>
 {change&&<details hidden={detailTab!=="overview"} className="change-detail compact-changes" open={changeOpen} onToggle={e=>setChangeOpen(e.currentTarget.open)}><summary><Bell size={17}/><strong>{unseen(active.id)?"Novidades neste pedido":"Histórico do pedido"}</strong><span>Ver o que mudou</span></summary><div><small>Detectada em {date(change.at)}</small><div className="change-events">{changeEvents.map((event,i)=><article className="change-event" key={event.at+event.summary+i}><h4>{event.summary}</h4><small>{date(event.at)}</small>{event.fields.length>0&&<div className="change-table-wrap"><table><thead><tr><th>Campo</th><th>Antes</th><th>Agora</th></tr></thead><tbody>{event.fields.map((f,j)=><tr key={f.label+j}><th>{f.label}</th><td>{f.before||"Não informado"}</td><td>{f.after||"Não informado"}</td></tr>)}</tbody></table></div>}{event.note&&<p>{event.note}</p>}</article>)}</div>{change.items.some(t=>!(change.events??[]).some(e=>e.summary===t))&&<div className="change-legacy"><p>Avisos anteriores: o sistema não guardou o comparativo destes registros.</p><ul>{change.items.filter(t=>!(change.events??[]).some(e=>e.summary===t)).map(t=>{const op=t.startsWith("Nova OP ")?active.ordens.find(o=>o.id===t.slice(8)):undefined;return <li key={t}>{t}{op&&<span className="change-current">Dados atuais: {op.sku&&op.sku+" · "}{op.produto} · {op.quantidade} {op.unidade}</span>}</li>})}</ul></div>}{unseen(active.id)&&<button onClick={()=>update(active.id,{vistoNomus:change.at})}><Check size={14}/>Marcar como visto</button>}</div></details>}
 <nav className="detail-tabs" aria-label="Seções do cartão">{[["overview","Geral",LayoutDashboard],["expedition","Expedição",Package],["shipping","Documentos",FileText]].map(([key,title,Icon])=>{const I=Icon as typeof Factory;return <button type="button" key={key as string} data-detail-tab={key} aria-pressed={detailTab===key} className={detailTab===key?"active":""} onClick={()=>setDetailTab(key as string)}><I size={16}/><span>{title as string}</span></button>})}</nav>
 <div className="detail-panel" hidden={detailTab!=="overview"}>{!active.estoque&&<OrderProductionSummary ops={active.ordens} onConference={()=>{setDetailTab("expedition");setExpeditionStep("review")}}/>}<OrderReleaseNotice order={active}/>{detail.situacao==="Bloqueado"&&<div className="release-notice">Impedimento registrado. Confira as orientações do supervisor antes de continuar. <button className="button" disabled={loading} onClick={()=>transfer(active.id,"doing")}>Retomar produção</button></div>}{active.estoque?<p className="check-help">Pedido atendido com produtos do estoque. Confira, embale e documente sem criar OP. O painel não realiza baixa de estoque no Nomus.</p>:<ProductionQuantities ops={activeOps}/>}
 <fieldset disabled={loading} className="dialog-fields carrier-fields"><label><ArrowRight size={15}/>Mover para<select disabled={awaitsRelease(active,detail)||!canQueue(active)&&!hasStarted(detail)} value={orderStage(active)} onChange={e=>transfer(active.id,e.target.value as Stage)}>{laneColumns.filter(c=>awaitsRelease(active,detail)?c.id==="backlog":!canQueue(active)&&!hasStarted(detail)?c.id===orderStage(active):active.estoque?["blocked","done","shipping","ready","sent"].includes(c.id):active.ordens.length?c.id!=="backlog":c.id==="backlog").map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label><Flag size={15}/>Etiqueta<select className={"label-select label-"+(detail.etiqueta??"").replaceAll(" ","-")} value={detail.etiqueta??""} onChange={e=>update(active.id,{etiqueta:e.target.value})}>{labels.map(l=><option key={l} value={l}>{l||"Sem etiqueta"}</option>)}</select></label><label><Factory size={15}/>Empresa<select className={"company-select company-"+companies.indexOf(detail.empresa??"")} value={detail.empresa??""} onChange={e=>update(active.id,{empresa:e.target.value})}><option value="">Sem empresa</option>{companies.map(c=><option key={c}>{c}</option>)}</select></label><label><Truck size={15}/>Envio<CarrierControl value={activeCarrier.value}><select aria-label="Etiqueta de envio" className={"carrier-select carrier-"+activeCarrier.category.toLowerCase()} value={activeCarrier.value} onChange={e=>changeShipmentCarrier(e.target.value)}><option value="" disabled={activeCarrier.source==="invoice"}>{activeCarrier.category==="Múltiplas"?"Múltiplas nas invoices":"A definir"}</option><option>FedEx</option><option>DHL</option><option>Carregamento</option><option value="Outra">Outra transportadora</option>{activeCarrier.value&&!["FedEx","DHL","Carregamento","Outra"].includes(activeCarrier.value)&&<option value={activeCarrier.value}>{activeCarrier.value}</option>}</select></CarrierControl></label></fieldset>
 <div className="dialog-section supervisor-notes"><h3><MessageSquare size={18}/>Orientações do supervisor</h3><p className="check-help">Orientações e pendências para a equipe. Preenchimento pelo supervisor de produção.</p><textarea aria-label="Orientações e pendências do supervisor de produção" disabled={loading} maxLength={1500} rows={3} value={detail.nota} placeholder="Supervisor: registre as orientações, pendências e responsáveis pela resolução." onChange={e=>update(active.id,{nota:e.target.value})}/></div>
 </div><div className="detail-panel" hidden={detailTab!=="expedition"}>
 <nav className="detail-tabs expedition-tabs" aria-label="Etapas da expedição">{[["review","1. Conferir produtos"],["boxes","2. Montar caixas"]].map(([key,title])=><button key={key} data-expedition-step={key} className={expeditionStep===key?"active":""} aria-pressed={expeditionStep===key} onClick={()=>setExpeditionStep(key)}>{title}</button>)}</nav>
 {shipment?.agrupamento&&shipment.agrupamento.pedidos.length>1&&<p className="group-notice">Caixas compartilhadas: {shipment.agrupamento.pedidos.join(", ")}. Alterações valem para todo o envio.</p>}
 {detailTab==="expedition"&&expeditionStep==="boxes"&&<><ShipmentEditor initialBoxId={focusedBox} assemblyStep={assemblyStep} onAssemblyStepChange={setAssemblyStep} models={board.boxModels??[]} value={shipment} ops={shippingOps} products={shipmentProducts(shipment,owner,groups)} disabled={loading} onChange={envio=>update(owner,{envio})}/><div className="flow-actions"><button className="text-action" onClick={()=>setExpeditionStep("review")}>Voltar à conferência dos produtos</button></div>{assemblyStep==="measure"&&!!shipment?.caixas.length&&<BoxConference value={shipment} ops={shippingOps} person={detail.responsavelConferencia??""} disabled={loading||dirty||saving} onChange={envio=>update(owner,{envio})} onDocuments={()=>setDetailTab("shipping")}/>}</>}
 {expeditionStep==="review"&&<ProductConference onVisibleOps={requestProduction} key={active.id} ops={active.ordens} value={shipment} carrier={activeCarrier.value} carrierSource={activeCarrier.source} onCarrier={changeShipmentCarrier} person={detail.responsavelConferencia??""} stock={active.estoque} disabled={loading} onPerson={value=>update(active.id,{responsavelConferencia:value})} onBox={showBox} onContinue={()=>setExpeditionStep("boxes")}/>}
 </div>
 <div className="detail-panel" hidden={detailTab!=="shipping"}><OrderShippingSummary reviewed={boxReview.reviewed} onExpedition={()=>{setDetailTab("expedition");setAssemblyStep(shipment?.caixasEmMontagem?.length?"small":"outer");setExpeditionStep(shipment?.caixas.length||shipment?.caixasEmMontagem?.length?"boxes":"review")}} shipment={shipment} orderIds={shipment?.agrupamento?.pedidos??[active.id]} onPacking={()=>openPacking(active.id)} onInvoice={()=>openInvoice(active.id)}/></div>
 {detail.arquivado&&<p className={"archive-preserved "+archiveStyles.preserved}>Pedido arquivado · histórico preservado. <button className="text-action" onClick={()=>{setSelected(null);navigate("archived")}}>Ver Arquivados</button></p>}
 <OrderHistory key={active.id} orderId={active.id} revision={data?.revision??0} pending={dirty||saving}/><ArchiveHistory record={detail.arquivo} archived={!!detail.arquivado}/>
 <div className="dialog-footer">{saveIndicator}<ArchiveActions restoreUnavailable={![...(data?.snapshot.grupos??[]),...(data?.snapshot.pedidos??[])].some(g=>g.id===active.id)} archived={!!detail.arquivado} disabled={loading||saving||dirty} onSelect={(archived,reason)=>archiveOrder(active.id,archived,reason)}/><button className="button" onClick={()=>setSelected(null)}>Fechar</button></div>{error&&<div className="dialog-error" role="alert">{error}<button disabled={saving} onClick={()=>void saver.current?.retry()}>Tentar novamente</button></div>}
 </section></div>}
 {archiveTarget&&archiveOrderTarget&&<ArchiveDialog restoreUnavailable={![...(data?.snapshot.grupos??[]),...(data?.snapshot.pedidos??[])].some(g=>g.id===archiveTarget.id)} initialReason={archiveTarget.reason} key={archiveTarget.id+String(archiveTarget.restoring)} order={archiveOrderTarget} restoring={archiveTarget.restoring} onClose={()=>setArchiveTarget(null)} onConfirm={confirmArchive}/>}
 </div>
}
