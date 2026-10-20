"use client";
import {Archive,ArchiveRestore} from "lucide-react";
import {manualArchiveReasons} from "../lib/order-archive.mjs";
import styles from "./archive.module.css";

export default function ArchiveActions({archived,disabled,catalog=false,onSelect}:{archived:boolean;disabled:boolean;catalog?:boolean;onSelect:(archived:boolean,reason?:string)=>void}){
 return <details className={"order-more-actions "+styles.actions+(catalog?" "+styles.catalogActions:"")}>
  <summary>Outras ações</summary>
  <div className={styles.actionMenu}>
   {archived?<button type="button" disabled={disabled} onClick={()=>onSelect(false)}><ArchiveRestore size={15}/>Restaurar pedido…</button>:<>
    <p className={styles.actionHeading}><Archive size={15}/>Arquivar pedido por:</p>
    {Object.entries(manualArchiveReasons).map(([reason,label])=><button key={reason} type="button" data-archive-reason={reason} aria-label={"Arquivar: "+label} disabled={disabled} onClick={()=>onSelect(true,reason)}>{label}</button>)}
   </>}
  </div>
 </details>;
}
