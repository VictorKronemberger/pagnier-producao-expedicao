import assert from "node:assert/strict";
import {move,add,remove} from "../lib/queue.mjs";
import {readFileSync} from "node:fs";
assert.deepEqual(move(["a","b","c"],"c",-1),["a","c","b"]);
assert.deepEqual(move(["a","b"],"a",-1),["a","b"]);
assert.deepEqual(add(["a"],"a"),["a"]);assert.deepEqual(remove(["a","b"],"a"),["b"]);
const s=JSON.parse(readFileSync(new URL("../lib/production-snapshot.json",import.meta.url)));
assert.equal(s.ordensConsultadas,800);assert.equal(s.grupos.length,10);
assert.equal(new Set(s.grupos.map(g=>g.id)).size,s.grupos.length);
for(const g of s.grupos){assert.deepEqual(Object.keys(g).sort(),["cliente","codigo","id","ordens"]);assert.equal(g.id,g.codigo);}
for(const o of [...s.grupos.flatMap(g=>g.ordens),...s.semVinculo]){assert.deepEqual(Object.keys(o).sort(),["id","nome","produto","quantidade","unidade"]);assert.equal(o.id,o.nome);assert(o.quantidade);assert(o.unidade);}
console.log("Fila sem duplicatas e dados limitados aos campos autorizados: OK");
