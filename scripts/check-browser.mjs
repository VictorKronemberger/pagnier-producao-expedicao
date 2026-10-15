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
 await send("Page.navigate",{url:"http://127.0.0.1:5173/signin-with-chatgpt?return_to=/"});await until('document.querySelectorAll(".kanban-card").length===1');await until('document.styleSheets.length>0&&getComputedStyle(document.querySelector(".trello-shell")).display==="grid"');
 await waitForSave();assert.deepEqual(board.sequence,["PV TESTE"]);
 assert.equal(await evaluate('!!document.querySelector(\'.kanban-list[aria-label="Pedido de venda"]\')'),false);
 assert.equal(await evaluate('document.querySelectorAll(".sidebar nav button").length'),6);
 assert.equal(await evaluate('!!document.querySelector("#month-mode")'),false);
 assert.equal(await evaluate('document.querySelectorAll(".kanban-list").length'),6);
 assert.equal(await evaluate('!!document.querySelector(".workflow-strip,.single-lane")'),false);
 // Keyboard navigation keeps typing intact and notifications stay in the menu.
 assert.equal(await evaluate('!!document.querySelector(".attention-bridge")'),false);
 assert.equal(await evaluate('document.querySelector(".pending-count").textContent'),"1");
 await evaluate('document.body.dispatchEvent(new KeyboardEvent("keydown",{key:"/",bubbles:true,cancelable:true}))');
 assert.equal(await evaluate('document.activeElement.getAttribute("aria-label")'),"Buscar no quadro");
 await evaluate('document.activeElement.dispatchEvent(new KeyboardEvent("keydown",{key:"f",bubbles:true,cancelable:true}))');
 assert.equal(await evaluate('!!document.querySelector("#month-mode")'),false);
 await evaluate('document.activeElement.blur();document.body.dispatchEvent(new KeyboardEvent("keydown",{key:"f",bubbles:true,cancelable:true}))');
 assert.equal(await evaluate('!!document.querySelector("#month-mode")'),true);
 await evaluate('document.body.dispatchEvent(new KeyboardEvent("keydown",{key:"f",bubbles:true,cancelable:true}));document.body.dispatchEvent(new KeyboardEvent("keydown",{key:"k",ctrlKey:true,bubbles:true,cancelable:true}))');
 assert.equal(await evaluate('document.activeElement.getAttribute("aria-label")'),"Buscar no quadro");
 await evaluate('document.activeElement.blur()');
 // Empty columns remain available as drop targets, as in Trello.
 await evaluate('const card=document.querySelector(".kanban-card");const dt=new DataTransfer();card.dispatchEvent(new DragEvent("dragstart",{bubbles:true,dataTransfer:dt}));document.querySelector(\'.kanban-list[aria-label="Bloqueados"]\').dispatchEvent(new DragEvent("drop",{bubbles:true,dataTransfer:dt}));card.dispatchEvent(new DragEvent("dragend",{bubbles:true,dataTransfer:dt}))');
 await waitForSave();assert.equal(board.details["PV TESTE"].situacao,"Bloqueado");
 assert.equal(await evaluate('document.querySelectorAll(".kanban-list").length'),6);
 await evaluate('const dt=new DataTransfer();dt.setData("text/plain","PV TESTE");document.querySelector(\'.kanban-list[aria-label="Na fila"]\').dispatchEvent(new DragEvent("drop",{bubbles:true,dataTransfer:dt}))');await waitForSave();
 await evaluate('document.querySelector(".card-next-action").click()');await waitForSave();assert.equal(board.details["PV TESTE"].situacao,"Em acompanhamento");
 await evaluate('document.querySelector(".card-next-action").click()');await waitForSave();assert.equal(board.details["PV TESTE"].situacao,"Concluído");
 await evaluate('document.querySelector(\'button[aria-label="Recolher menu"]\').click()');assert(await evaluate('document.querySelector(".sidebar-collapsed")!==null'));
 for(const selector of [".order-code",".product-preview",".card-bottom"]){
 await evaluate(`[...document.querySelectorAll(".kanban-card")].find(c=>c.textContent.includes("PV TESTE")).querySelector(${JSON.stringify(selector)}).click()`);
 await until('!!document.querySelector(".card-dialog")');await evaluate('document.querySelector(".close").click()');
 }
 await evaluate('const card=[...document.querySelectorAll(".kanban-card")].find(c=>c.textContent.includes("PV TESTE"));card.dispatchEvent(new DragEvent("dragend",{bubbles:true}));card.click()');
 await pause(100);assert.equal(await evaluate('!!document.querySelector(".card-dialog")'),false);
 await pause(300);await evaluate('[...document.querySelectorAll(".kanban-card")].find(c=>c.textContent.includes("PV TESTE")).click()');

 await until('!!document.querySelector(".card-dialog")');
 assert.deepEqual(await evaluate('[...document.querySelector(\'[aria-label="Responsável pela conferência"]\').options].map(o=>o.value).filter(Boolean)'),["Pedro","Romulo","Hannibal","Victor","Daniel"]);
 assert.equal(await evaluate('document.querySelectorAll(".op-checklist input[type=checkbox]").length'),0);
 assert.equal(await evaluate('document.querySelector(".compact-changes").open'),false);
 await evaluate('document.querySelector(".compact-changes summary").click()');
 assert.deepEqual(await evaluate('[...document.querySelectorAll(".change-table-wrap thead th")].map(e=>e.textContent)'),["Campo","Antes","Agora"]);
 assert.deepEqual(await evaluate('[...document.querySelectorAll(".change-table-wrap tbody td")].map(e=>e.textContent)'),["8","10"]);
 for(const [name,width,height,mobile] of [['desktop',1280,900,false],['mobile',390,844,true]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await pause(120);
 await evaluate('document.querySelector(".card-dialog .detail-tabs").scrollIntoView({block:"center"})');
 const clip=await evaluate('(()=>{const r=document.querySelector(".card-dialog .detail-tabs").getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()');
 const shot=await send('Page.captureScreenshot',{format:'png',clip});writeFileSync(path.resolve('.sites-runtime/tabs-'+name+'.png'),Buffer.from(shot.data,'base64'));
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});

 await evaluate('document.querySelector(\'[data-detail-tab="expedition"]\').click()');
 await evaluate('document.querySelector("[data-expedition-step=review]").click()');
 assert(await evaluate('document.querySelector(".conference-owner").offsetParent!==null'));
 assert.deepEqual(await evaluate('[...document.querySelectorAll("[data-expedition-step]")].map(b=>b.textContent)'),["1. Conferir produtos","2. Montar caixas"]);
 assert.equal(await evaluate('!!document.querySelector(".card-dialog .shipment-section,.card-dialog .box-conference")'),false);
 assert(await evaluate('document.querySelector("[data-expedition-step=review]").getAttribute("aria-pressed")==="true"'));
 assert.equal(await evaluate('document.querySelectorAll(".op-allocation").length'),0);
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Continuar para montagem das caixas").click()');
 assert(await evaluate('!!document.querySelector(".card-dialog .shipment-section")'));
 await evaluate('document.querySelector("[data-expedition-step=review]").click()');
 assert(await evaluate('document.querySelector(".supervisor-notes").offsetParent===null'));
 await evaluate(`const el=document.querySelector('[aria-label="Responsável pela conferência"]');Object.getOwnPropertyDescriptor(el.tagName=='SELECT'?HTMLSelectElement.prototype:el.tagName=='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,'Pedro');el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));`);
 await evaluate(`const company=[...document.querySelectorAll('.dialog-fields label')].find(l=>l.textContent.startsWith('Empresa')).querySelector('select');company.value='Maya';company.dispatchEvent(new Event('change',{bubbles:true}));`);
 await waitForSave();assert.equal(board.details["PV TESTE"].responsavelConferencia,"Pedro");assert.equal(board.details["PV TESTE"].empresa,"Maya");
 const type=async text=>evaluate(`(()=>{document.querySelector('[data-detail-tab="overview"]').click();const el=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,${JSON.stringify(text)});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));return el.disabled})()`);
 assert.equal(await type("Primeira anotação"),false);await pause(750);assert.equal(await type("Anotação mais recente"),false);await waitForSave();
 assert.equal(board.details["PV TESTE"].nota,"Anotação mais recente");assert.equal(maxConcurrent,1);
 await evaluate('document.querySelector(".change-detail button").click()');await waitForSave();assert.equal(board.details["PV TESTE"].vistoNomus,"2026-10-25T12:00:00.000Z");
 await evaluate(`const el=[...document.querySelectorAll('.dialog-fields label')].find(l=>l.textContent.startsWith('Mover para')).querySelector('select');el.value='shipping';el.dispatchEvent(new Event('change',{bubbles:true}));`);
 await waitForSave();assert.equal(board.details["PV TESTE"].situacao,"Pronto para envio e documentação");
 assert.equal(await evaluate('!!document.querySelector(\'[data-detail-tab="documents"]\')'),false);
 assert.equal(await evaluate('!!document.querySelector(".packing-document")'),false);
 const packingStep=async step=>{if(!await evaluate('!!document.querySelector(".packing-workspace")')){await evaluate('document.querySelector(\'[data-detail-tab="shipping"]\').click()');await evaluate('document.querySelector(\'[data-detail-tab="shipping"]\').click()');await evaluate('document.querySelector(".packing-shortcut").click()');await until('!!document.querySelector(".packing-workspace-editor")')};await evaluate(`document.querySelector(\'[data-packing-step="${step}"]\').click()`);await pause(80)};
 const documentLabels=["Número da invoice","Data da invoice","Nome do exportador","Endereço do exportador","Nome do destinatário","Endereço de entrega","País de origem das mercadorias","País de destino das mercadorias","Responsável pela revisão","Data da revisão"];
 const assemblyStep=async()=>{
 if(await evaluate('!!document.querySelector(".packing-workspace-editor")')){await evaluate('document.querySelector(".linked-order-actions").open=true;document.querySelector(".linked-order-actions>div button").click()');await until('!!document.querySelector(".card-dialog")')}
 await evaluate('document.querySelector("[data-detail-tab=expedition]").click()');await evaluate('document.querySelector("[data-expedition-step=boxes]").click()');await pause(80);
 };
 const fill=async(label,value)=>{const doc=documentLabels.includes(label),physical=label.endsWith(" do modelo")||/^(Embalagem do item|Modelo da caixa maior|Identificação da embalagem|Responsável pela embalagem|Comprimento|Largura|Altura|Peso bruto|Limite de peso|Tara:|Quantidade do item|Unidades embaladas|Peso unitário|Conteúdo por embalagem)/.test(label);if(physical){await assemblyStep();if(!label.endsWith(" do modelo")&&/^(Modelo da caixa maior|Comprimento|Largura|Altura|Peso bruto|Limite de peso|Tara:)/.test(label))await evaluate('document.querySelector("[data-assembly-step=outer]").click()')}else await packingStep(doc?"document":"boxes");return evaluate(`const el=document.querySelector('[aria-label="'+${JSON.stringify(label)}+'"]');for(let parent=el.parentElement;parent;parent=parent.parentElement){if(parent.tagName==='DETAILS'&&!parent.open)parent.querySelector(':scope > summary').click()}if(!el.getClientRects().length)throw Error('Campo não visível: '+${JSON.stringify(label)});Object.getOwnPropertyDescriptor(el.tagName=='SELECT'?HTMLSelectElement.prototype:el.tagName=='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));`)};
 await evaluate('document.querySelector(".close").click();document.querySelector(\'nav button[aria-label="Packing lists"]\').click()');
 await until('!!document.querySelector(".packing-workspace")');
 assert(await evaluate('document.querySelector("h1").textContent==="Packing lists"'));
 assert.equal(await evaluate('!!document.querySelector("#month-mode")'),false);
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Novo packing list")).click()');
 await evaluate('[...document.querySelectorAll(".packing-document-card")].find(b=>b.textContent.includes("PV TESTE")).click()');
 await until('!!document.querySelector(".group-order-list")');
 assert.equal(await evaluate('document.querySelectorAll(".group-order-list input").length'),2);
 await evaluate('document.querySelector(".client-document-section>button").click()');
 await until('!!document.querySelector(".client-preview")');
 await evaluate('const el=document.querySelector(\'[aria-label="Cliente titular do envio"]\');el.value="b".repeat(64);el.dispatchEvent(new Event("change",{bubbles:true}))');
 await until('!!document.querySelector(".client-preview")&&!document.querySelector(".client-fields").disabled');
 await evaluate('[...document.querySelectorAll(".group-order-list label")].find(l=>l.textContent.includes("PV SEM OP")).querySelector("input").click()');
 await until('!!document.querySelector(".document-warning")');
 assert(await evaluate('document.querySelector(\'[data-packing-step="document"]\').disabled'));

 rejectNextConfirmation=true;await evaluate('document.querySelector(".client-apply").click()');await pause(300);
 assert.equal(board.details["PV TESTE"].envio?.agrupamento,undefined);
 assert(confirmations.at(-1).includes("clientes diferentes"));assert(confirmations.at(-1).includes("PV SEM OP"));
 await evaluate('document.querySelector(".client-apply").click()');await waitForSave();
 assert.deepEqual(board.details["PV TESTE"].envio.agrupamento.pedidos,["PV TESTE","PV SEM OP"]);
 assert.equal(board.details["PV TESTE"].envio.packing.contatoEmail,"teste@example.invalid");
 assert(await evaluate('document.querySelector(".packing-workspace-editor").textContent.includes("Primeiro, confira os produtos e monte as caixas")'));
 await fill("Responsável pela embalagem","Hannibal");
 await evaluate('document.querySelector(".box-model-manager summary").click();[...document.querySelectorAll("button")].find(b=>b.textContent==="Novo modelo de caixa").click()');
 for(const [label,value] of [["Nome do modelo","Caixa padrão QA"],["Comprimento externo (cm) do modelo","40"],["Largura externa (cm) do modelo","30"],["Altura externa (cm) do modelo","20"],["Limite de peso bruto (kg) do modelo","10"],["Tara: caixa e proteções (kg) do modelo","0,100"]])await fill(label,value);
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Salvar modelo").click()');await waitForSave();
 assert.equal(board.boxModels.length,1);assert.equal(board.boxModels[0].nome,"Caixa padrão QA");

 const setField=async(label,value)=>evaluate(`const el=document.querySelector('[aria-label="'+${JSON.stringify(label)}+'"]');if(!el)throw Error('Campo ausente: '+${JSON.stringify(label)});Object.getOwnPropertyDescriptor(el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));`);
 await evaluate('document.querySelector("[data-assembly-step=outer]").click()');
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Adicionar caixa maior").click()');await waitForSave();
 assert.equal(board.details["PV TESTE"].envio.caixas.length,1);assert(!board.details["PV TESTE"].envio.caixasEmMontagem?.length);
 await evaluate('document.querySelector(".add-direct-item").click()');await setField("OP do item 1 de CX-001","OP TESTE");await setField("Quantidade do item 1 de CX-001","4");await waitForSave();
 assert.equal(board.details["PV TESTE"].envio.caixas[0].itens[0].unidadesEmbaladas,"4");assert(!board.details["PV TESTE"].envio.caixas[0].itens[0].caixaInternaId);
 await send("Page.reload");await until('!!document.querySelector(".card-open")');await evaluate('document.querySelector(".card-open").click()');await assemblyStep();await evaluate('document.querySelector("[data-assembly-step=outer]").click()');
 assert.equal(await evaluate('document.querySelector(".direct-box-items .packed-quantity input").value'),"4");
 assert.equal(await evaluate('document.querySelectorAll(".assembly-routes button").length'),2);
 assert(await evaluate('document.querySelector(".assembly-routes .active strong").textContent==="Caixa maior"'));
 assert(await evaluate('document.querySelector(".assembly-context").textContent.includes("Preenchendo CX-001")'));
 assert(await evaluate('document.querySelector(".direct-box-items .item-location").textContent.includes("Direto na caixa CX-001")'));
 assert.equal(await evaluate('document.querySelector(".direct-box-items .content-count").textContent'),"1 item");
 assert.equal(await evaluate('document.querySelector(".grouped-box-items .content-count").textContent'),"0 embalagens");

 for(const [name,width,height,mobile] of [["desktop",1280,900,false],["mobile",390,844,true]]){
 await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile});await evaluate('document.querySelector(".direct-box-items").scrollIntoView({block:"start"})');assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));const shot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(path.resolve(".sites-runtime/embalagem-direta-"+name+".png"),Buffer.from(shot.data,"base64"));
 }
 await send("Emulation.setDeviceMetricsOverride",{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await evaluate('document.querySelector(".direct-box-items .remove-item").click()');await waitForSave();
 await evaluate('const box=document.querySelector(".assembly-editor .shipping-box");box.querySelector(".box-options summary").click();box.querySelector(".remove-box").click()');await waitForSave();
 assert.equal(board.details["PV TESTE"].envio.caixas.length,0);await evaluate('document.querySelector("[data-assembly-step=small]").click()');

 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Adicionar embalagem").click()');await waitForSave();
 assert.equal(board.details["PV TESTE"].envio.caixas.length,0);assert.equal(board.details["PV TESTE"].envio.caixasEmMontagem.length,1);
 assert.equal(await evaluate('!!document.querySelector(".box-finish,.box-measures")'),false);
 assert.equal(await evaluate('document.querySelector(".finish-small-box").disabled'),true);
 await evaluate('document.querySelector(".prepared-box .inner-box-tools button").click()');
 await setField("OP do item 1 de INT-01","OP TESTE");await pause(150);
 assert.equal(await evaluate('document.querySelector(".packed-quantity").dataset.fieldPending'),"true");
 await evaluate('document.querySelector(".item-suggestion button").click()');await waitForSave();
 assert.equal(board.details["PV TESTE"].envio.caixasEmMontagem[0].itens[0].quantidade,"10");
 await evaluate('document.querySelector(".item-suggestion button").click()');await waitForSave();
 assert.equal(board.details["PV TESTE"].envio.caixasEmMontagem[0].itens[0].quantidade,"10");
 for(const [name,width,height,mobile] of [["desktop",1280,900,false],["mobile",390,844,true]]){
 await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile});await evaluate('document.querySelector(".assembly-steps").scrollIntoView({block:"start"})');await pause(150);assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));const shot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(path.resolve(".sites-runtime/montagem-menores-"+name+".png"),Buffer.from(shot.data,"base64"));
 }
 await send("Emulation.setDeviceMetricsOverride",{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await evaluate('document.querySelector(".finish-small-box").click()');await waitForSave();assert.equal(board.details["PV TESTE"].envio.caixasEmMontagem[0].pronta,true);
 // Return to the same draft after reload, before any outer box exists.
 await send("Page.reload");await until('!!document.querySelector(".card-open")');await evaluate('document.querySelector(".card-open").click()');await assemblyStep();
 assert.equal(board.details["PV TESTE"].envio.caixas.length,0);assert(await evaluate('document.querySelector(".prepared-box").textContent.includes("Pronta para a caixa maior")'));
 await evaluate('document.querySelector("[data-assembly-step=outer]").click()');await setField("Modelo da próxima caixa",board.boxModels[0].id);
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Adicionar caixa maior").click()');await waitForSave();
 assert.equal(board.details["PV TESTE"].envio.caixas[0].modeloNome,"Caixa padrão QA");
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Adicionar caixa maior").click()');await waitForSave();
 assert.equal(await evaluate('document.querySelectorAll(".assembly-editor .shipping-box[open]").length'),1);
 await evaluate('const box=document.querySelectorAll(".assembly-editor .shipping-box")[1];box.querySelector(".box-options summary").click();box.querySelector(".remove-box").click()');await waitForSave();
 await evaluate('document.querySelector(".assembly-editor .shipping-box").open=true');
 let pendingInner=board.details["PV TESTE"].envio.caixasEmMontagem[0];
 await setField("Embalagem para CX-001",pendingInner.id);await evaluate('document.querySelector(".place-small-box").click()');await waitForSave();
 assert.equal(board.details["PV TESTE"].envio.caixasEmMontagem.length,0);assert.equal(board.details["PV TESTE"].envio.caixas[0].itens.length,1);assert.equal(board.details["PV TESTE"].envio.caixas[0].pesoBrutoKg,"");
 // The outer volume shows content, not another product editor.
 assert.equal(await evaluate('document.querySelectorAll(".inner-box input,.inner-box select").length'),0);
 await evaluate('document.querySelector(".inner-box").open=true;document.querySelector(".inner-box button").click()');await waitForSave();
 assert.equal(board.details["PV TESTE"].envio.caixas[0].itens.length,0);assert.equal(board.details["PV TESTE"].envio.caixasEmMontagem[0].itens[0].quantidade,"10");
 assert.equal(board.details["PV TESTE"].envio.caixasEmMontagem[0].pronta,false);
 await evaluate('document.querySelector(".finish-small-box").click()');await waitForSave();
 await evaluate('document.querySelector("[data-assembly-step=outer]").click()');await setField("Embalagem para CX-001",pendingInner.id);await evaluate('document.querySelector(".place-small-box").click()');await waitForSave();
 await evaluate('document.querySelector(".assembly-editor .filling-guide button").click()');await pause(200);assert.equal(await evaluate('document.activeElement.getAttribute("aria-label")'),"Peso bruto (kg) de CX-001");
 await evaluate('document.querySelector(".box-finish summary").focus()');await send("Page.bringToFront");await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Enter",code:"Enter",text:"\r",windowsVirtualKeyCode:13});await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Enter",code:"Enter",windowsVirtualKeyCode:13});await pause(120);assert.equal(await evaluate('document.querySelector(".box-finish").open'),false);
 await fill("Modelo da caixa maior CX-001","Caixa 40");await fill("Tara: caixa e proteções (kg) de CX-001","0,2");await fill("Peso bruto (kg) de CX-001","5");await waitForSave();
 assert.equal(board.details["PV TESTE"].envio.caixas[0].itens[0].pesoUnitarioKg,"0,010");assert.equal(board.details["PV TESTE"].envio.caixas[0].itens[0].unidadesEmbaladas,"10");
 for(const [name,width,height,mobile] of [["desktop",1280,900,false],["mobile",390,844,true]]){
 await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile});await evaluate('document.querySelector(".assembly-steps").scrollIntoView({block:"start"})');await pause(150);assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));const shot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(path.resolve(".sites-runtime/montagem-maiores-"+name+".png"),Buffer.from(shot.data,"base64"));
 }
 await send("Emulation.setDeviceMetricsOverride",{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await evaluate('document.querySelector("[data-detail-tab=shipping]").click()');
 assert.equal(await evaluate('!!document.querySelector(".packing-shortcut")'),false);
 await evaluate('document.querySelector("[data-detail-tab=expedition]").click()');await evaluate('document.querySelector("[data-expedition-step=review]").click()');
 assert(await evaluate('document.querySelector(".allocation-status").textContent==="Completamente alocado"'));
 await evaluate('document.querySelector(".allocated-boxes button").click()');await pause(150);
 assert(await evaluate('!!document.querySelector(".card-dialog .shipment-section")'));
 await evaluate('document.querySelector("[data-expedition-step=review]").click()');await waitForSave();
 await evaluate('document.querySelector("[data-expedition-step=boxes]").click()');await evaluate('document.querySelector(".confirm-boxes").click()');await waitForSave();assert(board.details["PV TESTE"].envio.conferenciaBase);assert.equal(board.details["PV TESTE"].envio.conferenciaPor,"Pedro");
 // Physical edits cancel the confirmation in the UI, and a new review persists.
 await fill("Peso bruto (kg) de CX-001","6");await waitForSave();
 await evaluate('document.querySelectorAll(".assembly-editor details:not(.shipping-box)").forEach(el=>{el.open=false})');
 assert.equal(await evaluate('!!document.querySelector(".assembly-editor .item-document")'),false);
 assert.equal(await evaluate('document.querySelector(".assembly-editor .inner-box").open'),false);

 for(const [name,width,height,mobile] of [["desktop",1280,900,false],["mobile",390,844,true]]){
 await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile});await pause(120);
 await evaluate('document.querySelector(".card-dialog").scrollIntoView({block:"start"})');
 assert(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));
 const shot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(path.resolve(".sites-runtime/expedicao-"+name+".png"),Buffer.from(shot.data,"base64"));
 }
 await send("Emulation.setDeviceMetricsOverride",{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await evaluate('document.querySelector("[data-detail-tab=shipping]").click()');assert.equal(await evaluate('!!document.querySelector(".packing-shortcut")'),false);
 await evaluate('document.querySelector("[data-detail-tab=expedition]").click()');await evaluate('document.querySelector("[data-expedition-step=review]").click()');
 await evaluate('document.querySelector("[data-expedition-step=boxes]").click()');assert(await evaluate('document.querySelector(".box-conference").textContent.includes("O envio mudou")'));
 await evaluate('document.querySelector("[data-expedition-step=boxes]").click()');await evaluate('document.querySelector(".confirm-boxes").click()');await waitForSave();
 await evaluate('document.querySelector(".card-dialog").scrollIntoView({block:"start"})');
 const reviewShot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(path.resolve(".sites-runtime/conferencia-caixas.png"),Buffer.from(reviewShot.data,"base64"));

 await evaluate('document.querySelector("[data-detail-tab=shipping]").click()');
 assert(await evaluate('!!document.querySelector(".packing-shortcut")'));
 await fill("Transportadora","Transportadora teste");await fill("Código de rastreio","RA123TESTE");await fill("Data do envio","2026-10-25");await waitForSave();
 assert.equal(board.details["PV TESTE"].envio.rastreio,"RA123TESTE");
 await packingStep("document");
 await evaluate('document.querySelector(".packing-document .filling-guide button").click()');await pause(200);
 assert.equal(await evaluate('document.querySelector(".packing-header-fields").open'),true);
 assert.equal(await evaluate('document.activeElement.getAttribute("aria-label")'),"Número da invoice");
 assert(await evaluate('document.querySelector(".packing-final").disabled'));
 for(const [label,value] of [["Descrição documental do item 1 de CX-001","Test product"],["HS Code do item 1 de CX-001","000000"],["Tipo de embalagem do item 1 de CX-001","Bags"],["Número da invoice",invoice],["Data da invoice","2026-10-25"],["Nome do exportador","Exportador teste"],["Endereço do exportador","Endereco teste"],["Nome do destinatário","Destinatario teste"],["Endereço de entrega","Endereco teste"],["País de origem das mercadorias","Brazil"],["País de destino das mercadorias","Netherlands"],["Responsável pela revisão","Romulo"],["Data da revisão","2026-10-25"]])await fill(label,value);
 await waitForSave();assert.equal(board.details["PV TESTE"].envio.packing.invoiceNumero,invoice);
 await evaluate('document.querySelector(".packing-ack input").click()');
 await until('!document.querySelector(".packing-final").disabled');
 assert.equal(await evaluate('document.querySelectorAll(".packing-document [data-field-pending=true]").length'),0);
 await send("Browser.setDownloadBehavior",{behavior:"allow",downloadPath:pdfDir});
 await evaluate('document.querySelector(".packing-final").click()');
 const pdfPath=path.join(pdfDir,"Packinglist - Destinatario teste - "+invoice+".pdf");
 for(let i=0;i<120&&!existsSync(pdfPath);i++)await pause(250);
 assert(existsSync(pdfPath),"PDF baixado pelo botão do painel");assert.equal(readFileSync(pdfPath).subarray(0,4).toString(),"%PDF");
 await fill("Número da invoice",invoice+"-REV");await pause(100);assert.equal(await evaluate('document.querySelector(".packing-ack input").checked'),false);await waitForSave();
 await packingStep("boxes");await evaluate('document.querySelector(".shipment-section").scrollIntoView()');const shippingShot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(path.resolve(".sites-runtime/envio-qa.png"),Buffer.from(shippingShot.data,"base64"));
 await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(200);assert(await evaluate('document.querySelector(".packing-workspace").scrollWidth<=document.querySelector(".packing-workspace").clientWidth'));
 await send("Emulation.setDeviceMetricsOverride",{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
 await evaluate('document.querySelector(\'nav button[aria-label="Produção"]\').click()');
 await evaluate('document.querySelector(".filter-toggle").click()');
 await evaluate(`const el=document.querySelector('#month-mode');el.value='range';el.dispatchEvent(new Event('change',{bubbles:true}));`);await pause(150);
 assert.equal(await evaluate('document.querySelectorAll(".active-filters button").length'),1);
 await evaluate('document.querySelector(".active-filters button").click()');
 assert.equal(await evaluate('document.querySelector("#month-mode").value'),"all");
 await evaluate(`const el=document.querySelector('#month-mode');el.value='range';el.dispatchEvent(new Event('change',{bubbles:true}));`);await pause(150);
 assert.equal(await evaluate('document.querySelector(\'input[aria-label="Data inicial de criação das OPs"]\').min'),'2026-10-01');
 await evaluate(`for(const [label,value] of [['Data inicial de criação das OPs','2026-10-21'],['Data final de criação das OPs','2026-10-25']]){const el=document.querySelector('[aria-label="'+label+'"]');Object.getOwnPropertyDescriptor(el.tagName=='SELECT'?HTMLSelectElement.prototype:el.tagName=='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));}`);
 await pause(200);assert.equal(await evaluate('document.querySelectorAll(".kanban-card").length'),1);
 await evaluate(`const el=document.querySelector('[aria-label="Data inicial de criação das OPs"]');Object.getOwnPropertyDescriptor(el.tagName=='SELECT'?HTMLSelectElement.prototype:el.tagName=='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,'2026-10-22');el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));`);await pause(200);assert.equal(await evaluate('document.querySelectorAll(".kanban-card").length'),0);
 await evaluate('document.querySelector(\'nav button[aria-label="Pendências"]\').click()');await pause(200);assert.equal(await evaluate('document.querySelector(".unlinked-grid").textContent.includes("OP KG")'),false);
 assert(await evaluate('document.querySelector(".pending-workspace").textContent.includes("Falta vincular o pedido")'));
 assert(await evaluate('document.querySelector(".pending-workspace").textContent.includes("Aguardando confirmação")'));
 await evaluate('document.querySelector(\'nav button[aria-label="Produção"]\').click()');await until('!!document.querySelector(".production-view-switch")');await evaluate('[...document.querySelectorAll(".production-view-switch button")].find(b=>b.textContent.includes("Interna em KG")).click()');await pause(200);assert(await evaluate('document.querySelector(".internal-group").textContent.includes("OP KG")'));
 assert(await evaluate('document.querySelector(".pending-help").textContent.includes("não exige pedido de venda")'));
 await evaluate('document.querySelector(\'nav button[aria-label="Pedidos de venda"]\').click()');await until('document.querySelectorAll(".sales-order").length===50');
 await evaluate('document.querySelector(\'button[aria-label="Próxima página de pedidos"]\').click()');await pause(200);assert.equal(await evaluate('document.querySelectorAll(".sales-order").length'),3);
 await evaluate('document.querySelector(\'nav button[aria-label="Manual de boas práticas"]\').click()');await pause(150);assert(await evaluate('document.querySelector(".manual-panel").textContent.includes("Empresas")'));
 await evaluate('document.querySelector(\'nav button[aria-label="Produção"]\').click()');await evaluate(`const el=document.querySelector('#month-mode');el.value='all';el.dispatchEvent(new Event('change',{bubbles:true}));`);await pause(200);
 await send("Page.reload");await until('document.querySelectorAll(".kanban-card").length===1');assert.equal(board.details["PV TESTE"].envio.rastreio,"RA123TESTE");assert.equal(board.details["PV TESTE"].empresa,"Maya");await until('!!document.querySelector(".company-tag")');
 const shot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(path.resolve(".sites-runtime/quadro-qa.png"),Buffer.from(shot.data,"base64"));
 await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(250);
 assert(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));
 await send("Page.navigate",{url:"http://127.0.0.1:5173/?aba=packing"});await until('document.querySelectorAll(".packing-document-card").length===1');
 assert(await evaluate('document.querySelector(".packing-document-card").textContent.includes("PV SEM OP")'));
 await evaluate('document.querySelector(".packing-document-card").click()');await packingStep("document");
 assert.equal(await evaluate('document.querySelector(\'input[aria-label="Número da invoice"]\').value'),invoice+"-REV");
 assert(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));

 // A third order joins the saved shipment without re-querying or replacing its recipient.
 snapshot.grupos.push({id:"PV EXTRA",codigo:"PV EXTRA",cliente:"Cliente sem OP",ordens:[],vinculo:"none"});
 assert.equal(board.boxModels[0].nome,"Caixa padrão QA");
 const readsBefore=clientReads;
 await send("Page.reload");await until('document.querySelectorAll(".packing-document-card").length===1');
 await evaluate('document.querySelector(".packing-document-card").click()');
 await until('document.querySelectorAll(".group-order-list input").length===3');
 await evaluate('[...document.querySelectorAll(".group-order-list label")].find(l=>l.textContent.includes("PV EXTRA")).querySelector("input").click()');
 await until('document.querySelector(\'[data-packing-step="boxes"]\').disabled');
 rejectNextConfirmation=true;await evaluate('document.querySelector(\'nav button[aria-label="Manual de boas práticas"]\').click()');await pause(100);
 assert(await evaluate('!!document.querySelector(".packing-workspace")'));
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Descartar seleção não confirmada")).click()');
 await until('!document.querySelector(\'[data-packing-step="boxes"]\').disabled');
 await evaluate('[...document.querySelectorAll(".group-order-list label")].find(l=>l.textContent.includes("PV EXTRA")).querySelector("input").click()');
 await evaluate('document.querySelector(".client-apply").click()');await waitForSave();
 assert.equal(clientReads,readsBefore);
 assert.deepEqual(board.details["PV TESTE"].envio.agrupamento.pedidos,["PV TESTE","PV SEM OP","PV EXTRA"]);
 assert.equal(board.details["PV TESTE"].envio.packing.destinatarioNome,"Destinatario teste");
 assert.equal(board.details["PV TESTE"].envio.packing.invoiceNumero,invoice+"-REV");
 assert.equal(board.details["PV TESTE"].envio.caixas.length,1);
 // Bridges go to the same order and return to the same shipment.
 await evaluate('document.querySelector(".linked-order-actions").open=true;[...document.querySelectorAll(".linked-order-actions>div")].find(e=>e.textContent.includes("PV SEM OP")).querySelector("button").click()');
 await until('!!document.querySelector(".card-dialog")');
 assert(await evaluate('document.querySelector(".dialog-header").textContent.includes("PV SEM OP")'));
 await evaluate('document.querySelector(\'[data-detail-tab="shipping"]\').click()');await evaluate('document.querySelector(".packing-shortcut").click()');
 await until('!!document.querySelector(".packing-workspace-editor")');
 assert(await evaluate('document.querySelector(".packing-workspace-editor").textContent.includes("PV EXTRA")'));
 await evaluate('document.querySelector(".flow-summary button").click()');
 await until('!!document.querySelector("#tutorial-packing")');
 assert.equal(await evaluate('document.querySelectorAll(".manual-tutorial").length'),1);
 assert.equal(await evaluate('document.querySelector(".manual-full-details").open'),false);
 await evaluate('document.querySelector(".manual-breadcrumb button").click()');assert.equal(await evaluate('document.querySelectorAll("[data-manual-category]").length'),6);
 await evaluate('document.querySelector("[data-manual-category=expedition]").click()');assert.equal(await evaluate('document.querySelectorAll("[data-manual-topic]").length'),2);
 await evaluate('document.querySelector("[data-manual-topic=boxes]").click()');await until('!!document.querySelector("#tutorial-boxes")');
 await evaluate('[...document.querySelectorAll("#tutorial-boxes .manual-next button")].find(b=>b.textContent.includes("Invoice")).click()');await until('!!document.querySelector("#tutorial-invoices")');
 await evaluate(`const el=document.querySelector('[aria-label="Buscar no manual"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"rastreio");el.dispatchEvent(new Event("input",{bubbles:true}))`);
 assert.equal(await evaluate('document.querySelectorAll(".manual-tutorial").length'),0);
 assert(await evaluate('!!document.querySelector("[data-manual-topic=dispatch]")'));
 assert(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Voltar ao trabalho").click()');
 await until('!!document.querySelector(".packing-workspace-editor")');
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Novo packing list").click()');
 assert.equal(await evaluate('document.querySelectorAll(".packing-document-card").length'),0);
 // Delete only draft shipments. Grouped source copies must not reappear after reload.
 await send("Page.navigate",{url:"http://127.0.0.1:5173/?aba=packing"});await until('document.querySelectorAll(".packing-document-card").length===1');
 assert.equal(await evaluate('document.querySelectorAll("[data-packing-delete]").length'),0);
 snapshot.grupos.push({id:"PV RASCUNHO",codigo:"PV RASCUNHO",cliente:"Cliente rascunho",ordens:[],vinculo:"none"},{id:"PV RASCUNHO 2",codigo:"PV RASCUNHO 2",cliente:"Cliente rascunho",ordens:[],vinculo:"none"});
 board.details["PV RASCUNHO"]={responsavel:"",nota:"Manter nota",situacao:"A programar",envio:{...emptyShipment(),caixas:[newBox([],"draft-box")],agrupamento:{pedidos:["PV RASCUNHO","PV RASCUNHO 2"],titularKey:"c".repeat(64),titularNome:"Titular rascunho",confirmadoEm:"2026-10-25T12:00:00.000Z"}}};
 board.details["PV RASCUNHO 2"]={responsavel:"",nota:"Outra nota",situacao:"A programar",envio:emptyShipment()};revision++;
 await send("Page.reload");await until('document.querySelectorAll(".packing-document-card").length===2');
 const writesBeforeDelete=writes;rejectNextConfirmation=true;await evaluate('document.querySelector("[data-packing-delete]").click()');await pause(200);
 assert.equal(writes,writesBeforeDelete);assert(board.details["PV RASCUNHO"].envio);
 await evaluate('document.querySelector("[data-packing-delete]").click()');await until('document.querySelectorAll(".packing-document-card").length===1');
 assert(board.details["PV RASCUNHO"].envio.packingExcluido);assert.equal(board.details["PV RASCUNHO"].envio.caixas.length,1);assert(board.details["PV RASCUNHO 2"].envio);assert.equal(board.details["PV RASCUNHO"].nota,"Manter nota");assert(board.details["PV TESTE"].envio);
 await send("Page.reload");await pause(350);await until('document.querySelectorAll(".packing-document-card").length===1');
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Novo packing list")).click()');await until('[...document.querySelectorAll(".packing-document-card")].some(c=>c.textContent.includes("PV RASCUNHO 2"))');
 assert.equal(await evaluate('document.querySelectorAll(".packing-document-card").length'),1);
 assert(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));

 board.invoices={draftFedex:emptyInvoice("draftFedex"),draftDhl:emptyInvoice("draftDhl","DHL"),dated:{...emptyInvoice("dated"),dataEnvio:"2026-10-14"},sent:{...emptyInvoice("sent","DHL"),orderIds:["PV TESTE"]},dispatch:emptyInvoice("dispatch","DHL")};revision++;
 const packingBeforeInvoiceDelete=JSON.stringify(board.details);
 await send("Page.navigate",{url:"http://127.0.0.1:5173/?aba=invoices"});await until('document.querySelectorAll(".invoice-workspace .packing-document-card").length===5');
 assert.equal(await evaluate('document.querySelectorAll("[data-invoice-delete]").length'),3);
 const invoiceWrites=writes;rejectNextConfirmation=true;await evaluate(`document.querySelector('[data-invoice-delete="draftFedex"]').click()`);await pause(150);assert.equal(writes,invoiceWrites);assert(board.invoices.draftFedex);
 for(const id of ["draftFedex","draftDhl"]){await evaluate(`document.querySelector('[data-invoice-delete="'+${JSON.stringify(id)}+'"]').click()`);await until(`!document.querySelector('[data-invoice-delete="'+${JSON.stringify(id)}+'"]')`);assert(!board.invoices[id]);}
 await send("Page.reload");await until('document.querySelectorAll(".invoice-workspace .packing-document-card").length===3');assert.equal(await evaluate('document.querySelectorAll("[data-invoice-delete]").length'),1);
 await evaluate(`document.querySelector('[data-invoice-delete="dispatch"]').parentElement.querySelector(".packing-document-card").click()`);await until('!!document.querySelector(".invoice-fields")');
 await evaluate(`document.querySelector(".invoice-fields .shipping-general summary").click();const input=document.querySelector('[aria-label="Data de envio da invoice"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,"2026-10-14");input.dispatchEvent(new Event("input",{bubbles:true}))`);await waitForSave();assert.equal(board.invoices.dispatch.dataEnvio,"2026-10-14");
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Voltar às invoices").click()');assert.equal(await evaluate('document.querySelectorAll("[data-invoice-delete]").length'),0);assert.equal(JSON.stringify(board.details),packingBeforeInvoiceDelete);
 console.log("OK exclusão de invoices no navegador: cancelar preserva, excluir FedEx e DHL persiste após recarga, data de envio e pedido enviado protegem, caixas e packing lists intactos.");
 console.log("OK exclusão no navegador: cancelar preserva rascunho, confirmar preserva caixas e agrupamento, finalizado protegido, pedidos disponíveis de novo e exclusão preservada após recarga.");
 console.log("OK pontes e manual: seleção pendente protegida, destinatário reutilizado sem nova consulta, terceiro pedido sem duplicação de caixas, retorno ao mesmo envio, seis categorias e doze procedimentos, busca e celular.");
 console.log("OK área de packing lists: menu separado, seleção múltipla, documento único por agrupamento, persistência após recarga, PDF e celular.");
 console.log("OK navegador: seis menus, próximas ações, filtros recolhidos, histórico recolhível, editor único de caixas, pendências reunidas, seis colunas fixas e arrastar para colunas vazias, entrada automática, pedidos sem OP no catálogo, recolher menu, empresas, alocação sem checkbox, titular com confirmação/cancelamento, autosave durante digitação, avisos, intervalo, OP interna em KG sem obrigação de vínculo, manual, envio, caixas, rastreio, catálogo, recarga e celular. APIs simuladas; nenhum dado real alterado. Gravações simuladas: "+writes);
}finally{socket?.close();browser.kill()}

