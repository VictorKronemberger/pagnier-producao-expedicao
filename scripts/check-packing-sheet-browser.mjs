import {build} from "esbuild";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
import path from "node:path";
const dir=path.resolve(".sites-runtime/packing-sheet-qa");mkdirSync(dir,{recursive:true});
const fixture=`import React,{useState} from "react";import {createRoot} from "react-dom/client";
import ShipmentEditor from "./app/shipment-editor";
import {emptyShipment,normalizeShipment} from "./lib/shipping.mjs";
const ops=Array.from({length:23},(_,i)=>({id:"stock-"+i,nome:"OP-"+i,produto:i===2?"Produto a granel":"Artesanato de demonstração",sku:"SKU-"+i,quantidade:i===2?"2,500":"20",unidade:i===2?"KG":"UNID",estoque:true}));
window.backgroundEscapes=0;document.addEventListener("keydown",e=>{if(e.key==="Escape")window.backgroundEscapes++});
function App(){const [saveLabel,setSaveLabel]=useState("Salvo (teste)");window.saveLabelQA=setSaveLabel;const [value,setValue]=useState({...emptyShipment(),organizacao:"direct"});const [step,setStep]=useState("outer");const [disabled,setDisabled]=useState(false);window.qa=value;window.disableQA=setDisabled;window.reloadQA=()=>setValue(normalizeShipment(JSON.parse(JSON.stringify(value)),ops));window.resetQA=(mode="bags")=>{setValue({...emptyShipment(),organizacao:mode});setStep("small")};return <ShipmentEditor orderLabel="Pedido DEMO-123 · Cliente de demonstração" saveStatus={<span role="status">{saveLabel}</span>} value={value} ops={ops} onChange={setValue} disabled={disabled} assemblyStep={step} onAssemblyStepChange={setStep}/>;}
createRoot(document.getElementById("root")).render(<App/>);`;
await build({stdin:{contents:fixture,resolveDir:process.cwd(),loader:"tsx"},bundle:true,outfile:path.join(dir,"app.js"),jsx:"automatic",platform:"browser"});
const css=readFileSync("app/theme.css","utf8")+readFileSync("app/globals.css","utf8").replace(/@import[^;]+;/g,"")+readFileSync(path.join(dir,"app.css"),"utf8");
const server=createServer((req,res)=>{
 if(req.url==="/app.js"){res.setHeader("Content-Type","text/javascript; charset=utf-8");res.end(readFileSync(path.join(dir,"app.js")))}
 else if(req.url.startsWith("/api/")){res.setHeader("Content-Type","application/json");res.end("{}")}
 else{res.setHeader("Content-Type","text/html; charset=utf-8");res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css+'body{padding:24px;background:#eef2eb}#root{max-width:1000px;margin:auto}@media(max-width:480px){body{padding:10px}}</style><div id="root"></div><script src="/app.js"></script>')}
});
await new Promise(r=>server.listen(5195,"127.0.0.1",r));
const browser=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless","--disable-gpu","--no-first-run","--remote-debugging-port=9250","--user-data-dir="+path.join(dir,"profile"),"about:blank"],{windowsHide:true,stdio:"ignore"});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let socket;
try{
 let pages;for(let i=0;i<60;i++){try{pages=await(await fetch("http://127.0.0.1:9250/json")).json();if(pages.some(p=>p.type==="page"))break}catch{}await pause(200)}
 socket=new WebSocket(pages.find(p=>p.type==="page").webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
 let id=0;const pending=new Map();
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}))});
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result)}};
 async function evaluate(expression){const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async function until(expression){for(let i=0;i<60;i++){if(await evaluate("!!("+expression+")"))return;await pause(100)}throw Error(expression)}
 const cell=(row,col)=>'document.querySelector(\'input[data-sheet-row="'+row+'"][data-sheet-col="'+col+'"]\')';
 async function input(selector,value){await evaluate('(()=>{const el='+selector+';el.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event("input",{bubbles:true}))})()');await pause(90)}
 async function clickText(text){await evaluate('(()=>{const el=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+JSON.stringify(text)+');if(!el)throw Error("Missing button");el.click()})()');await pause(100)}
 async function paste(row,col,text){await evaluate('(()=>{const el='+cell(row,col)+';el.focus();const data=new DataTransfer();data.setData("text/plain",'+JSON.stringify(text)+');el.dispatchEvent(new ClipboardEvent("paste",{clipboardData:data,bubbles:true,cancelable:true}))})()');await pause(100)}
 await send("Emulation.setDeviceMetricsOverride",{width:1200,height:1200,deviceScaleFactor:1,mobile:false});
 await send("Page.navigate",{url:"http://127.0.0.1:5195"});
 await until('document.querySelector("[aria-label=\'Planilha de montagem\']")');
 await clickText("Nova Caixa 40");await clickText("Nova Caixa 40");
 await evaluate(`document.querySelector("[aria-label='Caixas 40 da planilha'] button").click()`);await pause(100);
 assert.equal(await evaluate('window.qa.caixas.length'),2);
 await input(cell(0,0),"12");await input(cell(0,1),"8");
 assert.equal(await evaluate('window.qa.caixas[0].itens[0].quantidade'),"12");
 assert.equal(await evaluate('window.qa.caixas[1].itens[0].sku'),"SKU-0");
 assert((await evaluate('document.querySelector("[aria-label=\'Conteúdo da caixa selecionada\']").textContent')).includes("8"),"live content preview");
 await input(cell(0,1),"9");
 assert.equal(await evaluate('window.qa.caixas[1].itens[0].quantidade'),"8","excess rejected");
 assert.equal(await evaluate(cell(0,1)+'.getAttribute("aria-invalid")'),"true");
 await evaluate(cell(0,1)+'.blur()');
 await paste(0,0,"5\t15\n3\t4");
 assert.equal(await evaluate('window.qa.caixas[0].itens[0].quantidade'),"5");
 assert.equal(await evaluate('window.qa.caixas[1].itens[0].quantidade'),"15");
 assert.equal(await evaluate('window.qa.caixas[1].itens[1].sku'),"SKU-1","distinct same-name product");
 const snapshot=await evaluate('JSON.stringify(window.qa)');
 await paste(0,0,"6\t16\n2\t2");assert.equal(await evaluate('JSON.stringify(window.qa)'),snapshot,"paste is atomic");
 await input(cell(2,0),"1,");await input(cell(2,0),"1,250");await input(cell(2,1),"1.250");
 assert.equal(await evaluate('window.qa.caixas[0].itens.find(i=>i.opId==="stock-2").quantidade'),"1,250");
 await evaluate(cell(0,0)+'.focus()');
 await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Enter",code:"Enter"});await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Enter",code:"Enter"});
 assert.equal(await evaluate('document.activeElement.dataset.sheetRow'),"1");
 await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Tab",code:"Tab",windowsVirtualKeyCode:9});await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Tab",code:"Tab",windowsVirtualKeyCode:9});
 assert.equal(await evaluate('document.activeElement.dataset.sheetCol'),"1");
 await clickText("Próxima");assert.equal(await evaluate('document.querySelectorAll("input[data-sheet-col=\'0\']").length'),3);await clickText("Anterior");
 await input('document.querySelector("[aria-label=\'Buscar produto na planilha\']")',"SKU-1");
 assert.equal(await evaluate('document.querySelectorAll("input[data-sheet-col=\'0\']").length'),11);
 await input('document.querySelector("[aria-label=\'Buscar produto na planilha\']")',"");
 await evaluate('window.reloadQA()');await pause(120);
 assert.equal(await evaluate('window.qa.caixas[1].itens[0].quantidade'),"15");
 await input(cell(0,0),"");assert.equal(await evaluate('window.qa.caixas[0].itens.some(i=>i.opId==="stock-0")'),false);
 await evaluate('window.disableQA(true)');await pause(100);assert.equal(await evaluate(cell(1,0)+'.matches(":disabled")'),true);await evaluate('window.disableQA(false)');await pause(100);

 await clickText("Abrir tela da planilha");
 await until('document.querySelector("dialog:modal")');
 assert(await evaluate('document.querySelector("dialog").getBoundingClientRect().width>1100'),"dedicated screen uses viewport width");
 assert((await evaluate('document.querySelector("dialog").textContent')).includes("DEMO-123"));
 await input(cell(1,0),"6");
 assert((await evaluate('document.querySelector("[aria-label=\'Conteúdo da caixa selecionada\']").textContent')).includes("CX-001"));
 assert((await evaluate('document.querySelector("[aria-label=\'Conteúdo da caixa selecionada\']").textContent')).includes("6"));
 await clickText("Só falta embalar");
 assert.equal(await evaluate('document.querySelectorAll("tr[data-complete=\'true\']").length'),0);
 await clickText("Só falta embalar");
 await evaluate('window.saveLabelQA("Salvando (teste)")');await pause(100);
 assert((await evaluate('document.querySelector("dialog").textContent')).includes("Salvando (teste)"));
 await evaluate('window.saveLabelQA("Salvo (teste)")');
 await evaluate('window.disableQA(true)');await pause(100);
 assert.equal(await evaluate(cell(1,0)+'.matches(":disabled")'),true);
 assert.equal(await evaluate('[...document.querySelectorAll("dialog button")].find(b=>b.textContent.includes("Voltar à montagem")).matches(":disabled")'),false,"screen can close while loading");
 await evaluate('window.disableQA(false)');await pause(100);
 await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape"});
 await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape"});
 await until('!document.querySelector("dialog:modal")');
 assert.equal(await evaluate('window.backgroundEscapes'),0,"Escape does not close parent order");
 assert((await evaluate('document.activeElement.textContent')).includes("Abrir tela da planilha"),"focus restored");
 await clickText("Abrir tela da planilha");await until('document.querySelector("dialog:modal")');
 for(const [name,width,height,mobile] of [["desktop",1440,1000,false],["mobile",390,844,true]]){
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile});await pause(150);
  await evaluate('document.querySelector("[aria-label=\'Planilha de montagem\']").scrollIntoView({block:"start"})');
  assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),"no viewport overflow "+name);
  writeFileSync(path.join(dir,name+".png"),Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 }
 await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await clickText("Pesos e detalhes da Caixa 40");
 await until('!document.querySelector("dialog:modal")');
 assert.equal(await evaluate('window.qa.caixas[0].itens.find(i=>i.opId==="stock-1").quantidade'),"6","screen edits survive return");
 await clickText("Planilha do pedido");await clickText("Abrir tela da planilha");await until('document.querySelector("dialog:modal")');
 await evaluate('window.dispatchEvent(new Event("pagnier-session-expired"))');
 await until('!document.querySelector("dialog:modal")');

 for(const mode of ["bags","inner"]){
  await evaluate('window.resetQA('+JSON.stringify(mode)+')');await pause(120);
  await clickText("Nova Caixa 40");
  assert.equal(await evaluate('window.qa.caixas.length'),1);
  assert.equal(await evaluate('window.qa.caixas[0].caixasInternas?.length??0'),0,"new outer waits for the first typed quantity");
  assert.equal(await evaluate('(window.qa.caixasEmMontagem??[]).length'),0);
  await clickText("Abrir tela da planilha");
  await input(cell(0,0),"7");await input(cell(1,0),"4");
  assert.equal(await evaluate('window.qa.caixas[0].itens[0].quantidade'),"7");
  await clickText(mode==="bags"?"Duplicar bag":"Duplicar caixa menor");
  assert.equal(await evaluate('window.qa.caixas[0].caixasInternas.length'),2);
  assert.equal(await evaluate('window.qa.caixas[0].itens.length'),4,"duplicates inside same outer");
  const before=await evaluate('JSON.stringify(window.qa)');
  await clickText(mode==="bags"?"Duplicar bag":"Duplicar caixa menor");
  assert.equal(await evaluate('JSON.stringify(window.qa)'),before,"copy cannot exceed order");
  await input('document.querySelector("[aria-label=\'Quantidade de novas embalagens\']")',"2");
  await clickText(mode==="bags"?"Adicionar bags":"Adicionar caixas menores");
  assert.equal(await evaluate('window.qa.caixas[0].caixasInternas.length'),4,"batch creation");
  await clickText("Concluir Caixa 40");
  assert.equal(await evaluate('window.qa.caixas[0].montada'),false,"cannot conclude with an empty inner");
  await clickText("Remover embalagem vazia");
  await input(cell(0,2),"3");await input(cell(1,2),"2");
  await evaluate('(()=>{const el=[...document.querySelectorAll("select")].find(e=>e.getAttribute("aria-label")==="Caixa 40 de "+window.qa.caixas[0].caixasInternas[2].codigo);el.value="new";el.dispatchEvent(new Event("change",{bubbles:true}))})()');await pause(100);
  assert.equal(await evaluate('window.qa.caixas.length'),2);
  assert.equal(await evaluate('window.qa.caixas[0].caixasInternas.length'),2);
  assert.equal(await evaluate('window.qa.caixas[1].itens[0].quantidade'),"3","move preserves content");
  await input(cell(0,0),"6");
  await clickText("Concluir Caixa 40");
  assert.equal(await evaluate('window.qa.caixas[1].montada'),true);
  assert.equal(await evaluate(cell(0,0)+'.disabled'),true,"concluded parent locks all inner columns");
  await clickText("Reabrir Caixa 40");await input(cell(0,0),"5");
  await evaluate('window.reloadQA()');await pause(100);
  assert.equal(await evaluate('window.qa.caixas[1].itens[0].quantidade'),"5","nested spreadsheet survives canonical reload");
  await evaluate('document.querySelector("[aria-label=\'Caixas 40 da planilha\'] button").click()');await pause(100);
  await paste(0,0,"8\t6\t6");
  assert.equal(await evaluate('window.qa.caixas[1].itens[0].quantidade'),"6","atomic cross-parent paste");
  for(const [name,width,height,mobile] of [["unified-"+mode,1440,1000,false],["unified-"+mode+"-mobile",390,844,true]]){
   await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile});await pause(150);
   assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),"no viewport overflow "+name);
   writeFileSync(path.join(dir,name+".png"),Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
  }
  await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await input(cell(1,2),"3");
  await input(cell(1,3),"21");assert.equal(await evaluate('window.qa.caixas[1].caixasInternas.length'),1,"rejected draft does not change destination");
  await input(cell(1,3),"1");assert.equal(await evaluate('window.qa.caixas[1].caixasInternas.length'),2,"new inner follows the selected outer in All view");
  assert.equal(await evaluate('window.qa.caixas[0].caixasInternas.length'),2,"first outer is not chosen implicitly on draft focus");
  await clickText("Voltar à montagem");
 }



 for(const mode of ["inner","bags"]){
  await evaluate('window.resetQA('+JSON.stringify(mode)+')');await pause(120);
  assert.equal(await evaluate('window.qa.caixas.length'),0);
  assert.equal(await evaluate('document.querySelectorAll("input[data-sheet-col=\'0\']").length'),20,"order rows are editable before creating any box");
  await input(cell(0,0),"21");assert.equal(await evaluate('window.qa.caixas.length'),0,"invalid first quantity creates nothing");
  await input(cell(0,0),"1");
  assert.equal(await evaluate('window.qa.caixas.length'),1);
  assert.equal(await evaluate('window.qa.caixas[0].caixasInternas.length'),1);
  assert.equal(await evaluate('document.activeElement.dataset.sheetCol'),"0","creation preserves the editing focus");
  await send("Input.insertText",{text:"2"});await pause(100);
  assert.equal(await evaluate('window.qa.caixas[0].itens[0].quantidade'),"12","continued typing stays in the same smaller box");
  await input(cell(1,0),"3");assert.equal(await evaluate('window.qa.caixas[0].itens.length'),2);
  assert.equal(await evaluate('(window.qa.caixasEmMontagem??[]).length'),0,"no separate preparation/placement stage");
  await paste(0,1,"5\n2");
  assert.equal(await evaluate('window.qa.caixas[0].caixasInternas.length'),2,"paste creates one inner for all its product rows");
  assert.equal(await evaluate('window.qa.caixas[0].itens.length'),4);
  await evaluate('window.reloadQA()');await pause(120);
  await clickText("Concluir Caixa 40");assert.equal(await evaluate('window.qa.caixas[0].montada'),true);
  assert.equal(await evaluate('document.querySelectorAll("td[data-new=true]").length'),0,"closed outer has no editable creation column");
 }
 await evaluate('window.resetQA("inner")');await pause(120);
 await input(cell(0,0),"5");await evaluate('document.querySelector("[aria-label=\'Desfazer última ação\']").click()');await pause(100);
 assert.equal(await evaluate('window.qa.caixas.length'),0,"undo removes both automatically-created levels");

 await evaluate('window.resetQA("inner")');await pause(120);
 await evaluate('document.querySelector("[aria-label=\'Mais ações\']").click()');await clickText("Criar menores preenchidas");
 await input('document.querySelector("[aria-label=\'Número de menores preenchidas\']")',"3");
 await evaluate('(()=>{const el=document.querySelector("[aria-label=\'Produto das menores\']");el.value="stock-0";el.dispatchEvent(new Event("change",{bubbles:true}))})()');await pause(100);
 await input('document.querySelector("[aria-label=\'Quantidade por embalagem\']")',"5");
 assert.equal(await evaluate('document.querySelectorAll("[aria-label=\'Quantidade de novas embalagens\']").length'),0,"creation count is not repeated while batch panel is open");
 await clickText("Criar preenchidas");
 assert.equal(await evaluate('window.qa.caixas[0].caixasInternas.length'),3,"filled batch creates outer and inners together");
 assert.equal(await evaluate('window.qa.caixas[0].itens.reduce((n,i)=>n+Number(i.quantidade),0)'),15);
 assert.equal(await evaluate('document.querySelectorAll("thead select").length'),0,"single outer hides repeated destination");
 assert.equal(await evaluate('document.querySelector("[aria-label=\'Caixas 40 da planilha\'] [aria-pressed=true]").textContent'),"CX-001");
 await input(cell(0,0),"4");await input(cell(0,0),"3");
 await evaluate('document.querySelector("[aria-label=\'Desfazer última ação\']").click()');await pause(120);
 assert.equal(await evaluate('window.qa.caixas[0].itens[0].quantidade'),"5","undo groups typing in one cell");
 await evaluate('document.querySelector("[aria-label=\'Mais ações\']").click()');await clickText("Mover menores em lote");
 await clickText("Selecionar visíveis");await clickText("Mover selecionadas");
 assert.equal(await evaluate('window.qa.caixas[1].caixasInternas.length'),3);
 assert.equal(await evaluate('window.qa.caixas[0].itens.length'),0);
 await evaluate('window.reloadQA()');await pause(120);
 await evaluate('document.querySelector("[aria-label=\'Desfazer última ação\']").click()');await pause(120);
 assert.equal(await evaluate('window.qa.caixas.length'),1,"undo batch move also removes its automatically-created destination");
 assert.equal(await evaluate('window.qa.caixas[0].itens.length'),3);
 await evaluate('document.querySelector("[aria-label=\'Mais ações\']").click()');await clickText("Criar menores preenchidas");
 await input('document.querySelector("[aria-label=\'Quantidade por embalagem\']")',"6");
 const beforeRejectedBatch=await evaluate('JSON.stringify(window.qa)');await clickText("Criar preenchidas");
 assert.equal(await evaluate('JSON.stringify(window.qa)'),beforeRejectedBatch,"overfilled batch rejected with no partial boxes");await clickText("Cancelar");
 await clickText("Abrir tela da planilha");
 for(const [name,width,height,mobile] of [["simplified",1440,1000,false],["simplified-mobile",390,844,true]]){
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile});await pause(150);
  assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),"no viewport overflow "+name);
  writeFileSync(path.join(dir,name+".png"),Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
 }

 console.log("OK packing sheet browser: type-to-create nested boxes, focus continuity, automatic placement, filled batches, bulk moves, guarded undo, focused outer, compact controls, typing, live preview, limits, atomic Excel paste, decimal units, keyboard, pagination, search, reload, clear, disabled, desktop/mobile, dedicated screen, live preview, pending filter, save status, focus, session expiry batch creation, duplication, nested quantities, atomic cross-parent paste, parent moves, finalization, reopen and bag/inner persistence.");
}finally{socket?.close();browser.kill();server.close();}