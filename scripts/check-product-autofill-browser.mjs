import {build} from "esbuild";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
import path from "node:path";
const dir=path.resolve(".sites-runtime/product-autofill-qa");mkdirSync(dir,{recursive:true});
const fixture="\nimport React,{useState} from \"react\";import {createRoot} from \"react-dom/client\";\nimport ShipmentEditor from \"./app/shipment-editor\";import DocumentationReady from \"./app/documentation-ready\";\nimport {fixture} from \"./scripts/packing-fixture.mjs\";\nconst {shipment,ops}=fixture();shipment.caixas[0].itens[0].sku=\"\";shipment.caixas[0].itens[0].hsCode=\"\";\nwindow.requests=0;window.fetch=async url=>{if(!String(url).startsWith(\"/api/packing-products?op=\"))throw Error(\"Unexpected request\");window.requests++;await new Promise(resolve=>setTimeout(resolve,1000));return Response.json({opId:ops[0].id,produto:ops[0].produto,unidade:ops[0].unidade,sku:\"SKU-QA\",hsCode:\"01012100\"});};\nfunction App(){const [value,setValue]=useState(shipment);window.qa=value;return <><DocumentationReady entries={[{owner:\"QA\",orders:[{id:\"QA\",codigo:\"QA\",cliente:\"Cliente de teste\"}],boxes:1,reviewedBy:\"QA\",carrier:\"\"}]} kind=\"packing\" disabled={false} onOpen={id=>window.opened=id}/><ShipmentEditor mode=\"documents\" value={value} ops={ops} onChange={setValue}/></>;}\ncreateRoot(document.getElementById(\"root\")).render(<App/>);\n";
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
await until('document.querySelector(".documentation-ready")!==null');
assert.equal(await evaluate('document.querySelector(".documentation-ready").open'),false);
assert(await evaluate('document.querySelector(".documentation-ready").getBoundingClientRect().height<100'),"Queue initially compact");
await evaluate(`(()=>{const el=document.querySelector('input[aria-label="SKU do item 1 de CX-001"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"MANUAL");el.dispatchEvent(new Event("input",{bubbles:true}));})()`);
await until('window.qa.caixas[0].itens[0].hsCode==="01012100"');
assert.equal(await evaluate('window.qa.caixas[0].itens[0].sku'),"MANUAL");
assert.equal(await evaluate('window.requests'),1);
assert.equal(await evaluate('window.qa.caixas[0].pesoBrutoKg'),"11");
await evaluate('document.querySelector(".documentation-ready>summary").click()');
await until('document.querySelector(".documentation-ready").open');
await evaluate('document.querySelector(".documentation-ready-list button").click()');
assert.equal(await evaluate('window.opened'),"QA");
await evaluate('document.querySelector(".documentation-ready>summary").click()');
assert.equal(await evaluate('document.querySelector(".documentation-ready").open'),false);
await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(200);
assert(await evaluate('document.documentElement.scrollWidth<=390'),"Mobile layout");
console.log("OK automatic SKU/NCM: linked request, leading-zero NCM saved, manual edits during request preserved, physical data unchanged, ready queue collapsed and expandable, mobile layout.");
}finally{socket?.close();browser.kill();server.close();}
