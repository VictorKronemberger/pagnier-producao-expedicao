import {inspectInvoice,fixedText} from "./invoice.mjs";
const date=v=>v?v.split("-").reverse().join("/"):"";
const join=(...v)=>v.filter(Boolean).join("\n");
export const partyText=p=>join(p.company,p.taxId?"Tax ID / CNPJ: "+p.taxId:"",p.stateReg?"I.E. / R.G.: "+p.stateReg:"",p.address,[p.city,p.state,p.zip].filter(Boolean).join(" · "),p.country,p.phone?"Phone: "+p.phone:"",p.email,p.contact?"Contact: "+p.contact:"",p.department?"Dept.: "+p.department:"");
export function invoiceDefinition(value,{draft=false}={}){
 const r=inspectInvoice(value),v=r.invoice;if(!draft&&r.issues.length)throw Error("Revise as pendências antes de gerar a invoice final.");
 const fedex=v.carrier==="FedEx",accent=fedex?"#803BBC":"#111111";
 const label=t=>({text:t,bold:true,color:"white",fillColor:accent,fontSize:7.5});
 const table=(widths,body,headerRows=0)=>({table:{widths,body,headerRows},layout:{hLineWidth:()=>0.4,vLineWidth:()=>0.4,paddingLeft:()=>4,paddingRight:()=>4,paddingTop:()=>4,paddingBottom:()=>4}});
 const party=(title,p)=>table(["*"],[[label(title)],[{text:partyText(p)||" ",margin:[0,3,0,5]}]]);
 const headers=fedex?["Marks / No.","Packages","Packaging","Full description of goods","Qty","Unit","Unit weight kg","Unit value "+v.currency,"Total "+v.currency]:["Full description of goods","Part number","Unit weight (kg)","Total items","Unit","Unit value "+v.currency,"Total value "+v.currency];
 const body=[headers.map(label)];
 for(const item of r.rows){const desc=join(item.description,item.hsCode?"HS CODE: "+item.hsCode:"",fedex&&item.partNumber?"Part number: "+item.partNumber:"");body.push((fedex?[item.marks,item.packages,item.packaging,desc,item.quantity,item.unit,item.unitWeightKg,item.unitValue,fixedText(item.amount)]:[desc,item.partNumber,item.unitWeightKg,item.quantity,item.unit,item.unitValue,fixedText(item.amount)]).map((text,i)=>({text:text||"—",alignment:i>=(fedex?4:2)?"right":"left"})))}
 if(!r.rows.length)body.push([{text:"No items / Sem itens",colSpan:headers.length},...Array.from({length:headers.length-1},()=>({}))]);
 const declaration=fedex?"I declare all the information contained in this invoice to be true and correct.\nDeclaro serem verdadeiras e corretas as informações contidas nesta fatura.":"We hereby declare that the above information is correct and true to the best of our knowledge.\nCountry of manufacture / País de fabricação: "+(v.countryManufacture||"________________");
 return {pageSize:"A4",pageMargins:[24,28,24,32],defaultStyle:{font:"Roboto",fontSize:8,color:"#111111"},info:{title:"Commercial invoice "+v.carrier+" "+v.number,author:v.shipper.company},footer:(page,pages)=>({text:v.carrier+" · "+v.number+" · Page "+page+" / "+pages,alignment:"center",fontSize:7,margin:[24,10,24,0]}),...(draft?{watermark:{text:"DRAFT / RASCUNHO",color:"#888888",opacity:0.12,angle:-35}}:{}),content:[
 table(["*"],[[{text:"COMMERCIAL INVOICE"+(fedex?" — FATURA COMERCIAL":"")+(draft?" / DRAFT":""),alignment:"center",bold:true,fontSize:12,color:fedex?"white":"#111111",fillColor:fedex?accent:"#ffffff"}]]),
 {text:v.carrier,bold:true,fontSize:19,color:fedex?"#4D148C":"#D40511",fillColor:fedex?"#FFFFFF":"#FFCC00",alignment:"right",margin:[0,6,0,6]},
 table(["*","*"],[["Invoice / Fatura: "+v.number,"Date / Data: "+date(v.date)],["Air waybill / Conhecimento aéreo: "+v.waybill,"Export date / Data de envio: "+date(v.exportDate)],["Export references: "+v.exportReferences,"Orders / Pedidos: "+v.orderIds.join(", ")],...(fedex?[["CNPJ / CPF: "+v.shipper.taxId,"Passport / Passaporte: "+v.passport]]:[])]),
 {columns:[party("SHIPPER / EXPORTER — REMETENTE",v.shipper),party("CONSIGNEE — DESTINATÁRIO",v.consignee)],columnGap:8,margin:[0,8,0,8]},
 {columns:[{width:"*",stack:[table(["*"],[[label("ORIGIN AND DESTINATION / ORIGEM E DESTINO")],["Country of export: "+v.countryExport],["Country of manufacture: "+v.countryManufacture],["Ultimate destination: "+v.countryDestination]])]},{width:"*",stack:[party("IMPORTER / BUYER — SE DIFERENTE DO DESTINATÁRIO",v.buyer)]}],columnGap:8,margin:[0,0,0,10]},
 table(fedex?[33,31,42,"*",29,26,38,47,49]:["*",62,51,46,32,62,64],body,1),
 {columns:[{width:"*",stack:[{text:"Total packages / Volumes: "+v.packagesTotal,margin:[0,8,0,4]},{text:"Total net weight / Peso líquido: "+fixedText(r.weight,3)+" kg"},{text:"Currency / Moeda: "+v.currency,margin:[0,4,0,0]}]},{width:"*",stack:[table(["*",77],[["PRODUCT TOTAL",{text:fixedText(r.subtotal),alignment:"right"}],["FREIGHT / FRETE",{text:fixedText(r.freight),alignment:"right"}],[label("TOTAL "+v.currency),{text:fixedText(r.total),alignment:"right",bold:true}]])]}],columnGap:8,margin:[0,8,0,8]},
 ...(v.notes?[{text:"Notes / Observações: "+v.notes,margin:[0,4,0,8]}]:[]),
 {text:declaration,bold:true,fontSize:8,margin:[0,10,0,8]},
 table(["*","*"],[["Name / Nome: "+v.signerName,"Title / Cargo: "+v.signerTitle],["Place / Local: "+v.location,"Date / Data: "+date(v.signatureDate)],["ID: "+v.signerId,"Signature / Assinatura: __________________________"]]),
 ...(draft&&r.issues.length?[{text:"PENDÊNCIAS DO RASCUNHO",bold:true,margin:[0,12,0,4]},{ul:r.issues}]:[])
 ]};
}
export async function invoicePdfBlob(value,options={}){
 const [pm,fm]=await Promise.all([import("pdfmake/build/pdfmake.js"),import("pdfmake/build/vfs_fonts.js")]);const pdf=pm.default??pm;pdf.addVirtualFileSystem(fm.default??fm);pdf.setUrlAccessPolicy?.(()=>false);return pdf.createPdf(invoiceDefinition(value,options)).getBlob();
}
