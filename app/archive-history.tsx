import {archiveEvents,archiveReasons,type ArchiveRecord} from "../lib/order-archive.mjs";
import styles from "./archive.module.css";
const format=(value?:string)=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo",dateStyle:"short",timeStyle:"short"}):"Data não registrada";
export default function ArchiveHistory({record,archived=false}:{record?:ArchiveRecord;archived?:boolean}){
 const events=archiveEvents(record,archived);if(!events.length)return null;
 return <details className={"archive-events "+styles.events}><summary>Histórico de arquivamento ({events.length})</summary><ol>{[...events].reverse().map((event,index)=><li key={index}>
 <strong>{event.acao==="restaurar"?"Restaurado":"Arquivado"}{event.acao==="arquivar"?" · "+(archiveReasons[event.motivo??""]??archiveReasons.unknown):""}</strong>
 <small>{format(event.em)} · {event.por||"Responsável não registrado"}{event.automatico?" · registro automático anterior":""}</small>
 {event.observacao&&<p>{event.observacao}</p>}
 </li>)}</ol></details>;
}
