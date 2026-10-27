"use client";
import ProductIdentity from "./product-identity";
import {AlertCircle} from "lucide-react";
import {quantityDifference,quantityText,type QuantityOP} from "../lib/production-quantity.mjs";
type OP=QuantityOP&{sku?:string;nome:string;produto:string;unidade:string};
export default function ProductionQuantities({ops}:{ops:OP[]}){
 const changed=ops.filter(o=>quantityDifference(o).changed);if(!changed.length)return null;
 return <section className="production-quantities" aria-label="Mudanças nas quantidades das OPs"><h3><AlertCircle size={17}/>Quantidades alteradas no Nomus</h3><div className="change-table-wrap"><table><thead><tr><th>OP / produto</th><th>Programada</th><th>Atual na OP</th><th>Diferença</th></tr></thead><tbody>{changed.map(o=>{const q=quantityDifference(o);return <tr key={o.id}><th>{o.nome}<ProductIdentity sku={o.sku} name={o.produto}/></th><td>{quantityText(q.programmed)} {o.unidade}</td><td>{quantityText(q.current)} {o.unidade}</td><td>{q.reduced?"Faltam ":"A mais: "}<strong>{quantityText(Math.abs(q.difference!))} {o.unidade}</strong></td></tr>})}</tbody></table></div><p className="check-help">Programada é a primeira quantidade conhecida pelo painel. Atual na OP acompanha o campo quantidade do Nomus, usado pela equipe para registrar o produzido. A diferença permanece visível após marcar o aviso como visto.</p>{changed.some(o=>o.quantidadeAlteradaEm)&&<details><summary>Ver a última alteração de cada OP</summary>{changed.filter(o=>o.quantidadeAlteradaEm).map(o=><p className="check-help" key={o.id}>{o.nome}: {o.quantidadeAnterior} → {o.quantidade} {o.unidade} · detectada em {new Date(o.quantidadeAlteradaEm!).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})}</p>)}</details>}</section>;
}
