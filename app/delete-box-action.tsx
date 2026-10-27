"use client";
import {useId,useState} from "react";
import {Trash2} from "lucide-react";
export default function DeleteBoxAction({name,description,onConfirm,label="Excluir caixa"}:{name:string;description:string;label?:string;onConfirm:(confirmation:string)=>boolean}) {
 const [open,setOpen]=useState(false),[confirmation,setConfirmation]=useState("");
 const id=useId();
 if(!open)return <button type="button" className="text-action delete-box-trigger" onClick={()=>{setConfirmation("");setOpen(true)}}><Trash2 size={14}/>{label}</button>;
 return <section className="delete-box-confirmation" aria-label={"Excluir "+name}>
  <strong>Excluir {name}?</strong><p>{description}</p>
  <label htmlFor={id}>Digite <b>EXCLUIR</b> para confirmar</label>
  <input id={id} aria-label={"Confirmação para excluir "+name} value={confirmation} autoComplete="off" spellCheck={false} onChange={event=>setConfirmation(event.target.value)} onKeyDown={event=>{if(event.key==="Enter")event.preventDefault();if(event.key==="Escape"){setOpen(false);setConfirmation("")}}}/>
  <div><button type="button" className="button" onClick={()=>{setOpen(false);setConfirmation("")}}>Cancelar</button><button type="button" className="button delete-box-submit" disabled={confirmation!=="EXCLUIR"} onClick={()=>{if(confirmation==="EXCLUIR"&&onConfirm(confirmation)){setOpen(false);setConfirmation("")}}}><Trash2 size={14}/>Confirmar exclusão</button></div>
 </section>;
}
