import {deleteDraftInvoice} from "../lib/invoice-delete.mjs";
import {emptyInvoice} from "../lib/invoice.mjs";
import {deleteDraftPacking} from "../lib/packing-delete.mjs";
import {emptyShipment,newBox} from "../lib/shipping.mjs";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdirSync,writeFileSync,existsSync,readFileSync} from "node:fs";
import path from "node:path";
const dir=path.resolve(".sites-runtime/assembly-clean-qa");mkdirSync(dir,{recursive:true});
const browser=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless","--disable-gpu","--no-first-run","--remote-debugging-port=9238","--user-data-dir="+dir,"about:blank"],{windowsHide:true,stdio:"ignore"});
const pdfDir=path.resolve(".sites-runtime/packing-download-qa");mkdirSync(pdfDir,{recursive:true});const invoice="QA-"+Date.now();
let clientReads=0;let socket;let rejectNextConfirmation=false;const confirmations=[];const pause=ms=>new Promise(r=>setTimeout(r,ms));
const snapshot={consultadoEm:"2026-10-25",ordensConsultadas:3,grupos:[
{id:"PV TESTE",codigo:"PV TESTE",cliente:"Cliente de teste",ordens:[{id:"OP TESTE",nome:"OP TESTE",validadeLote:"2027-10-15",produto:"Produto teste 10g",quantidade:"10",unidade:"UNID",criacao:"2026-10-21"}],vinculo:"linked"},
{id:"PV SEM OP",codigo:"PV SEM OP",cliente:"Cliente sem OP",ordens:[],vinculo:"none"}],
semVinculo:[{id:"OP PENDENTE",nome:"OP PENDENTE",produto:"Produto sem vínculo",quantidade:"10",unidade:"UNID",criacao:"2026-10-22"},{id:"OP KG",nome:"OP KG",produto:"Mistura KG",quantidade:"10",unidade:"KG",criacao:"2026-10-22"}]};
snapshot.pedidos=[...snapshot.grupos,...Array.from({length:51},(_,i)=>({id:"PV CAT "+i,codigo:"PV CAT "+i,cliente:"Cliente catálogo",ordens:[],itens:[{produto:"Produto catálogo",quantidade:"2",unidade:"KG"}]}))];
let board={sequence:[],details:{"PV TESTE":{responsavel:"Nome anterior",nota:"",situacao:"A programar",conferidas:["OP TESTE"]}}},revision=0,writes=0,concurrent=0,maxConcurrent=0;
try{
 let pages;for(let i=0;i<60;i++){try{pages=await(await fetch("http://127.0.0.1:9238/json")).json();if(pages.some(p=>p.type==="page"))break}catch{}await pause(200)}
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
 await save();await open();
 assert(await evaluate('!!document.querySelector(".shipment-mode-picker")'));
 await choose("Sem caixas menores");await clickText("Nova Caixa 40");await clickText("Adicionar produto");
 await input('[aria-label="OP do item 1 de CX-001"]',"OP TESTE");
 await input('[aria-label="Quantidade do item 1 de CX-001"]',"6");await save();
 assert.equal(board.details["PV TESTE"].envio.organizacao,"direct");
 assert.equal(board.details["PV TESTE"].envio.caixas[0].itens[0].lote,"OP TESTE");
 assert.equal(board.details["PV TESTE"].envio.caixas[0].itens[0].validade,"2027-10-15");
 assert.equal(await evaluate('!!document.querySelector(\'[aria-label="Conteúdo por embalagem do item 1 de CX-001"]\')'),false);
 await click('.item-document summary');await click('[aria-label="Ajuda: Conteúdo por embalagem"]');assert((await evaluate('document.querySelector("[role=tooltip]").textContent')).includes("10 UNID = 10 produtos"));await click('[aria-label="Ajuda: Conteúdo por embalagem"]');

 assert(!board.details["PV TESTE"].envio.caixasEmMontagem?.length);
 assert.equal(await evaluate('document.querySelectorAll(".box-model-manager").length'),0);
 assert.equal(await evaluate('!!document.querySelector(\'[data-assembly-step="small"]\')'),false);
 assert.equal(await evaluate('!!document.querySelector(\'[aria-label="Peso bruto (kg) de CX-001"]\')'),false);
 await clickText("Nova Caixa 40");await clickText("Adicionar produto");
 await input('[aria-label="OP do item 1 de CX-002"]',"OP TESTE");
 await input('[aria-label="Quantidade do item 1 de CX-002"]',"5");
 assert((await evaluate('document.querySelector(".assembly-editor [role=alert]").textContent')).includes("excede"));
 assert.equal(await evaluate('document.querySelector(\'[aria-label="Quantidade do item 1 de CX-002"]\').value'),"");
 await input('[aria-label="Quantidade do item 1 de CX-002"]',"4");await save();
 assert.equal(board.details["PV TESTE"].envio.caixas[1].itens[0].quantidade,"4");
 assert.equal(await evaluate('document.querySelectorAll(".box-focus").length'),1);
 await click('.box-selector button');
 assert.equal(await evaluate('!!document.querySelector(\'[aria-label="Quantidade do item 1 de CX-001"]\')'),true);
 await clickText("Finalizar Caixa 40");await save();
 assert.equal(board.details["PV TESTE"].envio.caixas[0].montada,true);
 assert.equal(await evaluate('!!document.querySelector(\'[aria-label="Quantidade do item 1 de CX-001"]\')'),false);
 assert.equal(await evaluate('document.querySelectorAll(".box-selector button").length'),1);
 await click('[data-assembly-step="measure"]');
 assert.equal(await evaluate('document.querySelectorAll(".box-selector button").length'),1);
 assert.equal(await evaluate('!!document.querySelector(".add-direct-item")'),false);

 await input('[aria-label="Comprimento (cm) de CX-001"]',"40");await input('[aria-label="Largura (cm) de CX-001"]',"30");await input('[aria-label="Altura (cm) de CX-001"]',"20");await input('[aria-label="Peso bruto (kg) de CX-001"]',"1");
 await save();assert((await evaluate('document.querySelector(".weight-conversion").textContent')).includes("2,2"));
 assert.equal(await evaluate('document.querySelectorAll(".packed-item").length'),0);
 await clickText("Voltar à montagem");await save();
 assert.equal(board.details["PV TESTE"].envio.caixas[0].montada,false);
 assert.equal(await evaluate('!!document.querySelector(\'[aria-label="Quantidade do item 1 de CX-001"]\')'),true);
 await clickText("Finalizar Caixa 40");await save();
 await click('[data-assembly-step="outer"]');
 await send("Emulation.setDeviceMetricsOverride",{width:1500,height:1000,deviceScaleFactor:1,mobile:false});
 await evaluate('document.querySelector(".card-dialog").scrollTop=0');
 writeFileSync(".sites-runtime/caixas-diretas-desktop.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await click('[data-expedition-step="review"]');
 await click('.pc-details summary');await clickText("CX-0024 UNID");await until('!!document.querySelector(\'[aria-label="Quantidade do item 1 de CX-002"]\')');
 assert.equal(await evaluate('document.querySelectorAll(".box-focus").length'),1);
 await click('.close');await click('[aria-label="Configurações de caixas"]');await until('!!document.querySelector(".box-settings-page")');
 await clickText("Novo modelo de caixa");await input('[aria-label="Nome do modelo"]',"Caixa 40 teste");
 for(const [label,value] of [["Comprimento externo (cm)","40"],["Largura externa (cm)","30"],["Altura externa (cm)","20"]])await input('[aria-label="'+label+' do modelo"]',value);
 await clickText("Salvar modelo");await save();assert.equal(board.boxModels[0].nome,"Caixa 40 teste");
 // Reset only the in-memory API fixture for the independent small-box scenario.
 board.details["PV TESTE"].envio=undefined;revision++;
 await send("Page.reload");await until('!!document.querySelector(".kanban-card")');await open();
 await choose("Com caixas menores");await clickText("Nova caixa menor");await clickText("Adicionar produto");
 await input('[aria-label="OP do item 1 de INT-01"]',"OP TESTE");await input('[aria-label="Quantidade do item 1 de INT-01"]',"10");
 await clickText("Conferir e finalizar caixa menor");await save();
 assert.equal(board.details["PV TESTE"].envio.caixasEmMontagem[0].pronta,true);
 assert.equal(await evaluate('document.querySelector(\'[aria-label="Quantidade do item 1 de INT-01"]\').matches(":disabled")'),true);
 await clickText("Distribuir nas Caixas 40");await clickText("Nova Caixa 40");
 assert.equal(await evaluate('!!document.querySelector(".add-direct-item")'),false);
 const innerId=board.details["PV TESTE"].envio.caixasEmMontagem[0].id;
 await input('[aria-label="Caixa menor para CX-001"]',innerId);await clickText("Colocar nesta caixa");await save();
 assert.equal(board.details["PV TESTE"].envio.caixas[0].itens.length,1);
 assert.equal(board.details["PV TESTE"].envio.caixasEmMontagem.length,0);
 await clickText("Alterar modalidade");await choose("Sem caixas menores");
 assert((await evaluate('document.querySelector(".assembly-editor [role=alert]").textContent')).includes("menores"));
 await clickText("Manter modalidade atual");assert.equal(await evaluate('!!document.querySelector(".assembly-editor [role=alert]")'),false);
 await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(250);
 assert(await evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'));
 assert(await evaluate('const el=document.querySelector(".box-focus");el.scrollWidth<=el.clientWidth+1'));
 writeFileSync(".sites-runtime/caixas-menores-mobile.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await clickText("Finalizar Caixa 40");await save();
 assert.equal(await evaluate('document.querySelectorAll(".box-focus").length'),0);
 await click('[data-assembly-step="measure"]');
 assert.equal(await evaluate('document.querySelectorAll(".box-focus").length'),1);
 await click('.close');await send("Page.reload");await until('!!document.querySelector(".kanban-card")');await open();
 assert.equal(await evaluate('document.querySelectorAll(".box-focus").length'),0);
 await click('[data-assembly-step="measure"]');
 assert.equal(await evaluate('document.querySelectorAll(".box-focus").length'),1);
 assert.equal(board.details["PV TESTE"].envio.caixas[0].montada,true);
 assert.equal(board.details["PV TESTE"].envio.organizacao,"inner");assert.equal(board.details["PV TESTE"].envio.caixas[0].caixasInternas[0].id,innerId);
 writeFileSync(".sites-runtime/caixas-montadas-mobile.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 console.log("OK navegador: finalizar/reabrir Caixa 40, abas separadas, lote e validade automáticos, explicação contextual, modos direto/menores, uma caixa por vez, saldo bloqueado, pesagem separada, kg/lb, configurações separadas e persistidas, pequenas prontas protegidas, distribuição única, recarga e celular. APIs simuladas; nenhum dado real alterado.");
}finally{socket?.close();browser.kill()}
