import {newInnerBox,decimal,assertPackingCapacity} from "./shipping.mjs";
import {packingBalance} from "./packing-assistant.mjs";
import {scaled} from "./packing-list.mjs";
export function smallBoxCopyCapacity(shipment,id,ops){
 const boxes=shipment.caixasEmMontagem??[],source=boxes.find(b=>b.id===id);
 const issue=smallBoxIssue(source,ops);if(issue)return {max:0,reason:issue};
 let max=100-boxes.length;
 if(max<=0)return {max:0,reason:"Limite de 100 caixas menores em preparo atingido. Distribua as caixas prontas para continuar."};
 const amounts=new Map();
 for(const item of source.itens)amounts.set(item.opId,(amounts.get(item.opId)??0n)+(scaled(item.quantidade)??0n));
 const balances=packingBalance(shipment,ops);
 for(const [opId,amount] of amounts){
  const balance=balances.find(b=>b.opId===opId);
  if(!balance||balance.invalid||balance.remainingScaled===null||amount<=0n)return {max:0,reason:"Confirme as quantidades do pedido antes de criar cópias."};
  if(balance.remainingScaled<amount)return {max:0,reason:"Saldo insuficiente para outra caixa igual. Revise a quantidade por caixa ou a distribuição do pedido."};
  max=Math.min(max,Number(balance.remainingScaled/amount));
 }
 return {max,reason:""};
}
function preparedCode(s){return newInnerBox({caixasInternas:[...(s.caixasEmMontagem??[]),...s.caixas.flatMap(b=>b.caixasInternas??[])]},"unused").codigo}
export function startSmallBox(shipment,id){
 if((shipment.caixasEmMontagem?.length??0)>=100)throw Error("Conclua as embalagens em montagem antes de criar outras.");
 return {...shipment,caixasEmMontagem:[...(shipment.caixasEmMontagem??[]),{id,codigo:preparedCode(shipment),pronta:false,itens:[]}]};
}
export function smallBoxIssue(box,ops){
 if(!box?.codigo.trim())return "Identifique a embalagem.";
 if(!box.itens.length)return "Adicione os produtos desta embalagem.";
 for(const item of box.itens){const op=ops.find(o=>o.id===item.opId);if(!op||op.produto!==item.produto||op.unidade!==item.unidade)return "Selecione os produtos vinculados ao pedido.";if((decimal(item.quantidade)??0)<=0)return "Informe a quantidade de cada produto."}
 return "";
}
export function duplicateSmallBox(shipment,id,count,ops,makeId=()=>crypto.randomUUID()){
 if(!Number.isInteger(count)||count<1||count>99)throw Error("Informe de 1 a 99 cópias adicionais.");
 const boxes=shipment.caixasEmMontagem??[],source=boxes.find(b=>b.id===id);
 if(!source)throw Error("Selecione a caixa menor que deseja multiplicar.");
 const issue=smallBoxIssue(source,ops);if(issue)throw Error(issue);
 if(boxes.length+count>100)throw Error("Monte até 100 embalagens por vez. Reduza o número de cópias.");
 const capacity=smallBoxCopyCapacity(shipment,id,ops);
 const codes=new Set([...boxes,...shipment.caixas.flatMap(b=>b.caixasInternas??[])].map(b=>b.codigo.toLowerCase()));
 const copies=[];let suffix=2;
 for(let n=0;n<count;n++){
  let code;do{const tail=" ("+(suffix++)+")";code=source.codigo.slice(0,50-tail.length)+tail}while(codes.has(code.toLowerCase()));
  codes.add(code.toLowerCase());const copyId=makeId();
  copies.push({...source,id:copyId,codigo:code,itens:source.itens.map(item=>({...item,id:makeId(),caixaInternaId:copyId}))});
 }
 const next={...shipment,caixasEmMontagem:[...boxes,...copies]};
 assertPackingCapacity(next,ops,shipment);
 if(count>capacity.max)throw Error(capacity.reason||"O número de cópias excede o limite disponível.");
 return next;
}
export function finishSmallBox(shipment,id,ops){assertPackingCapacity(shipment,ops);const box=shipment.caixasEmMontagem?.find(b=>b.id===id);const issue=smallBoxIssue(box,ops);if(issue)throw Error(issue);return {...shipment,caixasEmMontagem:shipment.caixasEmMontagem.map(b=>b.id===id?{...b,pronta:true}:b)}}
export function placeSmallBox(shipment,id,targetId,ops){
 assertPackingCapacity(shipment,ops);
 const inner=shipment.caixasEmMontagem?.find(b=>b.id===id),target=shipment.caixas.find(b=>b.id===targetId);
 if(!inner||!target)throw Error("Escolha a embalagem e a caixa maior.");
 if(target.montada===true)throw Error("Volte a caixa maior para montagem antes de adicionar produtos.");
 const issue=smallBoxIssue(inner,ops);if(issue)throw Error(issue);if(!inner.pronta)throw Error("Conclua a embalagem antes de colocá-la na maior.");
 if(target.itens.length+inner.itens.length>100||(target.caixasInternas?.length??0)>=100)throw Error("Esta caixa maior atingiu o limite de itens ou embalagens.");
 if(target.caixasInternas?.some(b=>b.id===id))throw Error("Esta embalagem já está no volume escolhido.");
 const code=target.caixasInternas?.some(b=>b.codigo.toLowerCase()===inner.codigo.toLowerCase())?newInnerBox(target,id).codigo:inner.codigo;
 return {...shipment,caixasEmMontagem:shipment.caixasEmMontagem.filter(b=>b.id!==id),caixas:shipment.caixas.map(b=>b.id!==targetId?b:{...b,caixasInternas:[...(b.caixasInternas??[]),{id,codigo:code}],itens:[...b.itens,...inner.itens],montada:false,pesoBrutoKg:"",taraKg:""})};
}
export function unpackSmallBox(shipment,outerId,innerId,newId){
 const outer=shipment.caixas.find(b=>b.id===outerId),inner=outer?.caixasInternas?.find(b=>b.id===innerId);if(!inner)throw Error("Embalagem não encontrada.");
 if((shipment.caixasEmMontagem?.length??0)>=100)throw Error("Conclua as embalagens em montagem antes de retirar outra.");
 const id=shipment.caixasEmMontagem?.some(b=>b.id===innerId)||shipment.caixas.some(b=>b.id===innerId)?newId:innerId;
 const code=shipment.caixasEmMontagem?.some(b=>b.codigo.toLowerCase()===inner.codigo.toLowerCase())?preparedCode(shipment):inner.codigo;
 return {...shipment,caixasEmMontagem:[...(shipment.caixasEmMontagem??[]),{id,codigo:code,pronta:false,itens:outer.itens.filter(i=>i.caixaInternaId===innerId).map(i=>({...i,caixaInternaId:id}))}],caixas:shipment.caixas.map(b=>b.id!==outerId?b:{...b,caixasInternas:b.caixasInternas.filter(v=>v.id!==innerId),itens:b.itens.filter(i=>i.caixaInternaId!==innerId),montada:false,pesoBrutoKg:"",taraKg:""})};
}
export function recoverLooseItems(shipment,outerId,id){
 const outer=shipment.caixas.find(b=>b.id===outerId),items=outer?.itens.filter(i=>!i.caixaInternaId)??[];if(!items.length)return shipment;
 const next=startSmallBox(shipment,id);next.caixasEmMontagem=next.caixasEmMontagem.map(b=>b.id===id?{...b,itens:items.map(i=>({...i,caixaInternaId:id}))}:b);
 return {...next,caixas:next.caixas.map(b=>b.id===outerId?{...b,itens:b.itens.filter(i=>!!i.caixaInternaId),montada:false,pesoBrutoKg:"",taraKg:""}:b)};
}

export function updateBoxContents(shipment,boxId,itens){
 const physical=items=>JSON.stringify(items.map(i=>[i.id,i.caixaInternaId||"",i.opId,i.produto,i.unidade,i.quantidade,i.unidadesEmbaladas,i.pesoUnitarioKg,i.conteudoPorEmbalagem]));
 return {...shipment,caixas:shipment.caixas.map(b=>b.id!==boxId?b:{...b,itens,...(physical(b.itens)!==physical(itens)?{montada:false,pesoBrutoKg:"",taraKg:""}:{})})};
}
