import {assemblyBoxes} from "./shipping.mjs";
import {scaled,weightText} from "./packing-list.mjs";
import {contentPerPack} from "./packing-reuse.mjs";
const text=n=>weightText(n).replace(/,000$/,"").replace(/(,\d*?)0+$/,"$1");
export function packingBalance(shipment,ops,exceptId=""){
 const items=assemblyBoxes(shipment).flatMap(b=>b.itens);
 return [...new Map(ops.map(o=>[o.id,o])).values()].map(op=>{
 const lines=items.filter(i=>i.opId===op.id&&i.id!==exceptId),target=scaled(op.quantidade);
 const invalid=lines.some(i=>scaled(i.quantidade)===null||i.produto!==op.produto||i.unidade!==op.unidade);
 const packed=lines.reduce((sum,i)=>sum+(scaled(i.quantidade)??0n),0n),remaining=target===null?null:target-packed;
 return {opId:op.id,produto:op.produto,unidade:op.unidade,target:target===null?null:text(target),packed:text(packed),remaining:remaining===null?null:text(remaining<0n?-remaining:remaining),excess:remaining!==null&&remaining<0n,invalid,remainingScaled:remaining};
 });
}
function lineWeight(item){
 const weight=scaled(item.pesoUnitarioKg),content=contentPerPack(item),amount=scaled(item.quantidade);
 if(weight===null||weight<=0n||content===null||content<=0n||amount===null||amount<=0n||!/^\d{1,6}$/.test(item.unidadesEmbaladas??""))return null;
 const count=BigInt(item.unidadesEmbaladas);return count>0n&&count*content===amount?count*weight:null;
}
export function suggestPackingQuantity(shipment,ops,boxId,itemId){
 const box=assemblyBoxes(shipment).find(b=>b.id===boxId),item=box?.itens.find(i=>i.id===itemId);
 const no=reason=>({quantity:"",packages:"",reason,limited:false});
 if(!item?.opId)return no("Escolha um produto.");
 const balance=packingBalance(shipment,ops,item.id).find(b=>b.opId===item.opId);
 const source=ops.find(o=>o.id===item.opId);
 if(!balance||balance.invalid||item.produto!==source.produto||item.unidade!==source.unidade)return no("Revise o vínculo e as quantidades deste produto nas caixas.");
 if(balance.remainingScaled===null)return no("Quantidade da OP não confirmada.");
 if(balance.remainingScaled<=0n)return no("Este produto já está distribuído nas outras linhas.");
 const content=contentPerPack(item);if(content===null||content<=0n)return no("Informe o conteúdo por embalagem em Revisar dados do produto.");
 let count=balance.remainingScaled/content;const original=count;
 if(count>999999n)count=999999n;
 if(box.pesoMaximoKg){
 const limit=scaled(box.pesoMaximoKg),tare=scaled(box.taraKg),weight=scaled(item.pesoUnitarioKg);
 if(limit===null||limit<=0n||tare===null||tare<0n)return no("Revise o limite e a tara em Preencher peso e medidas.");
 if(weight===null||weight<=0n)return no("Informe o peso unitário em Revisar dados do produto.");
 const other=box.itens.filter(i=>i.id!==itemId).map(lineWeight);
 if(other.some(w=>w===null))return no("Complete os pesos e quantidades dos outros itens desta caixa.");
 let used=tare+other.reduce((sum,w)=>sum+w,0n);
 // A measured gross can reveal extra protective material not included in the tare.
 const gross=scaled(box.pesoBrutoKg),current=lineWeight(item);
 if(gross!==null&&gross>0n){
 const amount=scaled(item.quantidade);
 if(current===null&&amount!==0n&&item.quantidade!=="")return no("Revise a quantidade atual antes de usar o peso bruto medido.");
 const measuredOther=gross-(current??0n);if(measuredOther>used)used=measuredOther;
 }
 const capacity=limit-used;const fits=capacity>0n?capacity/weight:0n;if(fits<count)count=fits;
 }
 if(count<=0n)return no(original===0n?"O saldo não completa uma embalagem. Revise a conversão.":"O limite de peso desta caixa foi atingido. Use outra caixa.");
 return {quantity:text(count*content),packages:count.toString(),limited:count<original,reason:box.pesoMaximoKg?"Sugestão pelo saldo e limite de peso. Confira o encaixe físico.":shipment?.caixasEmMontagem?.some(b=>b.id===boxId)?"Sugestão pelo saldo do pedido. Confira o que colocou na embalagem.":"Sugestão pelo saldo. Esta caixa não tem limite de peso cadastrado."};
}
