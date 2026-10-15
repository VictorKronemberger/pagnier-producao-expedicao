import {deleteDraftInvoice} from "../lib/invoice-delete.mjs";
import {emptyInvoice} from "../lib/invoice.mjs";
import {deleteDraftPacking} from "../lib/packing-delete.mjs";
import {emptyShipment,newBox} from "../lib/shipping.mjs";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdirSync,writeFileSync,existsSync,readFileSync} from "node:fs";
import path from "node:path";
const dir=path.resolve(".sites-runtime/direct-box-qa");mkdirSync(dir,{recursive:true});
const browser=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless","--disable-gpu","--no-first-run","--remote-debugging-port=9242","--user-data-dir="+dir,"about:blank"],{windowsHide:true,stdio:"ignore"});
const pdfDir=path.resolve(".sites-runtime/packing-download-qa");mkdirSync(pdfDir,{recursive:true});const invoice="QA-"+Date.now();
let clientReads=0;let socket;let rejectNextConfirmation=false;const confirmations=[];const pause=ms=>new Promise(r=>setTimeout(r,ms));
const snapshot={consultadoEm:"2026-10-25",ordensConsultadas:3,grupos:[
{id:"PV TESTE",codigo:"PV TESTE",cliente:"Cliente de teste",ordens:[{id:"OP TESTE",nome:"OP TESTE",validadeLote:"2027-10-15",produto:"Produto teste 10g",quantidade:"10",unidade:"UNID",criacao:"2026-10-21"}],vinculo:"linked"},
{id:"PV SEM OP",codigo:"PV SEM OP",cliente:"Cliente sem OP",ordens:[],vinculo:"none"}],
semVinculo:[{id:"OP PENDENTE",nome:"OP PENDENTE",produto:"Produto sem vínculo",quantidade:"10",unidade:"UNID",criacao:"2026-10-22"},{id:"OP KG",nome:"OP KG",produto:"Mistura KG",quantidade:"10",unidade:"KG",criacao:"2026-10-22"}]};
snapshot.pedidos=[...snapshot.grupos,...Array.from({length:51},(_,i)=>({id:"PV CAT "+i,codigo:"PV CAT "+i,cliente:"Cliente catálogo",ordens:[],itens:[{produto:"Produto catálogo",quantidade:"2",unidade:"KG"}]}))];
let board={sequence:[],details:{"PV TESTE":{responsavel:"Nome anterior",nota:"",situacao:"A programar",conferidas:["OP TESTE"]}}},revision=0,writes=0,concurrent=0,maxConcurrent=0;
try{
 let pages;for(let i=0;i<60;i++){try{pages=await(await fetch("http://127.0.0.1:9242/json")).json();if(pages.some(p=>p.type==="page"))break}catch{}await pause(200)}
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
 await send("Page.navigate",{url:"http://127.0.0.1:5173/signin-with-chatgpt?return_to=/"});await until('document.querySelectorAll(".kanban-card").length===1');await until('document.styleSheets.length>0&&getComputedStyle(document.querySelector(".trello-shell")).display==="grid"');

 const click=async selector=>{await evaluate('document.querySelector('+JSON.stringify(selector)+').click()');await pause(100)};
 const clickText=async text=>{await evaluate('const b=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+JSON.stringify(text)+');if(!b)throw Error("Botao ausente");b.click()');await pause(100)};
 const choose=async text=>{await evaluate('[...document.querySelectorAll(".mode-choice")].find(b=>b.querySelector("strong").textContent==='+JSON.stringify(text)+').click()');await pause(100)};
 const input=async(selector,value)=>{await evaluate('const el=document.querySelector('+JSON.stringify(selector)+');if(!el)throw Error("Campo ausente");Object.getOwnPropertyDescriptor(el.tagName==="SELECT"?HTMLSelectElement.prototype:HTMLInputElement.prototype,"value").set.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event(el.tagName==="SELECT"?"change":"input",{bubbles:true}))');await pause(120)};
 const save=async()=>{await waitForSave();await pause(200)};
 const open=async()=>{await until('!!document.querySelector(".card-open")');await click('.card-open');await until('!!document.querySelector(".card-dialog")');await click('[data-detail-tab="expedition"]');await click('[data-expedition-step="boxes"]');await until('!!document.querySelector(".assembly-editor")')};

 await save();
 assert.equal(await evaluate('document.querySelectorAll(".kanban-list").length'),5);
 assert.match(await evaluate('getComputedStyle(document.querySelector(".kanban-list")).backdropFilter'),/blur/);
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".kanban-card")).filter'),"none");
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".kanban-card")).backgroundColor'),"rgb(255, 255, 255)");
 writeFileSync(".sites-runtime/colunas-vidro-desktop.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 async function scenario(names,legacy=false){
  snapshot.grupos[0].ordens[0].produto=names[0];snapshot.grupos[0].itens=names.map(produto=>({produto,quantidade:"10",unidade:"UNID"}));
  board.details["PV TESTE"].envio=legacy?{...emptyShipment(),organizacao:"inner",caixasEmMontagem:[{id:"legacy",codigo:"INT-01",itens:[],pronta:false}]}:emptyShipment();revision++;
  await send("Page.reload");await until('!!document.querySelector(".kanban-card")');await save();await open();await save();
 }
 for(const names of [["Produto 250g"],["Produto 500g"],["Produto 1kg"],["250g","500g","1000g"]]){
  await scenario(names);
  assert.equal(await evaluate('!!document.querySelector(".shipment-mode-picker")'),false);
  assert.equal(await evaluate('!!document.querySelector("[data-assembly-step=small]")'),false);
  assert.equal(board.details["PV TESTE"].envio.organizacao,"direct");
 }
 await clickText("Nova Caixa 40");await save();assert.equal(board.details["PV TESTE"].envio.caixas.length,1);
 writeFileSync(".sites-runtime/caixa40-automatica.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 for(const names of [["250g","10g"],["250g","Produto sem peso"]]){await scenario(names);assert(await evaluate('!!document.querySelector(".shipment-mode-picker")'))}
 await scenario(["250g"],true);assert.equal(board.details["PV TESTE"].envio.caixasEmMontagem[0].id,"legacy");
 await click('[data-assembly-step="small"]');assert(await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Nova caixa menor")).disabled'));
 await click('.close');await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
 writeFileSync(".sites-runtime/colunas-vidro-mobile.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 console.log("OK navegador: vidro apenas nas colunas, cartões opacos, Caixa 40 automática, mistos/desconhecidos preservados, caixas antigas acessíveis e celular sem transbordamento. APIs simuladas.");
}finally{socket?.close();browser.kill()}
