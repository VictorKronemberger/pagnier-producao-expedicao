import {build} from "esbuild";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
import path from "node:path";
const dir=path.resolve(".sites-runtime/small-build-design-qa");mkdirSync(dir,{recursive:true});
const fixture="\nimport React,{useState} from \"react\";import {createRoot} from \"react-dom/client\";\nimport ShipmentEditor from \"./app/shipment-editor\";\nimport {emptyShipment,newItem} from \"./lib/shipping.mjs\";\nconst ops=[{id:\"op\",nome:\"OP teste\",produto:\"Kuntanawa Stardust 50g\",unidade:\"UNID\",quantidade:\"200\"}];\nconst initial={...emptyShipment(),organizacao:\"inner\",caixasEmMontagem:[30,20].map((q,i)=>({id:\"box-\"+i,codigo:\"Kuntanawa Stardust 50g\",pronta:i===1,itens:[{...newItem(\"item-\"+i),caixaInternaId:\"box-\"+i,opId:\"op\",produto:ops[0].produto,unidade:\"UNID\",quantidade:String(q)}]}))};\nfunction App(){const [value,setValue]=useState(initial);const [step,setStep]=useState(\"small\");window.qa=value;return <ShipmentEditor value={value} ops={ops} onChange={setValue} assemblyStep={step} onAssemblyStepChange={setStep}/>;}\ncreateRoot(document.getElementById(\"root\")).render(<App/>);\n";
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

await send("Emulation.setDeviceMetricsOverride",{width:1200,height:1200,deviceScaleFactor:1,mobile:false});
await send("Page.navigate",{url:"http://127.0.0.1:5189"});
await until('document.querySelectorAll(".small-build-selector button").length===2');
assert.equal(await evaluate('document.querySelector(".small-build-card-bottom b").textContent'),"30 UNID");
assert.equal(await evaluate('document.querySelector(".small-build-overview strong").textContent'),"30 UNID");
assert(await evaluate('document.querySelector(".small-build-workspace")!==null'));
async function input(selector,value){await evaluate('(()=>{const el=document.querySelector('+JSON.stringify(selector)+');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event("input",{bubbles:true}));})()');await pause(100)}
async function clickText(text){await evaluate('(()=>{const el=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+JSON.stringify(text)+');if(!el)throw Error("Missing button");el.click()})()');await pause(100)}
await input(".small-build-focus .packed-quantity input","35");
await until('window.qa.caixasEmMontagem[0].itens[0].quantidade==="35"');
assert.equal(await evaluate('document.querySelector(".small-build-overview strong").textContent'),"35 UNID");
writeFileSync(path.join(dir,"desktop.png"),Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
await clickText("Conferir e finalizar caixa menor");
await until('window.qa.caixasEmMontagem[0].pronta===true');
assert.equal(await evaluate('document.querySelectorAll(".small-build-ready .small-build-content-row").length'),1);
assert.equal(await evaluate('document.querySelectorAll(".small-build-focus .packed-quantity input").length'),0);
assert.equal(await evaluate('document.querySelector(".small-build-content-row strong").textContent'),"35 UNID");
await clickText("Multiplicar caixa");
await until('window.qa.caixasEmMontagem.length===3');
assert.equal(await evaluate('window.qa.caixasEmMontagem[2].itens[0].quantidade'),"35");
assert(await evaluate('window.qa.caixasEmMontagem[2].id!==window.qa.caixasEmMontagem[0].id'));
await clickText("Nova caixa menor");
await until('window.qa.caixasEmMontagem.length===4');
assert.equal(await evaluate('document.querySelector(".small-build-overview strong").textContent'),"Vazia");
assert(await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Conferir e finalizar caixa menor").disabled'));
await evaluate('document.querySelector(".small-build-selector button").click()');await pause(100);
await clickText("Editar conteúdo");
await until('window.qa.caixasEmMontagem[0].pronta===false');
assert.equal(await evaluate('document.querySelector(".small-build-focus .packed-quantity input").value'),"35");
await send("Emulation.setDeviceMetricsOverride",{width:390,height:1000,deviceScaleFactor:1,mobile:true});await pause(200);
assert(await evaluate('document.documentElement.scrollWidth<=390'),"No horizontal overflow on mobile");
await evaluate('document.querySelector(".small-build-workspace").scrollIntoView()');
writeFileSync(path.join(dir,"mobile.png"),Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
await evaluate('document.documentElement.dataset.theme="dark"');await pause(100);
writeFileSync(path.join(dir,"dark.png"),Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
console.log("OK browser: quantities, edit, finalize, ready summary, duplicate preserving quantity, new empty box, reopen, mobile without overflow.");
}finally{socket?.close();browser.kill();server.close();}
