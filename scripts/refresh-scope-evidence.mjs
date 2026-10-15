import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {applyCompanyScope} from "../lib/company-scope.mjs";
import {creationDate,publicSync} from "../lib/nomus-sync.mjs";
const evidence=JSON.parse(readFileSync('.sites-runtime/scope-evidence.json','utf8').replace(/^\uFEFF/,''));
const python=fileURLToPath(new URL('../../.venv/Scripts/python.exe',import.meta.url)),bridge=fileURLToPath(new URL('./local-sales-cache.py',import.meta.url));
const cache=(action,value)=>JSON.parse(execFileSync(python,[bridge,action],{input:value?JSON.stringify(value):undefined,encoding:'utf8',maxBuffer:50*1024*1024,windowsHide:true}));
let saved=false;
for(let attempt=0;attempt<5&&!saved;attempt++){
 const {state,revision}=cache('read');
 for(const row of evidence.orders){const o=state.orders[row.id];if(o&&creationDate(row.date))o.createdDate=creationDate(row.date);}
 const companies=new Map(evidence.ops.map(o=>[o.id,o.companyId]));
 for(const op of [...state.snapshot.grupos.flatMap(g=>g.ordens),...Object.values(state.pendingCompanyGroups??{}).flatMap(g=>g.ordens),...state.snapshot.semVinculo])if(companies.has(op.id))op.companyId=companies.get(op.id);
 for(const row of evidence.ops)if(row.companyId===2){state.excludedOps??={};state.excludedOps[row.id]=true;delete state.pendingOps[row.id];delete state.ops[row.id];}
 applyCompanyScope(state);saved=cache('write',{state,revision,at:new Date().toISOString()}).saved;
}
if(!saved)throw Error('Cache atualizado por outra sessão; não foi sobrescrito.');
const view=publicSync(cache('read').state,true);
console.log(JSON.stringify({cacheAtualizado:true,recorte:view.recortePedidos,pedidosVisiveis:view.pedidosConsultados,opsSemPedido:view.snapshot.semVinculo.length,erpAlterado:false}));
