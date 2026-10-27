import {deleteDraftInvoice} from "../lib/invoice-delete.mjs";
import {emptyInvoice} from "../lib/invoice.mjs";
import {deleteDraftPacking} from "../lib/packing-delete.mjs";
import {emptyShipment,newBox} from "../lib/shipping.mjs";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdirSync,writeFileSync,existsSync,readFileSync} from "node:fs";
import path from "node:path";
const dir=path.resolve(".sites-runtime/order-history-browser-qa");mkdirSync(dir,{recursive:true});
const port=5194,base="http://127.0.0.1:"+port;
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port",String(port)],{windowsHide:true,stdio:"ignore",env:{...process.env,DATABASE_PROVIDER:"neon",DATABASE_URL:"",TURSO_DATABASE_URL:"",TURSO_AUTH_TOKEN:"",NOMUS_API_KEY:""}});
const browser=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless","--disable-gpu","--no-first-run","--remote-debugging-port=9250","--user-data-dir="+path.join(dir,"profile-"+process.pid),"about:blank"],{windowsHide:true,stdio:"ignore"});
const pdfDir=path.resolve(".sites-runtime/packing-download-qa");mkdirSync(pdfDir,{recursive:true});const invoice="QA-"+Date.now();
let historyReads=0,failHistory=true;
let historyEntries=[
{id:"demo-45",revision:45,at:"2026-10-27T15:10:00.000Z",actor:"Ana (demonstração)",changes:[{field:"Bag BAG-01 · Quantidade",before:"8 UNID",after:"10 UNID"},{field:"Caixa CX-001 · Peso bruto (kg)",before:"1,500",after:"1,700"}]},
{id:"demo-44",revision:44,at:"2026-10-27T14:00:00.000Z",actor:"Victor",changes:[{field:"Etapa",before:"Na fila",after:"Produzindo"}]}];
const olderEntry={id:"demo-43",revision:43,at:"2026-10-27T13:00:00.000Z",actor:"Equipe de demonstração",changes:[{field:"Registro no painel",before:"",after:"Pedido recebido"}]};
let clientReads=0;let socket;let rejectNextConfirmation=false;const confirmations=[];const pause=ms=>new Promise(r=>setTimeout(r,ms));
const snapshot={consultadoEm:"2026-10-25",ordensConsultadas:3,grupos:[
{id:"PV TESTE",codigo:"PV TESTE",cliente:"Cliente de teste",ordens:[{id:"OP TESTE",nome:"OP TESTE",produto:"Produto teste 10g",quantidade:"10",unidade:"UNID",criacao:"2026-10-21"}],vinculo:"linked"},
{id:"PV SEM OP",codigo:"PV SEM OP",cliente:"Cliente sem OP",ordens:[],vinculo:"none"}],
semVinculo:[{id:"OP PENDENTE",nome:"OP PENDENTE",produto:"Produto sem vínculo",quantidade:"10",unidade:"UNID",criacao:"2026-10-22"},{id:"OP KG",nome:"OP KG",produto:"Mistura KG",quantidade:"10",unidade:"KG",criacao:"2026-10-22"}]};
snapshot.pedidos=[...snapshot.grupos,...Array.from({length:51},(_,i)=>({id:"PV CAT "+i,codigo:"PV CAT "+i,cliente:"Cliente catálogo",ordens:[],itens:[{produto:"Produto catálogo",quantidade:"2",unidade:"KG"}]}))];
let board={sequence:[],details:{"PV TESTE":{responsavel:"Nome anterior",nota:"",situacao:"A programar",conferidas:["OP TESTE"]}}},revision=0,writes=0,concurrent=0,maxConcurrent=0;
try{
 let pages;for(let i=0;i<60;i++){try{pages=await(await fetch("http://127.0.0.1:9250/json")).json();if(pages.some(p=>p.type==="page"))break}catch{}await pause(200)}
 socket=new WebSocket(pages.find(p=>p.type==="page").webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
 let id=0;const pending=new Map();
 function send(method,params={}){return new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});socket.send(JSON.stringify({id:i,method,params}))})}
 async function respond(m){
 const url=new URL(m.request.url);
 let payload,status=200;
 if(url.pathname==="/api/chat/session")payload={employee:"Victor",employees:[{name:"Victor",registered:true}]};
 else if(url.pathname==="/api/chat")payload={employee:"Victor",threads:[],messages:[],hasMore:false};
 else if(url.pathname==="/api/order-history"){historyReads++;if(failHistory){status=503;payload={error:"Falha de leitura simulada"}}else payload=url.searchParams.has("before")?{entries:[olderEntry],nextCursor:null}:{entries:historyEntries,nextCursor:43};}
 else if(url.pathname==="/api/board"){
 if(m.request.method==="DELETE"){
 const body=JSON.parse(m.request.postData);
 if(body.revision!==revision){status=409;payload={error:"Conflito no teste"}}else{try{board=body.kind==="invoice"?deleteDraftInvoice(board,body.invoiceId):deleteDraftPacking(board,body.owner);revision++;writes++;payload={board,revision,updatedAt:new Date().toISOString(),updatedBy:"Teste"}}catch(e){status=400;payload={error:e.message}}}
 }else if(m.request.method==="PUT"){
 concurrent++;maxConcurrent=Math.max(maxConcurrent,concurrent);const body=JSON.parse(m.request.postData);await pause(300);
 if(body.revision!==revision){status=409;payload={error:"Conflito no teste"}}else{board=body.board;revision++;writes++;if(board.details["PV TESTE"]?.nota==="Orienta\u00e7\u00e3o registrada")historyEntries=[{id:"saved-"+revision,revision,at:new Date().toISOString(),actor:"Victor",changes:[{field:"Orienta\u00e7\u00f5es do supervisor",before:"",after:board.details["PV TESTE"].nota}]},...historyEntries];payload={revision,updatedAt:new Date().toISOString(),updatedBy:"Teste"}}
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
 await send("Page.enable");await send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.removeItem(\"pagnier-view\")"});await send("Fetch.enable",{patterns:[{urlPattern:base+"/api/*",requestStage:"Request"}]});await send("Emulation.setDeviceMetricsOverride",{width:1600,height:1000,deviceScaleFactor:1,mobile:false});


 await send("Page.navigate",{url:base});await until('!!document.querySelector(".kanban")');await pause(1200);

 await evaluate('document.querySelector(".card-open").click()');await until('!!document.querySelector("[data-order-history]")');await pause(250);
 assert.equal(historyReads,0,"closed history does not fetch");
 assert.equal(await evaluate('document.querySelector("[data-order-history]").open'),false);
 await evaluate('document.querySelector("[data-order-history]>summary").click()');
 await until('!!document.querySelector("[data-order-history] [role=alert]")');
 failHistory=false;await evaluate('[...document.querySelectorAll("[data-order-history] button")].find(b=>b.textContent==="Tentar novamente").click()');
 await until('document.querySelectorAll("[data-order-history] ol>li").length===2');
 await evaluate('document.querySelector("[data-order-history] ol>li details>summary").click()');
 assert(await evaluate('document.querySelector("[data-order-history]").textContent.includes("Antes")'));
 assert(await evaluate('document.querySelector("[data-order-history]").textContent.includes("Depois")'));
 for(const [name,width,height,mobile] of [["desktop",1200,1000,false],["mobile",390,844,true]]){
 await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile});
 await evaluate('document.querySelector("[data-order-history]").scrollIntoView({block:"start"})');await pause(150);
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),name+" fits");
 const shot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(path.join(dir,"history-"+name+".png"),Buffer.from(shot.data,"base64"));
 }
 await evaluate('[...document.querySelectorAll("[data-order-history] button")].find(b=>b.textContent==="Carregar anteriores").click()');await until('document.querySelectorAll("[data-order-history] ol>li").length===3');
 assert.equal(await evaluate('document.querySelectorAll("[data-order-history] ol>li").length'),3);
 await evaluate('(()=>{const el=document.querySelector(".card-dialog textarea");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(el,"Orientação registrada");el.dispatchEvent(new Event("input",{bubbles:true}))})()');
 await until('document.querySelector("[data-order-history]").textContent.includes("aguardando gravação")');
 await until('document.querySelector("[data-order-history]").textContent.includes("Orientações do supervisor")');
 assert(await evaluate('document.querySelector("[data-order-history]").textContent.includes("Victor")'));
 const reads=historyReads;
 await evaluate('document.querySelector("[data-order-history]>summary").click()');await pause(200);assert.equal(historyReads,reads);
 await evaluate('document.querySelector("[data-order-history]>summary").click()');await until('document.querySelectorAll("[data-order-history] ol>li").length===3');
 assert(!await evaluate('document.querySelector("[data-order-history]").textContent.includes("aguardando gravação")'));
 console.log("OK history browser: collapsed/lazy, errors and retry, actor/before/after, pagination, saved revision refresh, desktop/mobile.");
}finally{socket?.close();browser.kill();server.kill()}
