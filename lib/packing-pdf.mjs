import {inspectPacking,weightText} from "./packing-list.mjs";
const YELLOW="#ffff00";
const brDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)?v.split("-").reverse().join("/"):"";
const label=t=>({text:t,fillColor:YELLOW,fontSize:7});
const part=(title,text)=>({table:{widths:["*"],body:[[label(title)],[{text:text||" ",margin:[2,2,2,4]}]]},layout:{hLineWidth:()=>0.4,vLineWidth:()=>0.4,paddingTop:()=>1,paddingBottom:()=>1}});
const textJoin=(...v)=>v.filter(Boolean).join("\n");
export function packingDefinition(shipment,ops,{draft=false,orderCode=""}={}){
 const report=inspectPacking(shipment,ops);if(!draft&&report.issues.length)throw Error("Revise as pendências antes de gerar o packing list.");
 const {packing:p,boxes,totalNet,totalGross,totalUnits}=report;
 const headers=["Marks & Nos.\nBOX NO.","Description of Goods","Kind of\nPkgs","NT. WT.\nper Unit (kg)","Quantity","NT. WT.\nline (kg)","Dimensions /\nNet weight per box"];
 const body=[headers.map(t=>({...label(t),alignment:"center",bold:true}))];
 for(const b of boxes){
 if(!b.rows.length){body.push([{text:"BOX "+b.codigo+" — conteúdo não preenchido",colSpan:7,fillColor:YELLOW},{},{},{},{},{},{}]);continue}
 b.rows.forEach((r,index)=>{
 const description=textJoin(r.descricaoDocumento||r.produto,r.sku?"SKU: "+r.sku:"",r.hsCode?"HS CODE: "+r.hsCode:"",r.lote?"Lot: "+r.lote:"",r.validade?"Expiry: "+brDate(r.validade):"");
 body.push([{text:b.codigo,bold:true,alignment:"center"},{text:description}, {text:r.tipoEmbalagem||"—",alignment:"center"},{text:weightText(r.unitWeight),alignment:"right"},{text:r.units?String(r.units):"—",alignment:"right"},{text:weightText(r.net),alignment:"right"},{text:index===0?textJoin([b.comprimentoCm||"?",b.larguraCm||"?",b.alturaCm||"?"].join(" × ")+" cm","Net: "+weightText(b.net)+" kg","Gross: "+weightText(b.gross)+" kg",b.lacre?"Seal: "+b.lacre:""):"Box "+b.codigo+" (cont.)",alignment:"center",bold:index===0}]);
 });
 body.push([{text:" ",colSpan:7,fillColor:YELLOW,fontSize:2},{},{},{},{},{},{}]);
 }
 if(body.length===1)body.push([{text:"Sem caixas cadastradas",colSpan:7},{},{},{},{},{},{}]);
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
 part("Delivery Address / Consignee",textJoin(p.destinatarioNome,p.destinatarioRegistro,p.destinatarioEndereco,p.contatoNome?"Contact name: "+p.contatoNome:"",p.contatoTelefone?"TEL.: "+p.contatoTelefone:"",p.contatoFax?"FAX.: "+p.contatoFax:"",p.contatoEmail?"Email: "+p.contatoEmail:"")),
 {columns:[part("Pre-Carriage by",p.preTransporte),part("Place of Receipt by pre-carrier",p.localRecebimento)],columnGap:0},
 {columns:[part("Vessel / Flight No.",p.vooNavio),part("Port of Loading",p.portoEmbarque)],columnGap:0},
 {columns:[part("Port of Discharge",p.portoDesembarque),part("Final Destination",p.destinoFinal)],columnGap:0}]},
 {width:"49%",stack:[
 {columns:[part("Invoice No. & Date",textJoin(p.invoiceNumero,brDate(p.invoiceData))),part("Exporter's Ref.",p.exportadorRef)],columnGap:0},
 part("Buyer's Order No. & Date",p.pedidoComprador),
 part("Other Reference(s)",textJoin(p.outrasReferencias,shipment.agrupamento?"Sales orders: "+shipment.agrupamento.pedidos.join(", "):"")),
 part("Buyer (if other than consignee)",textJoin(p.compradorNome,p.compradorEndereco,p.compradorRegistro,p.compradorContato)),
 {columns:[part("Country of Origin of Goods",p.paisOrigem),part("Country of Final Destination",p.paisDestino)],columnGap:0},
 part("Terms of Delivery and Payment",textJoin(p.termosEntrega,p.termosPagamento))]}],columnGap:0,margin:[0,0,0,8]},
 {table:{headerRows:1,widths:[37,"*",36,42,33,46,87],body,dontBreakRows:true},layout},
 {table:{widths:[78,90,"*"],body:[
 [label("No. of pallets"),{text:p.pallets||"—"},{text:"Signature & Date",fillColor:YELLOW}],
 [label("No. of Boxes"),{text:String(boxes.length),bold:true},{text:p.assinante,fillColor:YELLOW}],
 [label("No. of Pcs"),{text:totalUnits+" un",bold:true},{text:brDate(p.assinaturaData),fillColor:YELLOW}],
 [label("Net Weight"),{text:weightText(totalNet)+" kg",bold:true},{text:" ",fillColor:YELLOW}],
 [label("Gross Weight"),{text:weightText(totalGross)+" kg",bold:true},{text:"__________________________________",fillColor:YELLOW}]
 ]},layout,margin:[0,8,0,0]},
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
