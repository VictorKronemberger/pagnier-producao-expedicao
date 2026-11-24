import {canonicalShipping,decimal} from "./shipping.mjs";
import {assemblySheetColumns,addSheetSmallBoxes,moveSheetSmallBox,createSheetOuter} from "./assembly-sheet.mjs";
import {applySheetQuantities} from "./packing-sheet.mjs";

// A batch either succeeds in full or leaves the original shipment untouched.
export function fillSheetSmallBoxes(s,ops,targetId,count,opId,quantity,tipo,makeId=()=>crypto.randomUUID()){
 if((decimal(quantity)??0)<=0)throw Error("Informe a quantidade de produto em cada embalagem.");
 const previous=new Set(assemblySheetColumns(s).map(b=>b.key));
 const next=addSheetSmallBoxes(s,targetId,count,tipo,makeId);
 const added=assemblySheetColumns(next).filter(b=>!previous.has(b.key));
 return applySheetQuantities(next,ops,added.map(b=>({boxId:b.id,parentId:b.parentId,opId,quantity})),makeId);
}
export function moveSheetSmallBoxes(s,keys,targetId,makeId=()=>crypto.randomUUID()){
 const unique=[...new Set(keys)],columns=assemblySheetColumns(s);
 if(!unique.length)throw Error("Selecione as embalagens que deseja mover.");
 const selected=unique.map(key=>columns.find(b=>b.key===key));
 if(selected.some(b=>!b?.inner))throw Error("Uma embalagem mudou. Confira a seleção novamente.");
 return selected.reduce((next,b)=>moveSheetSmallBox(next,b.id,b.parentId,targetId,makeId),s);
}
function assembly(s){const c=canonicalShipping(s);return {caixas:c.caixas,caixasEmMontagem:c.caixasEmMontagem??[]}}
function fingerprint(s){return JSON.stringify({organizacao:s.organizacao??"",agrupamento:s.agrupamento??null,...assembly(s)})}
export function sheetUndoEntry(before,after){return fingerprint(before)===fingerprint(after)?null:{before:assembly(before),after:fingerprint(after)}}
export function canUndoSheet(s,entry){return !!entry&&fingerprint(s)===entry.after}
export function undoSheet(s,entry){
 if(!canUndoSheet(s,entry))throw Error("A montagem mudou desde esta ação. Desfazer foi desativado para preservar as alterações mais recentes.");
 // Keep the latest order, document and transport fields; restore only the assembly.
 return {...s,...structuredClone(entry.before)};
}

// The editable placeholder is never persisted: first positive quantity creates
// both levels and their contents in one transaction, including multi-row paste.
export function applySheetWithNewSmallBox(s,ops,changes,draft,model,makeId=()=>crypto.randomUUID()){
 if(!draft)return applySheetQuantities(s,ops,changes,makeId);
 const isDraft=c=>c.boxId===draft.innerId&&c.parentId===draft.outerId;
 const pending=changes.filter(isDraft);
 if(!pending.length)return applySheetQuantities(s,ops,changes,makeId);
 const existing=s.caixas.find(b=>b.id===draft.outerId);
 if(existing?.caixasInternas?.some(b=>b.id===draft.innerId))return applySheetQuantities(s,ops,changes,makeId);
 for(const c of pending){if(String(c.quantity).trim()!==""&&decimal(c.quantity)===null)throw Error("Use uma quantidade positiva com até três casas decimais.");if(!ops.some(op=>op.id===c.opId))throw Error("Produto não pertence a este pedido.")}
 if(!pending.some(c=>(decimal(c.quantity)??0)>0))return applySheetQuantities(s,ops,changes.filter(c=>!isDraft(c)),makeId);
 let next=s;
 if(!existing){if(!draft.newOuter)throw Error("Caixa 40 de destino não encontrada. Selecione o destino novamente.");next=createSheetOuter(next,model,()=>draft.outerId)}
 next=addSheetSmallBoxes(next,draft.outerId,1,draft.tipo,()=>draft.innerId);
 return applySheetQuantities(next,ops,changes,makeId);
}
