import {deleteDraftInvoice} from "../lib/invoice-delete.mjs";
import {emptyInvoice} from "../lib/invoice.mjs";
import {deleteDraftPacking} from "../lib/packing-delete.mjs";
import {emptyShipment,newBox,newItem} from "../lib/shipping.mjs";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdirSync,writeFileSync,existsSync,readFileSync} from "node:fs";
import path from "node:path";
const dir=path.resolve(".sites-runtime/conference-qa");mkdirSync(dir,{recursive:true});
const browser=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless","--disable-gpu","--no-first-run","--remote-debugging-port=9241","--user-data-dir="+dir,"about:blank"],{windowsHide:true,stdio:"ignore"});
const pdfDir=path.resolve(".sites-runtime/packing-download-qa");mkdirSync(pdfDir,{recursive:true});const invoice="QA-"+Date.now();
let clientReads=0;let socket;let rejectNextConfirmation=false;const confirmations=[];const pause=ms=>new Promise(r=>setTimeout(r,ms));
const snapshot={consultadoEm:"2026-10-25",ordensConsultadas:3,grupos:[
{id:"PV TESTE",codigo:"PV TESTE",cliente:"Cliente de teste",ordens:[{id:"OP TESTE",nome:"OP TESTE",validadeLote:"2027-10-15",produto:"Produto teste 10g",quantidade:"10",unidade:"UNID",criacao:"2026-10-21"}],vinculo:"linked"},
{id:"PV SEM OP",codigo:"PV SEM OP",cliente:"Cliente sem OP",ordens:[],vinculo:"none"}],
semVinculo:[{id:"OP PENDENTE",nome:"OP PENDENTE",produto:"Produto sem vínculo",quantidade:"10",unidade:"UNID",criacao:"2026-10-22"},{id:"OP KG",nome:"OP KG",produto:"Mistura KG",quantidade:"10",unidade:"KG",criacao:"2026-10-22"}]};
snapshot.pedidos=[...snapshot.grupos,...Array.from({length:51},(_,i)=>({id:"PV CAT "+i,codigo:"PV CAT "+i,cliente:"Cliente catálogo",ordens:[],itens:[{produto:"Produto catálogo",quantidade:"2",unidade:"KG"}]}))];
let board={sequence:[],details:{"PV TESTE":{responsavel:"Nome anterior",nota:"",situacao:"A programar",conferidas:["OP TESTE"]}}},revision=0,writes=0,concurrent=0,maxConcurrent=0;

