import {execFileSync} from "node:child_process";
import {applyCompanyScope,scopeBoard} from "../lib/company-scope.mjs";
import {publicSync} from "../lib/nomus-sync.mjs";
const python=new URL("../../.venv/Scripts/python.exe",import.meta.url),bridge=new URL("./local-sales-cache.py",import.meta.url);
import {fileURLToPath} from "node:url";
const cache=(action,input)=>JSON.parse(execFileSync(fileURLToPath(python),[fileURLToPath(bridge),action],{input:input?JSON.stringify(input):undefined,encoding:"utf8",maxBuffer:50*1024*1024,windowsHide:true}));
let saved=false;
for(let n=0;n<5&&!saved;n++){
 const current=cache("read"),state=applyCompanyScope(current.state);
 saved=cache("write",{state,revision:current.revision,at:new Date().toISOString()}).saved;
}
if(!saved)throw Error("O cache mudou durante a correção; não foi sobrescrito.");
const state=applyCompanyScope(cache("read").state),projected=publicSync(state,true);
const base="http://127.0.0.1:5173";
const login=await fetch(base+"/signin-with-chatgpt?return_to=/",{redirect:"manual"});
const cookie=login.headers.getSetCookie().map(v=>v.split(";")[0]).join("; ");
const response=await fetch(base+"/api/board",{headers:{cookie}});if(!response.ok)throw Error("Painel indisponível: "+response.status);
const view=await response.json(),forbidden=new Set(Object.keys(state.hiddenOrderCodes));
const exposed=[...view.snapshot.grupos,...(view.snapshot.pedidos??[])].filter(g=>forbidden.has(g.id));
const boardLeaks=Object.keys(view.board.details).filter(id=>forbidden.has(id));
if(exposed.length||boardLeaks.length)throw Error("Pedidos fora do escopo ainda presentes na API do painel.");
console.log(JSON.stringify({cacheCorrigido:saved,pedidosPermitidos:projected.pedidosConsultados,pedidosExcluidos:Object.keys(state.excludedOrders).length,empresaPendente:projected.pedidosEmpresaPendente,pedidosForaDoEscopoNaAPI:exposed.length,anotacoesForaDoEscopoExpostas:boardLeaks.length,gruposVisiveis:view.snapshot.grupos.length,erpAlterado:false}));
