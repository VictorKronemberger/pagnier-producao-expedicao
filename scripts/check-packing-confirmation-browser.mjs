import {build} from "esbuild";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
import path from "node:path";
const dir=path.resolve(".sites-runtime/packing-confirmation-qa");mkdirSync(dir,{recursive:true});
const fixture="\nimport React,{useState} from \"react\";import {createRoot} from \"react-dom/client\";\nimport PackingWorkspace from \"./app/packing-workspace\";\nimport {emptyShipment} from \"./lib/shipping.mjs\";\nimport {mergeShipment} from \"./lib/shipment-groups.mjs\";\nconst key=\"a\".repeat(64),groups=[{id:\"test\",codigo:\"TESTE\",cliente:\"Cliente teste\",ordens:[]}];\nwindow.confirm=()=>!window.cancelConfirmation;\nwindow.fetch=async url=>({ok:true,json:async()=>url.includes(\"?key=\")?{cliente:{nome:\"Cliente teste\",razaoSocial:\"Cliente teste\",registro:\"\",telefone:\"\",email:\"\",pais:\"Brasil\",enderecos:[{label:\"Principal\",value:\"Endereço fictício\"}]}}:{clientes:[{key,nome:\"Cliente teste\"}],selecionado:key,porPedido:{test:key}}});\nfunction App(){\nconst [board,setBoard]=useState({details:{test:{envio:emptyShipment()}}});\nconst [step,setStep]=useState(\"orders\"),[blocked,setBlocked]=useState(\"\"),[loading,setLoading]=useState(false);\nwindow.qa={board,step};window.setBlocked=setBlocked;window.setLoading=setLoading;window.setStep=setStep;\nwindow.remoteChange=()=>setBoard(b=>({...b,details:{...b.details,test:{envio:{...b.details.test.envio,rastreio:\"ALTERADO PELA EQUIPE\"}}}}));\nreturn <PackingWorkspace groups={groups} board={board} owner=\"test\" onSelect={()=>{}} onChange={()=>{}} onGroup={(id,ids,holder,patch)=>{\nif(window.failApply)throw Error(\"Falha simulada ao reunir pedidos.\");\nsetBoard(b=>({...b,details:{...b.details,[id]:{envio:mergeShipment(b,id,ids,holder,patch,new Date().toISOString(),()=>crypto.randomUUID())}}}));\n}} disabled={loading} canExport={false} confirmationBlockedReason={blocked} section={step} onSection={setStep} onPending={()=>{}} onDelete={async()=>{}} onInvoice={()=>{}} onOpenOrder={()=>{}} onHelp={()=>{}}/>;\n}\ncreateRoot(document.getElementById(\"root\")).render(<App/>);\n";
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




await send("Emulation.setDeviceMetricsOverride",{width:1324,height:1000,deviceScaleFactor:1,mobile:false});
await send("Page.navigate",{url:"http://127.0.0.1:5189"});
await until('!!document.querySelector(".client-apply")');
async function clickText(text){await evaluate('(()=>{const el=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+JSON.stringify(text)+');if(!el)throw Error("Missing "+'+JSON.stringify(text)+');el.click()})()');await pause(100)}
const apply=()=>evaluate('document.querySelector(".client-apply").click()');
const disabled=()=>evaluate('document.querySelector(".client-apply").disabled');
const help=()=>evaluate('document.getElementById(document.querySelector(".client-apply").getAttribute("aria-describedby"))?.textContent');
const nextDisabled=()=>evaluate('document.querySelector(".pl-stage-footer .primary").disabled');
// A pending background save must not disable local preparation or navigation.
assert.equal(await nextDisabled(),false);
await clickText("Consultar clientes no Nomus");
await until('!!document.querySelector(".client-preview")');
assert.equal(await disabled(),false);
assert.equal(await nextDisabled(),true); // Recipient still requires explicit confirmation.
await evaluate('window.setBlocked("Sem sincronização. Aguarde a reconexão.")');await pause(100);
assert.equal(await disabled(),true);assert.match(await help(),/sincronização/);
await apply();assert.equal(await evaluate('window.qa.step'),"orders");
assert(await evaluate('!!document.querySelector(".client-preview")'));
await evaluate('window.setBlocked("")');await pause(100);
assert.equal(await disabled(),false); // Reconnect releases the preserved selection.
await evaluate('window.cancelConfirmation=true');await apply();await pause(100);
assert.equal(await evaluate('window.qa.step'),"orders");assert.equal(await nextDisabled(),true);
await evaluate('window.cancelConfirmation=false;window.failApply=true');await apply();await pause(100);
assert.equal(await evaluate('window.qa.step'),"orders");
assert(await evaluate('document.querySelector(".client-document-section").textContent.includes("Falha simulada")'));
await evaluate('window.failApply=false');await apply();await until('window.qa.step==="boxes"');
assert.equal(await evaluate('window.qa.board.details.test.envio.packing.destinatarioNome'),"Cliente teste");
assert.equal(await evaluate('window.qa.board.details.test.envio.packing.destinatarioEndereco'),"Endereço fictício");
await evaluate('window.setStep("orders")');await pause(100);
assert.equal(await nextDisabled(),false);
await clickText("Consultar clientes no Nomus");await until('!!document.querySelector(".client-preview")');
await evaluate('window.remoteChange()');await pause(100);
assert.equal(await disabled(),true);assert.match(await help(),/Outra pessoa alterou/);
await apply();assert.equal(await evaluate('window.qa.step'),"orders");
await clickText("Descartar seleção não confirmada");
assert.equal(await nextDisabled(),false);
assert.equal(await evaluate('window.qa.board.details.test.envio.rastreio'),"ALTERADO PELA EQUIPE");
await clickText("Consultar clientes no Nomus");await until('!!document.querySelector(".client-preview")');
await evaluate('window.setLoading(true)');await pause(100);
assert.equal(await disabled(),true);assert.match(await help(),/carregamento/);
await evaluate('window.setLoading(false)');await pause(100);
assert.equal(await disabled(),false);
writeFileSync(path.join(dir,"confirmation.png"),Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
console.log("OK browser: background save permits confirmation/navigation; sync failure and loading explain blocks; recovery preserves selection; cancellation/apply error prevent advance; remote conflict stays protected; successful confirmation fills recipient and advances.");
}finally{socket?.close();browser.kill();server.close();}
