import {newItem,decimal,assertPackingCapacity} from "./shipping.mjs";
import {productFieldsForOP,updatePackingItem} from "./packing-reuse.mjs";
import {updateBoxContents} from "./assembly-flow.mjs";
import {isMounted} from "./ready-boxes.mjs";

export function sheetItems(box,opId,inner=false){
 return box.itens.filter(item=>item.opId===opId&&(inner||!item.caixaInternaId));
}

// Apply a whole paste before checking capacity: redistributing between columns
// is atomic, and a rejected paste never saves a partial range.
export function applySheetQuantities(shipment,ops,changes,makeId=()=>crypto.randomUUID()){
 let next=shipment;
 for(const {boxId,opId,quantity} of changes){
  const op=ops.find(o=>o.id===opId);
  if(!op)throw Error("Produto não pertence a este pedido.");
  const inner=next.caixasEmMontagem?.find(b=>b.id===boxId);
  const box=inner??next.caixas.find(b=>b.id===boxId);
  if(!box)throw Error("Caixa não encontrada. Confira a montagem atual.");
  if(inner?.pronta||!inner&&isMounted(box))throw Error(box.codigo+": volte à montagem antes de editar.");
  if(!inner&&["inner","bags"].includes(next.organizacao))throw Error("Distribua as embalagens prontas nesta Caixa 40.");
  const raw=String(quantity).trim(),amount=raw===""?0:decimal(raw);
  if(amount===null)throw Error(op.nome+": use uma quantidade positiva com até três casas decimais.");
  const matches=sheetItems(box,opId,!!inner);
  if(matches.length>1)throw Error(op.nome+": há mais de um lote ou item nesta caixa. Edite no formulário para preservar os dados.");
  const item=matches[0];
  if(item&&(item.produto!==op.produto||item.unidade!==op.unidade))throw Error(op.nome+": revise o vínculo do produto no formulário.");
  if(!item&&amount===0)continue;
  if(item&&decimal(item.quantidade)===amount&&amount!==0)continue;
  let itens;
  if(amount===0)itens=box.itens.filter(i=>i.id!==item.id);
  else if(item)itens=box.itens.map(i=>i.id===item.id?updatePackingItem(i,{quantidade:raw}):i);
  else{
   if(box.itens.length>=100)throw Error(box.codigo+": limite de 100 itens atingido.");
   const id=makeId();
   const added=updatePackingItem({...newItem(id),...productFieldsForOP(next,op,id),caixaInternaId:inner?boxId:""},{quantidade:raw});
   itens=[...box.itens,added];
  }
  next=inner?{...next,caixasEmMontagem:next.caixasEmMontagem.map(b=>b.id===boxId?{...b,itens,pronta:false}:b)}:updateBoxContents(next,boxId,itens);
 }
 assertPackingCapacity(next,ops,shipment);
 return next;
}