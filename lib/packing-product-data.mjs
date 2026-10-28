import {netWeight} from "./nomus-product-weight.mjs";
export function productDocumentData(product,op){
 if(!product||String(product.descricao??"").trim()!==op.produto.trim()||String(product.siglaUnidadeMedida??"").trim()!==op.unidade.trim())throw Error("O produto mudou no Nomus. Atualize o pedido antes de preencher.");
 const sku=String(product.codigo??product.nome??"").trim();
 const raw=String(product.ncm??"").trim(),ncm=/^[\d. ]+$/.test(raw)?raw.replace(/[. ]/g,""):"";
 return {pesoLiquidoUnitarioKg:netWeight(product.pesoLiquidoUnitario),opId:op.id,produto:op.produto,unidade:op.unidade,sku:sku.length<=100?sku:"",hsCode:/^\d{8}$/.test(ncm)?ncm:""};
}
export function documentProductId(state,op){
 const linked=op.productId??state.opLotSources?.[op.id]?.product;
 if(Number.isSafeInteger(linked)&&linked>0)return linked;
 const matches=Object.entries(state.products??{}).filter(([,p])=>p.name===op.produto&&p.unit===op.unidade&&(!op.sku||p.sku===op.sku));
 if(matches.length!==1)return null;
 const id=Number(matches[0][0]);return Number.isSafeInteger(id)&&id>0?id:null;
}
export function applyProductDocumentData(shipment,rows){
 let filled=0;
 const update=box=>({...box,itens:box.itens.map(item=>{
 const row=rows.find(row=>row.opId===item.opId&&row.produto===item.produto&&row.unidade===item.unidade);if(!row)return item;
 const patch={};for(const field of ["sku","hsCode"])if(!item[field]?.trim()&&row[field]){patch[field]=row[field];filled++}
 return Object.keys(patch).length?{...item,...patch}:item;
 })});
 const caixas=shipment.caixas.map(update),caixasEmMontagem=shipment.caixasEmMontagem?.map(update);
 return {filled,shipment:filled?{...shipment,caixas,...(caixasEmMontagem?{caixasEmMontagem}:{})}:shipment};
}
