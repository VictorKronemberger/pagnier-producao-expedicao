import assert from "node:assert/strict";
import {fixture} from "./packing-fixture.mjs";
import {reuseProductDocuments} from "../lib/product-document-reuse.mjs";
import {boxReviewKey} from "../lib/box-review.mjs";
const {shipment,ops}=fixture(),line=shipment.caixas[0].itens[0];shipment.caixas.push({...structuredClone(shipment.caixas[0]),id:"box2",codigo:"CX-002",itens:[{...line,id:"second",hsCode:"",sku:"",tipoEmbalagem:"",descricaoDocumento:"Descrição revisada",lote:"LOTE-MANUAL"}]});
const before=JSON.stringify(shipment),review=boxReviewKey(shipment,ops),plan=reuseProductDocuments(shipment);assert.equal(plan.filled,3);assert.equal(plan.items,1);assert.equal(plan.shipment.caixas[1].itens[0].hsCode,"000000");assert.equal(plan.shipment.caixas[1].itens[0].descricaoDocumento,"Descrição revisada");assert.equal(plan.shipment.caixas[1].itens[0].lote,"LOTE-MANUAL");assert.equal(boxReviewKey(plan.shipment,ops),review);assert.equal(JSON.stringify(shipment),before);assert.equal(reuseProductDocuments(plan.shipment).filled,0);
const conflict=structuredClone(shipment);conflict.caixas[0].itens.push({...line,id:"other",hsCode:"111111"});assert.equal(reuseProductDocuments(conflict).shipment.caixas[1].itens[0].hsCode,"");
const other=structuredClone(shipment);other.caixas[1].itens[0].opId="OUTRA-OP";assert.equal(reuseProductDocuments(other).filled,0);
console.log("OK dados repetidos: completa apenas campos vazios da mesma OP/produto/unidade; preserva correções, lotes, quantidades e conferência; valores conflitantes não são propagados.");
