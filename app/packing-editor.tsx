"use client";
import ImportantField,{FillingGuide} from "./important-field";
import SectionAction from "./section-action";
import StaffPicker from "./staff-picker";
import {analyzeShipment} from "../lib/shipping.mjs";
import {useEffect,useState} from "react";
import {FileDown,FileText,LoaderCircle,CheckCircle2} from "lucide-react";
import {emptyPacking,packingFields,validDate,type Shipment,type ShippingOP,type Packing} from "../lib/shipping.mjs";
import {inspectPacking,weightText} from "../lib/packing-list.mjs";
import {packingBlob} from "../lib/packing-pdf.mjs";
export default function PackingEditor({value,ops,onChange,canExport,disabled,onBoxes}:{value:Shipment;ops:ShippingOP[];onChange:(p:Packing)=>void;canExport:boolean;disabled:boolean;onBoxes?:()=>void}){
 const p={...emptyPacking(),...value.packing},report=inspectPacking(value,ops),physical=analyzeShipment(value,ops);
 const [reviewed,setReviewed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const fingerprint=JSON.stringify({value,ops});
 useEffect(()=>setReviewed(false),[fingerprint]);
 function field(key:keyof Packing,label:string,type="text",multiline=false){
 const required=["invoiceNumero","invoiceData","exportadorNome","exportadorEndereco","destinatarioNome","destinatarioEndereco","paisOrigem","paisDestino","assinante","assinaturaData"].includes(key);
 if(key==="assinante")return <ImportantField key={key} label={label} value={p[key]}><StaffPicker label={label} value={p[key]} onChange={value=>onChange({...p,[key]:value})}/></ImportantField>;
 const props={"aria-label":label,maxLength:packingFields[key],value:p[key],onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>onChange({...p,[key]:e.target.value})};
 return <ImportantField key={key} label={label} value={p[key]} required={required} valid={type!=="date"||validDate(p[key])} className={multiline?"packing-wide":""}>{multiline?<textarea {...props} rows={3}/>:<input {...props} type={type} inputMode={key==="pallets"?"numeric":undefined}/>}</ImportantField>;
 }
 async function download(draft:boolean){
 if(!draft&&value.agrupamento&&!confirm("Confirmar emissão?\nTitular definido: "+value.agrupamento.titularNome+"\nDestinatário no documento: "+p.destinatarioNome+"\nPedidos: "+value.agrupamento.pedidos.join(", ")+"\nConfira o destinatário e os dados desta versão."))return;
 setBusy(true);setError("");
 try{
 const blob=await packingBlob(structuredClone(value),structuredClone(ops),{draft});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 const name=(p.destinatarioNome+" - "+p.invoiceNumero).replace(/[<>:"/\\|?*\x00-\x1f]/g,"").slice(0,150);
 a.href=url;a.download=(draft?"RASCUNHO - ":"")+"Packinglist - "+(name||"pedido")+".pdf";a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
 }catch{setError("Não foi possível gerar o PDF. Revise os dados e tente novamente.")}finally{setBusy(false)}
 }
 return <section className="packing-document" aria-label="Packing list">
 <div className="shipment-title"><FileText size={20}/><div><h3>Packing list</h3><p>Campos e cálculos do documento de embarque.</p></div></div>
 <fieldset disabled={disabled||busy} className="packing-document-fields">
 <FillingGuide/>
 <details className="packing-header-fields"><SectionAction title="Completar dados do documento" description="Invoice, exportador, destinatário e responsável pela revisão"/>
 <p className="packing-privacy">Endereços, contatos e registros ficam nesta seção e no PDF. O Nomus permanece somente leitura.</p>
 <h4>Referências</h4><div className="shipping-grid">
 {field("invoiceNumero","Número da invoice")}{field("invoiceData","Data da invoice","date")}{field("pedidoComprador","Pedido do comprador / data")}{field("outrasReferencias","Outras referências")}
 </div><h4>Exportador</h4><div className="shipping-grid">
 {field("exportadorNome","Nome do exportador")}{field("exportadorRef","Registro / referência do exportador")}{field("exportadorEndereco","Endereço do exportador","text",true)}
 </div><h4>Destinatário e entrega</h4><div className="shipping-grid">
 {field("destinatarioNome","Nome do destinatário")}{field("destinatarioRegistro","Registros do destinatário (EORI / VAT / outros)","text",true)}{field("destinatarioEndereco","Endereço de entrega","text",true)}
 {field("contatoNome","Contato do destinatário")}{field("contatoTelefone","Telefone do destinatário")}{field("contatoFax","Fax do destinatário")}{field("contatoEmail","E-mail do destinatário","email")}
 </div><details className="packing-buyer"><SectionAction title="Informar comprador diferente do destinatário" description="Opcional"/><div className="shipping-grid">
 {field("compradorNome","Nome do comprador")}{field("compradorEndereco","Endereço do comprador","text",true)}{field("compradorRegistro","Registros do comprador","text",true)}{field("compradorContato","Contato do comprador","text",true)}
 </div></details><h4>Origem, destino e transporte</h4><div className="shipping-grid">
 {field("paisOrigem","País de origem das mercadorias")}{field("paisDestino","País de destino das mercadorias")}
 {field("preTransporte","Pré-transporte")}{field("localRecebimento","Local de recebimento pelo transportador")}
 {field("vooNavio","Navio / voo")}{field("portoEmbarque","Porto / aeroporto de embarque")}{field("portoDesembarque","Porto / aeroporto de desembarque")}{field("destinoFinal","Destino final")}
 {field("termosEntrega","Condições de entrega","text",true)}{field("termosPagamento","Condições de pagamento","text",true)}
 {field("pallets","Número de pallets")}{field("assinante","Responsável pela revisão")}{field("assinaturaData","Data da revisão","date")}
 </div></details>
 </fieldset>
 <div className="packing-totals unified-totals"><div><small>Caixas</small><strong>{report.boxes.length}</strong></div><div><small>Unidades embaladas</small><strong>{report.totalUnits.toLocaleString("pt-BR")}</strong></div><div><small>Líquido calculado</small><strong>{weightText(report.totalNet)} <em>kg</em></strong></div><div><small>Bruto informado</small><strong>{weightText(report.totalGross)} <em>kg</em></strong></div><div><small>Volume externo</small><strong>{physical.volume.toLocaleString("pt-BR",{maximumFractionDigits:6})} <em>m³</em></strong><span>{physical.dimensionCount}/{physical.boxes} caixas com medidas</span></div></div>
 <details className={"packing-review "+(report.issues.length?"has-issues":"")}><summary><CheckCircle2 size={16}/>{report.issues.length?report.issues.length+" pendências para gerar o PDF":"Dados conferidos pelos cálculos do painel"}</summary>
 {report.issues.length>0&&<ul>{report.issues.map(t=><li key={t}>{t}</li>)}</ul>}
 <p>Peso líquido = unidades × peso líquido unitário. Dimensões em cm; pesos em kg, com três casas decimais. Descrições, HS Codes e condições comerciais devem ser confirmados pelo responsável. A assinatura será feita no documento; nenhuma assinatura do modelo é copiada.</p></details>
 {onBoxes&&report.issues.length>0&&<button className="button" onClick={onBoxes}>Revisar dados dos itens</button>}
 <label className="packing-ack"><input type="checkbox" checked={reviewed} disabled={busy||disabled} onChange={e=>setReviewed(e.target.checked)}/><span>Revisei as descrições, os códigos, o cabeçalho e sua correspondência com as caixas conferidas.</span></label>
 <div className="packing-actions"><button type="button" className="button" disabled={busy||disabled} onClick={()=>void download(true)}><FileText size={16}/>Baixar rascunho</button><button type="button" className="button packing-final" disabled={busy||disabled||!canExport||!reviewed||report.issues.length>0} onClick={()=>void download(false)}>{busy?<LoaderCircle size={16} className="spin"/>:<FileDown size={16}/>}Baixar packing list PDF</button></div>
 {!canExport&&<p className="packing-privacy">Aguarde o salvamento para gerar a versão final.</p>}
 {error&&<p className="dialog-error" role="alert">{error}</p>}
 </section>
}
