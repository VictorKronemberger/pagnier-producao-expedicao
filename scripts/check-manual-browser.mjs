import {deleteDraftInvoice} from "../lib/invoice-delete.mjs";
import {emptyInvoice} from "../lib/invoice.mjs";
import {deleteDraftPacking} from "../lib/packing-delete.mjs";
import {emptyShipment,newBox} from "../lib/shipping.mjs";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdirSync,writeFileSync,existsSync,readFileSync} from "node:fs";
import path from "node:path";
const dir=path.resolve(".sites-runtime/manual-process-qa");mkdirSync(dir,{recursive:true});
const browser=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless","--disable-gpu","--no-first-run","--remote-debugging-port=9229","--user-data-dir="+dir,"about:blank"],{windowsHide:true,stdio:"ignore"});
const pdfDir=path.resolve(".sites-runtime/packing-download-qa");mkdirSync(pdfDir,{recursive:true});const invoice="QA-"+Date.now();
let clientReads=0;let socket;let rejectNextConfirmation=false;const confirmations=[];const pause=ms=>new Promise(r=>setTimeout(r,ms));
const snapshot={consultadoEm:"2026-10-25",ordensConsultadas:3,grupos:[
{id:"PV TESTE",codigo:"PV TESTE",cliente:"Cliente de teste",ordens:[{id:"OP TESTE",nome:"OP TESTE",produto:"Produto teste 10g",quantidade:"10",unidade:"UNID",criacao:"2026-10-21"}],vinculo:"linked"},
{id:"PV SEM OP",codigo:"PV SEM OP",cliente:"Cliente sem OP",ordens:[],vinculo:"none"}],
semVinculo:[{id:"OP PENDENTE",nome:"OP PENDENTE",produto:"Produto sem vínculo",quantidade:"10",unidade:"UNID",criacao:"2026-10-22"},{id:"OP KG",nome:"OP KG",produto:"Mistura KG",quantidade:"10",unidade:"KG",criacao:"2026-10-22"}]};
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
 await send("Page.enable");await send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.removeItem(\"pagnier-view\")"});await send("Fetch.enable",{patterns:[{urlPattern:"*://127.0.0.1:5173/api/*",requestStage:"Request"}]});await send("Emulation.setDeviceMetricsOverride",{width:1600,height:1000,deviceScaleFactor:1,mobile:false});


 await send("Page.navigate",{url:"http://127.0.0.1:5173/signin-with-chatgpt?return_to=/"});await until('!!document.querySelector(".kanban")');
 await send("Page.navigate",{url:"http://127.0.0.1:5173/?aba=help"});await until('document.querySelectorAll("[data-manual-category]").length===6');
 assert.equal(await evaluate('document.querySelectorAll(".manual-tutorial,.manual-note").length'),0);
 assert.equal(await evaluate('!!document.querySelector(".industrial-flow,.pop-metadata,.manual-index")'),false);
 for(const [name,width,height,mobile] of [["desktop",1280,900,false],["mobile",390,844,true]]){
 await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile});await evaluate('document.querySelector(".manual-view-title").scrollIntoView({block:"start"})');await pause(120);assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));const shot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(path.resolve(".sites-runtime/manual-leve-inicio-"+name+".png"),Buffer.from(shot.data,"base64"));
 }
 await evaluate('document.querySelector("[data-manual-category=expedition]").click()');
 assert.equal(await evaluate('document.querySelectorAll(".manual-tutorial").length'),0);
 assert.deepEqual(await evaluate('[...document.querySelectorAll("[data-manual-topic]")].map(e=>e.dataset.manualTopic)'),["conference","boxes"]);
 assert.equal(await evaluate('document.querySelector(".manual-category-questions").open'),false);
 await evaluate('document.querySelector("[data-manual-topic=conference]").click()');await until('!!document.querySelector("#tutorial-conference")');
 await evaluate('document.querySelector("#tutorial-conference .manual-next button").click()');await until('!!document.querySelector("#tutorial-boxes")');
 assert.equal(await evaluate('document.querySelectorAll(".manual-tutorial").length'),1);
 assert.equal(await evaluate('document.querySelector(".manual-full-details").open'),false);
 assert.equal(await evaluate('document.querySelector(".pop-metadata").getClientRects().length'),0);
 assert.equal(await evaluate('document.querySelectorAll(".manual-short-steps>li").length'),8);
 for(const [name,width,height,mobile] of [["desktop",1280,900,false],["mobile",390,844,true]]){
 await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile});await evaluate('document.querySelector(".manual-reading-area").scrollIntoView({block:"start"})');await pause(120);assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));const shot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(path.resolve(".sites-runtime/manual-leve-leitura-"+name+".png"),Buffer.from(shot.data,"base64"));
 }
 await evaluate('document.querySelector(".manual-full-details summary").click()');assert(await evaluate('document.querySelector(".manual-full-details").textContent.includes("POP-05")'));assert(await evaluate('document.querySelector(".pop-metadata").getClientRects().length>0'));
 await evaluate('[...document.querySelectorAll("#tutorial-boxes .manual-next button")].find(b=>b.textContent.includes("Invoice")).click()');await until('!!document.querySelector("#tutorial-invoices")');assert.equal(await evaluate('document.querySelector(".manual-full-details").open'),false);
 const search=async text=>evaluate(`const el=document.querySelector('[aria-label="Buscar no manual"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,${JSON.stringify(text)});el.dispatchEvent(new Event("input",{bubbles:true}));`);
 await search("POP-05");assert.equal(await evaluate('document.querySelectorAll(".manual-tutorial").length'),0);assert.equal(await evaluate('document.querySelectorAll("[data-manual-topic]").length'),1);
 await evaluate('document.querySelector("[data-manual-topic=boxes]").click()');assert.equal(await evaluate('document.querySelectorAll(".manual-tutorial").length'),1);
 await search("rastreio");assert(await evaluate('!!document.querySelector("[data-manual-topic=dispatch]")'));assert.equal(await evaluate('document.querySelectorAll(".manual-tutorial").length'),0);
 await search("zzzxqnenhum");assert(await evaluate('document.querySelector(".packing-empty").textContent.includes("Nenhuma orientação")'));
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Limpar busca").click()');assert.equal(await evaluate('document.querySelectorAll("[data-manual-category]").length'),6);
 await evaluate('document.querySelector("[data-manual-category=expedition]").click();');await evaluate('document.querySelector(".manual-category-questions summary").click()');await evaluate('document.querySelector(".manual-reference-link").click()');assert.equal(await evaluate('document.querySelectorAll(".manual-note").length'),1);assert.equal(await evaluate('document.querySelectorAll(".manual-tutorial").length'),0);
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Voltar às orientações").click()');assert.equal(await evaluate('document.querySelectorAll("[data-manual-topic]").length'),2);
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Voltar ao trabalho").click()');await until('!!document.querySelector(".kanban")');
 console.log("OK manual leve: início só com categorias, tarefas por etapa, uma leitura por vez, instruções curtas, POPs preservados em detalhes, busca sem abrir textos, navegação, referências e desktop/mobile.");
}finally{socket?.close();browser.kill()}
