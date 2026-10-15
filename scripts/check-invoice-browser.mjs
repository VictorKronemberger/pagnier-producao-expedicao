import {normalizeInvoices} from "../lib/invoice.mjs";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdirSync,writeFileSync,existsSync,readFileSync} from "node:fs";
import path from "node:path";
const dir=path.resolve(".sites-runtime/invoice-browser-qa");mkdirSync(dir,{recursive:true});
const browser=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless","--disable-gpu","--no-first-run","--remote-debugging-port=9229","--user-data-dir="+dir,"about:blank"],{windowsHide:true,stdio:"ignore"});
const pdfDir=path.resolve(".sites-runtime/invoice-browser-downloads");mkdirSync(pdfDir,{recursive:true});const invoice="QA-"+Date.now();
let clientReads=0;let socket;let rejectNextConfirmation=false;const confirmations=[];const pause=ms=>new Promise(r=>setTimeout(r,ms));
const snapshot={consultadoEm:"2026-10-25",ordensConsultadas:3,grupos:[
{id:"PV TESTE",codigo:"PV TESTE",cliente:"Cliente de teste",ordens:[{id:"OP TESTE",nome:"OP TESTE",produto:"Produto teste 10g",quantidade:"10",unidade:"UNID",criacao:"2026-10-21"}],vinculo:"linked"},
{id:"PV SEM OP",codigo:"PV SEM OP",cliente:"Cliente sem OP",ordens:[],vinculo:"none"}],
semVinculo:[{id:"OP KG",nome:"OP KG",produto:"Mistura KG",quantidade:"10",unidade:"KG",criacao:"2026-10-22"}]};
snapshot.pedidos=[...snapshot.grupos,...Array.from({length:51},(_,i)=>({id:"PV CAT "+i,codigo:"PV CAT "+i,cliente:"Cliente catálogo",ordens:[],itens:[{produto:"Produto catálogo",quantidade:"2",unidade:"KG"}]}))];
let board={sequence:[],details:{"PV TESTE":{responsavel:"Nome anterior",nota:"",situacao:"A programar",conferidas:["OP TESTE"]}}},revision=0,writes=0,concurrent=0,maxConcurrent=0;
try{
 let pages;for(let i=0;i<60;i++){try{pages=await(await fetch("http://127.0.0.1:9229/json")).json();if(pages.some(p=>p.type==="page"))break}catch{}await pause(200)}
 socket=new WebSocket(pages.find(p=>p.type==="page").webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
 let id=0;const pending=new Map();
 function send(method,params={}){return new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});socket.send(JSON.stringify({id:i,method,params}))})}
 async function respond(m){
 const url=new URL(m.request.url);
 let payload,status=200;
 if(url.pathname==="/api/board"){
 if(m.request.method==="PUT"){
 concurrent++;maxConcurrent=Math.max(maxConcurrent,concurrent);const body=JSON.parse(m.request.postData);await pause(300);
 if(body.revision!==revision){status=409;payload={error:"Conflito no teste"}}else{board={...body.board,invoices:normalizeInvoices(body.board.invoices??{},snapshot.grupos.map(g=>g.id))};revision++;writes++;payload={revision,updatedAt:new Date().toISOString(),updatedBy:"Teste"}}
 concurrent--;
 }else payload={snapshot,board,revision,updatedAt:null,updatedBy:null};
 }else if(url.pathname==="/api/nomus")payload={snapshot,changes:{"PV TESTE":{at:"2026-10-25T12:00:00.000Z",items:["OP TESTE atualizada"]}},configured:true,lastChecked:"2026-10-25T12:00:00.000Z",partial:false,message:"Teste isolado",page:1,pedidosCoberturaCompleta:true,pedidosIdentificados:53,paginaPedidos:1};
 else if(url.pathname==="/api/packing-clients"){clientReads++;
 payload=url.searchParams.has("key")?{key:url.searchParams.get("key"),cliente:{nome:"Cliente sem OP",razaoSocial:"Titular de teste",registro:"REGISTRO TESTE",telefone:"TESTE",email:"teste@example.invalid",cidade:"Cidade",pais:"Netherlands",enderecos:[{label:"Principal",value:"Endereco teste"}]}}:{clientes:[{key:"a".repeat(64),nome:"Cliente de teste"},{key:"b".repeat(64),nome:"Cliente sem OP"}],selecionado:"a".repeat(64),porPedido:{"PV TESTE":"a".repeat(64),"PV SEM OP":"b".repeat(64)}};
 }else {status=404;payload={error:"API bloqueada no teste"}}
 await send("Fetch.fulfillRequest",{requestId:m.requestId,responseCode:status,responseHeaders:[{name:"Content-Type",value:"application/json"}],body:Buffer.from(JSON.stringify(payload)).toString("base64")});
 }
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.resolve(m.result)}else if(m.method==="Fetch.requestPaused")void respond(m.params);else if(m.method==="Page.javascriptDialogOpening"){confirmations.push(m.params.message);void send("Page.handleJavaScriptDialog",{accept:!rejectNextConfirmation});rejectNextConfirmation=false}};
 async function evaluate(expression){const r=await send("Runtime.evaluate",{expression:"{"+expression+"}",awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async function until(expression){for(let i=0;i<80;i++){if(await evaluate(expression))return;await pause(150)}throw Error("Timeout: "+expression)}
 const waitForSave=async()=>{await pause(150);await until('[...document.querySelectorAll(".autosave-status")].every(el=>el.textContent==="Salvo")')};
 await send("Page.enable");await send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.removeItem(\"pagnier-view\")"});await send("Fetch.enable",{patterns:[{urlPattern:"*://127.0.0.1:5173/api/*",requestStage:"Request"}]});await send("Emulation.setDeviceMetricsOverride",{width:1600,height:1000,deviceScaleFactor:1,mobile:false});

 await send("Page.navigate",{url:"http://127.0.0.1:5173/signin-with-chatgpt?return_to=/?aba=invoices"});
 await until('!!document.querySelector(".invoice-workspace")');
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Nova invoice").click()');
 await until('!!document.querySelector(\'[data-invoice-step="orders"]\')');
 await evaluate('[...document.querySelectorAll(".group-order-list label")].find(l=>l.textContent.includes("PV TESTE")).querySelector("input").click()');await waitForSave();
 assert.equal(Object.values(board.invoices)[0].orderIds.length,1);
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Aproveitar dados e produtos").click()');await waitForSave();
 assert.equal(Object.values(board.invoices)[0].items.length,1);
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Aproveitar dados e produtos").click()');await waitForSave();assert.equal(Object.values(board.invoices)[0].items.length,1);
 await evaluate('[...document.querySelectorAll(".group-order-list label")].find(l=>l.textContent.includes("PV SEM OP")).querySelector("input").click()');
 assert.deepEqual(Object.values(board.invoices)[0].orderIds,["PV TESTE"]);
 const step=async key=>{await evaluate(`document.querySelector('[data-invoice-step="${key}"]').click()`);await pause(80)};
 const fill=async(label,value)=>evaluate(`const el=document.querySelector('[aria-label="'+${JSON.stringify(label)}+'"]');if(!el)throw Error("Campo ausente: "+${JSON.stringify(label)});Object.getOwnPropertyDescriptor(el.tagName==='SELECT'?HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));`);
 await step("parties");
 assert.equal(await evaluate('document.querySelector(`[aria-label="Número da invoice"]`).closest("label").dataset.fieldPending'),"true");
 assert.equal(await evaluate('document.querySelector(`[aria-label="Passaporte do destinatário (opcional)"]`).closest("label").dataset.fieldPending'),undefined);
 assert.equal(await evaluate('document.querySelector(`[aria-label="Importador / comprador — Nome / razão social"]`).closest("label").dataset.fieldPending'),undefined);
 await evaluate('document.querySelector(".invoice-fields .filling-guide button").click()');await pause(150);
 assert.equal(await evaluate('document.activeElement.getAttribute("aria-label")'),"Número da invoice");
 const pendingShot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(path.resolve(".sites-runtime/invoice-campos-pendentes.png"),Buffer.from(pendingShot.data,"base64"));
 for(const [label,value] of [["Número da invoice",invoice],["Data da invoice","2026-10-14"],["Data de exportação","2026-10-14"],["Conhecimento aéreo / AWB","AWB-TESTE"],["País de destino da invoice","USA"],["Destinatário — Nome / razão social","Cliente de teste"],["Destinatário — Endereço completo","Endereço de teste"],["Destinatário — País","USA"]])await fill(label,value);
 assert.equal(await evaluate('document.querySelectorAll(".invoice-fields [data-field-pending=true]").length'),0);
 await step("items");
 await fill("Frete da invoice","0");
 assert.equal(await evaluate('document.querySelector(`[aria-label="Frete da invoice"]`).closest("label").dataset.fieldPending'),undefined);
 for(const [label,value] of [["HS Code / NCM do item 1","12119090"],["Identificação / marca do item 1","CX-001"],["Embalagem do item 1","Bag"],["Peso unitário kg do item 1","0,010"],["Valor unitário do item 1","1,25"],["Frete da invoice","5"],["Total de volumes físicos","1"]])await fill(label,value);
 await step("export");
 for(const [label,value] of [["Responsável pela declaração","Responsável teste"],["Cargo do responsável","Operações"],["Data da declaração","2026-10-14"]])await fill(label,value);
 await waitForSave();
 assert.equal(Object.values(board.invoices)[0].freight,"5");
 await evaluate('document.querySelector(\'[aria-label="Revisão da invoice"]\').click()');await until('!document.querySelector(".invoice-final").disabled');
 await send("Browser.setDownloadBehavior",{behavior:"allow",downloadPath:pdfDir});
 for(const carrier of ["FedEx","DHL"]){
 if(carrier==="DHL"){await step("parties");await fill("Transportadora da invoice","DHL");await step("export");await waitForSave();await evaluate('document.querySelector(\'[aria-label="Revisão da invoice"]\').click()');await until('!document.querySelector(".invoice-final").disabled')}
 for(const [selector,extension] of [[".invoice-final","pdf"],[".invoice-excel","xlsx"]]){
 await until(`!document.querySelector('${selector}').disabled`);await evaluate(`document.querySelector('${selector}').click()`);
 const dest=path.join(pdfDir,`Invoice ${carrier} - ${invoice}.${extension}`);
 for(let i=0;i<240&&!existsSync(dest);i++){const error=await evaluate('document.querySelector(\'.invoice-workspace [role="alert"]\')?.textContent||""');if(error)throw Error(error);await pause(250)}
 assert(existsSync(dest),`Download ${carrier} ${extension}`);assert.equal(readFileSync(dest).subarray(0,extension==="pdf"?4:2).toString(),extension==="pdf"?"%PDF":"PK");
 }
 }
 await until('!document.querySelector(".invoice-excel").disabled');
 await step("parties");await fill("Número da invoice",invoice+"-REV");await step("export");assert.equal(await evaluate('document.querySelector(\'[aria-label="Revisão da invoice"]\').checked'),false);await waitForSave();
 await send("Page.reload");await until('document.querySelectorAll(".invoice-workspace .packing-document-card").length===1');
 await evaluate('document.querySelector(".invoice-workspace .packing-document-card").click()');await step("parties");
 assert.equal(await evaluate('document.querySelector(\'[aria-label="Número da invoice"]\').value'),invoice+"-REV");
 await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(150);assert(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));
 await step("items");assert(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Tutorial de invoices").click()');await until('!!document.querySelector("#tutorial-invoices")');assert.equal(await evaluate('document.querySelectorAll(".manual-tutorial").length'),1);
 const shot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(path.resolve(".sites-runtime/invoice-manual-mobile.png"),Buffer.from(shot.data,"base64"));
 console.log("OK navegador invoices: um pedido, fontes sem duplicação, salvamento, recarga, PDF e Excel FedEx/DHL, revisão reiniciada, celular e tutorial. APIs simuladas; nenhum registro real alterado.");
}finally{socket?.close();browser.kill()}
