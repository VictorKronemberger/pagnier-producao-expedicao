"use client";
import archiveStyles from "./archive.module.css";
import {useEffect,useRef,useState} from "react";
import {Archive,ArchiveRestore,X} from "lucide-react";
export default function ArchiveDialog({order,restoring,onClose,onConfirm}:{order:{id:string;codigo:string;cliente:string;pedidoConsultaFalhou?:boolean};restoring:boolean;onClose:()=>void;onConfirm:(options:{archived:boolean;reason:string;note:string;confirmedDeleted:boolean})=>Promise<void>}){
 const cancelButton=useRef<HTMLButtonElement>(null);
 const dialog=useRef<HTMLDialogElement>(null),[reason,setReason]=useState("manual"),[note,setNote]=useState(""),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{const el=dialog.current;el?.showModal();cancelButton.current?.focus();return()=>el?.close()},[]);
 async function submit(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError("");try{await onConfirm({archived:!restoring,reason,note,confirmedDeleted:confirmed});onClose()}catch(e){setError(e instanceof Error?e.message:"Não foi possível confirmar.")}finally{setBusy(false)}}
 return <dialog ref={dialog} className={"archive-dialog "+archiveStyles.dialog} aria-labelledby="archive-title" onCancel={e=>{e.preventDefault();if(!busy)onClose()}}><form onSubmit={submit}>
 <header><span className={"archive-dialog-icon "+archiveStyles.dialogIcon}>{restoring?<ArchiveRestore size={22}/>:<Archive size={22}/>}</span><div><h2 id="archive-title">{restoring?"Restaurar pedido?":"Arquivar este pedido?"}</h2><p>{order.codigo} · {order.cliente||"Cliente não identificado"}</p></div><button type="button" className="icon-button" disabled={busy} aria-label="Fechar confirmação" onClick={onClose}><X size={18}/></button></header>
 <p>{restoring?"O pedido voltará aos ativos, mantendo a etapa e os dados registrados. Isso não recria um pedido excluído no Nomus.":"O pedido sairá da fila ativa para todos e ficará disponível em Arquivados. Você poderá restaurá-lo depois."}</p>
 <div className={"archive-preserved "+archiveStyles.preserved}>Produção, observações, caixas, packing lists e invoices serão preservados. O Nomus não será alterado.</div>
 {!restoring&&<><label>Motivo<select aria-label="Motivo do arquivamento" value={reason} disabled={busy} onChange={e=>{setReason(e.target.value);setConfirmed(false)}}><option value="manual">Retirar da fila e guardar histórico</option><option value="nomus_deleted">Pedido excluído no Nomus</option></select></label>
 {order.pedidoConsultaFalhou&&<p className={"archive-warning "+archiveStyles.warning}>O pedido está aguardando confirmação no Nomus. Uma consulta sem resultado não comprova exclusão.</p>}
 {reason==="nomus_deleted"&&<label className={"archive-check "+archiveStyles.check}><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/>Conferi no Nomus e confirmo que este pedido foi excluído.</label>}
 <label>Observação (opcional)<textarea aria-label="Observação do arquivamento" value={note} onChange={e=>setNote(e.target.value)} maxLength={500} rows={2} disabled={busy}/></label></>}
 {error&&<p className="dialog-error" role="alert">{error}</p>}
 <footer><button type="button" className="button" ref={cancelButton} autoFocus disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="button primary" disabled={busy||!restoring&&reason==="nomus_deleted"&&!confirmed}>{busy?"Salvando…":restoring?"Restaurar pedido":"Confirmar arquivamento"}</button></footer>
 </form></dialog>
}
