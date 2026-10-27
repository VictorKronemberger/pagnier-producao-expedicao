// Keep the ERP classification alongside names; missing classification never implies resale.
export function catalogProduct(product){return {name:String(product.descricao??product.nome??""),unit:String(product.siglaUnidadeMedida??""),group:String(product.nomeGrupoProduto??""),type:String(product.nomeTipoProduto??"")}}
