"use client";
import {useLayoutEffect,useEffect,useState} from "react";
import {FileText,Plus,ArrowLeft,ArrowRight,Trash2,Search,Check,Package,UserRound} from "lucide-react";
import ContextHelp from "./context-help";
import {PACKING_STEPS,packingWorkflow} from "../lib/packing-workflow.mjs";
import {packingDeletionReason,packingOrderIds} from "../lib/packing-delete.mjs";
import PackingClients from "./packing-clients";
import PackingEditor from "./packing-editor";
import ShipmentEditor from "./shipment-editor";
import {emptyShipment,type Shipment,type Packing,type ShippingOP} from "../lib/shipping.mjs";
import {shipmentOwner,shipmentOps} from "../lib/shipment-groups.mjs";
type Group={id:string;codigo:string;cliente:string;ordens:ShippingOP[]};
type Board={details:Record<string,{envio?:Shipment;situacao?:string}>};
export default function PackingWorkspace({onDelete,groups,board,owner,onSelect,onChange,onGroup,disabled,canExport,confirmationBlockedReason,section,onSection,onOpenOrder,onHelp,onPending,onInvoice}:{
 onDelete:(id:string)=>Promise<void>;groups:Group[];board:Board;owner:string|null;onSelect:(id:string|null)=>void;
 onChange:(id:string,value:Shipment)=>void;
 onGroup:(owner:string,ids:string[],holder:{key:string;nome:string},patch:Partial<Packing>)=>void;
 disabled:boolean;canExport:boolean;confirmationBlockedReason?:string;onInvoice:(id:string)=>void;section:string;onSection:(step:string)=>void;onOpenOrder:(id:string)=>void;onHelp:()=>void;onPending:(pending:boolean)=>void;
}){
 const [search,setSearch]=useState(""),[statusFilter,setStatusFilter]=useState("all");
 const [deleting,setDeleting]=useState<string|null>(null),[deleteError,setDeleteError]=useState(""),[deleted,setDeleted]=useState("");
 const [creating,setCreating]=useState(false);
 const [pending,setPending]=useState(false);
 useLayoutEffect(()=>{onPending(pending);return()=>onPending(false)},[pending,onPending]);
 useEffect(()=>{if(!pending)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue=""};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn)},[pending]);
 function go(step:string){if(pending&&step!=="orders")return;onSection(step)}
 const resolved=owner?shipmentOwner(board,owner):null;
 const active=groups.find(g=>g.id===resolved);
 const value=resolved?board.details[resolved]?.envio:undefined;
 const ops=shipmentOps(value,resolved??"",groups);
 const documents=groups.filter(g=>shipmentOwner(board,g.id)===g.id&&!!board.details[g.id]?.envio&&!board.details[g.id]?.envio?.packingExcluido);
 const matches=(g:Group)=>[g.codigo,g.cliente,board.details[g.id]?.envio?.packing?.invoiceNumero,board.details[g.id]?.envio?.packing?.destinatarioNome,board.details[g.id]?.envio?.agrupamento?.titularNome,...(board.details[g.id]?.envio?.agrupamento?.pedidos??[])].join(" ").toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
 const allEntries=(creating?groups.filter(g=>shipmentOwner(board,g.id)===g.id&&(!board.details[g.id]?.envio||board.details[g.id]?.envio?.packingExcluido)):documents).filter(matches);
 function open(id:string){setDeleted("");setDeleteError("");onSelect(id);const shipment=board.details[id]?.envio;onSection(creating?"orders":packingWorkflow(shipment,shipmentOps(shipment,id,groups)).next);setCreating(false)}
 async function remove(id:string){
 if(disabled||!canExport||deleting)return;
 const reason=packingDeletionReason(board,id);if(reason){setDeleteError(reason);return}
 const shipment=board.details[id]?.envio,ids=packingOrderIds(board,id),name=shipment?.packing?.invoiceNumero||id;
 if(!confirm("Excluir packing list "+name+"?\nPedidos: "+ids.join(", ")+"\nO documento sairá da lista. Caixas, produtos, destinatário, agrupamento e rastreio serão preservados. Você poderá recriar o documento sem refazer a montagem."))return;
 setDeleting(id);setDeleteError("");setDeleted("");
 try{await onDelete(id);setDeleted("Packing list "+name+" excluído. Caixas e dados do envio foram preservados.")}catch(e){setDeleteError(e instanceof Error?e.message:"Não foi possível excluir.")}finally{setDeleting(null)}
 }
 const workflow=packingWorkflow(value,ops),boxReview=workflow.physical;
 const linkedIds=value?.agrupamento?.pedidos??(active?[active.id]:[]);
 const currentStep=PACKING_STEPS.some(step=>step.id===section)?section:"orders";
 const stageIndex=PACKING_STEPS.findIndex(step=>step.id===currentStep);
 const classify=(g:Group)=>{const shipment=board.details[g.id]?.envio;return shipment?.dataEnvio||board.details[g.id]?.situacao==="Atendido totalmente e enviado"?"sent":packingWorkflow(shipment,shipmentOps(shipment,g.id,groups)).ready?"ready":"pending"};
 const entries=allEntries.filter(g=>creating||statusFilter==="all"||classify(g)===statusFilter);
 return <section className="packing-workspace pl-workspace" aria-label="Área de packing lists">
 <div className="packing-workspace-heading"><div><h2><FileText size={24}/>Packing lists<ContextHelp label="Fluxo do packing list">Prepare um envio por vez. Os dados são salvos automaticamente. Ao reabrir, a primeira pendência indica de onde continuar. A revisão para emitir o PDF deve ser feita por quem estiver finalizando o documento.</ContextHelp></h2><p>Do pedido ao documento, uma etapa por vez.</p></div>{!active&&<button className="button primary" disabled={pending||disabled} onClick={()=>{onSelect(null);setSearch("");setCreating(true)}}><Plus size={16}/>Novo packing list</button>}</div>
 {deleteError&&<p className="dialog-error" role="alert">{deleteError}</p>}{deleted&&<p className="document-help" role="status">{deleted}</p>}
 {active&&resolved?<div className="packing-workspace-editor">
 <div className="pl-editor-toolbar"><button className="text-action" disabled={pending} onClick={()=>onSelect(null)}><ArrowLeft size={16}/>Todos os packing lists</button><button className="text-action" disabled={pending} onClick={onHelp}>Como preencher</button></div>
 {value?.packingExcluido&&<div className="next-task"><div><h3>Retomar com as caixas preservadas</h3><p>Recrie o documento para continuar este envio.</p></div><button className="button primary" disabled={disabled||!canExport} onClick={()=>onChange(resolved,{...value,packingExcluido:false})}>Recriar packing list</button></div>}
 <header className="pl-shipment-heading"><div><small>{value?.packing?.invoiceNumero?"PACKING LIST · "+value.packing.invoiceNumero:"PREPARAR PACKING LIST"}</small><h3>{value?.packing?.destinatarioNome||value?.agrupamento?.titularNome||active.cliente||"Destinatário a definir"}</h3><p>{linkedIds.join(" · ")}</p></div><span className={"pl-status "+(workflow.ready?"ready":"pending")}>{workflow.ready?"Pronto para revisão":"Em preparação"}</span></header>
 <div className="pl-handoff"><span><Package size={15}/>{value?.caixas.length??0} {value?.caixas.length===1?"Caixa 40":"Caixas 40"}</span><span><UserRound size={15}/>{boxReview.reviewed?"Caixas conferidas por "+value?.conferenciaPor:value?.conferenciaPor?"Refazer conferência · última por "+value.conferenciaPor:"Conferência das caixas pendente"}</span><span>{value?.packing?.assinante?"Revisão documental: "+value.packing.assinante:"Revisor do documento a definir"}</span><ContextHelp label="Continuidade do trabalho">A próxima ação é calculada a partir dos dados salvos. Assim, outra pessoa pode continuar sem refazer as etapas completas. Caixas alteradas exigem nova conferência. Antes de sair, aguarde o indicador Salvo.</ContextHelp></div>
 {pending?<p className="document-warning" role="status">Confirme ou descarte a seleção de pedidos e destinatário antes de sair desta etapa.</p>:<div className="pl-next-task"><div><small>PRÓXIMA AÇÃO</small><strong>{workflow.action}</strong></div>{currentStep!==workflow.next&&<button className="button" disabled={disabled} onClick={()=>go(workflow.next)}>Continuar daqui<ArrowRight size={15}/></button>}</div>}
 <nav className="pl-steps" aria-label="Etapas do packing list">{PACKING_STEPS.map((step,index)=>{const state=workflow.states[step.id];return <button key={step.id} data-packing-step={step.id} aria-current={currentStep===step.id?"step":undefined} aria-pressed={currentStep===step.id} className={(currentStep===step.id?"active ":"")+(state.done?"complete":"")} disabled={pending&&step.id!=="orders"} onClick={()=>go(step.id)}><span className="pl-step-number">{state.done?<Check size={16}/>:index+1}</span><span><strong>{step.title}</strong><small>{step.id==="review"?"Confirmação final":state.done?"Preenchido":state.count===1?"1 pendência":state.count+" pendências"}</small></span></button>})}</nav>
 <div className="pl-stage-content">
 <header className="pl-current-stage"><small>ETAPA {stageIndex+1} DE {PACKING_STEPS.length}</small><h3>{PACKING_STEPS[stageIndex].title}</h3><p>{currentStep==="orders"?"Confirme quais pedidos viajam juntos e quem receberá o envio.":currentStep==="boxes"?"Confira a descrição, o SKU, o HS Code e a embalagem de cada produto. As caixas estão abertas abaixo.":currentStep==="document"?"Preencha os quatro blocos obrigatórios. Dados complementares são opcionais.":"Confira o resumo, resolva as pendências e baixe o documento."}</p></header>
 <div hidden={currentStep!=="orders"}><PackingClients key={resolved} owner={resolved} groups={groups} board={board} disabled={disabled} blockedReason={confirmationBlockedReason} onPending={setPending} onApply={(ids,holder,patch)=>{onGroup(resolved,ids,holder,patch);setPending(false);onSection("boxes")}}/></div>
 {currentStep!=="orders"&&!boxReview.reviewed&&<div className="next-task pl-physical-gate"><div><Package size={24}/><h3>{boxReview.changed?"Confira novamente as caixas":"Conclua as caixas na expedição"}</h3><p>{boxReview.changed?"O conteúdo ou os dados físicos mudaram desde a última conferência.":"Monte, pese e confirme os volumes para preparar o packing list."}</p><ContextHelp label="Conferência necessária">As caixas e os produtos já cadastrados serão aproveitados. O documento usa as quantidades e os pesos dos volumes conferidos.</ContextHelp></div><button className="button primary" disabled={pending} onClick={()=>onOpenOrder(resolved)}>Conferir caixas na expedição<ArrowRight size={16}/></button></div>}
 {currentStep==="boxes"&&boxReview.reviewed&&<><div className="pl-stage-caption"><strong>Complete a identificação dos produtos</strong><ContextHelp label="Dados dos itens">Preencha a descrição para o documento, o HS Code confirmado e o tipo de embalagem. Os campos sinalizados e o botão de próximo campo ajudam a localizar o que falta.</ContextHelp><button className="text-action" onClick={()=>onOpenOrder(resolved)}>Corrigir caixas na expedição</button></div><ShipmentEditor mode="documents" value={value} ops={ops} disabled={disabled} onChange={shipment=>onChange(resolved,shipment)}/></>}
 {(currentStep==="document"||currentStep==="review")&&boxReview.reviewed&&!value?.packingExcluido&&<PackingEditor mode={currentStep==="document"?"fields":"review"} onFields={()=>go("document")} onBoxes={()=>go("boxes")} value={value??emptyShipment()} ops={ops} disabled={disabled} canExport={canExport} onChange={packing=>onChange(resolved,{...(value??emptyShipment()),packing})}/>}
 </div>
 <div className="pl-stage-footer"><button className="button" disabled={pending} onClick={()=>stageIndex?go(PACKING_STEPS[stageIndex-1].id):onSelect(null)}><ArrowLeft size={15}/>{stageIndex?"Etapa anterior":"Voltar à lista"}</button><span>Etapa {stageIndex+1} de {PACKING_STEPS.length}</span>{stageIndex<PACKING_STEPS.length-1&&(currentStep==="orders"||boxReview.reviewed)&&<button className="button primary" disabled={pending||disabled||!!value?.packingExcluido} onClick={()=>go(PACKING_STEPS[stageIndex+1].id)}>{PACKING_STEPS[stageIndex+1].title}<ArrowRight size={15}/></button>}</div>
 <section className="linked-order-actions pl-related"><h4>Pedidos vinculados · {linkedIds.length}</h4>{linkedIds.map(id=><div key={id}><strong>{groups.find(g=>g.id===id)?.codigo||id}</strong><button className="button" disabled={pending} onClick={()=>onOpenOrder(id)}>Abrir expedição</button><button className="text-action" disabled={pending||!boxReview.reviewed} onClick={()=>onInvoice(id)}>Invoice deste pedido</button></div>)}</section>
 </div>:<>
 <div className="pl-list-toolbar"><label className="search packing-workspace-search"><Search size={18}/><input aria-label="Buscar packing lists ou pedidos" placeholder="Pedido, cliente ou número da invoice" value={search} onChange={e=>setSearch(e.target.value)}/></label><button className="text-action" onClick={onHelp}>Como preparar</button></div>
 {!creating&&<div className="pl-list-filters" aria-label="Filtrar packing lists">{[["all","Todos"],["pending","A preparar"],["ready","Prontos para revisão"],["sent","Despachados"]].map(([key,label])=><button key={key} aria-pressed={statusFilter===key} onClick={()=>setStatusFilter(key)}>{label}<span>{allEntries.filter(g=>key==="all"||classify(g)===key).length}</span></button>)}</div>}
 {creating&&<div className="pl-create-heading"><h3>Escolha o primeiro pedido</h3><ContextHelp label="Criar packing list">Comece por um pedido e, se necessário, reúna outros que viajam juntos na próxima etapa. Documentos excluídos podem ser recriados com as caixas preservadas.</ContextHelp><button className="text-action" onClick={()=>{setCreating(false);setSearch("")}}>Cancelar</button></div>}
 <div className="packing-document-list">{entries.map(g=>{
 const shipment=board.details[g.id]?.envio,ids=shipment?.agrupamento?.pedidos??[g.codigo],state=packingWorkflow(shipment,shipmentOps(shipment,g.id,groups)),status=classify(g);
 return <div className="packing-document-entry" key={g.id}><button className="packing-document-card" onClick={()=>open(g.id)}><div className="pl-card-top"><FileText size={19}/><strong>{shipment?.packing?.invoiceNumero||g.codigo}</strong>{!creating&&<span className={"pl-status "+status}>{status==="sent"?"Despachado":status==="ready"?"Pronto para revisão":"Em preparação"}</span>}</div><div className="pl-card-body"><strong>{shipment?.packing?.destinatarioNome||shipment?.agrupamento?.titularNome||g.cliente||"Cliente aguardando consulta"}</strong><span>{ids.join(" · ")}</span><small>{shipment?.caixas.length??0} {shipment?.caixas.length===1?"Caixa 40":"Caixas 40"}{shipment?.packing?.assinante?" · Revisão: "+shipment.packing.assinante:""}</small></div><div className="pl-card-next"><span>{creating?(shipment?.packingExcluido?"Recriar com caixas preservadas":"Preparar este pedido"):status==="sent"?"Consultar documento":state.action}</span><ArrowRight size={15}/></div></button>{!creating&&!packingDeletionReason(board,g.id)&&<button className="text-action packing-delete" data-packing-delete={g.id} aria-label={"Excluir packing list "+(shipment?.packing?.invoiceNumero||g.codigo)} disabled={disabled||!canExport||!!deleting} onClick={()=>void remove(g.id)}><Trash2 size={14}/>{deleting===g.id?"Excluindo…":"Excluir rascunho"}</button>}</div>
 })}</div>
 {!entries.length&&<div className="pl-empty"><FileText size={28}/><h3>{search||statusFilter!=="all"?"Nenhum resultado":"Nenhum packing list por aqui"}</h3><p>{creating?"Os pedidos disponíveis aparecem aqui para iniciar um documento.":search||statusFilter!=="all"?"Ajuste a busca ou os filtros para encontrar o envio.":"Selecione Novo packing list para começar."}</p></div>}
 </>}
 </section>
}
