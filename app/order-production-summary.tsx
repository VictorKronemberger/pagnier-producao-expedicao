import {CheckCircle2,Factory,ArrowRight} from "lucide-react";
import {productionSummary} from "../lib/production-progress.mjs";
import type {ShippingOP} from "../lib/shipping.mjs";
import styles from "./order-status.module.css";
export default function OrderProductionSummary({ops,onConference}:{ops:ShippingOP[];onConference:()=>void}){
 const summary=productionSummary(ops);if(!summary.total)return null;
 const finished=summary.state==="complete",Icon=finished?CheckCircle2:Factory;
 return <section className={styles.production+(finished?" "+styles.complete:"")+" order-production-summary"} aria-label="Resumo da produção" data-production-state={summary.state}>
 <Icon size={20} aria-hidden="true"/><div><strong>{finished?"Produção das OPs concluída":"Produção: "+summary.complete+" de "+summary.total+" OPs concluídas"}</strong><p>{finished?"Todas as OPs deste pedido têm a quantidade produzida completa. Confira a embalagem na Expedição.":"O resumo usa as mesmas quantidades da coluna Produzido na Expedição."}{summary.unconfirmed>0&&" "+summary.unconfirmed+" OP(s) ainda sem quantidade ou meta confirmada."}</p><button type="button" onClick={onConference}>Conferir produtos na Expedição<ArrowRight size={14} aria-hidden="true"/></button></div>
 </section>;
}
