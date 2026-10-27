import {build} from "esbuild";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
import path from "node:path";
const dir=path.resolve(".sites-runtime/bags-browser-qa");mkdirSync(dir,{recursive:true});
const fixture="import React,{useState} from \"react\";import {createRoot} from \"react-dom/client\";\nimport ShipmentEditor from \"./app/shipment-editor\";\nimport {emptyShipment,normalizeShipment} from \"./lib/shipping.mjs\";\nconst ops=[{id:\"stock-craft\",nome:\"Artesanato liberado\",produto:\"Artesanato de demonstração\",unidade:\"UNID\",quantidade:\"20\",estoque:true}];\nfunction App(){const [value,setValue]=useState(emptyShipment());const [step,setStep]=useState(\"outer\");window.qa=value;window.reloadQA=()=>setValue(normalizeShipment(JSON.parse(JSON.stringify(value)),ops));return <ShipmentEditor value={value} ops={ops} onChange={setValue} assemblyStep={step} onAssemblyStepChange={setStep}/>;}\ncreateRoot(document.getElementById(\"root\")).render(<App/>);";
await build({stdin:{contents:fixture,resolveDir:process.cwd(),loader:"tsx"},bundle:true,write:true,outfile:path.join(dir,"app.js"),jsx:"automatic",platform:"browser"});
const css=readFileSync("app/theme.css","utf8")+readFileSync("app/globals.css","utf8").replace(/@import[^;]+;/g,"");
const server=createServer((req,res)=>{if(req.url==="/app.js"){res.setHeader("Content-Type","text/javascript");res.end(readFileSync(path.join(dir,"app.js")));}else{res.setHeader("Content-Type","text/html");res.end('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css+' body{padding:24px;background:#eef2eb}#root{max-width:1000px;margin:auto}@media(max-width:480px){body{padding:10px}}</style><div id="root"></div><script src="/app.js"></script>');}});
await new Promise(r=>server.listen(5193,"127.0.0.1",r));
const browser=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless","--disable-gpu","--no-first-run","--remote-debugging-port=9248","--user-data-dir="+path.join(dir,"profile"),"about:blank"],{windowsHide:true,stdio:"ignore"});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let socket;
try{
let pages;for(let i=0;i<60;i++){try{pages=await(await fetch("http://127.0.0.1:9248/json")).json();if(pages.some(p=>p.type==="page"))break}catch{}await pause(200)}
socket=new WebSocket(pages.find(p=>p.type==="page").webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
let id=0;const pending=new Map();
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result)}};
async function evaluate(expression){const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function until(expression){for(let i=0;i<60;i++){if(await evaluate(expression))return;await pause(100)}throw Error(expression)}



await send("Emulation.setDeviceMetricsOverride",{width:1200,height:1200,deviceScaleFactor:1,mobile:false});
await send("Page.navigate",{url:"http://127.0.0.1:5193"});
await until('document.querySelectorAll(".mode-choice").length===3');
async function clickText(text){await evaluate('(()=>{const el=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+JSON.stringify(text)+');if(!el)throw Error("Missing button: "+'+JSON.stringify(text)+');el.click()})()');await pause(100)}
async function shot(name){await pause(150);writeFileSync(path.join(dir,name+".png"),Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"))}
await shot("modalidades");
await evaluate('[...document.querySelectorAll(".mode-choice")].find(b=>b.textContent.includes("Com bags")).click()');
await clickText("Nova bag");assert.equal(await evaluate('window.qa.caixasEmMontagem[0].tipo'),"bag");
await clickText("Adicionar produto");
await evaluate('(()=>{const el=document.querySelector(".packed-product select");Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(el,"stock-craft");el.dispatchEvent(new Event("change",{bubbles:true}))})()');
await evaluate('(()=>{const el=document.querySelector(".packed-quantity input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"4");el.dispatchEvent(new Event("input",{bubbles:true}))})()');
await evaluate('document.querySelector(".small-build-focus").scrollIntoView({block:"start"})');await shot("bag-conteudo");
await clickText("Conferir e finalizar bag");
assert.equal(await evaluate('window.qa.caixasEmMontagem[0].pronta'),true);
await evaluate('window.reloadQA()');await pause(100);assert.equal(await evaluate('window.qa.caixasEmMontagem[0].tipo'),"bag");
await clickText("Distribuir nas Caixas 40");await clickText("Nova Caixa 40");
assert.equal(await evaluate('document.querySelectorAll(".add-direct-item").length'),0,"bags-only prevents loose products");
await evaluate('document.querySelector(".small-picker-option input").click()');
await clickText("Adicionar à Caixa 40 (1)");
assert.equal(await evaluate('window.qa.caixas[0].caixasInternas[0].tipo'),"bag");
assert.equal(await evaluate('window.qa.caixas[0].itens[0].quantidade'),"4");
await evaluate('document.querySelector(".inner-box").open=true');await clickText("Retirar para ajustar");
assert.equal(await evaluate('window.qa.caixasEmMontagem[0].tipo'),"bag");assert.equal(await evaluate('window.qa.caixas[0].itens.length'),0);
await evaluate('document.querySelector(".small-build-focus").scrollIntoView({block:"start"})');
for(const [name,width,height,mobile] of [["desktop",1200,1200,false],["mobile",390,844,true]]){
 await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile});await pause(120);
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),"bag layout "+name);
 await shot("bag-"+name);
}
await clickText("Alterar modalidade");await evaluate('document.querySelector(".mixed-mode-choice").open=true');await clickText("Habilitar modo misto");
await clickText("Nova caixa menor");assert.equal(await evaluate('window.qa.caixasEmMontagem.at(-1).tipo'),undefined);
await clickText("Nova bag");assert.equal(await evaluate('window.qa.caixasEmMontagem.at(-1).tipo'),"bag");
console.log("OK bags browser: choose mode, create, fill resale product, finish, reload, place, unpack, mixed types, desktop/mobile.");
}finally{socket?.close();browser.kill();server.close();}
