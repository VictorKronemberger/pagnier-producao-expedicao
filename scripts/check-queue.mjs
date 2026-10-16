import assert from "node:assert/strict";
import {move,add,remove} from "../lib/queue.mjs";
import {readFileSync} from "node:fs";
assert.deepEqual(move(["a","b","c"],"c",-1),["a","c","b"]);
assert.deepEqual(move(["a","b"],"a",-1),["a","b"]);
assert.deepEqual(add(["a"],"a"),["a"]);assert.deepEqual(remove(["a","b"],"a"),["b"]);
const s=JSON.parse(readFileSync(new URL("../lib/production-snapshot.json",import.meta.url)));
// The publication snapshot must remain empty; real ERP data stays in the database.
assert.deepEqual(s,{consultadoEm:"",ordensConsultadas:0,grupos:[],semVinculo:[],pedidos:[]});
console.log("Fila sem duplicatas e dados limitados aos campos autorizados: OK");
