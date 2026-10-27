import {inspectPacking,weightText} from "./packing-list.mjs";
const YELLOW="#edf4ef";
const brDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)?v.split("-").reverse().join("/"):"";
const label=t=>({text:t,fillColor:YELLOW,fontSize:7});
const part=(title,text)=>({table:{widths:["*"],body:[[label(title)],[{text:text||" ",margin:[2,2,2,4]}]]},layout:{hLineWidth:()=>0.4,vLineWidth:()=>0.4,paddingTop:()=>1,paddingBottom:()=>1}});
const textJoin=(...v)=>v.filter(Boolean).join("\n");
export function packingDefinition(shipment,ops,{draft=false,orderCode=""}={}){
 const report=inspectPacking(shipment,ops);if(!draft&&report.issues.length)throw Error("Revise as pendências antes de gerar o packing list.");
 const {packing:p,boxes,totalNet,totalGross,totalUnits}=report;
 const headers=["Box","Description of Goods","HS Code","Kind of Pkgs","Quantity (packages)","Unit net wt. (kg)","Net wt. (kg)"];
 const body=[headers.map(t=>({...label(t),alignment:"center",bold:true}))];
 for(const b of boxes){
 body.push([{text:"BOX "+b.codigo+" | "+[b.comprimentoCm||"?",b.larguraCm||"?",b.alturaCm||"?"].join(" x ")+" cm | Net: "+weightText(b.net)+" kg | Gross: "+weightText(b.gross)+" kg | Units: "+b.units+(b.lacre?" | Seal: "+b.lacre:"")+(b.observacoes?" | "+b.observacoes:""),colSpan:7,bold:true,fillColor:YELLOW},{},{},{},{},{},{}]);
 if(!b.rows.length){body.push([{text:"Contents not provided",colSpan:7},{},{},{},{},{},{}]);continue}
 b.rows.forEach(r=>body.push([{text:""},{stack:[...(r.sku?[{text:r.sku,bold:true}]:[]),{text:r.descricaoDocumento||r.produto}]},{text:r.hsCode||""},{text:r.tipoEmbalagem||"",alignment:"center"},{text:r.units?String(r.units):"",alignment:"right"},{text:weightText(r.unitWeight),alignment:"right"},{text:weightText(r.net),alignment:"right"}]));
 }
 if(body.length===1)body.push([{text:"No boxes registered",colSpan:7},{},{},{},{},{},{}]);
 const layout={hLineWidth:()=>0.4,vLineWidth:()=>0.4,hLineColor:()=>"#333333",vLineColor:()=>"#333333",paddingLeft:()=>3,paddingRight:()=>3,paddingTop:()=>4,paddingBottom:()=>4};
 const document={
 pageSize:"A4",pageMargins:[18,34,18,35],defaultStyle:{font:"Roboto",fontSize:7.5,color:"#111111",lineHeight:1.08},
 info:{title:"Packing list "+p.invoiceNumero,author:p.exportadorNome,subject:orderCode},
 footer:(page,pages)=>({text:"Página "+page+" de "+pages,alignment:"center",fontSize:7,margin:[18,12,18,0]}),
 content:[
 {table:{widths:["*"],body:[[{text:"PACKINGLIST"+(draft?" — RASCUNHO / DRAFT":""),bold:true,alignment:"center",fillColor:YELLOW,fontSize:10}]]},layout},
 {columns:[
 {width:"51%",stack:[
 part("Exporter",textJoin(p.exportadorNome,p.exportadorEndereco)),
 part("Buyer / Importer",textJoin(p.compradorNome,p.compradorEndereco,p.compradorRegistro,p.compradorContato)||"Not provided"),
 part("Delivery Address / Consignee",textJoin(p.destinatarioNome,p.destinatarioRegistro,p.destinatarioEndereco,p.contatoNome?"Contact name: "+p.contatoNome:"",p.contatoTelefone?"TEL.: "+p.contatoTelefone:"",p.contatoFax?"FAX.: "+p.contatoFax:"",p.contatoEmail?"Email: "+p.contatoEmail:"")),
 {columns:[part("Pre-Carriage by",p.preTransporte),part("Place of Receipt by pre-carrier",p.localRecebimento)],columnGap:0},
 {columns:[part("Vessel / Flight No.",p.vooNavio),part("Port of Loading",p.portoEmbarque)],columnGap:0},
 {columns:[part("Port of Discharge",p.portoDesembarque),part("Final Destination",p.destinoFinal)],columnGap:0}]},
 {width:"49%",stack:[
 {columns:[part("Invoice No. & Date",textJoin(p.invoiceNumero,brDate(p.invoiceData))),part("Exporter's Ref.",p.exportadorRef)],columnGap:0},
 part("Buyer's Order No. & Date",p.pedidoComprador),
 part("Other Reference(s)",textJoin(p.outrasReferencias,shipment.agrupamento?"Sales orders: "+shipment.agrupamento.pedidos.join(", "):"")),
 {columns:[part("Country of Origin of Goods",p.paisOrigem),part("Country of Final Destination",p.paisDestino)],columnGap:0},
 part("Terms of Delivery and Payment",textJoin("Incoterm: "+(p.termosEntrega||""),"Terms of payment: "+(p.termosPagamento||"")))]}],columnGap:0,margin:[0,0,0,8]},

 {table:{widths:["*","*","*","*"],body:[
 [label("No. of Boxes"),label("No. of Pcs"),label("Net Weight kg"),label("Gross Weight kg")],
 [{text:String(boxes.length),bold:true},{text:String(totalUnits),bold:true},{text:weightText(totalNet),bold:true},{text:weightText(totalGross),bold:true}]
 ]},layout,margin:[0,0,0,8]},
 {table:{headerRows:1,widths:[24,"*",37,37,38,42,42],body,dontBreakRows:true},layout},
 ...(p.pallets?[{text:"No. of pallets: "+p.pallets,margin:[0,6,0,0]}]:[]),
 {text:"Signature & Date: __________________________________",margin:[0,10,0,0]},
 ...(shipment.transportadora?[{text:shipment.transportadora,alignment:"right",margin:[0,4,0,0]}]:[]),
 ...(draft&&report.issues.length?[{text:"RASCUNHO — pendências para revisão",bold:true,margin:[0,12,0,5]},{ul:report.issues,fontSize:8}]:[])
 ]};
 if(draft)document.watermark={text:"RASCUNHO",color:"#888888",opacity:0.12,bold:true,angle:-40};
 return document;
}
export async function packingBlob(shipment,ops,options={}){
 const [pdfModule,fontModule]=await Promise.all([import("pdfmake/build/pdfmake.js"),import("pdfmake/build/vfs_fonts.js")]);
 const pdf=pdfModule.default??pdfModule;pdf.addVirtualFileSystem(fontModule.default??fontModule);
 pdf.setUrlAccessPolicy?.(()=>false);
 return pdf.createPdf(packingDefinition(shipment,ops,options)).getBlob();
}
