import {inspectInvoice} from "./invoice.mjs";
import {partyText} from "./invoice-pdf.mjs";
export async function invoiceWorkbook(value){
 const mod=await import("exceljs"),Excel=mod.default??mod;const workbook=new Excel.Workbook();workbook.creator="Pagnier";workbook.calcProperties.fullCalcOnLoad=true;
 const r=inspectInvoice(value),v=r.invoice,fedex=v.carrier==="FedEx",color=fedex?"FF803BBC":"FF111111";
 const ws=workbook.addWorksheet("Invoice "+v.carrier,{pageSetup:{paperSize:9,orientation:"portrait",fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:0.25,right:0.25,top:0.35,bottom:0.35,header:0.15,footer:0.15}}});
 ws.columns=[{width:13},{width:38},{width:18},{width:18},{width:15},{width:14},{width:16},{width:14},{width:16},{width:18}];
 function merged(row,start,end,text,band=false){ws.mergeCells(row,start,row,end);const c=ws.getCell(row,start);c.value=text;c.alignment={vertical:"middle",wrapText:true};if(band){c.fill={type:"pattern",pattern:"solid",fgColor:{argb:color}};c.font={bold:true,color:{argb:"FFFFFFFF"}}}return c}
 merged(1,1,10,"COMMERCIAL INVOICE — "+v.carrier,true);ws.getRow(1).height=26;
 merged(2,1,5,"Invoice: "+v.number);merged(2,6,10,"Date: "+v.date);
 merged(3,1,5,"Air waybill: "+v.waybill);merged(3,6,10,"Export date: "+v.exportDate);
 merged(4,1,10,"Orders: "+v.orderIds.join(", "));ws.getRow(4).height=30;
 merged(5,1,5,"SHIPPER / REMETENTE",true);merged(5,6,10,"CONSIGNEE / DESTINATÁRIO",true);
 merged(6,1,5,partyText(v.shipper));merged(6,6,10,partyText(v.consignee));ws.getRow(6).height=135;
 merged(7,1,5,"IMPORTER / BUYER (if different)",true);merged(7,6,10,"EXPORT DETAILS",true);
 merged(8,1,5,partyText(v.buyer));merged(8,6,10,["Export references: "+v.exportReferences,"Passport: "+v.passport,"Country of export: "+v.countryExport,"Country of manufacture: "+v.countryManufacture,"Final destination: "+v.countryDestination,"Currency: "+v.currency].join("\n"));ws.getRow(8).height=115;
 merged(9,1,10,"Editable workbook / Planilha editável — valores e fórmulas podem ser alterados. Revise antes de enviar.");ws.getRow(9).height=24;
 const header=fedex?["Marks / No.","Full description of goods","HS Code / Part number","Packaging / Packages","Qty","Unit","Unit weight kg","Unit value","Line weight kg","Total value"]:["Part number","Full description of goods","HS Code","Marks / Packaging","Total items","Unit","Unit weight kg","Unit value","Line weight kg","Total value"];
 ws.getRow(10).values=header;ws.getRow(10).height=32;
 ws.getRow(10).eachCell(c=>{c.font={bold:true,color:{argb:"FFFFFFFF"}};c.fill={type:"pattern",pattern:"solid",fgColor:{argb:color}};c.alignment={wrapText:true,vertical:"middle"}});
 let row=11;
 for(const item of r.rows){
 const num=t=>t===""?null:Number(t.replace(",","."));
 ws.getRow(row).values=[fedex?item.marks:item.partNumber,item.description,fedex?[item.hsCode,item.partNumber].filter(Boolean).join(" / "):item.hsCode,fedex?[item.packaging,item.packages].filter(Boolean).join(" / "):[item.marks,item.packaging].filter(Boolean).join(" / "),num(item.quantity),item.unit,num(item.unitWeightKg),num(item.unitValue),{formula:`IF(OR(E${row}="",G${row}=""),"",ROUND(E${row}*G${row},3))`,result:item.weight===null?"":Number(item.weight)/1000},{formula:`IF(OR(E${row}="",H${row}=""),"",ROUND(E${row}*H${row},2))`,result:item.amount===null?"":Number(item.amount)/100}];
 ws.getRow(row).height=Math.max(34,Math.ceil(item.description.length/45)*13);for(const col of [5,7,9])ws.getCell(row,col).numFmt="0.000";for(const col of [8,10])ws.getCell(row,col).numFmt="#,##0.00";row++;
 }
 if(row===11){ws.getRow(row).values=["","Adicione itens no painel antes da emissão"];row++}
 const end=row-1,subtotalRow=row,freightRow=row+1,totalRow=row+2;
 merged(row,1,8,"PRODUCT TOTAL / SUBTOTAL "+v.currency);ws.getCell(row,9).value={formula:`SUM(I11:I${end})`,result:Number(r.weight)/1000};ws.getCell(row,10).value={formula:`SUM(J11:J${end})`,result:Number(r.subtotal)/100};row++;
 merged(row,1,9,"FREIGHT / FRETE "+v.currency);ws.getCell(row,10).value=v.freight?Number(v.freight.replace(",",".")):0;row++;
 merged(row,1,9,"TOTAL "+v.currency,true);ws.getCell(row,10).value={formula:`J${subtotalRow}+J${freightRow}`,result:Number(r.total)/100};row++;
 merged(row++,1,10,"Total packages / Volumes: "+v.packagesTotal);
 merged(row++,1,10,"Notes: "+v.notes);ws.getRow(row-1).height=40;
 merged(row++,1,10,"I declare this information to be true and correct. Country of manufacture: "+v.countryManufacture);ws.getRow(row-1).height=32;
 merged(row++,1,5,"Name: "+v.signerName);merged(row-1,6,10,"Title: "+v.signerTitle);
 merged(row++,1,5,"Place: "+v.location);merged(row-1,6,10,"Date: "+v.signatureDate);
 merged(row++,1,5,"ID: "+v.signerId);merged(row-1,6,10,"Signature: __________________________");
 ws.eachRow(r=>r.eachCell({includeEmpty:true},c=>{c.alignment={...c.alignment,vertical:"middle",wrapText:true};c.border={top:{style:"thin",color:{argb:"FFD1D5DB"}},bottom:{style:"thin",color:{argb:"FFD1D5DB"}},left:{style:"thin",color:{argb:"FFD1D5DB"}},right:{style:"thin",color:{argb:"FFD1D5DB"}}};}));
 for(let n=subtotalRow;n<=totalRow;n++)ws.getCell(n,10).numFmt="#,##0.00";ws.getCell(subtotalRow,9).numFmt="0.000";
 ws.views=[{state:"frozen",ySplit:10}];ws.pageSetup.printArea=`A1:J${row-1}`;ws.pageSetup.printTitlesRow="10:10";ws.headerFooter.oddFooter="&CPage &P of &N";
 const guide=workbook.addWorksheet("Guia e pendências");guide.columns=[{width:110}];
 const guideLines=["INVOICE "+v.carrier+" — GUIA DA PLANILHA","Edite texto e valores na aba Invoice. Quantidade, peso unitário, valor unitário e frete são editáveis.","As colunas I e J calculam peso e valor por linha; os totais somam linhas e frete. Ao inserir linhas, ajuste os intervalos de soma.","Alterações no Excel não voltam automaticamente ao painel. Para um PDF com essas alterações, exporte pelo Excel ou repita as alterações no painel.","O arquivo é uma cópia editável. Confirme destinatário, preços, classificação fiscal, volumes e declaração antes de enviar.","Nenhuma assinatura é reproduzida. A exclusão da empresa Medicina Sagrada permanece no painel.",...r.issues.map(t=>"PENDÊNCIA: "+t)];
 guideLines.forEach(t=>{const row=guide.addRow([t]);row.height=45;row.alignment={wrapText:true,vertical:"middle"}});return workbook;
}
export async function invoiceExcelBlob(value){const workbook=await invoiceWorkbook(value),buffer=await workbook.xlsx.writeBuffer();return new Blob([buffer],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})}
