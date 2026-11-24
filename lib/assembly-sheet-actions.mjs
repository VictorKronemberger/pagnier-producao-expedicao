import {canonicalShipping,decimal} from "./shipping.mjs";
import {assemblySheetColumns,addSheetSmallBoxes,moveSheetSmallBox} from "./assembly-sheet.mjs";
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
