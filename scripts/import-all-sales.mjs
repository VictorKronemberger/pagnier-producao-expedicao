import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {nomusGet,syncStep,publicSync} from "../lib/nomus-sync.mjs";
import {mergeSalesImport} from "../lib/sales-import.mjs";
const bridge=fileURLToPath(new URL("./local-sales-cache.py",import.meta.url));
function cache(action,value){return JSON.parse(execFileSync("python",[bridge,action],{input:value?JSON.stringify(value):undefined,encoding:"utf8",maxBuffer:50*1024*1024,windowsHide:true}))}
let baseline=cache("read").state;let state=structuredClone(baseline),requests=0,scanned=0;
const key=process.env.NOMUS_API_KEY;if(!key)throw Error("Chave indisponível.");
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function missing(kind){return kind==="clients"?new Set(Object.values(state.orders).filter(o=>!state.clients[o.clientId]).map(o=>o.clientId)).size:new Set(Object.values(state.orders).flatMap(o=>o.items).filter(i=>!state.products[i.productId]?.name).map(i=>i.productId)).size}
async function step(kind){
 const page=state.pages[kind];let rows;
 const fetcher=async(url,options)=>{
 if(options.method!=="GET")throw Error("Somente leitura.");
 for(let attempt=0;attempt<3;attempt++){
 try{await pause(attempt?60000:3000);const r=await fetch(url,{...options,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error("Nomus HTTP "+r.status);
 rows=await r.json();if(!Array.isArray(rows))throw Error("Resposta inesperada.");return Response.json(rows)}
 catch(e){console.log(JSON.stringify({tentativa:attempt+1,fase:kind,pagina:page,erro:e.name==="TimeoutError"?"Tempo esgotado":String(e.message).slice(0,80)}));if(attempt===2)throw e}
 }
 };
 const next=await syncStep({...state,nextAt:0,turn:kind==="orders"?0:kind==="clients"?2:3},key,{fetcher});
 if(!rows||next.lastChecked===state.lastChecked)throw Error("Leitura interrompida; cache anterior preservado.");
 requests++;if(kind==="orders")scanned+=rows.length;state=next;
 if(page%5===0||rows.length<50)console.log(JSON.stringify({fase:kind,pagina:page,registros:rows.length,pedidos:Object.keys(state.orders).length,...(kind!=="orders"?{cadastrosFaltantes:missing(kind)}:{})}));
 return rows.length;
}
state.pages.orders=1;state.ordersComplete=false;
for(let n=0;n<10000;n++){await step("orders");if(state.ordersComplete)break;if(n===9999)throw Error("Consulta extensa demais; cobertura não confirmada.")}
save();
if(process.argv.includes("--cadastros")){try{
for(const kind of ["products"]){
 state.pages[kind]=1;
 for(let n=0;missing(kind)>0&&n<10000;n++){const length=await step(kind);if(length<50)break;if(n===9999)throw Error("Consulta de cadastros extensa demais.")}
}
// Fetch only missing records, with IDs supplied by the orders themselves.
for(const kind of ["clients","products"]){
 const ids=kind==="clients"?[...new Set(Object.values(state.orders).filter(o=>!state.clients[o.clientId]).map(o=>o.clientId))]:[...new Set(Object.values(state.orders).flatMap(o=>o.items).filter(i=>!state.products[i.productId]?.name).map(i=>i.productId))];
 for(const id of ids){if(!Number.isInteger(id))continue;await pause(800);try{const r=await nomusGet((kind==="clients"?"clientes/":"produtos/")+id,key);requests++;if(kind==="clients")state.clients[id]=String(r.nome??"");else state.products[id]={name:String(r.descricao??r.nome??""),unit:String(r.siglaUnidadeMedida??"")}}catch{console.log(JSON.stringify({cadastroIndisponivel:kind}));}}
}
}catch{console.log("Pedidos preservados; cadastros restantes seguem na consulta periódica.");save()}
}
state.lastSalesImport={at:new Date().toISOString(),scanned,allowed:Object.keys(state.orders).length,requests};
save();
function save(){
 let saved=false;
 for(let attempt=0;attempt<5&&!saved;attempt++){const latest=cache("read");saved=cache("write",{revision:latest.revision,state:mergeSalesImport(baseline,latest.state,state),at:new Date().toISOString()}).saved}
 if(!saved)throw Error("Outra consulta atualizou o cache; importação não gravada.");
 baseline=cache("read").state;state=structuredClone(baseline);
}
const result=publicSync(cache("read").state,true);
console.log(JSON.stringify({concluido:true,pedidos:result.pedidosConsultados,identificados:result.pedidosIdentificados,paginasPedidosCompletas:result.pedidosCoberturaCompleta,requests,scanned}));
