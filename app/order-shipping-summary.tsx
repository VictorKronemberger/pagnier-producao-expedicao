"use client";
import {Package,FileText,ArrowRight} from "lucide-react";
import type {Shipment} from "../lib/shipping.mjs";
export default function OrderShippingSummary({shipment,orderIds,reviewed,onExpedition,onPacking,onInvoice}:{shipment?:Shipment;orderIds:string[];reviewed:boolean;onExpedition:()=>void;onPacking:()=>void;onInvoice:()=>void}){
 return <section className="order-shipping-summary">
 <p className="check-help">1. Conferir produtos → 2. Montar caixas → 3. Preparar documentos</p>
 {orderIds.length>1&&<p className="group-notice">Envio compartilhado entre {orderIds.join(", ")}. As caixas são as mesmas em todos os pedidos.</p>}
 {!reviewed?<div className="next-task"><div><h3>{shipment?.caixasEmMontagem?.length?"Continue a montagem das embalagens":shipment?.caixas.length?"Confira as caixas antes dos documentos":"Comece pela conferência dos produtos"}</h3><p>{shipment?.caixas.length??0} caixa(s) maior(es) e {shipment?.caixasEmMontagem?.length??0} embalagem(ns) aguardando acomodação. Acomode as embalagens pendentes ou adicione os produtos direto nas caixas maiores. Confira os volumes para liberar a documentação.</p></div><button className="button primary" onClick={onExpedition}><Package size={17}/>Ir para expedição<ArrowRight size={16}/></button></div>:<>
 <div className="next-task"><div><h3>Caixas conferidas. Prepare a documentação.</h3><p>{shipment?.caixas.length} caixa(s) · Conferência: {shipment?.conferenciaPor}. Quantidades e pesos já estão preenchidos.</p></div><button className="button primary packing-shortcut" onClick={onPacking}><FileText size={17}/>Preparar packing list<ArrowRight size={16}/></button></div>
 <div className="direct-invoice-link"><div><strong>Envio direto por FedEx ou DHL?</strong><p>Prepare uma invoice somente para este pedido.</p></div><button className="button" onClick={onInvoice}><FileText size={16}/>Abrir invoice</button></div>
 <button className="text-action" onClick={onExpedition}>Rever caixas na expedição</button></>}
 </section>
}
