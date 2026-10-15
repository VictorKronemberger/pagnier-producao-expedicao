import {assemblyBoxes} from "./shipping.mjs";
import {productUnitWeight} from "./product-weight.mjs";
import {scaled,weightText} from "./packing-list.mjs";
export function isUnitQuantity(item){return ["UN","UNID","UNIDADE","UNIDADES","PC","PCS","PÇ","PÇS"].includes((item.unidade??"").trim().toUpperCase())}
export function needsPackContent(item){return !!item.opId&&(!isUnitQuantity(item)||!!item.conteudoPorEmbalagem&&scaled(item.conteudoPorEmbalagem)!==1000n)}
export function contentPerPack(item){
 const explicit=scaled(item.conteudoPorEmbalagem);if(explicit!==null&&explicit>0n)return explicit;
 const unit=(item.unidade??"").trim().toUpperCase();
 if(isUnitQuantity(item))return 1000n;
 const weight=scaled(item.pesoUnitarioKg);
 if(unit==="KG")return weight;
 if(unit==="G"&&weight!==null)return weight*1000n;
 return null;
}
const quantityText=n=>weightText(n).replace(/,000$/,"").replace(/(,\d*?)0+$/,"$1");
export function updatePackingItem(item,patch){
 const next={...item,...patch},content=contentPerPack(next);
 if(Object.hasOwn(patch,"quantidade")){
 const quantity=scaled(next.quantidade);
 if(quantity!==null&&content!==null&&content>0n&&quantity%content===0n&&quantity/content<=999999n)next.unidadesEmbaladas=(quantity/content).toString();
 }else if(["unidadesEmbaladas","pesoUnitarioKg","conteudoPorEmbalagem"].some(k=>Object.hasOwn(patch,k))){
 if(/^\d{1,6}$/.test(next.unidadesEmbaladas??"")&&content!==null&&content>0n){
 const amount=content*BigInt(next.unidadesEmbaladas);
 if(amount<=999999999999n)next.quantidade=quantityText(amount);
 }
 }
 return next;
}
export function productFieldsForOP(shipment,op,exceptId){
 const existing=assemblyBoxes(shipment).flatMap(b=>b.itens).find(i=>i.id!==exceptId&&i.opId===op?.id&&i.produto===op?.produto&&i.unidade===op?.unidade);
 const old=assemblyBoxes(shipment).flatMap(b=>b.itens).find(i=>i.id===exceptId);
 const changed=old?.opId!==(op?.id??"");
 const inferred=productUnitWeight(op?.produto??"");
 const reset=changed?{origemPeso:"",quantidade:"",unidadesEmbaladas:"",pesoUnitarioKg:"",conteudoPorEmbalagem:"",lote:"",validade:"",origemLote:"",origemValidade:"",tipoEmbalagem:""}:{};
 return {...reset,...lotDefaults(changed?{...newLotItem,opId:op?.id}:old,op),...(inferred&&(changed||!old?.pesoUnitarioKg&&old?.origemPeso!=="manual")?{pesoUnitarioKg:inferred,origemPeso:"produto"}:{}),opId:op?.id??"",produto:op?.produto??"",unidade:op?.unidade??"",descricaoDocumento:existing?.descricaoDocumento||op?.produto||"",sku:existing?.sku??"",hsCode:existing?.hsCode??""};
}

export function fillProductWeights(shipment,ops){
 let changed=false;
 const update=b=>({...b,itens:b.itens.map(i=>{
 if(i.pesoUnitarioKg||i.origemPeso==="manual"||!ops.some(o=>o.id===i.opId&&o.produto===i.produto&&o.unidade===i.unidade))return i;
 const weight=productUnitWeight(i.produto);if(!weight)return i;
 changed=true;return updatePackingItem(i,{pesoUnitarioKg:weight,origemPeso:"produto",...(i.quantidade?{quantidade:i.quantidade}:{})});
 })});
 const caixas=shipment.caixas.map(update),caixasEmMontagem=shipment.caixasEmMontagem?.map(update);
 return changed?{...shipment,caixas,...(caixasEmMontagem?{caixasEmMontagem}: {})}:shipment;
}

const newLotItem={lote:"",validade:""};
export function lotDefaults(item,op){
 if(!op||op.estoque||op.id?.startsWith("stock-"))return {};
 const patch={};
 if(!item?.lote&&item?.origemLote!=="manual")Object.assign(patch,{lote:op.nome,origemLote:"ordem"});
 const lot=patch.lote??item?.lote;
 if(lot===op.nome&&op.validadeLote&&(!item?.validade||item?.origemValidade==="nomus")&&item?.origemValidade!=="manual"&&item?.validade!==op.validadeLote)Object.assign(patch,{validade:op.validadeLote,origemValidade:"nomus"});
 return patch;
}
export function fillProductLots(shipment,ops){
 let changed=false;
 const update=b=>{let boxChanged=false;const itens=b.itens.map(i=>{
  const op=ops.find(o=>o.id===i.opId&&o.produto===i.produto&&o.unidade===i.unidade);
  const patch=lotDefaults(i,op);if(!Object.keys(patch).length)return i;
  changed=true;boxChanged=true;return {...i,...patch};
 });return boxChanged?{...b,itens,...(Object.hasOwn(b,"pronta")?{pronta:false}:{})}:b};
 const caixas=shipment.caixas.map(update),caixasEmMontagem=shipment.caixasEmMontagem?.map(update);
 return changed?{...shipment,caixas,...(caixasEmMontagem?{caixasEmMontagem}:{})}:shipment;
}
