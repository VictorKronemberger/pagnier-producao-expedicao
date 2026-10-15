"use client";
import {useLayoutEffect,useEffect,useState} from "react";
import {FileText,Plus,ArrowLeft,Trash2} from "lucide-react";
import {packingDeletionReason,packingOrderIds} from "../lib/packing-delete.mjs";
import {inspectBoxReview} from "../lib/box-review.mjs";
import PackingClients from "./packing-clients";
import PackingEditor from "./packing-editor";
import ShipmentEditor from "./shipment-editor";
import {emptyShipment,type Shipment,type Packing,type ShippingOP} from "../lib/shipping.mjs";
import {inspectPacking} from "../lib/packing-list.mjs";
import {shipmentOwner,shipmentOps} from "../lib/shipment-groups.mjs";
type Group={id:string;codigo:string;cliente:string;ordens:ShippingOP[]};
type Board={details:Record<string,{envio?:Shipment;situacao?:string}>};
export default function PackingWorkspace({onDelete,groups,board,owner,onSelect,onChange,onGroup,disabled,canExport,section,onSection,onOpenOrder,onHelp,onPending,onInvoice}:{
 onDelete:(id:string)=>Promise<void>;groups:Group[];board:Board;owner:string|null;onSelect:(id:string|null)=>void;
 onChange:(id:string,value:Shipment)=>void;
 onGroup:(owner:string,ids:string[],holder:{key:string;nome:string},patch:Partial<Packing>)=>void;
 disabled:boolean;canExport:boolean;onInvoice:(id:string)=>void;section:string;onSection:(step:string)=>void;onOpenOrder:(id:string)=>void;onHelp:()=>void;onPending:(pending:boolean)=>void;
}){
 const [search,setSearch]=useState("");
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
 const matches=(g:Group)=>[g.codigo,g.cliente,board.details[g.id]?.envio?.packing?.invoiceNumero,board.details[g.id]?.envio?.agrupamento?.titularNome,...(board.details[g.id]?.envio?.agrupamento?.pedidos??[])].join(" ").toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
 const entries=(creating?groups.filter(g=>shipmentOwner(board,g.id)===g.id&&(!board.details[g.id]?.envio||board.details[g.id]?.envio?.packingExcluido)):documents).filter(matches);
 function open(id:string){setDeleted("");setDeleteError("");onSelect(id);onSection("orders");setCreating(false)}
 async function remove(id:string){
 if(disabled||!canExport||deleting)return;
 const reason=packingDeletionReason(board,id);if(reason){setDeleteError(reason);return}
 const shipment=board.details[id]?.envio,ids=packingOrderIds(board,id),name=shipment?.packing?.invoiceNumero||id;
 if(!confirm("Excluir packing list "+name+"?\nPedidos: "+ids.join(", ")+"\nO documento sairá da lista. Caixas, produtos, destinatário, agrupamento e rastreio serão preservados. Você poderá recriar o documento sem refazer a montagem."))return;
 setDeleting(id);setDeleteError("");setDeleted("");
 try{await onDelete(id);setDeleted("Packing list "+name+" excluído. Caixas e dados do envio foram preservados.")}catch(e){setDeleteError(e instanceof Error?e.message:"Não foi possível excluir.")}finally{setDeleting(null)}
 }
 const boxReview=inspectBoxReview(value,ops);
 const report=active?inspectPacking(value??emptyShipment(),ops):null;
 const linkedIds=value?.agrupamento?.pedidos??(active?[active.id]:[]);
 return <section className="packing-workspace" aria-label="Área de packing lists">
 <div className="packing-workspace-heading"><div><h2><FileText size={24}/>Packing lists</h2><p>Confira os produtos e monte as caixas na expedição. Depois, reúna os pedidos e prepare o documento.</p></div><button className="button" disabled={pending} onClick={()=>{onSelect(null);setSearch("");setCreating(true)}}><Plus size={16}/>Novo packing list</button></div>
 {deleteError&&<p className="dialog-error" role="alert">{deleteError}</p>}{deleted&&<p className="document-help" role="status">{deleted}</p>}
 {active&&resolved?<div className="packing-workspace-editor">
 <button className="button" disabled={pending} onClick={()=>onSelect(null)}><ArrowLeft size={16}/>Voltar à lista</button>
 {value?.packingExcluido&&<div className="next-task"><div><h3>As caixas deste envio estão preservadas</h3><p>Recrie o documento para continuar com os mesmos produtos, volumes e destinatário.</p></div><button className="button primary" onClick={()=>onChange(resolved,{...value,packingExcluido:false})}>Recriar packing list</button></div>}
 <h3>{value?.packing?.invoiceNumero?"Packing list · "+value.packing.invoiceNumero:"Preparar packing list"}</h3>
 <p className="document-help">Pedidos deste envio: {(value?.agrupamento?.pedidos??[active.codigo]).join(", ")} · {value?.agrupamento?.titularNome||active.cliente}</p>
 <details className="linked-order-actions"><summary>Ver os {linkedIds.length} pedido(s) deste envio</summary><p>Abra o pedido para conferir a produção. A invoice FedEx/DHL é individual.</p>{linkedIds.map(id=><div key={id}><strong>{groups.find(g=>g.id===id)?.codigo||id}</strong><button className="button" disabled={pending} onClick={()=>onOpenOrder(id)}>Abrir expedição</button><button className="text-action" disabled={pending||!boxReview.reviewed} onClick={()=>onInvoice(id)}>Invoice deste pedido</button></div>)}</details>
 <div className="flow-summary"><span>{linkedIds.length} pedido(s)</span><span>{value?.caixas.length??0} volume(s) externo(s)</span>{!!value?.caixasEmMontagem?.length&&<span>{value.caixasEmMontagem.length} embalagens aguardando acomodação</span>}<span>{!boxReview.reviewed?"Aguardando conferência das caixas":report?.issues.length?report.issues.length+" pendências documentais":"Cálculos completos · revise o documento"}</span><button className="button" disabled={pending} onClick={onHelp}>Tutorial deste fluxo</button></div>
 {pending&&<p className="document-warning" role="status">Há uma seleção de pedidos ou destinatário não confirmada. Confirme ou descarte na etapa 1 antes de continuar.</p>}
 <nav className="detail-tabs" aria-label="Etapas do packing list">{[["orders","1. Pedidos e destinatário"],["boxes","2. Dados dos itens"],["document","3. Revisar e exportar"]].map(([key,label])=><button key={key} data-packing-step={key} className={section===key?"active":""} aria-pressed={section===key} disabled={pending&&key!=="orders"} onClick={()=>go(key)}>{label}</button>)}</nav>
 <div hidden={section!=="orders"}><PackingClients key={resolved} owner={resolved} groups={groups} board={board} disabled={disabled||!canExport} onPending={setPending} onApply={(ids,holder,patch)=>{onGroup(resolved,ids,holder,patch);setPending(false);onSection("boxes")}}/><p className="document-help">Pedidos reunidos compartilham caixas e rastreio. Ao alterar o agrupamento, confira os volumes compartilhados na expedição antes de emitir o documento.</p></div>
 {section!=="orders"&&!boxReview.reviewed&&<div className="next-task"><div><h3>{boxReview.changed?"Confira novamente os volumes":"Primeiro, confira os produtos e monte as caixas"}</h3><p>Na expedição, confira os produtos, monte as caixas e confirme os volumes prontos. Os dados serão aproveitados aqui.</p></div><button className="button primary" disabled={pending} onClick={()=>onOpenOrder(resolved)}>Abrir expedição</button></div>}
 {section==="boxes"&&boxReview.reviewed&&<><button className="text-action" onClick={()=>onOpenOrder(resolved)}>Corrigir caixas na expedição</button><ShipmentEditor mode="documents" value={value} ops={ops} disabled={disabled} onChange={shipment=>onChange(resolved,shipment)}/></>}
 {section==="document"&&boxReview.reviewed&&!value?.packingExcluido&&<PackingEditor onBoxes={()=>go("boxes")} value={value??emptyShipment()} ops={ops} disabled={disabled} canExport={canExport} onChange={packing=>onChange(resolved,{...(value??emptyShipment()),packing})}/>}
 <div className="flow-actions flow-next">{section!=="orders"&&<button className="button" onClick={()=>go(section==="document"?"boxes":"orders")}>Voltar uma etapa</button>}{section!=="document"&&(section==="orders"||boxReview.reviewed)&&<button className="button" disabled={pending||disabled||!canExport} onClick={()=>go(section==="orders"?"boxes":"document")}>{section==="orders"?"Continuar":"Revisar documento e PDF"}</button>}{section==="document"&&<button className="button" onClick={()=>go("boxes")}>Dados dos itens e rastreio</button>}</div>
 </div>:<>
 <div className="flow-actions">{creating&&<button className="button" onClick={()=>{setCreating(false);setSearch("")}}>Ver envios existentes</button>}<button className="button" onClick={onHelp}>Tutorial de packing lists</button></div>
 <label className="search packing-workspace-search"><input aria-label="Buscar packing lists ou pedidos" placeholder="Buscar pedido, cliente ou invoice…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 <h3>{creating?"Escolha o primeiro pedido":"Documentos e envios existentes"}</h3>
 {creating&&<p className="document-help">Comece por um pedido. Na próxima etapa, selecione os demais e confirme o destinatário. Documentos excluídos podem ser recriados aqui com as caixas preservadas. Os demais envios ficam na lista de documentos existentes.</p>}
 <div className="packing-document-list">{entries.map(g=>{
 const shipment=board.details[g.id]?.envio;const ids=shipment?.agrupamento?.pedidos??[g.codigo];
 return <div className="packing-document-entry" key={g.id}><button className="packing-document-card" onClick={()=>open(g.id)}><FileText size={22}/><span><strong>{shipment?.packing?.invoiceNumero||g.codigo}</strong><span>{shipment?.agrupamento?.titularNome||g.cliente||"Cliente aguardando consulta"}</span><small>{ids.join(", ")} · {shipment?.caixas.length??0} volumes externos{shipment?.caixasEmMontagem?.length?" · "+shipment.caixasEmMontagem.length+" embalagens em preparo":""}</small></span><span>{creating?(shipment?.packingExcluido?"Recriar · caixas preservadas":"Selecionar"):packingDeletionReason(board,g.id)?"Finalizado":"Abrir"}</span></button>{!creating&&!packingDeletionReason(board,g.id)&&<button className="text-action packing-delete" data-packing-delete={g.id} aria-label={"Excluir packing list "+(shipment?.packing?.invoiceNumero||g.codigo)} disabled={disabled||!canExport||!!deleting} onClick={()=>void remove(g.id)}><Trash2 size={14}/>{deleting===g.id?"Excluindo…":"Excluir"}</button>}</div>
 })}</div>
 {!entries.length&&<p className="packing-empty">{creating?"Nenhum pedido disponível para esta busca.":"Nenhum envio encontrado. Use Novo packing list para começar."}</p>}
 </>}
 </section>
}
