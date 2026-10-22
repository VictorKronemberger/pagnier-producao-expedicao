import {build} from "esbuild";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
import path from "node:path";
const dir=path.resolve(".sites-runtime/box-operations-qa");mkdirSync(dir,{recursive:true});
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
async function clickText(text){await evaluate('(()=>{const el=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+JSON.stringify(text)+');if(!el)throw Error("Missing button "+'+JSON.stringify(text)+');el.click()})()');await pause(120)}
async function reset(kind){await evaluate('window.resetScenario('+JSON.stringify(kind)+')');await pause(200)}
const failures=[];
async function check(name,fn){try{await fn();console.log("PASS",name)}catch(e){failures.push(name+": "+e.message);console.error("FAIL",name,e.message)}}
await reset("capacity");
await evaluate('document.querySelector(".small-picker-option input").click()');await pause(100);
await clickText("Adicionar à Caixa 40");
await check("failed placement preserves selection and data",async()=>{
 assert(await evaluate('document.querySelector(".dialog-error").textContent.includes("limite")'));
 assert.equal(await evaluate('window.qa.caixasEmMontagem.length'),2);
 assert.equal(await evaluate('document.querySelectorAll(".small-picker-option input:checked").length'),1);
});
await reset("return");
await clickText("Retirar para ajustar");
await check("failed withdrawal retains error and current step",async()=>{
 assert(await evaluate('document.querySelector(".dialog-error")!==null'));
 assert.equal(await evaluate('document.querySelector("[aria-current=step]").dataset.assemblyStep'),"outer");
 assert.equal(await evaluate('window.qa.caixas[0].itens.length'),1);
 assert.equal(await evaluate('window.qa.caixasEmMontagem.length'),100);
});
await reset("finalize");
await clickText("Finalizar Caixa 40");
await check("failed finalization never announces success",async()=>{
 assert(await evaluate('document.querySelector(".dialog-error").textContent.includes("excede")'));
 assert.equal(await evaluate('window.qa.caixas[0].montada'),false);
 assert(!(await evaluate('document.querySelector(".shipment-section").textContent.includes("finalizada. Disponível")')));
});
await reset("flow");
await evaluate('document.querySelector(".small-picker-option input").click()');await pause(100);
await clickText("Adicionar à Caixa 40");
await check("placement moves exact box once",async()=>{assert.equal(await evaluate('window.qa.caixasEmMontagem.length'),1);assert.equal(await evaluate('window.qa.caixas[0].itens.length'),1);assert.equal(await evaluate('window.qa.caixas[0].caixasInternas[0].id'),"a")});
await clickText("Finalizar Caixa 40");
await evaluate('document.querySelector("[data-assembly-step=measure]").click()');await pause(100);
await check("finalization opens weighing stage",async()=>{assert.equal(await evaluate('window.qa.caixas[0].montada'),true);assert(await evaluate('document.querySelector(".box-measures")!==null'))});
await evaluate('(()=>{const el=document.querySelector("[aria-label=\\"Peso bruto (kg) de CX-001\\"]");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"1");el.dispatchEvent(new Event("input",{bubbles:true}));})()');await pause(100);
await clickText("Voltar à montagem");
await clickText("Retirar para ajustar");
await check("withdrawal preserves quantities and clears obsolete weight",async()=>{assert.equal(await evaluate('window.qa.caixas[0].pesoBrutoKg'),"");assert.equal(await evaluate('window.qa.caixas[0].itens.length'),0);assert.equal(await evaluate('window.qa.caixasEmMontagem.find(b=>b.id==="a").itens[0].quantidade'),"10");assert.equal(await evaluate('document.querySelector(".small-build-focus h4").textContent'),"Menor a")});
await clickText("Conferir e finalizar caixa menor");
await clickText("Distribuir nas Caixas 40");
await evaluate('document.querySelector(".small-picker-option input[value=a]").click()');await pause(100);
await clickText("Adicionar à Caixa 40");
await check("repeated distribution preserves all item IDs without duplication",async()=>{assert.equal(await evaluate('window.qa.caixas[0].itens.length'),1);assert.equal(await evaluate('window.qa.caixasEmMontagem.length'),1);assert.equal(await evaluate('window.qa.caixas[0].itens[0].id'),"item-a")});
assert.deepEqual(failures,[]);
console.log("OK operations: failure paths, successful assembly, weighing, withdrawal and redistribution.");
}finally{socket?.close();browser.kill();server.close();}
