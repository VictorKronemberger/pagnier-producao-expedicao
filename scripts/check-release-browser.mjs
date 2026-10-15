import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdirSync,writeFileSync} from "node:fs";
import path from "node:path";
import {assertReleaseTransitions} from "../lib/order-release.mjs";
const dir=path.resolve(".sites-runtime/release-qa");mkdirSync(dir,{recursive:true});
const browser=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless","--disable-gpu","--no-first-run","--remote-debugging-port=9244","--user-data-dir="+dir,"about:blank"],{windowsHide:true,stdio:"ignore"});
let socket;let rejectNextConfirmation=false;const confirmations=[];const pause=ms=>new Promise(r=>setTimeout(r,ms));
const op=id=>({id:"OP "+id,nome:"OP "+id,produto:"Produto liberado",quantidade:"4",unidade:"UNID",criacao:"2026-10-15"});
const sale=(id,liberacao,withOP,statuses)=>({id,codigo:id,cliente:"Cliente "+id,criacao:"2026-10-15",liberacao,ordens:withOP?[op(id)]:[],vinculo:withOP?"linked":"none",itens:statuses.map((status,i)=>({status,item:"000"+(i+1)+"0",produto:status===1?"Produto pendente QA":"Produto liberado QA",quantidade:"4",unidade:"UNID"}))});
const waiting=sale("PD 09001","waiting",false,[1]),partial=sale("PD 09002","partial",true,[2,1]),released=sale("PD 09003","released",true,[2]),noOP=sale("PD 09004","released",false,[2]),started=sale("PD 09005","waiting",true,[1]);
const snapshot={consultadoEm:"2026-10-15",ordensConsultadas:3,grupos:[waiting,partial,released,noOP,started],semVinculo:[]};snapshot.pedidos=[...snapshot.grupos];
let board={sequence:[started.id],details:{[started.id]:{responsavel:"",nota:"Manter orientação",situacao:"Em acompanhamento"}}},revision=0,writes=0;
try{
 let pages;for(let i=0;i<60;i++){try{pages=await(await fetch("http://127.0.0.1:9244/json")).json();if(pages.some(p=>p.type==="page"))break}catch{}await pause(200)}
 socket=new WebSocket(pages.find(p=>p.type==="page").webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
 let id=0;const pending=new Map();
 function send(method,params={}){return new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});socket.send(JSON.stringify({id:i,method,params}))})}
 async function respond(m){
 const url=new URL(m.request.url);let payload,status=200;
 if(url.pathname==="/api/board"){
  if(m.request.method==="PUT"){const body=JSON.parse(m.request.postData);assertReleaseTransitions(board,body.board,snapshot.grupos);board=body.board;revision++;writes++;payload={revision,updatedAt:new Date().toISOString(),updatedBy:"Teste"}}
  else payload={snapshot,board,revision,updatedAt:null,updatedBy:null};
 }else if(url.pathname==="/api/nomus")payload={snapshot,changes:{},configured:true,lastChecked:new Date().toISOString(),partial:false,message:"Teste isolado",page:1,pedidosCoberturaCompleta:true,pedidosIdentificados:snapshot.pedidos.length,paginaPedidos:1};
 else {status=404;payload={error:"API bloqueada no teste"}}
 await send("Fetch.fulfillRequest",{requestId:m.requestId,responseCode:status,responseHeaders:[{name:"Content-Type",value:"application/json"}],body:Buffer.from(JSON.stringify(payload)).toString("base64")});
 }
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.resolve(m.result)}else if(m.method==="Fetch.requestPaused")void respond(m.params);else if(m.method==="Page.javascriptDialogOpening"){confirmations.push(m.params.message);void send("Page.handleJavaScriptDialog",{accept:!rejectNextConfirmation});rejectNextConfirmation=false}};
 async function evaluate(expression){const r=await send("Runtime.evaluate",{expression:"{"+expression+"}",awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async function until(expression){for(let i=0;i<80;i++){if(await evaluate(expression))return;await pause(150)}throw Error("Timeout: "+expression+"; body="+await evaluate("document.body.innerText.slice(0,1800)"))}
 const waitForSave=async()=>{await pause(150);await until('[...document.querySelectorAll(".autosave-status")].every(el=>el.textContent==="Salvo")')};
 await send("Page.enable");await send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.removeItem(\"pagnier-view\")"});await send("Fetch.enable",{patterns:[{urlPattern:"*://127.0.0.1:5173/api/*",requestStage:"Request"}]});await send("Emulation.setDeviceMetricsOverride",{width:1600,height:1000,deviceScaleFactor:1,mobile:false});

 await send("Page.navigate",{url:"http://127.0.0.1:5173/signin-with-chatgpt?return_to=/"});await until('document.querySelectorAll(".kanban-card").length===3');await waitForSave();
 const click=async selector=>{await evaluate('document.querySelector('+JSON.stringify(selector)+').click()');await pause(100)};
 const input=async(selector,value)=>{await evaluate('const el=document.querySelector('+JSON.stringify(selector)+');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event("input",{bubbles:true}))');await pause(120)};
 assert(!board.sequence.includes(waiting.id));assert(board.sequence.includes(partial.id));assert(!board.sequence.includes(noOP.id));assert.equal(board.details[started.id].situacao,"Em acompanhamento");
 assert.equal(await evaluate('[...document.querySelectorAll(".kanban-list")].find(e=>e.querySelector("h2").textContent==="Na fila").querySelector(".list-count").textContent'),"2");
 await evaluate('[...document.querySelectorAll(".kanban-card")].find(e=>e.textContent.includes("09002")).querySelector(".release-notice summary").click()');
 assert(await evaluate('[...document.querySelectorAll(".release-notice[open]")].some(e=>e.innerText.includes("Produto pendente QA")&&e.innerText.includes("00020"))'));
 await evaluate('[...document.querySelectorAll(".kanban-card")].find(e=>e.textContent.includes("09002")).querySelector(".card-open").click()');
 assert(await evaluate('document.querySelector(".card-dialog .release-notice").textContent.includes("Produto pendente QA")'));
 await click('.close');await click('[data-production-tab="release"]');
 assert.equal(await evaluate('document.querySelectorAll(".sales-order").length'),1);
 await click('.sales-order summary');assert(await evaluate('document.querySelector(".sales-order-body").innerText.includes("Aguardando liberação")'));
 assert.equal(await evaluate('document.querySelectorAll(".sales-order-footer button").length'),0);
 await input('.search input',"9001");assert.equal(await evaluate('document.querySelectorAll(".sales-order").length'),1);
 await input('.search input',"9002");assert.equal(await evaluate('document.querySelectorAll(".sales-order").length'),0);await click('.search-clear');
 writeFileSync(".sites-runtime/liberacao-desktop.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(250);
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
 writeFileSync(".sites-runtime/liberacao-mobile.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await send("Emulation.setDeviceMetricsOverride",{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
 const savedWrites=writes;await pause(500);assert.equal(writes,savedWrites);
 // New ERP result: release + production order moves the order automatically on refresh.
 waiting.liberacao="released";waiting.itens[0].status=2;waiting.ordens=[op(waiting.id)];waiting.vinculo="linked";
 await click('[aria-label="Recarregar quadro"]');await until('document.querySelectorAll(".sales-order").length===0');await waitForSave();assert(board.sequence.includes(waiting.id));
 await send("Page.reload");await until('document.querySelectorAll(".kanban-card").length===4');await waitForSave();assert.equal(board.sequence.filter(id=>id===waiting.id).length,1);assert.equal(board.details[started.id].nota,"Manter orientação");
 console.log("OK navegador: aba pendentes, busca por pedido, parcial na fila com itens identificados, etapas preservadas, transição após consulta, persistência e celular. APIs simuladas.");
}finally{socket?.close();browser.kill()}
