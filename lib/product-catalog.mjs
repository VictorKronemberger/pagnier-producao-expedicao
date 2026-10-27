import {productSku} from "./product-code.mjs";
// Keep the ERP classification alongside names; missing classification never implies resale.
export function catalogProduct(product){return {sku:productSku(product),name:String(product.descricao??product.nome??""),unit:String(product.siglaUnidadeMedida??""),group:String(product.nomeGrupoProduto??""),type:String(product.nomeTipoProduto??"")}}
