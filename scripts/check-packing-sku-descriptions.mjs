import assert from "node:assert/strict";
import {skuPackingDescription} from "../lib/packing-sku-descriptions.mjs";
import {standardPackingDescription,packingProductDescription} from "../lib/packing-product-description.mjs";
import {inspectPacking} from "../lib/packing-list.mjs";
import {packingDefinition} from "../lib/packing-pdf.mjs";
import {packingWorkbook} from "../lib/packing-excel.mjs";
import {boxReviewKey} from "../lib/box-review.mjs";
import {fixture} from "./packing-fixture.mjs";
const cases=[
 ["KUTP2900","Bamboo Kuripe Simply Black - (Indigenous handicraft used for decoration)"],
 ["KAYA0610","Dry Snuff Yawanawa  Tsunu - (Smokeless Tobacco Product) 10g"],
 ["NIHK1700","Natural Incense - (Used for incense confection, non-flammable)"],
 ["TETP0100","Bamboo Tepi Tetê Pawã Blue - (Indigenous handicraft used for decoration)"]
];
for(const [sku,description] of cases){
 assert.equal(skuPackingDescription(sku),description);
 assert.equal(skuPackingDescription(" "+sku.toLowerCase()+" "),description);
 assert.equal(standardPackingDescription({sku,produto:"Nome original",descricaoDocumento:"Descrição antiga"}),description);
 const {shipment,ops}=fixture();shipment.caixas[0].itens[0].sku=sku;
 const before=JSON.stringify(shipment),review=boxReviewKey(shipment,ops);
 assert.equal(inspectPacking(shipment,ops).boxes[0].rows[0].descricaoDocumento,description);
 assert(JSON.stringify(packingDefinition(shipment,ops)).includes(description));
 const wb=await packingWorkbook(shipment,ops);
 assert.equal(wb.getWorksheet("Produtos").getCell("B2").value,description);
 assert(!JSON.stringify(wb.getWorksheet("Produtos").model).includes(sku));
 assert.equal(JSON.stringify(shipment),before);assert.equal(boxReviewKey(shipment,ops),review);
}
for(const sku of [undefined,"","UNKNOWN","KUTP","KUTP2900-extra","__proto__","constructor","toString"]){assert.equal(skuPackingDescription(sku),null)}
assert.equal(packingProductDescription({sku:"UNKNOWN",produto:"Kuripe",descricaoDocumento:"Manual"}),"Manual");
assert.equal(packingProductDescription({sku:"UNKNOWN",produto:"Yawanawa Tsunu 10g"}),"Dry Snuff Yawanawa Tsunu - (Smokeless Tobacco Product) 10g");
assert.equal(packingProductDescription({sku:"KAYA0610",produto:"Rapé Tobacco Free 10g",descricaoDocumento:"Sem tabaco"}),"Sem tabaco");
assert.equal(packingProductDescription({sku:"NIHK1700",produto:"Rapé Tobacco Free 10g"}),cases[2][1]);
console.log("OK SKU descriptions: exact lookup, casing/spacing, unknown codes, supplied wording, tobacco-free protection, PDF/Excel, original data and physical review preserved.");
