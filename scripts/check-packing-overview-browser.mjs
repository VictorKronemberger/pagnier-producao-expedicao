import {build} from "esbuild";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
import path from "node:path";
const dir=path.resolve(".sites-runtime/packing-overview-qa");mkdirSync(dir,{recursive:true});
const fixture="\nimport React,{useState} from \"react\";import {createRoot} from \"react-dom/client\";\nimport PackingWorkspace from \"./app/packing-workspace\";import {fixture} from \"./scripts/packing-fixture.mjs\";\nconst groups=Array.from({length:12},(_,i)=>({id:\"QA-\"+i,codigo:\"PD TESTE \"+i,cliente:\"Cliente de demonstração \"+i,ordens:fixture().ops}));\nconst board={details:Object.fromEntries(groups.map((g,i)=>{const envio=fixture().shipment;envio.packing.invoiceNumero=\"PL-TESTE-\"+i;envio.packing.destinatarioNome=g.cliente;return [g.id,{envio}]}))};\nconst ready=groups.slice(0,4).map(g=>({owner:g.id,orders:[g],boxes:2,reviewedBy:\"Equipe de teste\",carrier:\"Transportadora\"}));\nfunction App(){const [owner,setOwner]=useState(null),[step,setStep]=useState(\"orders\");return <div className=\"trello-shell software-shell\"><header className=\"app-topbar\"><strong>PAGNIER</strong><nav className=\"app-navigation\"><button>Produção</button><button>Pedidos de venda</button><button className=\"active\">Packing lists</button></nav></header><main className=\"board-main\"><div className=\"workspace-heading\"><header className=\"global-bar\"><h1>Packing lists</h1><small>Salvo</small></header></div><PackingWorkspace readyEntries={ready} groups={groups} board={board} owner={owner} onSelect={id=>{window.opened=id;setOwner(id)}} onChange={()=>{}} onGroup={()=>{}} onDelete={async()=>{}} disabled={false} canExport={true} section={step} onSection={setStep} onOpenOrder={()=>{}} onHelp={()=>{}} onPending={()=>{}} onInvoice={()=>{}}/><footer className=\"board-footer\">Dados de demonstração</footer></main></div>}\ncreateRoot(document.getElementById(\"root\")).render(<App/>);\n";
await build({stdin:{contents:fixture,resolveDir:process.cwd(),loader:"tsx"},bundle:true,write:true,outfile:path.join(dir,"app.js"),jsx:"automatic",platform:"browser"});
const css=readFileSync("app/theme.css","utf8")+readFileSync("app/globals.css","utf8").replace(/@import[^;]+;/g,"");
const server=createServer((req,res)=>{if(req.url==="/app.js"){res.setHeader("Content-Type","text/javascript");res.end(readFileSync(path.join(dir,"app.js")));}else{res.setHeader("Content-Type","text/html");res.end('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css+'</style><div id="root"></div><script src="/app.js"></script>');}});
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


await send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await send("Page.navigate",{url:"http://127.0.0.1:5189"});
await until('document.querySelectorAll(".packing-document-card").length===12');
assert.equal(await evaluate('document.querySelector(".documentation-ready").open'),false);
assert(await evaluate('document.querySelector(".documentation-ready").closest(".packing-workspace")!==null'),"Queue shares the document scroll area");
assert(await evaluate('document.querySelector(".packing-document-card").getBoundingClientRect().bottom<innerHeight'),"First document fully visible without scrolling");
const scrollers='[...document.querySelectorAll(".board-main *")].filter(el=>el.scrollHeight>el.clientHeight+2&&["auto","scroll"].includes(getComputedStyle(el).overflowY)).map(el=>el.className)';
assert.deepEqual(await evaluate(scrollers),["packing-workspace pl-workspace"],"Only one content scroll area");
writeFileSync(path.join(dir,"desktop.png"),Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
await evaluate('document.querySelector(".documentation-ready>summary").click()');
assert.equal(await evaluate('getComputedStyle(document.querySelector(".documentation-ready-list")).maxHeight'),"none");
assert.deepEqual(await evaluate(scrollers),["packing-workspace pl-workspace"]);
await evaluate('document.querySelector(".documentation-ready-list button").click()');
await until('document.querySelector(".packing-workspace-editor")!==null');
assert.equal(await evaluate('window.opened'),"QA-0");
await evaluate('document.querySelector(".pl-editor-toolbar button").click()');
await until('document.querySelector(".pl-list-toolbar")!==null');
await evaluate('(()=>{const el=document.querySelector(".packing-workspace-search input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"PD TESTE 11");el.dispatchEvent(new Event("input",{bubbles:true}));})()');
await until('document.querySelectorAll(".packing-document-card").length===1');
assert(await evaluate('document.querySelector(".packing-document-card").textContent.includes("PL-TESTE-11")'));
await evaluate('(()=>{const el=document.querySelector(".packing-workspace-search input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"");el.dispatchEvent(new Event("input",{bubbles:true}));})()');
await until('document.querySelectorAll(".packing-document-card").length===12');
await evaluate('document.querySelectorAll(".pl-list-filters button")[3].click()');
await until('document.querySelector(".pl-empty")!==null');
await evaluate('document.querySelectorAll(".pl-list-filters button")[0].click()');
await until('document.querySelectorAll(".packing-document-card").length===12');
await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(200);
assert(await evaluate('document.documentElement.scrollWidth<=390'),"No mobile horizontal overflow");
assert(await evaluate('document.querySelector(".packing-document-card").getBoundingClientRect().top<innerHeight'),"Documents visible on mobile");
assert.deepEqual(await evaluate(scrollers),["packing-workspace pl-workspace"]);
writeFileSync(path.join(dir,"mobile.png"),Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
await evaluate('document.querySelector(".documentation-ready>summary").click()');
await pause(100);
assert.deepEqual(await evaluate(scrollers),["packing-workspace pl-workspace"]);
assert(await evaluate('document.documentElement.scrollWidth<=390'));
await evaluate('document.querySelector(".documentation-ready>summary").click()');
await evaluate('document.querySelector(".packing-workspace-heading>.button").click()');
await until('document.querySelector(".pl-create-heading")!==null');
assert.equal(await evaluate('document.querySelector(".documentation-ready")'),null);
console.log("OK packing overview: single scrolling area, collapsed queue, desktop/mobile document visibility, ready-order opening, search, filters and creation.");

}finally{socket?.close();browser.kill();server.close();}
