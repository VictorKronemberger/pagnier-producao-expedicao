import {scaled,weightText} from "./packing-list.mjs";
import {isUnitQuantity} from "./packing-reuse.mjs";
import {updateBoxContents} from "./assembly-flow.mjs";
export function netWeight(value){
 const weight=scaled(typeof value==="string"?value.trim():value);
 return weight!==null&&weight>0n?weightText(weight):"";
}
// ERP weight is per sales unit; other units require an explicit pack conversion.
export function packWeightFactor(item){
 const explicit=scaled(item.conteudoPorEmbalagem);
 return explicit!==null&&explicit>0n?explicit:isUnitQuantity(item)?1000n:null;
}
export function needsNomusWeight(item){
 return item.origemPeso!=="manual"&&(!netWeight(item.pesoUnitarioKg)||item.origemPeso==="produto")&&packWeightFactor(item)!==null;
}
export function applyNomusWeights(shipment,rows){
 let filled=0;
 const update=item=>{
  if(!needsNomusWeight(item))return item;
  const row=rows.find(row=>row.opId===item.opId&&row.produto===item.produto&&row.unidade===item.unidade);
  const weight=scaled(row?.pesoLiquidoUnitarioKg),factor=packWeightFactor(item);
  if(weight===null||weight<=0n||factor===null||weight*factor%1000n!==0n)return item;
  const result=netWeight(weightText(weight*factor/1000n));if(!result)return item;
  filled++;return {...item,pesoUnitarioKg:result,origemPeso:"nomus"};
 };
 let next=shipment;
 for(const box of shipment.caixas){const itens=box.itens.map(update);if(itens.some((item,i)=>item!==box.itens[i]))next=updateBoxContents(next,box.id,itens)}
 const caixasEmMontagem=shipment.caixasEmMontagem?.map(box=>{const itens=box.itens.map(update);return itens.some((item,i)=>item!==box.itens[i])?{...box,itens,pronta:false}:box});
 return {filled,shipment:filled?{...next,...(caixasEmMontagem?{caixasEmMontagem}:{})}:shipment};
}
