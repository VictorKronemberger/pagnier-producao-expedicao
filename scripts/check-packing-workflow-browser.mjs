import {fixture} from "./packing-fixture.mjs";
import {confirmBoxReview} from "../lib/box-review.mjs";
import {deleteDraftInvoice} from "../lib/invoice-delete.mjs";
import {emptyInvoice} from "../lib/invoice.mjs";
import {deleteDraftPacking} from "../lib/packing-delete.mjs";
import {emptyShipment,newBox} from "../lib/shipping.mjs";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdirSync,writeFileSync,existsSync,readFileSync,readdirSync} from "node:fs";
import path from "node:path";
const dir=path.resolve(".sites-runtime/packing-workflow-qa");mkdirSync(dir,{recursive:true});
const browser=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless","--disable-gpu","--no-first-run","--remote-debugging-port=9244","--user-data-dir="+dir,"about:blank"],{windowsHide:true,stdio:"ignore"});
const pdfDir=path.resolve(".sites-runtime/packing-download-qa-"+Date.now());mkdirSync(pdfDir,{recursive:true});const invoice="QA-"+Date.now();
let clientReads=0;let socket;let rejectNextConfirmation=false;const confirmations=[];const pause=ms=>new Promise(r=>setTimeout(r,ms));
const snapshot={consultadoEm:"2026-10-25",ordensConsultadas:3,grupos:[
{id:"PV TESTE",codigo:"PV TESTE",cliente:"Cliente de teste",ordens:[{id:"OP TESTE",nome:"OP TESTE",validadeLote:"2027-10-15",produto:"Produto teste 10g",quantidade:"10",unidade:"UNID",criacao:"2026-10-21"}],vinculo:"linked"},
{id:"PV SEM OP",codigo:"PV SEM OP",cliente:"Cliente sem OP",ordens:[],vinculo:"none"}],
semVinculo:[{id:"OP PENDENTE",nome:"OP PENDENTE",produto:"Produto sem vínculo",quantidade:"10",unidade:"UNID",criacao:"2026-10-22"},{id:"OP KG",nome:"OP KG",produto:"Mistura KG",quantidade:"10",unidade:"KG",criacao:"2026-10-22"}]};
snapshot.pedidos=[...snapshot.grupos,...Array.from({length:51},(_,i)=>({id:"PV CAT "+i,codigo:"PV CAT "+i,cliente:"Cliente catálogo",ordens:[],itens:[{produto:"Produto catálogo",quantidade:"2",unidade:"KG"}]}))];
let board={sequence:[],details:{"PV TESTE":{responsavel:"Nome anterior",nota:"",situacao:"A programar",conferidas:["OP TESTE"]}}},revision=0,writes=0,concurrent=0,maxConcurrent=0;
const test=fixture();test.ops[0].criacao="2026-10-15";
snapshot.grupos[0].ordens=test.ops;board.details["PV TESTE"].envio=confirmBoxReview(test.shipment,test.ops,"Victor","2026-10-15T15:00:00Z");
board.details["PV TESTE"].envio.packing.invoiceNumero="";
try{
 let pages;for(let i=0;i<60;i++){try{pages=await(await fetch("http://127.0.0.1:9244/json")).json();if(pages.some(p=>p.type==="page"))break}catch{}await pause(200)}
 socket=new WebSocket(pages.find(p=>p.type==="page").webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
 let id=0;const pending=new Map();
 function send(method,params={}){return new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});socket.send(JSON.stringify({id:i,method,params}))})}
 async function respond(m){
 const url=new URL(m.request.url);
 let payload,status=200;
 if(url.pathname==="/api/board"){
 if(m.request.method==="DELETE"){
 const body=JSON.parse(m.request.postData);
 if(body.revision!==revision){status=409;payload={error:"Conflito no teste"}}else{try{board=body.kind==="invoice"?deleteDraftInvoice(board,body.invoiceId):deleteDraftPacking(board,body.owner);revision++;writes++;payload={board,revision,updatedAt:new Date().toISOString(),updatedBy:"Teste"}}catch(e){status=400;payload={error:e.message}}}
 }else if(m.request.method==="PUT"){
 concurrent++;maxConcurrent=Math.max(maxConcurrent,concurrent);const body=JSON.parse(m.request.postData);await pause(300);
 if(body.revision!==revision){status=409;payload={error:"Conflito no teste"}}else{board=body.board;revision++;writes++;payload={revision,updatedAt:new Date().toISOString(),updatedBy:"Teste"}}
 concurrent--;
 }else payload={snapshot,board,revision,updatedAt:null,updatedBy:null};
 }else if(url.pathname==="/api/nomus")payload={snapshot,changes:{"PV TESTE":{at:"2026-10-25T12:00:00.000Z",items:["OP TESTE atualizada"],events:[{at:"2026-10-25T12:00:00.000Z",summary:"OP TESTE atualizada",entity:"OP TESTE",kind:"updated",fields:[{label:"Quantidade",before:"8",after:"10"}]}]}},configured:true,lastChecked:"2026-10-25T12:00:00.000Z",partial:false,message:"Teste isolado",page:1,pedidosCoberturaCompleta:true,pedidosIdentificados:53,paginaPedidos:1};
 else if(url.pathname==="/api/packing-clients"){clientReads++;
 payload=url.searchParams.has("key")?{key:url.searchParams.get("key"),cliente:{nome:"Cliente sem OP",razaoSocial:"Titular de teste",registro:"REGISTRO TESTE",telefone:"TESTE",email:"teste@example.invalid",cidade:"Cidade",pais:"Netherlands",enderecos:[{label:"Principal",value:"Endereco teste"}]}}:{clientes:[{key:"a".repeat(64),nome:"Cliente de teste"},{key:"b".repeat(64),nome:"Cliente sem OP"}],selecionado:"a".repeat(64),porPedido:{"PV TESTE":"a".repeat(64),"PV SEM OP":"b".repeat(64)}};
 }else {status=404;payload={error:"API bloqueada no teste"}}
 await send("Fetch.fulfillRequest",{requestId:m.requestId,responseCode:status,responseHeaders:[{name:"Content-Type",value:"application/json"}],body:Buffer.from(JSON.stringify(payload)).toString("base64")});
 }
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.resolve(m.result)}else if(m.method==="Fetch.requestPaused")void respond(m.params);else if(m.method==="Page.javascriptDialogOpening"){confirmations.push(m.params.message);void send("Page.handleJavaScriptDialog",{accept:!rejectNextConfirmation});rejectNextConfirmation=false}};
 async function evaluate(expression){const r=await send("Runtime.evaluate",{expression:"{"+expression+"}",awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async function until(expression){for(let i=0;i<80;i++){if(await evaluate(expression))return;await pause(150)}throw Error("Timeout: "+expression)}
 const waitForSave=async()=>{await pause(150);await until('[...document.querySelectorAll(".autosave-status")].every(el=>el.textContent==="Salvo")')};
 await send("Page.enable");await send("Browser.setDownloadBehavior",{behavior:"allow",downloadPath:pdfDir});await send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.removeItem(\"pagnier-view\")"});await send("Fetch.enable",{patterns:[{urlPattern:"*://127.0.0.1:5173/api/*",requestStage:"Request"}]});await send("Emulation.setDeviceMetricsOverride",{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
 await send("Page.navigate",{url:"http://127.0.0.1:5173/signin-with-chatgpt?return_to=/"});await until('document.querySelectorAll(".kanban-card").length===1');await until('document.styleSheets.length>0&&getComputedStyle(document.querySelector(".trello-shell")).display==="grid"');

 const click=async selector=>{await evaluate('document.querySelector('+JSON.stringify(selector)+').click()');await pause(100)};
 const clickText=async text=>{await evaluate('const b=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+JSON.stringify(text)+');if(!b)throw Error("Botao ausente");b.click()');await pause(100)};
 const choose=async text=>{await evaluate('[...document.querySelectorAll(".mode-choice")].find(b=>b.querySelector("strong").textContent==='+JSON.stringify(text)+').click()');await pause(100)};
 const input=async(selector,value)=>{await evaluate('const el=document.querySelector('+JSON.stringify(selector)+');if(!el)throw Error("Campo ausente");Object.getOwnPropertyDescriptor(el.tagName==="SELECT"?HTMLSelectElement.prototype:HTMLInputElement.prototype,"value").set.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event(el.tagName==="SELECT"?"change":"input",{bubbles:true}))');await pause(120)};
 const save=async()=>{await waitForSave();await pause(200)};
 const open=async()=>{await until('!!document.querySelector(".card-open")');await click('.card-open');await until('!!document.querySelector(".card-dialog")');await click('[data-detail-tab="expedition"]');await click('[data-expedition-step="boxes"]');await until('!!document.querySelector(".assembly-editor")')};

 await save();writeFileSync(".sites-runtime/manual-quadro.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));await click('[aria-label="Packing lists"]');await until('!!document.querySelector(".pl-workspace")');
 assert.equal(await evaluate('document.querySelectorAll(".pl-list-filters button").length'),4);
 writeFileSync(".sites-runtime/packing-lista-desktop.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await click('.packing-document-card');await until('document.querySelector("[data-packing-step=document]").getAttribute("aria-current")==="step"');
 assert.equal(await evaluate('document.querySelectorAll("[data-packing-step]").length'),4);
 assert((await evaluate('document.querySelector(".pl-handoff").textContent')).includes("Victor"));
 assert.equal(await evaluate('!!document.querySelector(".packing-final")'),false);
 await evaluate('document.querySelector(".pl-editor-toolbar").scrollIntoView({block:"start"})');await pause(120);
 writeFileSync(".sites-runtime/packing-dados-desktop.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 const writesBefore=writes;await input('[aria-label="Número da invoice"]',"PL-QA-001");await save();assert(writes>writesBefore);
 await click('[data-packing-step="review"]');await until('!!document.querySelector(".packing-final")');
 assert(await evaluate('document.querySelector(".packing-final").disabled'));
 assert.equal(await evaluate('!!document.querySelector("[aria-label="+JSON.stringify("Número da invoice")+"]")'),false);
 assert.equal(await evaluate('document.querySelector(".packing-excel").disabled'),false);
 await click('.packing-excel');for(let i=0;i<200&&!readdirSync(pdfDir).some(n=>n.endsWith(".xlsx"));i++)await pause(150);
 const xlsx=readdirSync(pdfDir).find(n=>n.endsWith(".xlsx"));assert(xlsx,"Excel deve ser baixado");assert.equal(readFileSync(path.join(pdfDir,xlsx)).subarray(0,2).toString(),"PK");
 assert(await evaluate('document.querySelector(".packing-final").disabled'));
 await click('.packing-ack input');assert.equal(await evaluate('document.querySelector(".packing-final").disabled'),false);
 writeFileSync(".sites-runtime/packing-revisao-desktop.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await evaluate('document.querySelector(".packing-actions").scrollIntoView({block:"center"})');await pause(120);
 writeFileSync(".sites-runtime/packing-exportar-desktop.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await click('[data-packing-step="document"]');await input('[aria-label="Número da invoice"]',"PL-QA-002");await save();await click('[data-packing-step="review"]');assert(await evaluate('document.querySelector(".packing-final").disabled'));
 await click('[data-packing-step="orders"]');
 assert.equal(await evaluate('document.querySelector(".pl-add-orders").open'),false);
 await evaluate('document.querySelector(".pl-editor-toolbar").scrollIntoView({block:"start"})');await pause(120);
 writeFileSync(".sites-runtime/packing-pedidos-desktop.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await click('.pl-add-orders summary');await input('[aria-label="Buscar pedidos para agrupar"]',"PV SEM OP");
 await click('.group-order-list input:not(:disabled)');await until('document.querySelector("[data-packing-step=review]").disabled');
 assert(await evaluate('document.querySelector(".pl-editor-toolbar button").disabled'));
 await clickText("Descartar seleção não confirmada");assert.equal(await evaluate('document.querySelector("[data-packing-step=review]").disabled'),false);
 await click('[data-packing-step="boxes"]');await until('!!document.querySelector(".shipment-section")');
 assert(await evaluate('document.querySelector(".pl-next-task").textContent.includes("Revisar e baixar")'));
 await click('[data-packing-step="review"]');
 await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(150);
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
 assert(await evaluate('const e=document.querySelector(".packing-workspace-editor");e.scrollWidth<=e.clientWidth+1'));
 writeFileSync(".sites-runtime/packing-revisao-mobile.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await click('.pl-editor-toolbar button');await click('.packing-document-card');await until('document.querySelector("[data-packing-step=review]").getAttribute("aria-current")==="step"');assert(await evaluate('document.querySelector(".packing-final").disabled'));
 await send("Page.reload");await until('!!document.querySelector(".kanban-card")');await click('[aria-label="Packing lists"]');await click('.packing-document-card');await until('!!document.querySelector(".packing-final")');assert(await evaluate('document.querySelector(".packing-final").disabled'));
 assert.equal(board.details["PV TESTE"].envio.packing.invoiceNumero,"PL-QA-002");assert.equal(board.details["PV TESTE"].envio.conferenciaPor,"Victor");
 await send("Emulation.setDeviceMetricsOverride",{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
 await click('[aria-label="Manual de boas práticas"]');await until('!!document.querySelector(".manual-quickstart")');
 writeFileSync(".sites-runtime/manual-inicio-desktop.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await click('[data-manual-start]');await until('!!document.querySelector("#tutorial-overview")');
 assert.equal(await evaluate('document.querySelectorAll("[data-manual-next=orders]").length'),2);
 await click('[data-manual-next="orders"]');await until('!!document.querySelector("#tutorial-orders")');
 await click('[data-manual-previous="overview"]');await until('!!document.querySelector("#tutorial-overview")');
 assert(await evaluate('parseFloat(getComputedStyle(document.querySelector(".manual-short-steps p")).fontSize)>=16'));
 const route=["orders","production","conference","boxes","packing","reuse","document","invoices","dispatch","cleanup","handoff","recovery"];
 for(const id of route){await click('[data-manual-next="'+id+'"]');await until('!!document.querySelector("#tutorial-'+id+'")');assert.equal(await evaluate('document.querySelectorAll("[data-manual-next]").length'),2)}
 await click('[data-manual-next="index"]');await until('!!document.querySelector(".manual-reading-order")');
 assert.equal(await evaluate('document.querySelectorAll("[data-manual-chapter]").length'),13);
 await input('[aria-label="Buscar no manual"]',"Como baixar o packing list em Excel");await until('!!document.querySelector(".manual-reference-link")');await click('.manual-reference-link');assert.equal(await evaluate('document.querySelectorAll("[data-manual-next=packing]").length'),2);
 await click('[data-manual-next="packing"]');await until('!!document.querySelector("#tutorial-packing")');
 await click('[data-manual-next="reuse"]');await click('[data-manual-next="document"]');await until('!!document.querySelector(".manual-example")');assert((await evaluate('document.querySelector(".manual-reader").textContent')).includes("Excel"));
 await evaluate('document.querySelector(".manual-example").scrollIntoView({block:"start"})');await pause(200);await until('document.querySelector(".manual-example img").naturalWidth>0');
 writeFileSync(".sites-runtime/manual-exemplo-desktop.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await input('[aria-label="Buscar no manual"]',"outro funcionário");await until('!!document.querySelector("[data-manual-topic=handoff]")');await click('[data-manual-topic="handoff"]');assert((await evaluate('document.querySelector(".manual-reader").textContent')).includes("Victor"));
 await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(150);assert(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
 writeFileSync(".sites-runtime/manual-leitura-mobile.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 console.log("OK navegador: 13 capítulos em sequência, anterior/próximo no início e fim, navegação das dúvidas e fonte ampliada; Excel baixado; manual com exemplos, busca e layout móvel; quatro etapas, retomada por pendência, salvamento, responsáveis, revisão do PDF obrigatória após alterações/recarga, seleção pendente protegida e layout no celular. APIs simuladas.");
}finally{socket?.close();browser.kill()}
