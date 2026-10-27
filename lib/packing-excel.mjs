import {inspectPacking} from "./packing-list.mjs";
import {decimal,emptyPacking} from "./shipping.mjs";
const green="FF2E6842",kg=v=>v===null?null:Number(v)/1000;
const join=(...v)=>v.filter(Boolean).join("\n");
const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)?v.split("-").reverse().join("/"):v;
const headers=["Caixa","Descri\u00e7\u00e3o documental","HS Code","Tipo de embalagem","Unidades embaladas","Peso unit\u00e1rio kg","Peso l\u00edquido kg"];
function heading(row){row.height=30;row.eachCell({includeEmpty:true},c=>{c.font={name:"Calibri",size:10,bold:true,color:{argb:"FFFFFFFF"}};c.fill={type:"pattern",pattern:"solid",fgColor:{argb:green}};c.alignment={wrapText:true,vertical:"middle"}})}
function style(ws){ws.eachRow(r=>r.eachCell({includeEmpty:true},c=>{c.font={name:"Calibri",size:10,...c.font};c.alignment={vertical:"middle",wrapText:true,...c.alignment};c.border={bottom:{style:"hair",color:{argb:"FFDDE6DE"}}}}));ws.views=[{state:"normal"}];ws.pageSetup={paperSize:9,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:"1:1",margins:{left:.25,right:.25,top:.35,bottom:.35,header:.15,footer:.15}};ws.headerFooter.oddFooter="&CP\u00e1gina &P de &N";ws.pageSetup.printArea=`A1:${ws.getColumn(ws.columnCount).letter}${ws.rowCount}`}
export async function packingWorkbook(shipment,ops){
 const mod=await import("exceljs"),Excel=mod.default??mod,wb=new Excel.Workbook();wb.creator="Pagnier";wb.calcProperties.fullCalcOnLoad=true;
 const report=inspectPacking(shipment,ops),p={...emptyPacking(),...shipment.packing};
 const summary=wb.addWorksheet("Packing list"),items=wb.addWorksheet("Produtos"),boxes=wb.addWorksheet("Caixas"),guide=wb.addWorksheet("Guia e pend\u00eancias");
 items.columns=[{width:19},{width:58},{width:16},{width:18},{width:18},{width:18},{width:18}];heading(items.addRow(headers));
 const ranges=[];
 for(const box of report.boxes){const first=items.rowCount+1;
  for(const item of box.rows){const n=items.rowCount+1;
   items.addRow([box.codigo,item.descricaoDocumento||item.produto,item.hsCode,item.tipoEmbalagem,item.units||null,kg(item.unitWeight),{formula:`IF(OR(E${n}="",F${n}=""),"",ROUND(E${n}*F${n},3))`,result:kg(item.net)??""}]);
   items.getRow(n).height=Math.max(32,Math.ceil((item.descricaoDocumento||item.produto||"").length/52)*14);items.getCell(n,3).numFmt="@";for(const col of [6,7])items.getCell(n,col).numFmt="0.000";
  }
  const last=items.rowCount;ranges.push({first,last,box});
  if(last>first)items.mergeCells(first,1,last,1);
 }
 const itemEnd=items.rowCount;
 boxes.columns=[{width:19},{width:23},{width:18},{width:18},{width:18},{width:18},{width:18},{width:18},{width:18},{width:22},{width:32}];
 heading(boxes.addRow(["Caixa","Modelo","Comprimento cm","Largura cm","Altura cm","Volume m\u00b3","Peso l\u00edquido kg","Peso bruto kg","Unidades","Lacre","Observa\u00e7\u00f5es"]));
 for(const {box,first,last} of ranges){const n=boxes.rowCount+1,v=[box.comprimentoCm,box.larguraCm,box.alturaCm].map(decimal),has=last>=first;
  boxes.addRow([box.codigo,box.modeloNome??"",...v,{formula:`IF(COUNT(C${n}:E${n})<3,"",C${n}*D${n}*E${n}/1000000)`,result:v.every(x=>x!==null)?v.reduce((a,b)=>a*b,1)/1000000:""},{formula:has?`SUM(Produtos!G${first}:G${last})`:"0",result:kg(box.net)},kg(box.gross),{formula:has?`SUM(Produtos!E${first}:E${last})`:"0",result:box.units},box.lacre,box.observacoes]);
  boxes.getRow(n).height=32;for(const col of [3,4,5,7,8])boxes.getCell(n,col).numFmt="0.000";boxes.getCell(n,6).numFmt="0.000000";
 }
 const boxEnd=boxes.rowCount;if(boxEnd>1)boxes.autoFilter={from:{row:1,column:1},to:{row:boxEnd,column:11}};
 summary.columns=items.columns.map(c=>({width:c.width}));
 function full(text){const r=summary.addRow([text]);summary.mergeCells(r.number,1,r.number,7);heading(r);return r}
 function field(label,value){const r=summary.addRow([label,null,value||" "]);summary.mergeCells(r.number,1,r.number,2);summary.mergeCells(r.number,3,r.number,7);r.getCell(1).font={bold:true};r.height=Math.max(24,(String(value??"").split("\n").reduce((n,s)=>n+Math.max(1,Math.ceil(s.length/120)),0))*13+8);return r}
 full("PACKING LIST"+(report.issues.length?" - RASCUNHO":""));
 field("Invoice / data",join(p.invoiceNumero,date(p.invoiceData)));
 field("Exportador",join(p.exportadorNome,p.exportadorEndereco,p.exportadorRef));
 field("Comprador / importador",join(p.compradorNome,p.compradorEndereco,p.compradorRegistro,p.compradorContato)||"N\u00e3o informado");
 field("Destinat\u00e1rio / entrega",join(p.destinatarioNome,p.destinatarioEndereco,p.destinatarioRegistro,p.contatoNome,p.contatoTelefone,p.contatoFax,p.contatoEmail));
 function pair(leftLabel,leftValue,rightLabel,rightValue){
  const labels=summary.addRow([leftLabel,null,null,rightLabel]);const values=summary.addRow([leftValue||" ",null,null,rightValue||" "]);
  for(const r of [labels,values]){summary.mergeCells(r.number,1,r.number,3);summary.mergeCells(r.number,4,r.number,7);r.height=24}
  for(const col of [1,4]){labels.getCell(col).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFFFFF00"}};labels.getCell(col).font={name:"Calibri",size:10,bold:true,color:{argb:"FF111111"}};values.getCell(col).alignment={horizontal:"center",wrapText:true};}
  values.height=Math.max(24,...[leftValue,rightValue].map(v=>String(v??"").split("\n").reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/65)),0)*13+8));
 }
 pair("Country of Origin of Goods",p.paisOrigem,"Country of Final Destination",p.paisDestino);
 const termsTitle=full("Terms of Delivery and Payment");termsTitle.getCell(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFFFFF00"}};termsTitle.getCell(1).font={bold:true,color:{argb:"FF111111"}};
 field("Incoterm",p.termosEntrega);field("Terms of payment",p.termosPagamento);
 pair("Pre-Carriage by",p.preTransporte,"Place of Receipt by pre-carrier",p.localRecebimento);
 pair("Vessel/Flight No.",p.vooNavio,"Port of Loading",p.portoEmbarque);
 pair("Port of Discharge",p.portoDesembarque,"Final Destination",p.destinoFinal);
 const references=join(p.pedidoComprador,p.outrasReferencias,shipment.agrupamento?.pedidos.join(", "));if(references)field("Refer\u00eancias",references);
 if(shipment.transportadora)field("Transportadora",shipment.transportadora);
 const totalHeader=summary.addRow(["TOTAL DE CAIXAS",null,"TOTAL UNIDADES",null,"PESO L\u00cdQUIDO kg",null,"PESO BRUTO kg"]);
 const totals=summary.addRow([report.boxes.length,null,{formula:itemEnd>1?`SUM(Produtos!E2:E${itemEnd})`:"0",result:report.totalUnits},null,{formula:itemEnd>1?`SUM(Produtos!G2:G${itemEnd})`:"0",result:kg(report.totalNet)},null,{formula:boxEnd>1?`SUM(Caixas!H2:H${boxEnd})`:"0",result:kg(report.totalGross)}]);
 for(const r of [totalHeader,totals]){for(const col of [1,3,5])summary.mergeCells(r.number,col,r.number,col+1);r.height=27}heading(totalHeader);totals.getCell(5).numFmt=totals.getCell(7).numFmt="0.000";
 if(p.pallets)field("Pallets",p.pallets);
 full("PRODUTOS POR CAIXA");
 for(const {first,last,box} of ranges){const boxRow=ranges.findIndex(r=>r.box===box)+2;
  const title=full("CAIXA "+box.codigo);title.getCell(1).value={formula:`"CAIXA "&Caixas!A${boxRow}`,result:"CAIXA "+box.codigo};
  const dimensions=[box.comprimentoCm,box.larguraCm,box.alturaCm].join(" x ");
  const info=summary.addRow([
   {formula:`"Dimensions (cm): "&Caixas!C${boxRow}&" x "&Caixas!D${boxRow}&" x "&Caixas!E${boxRow}`,result:"Dimensions (cm): "+dimensions},null,
   {formula:`"Net weight (kg): "&TEXT(Caixas!G${boxRow},"0.000")`,result:"Net weight (kg): "+kg(box.net).toFixed(3)},null,
   {formula:`IF(Caixas!H${boxRow}="","Gross weight (kg): ","Gross weight (kg): "&TEXT(Caixas!H${boxRow},"0.000"))`,result:"Gross weight (kg): "+(box.gross===null?"":kg(box.gross).toFixed(3))},null,
   {formula:`"Units: "&Caixas!I${boxRow}`,result:"Units: "+box.units}]);
  for(const col of [1,3,5])summary.mergeCells(info.number,col,info.number,col+1);info.height=32;
  if(box.lacre||box.observacoes)field("Lacre / observa\u00e7\u00f5es",join(box.lacre,box.observacoes));
  heading(summary.addRow(headers));const start=summary.rowCount+1;
  for(let source=first;source<=last;source++){const r=summary.addRow([]);for(let col=1;col<=7;col++){const from=items.getCell(source,col),ref=col===1?items.getCell(first,1).address:from.address;r.getCell(col).value={formula:`IF(Produtos!${ref}="","",Produtos!${ref})`,result:from.type===Excel.ValueType.Formula?from.result:from.value??""};r.getCell(col).numFmt=from.numFmt||"General"}r.height=items.getRow(source).height}
  if(summary.rowCount>start)summary.mergeCells(start,1,summary.rowCount,1);
 }
 if(itemEnd===1)field("Produtos","Sem itens cadastrados");
 guide.columns=[{width:120}];heading(guide.addRow(["COMO USAR ESTA PLANILHA"]));
 for(const line of ["A aba Packing list re\u00fane exportador, comprador/importador, destinat\u00e1rio, totais, produtos e caixas. Em documentos longos a impress\u00e3o continua nas p\u00e1ginas seguintes.","Edite os dados de cabe\u00e7alho na aba Packing list. Edite produtos e pesos nas abas Produtos e Caixas: a aba principal usa f\u00f3rmulas para refletir esses dados.","A identifica\u00e7\u00e3o da caixa est\u00e1 mesclada por grupo. Ao inserir linhas, revise as mesclagens e os intervalos das f\u00f3rmulas.","Peso l\u00edquido = unidades embaladas x peso unit\u00e1rio. Peso bruto deve ser medido. As unidades embaladas aparecem uma vez por item.","Altera\u00e7\u00f5es no Excel n\u00e3o retornam ao painel. Para gerar PDF com os mesmos dados, atualize tamb\u00e9m o sistema.","HS Code permanece texto para preservar zeros iniciais. Marca\u00e7\u00f5es de revis\u00e3o e dados internos n\u00e3o integram o documento.",...report.issues.map(t=>"PEND\u00caNCIA: "+t)]){const r=guide.addRow([line]);r.height=42}
 for(const ws of wb.worksheets)style(ws);
 return wb;
}
export async function packingExcelBlob(shipment,ops){const wb=await packingWorkbook(shipment,ops),buffer=await wb.xlsx.writeBuffer();return new Blob([buffer],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})}
