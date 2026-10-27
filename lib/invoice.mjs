import {stockItems} from "./stock-orders.mjs";
import {boxReviewKey} from "./box-review.mjs";
import {decimal,validDate} from "./shipping.mjs";
export const partyFields={company:150,taxId:100,stateReg:100,address:700,city:100,state:80,country:80,zip:30,phone:80,email:150,contact:100,department:100};
export const invoiceFields={sourceBase:40,passport:60,number:60,date:10,exportDate:10,dataEnvio:10,waybill:100,exportReferences:300,countryExport:80,countryManufacture:80,countryDestination:80,currency:3,freight:15,packagesTotal:6,location:100,signerName:100,signerTitle:100,signerId:100,signatureDate:10,notes:1500};
export const lineFields={sourceRef:150,sourceData:4000,sourceOrder:150,sourceKey:200,marks:80,packages:6,packaging:80,description:700,hsCode:40,partNumber:100,quantity:15,unit:30,unitWeightKg:15,unitValue:15};
const blanks=fields=>Object.fromEntries(Object.keys(fields).map(k=>[k,""]));
export const emptyParty=()=>blanks(partyFields);
export function emptyInvoice(id,carrier="FedEx"){
 return {id,carrier,orderIds:[],...blanks(invoiceFields),currency:"USD",countryExport:"Brazil",countryManufacture:"Brazil",location:"Nova Friburgo",shipper:{...emptyParty(),company:"PAGNIER COMERCIO LTDA",taxId:"26.828.299/0001-60",address:"RUA CORONEL ZAMITH 380, BLOCO 03",city:"NOVA FRIBURGO",state:"RJ",country:"Brazil",zip:"28613-560"},consignee:emptyParty(),buyer:emptyParty(),items:[]};
}
export const newInvoiceLine=id=>({id,...blanks(lineFields)});
const clean=(source,fields)=>Object.fromEntries(Object.keys(fields).map(k=>[k,String(source?.[k]??"").trim()]));
export function canonicalInvoice(value){return {id:value.id,carrier:value.carrier,orderIds:[...value.orderIds],...clean(value,invoiceFields),shipper:clean(value.shipper,partyFields),consignee:clean(value.consignee,partyFields),buyer:clean(value.buyer,partyFields),items:value.items.map(i=>({id:i.id,...clean(i,lineFields)}))}}
export function canonicalInvoices(values={}){return Object.fromEntries(Object.entries(values).sort(([a],[b])=>a.localeCompare(b)).map(([id,v])=>[id,canonicalInvoice(v)]))}
const validId=id=>typeof id==="string"&&/^[a-zA-Z0-9_-]{1,80}$/.test(id);
export function numericDraft(v,places=3){return typeof v==="string"&&new RegExp("^\\d{0,6}([.,]\\d{0,"+places+"})?$").test(v)}
function fields(value,limits){if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Dados de invoice inválidos.");for(const [k,max] of Object.entries(limits))if(typeof(value[k]??"")!=="string"||(value[k]??"").length>max)throw Error("Revise o campo da invoice: "+k)}
export function normalizeInvoices(values,allowedIds){
 if(!values||typeof values!=="object"||Array.isArray(values)||Object.keys(values).length>200)throw Error("Informe até 200 invoices.");
 const allowed=new Set(allowedIds);
 for(const [id,v] of Object.entries(values)){
 fields(v,invoiceFields);if(!validId(id)||v.id!==id||!["FedEx","DHL"].includes(v.carrier))throw Error("Identificação ou transportadora da invoice inválida.");
 if(!Array.isArray(v.orderIds)||v.orderIds.length>1||new Set(v.orderIds).size!==v.orderIds.length||v.orderIds.some(id=>typeof id!=="string"||!allowed.has(id)))throw Error("A invoice contém um pedido fora do escopo permitido.");
 for(const p of [v.shipper,v.consignee,v.buyer])fields(p,partyFields);
 if(![v.date,v.exportDate,v.signatureDate,v.dataEnvio].every(d=>validDate(d??""))||!numericDraft(v.freight??"",2)||!/^\d{0,6}$/.test(v.packagesTotal??"")||!/^([A-Z]{3})?$/.test(v.currency??""))throw Error("Revise datas, moeda, volumes e frete da invoice.");
 if(!Array.isArray(v.items)||v.items.length>200)throw Error("Informe até 200 itens na invoice.");const ids=new Set();
 for(const item of v.items){fields(item,lineFields);if(!validId(item.id)||ids.has(item.id))throw Error("Identificação de item repetida ou inválida.");ids.add(item.id);if(item.sourceOrder&&!v.orderIds.includes(item.sourceOrder))throw Error("O item está vinculado a um pedido fora desta invoice.");if(!numericDraft(item.quantity??"")||!numericDraft(item.unitWeightKg??"")||!numericDraft(item.unitValue??"",2)||!/^\d{0,6}$/.test(item.packages??""))throw Error("Revise quantidades, pesos e valores da invoice.")}
 }
 return canonicalInvoices(values);
}
function scaled(value,places){if(typeof value!=="string"||!new RegExp("^\\d{1,6}([.,]\\d{1,"+places+"})?$").test(value))return null;const [a,b=""]=value.replace(",",".").split(".");return BigInt(a)*10n**BigInt(places)+BigInt(b.padEnd(places,"0"))}
const roundDiv=(n,d)=>(n+d/2n)/d;
export const fixedText=(n,places=2)=>n===null?"":(n/10n**BigInt(places)).toString()+","+(n%10n**BigInt(places)).toString().padStart(places,"0");
export function inspectInvoice(value){
 const v=canonicalInvoice(value),issues=[];
 for(const [key,label] of Object.entries({number:"Número da invoice",date:"Data da invoice",waybill:"Conhecimento aéreo / AWB",countryExport:"País de exportação",countryManufacture:"País de fabricação",countryDestination:"País de destino",currency:"Moeda",signerName:"Responsável",signerTitle:"Cargo do responsável",signatureDate:"Data da declaração"}))if(!v[key])issues.push("Preencha "+label+".");
 if(v.carrier==="FedEx"&&!v.exportDate)issues.push("Preencha a data de exportação.");
 if(v.carrier==="DHL"&&!v.location)issues.push("Preencha o local da declaração.");
 for(const [p,label] of [[v.shipper,"remetente"],[v.consignee,"destinatário"],...(Object.values(v.buyer).some(Boolean)?[[v.buyer,"importador"]]:[])])for(const key of ["company","address","country"])if(!p[key])issues.push("Complete nome, endereço e país do "+label+".");
 if(v.orderIds.length!==1)issues.push("Selecione exatamente um pedido permitido.");
 if(![v.date,v.exportDate,v.signatureDate,v.dataEnvio].every(validDate))issues.push("Revise as datas da invoice.");
 if(!/^[A-Z]{3}$/.test(v.currency))issues.push("Informe uma moeda com três letras, como USD.");
 if(!v.items.length)issues.push("Adicione os produtos da encomenda.");
 if(!/^\d{1,6}$/.test(v.packagesTotal)||Number(v.packagesTotal)<1)issues.push("Informe o total de volumes físicos.");
 let subtotal=0n,weight=0n,quantity=0n;
 const rows=v.items.map((item,index)=>{const q=scaled(item.quantity,3),w=scaled(item.unitWeightKg,3),price=scaled(item.unitValue,2);const total=q!==null&&price!==null?roundDiv(q*price,1000n):null,totalWeight=q!==null&&w!==null?roundDiv(q*w,1000n):null;
 if(!item.description||!item.unit||!/^\d{6}(\d{2})?(\d{2})?$/.test(item.hsCode))issues.push("Item "+(index+1)+": revise descrição, unidade e HS Code (6, 8 ou 10 dígitos).");
 if(q===null||q<=0n||w===null||w<=0n||price===null||price<=0n)issues.push("Item "+(index+1)+": informe quantidade, peso unitário e valor unitário positivos.");
 if(v.carrier==="FedEx"&&(!item.packaging||!item.marks))issues.push("Item "+(index+1)+": informe identificação e embalagem.");
 subtotal+=total??0n;weight+=totalWeight??0n;quantity+=q??0n;return {...item,amount:total,weight:totalWeight};});
 const freight=scaled(v.freight,2);if(freight===null)issues.push("Informe o frete, inclusive 0 quando não houver.");
 const total=subtotal+(freight??0n);if(total>9000000000000000n)issues.push("Valor total acima da precisão suportada para exportação.");
 return {invoice:v,rows,subtotal,freight,total,weight,quantity,issues:[...new Set(issues)]};
}
// Compare source snapshots; applying an update replaces imported rows instead of appending another origin.
function invoiceSources(orders,shipment){
 const rows=[],fromBoxes=!!shipment?.caixas?.some(b=>b.itens.length)&&(!shipment.agrupamento||shipment.agrupamento.pedidos.length===1);
 const prepared=orders.map(o=>({...o,ordens:o.ordens?.length?o.ordens:stockItems(o)}));
 if(fromBoxes){
 for(const b of shipment.caixas)for(const item of b.itens){const order=prepared.find(o=>o.ordens.some(op=>op.id===item.opId));if(!order)continue;
 rows.push({sourceKey:"box:"+b.id+":"+item.id,sourceRef:item.opId,sourceOrder:order.id,marks:b.codigo,packaging:item.tipoEmbalagem||b.embalagem,description:item.descricaoDocumento||item.produto,hsCode:item.hsCode,partNumber:item.sku||order.ordens.find(op=>op.id===item.opId&&op.produto===item.produto&&op.unidade===item.unidade)?.sku||"",quantity:item.unidadesEmbaladas||item.quantidade,unit:item.unidadesEmbaladas?"UN":item.unidade,unitWeightKg:item.unidadesEmbaladas?item.pesoUnitarioKg:""});
 }
 }else for(const order of prepared)for(const op of order.ordens)rows.push({sourceKey:"op:"+op.id,sourceRef:op.id,sourceOrder:order.id,description:op.produto,partNumber:op.sku||"",quantity:op.quantidade,unit:op.unidade});
 return {rows,fromBoxes,packagesTotal:fromBoxes?String(shipment.caixas.length):"",physical:fromBoxes?boxReviewKey(shipment,prepared.flatMap(o=>o.ordens)):""};
}
function sameCommercialUnit(a,b){const normal=v=>["UN","UNID","UNIDADE","UNIDADES","PC","PCS","PÇ","PÇS"].includes(String(v).trim().toUpperCase())?"UN":String(v).trim().toUpperCase();return normal(a)===normal(b)}
function sourceHash(source){let h=14695981039346656037n;const text=JSON.stringify({...source,rows:[...source.rows].sort((a,b)=>a.sourceKey.localeCompare(b.sourceKey))});for(let i=0;i<text.length;i++){h^=BigInt(text.charCodeAt(i));h=BigInt.asUintN(64,h*1099511628211n)}return "v1-"+h.toString(16)}
export function invoiceSourceStatus(invoice,orders,shipment){
 const source=invoiceSources(orders,shipment),fingerprint=sourceHash(source),linked=invoice.items.some(i=>i.sourceKey);
 return {...source,fingerprint,linked,changed:linked&&invoice.sourceBase!==fingerprint};
}
export function previewInvoiceSources(invoice,orders,shipment,idFactory){
 const state=invoiceSourceStatus(invoice,orders,shipment),old=invoice.items.filter(i=>i.sourceKey),manual=invoice.items.filter(i=>!i.sourceKey),used=new Set(),changes=[];
 const next=structuredClone(invoice);next.items=[...manual];
 for(const row of state.rows){
 const candidates=old.filter(i=>i.sourceKey===row.sourceKey||i.sourceRef===row.sourceRef||i.sourceKey==="op:"+row.sourceRef||i.sourceKey.startsWith("order:"+row.sourceOrder+":")&&i.description===row.description);
 const exact=candidates.find(i=>i.sourceKey===row.sourceKey),prior=exact??candidates[0];let baseline={};try{baseline=JSON.parse(prior?.sourceData||"{}")}catch{}
 const line={...newInvoiceLine(prior&&!used.has(prior.id)?prior.id:idFactory()),...row};
 if(prior){
 used.add(prior.id);
 for(const field of ["description","hsCode","partNumber","packaging"]){
 const values=[...new Set(candidates.map(i=>i[field]).filter(Boolean))];
 if((exact||values.length===1)&&prior[field]&&prior[field]!==baseline[field])line[field]=prior[field];
 }
 const prices=[...new Set(candidates.filter(i=>sameCommercialUnit(i.unit,row.unit)).map(i=>i.unitValue).filter(Boolean))];
 line.unitValue=sameCommercialUnit(prior.unit,row.unit)&&(exact||prices.length===1)?prior.unitValue:"";
 line.packages=exact?.packages??"";
 }
 line.sourceData=JSON.stringify(row);next.items.push(line);
 if(!prior||prior.quantity!==line.quantity||prior.unit!==line.unit||prior.sourceKey!==line.sourceKey||prior.unitWeightKg!==line.unitWeightKg||prior.unitValue!==line.unitValue)changes.push({product:line.description,before:prior?prior.quantity+" "+prior.unit:"Não importado",after:line.quantity+" "+line.unit,note:prior&&!sameCommercialUnit(prior.unit,line.unit)?"Unidade alterada: revise o preço unitário.":""});
 }
 for(const item of old)if(!state.rows.some(r=>r.sourceKey===item.sourceKey||r.sourceRef===(item.sourceRef||item.sourceKey.replace(/^op:/,""))||item.sourceKey.startsWith("order:"+r.sourceOrder+":")&&item.description===r.description))changes.push({product:item.description,before:item.quantity+" "+item.unit,after:"Removido da origem",note:"A linha importada será retirada; itens manuais permanecem."});
 if(next.items.length>200)throw Error("A invoice ultrapassa 200 itens.");
 if(state.fromBoxes)next.packagesTotal=state.packagesTotal;
 next.sourceBase=state.fingerprint;
 return {next,changes,removedDuplicates:Math.max(0,old.length-state.rows.length),...state};
}
export function addInvoiceSources(invoice,orders,shipment,idFactory){
 const state=invoiceSourceStatus(invoice,orders,shipment);
 if(state.linked&&!state.changed)return invoice;
 return previewInvoiceSources(invoice,orders,shipment,idFactory).next;
}
export function fillInvoiceFromShipment(invoice,shipment){
 if(!shipment)return invoice;const next=structuredClone(invoice),p=shipment.packing??{};
 const fill=(target,source)=>{for(const [key,value] of Object.entries(source))if(!target[key]&&value)target[key]=value};
 fill(next,{waybill:shipment.rastreio,exportDate:shipment.dataEnvio,countryDestination:p.paisDestino||shipment.paisDestino,number:p.invoiceNumero,date:p.invoiceData});
 fill(next.consignee,{company:p.destinatarioNome,address:p.destinatarioEndereco,taxId:p.destinatarioRegistro,phone:p.contatoTelefone,email:p.contatoEmail,contact:p.contatoNome,country:p.paisDestino||shipment.paisDestino});
 fill(next.buyer,{company:p.compradorNome,address:p.compradorEndereco,taxId:p.compradorRegistro,contact:p.compradorContato});return next;
}
export function invoiceInScope(invoice,codes={}){return !Array.isArray(invoice?.orderIds)||!invoice.orderIds.some(id=>codes[id])}

export function fillInvoiceCodes(invoice,orders,shipment){
 const sources=invoiceSources(orders,shipment).rows;let changed=false;
 const items=invoice.items.map(item=>{if(item.partNumber?.trim()||!item.sourceKey)return item;
 const exact=sources.filter(row=>row.sourceKey===item.sourceKey&&row.sourceOrder===item.sourceOrder);
 const candidates=exact.length?exact:sources.filter(row=>row.sourceRef===item.sourceRef&&row.sourceOrder===item.sourceOrder);
 const codes=[...new Set(candidates.map(row=>row.partNumber).filter(Boolean))];if(codes.length!==1)return item;
 changed=true;return {...item,partNumber:codes[0]};});
 return changed?{...invoice,items}:invoice;
}
