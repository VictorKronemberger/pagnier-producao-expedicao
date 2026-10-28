import {scaled,weightText} from "./packing-list.mjs";
export function contentWeights(items){
 const rows=items.map(item=>{
  const weight=scaled(item.pesoUnitarioKg);
  const units=/^\d{1,6}$/.test(item.unidadesEmbaladas??"")?Number(item.unidadesEmbaladas):0;
  const net=weight!==null&&weight>0n&&units>0?weight*BigInt(units):null;
  return {item,weight:weight!==null&&weight>0n?weight:null,units,net};
 });
 const missing=rows.filter(row=>row.net===null).length;
 const total=rows.reduce((sum,row)=>sum+(row.net??0n),0n);
 return {rows,total,missing,complete:rows.length>0&&!missing};
}
export function contentWeightLabel(items){
 const result=contentWeights(items);
 return result.complete?weightText(result.total)+" kg":result.rows.length>result.missing?weightText(result.total)+" kg (parcial)":"Peso pendente";
}
