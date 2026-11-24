import {newInnerBox,assertPackingCapacity} from "./shipping.mjs";
import {boxFromModel} from "./box-models.mjs";
import {startSmallBox,smallBoxIssue} from "./assembly-flow.mjs";
import {assemblyMode,assemblyModeIssue} from "./assembly-mode.mjs";
import {isMounted} from "./ready-boxes.mjs";

// A column identifies its parent as well: historical shipments may reuse an inner ID.
export function assemblySheetColumns(s){
 const columns=(s.caixasEmMontagem??[]).map(b=>({...b,key:"prepared/"+b.id,inner:true,locked:!!b.pronta}));
 for(const outer of s.caixas){
  if(["direct","mixed"].includes(assemblyMode(s))||outer.itens.some(i=>!i.caixaInternaId))columns.push({id:outer.id,key:"outer/"+outer.id,codigo:outer.codigo,itens:outer.itens.filter(i=>!i.caixaInternaId),inner:false,locked:isMounted(outer)});
  for(const b of outer.caixasInternas??[])columns.push({...b,key:outer.id+"/"+b.id,parentId:outer.id,itens:outer.itens.filter(i=>i.caixaInternaId===b.id),inner:true,locked:isMounted(outer)});
 }
 return columns;
}
export function createSheetOuter(s,model,makeId=()=>crypto.randomUUID()){
 if(s.caixas.length>=100)throw Error("Limite de 100 Caixas 40 atingido.");
 return {...s,caixas:[...s.caixas,{...boxFromModel(s.caixas,makeId(),model),montada:false}]};
}
function clearWeight(b){return {...b,montada:false,pesoBrutoKg:"",taraKg:""}}
export function moveSheetSmallBox(s,boxId,parentId,targetId,makeId=()=>crypto.randomUUID()){
 const source=parentId?s.caixas.find(b=>b.id===parentId):null;
 const inner=parentId?source?.caixasInternas?.find(b=>b.id===boxId):s.caixasEmMontagem?.find(b=>b.id===boxId);
 if(!inner)throw Error("Embalagem não encontrada.");
 if((parentId||"")===(targetId||""))return s;
 if(source&&isMounted(source))throw Error("Reabra a Caixa 40 antes de mover a embalagem.");
 const target=targetId?s.caixas.find(b=>b.id===targetId):null;
 if(targetId&&!target)throw Error("Caixa 40 de destino não encontrada.");
 if(target&&isMounted(target))throw Error("Reabra a Caixa 40 de destino antes de adicionar embalagens.");
 const items=source?source.itens.filter(i=>i.caixaInternaId===boxId):inner.itens;
 if(target&&((target.caixasInternas?.length??0)>=100||target.itens.length+items.length>100))throw Error("Esta Caixa 40 atingiu o limite de 100 embalagens ou itens.");
 if(!target&&(s.caixasEmMontagem?.length??0)>=100)throw Error("Limite de 100 embalagens sem Caixa 40 atingido.");
 const siblings=target?(target.caixasInternas??[]):[...(s.caixasEmMontagem??[]),...s.caixas];
 const id=siblings.some(b=>b.id===boxId)?makeId():boxId;
 const codigo=siblings.some(b=>b.codigo.toLowerCase()===inner.codigo.toLowerCase())?newInnerBox({caixasInternas:siblings},id,inner.tipo).codigo:inner.codigo;
 const meta={id,codigo,...(inner.tipo==="bag"?{tipo:"bag"}:{})},itens=items.map(i=>({...i,caixaInternaId:id}));
 const next={...s,caixasEmMontagem:(s.caixasEmMontagem??[]).filter(b=>parentId||b.id!==boxId),caixas:s.caixas.map(b=>b.id===parentId?clearWeight({...b,caixasInternas:b.caixasInternas.filter(i=>i.id!==boxId),itens:b.itens.filter(i=>i.caixaInternaId!==boxId)}):b.id===targetId?clearWeight({...b,caixasInternas:[...(b.caixasInternas??[]),meta],itens:[...b.itens,...itens]}):b)};
 if(!target)next.caixasEmMontagem.push({...meta,itens,pronta:false});
 const issue=assemblyModeIssue(next,assemblyMode(s));if(issue)throw Error(issue);
 return next;
}
export function addSheetSmallBoxes(s,targetId,count=1,tipo,makeId=()=>crypto.randomUUID()){
 if(!Number.isInteger(count)||count<1||count>100)throw Error("Informe de 1 a 100 embalagens.");
 let next=s;
 if(targetId){
  const target=s.caixas.find(b=>b.id===targetId);
  if(!target)throw Error("Caixa 40 de destino não encontrada.");
  if(isMounted(target))throw Error("Reabra a Caixa 40 antes de adicionar embalagens.");
  if((target.caixasInternas?.length??0)+count>100)throw Error("Esta Caixa 40 atingiu o limite de 100 embalagens.");
  const siblings=[...(s.caixasEmMontagem??[]),...s.caixas.flatMap(b=>b.caixasInternas??[])],added=[];
  for(let i=0;i<count;i++){const inner=newInnerBox({caixasInternas:siblings},makeId(),tipo);siblings.push(inner);added.push(inner)}
  next={...s,caixas:s.caixas.map(b=>b.id===targetId?clearWeight({...b,caixasInternas:[...(b.caixasInternas??[]),...added]}):b)};
 }else for(let i=0;i<count;i++)next=startSmallBox(next,makeId(),tipo);
 const issue=assemblyModeIssue(next,assemblyMode(s));if(issue)throw Error(issue);
 return next;
}
export function duplicateSheetSmallBox(s,column,ops,makeId=()=>crypto.randomUUID()){
 const source=assemblySheetColumns(s).find(b=>b.key===column.key);
 if(!source?.inner)throw Error("Selecione uma caixa menor ou bag.");
 const issue=smallBoxIssue(source,ops);if(issue)throw Error(issue);
 const id=makeId();let next=startSmallBox(s,id,source.tipo);
 next={...next,caixasEmMontagem:next.caixasEmMontagem.map(b=>b.id===id?{...b,itens:source.itens.map(i=>({...i,id:makeId(),caixaInternaId:id}))}:b)};
 if(source.parentId)next=moveSheetSmallBox(next,id,undefined,source.parentId,makeId);
 assertPackingCapacity(next,ops,s);return next;
}
export function removeEmptySheetSmallBox(s,column){
 const source=assemblySheetColumns(s).find(b=>b.key===column.key);
 if(!source?.inner||source.itens.length)throw Error("Só é possível remover aqui uma embalagem vazia.");
 if(source.locked)throw Error("Reabra a montagem antes de remover a embalagem.");
 return source.parentId?{...s,caixas:s.caixas.map(b=>b.id===source.parentId?clearWeight({...b,caixasInternas:b.caixasInternas.filter(i=>i.id!==source.id)}):b)}:{...s,caixasEmMontagem:s.caixasEmMontagem.filter(b=>b.id!==source.id)};
}