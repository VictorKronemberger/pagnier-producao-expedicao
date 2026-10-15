import {productUnitWeight} from "./product-weight.mjs";
// Include sales items as well as OPs: an unreleased small item must prevent the shortcut.
export function shipmentProducts(shipment,owner,groups){
 const ids=shipment?.agrupamento?.pedidos??[owner];
 return ids.flatMap(id=>{const g=groups.find(g=>g.id===id);if(!g)return [""];
 const names=[...(g.itens??[]),...(g.ordens??[])].map(i=>i.produto??"");return names.length?names:[""]});
}
export function directBoxOnly(products){return products.length>0&&products.every(name=>["0,250","0,500","1,000"].includes(productUnitWeight(name)))}
export function hasInnerBoxes(s){return !!s.caixasEmMontagem?.length||!!s.caixas?.some(b=>b.caixasInternas?.length||b.itens?.some(i=>i.caixaInternaId))}
export function applyDirectBoxRule(s,products){
 if(!directBoxOnly(products))return s;
 // Existing physical assemblies remain accessible; new products go directly in the outer box.
 const mode=hasInnerBoxes(s)?"mixed":"direct";
 return s.organizacao===mode?s:{...s,organizacao:mode};
}
