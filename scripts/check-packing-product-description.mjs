import assert from "node:assert/strict";
import {standardPackingDescription,packingProductDescription} from "../lib/packing-product-description.mjs";
import {inspectPacking} from "../lib/packing-list.mjs";
import {packingDefinition} from "../lib/packing-pdf.mjs";
import {packingWorkbook} from "../lib/packing-excel.mjs";
import {boxReviewKey} from "../lib/box-review.mjs";
import {fixture} from "./packing-fixture.mjs";
const expected="Dry Snuff Yawanawa Tsunu - (Smokeless Tobacco Product) 10g";
for(const produto of ["Yawanawa Tsunu 10g","Rapé Sacred Connection Yawanawa Tsunu 10g","Yawanawa Tsunu Hapé 10g",expected])assert.equal(standardPackingDescription({produto}),expected);
assert.equal(standardPackingDescription({produto:"Nukini Exemplo Hapé 1/4Oz 7,1g"}),"Dry Snuff Nukini Exemplo - (Smokeless Tobacco Product) 7.1g");
assert.equal(standardPackingDescription({produto:"Rapé Medicina Sagrada Yawanawa Tsunu 0,25kg (Maya)"}),"Dry Snuff Yawanawa Tsunu - (Smokeless Tobacco Product) 250g");
assert.equal(standardPackingDescription({produto:"Rapé Shamanic Snuff Exemplo Kg",pesoUnitarioKg:"1"}),"Dry Snuff Shamanic Exemplo - (Smokeless Tobacco Product) 1000g");
assert.equal(standardPackingDescription({produto:"Yawanawa Tsunu 10g",pesoUnitarioKg:"0,011"}),expected,"Nominal pack size takes precedence over physical weighing");
for(const label of ["Tobacco Free","Free Tobacco","Free Tabacco","Tabacco-Free","Sem Tabaco","SEM-TABACO"]){
 const item={produto:"Rapé Shamanic "+label+" Exemplo 10g",descricaoDocumento:"Descrição sem tabaco preservada"};
 assert.equal(standardPackingDescription(item),null);assert.equal(packingProductDescription(item),item.descricaoDocumento);
 assert.equal(standardPackingDescription({produto:"Yawanawa Tsunu 10g",descricaoDocumento:label}),null);
}
for(const produto of ["Cinza Exemplo 250g","Kit Rapé 10g","Kuripe Yawanawa 10g","Produto de teste 10g","Rapé Exemplo 10g 20g","Rapé Exemplo"]){assert.equal(standardPackingDescription({produto}),null)}
const {shipment,ops}=fixture();
Object.assign(ops[0],{produto:"Yawanawa Tsunu 10g",unidade:"UNID",quantidade:"2"});
Object.assign(shipment.caixas[0],{pesoBrutoKg:"1",pesoLiquidoKg:"0,020"});
Object.assign(shipment.caixas[0].itens[0],{produto:ops[0].produto,unidade:"UNID",quantidade:"2",unidadesEmbaladas:"2",pesoUnitarioKg:"0,010",descricaoDocumento:"Descrição antiga"});
const before=JSON.stringify(shipment),review=boxReviewKey(shipment,ops);
const report=inspectPacking(shipment,ops);
assert.equal(report.boxes[0].rows[0].descricaoDocumento,expected);
assert.equal(inspectPacking(shipment,ops,{physicalOnly:true}).boxes[0].rows[0].descricaoDocumento,"Descrição antiga");
assert(JSON.stringify(packingDefinition(shipment,ops)).includes(expected));
const wb=await packingWorkbook(shipment,ops);
assert.equal(wb.getWorksheet("Produtos").getCell("D2").value,expected);
assert.equal(wb.getWorksheet("Produtos").getCell("C2").value,ops[0].produto);
assert.equal(JSON.stringify(shipment),before);assert.equal(boxReviewKey(shipment,ops),review);
console.log("OK packing descriptions: names, brands, ounces, decimal grams, kg, idempotence, tobacco-free exclusions, PDF/Excel agreement, old items and unchanged physical data.");
