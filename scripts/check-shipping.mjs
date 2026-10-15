import assert from "node:assert/strict";
import {emptyShipment,newBox,newItem,normalizeShipment,analyzeShipment,canonicalShipping} from "../lib/shipping.mjs";
const ops=[{id:"OP1",nome:"OP1",produto:"Produto1",quantidade:"10",unidade:"UN"},{id:"OP2",nome:"OP2",produto:"Produto2",quantidade:"2",unidade:"KG"}];
const line=(id,op,q)=>({...newItem(id),opId:op.id,produto:op.produto,unidade:op.unidade,quantidade:q});
const box=(id,code,items)=>({...newBox([],id),codigo:code,comprimentoCm:"40",larguraCm:"30",alturaCm:"20",pesoBrutoKg:"5",pesoLiquidoKg:"4",itens:items});
const shipment={...emptyShipment(),dataEnvio:"2026-03-25",rastreio:"RA123",caixas:[box("b1","CX-001",[line("i1",ops[0],"4"),line("i2",ops[1],"2")]),box("b2","CX-002",[line("i3",ops[0],"6")])]};
assert.deepEqual(canonicalShipping(),emptyShipment());
assert.deepEqual(normalizeShipment(shipment,ops),shipment);
const summary=analyzeShipment(shipment,ops);
assert.equal(summary.bruto,10);assert.equal(summary.volume,0.048);assert.equal(summary.issues.length,0);
assert.equal(summary.allocation[0].restante,0);
assert.deepEqual(summary.quantidades,[{unidade:"UN",quantidade:10},{unidade:"KG",quantidade:2}]);
const draft=structuredClone(shipment);draft.caixas[0].pesoLiquidoKg="6";draft.caixas[0].itens[0].quantidade="5";draft.caixas[0].alturaCm="";
assert.equal(analyzeShipment(draft,ops).issues.length,3);
for(const alter of [s=>s.caixas[0].pesoBrutoKg="-1",s=>s.dataEnvio="2026-02-30",s=>s.caixas[1].id="b1",s=>s.caixas[0].itens[0].opId="EXTERNA"]){const bad=structuredClone(shipment);alter(bad);assert.throws(()=>normalizeShipment(bad,ops))}
assert.deepEqual(normalizeShipment(shipment,[],shipment),shipment);
const badHistory=structuredClone(shipment);badHistory.caixas[0].itens[0].produto="OUTRO";assert.throws(()=>normalizeShipment(badHistory,[],shipment));
assert.doesNotThrow(()=>normalizeShipment({...emptyShipment(),caixas:[newBox([],"draft")]},ops));
console.log("OK: caixas, divisão por OP, unidades, totais, pendências, validação e histórico preservado.");
