import assert from "node:assert/strict";
import {emptyShipment,newBox,newItem,normalizeShipment,canonicalShipping} from "../lib/shipping.mjs";
import {inspectBoxReview,confirmBoxReview} from "../lib/box-review.mjs";
const ops=[{id:"OP1",nome:"OP1",produto:"Produto 10g",quantidade:"100",unidade:"UN"}];
const item={...newItem("item1"),opId:"OP1",produto:"Produto 10g",unidade:"UN",quantidade:"80",unidadesEmbaladas:"80",pesoUnitarioKg:"0,010"};
const box={...newBox([],"box1"),comprimentoCm:"30",larguraCm:"20",alturaCm:"10",pesoBrutoKg:"1",itens:[item]};
const value={...emptyShipment(),caixas:[box]};
assert.equal(inspectBoxReview(undefined,ops).reviewed,false);
assert.equal(inspectBoxReview(value,ops).issues.length,0,"physical review does not require invoice, address or HS Code");
assert.throws(()=>confirmBoxReview(value,ops,"","2026-10-14T12:00:00.000Z"),/responsável/);
const confirmed=confirmBoxReview(value,ops,"Pedro","2026-10-14T12:00:00.000Z");
assert(inspectBoxReview(confirmed,ops).reviewed,"partial remittance may be checked");
const saved=normalizeShipment(JSON.parse(JSON.stringify(confirmed)),ops);
assert(inspectBoxReview(saved,ops).reviewed,"confirmation survives server normalization and reload");
assert.deepEqual(canonicalShipping(saved),canonicalShipping(confirmed));
const change=fn=>{const copy=structuredClone(saved);fn(copy);return copy};
for(const fn of [s=>s.caixas[0].pesoBrutoKg="2",s=>s.caixas[0].larguraCm="21",s=>s.caixas[0].itens[0].quantidade="79",s=>s.caixas[0].itens[0].lote="outro",s=>s.caixas.push(newBox(s.caixas,"box2")),s=>s.caixas=[]]){
 assert.equal(inspectBoxReview(change(fn),ops).reviewed,false,"physical change cancels confirmation");
}
assert.equal(inspectBoxReview(saved,[{...ops[0],quantidade:"80"}]).reviewed,false,"Nomus quantity change cancels confirmation even if allocation is still valid");
assert.equal(inspectBoxReview(saved,[]).reviewed,false,"missing OP cancels confirmation");
assert.equal(inspectBoxReview(saved,[...ops,{...ops[0],id:"OP2"}]).reviewed,false,"new OP requires reviewing allocation");
const documents=change(s=>{s.packing.invoiceNumero="INV1";s.rastreio="TRACK1";s.caixas[0].itens[0].hsCode="123456";s.caixas[0].itens[0].descricaoDocumento="Product";s.caixas[0].itens[0].sku="SKU1"});
assert(inspectBoxReview(documents,ops).reviewed,"document and tracking edits preserve physical confirmation");
assert.equal(inspectBoxReview(change(s=>s.caixas[0].pesoBrutoKg="0,5"),ops).reviewed,false);
assert.throws(()=>confirmBoxReview(change(s=>s.caixas[0].pesoBrutoKg="0,5"),ops,"Pedro","2026-10-14T12:00:00.000Z"),/peso bruto menor/);
assert(inspectBoxReview(change(s=>s.agrupamento={pedidos:["PV1"],titularKey:"a".repeat(64),titularNome:"Titular",confirmadoEm:"2026-10-14T12:00:00.000Z"}),ops).reviewed,"recipient metadata does not alter physical boxes");
console.log("OK conferência: montagem parcial, pesos, persistência, mudanças físicas/OPs e edição documental independente.");
