import {fillShipmentCodes} from "./product-code.mjs";
import {assemblyModeIssue} from "./assembly-mode.mjs";
import {normalizeGrouping} from "./shipment-groups.mjs";
export const packingFields={invoiceNumero:60,invoiceData:10,exportadorNome:150,exportadorEndereco:700,exportadorRef:100,destinatarioNome:150,destinatarioEndereco:700,destinatarioRegistro:400,contatoNome:100,contatoTelefone:80,contatoFax:80,contatoEmail:150,compradorNome:150,compradorEndereco:700,compradorRegistro:400,compradorContato:200,pedidoComprador:100,outrasReferencias:200,paisOrigem:80,paisDestino:80,termosEntrega:250,termosPagamento:400,preTransporte:100,localRecebimento:100,vooNavio:100,portoEmbarque:100,portoDesembarque:100,destinoFinal:150,pallets:6,assinante:100,assinaturaData:10};
export const emptyPacking=()=>Object.fromEntries(Object.keys(packingFields).map(k=>[k,""]));
export const shipmentFields={organizacao:10,conferenciaPor:100,conferenciaEm:40,conferenciaBase:40,referencia:100,transportadora:100,modalidade:40,previsaoEnvio:10,dataEnvio:10,rastreio:150,cidadeDestino:100,paisDestino:80,responsavelEmbalagem:100,observacoes:1500};
const boxFields={modeloNome:80,pesoMaximoKg:13,taraKg:13,codigo:50,embalagem:80,lacre:80,comprimentoCm:20,larguraCm:20,alturaCm:20,pesoBrutoKg:20,pesoLiquidoKg:20,observacoes:500};
const itemFields={origemLote:10,origemValidade:10,caixaInternaId:80,origemPeso:10,conteudoPorEmbalagem:13,descricaoDocumento:700,sku:100,hsCode:40,tipoEmbalagem:60,unidadesEmbaladas:6,pesoUnitarioKg:13,opId:150,produto:500,unidade:30,quantidade:20,lote:100,validade:10};
const measures=["comprimentoCm","larguraCm","alturaCm","pesoBrutoKg","pesoLiquidoKg"];
export const MODES=["","Rodoviário","Aéreo","Marítimo","Retirada","Outro"];
export function emptyShipment(){return {...Object.fromEntries(Object.keys(shipmentFields).map(k=>[k,""])),packing:emptyPacking(),caixas:[]}}
export function newBox(boxes,id){let n=1;while(boxes.some(b=>b.codigo==="CX-"+String(n).padStart(3,"0")))n++;return {id,...Object.fromEntries(Object.keys(boxFields).map(k=>[k,""])),codigo:"CX-"+String(n).padStart(3,"0"),embalagem:"Caixa de papelão",itens:[]}}
export function newInnerBox(box,id,tipo){const prefix=tipo==="bag"?"BAG-":"INT-";let n=1;while((box.caixasInternas??[]).some(b=>b.codigo===prefix+String(n).padStart(2,"0")))n++;return {id,codigo:prefix+String(n).padStart(2,"0"),...(tipo==="bag"?{tipo:"bag"}:{})}}
export function assemblyBoxes(shipment){return [...(shipment?.caixas??[]),...(shipment?.caixasEmMontagem??[]).map(inner=>({...newBox([],inner.id),codigo:inner.codigo,caixasInternas:[{id:inner.id,codigo:inner.codigo,...(inner.tipo==="bag"?{tipo:"bag"}:{})}],itens:inner.itens}))]}
export function newItem(id){return {id,...Object.fromEntries(Object.keys(itemFields).map(k=>[k,""]))}}
export function isDecimalDraft(v){return typeof v==="string"&&/^\d{0,9}([.,]\d{0,3})?$/.test(v)}
export function decimal(v){if(typeof v!=="string"||!/^\d+(?:[.,]\d{1,3})?$/.test(v))return null;const n=Number(v.replace(",","."));return Number.isFinite(n)?n:null}
export function validDate(v){return v===""||(/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+"T12:00:00Z"))&&new Date(v+"T12:00:00Z").toISOString().slice(0,10)===v)}
function textFields(source,fields){return Object.fromEntries(Object.keys(fields).map(k=>[k,String(source?.[k]??"").trim()]))}
export function canonicalShipping(value){
 return {...textFields(value,shipmentFields),...(value?.packingExcluido===true?{packingExcluido:true}:{}),...(value?.agrupamento?{agrupamento:normalizeGrouping(value.agrupamento)}:{}),packing:textFields(value?.packing,packingFields),...(value?.caixasEmMontagem?.length?{caixasEmMontagem:value.caixasEmMontagem.map(inner=>({id:inner.id,codigo:String(inner.codigo??"").trim(),...(inner.tipo==="bag"?{tipo:"bag"}:{}),pronta:inner.pronta===true,itens:(inner.itens??[]).map(i=>({id:i.id,...textFields(i,itemFields)}))}))}:{}),caixas:(value?.caixas??[]).map(b=>({id:b.id,...(b.montada!==undefined?{montada:b.montada}:{}),...textFields(b,boxFields),...(b.caixasInternas?.length?{caixasInternas:b.caixasInternas.map(inner=>({id:inner.id,codigo:String(inner.codigo??"").trim(),...(inner.tipo==="bag"?{tipo:"bag"}:{})}))}:{}),itens:(b.itens??[]).map(i=>({id:i.id,...textFields(i,itemFields)}))}))};
}
function assertFields(v,fields){if(!v||typeof v!=="object"||Array.isArray(v))throw Error("Dados de envio inválidos.");for(const [k,max] of Object.entries(fields))if(typeof(v[k]??"")!=="string"||(v[k]??"").length>max)throw Error("Revise o campo de envio: "+k+".")}
const validId=id=>typeof id==="string"&&/^[a-zA-Z0-9_-]{1,80}$/.test(id);
export function normalizeShipment(value,ops,previous){
 if(value===undefined)return undefined;
 assertFields(value,shipmentFields);
 if(value.organizacao===undefined&&previous?.organizacao)value={...value,organizacao:previous.organizacao};
 if(value.packingExcluido!==undefined&&typeof value.packingExcluido!=="boolean")throw Error("Estado do packing list inválido.");
 if(value.packingExcluido===undefined&&previous?.packingExcluido)value={...value,packingExcluido:true};
 if(value.caixasEmMontagem===undefined&&previous?.caixasEmMontagem?.length)value={...value,caixasEmMontagem:previous.caixasEmMontagem};
 if(value.organizacao){const issue=assemblyModeIssue(value,value.organizacao);if(issue)throw Error(issue);}
 if(value.packing!==undefined){assertFields(value.packing,packingFields);if(!validDate(value.packing.invoiceData??"")||!validDate(value.packing.assinaturaData??"")||!/^\d{0,6}$/.test(value.packing.pallets??""))throw Error("Revise as datas ou a quantidade de pallets do packing list.")}
 if(!Array.isArray(value.caixas)||value.caixas.length>100)throw Error("Informe até 100 caixas por pedido.");
 if(!MODES.includes(value.modalidade??"")||!validDate(value.previsaoEnvio??"")||!validDate(value.dataEnvio??""))throw Error("Modalidade ou data de envio inválida.");
 const existing=new Map(assemblyBoxes(previous).flatMap(b=>b.itens??[]).map(i=>[i.id,i]));
 const opMap=new Map(ops.map(o=>[o.id,o])),boxIds=new Set(),itemIds=new Set();
 if(value.caixasEmMontagem!==undefined&&(!Array.isArray(value.caixasEmMontagem)||value.caixasEmMontagem.length>100))throw Error("Monte até 100 embalagens por vez.");
 for(const inner of value.caixasEmMontagem??[]){
 if(!inner||!validId(inner.id)||(inner.tipo!==undefined&&inner.tipo!=="bag")||typeof inner.codigo!=="string"||inner.codigo.length>50||(inner.pronta!==undefined&&typeof inner.pronta!=="boolean")||!Array.isArray(inner.itens)||inner.itens.some(i=>!i||i.caixaInternaId!==inner.id))throw Error("Revise a embalagem em montagem.");
 }
 for(const b of assemblyBoxes(value)){
 assertFields(b,boxFields);if(b.montada!==undefined&&typeof b.montada!=="boolean")throw Error("Estado da caixa inválido.");if(b.montada===true&&(!b.itens?.length||b.itens.some(i=>!i.opId||(decimal(i.quantidade)??0)<=0)))throw Error("Complete os produtos e quantidades antes de finalizar a caixa.");if(!validId(b.id)||boxIds.has(b.id))throw Error("Identificação de caixa inválida.");boxIds.add(b.id);
 if([...measures,"pesoMaximoKg","taraKg"].some(k=>!isDecimalDraft(b[k]??"")))throw Error("Use valores positivos com até três casas decimais nas medidas e pesos.");
 const innerIds=new Set();
 if(b.caixasInternas!==undefined&&(!Array.isArray(b.caixasInternas)||b.caixasInternas.length>100))throw Error("Informe até 100 embalagens por caixa maior.");
 for(const inner of b.caixasInternas??[]){if(!inner||!validId(inner.id)||innerIds.has(inner.id)||(inner.tipo!==undefined&&inner.tipo!=="bag")||typeof inner.codigo!=="string"||inner.codigo.length>50)throw Error("Identificação de embalagem inválida.");innerIds.add(inner.id)}
 if(!Array.isArray(b.itens)||b.itens.length>100)throw Error("Informe até 100 itens por caixa.");
 for(const i of b.itens){
 assertFields(i,itemFields);if(!["","ordem","manual"].includes(i.origemLote??"")||!["","nomus","manual"].includes(i.origemValidade??""))throw Error("Origem de lote ou validade inválida.");if(i.caixaInternaId&&!innerIds.has(i.caixaInternaId))throw Error("O produto deve estar em uma embalagem deste volume.");if(!["","produto","nomus","manual"].includes(i.origemPeso??""))throw Error("Origem do peso inválida.");if(!/^\d{0,6}$/.test(i.unidadesEmbaladas??"")||!isDecimalDraft(i.pesoUnitarioKg??"")||!isDecimalDraft(i.conteudoPorEmbalagem??""))throw Error("Revise a quantidade de embalagens e o peso unitário.");if(!validId(i.id)||itemIds.has(i.id))throw Error("Identificação de item inválida.");itemIds.add(i.id);
 if(!isDecimalDraft(i.quantidade??"")||!validDate(i.validade??""))throw Error("Quantidade ou validade do item inválida.");
 const old=existing.get(i.id),source=opMap.get(i.opId);
 // Historical packing lines remain readable if the ERP later changes a link or description.
 if(i.opId&&!source&&!(old?.opId===i.opId&&old.produto===i.produto&&old.unidade===i.unidade))throw Error("O item deve pertencer a uma OP deste pedido.");
 if(!i.opId&&(i.produto||i.unidade))throw Error("Escolha a OP para identificar o produto.");
 if(source&&!(old?.opId===i.opId&&old.produto===i.produto&&old.unidade===i.unidade)&&(i.produto!==source.produto||i.unidade!==source.unidade))throw Error("A identificação do produto mudou. Selecione a OP novamente.");
 }
 }
 assertPackingCapacity(value,ops,previous);
 return fillShipmentCodes(canonicalShipping(value),ops);
}
function round(n){return Math.round((n+Number.EPSILON)*1000000)/1000000}
export function analyzeShipment(value,ops){
 const s=canonicalShipping(value),issues=[],codes=new Set(),packed=new Map(),units=new Map(),boxesByOP=new Map(),invalidOps=new Set();
 let bruto=0,liquido=0,volume=0,weightCount=0,netCount=0,dimensionCount=0;
 if(!s.caixas.length)issues.push("Adicione uma caixa maior e informe os produtos ou embalagens que vão dentro dela.");
 for(const inner of s.caixasEmMontagem??[])issues.push((inner.codigo||"Embalagem")+": conclua a montagem e coloque esta embalagem em uma caixa maior.");
 for(const b of s.caixas){
 const name=b.codigo||"Caixa sem identificação",code=b.codigo.toLocaleLowerCase("pt-BR");
 if(!code)issues.push("Uma caixa está sem identificação.");else if(codes.has(code))issues.push(name+": identificação repetida.");codes.add(code);
 const dimensions=measures.slice(0,3).map(k=>decimal(b[k]));
 if(dimensions.some(n=>n===null||n<=0))issues.push(name+": preencha comprimento, largura e altura.");else{volume+=dimensions.reduce((a,n)=>a*n,1)/1000000;dimensionCount++}
 const gross=decimal(b.pesoBrutoKg),net=decimal(b.pesoLiquidoKg);
 if(gross===null||gross<=0)issues.push(name+": informe o peso bruto.");else{bruto+=gross;weightCount++}
 if(net!==null&&net>0){liquido+=net;netCount++}else if(b.pesoLiquidoKg)issues.push(name+": revise o peso líquido.");
 if(gross!==null&&net!==null&&net>gross)issues.push(name+": peso líquido maior que o bruto.");
 if(!b.itens.length)issues.push(name+": informe os itens dentro da caixa.");
 const innerCodes=new Set(),innerIds=new Set((b.caixasInternas??[]).map(inner=>inner.id));
 for(const inner of b.caixasInternas??[]){
 const code=inner.codigo.trim().toLocaleLowerCase("pt-BR");
 if(!code)issues.push(name+": identifique cada embalagem.");else if(innerCodes.has(code))issues.push(name+": identificação de embalagem repetida.");innerCodes.add(code);
 if(!b.itens.some(i=>i.caixaInternaId===inner.id))issues.push(name+" / "+(inner.codigo||"embalagem")+": adicione os produtos ou remova a embalagem vazia.");
 }

 for(const i of b.itens){
 if(i.caixaInternaId&&!innerIds.has(i.caixaInternaId))issues.push(name+": reveja a embalagem do produto.");
 const q=decimal(i.quantidade),op=ops.find(o=>o.id===i.opId);
 if(!i.opId)issues.push(name+": selecione a OP de cada item.");
 else if(!op)issues.push(name+": "+i.opId+" não está mais no vínculo consultado; revise.");
 else if(op.produto!==i.produto||op.unidade!==i.unidade)issues.push(name+": identificação de "+i.opId+" mudou no Nomus; revise.");
 if(q===null||q<=0)issues.push(name+": informe a quantidade de "+(i.opId||"cada item")+".");
 if(i.opId&&(q===null||q<=0||!op||op.produto!==i.produto||op.unidade!==i.unidade))invalidOps.add(i.opId);
 if(q!==null&&q>0&&i.opId){units.set(i.unidade||"Sem unidade",round((units.get(i.unidade||"Sem unidade")??0)+q));if(op&&op.unidade===i.unidade&&op.produto===i.produto){packed.set(i.opId,round((packed.get(i.opId)??0)+q));const boxes=boxesByOP.get(i.opId)??new Map();boxes.set(b.id,{id:b.id,codigo:name,quantidade:round((boxes.get(b.id)?.quantidade??0)+q)});boxesByOP.set(i.opId,boxes)}}
 }
 }
 const allocation=ops.map(o=>{const target=decimal(String(o.quantidade)),quantity=packed.get(o.id)??0;const remaining=target===null?null:round(target-quantity);if(remaining!==null&&remaining<0)issues.push(o.nome+": quantidade nas caixas maior que a quantidade da OP.");return {opId:o.id,produto:o.produto,unidade:o.unidade,previsto:target,embalado:quantity,restante:remaining,caixas:[...(boxesByOP.get(o.id)?.values()??[])],status:invalidOps.has(o.id)?"review":remaining===null?"unknown":remaining<0?"excess":quantity===0?"none":remaining===0?"complete":"partial"}});
 return {boxes:s.caixas.length,bruto:round(bruto),liquido:round(liquido),volume:round(volume),weightCount,netCount,dimensionCount,quantidades:[...units].map(([unidade,quantidade])=>({unidade,quantidade})),allocation,issues:[...new Set(issues)]};
}

export function assertPackingCapacity(value,ops,previous){
 const totals=s=>{const result=new Map();for(const box of assemblyBoxes(s))for(const item of box.itens){const q=decimal(item.quantidade);if(q!==null&&item.opId)result.set(item.opId,(result.get(item.opId)??0)+Math.round(q*1000))}return result};
 const next=totals(value),old=totals(previous);
 for(const op of ops){const target=decimal(String(op.quantidade));if(target!==null&&(next.get(op.id)??0)>Math.round(target*1000)&&(next.get(op.id)??0)>(old.get(op.id)??0))throw Error(op.nome+": a quantidade distribuída excede "+op.quantidade+" "+op.unidade+". Reduza a quantidade ou retire itens de outra caixa.");}
}
