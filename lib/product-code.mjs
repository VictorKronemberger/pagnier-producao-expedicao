// Product references are text: preserve leading zeroes and never substitute database IDs.
export function productSku(product){const value=String(product?.codigo??product?.nome??"").trim();return value.length<=100?value:""}
export function sourceProductSku(item,ops=[]){if(item?.sku?.trim())return item.sku;const op=ops.find(o=>o.id===item?.opId&&o.produto===item?.produto&&o.unidade===item?.unidade);return op?.sku??""}
export function fillShipmentCodes(shipment,ops=[]){if(!shipment)return shipment;let changed=false;
 const update=box=>({...box,itens:box.itens.map(item=>{const sku=sourceProductSku(item,ops);if(item.sku?.trim()||!sku)return item;changed=true;return {...item,sku}})});
 const caixas=shipment.caixas.map(update),caixasEmMontagem=shipment.caixasEmMontagem?.map(update);
 return changed?{...shipment,caixas,...(caixasEmMontagem?{caixasEmMontagem}:{})}:shipment;
}
export function withProductCodes(snapshot,state){
 const enrich=op=>{const productId=op.productId??state.opLotSources?.[op.id]?.product,product=state.products?.[productId];
 const matches=product&&product.name===op.produto&&product.unit===op.unidade;
 const {productId:internalId,...visible}=op;return {...visible,sku:matches&&product.sku!==undefined?product.sku:op.sku??""};};
 const group=g=>({...g,ordens:g.ordens.map(enrich)});
 return {...snapshot,grupos:snapshot.grupos.map(group),semVinculo:snapshot.semVinculo.map(enrich),...(snapshot.pedidos?{pedidos:snapshot.pedidos.map(group)}:{})};
}