snapshot.grupos[0].ordens=Array.from({length:25},(_,i)=>({id:i===0?"OP TESTE":"OP"+(i+1),nome:i===0?"OP TESTE":"OP"+(i+1),produto:i===0?"Rapé Kuntanawa 250g":"Produto "+(i+1)+" 10g",quantidade:i===0?"10":"4",quantidadeProgramada:i===0?"12":"4",unidade:"UNID",criacao:"2026-10-21"}));
snapshot.grupos.push({id:"PV DHL",codigo:"PV DHL",cliente:"Cliente DHL",vinculo:"linked",ordens:[{id:"OP DHL",nome:"OP DHL",produto:"Produto DHL",quantidade:"2",unidade:"UNID",criacao:"2026-10-21"}]});
snapshot.pedidos=[...snapshot.grupos];
const op=snapshot.grupos[0].ordens[0];
board.details["PV TESTE"].envio={...emptyShipment(),organizacao:"direct",caixas:[{...newBox([],"box"),montada:false,itens:[{...newItem("item"),opId:op.id,produto:op.produto,unidade:op.unidade,quantidade:"4"}]}]};
const filterOps=snapshot.grupos[0].ordens;
Object.assign(filterOps[2],{unidade:"KG",quantidade:"8",quantidadeProgramada:"8"});
Object.assign(filterOps[3],{quantidade:"",quantidadeProgramada:""});
Object.assign(filterOps[5],{unidade:"G",quantidade:"20",quantidadeProgramada:"20"});
Object.assign(filterOps[6],{unidade:"L",quantidade:"3",quantidadeProgramada:"3"});
board.details["PV TESTE"].envio.caixas[0].itens.push({...newItem("complete"),opId:"OP2",produto:filterOps[1].produto,unidade:"UNID",quantidade:"4"});
board.details["PV TESTE"].envio.caixas.push({...newBox(board.details["PV TESTE"].envio.caixas,"box2"),itens:[{...newItem("kg"),opId:"OP3",produto:filterOps[2].produto,unidade:"KG",quantidade:"2"},{...newItem("excess"),opId:"OP5",produto:filterOps[4].produto,unidade:"UNID",quantidade:"6"}]});
board.details["PV DHL"]={responsavel:"",nota:"",situacao:"Programado",envio:{...emptyShipment(),transportadora:"DHL"}};
try{
 let pages;for(let i=0;i<60;i++){try{pages=await(await fetch("http://127.0.0.1:9241/json")).json();if(pages.some(p=>p.type==="page"))break}catch{}await pause(200)}
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
 async function until(expression){for(let i=0;i<80;i++){if(await evaluate(expression))return;await pause(150)}throw Error("Timeout: "+expression+"; body="+await evaluate("document.body.innerText.slice(0,1800)"))}
 const waitForSave=async()=>{await pause(150);await until('[...document.querySelectorAll(".autosave-status")].every(el=>el.textContent==="Salvo")')};
 await send("Page.enable");await send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.removeItem(\"pagnier-view\")"});await send("Fetch.enable",{patterns:[{urlPattern:"*://127.0.0.1:5173/api/*",requestStage:"Request"}]});await send("Emulation.setDeviceMetricsOverride",{width:1600,height:1000,deviceScaleFactor:1,mobile:false});

 await send("Page.navigate",{url:"http://127.0.0.1:5173/signin-with-chatgpt?return_to=/"});await until('document.querySelectorAll(".kanban-card").length===2');await waitForSave();
 const click=async selector=>{await evaluate('document.querySelector('+JSON.stringify(selector)+').click()');await pause(100)};
 const input=async(selector,value)=>{await evaluate('const el=document.querySelector('+JSON.stringify(selector)+');Object.getOwnPropertyDescriptor(el.tagName==="SELECT"?HTMLSelectElement.prototype:HTMLInputElement.prototype,"value").set.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event(el.tagName==="SELECT"?"change":"input",{bubbles:true}))');await pause(120)};
 await evaluate('[...document.querySelectorAll(".kanban-card")].find(e=>e.textContent.includes("Cliente de teste")).querySelector(".card-open").click()');
 await input('[aria-label="Etiqueta de envio"]',"DHL");await waitForSave();assert.equal(board.details["PV TESTE"].envio.transportadora,"DHL");
 await until('!!document.querySelector(".carrier-fields .carrier-logo-dhl")&&document.querySelector(".carrier-fields .carrier-logo-dhl").naturalWidth>0');
 writeFileSync(".sites-runtime/etiqueta-envio.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await click('[data-detail-tab="expedition"]');await until('!!document.querySelector(".product-conference")');
 assert.equal(await evaluate('document.querySelector("[aria-label="+JSON.stringify("Transportadora do envio")+"]").value'),"DHL");
 assert.equal(await evaluate('document.querySelectorAll(".pc-row").length'),20);
 assert.equal(await evaluate('document.querySelector(".pc-result").textContent'),"1–20 de 25");
 assert.equal(await evaluate('document.querySelectorAll("[role=tooltip]").length'),0);
 await click('.pc-pagination button:last-child');assert.equal(await evaluate('document.querySelectorAll(".pc-row").length'),5);
 await input('.pc-search input',"RAPE OP TESTE");assert.equal(await evaluate('document.querySelectorAll(".pc-row").length'),1);
 assert.deepEqual(await evaluate('[...document.querySelectorAll(".pc-row .pc-number strong")].map(e=>e.textContent)'),["10","4","6"]);
 await click('[data-conference-filter="attention"]');assert.equal(await evaluate('document.querySelectorAll(".pc-row").length'),1);
 await input('.pc-search input',"inexistente");assert.equal(await evaluate('document.querySelectorAll(".pc-row").length'),0);assert(await evaluate('document.querySelector(".pc-empty").textContent.includes("Nenhum produto")'));
 await click('.pc-empty button');assert.equal(await evaluate('document.querySelectorAll(".pc-row").length'),20);
 // Combined filters are view-only, reset pagination and preserve the search on clear.
 const rowIds=()=>evaluate('[...document.querySelectorAll(".pc-row")].map(e=>e.dataset.opId)');
 const filterInput=(label,value)=>input('[aria-label="'+label+'"]',value);
 const writesBeforeFilters=writes;
 assert.equal(await evaluate('!!document.querySelector(".pc-advanced")'),false);
 await click('.pc-pagination button:last-child');await click('.pc-filter-toggle');
 await filterInput("Filtrar situação da embalagem","complete");assert.deepEqual(await rowIds(),["OP2"]);
 await filterInput("Filtrar situação da embalagem","partial");assert.deepEqual(await rowIds(),["OP TESTE","OP3"]);
 await filterInput("Filtrar unidade","KG");assert.deepEqual(await rowIds(),["OP3"]);
 await filterInput("Filtrar caixa","box");assert.deepEqual(await rowIds(),[]);
 await click('.pc-empty button');assert.equal((await rowIds()).length,20);
 await filterInput("Filtrar situação da embalagem","none");assert(!(await rowIds()).some(id=>["OP TESTE","OP2","OP3","OP4","OP5"].includes(id)));
 await filterInput("Filtrar situação da embalagem","all");
 for(const [kind,expected] of [["any",["OP TESTE","OP4","OP5"]],["changed",["OP TESTE"]],["excess",["OP5"]],["incomplete",["OP4"]]]){await filterInput("Filtrar divergência",kind);assert.deepEqual(await rowIds(),expected)}
 await filterInput("Filtrar divergência","all");await filterInput("Filtrar caixa","box2");assert.deepEqual(await rowIds(),["OP3","OP5"]);
 await click('.pc-filter-toggle');assert.equal(await evaluate('!!document.querySelector(".pc-advanced")'),false);assert(await evaluate('document.querySelector(".pc-active-filters").textContent.includes("CX-002")'));
 await click('.pc-active-filters button');assert.equal((await rowIds()).length,20);await click('.pc-filter-toggle');
 await filterInput("Ordenar produtos","op");assert.deepEqual((await rowIds()).slice(0,3),["OP TESTE","OP2","OP3"]);assert((await rowIds()).indexOf("OP2")<(await rowIds()).indexOf("OP10"));
 await filterInput("Ordenar produtos","product");assert.deepEqual((await rowIds()).slice(0,3),["OP2","OP3","OP4"]);
 await filterInput("Filtrar unidade","UNID");await filterInput("Ordenar produtos","remaining");assert.equal((await rowIds())[0],"OP TESTE");
 await input('.pc-search input',"OP TESTE");await click('.pc-filter-actions .text-action');assert.equal(await evaluate('document.querySelector(".pc-search input").value'),"OP TESTE");assert.deepEqual(await rowIds(),["OP TESTE"]);
 await click('[data-conference-filter="attention"]');await filterInput("Filtrar divergência","changed");assert.deepEqual(await rowIds(),["OP TESTE"]);
 await click('.pc-filter-actions .text-action');await pause(450);assert.equal(writes,writesBeforeFilters);
 await evaluate('document.querySelector(".pc-filter-toggle").scrollIntoView({block:"start"})');
 writeFileSync(".sites-runtime/conferencia-filtros-desktop.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(150);
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));assert(await evaluate('const e=document.querySelector(".pc-advanced");e.scrollWidth<=e.clientWidth+1'));
 await evaluate('document.querySelector(".pc-filter-toggle").scrollIntoView({block:"start"})');writeFileSync(".sites-runtime/conferencia-filtros-mobile.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await click('.pc-filter-toggle');await send("Emulation.setDeviceMetricsOverride",{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
 await input('.pc-search input',"OP TESTE");
 await input('[aria-label="Responsável pela conferência"]',"Victor");await input('[aria-label="Transportadora do envio"]',"FedEx");await waitForSave();
 assert.equal(board.details["PV TESTE"].responsavelConferencia,"Victor");assert.equal(board.details["PV TESTE"].envio.transportadora,"FedEx");await until('!!document.querySelector(".pc-carrier .carrier-logo-fedex")&&document.querySelector(".pc-carrier .carrier-logo-fedex").naturalWidth>0');assert.equal(await evaluate('document.querySelector("[aria-label="+JSON.stringify("Etiqueta de envio")+"]").value'),"FedEx");assert.equal(board.details["PV TESTE"].envio.caixas[0].itens[0].quantidade,"4");
 await click('[aria-label="Ajuda: Conferência dos produtos"]');assert(await evaluate('document.querySelector("[role=tooltip]").textContent.includes("contagem física")'));await click('[aria-label="Ajuda: Conferência dos produtos"]');
 // Real pointer and keyboard interactions: explanations stay hidden until requested.
 const helpSelector='[aria-label="Ajuda: Conferência dos produtos"]';
 const point=await evaluate('const r=document.querySelector('+JSON.stringify(helpSelector)+').getBoundingClientRect();({x:r.x+r.width/2,y:r.y+r.height/2})');
 await send("Input.dispatchMouseEvent",{type:"mouseMoved",...point});await until('!!document.querySelector("[role=tooltip]")');
 await send("Input.dispatchMouseEvent",{type:"mouseMoved",x:5,y:5});await until('!document.querySelector("[role=tooltip]")');
 await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Tab",code:"Tab",windowsVirtualKeyCode:9});await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Tab",code:"Tab",windowsVirtualKeyCode:9});
 await evaluate('document.querySelector('+JSON.stringify(helpSelector)+').focus()');await until('!!document.querySelector("[role=tooltip]")');
 await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});await until('!document.querySelector("[role=tooltip]")');assert(await evaluate('!!document.querySelector(".product-conference")'));
 await evaluate('document.querySelector(".product-conference").scrollIntoView({block:"start"})');
 writeFileSync(".sites-runtime/conferencia-desktop.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(180);
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
 assert(await evaluate('const el=document.querySelector(".product-conference");el.scrollWidth<=el.clientWidth+1'));
 await click('[aria-label="Ajuda: Conferência dos produtos"]');assert(await evaluate('const r=document.querySelector("[role=tooltip]").getBoundingClientRect();r.left>=0&&r.right<=innerWidth'));
 await click('[aria-label="Ajuda: Conferência dos produtos"]');
 await evaluate('document.querySelector(".product-conference").scrollIntoView({block:"start"})');
 writeFileSync(".sites-runtime/conferencia-mobile.png",Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 await click('.pc-details summary');await click('.pc-box-links button');await until('!!document.querySelector(".box-focus")');
 assert(await evaluate('document.querySelector(".box-focus").textContent.includes("CX-001")'));
 await click('.close');assert(await evaluate('document.querySelectorAll(".kanban-card .carrier-logo-fedex").length===1&&document.querySelectorAll(".kanban-card .carrier-logo-dhl").length===1'));await click('.filter-toggle');
 await input('[aria-label="Filtrar transportadora"]',"FedEx");assert.equal(await evaluate('document.querySelectorAll(".kanban-card").length'),1);assert(await evaluate('document.querySelector(".kanban-card").textContent.includes("Cliente de teste")'));
 assert.equal(await evaluate('JSON.parse(localStorage.getItem("pagnier-view")).carrier'),"FedEx");
 await input('[aria-label="Filtrar transportadora"]',"DHL");assert(await evaluate('document.querySelector(".kanban-card").textContent.includes("Cliente DHL")'));
 await input('[aria-label="Filtrar transportadora"]',"A definir");assert.equal(await evaluate('document.querySelectorAll(".kanban-card").length'),0);
 await click('[aria-label="Remover filtro: Envio: A definir"]');assert.equal(await evaluate('document.querySelectorAll(".kanban-card").length'),2);
 console.log("OK conferência: busca sem acento/múltiplos termos, paginação, filtros combinados de embalagem/divergência/unidade/caixa, ordenação, limpeza preservando busca, filtros sem gravação, quantidades, ajuda sob demanda, celular, responsável e transportadora salvos, atalhos e FedEx/DHL no quadro. Dados simulados.");
}finally{socket?.close();browser.kill()}
