import {stockItems} from "../lib/stock-orders.mjs";
import {deleteDraftInvoice} from "../lib/invoice-delete.mjs";
import {emptyInvoice} from "../lib/invoice.mjs";
import {deleteDraftPacking} from "../lib/packing-delete.mjs";
import {emptyShipment,newBox} from "../lib/shipping.mjs";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdirSync,writeFileSync,existsSync,readFileSync} from "node:fs";
import path from "node:path";
const dir=path.resolve(".sites-runtime/autosave-qa");mkdirSync(dir,{recursive:true});
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

 const sale={id:"PV ESTOQUE",codigo:"PV ESTOQUE",cliente:"Cliente estoque",criacao:"2026-10-14",vinculo:"none",ordens:[],itens:[{produto:"Kuripe 10g",quantidade:"100",unidade:"UN"}]};snapshot.grupos.push(sale);snapshot.pedidos.push(sale);
 const clickText=async text=>evaluate(`const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('Botão ausente: '+${JSON.stringify(text)});b.click()`);
 const fill=async(label,value)=>evaluate(`const el=document.querySelector('[aria-label="'+${JSON.stringify(label)}+'"]');if(!el)throw Error('Campo ausente: '+${JSON.stringify(label)});for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;Object.getOwnPropertyDescriptor(el.tagName==='SELECT'?HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));`);
 const openStock=async()=>{await send('Page.navigate',{url:'http://127.0.0.1:5173/'});await until('[...document.querySelectorAll(".card-open")].some(b=>b.textContent.includes("Cliente estoque"))');await evaluate('[...document.querySelectorAll(".card-open")].find(b=>b.textContent.includes("Cliente estoque")).click()');await until('!!document.querySelector(".card-dialog")')};
 await send("Page.navigate",{url:"http://127.0.0.1:5173/signin-with-chatgpt?return_to=/?aba=pedidos"});await until('!!document.querySelector(".sales-catalog")');
 // Select an inventory order explicitly; no OP is fabricated in the snapshot.
 await fill('Buscar no quadro','PV ESTOQUE');await evaluate('document.querySelector(".sales-order").open=true');await clickText('Separar do estoque');await waitForSave();
 assert(board.details[sale.id].atendimentoEstoque);assert.equal(board.details[sale.id].situacao,'Concluído');assert.equal(sale.ordens.length,0);
 await openStock();assert(await evaluate('document.querySelector(".card-dialog").textContent.includes("estoque")'));
 await evaluate('document.querySelector("[data-detail-tab=overview]").click();const el=[...document.querySelectorAll(".dialog-fields label")].find(l=>l.textContent.includes("Mover para")).querySelector("select");el.value="sent";el.dispatchEvent(new Event("change",{bubbles:true}))');await pause(150);assert.equal(board.details[sale.id].situacao,'Concluído');assert(await evaluate('document.querySelector(".dialog-error").textContent.includes("Confira")'));
 await evaluate('document.querySelector("[data-detail-tab=expedition]").click();document.querySelector("[data-expedition-step=review]").click()');await fill('Responsável pela conferência','Pedro');
 // Import before boxes to exercise the original duplicate-source failure.
 await evaluate('document.querySelector(".close").click();document.querySelector(\'nav button[aria-label="Invoices FedEx / DHL"]\').click()');await clickText('Nova invoice');await until('!!document.querySelector(".invoice-fields")');
 await evaluate('[...document.querySelectorAll(".group-order-list label")].find(l=>l.textContent.includes("PV ESTOQUE")).querySelector("input").click()');await clickText('Aproveitar dados e produtos');await waitForSave();
 const invoiceId=Object.keys(board.invoices)[0];assert.equal(board.invoices[invoiceId].items[0].quantity,'100');
 await openStock();await evaluate('document.querySelector("[data-detail-tab=expedition]").click();document.querySelector("[data-expedition-step=boxes]").click()');if(await evaluate('!!document.querySelector(".mode-choice")')){await evaluate('[...document.querySelectorAll(".mode-choice")].find(b=>b.querySelector("strong").textContent==="Sem caixas menores").click()');await waitForSave()}await until('!!document.querySelector("[data-assembly-step=outer]")');await evaluate('document.querySelector("[data-assembly-step=outer]").click()');await clickText('Nova Caixa 40');await evaluate('document.querySelector(".add-direct-item").click()');
 await fill('OP do item 1 de CX-001',stockItems(sale)[0].id);await fill('Quantidade do item 1 de CX-001','80');await waitForSave();assert.equal(board.details[sale.id].envio.caixas[0].itens[0].quantidade,'80');
 await send('Page.navigate',{url:'http://127.0.0.1:5173/?aba=invoices'});await until('!!document.querySelector(".invoice-workspace .packing-document-card")');await evaluate('document.querySelector(".invoice-workspace .packing-document-card").click()');await until('[...document.querySelectorAll("button")].some(b=>b.textContent==="Revisar atualização")');await clickText('Revisar atualização');await until('!!document.querySelector(".invoice-source-preview")');assert(await evaluate('document.querySelector(".invoice-source-preview").textContent.includes("100 UN")'));assert(await evaluate('document.querySelector(".invoice-source-preview").textContent.includes("80 UN")'));
 await clickText('Cancelar');assert.equal(board.invoices[invoiceId].items[0].quantity,'100');await clickText('Revisar atualização');await clickText('Aplicar atualização revisada');await waitForSave();assert.equal(board.invoices[invoiceId].items.length,1);assert.equal(board.invoices[invoiceId].items[0].quantity,'80');
 await openStock();await evaluate('document.querySelector("[data-detail-tab=expedition]").click();document.querySelector("[data-expedition-step=boxes]").click()');if(await evaluate('!!document.querySelector(".mode-choice")')){await evaluate('[...document.querySelectorAll(".mode-choice")].find(b=>b.querySelector("strong").textContent==="Sem caixas menores").click()');await waitForSave()}await until('!!document.querySelector("[data-assembly-step=outer]")');await evaluate('document.querySelector("[data-assembly-step=outer]").click()');await fill('Quantidade do item 1 de CX-001','70');await waitForSave();
 await send('Page.navigate',{url:'http://127.0.0.1:5173/?aba=invoices'});await until('!!document.querySelector(".invoice-workspace .packing-document-card")');await evaluate('document.querySelector(".invoice-workspace .packing-document-card").click()');await clickText('Revisar atualização');await until('!!document.querySelector(".invoice-source-preview")');assert(await evaluate('document.querySelector(".invoice-source-preview").textContent.includes("70 UN")'));await clickText('Aplicar atualização revisada');await waitForSave();assert.equal(board.invoices[invoiceId].items[0].quantity,'70');assert.equal(board.invoices[invoiceId].items.length,1);
 await clickText('Conferir caixas na expedição');await until('!!document.querySelector(".card-dialog .assembly-editor")');assert(await evaluate('document.querySelector("[data-expedition-step=boxes]").getAttribute("aria-pressed")==="true"'));await evaluate('document.querySelector(".close").click()');
 // Deletion removes only the document; reload and recreation retain the same physical items.
 const physical=JSON.stringify(board.details[sale.id].envio.caixas);
 await send('Page.navigate',{url:'http://127.0.0.1:5173/?aba=packing'});await until('!!document.querySelector("[data-packing-delete]")');await evaluate('document.querySelector("[data-packing-delete]").click()');await until('document.querySelectorAll(".packing-document-card").length===0');assert.equal(JSON.stringify(board.details[sale.id].envio.caixas),physical);
 await send('Page.reload');await until('!!document.querySelector(".packing-workspace")');await clickText('Novo packing list');await until('!!document.querySelector(".packing-document-card")');await evaluate('[...document.querySelectorAll(".packing-document-card")].find(b=>b.textContent.includes("PV ESTOQUE")).click()');await until('[...document.querySelectorAll("button")].some(b=>b.textContent==="Recriar packing list")');await clickText('Recriar packing list');await waitForSave();assert(!board.details[sale.id].envio.packingExcluido);assert.equal(JSON.stringify(board.details[sale.id].envio.caixas),physical);
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(200);assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
 console.log('OK navegador conectado: estoque sem OP, bloqueio de envio, montagem real, invoice 100→80→70 sem duplicar, cancelar/aplicar comparação, recarga, excluir/recriar packing com caixas intactas e celular. APIs simuladas.');
}finally{socket?.close();browser.kill()}
