import {build} from "esbuild";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
import path from "node:path";
const dir=path.resolve(".sites-runtime/delete-box-qa");mkdirSync(dir,{recursive:true});
const fixture="\nimport React,{useState} from \"react\";import {createRoot} from \"react-dom/client\";\nimport ShipmentEditor from \"./app/shipment-editor\";\nimport {emptyShipment,newItem,newBox} from \"./lib/shipping.mjs\";\nconst op={id:\"op\",nome:\"OP teste\",produto:\"Produto teste 50g\",unidade:\"UNID\",quantidade:\"1000\"};\nconst item=(id,inner=\"\",q=\"10\")=>({...newItem(id),caixaInternaId:inner,opId:\"op\",produto:op.produto,unidade:\"UNID\",quantidade:q,unidadesEmbaladas:q,pesoUnitarioKg:\"0,050\",origemPeso:\"produto\",lote:op.nome,origemLote:\"ordem\"});\nconst small=(id)=>({id,codigo:\"Menor \"+id,pronta:true,itens:[item(\"item-\"+id,id)]});\nfunction scenario(kind){const outer={...newBox([],\"outer\"),montada:false};let s={...emptyShipment(),organizacao:\"inner\",caixas:[outer],caixasEmMontagem:[small(\"a\"),small(\"b\")]};\nif(kind===\"capacity\"){outer.itens=Array.from({length:100},(_,i)=>item(\"full-\"+i,\"\",\"1\"));s.organizacao=\"mixed\";}\nif(kind===\"return\"){s.caixasEmMontagem=Array.from({length:100},(_,i)=>({...small(\"staged-\"+i),itens:[],pronta:false}));outer.caixasInternas=[{id:\"placed\",codigo:\"Menor colocada\"}];outer.itens=[item(\"placed-item\",\"placed\")];}\nif(kind===\"finalize\"){s.caixasEmMontagem=[];outer.itens=[item(\"excess\",\"\",\"1001\")];s.organizacao=\"direct\";}\nreturn s;}\nfunction App(){const [value,setValue]=useState(()=>scenario(\"flow\"));const [step,setStep]=useState(\"outer\");const [version,setVersion]=useState(0);window.qa=value;window.resetScenario=kind=>{setValue(scenario(kind));setStep(\"outer\");setVersion(v=>v+1)};return <ShipmentEditor key={version} value={value} ops={[op]} onChange={setValue} assemblyStep={step} onAssemblyStepChange={setStep}/>;}\ncreateRoot(document.getElementById(\"root\")).render(<App/>);\n";
await build({stdin:{contents:fixture,resolveDir:process.cwd(),loader:"tsx"},bundle:true,write:true,outfile:path.join(dir,"app.js"),jsx:"automatic",platform:"browser"});
const css=readFileSync("app/theme.css","utf8")+readFileSync("app/globals.css","utf8").replace(/@import[^;]+;/g,"");
const server=createServer((req,res)=>{if(req.url==="/app.js"){res.setHeader("Content-Type","text/javascript");res.end(readFileSync(path.join(dir,"app.js")));}else{res.setHeader("Content-Type","text/html");res.end('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css+' body{padding:24px;background:#eef2eb}#root{max-width:1000px;margin:auto}@media(max-width:480px){body{padding:10px}}</style><div id="root"></div><script src="/app.js"></script>');}});
await new Promise(r=>server.listen(5189,"127.0.0.1",r));
const browser=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless","--disable-gpu","--no-first-run","--remote-debugging-port=9244","--user-data-dir="+path.join(dir,"profile"),"about:blank"],{windowsHide:true,stdio:"ignore"});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let socket;
try{
let pages;for(let i=0;i<60;i++){try{pages=await(await fetch("http://127.0.0.1:9244/json")).json();if(pages.some(p=>p.type==="page"))break}catch{}await pause(200)}
socket=new WebSocket(pages.find(p=>p.type==="page").webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
let id=0;const pending=new Map();
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result)}};
async function evaluate(expression){const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function until(expression){for(let i=0;i<60;i++){if(await evaluate(expression))return;await pause(100)}throw Error(expression)}



await send("Page.navigate",{url:"http://127.0.0.1:5189"});
await until('document.querySelector(".small-picker-list")!==null');
async function clickText(text){await evaluate('(()=>{const el=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+JSON.stringify(text)+');if(!el)throw Error("Missing "+'+JSON.stringify(text)+');el.click()})()');await pause(100)}
async function type(value){await evaluate('(()=>{const el=document.querySelector(".delete-box-confirmation input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event("input",{bubbles:true}));})()');await pause(100)}
await evaluate('document.querySelector("[data-assembly-step=small]").click()');await pause(100);
await clickText("Excluir caixa");
assert(await evaluate('document.querySelector(".delete-box-submit").disabled'));
await type("excluir");assert(await evaluate('document.querySelector(".delete-box-submit").disabled'));
await type("EXCLUIR ");assert(await evaluate('document.querySelector(".delete-box-submit").disabled'));
await type("EXCLUIR");assert(!(await evaluate('document.querySelector(".delete-box-submit").disabled')));
await clickText("Cancelar");assert.equal(await evaluate('window.qa.caixasEmMontagem.length'),2);
await clickText("Excluir caixa");assert.equal(await evaluate('document.querySelector(".delete-box-confirmation input").value'),"");
await type("EXCLUIR");await clickText("Confirmar exclusão");await until('window.qa.caixasEmMontagem.length===1');
assert.equal(await evaluate('window.qa.caixasEmMontagem[0].id'),"b");
await evaluate('document.querySelector("[data-assembly-step=outer]").click()');await pause(100);
await evaluate('document.querySelector(".small-picker-option input").click()');await pause(100);await clickText("Adicionar à Caixa 40");
await evaluate('document.querySelector(".box-options").open=true;document.querySelector(".box-options .delete-box-trigger").click()');await pause(100);
assert(await evaluate('document.querySelector(".delete-box-confirmation").textContent.includes("caixas menores dentro dela")'));
await type("EXCLUIR");await clickText("Confirmar exclusão");
await until('window.qa.caixas.length===0');
assert.equal(await evaluate('window.qa.caixasEmMontagem.length'),0);
console.log("OK browser: exact text required, cancel does nothing, re-open resets confirmation, small and non-empty outer deletion.");
}finally{socket?.close();browser.kill();server.close();}
