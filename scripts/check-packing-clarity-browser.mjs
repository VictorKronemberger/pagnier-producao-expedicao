import {build} from "esbuild";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
import path from "node:path";
const dir=path.resolve(".sites-runtime/packing-clarity-qa");mkdirSync(dir,{recursive:true});
const fixture="\nimport React,{useState} from \"react\";import {createRoot} from \"react-dom/client\";\nimport PackingWorkspace from \"./app/packing-workspace\";import {fixture} from \"./scripts/packing-fixture.mjs\";import {confirmBoxReview} from \"./lib/box-review.mjs\";\nconst {shipment,ops}=fixture();ops[0].quantidade=\"20\";shipment.caixas.push({...structuredClone(shipment.caixas[0]),id:\"box-2\",codigo:\"CX-002\",itens:[{...shipment.caixas[0].itens[0],id:\"item-2\"}]});\nconst reviewed=confirmBoxReview(shipment,ops,\"QA\",\"2026-10-23T12:00:00Z\");reviewed.packing.invoiceNumero=\"\";reviewed.caixas.forEach(box=>box.itens[0].hsCode=\"\");\nfunction App(){const [value,setValue]=useState(reviewed),[step,setStep]=useState(\"document\");window.qa=value;return <PackingWorkspace groups={[{id:\"QA\",codigo:\"QA\",cliente:\"Cliente teste\",ordens:ops}]} board={{details:{QA:{envio:value}}}} owner=\"QA\" onSelect={()=>{}} onChange={(_,next)=>setValue(next)} onGroup={()=>{}} onDelete={async()=>{}} disabled={false} canExport={true} section={step} onSection={setStep} onOpenOrder={()=>{}} onHelp={()=>{}} onPending={()=>{}} onInvoice={()=>{}}/>}\ncreateRoot(document.getElementById(\"root\")).render(<App/>);\n";
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
await until('document.querySelectorAll(".pl-form-section").length===4');
assert.equal(await evaluate('document.querySelectorAll(".packing-document-fields details").length'),1);
assert.equal(await evaluate('[...document.querySelectorAll(".pl-form-section input,.pl-form-section textarea,.pl-form-section select")].some(el=>el.closest("details"))'),false);
async function input(selector,value){await evaluate('(()=>{const el=document.querySelector('+JSON.stringify(selector)+');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event("input",{bubbles:true}));})()');await pause(100)}
await input('input[aria-label="Número da invoice"]',"QA-CLAREZA");
await until('window.qa.packing.invoiceNumero==="QA-CLAREZA"');
writeFileSync(path.join(dir,"document-desktop.png"),Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
await evaluate('document.querySelector("[data-packing-step=boxes]").click()');
await until('document.querySelectorAll(".pl-product-box").length===2');
assert.equal(await evaluate('[...document.querySelectorAll(".pl-product-box input")].some(el=>el.closest("details"))'),false);
await input('input[aria-label="HS Code do item 1 de CX-001"]',"123456");
await input('input[aria-label="HS Code do item 1 de CX-002"]',"123456");
await until('window.qa.caixas.every(box=>box.itens[0].hsCode==="123456")');
assert.equal(await evaluate('window.qa.conferenciaPor'),"QA");
await evaluate('document.querySelector("[data-packing-step=review]").click()');
await until('document.querySelector(".pl-review-checklist")!==null');
assert.equal(await evaluate('document.querySelector(".pl-review-checklist").tagName'),"SECTION");
assert.equal(await evaluate('document.querySelector(".packing-final").disabled'),true);
await evaluate('document.querySelector(".packing-ack input").click()');
await until('document.querySelector(".packing-final").disabled===false');
await evaluate('document.querySelector("[data-packing-step=document]").click()');
await until('document.querySelector(".pl-form-section")!==null');
assert.equal(await evaluate(`document.querySelector('input[aria-label="Número da invoice"]').value`),"QA-CLAREZA");
await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(200);
assert(await evaluate('document.documentElement.scrollWidth<=390'),"Document fits mobile");
writeFileSync(path.join(dir,"document-mobile.png"),Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
await evaluate('document.querySelector("[data-packing-step=boxes]").click()');await pause(200);
assert(await evaluate('document.documentElement.scrollWidth<=390'),"Products fit mobile");
console.log("OK packing clarity: required sections always visible, optional fields retained, both boxes expanded, edits preserved across stages, physical review retained, final acknowledgement required, mobile without overflow.");
}finally{socket?.close();browser.kill();server.close();}
