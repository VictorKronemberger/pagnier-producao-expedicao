import {build} from "esbuild";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
import path from "node:path";
const dir=path.resolve(".sites-runtime/picker-design-qa");mkdirSync(dir,{recursive:true});
const fixture=`
import React,{useState} from "react";import {createRoot} from "react-dom/client";
import SmallBoxPicker from "./app/small-box-picker";
const names=["Kuntanawa Stardust 50g","Kuntanawa Stardust 50g","Yawanawa Forest Guardian 5g","Shamanic Sleepy Time 20g","Shamanic Pau Pereira 50g"];
function App(){const [boxes,setBoxes]=useState(names.map((codigo,i)=>({id:"box-"+i,codigo,pronta:true,itens:[{produto:"Rapé Sacred Connection "+codigo,quantidade:String([30,20,50,51,7][i]),unidade:"UNID"}]})));const [placed,setPlaced]=useState("");return <div className="shipment-form"><SmallBoxPicker boxes={boxes} target="CX-001" onPlace={ids=>{if(window.rejectPlacement)return false;setPlaced(ids.join(","));setBoxes(b=>b.filter(v=>!ids.includes(v.id)))}}/><output id="placed">{placed}</output></div>}
createRoot(document.getElementById("root")).render(<App/>);
`;
await build({stdin:{contents:fixture,resolveDir:process.cwd(),loader:"tsx"},bundle:true,write:true,outfile:path.join(dir,"app.js"),jsx:"automatic",platform:"browser"});
const css=readFileSync("app/theme.css","utf8")+readFileSync("app/globals.css","utf8").replace(/@import[^;]+;/g,"");
const server=createServer((req,res)=>{if(req.url==="/app.js"){res.setHeader("Content-Type","text/javascript");res.end(readFileSync(path.join(dir,"app.js")));}else{res.setHeader("Content-Type","text/html");res.end('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css+' body{padding:24px;background:#eef2eb}#root{max-width:690px;margin:auto}@media(max-width:480px){body{padding:10px}}</style><div id="root"></div><script src="/app.js"></script>');}});
await new Promise(r=>server.listen(5189,"127.0.0.1",r));
const browser=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless","--disable-gpu","--no-first-run","--remote-debugging-port=9244","--user-data-dir="+path.join(dir,"profile"),"about:blank"],{windowsHide:true,stdio:"ignore"});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let socket;
try{
let pages;for(let i=0;i<60;i++){try{pages=await(await fetch("http://127.0.0.1:9244/json")).json();if(pages.some(p=>p.type==="page"))break}catch{}await pause(200)}
socket=new WebSocket(pages.find(p=>p.type==="page").webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
let id=0;const pending=new Map();
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result)}};
async function evaluate(expression){const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function until(expression){for(let i=0;i<60;i++){if(await evaluate(expression))return;await pause(100)}throw Error(expression)}
await send("Emulation.setDeviceMetricsOverride",{width:1000,height:850,deviceScaleFactor:1,mobile:false});
await send("Page.navigate",{url:"http://127.0.0.1:5189"});
await until('document.querySelectorAll(".small-picker-option").length===5');
assert.equal(await evaluate('document.querySelectorAll("select").length'),0);
assert.equal(await evaluate('document.querySelector(".small-picker-footer button").disabled'),true);
async function search(value){await evaluate('(()=>{const el=document.querySelector("input[type=search]");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event("input",{bubbles:true}));})()');await pause(100)}
await search("Kuntanawa");
await evaluate('document.querySelector(".small-picker-heading button").click()');
await until('document.querySelectorAll(".is-selected").length===2');
assert.equal(await evaluate('document.querySelector(".small-picker-footer strong").textContent'),"50 UNID");
await evaluate('document.querySelector(".small-picker-option input").focus()');
await send("Input.dispatchKeyEvent",{type:"keyDown",key:" ",code:"Space",windowsVirtualKeyCode:32});
await send("Input.dispatchKeyEvent",{type:"keyUp",key:" ",code:"Space",windowsVirtualKeyCode:32});
await until('document.querySelectorAll(".is-selected").length===1');
await evaluate('document.querySelector(".small-picker-option input").click()');
await until('document.querySelectorAll(".is-selected").length===2');
await search("RAPE 51");
assert.equal(await evaluate('document.querySelectorAll(".small-picker-option").length'),1);
assert((await evaluate('document.querySelector(".small-picker-footer").textContent')).includes("2 fora da pesquisa"));
await evaluate('document.querySelector(".small-picker-option input").click()');
await until('document.querySelector(".small-picker-footer strong").textContent==="101 UNID"');
await search("nada");
assert.equal(await evaluate('document.querySelectorAll(".small-picker-option").length'),0);
assert.equal(await evaluate('document.querySelector(".small-picker-footer button").disabled'),false);
await evaluate('window.rejectPlacement=true;document.querySelector(".small-picker-footer button").click()');
await pause(100);
assert.equal(await evaluate('document.getElementById("placed").textContent'),"");
assert.equal(await evaluate('document.querySelector(".small-picker-footer strong").textContent'),"101 UNID");
await evaluate('window.rejectPlacement=false;document.querySelector(".small-picker-footer button").click()');
await until('document.getElementById("placed").textContent==="box-0,box-1,box-3"');
assert.equal(await evaluate('document.querySelector(".small-picker-footer button").disabled'),true);
await search("");
await until('document.querySelectorAll(".small-picker-option").length===2');
await evaluate('document.querySelector(".small-picker-heading button").click()');
await until('document.querySelectorAll(".is-selected").length===2');
await evaluate('document.querySelector(".small-picker-heading button").click()');
await until('document.querySelectorAll(".is-selected").length===0');
writeFileSync(path.join(dir,"desktop.png"),Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});
await pause(200);
assert(await evaluate('document.documentElement.scrollWidth<=390'),"No horizontal overflow on mobile");
writeFileSync(path.join(dir,"mobile.png"),Buffer.from((await send("Page.captureScreenshot",{format:"png"})).data,"base64"));
console.log("OK browser: multiple selection, filtered select all, checkbox keyboard navigation, totals, hidden selections, failed placement preserved, batch placement, deselect all, mobile without overflow.");
}finally{socket?.close();browser.kill();server.close();}
