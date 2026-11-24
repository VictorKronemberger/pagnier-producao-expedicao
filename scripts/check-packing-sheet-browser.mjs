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
function App(){const [saveLabel,setSaveLabel]=useState("Salvo (teste)");window.saveLabelQA=setSaveLabel;const [value,setValue]=useState({...emptyShipment(),organizacao:"direct"});const [step,setStep]=useState("outer");const [disabled,setDisabled]=useState(false);window.qa=value;window.disableQA=setDisabled;window.reloadQA=()=>setValue(normalizeShipment(JSON.parse(JSON.stringify(value)),ops));window.resetQA=()=>{setValue({...emptyShipment(),organizacao:"bags"});setStep("small")};return <ShipmentEditor orderLabel="Pedido DEMO-123 · Cliente de demonstração" saveStatus={<span role="status">{saveLabel}</span>} value={value} ops={ops} onChange={setValue} disabled={disabled} assemblyStep={step} onAssemblyStepChange={setStep}/>;}
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
 assert.equal(await evaluate('window.qa.caixas.length'),2);
 await input(cell(0,0),"12");await input(cell(0,1),"8");
 assert.equal(await evaluate('window.qa.caixas[0].itens[0].quantidade'),"12");
 assert.equal(await evaluate('window.qa.caixas[1].itens[0].sku'),"SKU-0");
 assert((await evaluate('document.querySelector(".box-focus").textContent')).includes("8 UNID"),"live content preview");
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
 await clickText("Conferir esta caixa");
 await until('!document.querySelector("dialog:modal")');
 assert.equal(await evaluate('window.qa.caixas[0].itens.find(i=>i.opId==="stock-1").quantidade'),"6","screen edits survive return");
 await clickText("Abrir tela da planilha");await until('document.querySelector("dialog:modal")');
 await evaluate('window.dispatchEvent(new Event("pagnier-session-expired"))');
 await until('!document.querySelector("dialog:modal")');
 await evaluate('window.resetQA()');await pause(120);
 await clickText("Nova bag");await input(cell(0,0),"7");
 assert.equal(await evaluate('window.qa.caixasEmMontagem[0].itens[0].quantidade'),"7");
 await clickText("Conferir e finalizar bag");assert.equal(await evaluate(cell(0,0)+'.disabled'),true);
 await clickText("Distribuir nas Caixas 40");await clickText("Nova Caixa 40");
 assert.equal(await evaluate('document.querySelector("[aria-label=\'Planilha de montagem\']")'),null,"bags go through physical distribution");
 await evaluate('document.querySelector(".small-picker-option input").click()');await clickText("Adicionar à Caixa 40 (1)");
 assert.equal(await evaluate('window.qa.caixas[0].itens[0].quantidade'),"7");
 await clickText("Finalizar Caixa 40");assert.equal(await evaluate('window.qa.caixas[0].montada'),true);
 console.log("OK packing sheet browser: typing, live preview, limits, atomic Excel paste, decimal units, keyboard, pagination, search, reload, clear, disabled, desktop/mobile, dedicated screen, live preview, pending filter, save status, focus, session expiry and bag-to-box flow.");
}finally{socket?.close();browser.kill();server.close();}