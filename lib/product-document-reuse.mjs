import {assemblyBoxes} from "./shipping.mjs";
const fields=["descricaoDocumento","sku","hsCode","tipoEmbalagem"];
const key=item=>JSON.stringify([item.opId,item.produto,item.unidade]);
export function reuseProductDocuments(shipment){
 const sources=new Map();
 for(const item of assemblyBoxes(shipment).flatMap(b=>b.itens)){
  if(!item.opId)continue;const group=sources.get(key(item))??Object.fromEntries(fields.map(f=>[f,new Set()]));
  for(const f of fields)if(item[f]?.trim())group[f].add(item[f].trim());sources.set(key(item),group);
 }
 let filled=0,items=0;
 const update=box=>({...box,itens:box.itens.map(item=>{const group=sources.get(key(item));if(!group)return item;const patch={};for(const f of fields)if(!item[f]?.trim()&&group[f].size===1){patch[f]=[...group[f]][0];filled++}if(!Object.keys(patch).length)return item;items++;return {...item,...patch}})});
 const next={...shipment,caixas:shipment.caixas.map(update),...(shipment.caixasEmMontagem?{caixasEmMontagem:shipment.caixasEmMontagem.map(update)}:{})};
 return {shipment:filled?next:shipment,filled,items};
}
