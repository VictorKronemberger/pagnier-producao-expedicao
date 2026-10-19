import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Dedicated local server and synthetic API responses: no ERP or database access.
const port=5175, debugPort=9245, base=`http://127.0.0.1:${port}`;
const dir=path.resolve('.sites-runtime/theme-qa');mkdirSync(dir,{recursive:true});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{windowsHide:true,stdio:'ignore',env:{...process.env,DATABASE_PROVIDER:'neon',DATABASE_URL:'',TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',NOMUS_API_KEY:''}});
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--no-first-run',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${path.join(dir,'browser')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const order={id:'PV TESTE',codigo:'PV TESTE',cliente:'Cliente de teste',liberacao:'released',vinculo:'linked',criacao:'2026-10-25',ordens:[{id:'OP TESTE',nome:'OP TESTE',produto:'Produto teste 10g',quantidade:'80',unidade:'UNID',criacao:'2026-10-25'}]};
const snapshot={consultadoEm:'2026-10-25T12:00:00Z',ordensConsultadas:1,grupos:[order],pedidos:[order],semVinculo:[]};
const board={sequence:['PV TESTE'],details:{'PV TESTE':{responsavel:'Victor',situacao:'Programado',nota:''}}};
let socket,employee=null;const errors=[];
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}if(i===99)throw Error('QA server did not start');await pause(300)}
 let pages;for(let i=0;i<60;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();if(pages.some(p=>p.type==='page'))break}catch{}await pause(200)}
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
 let id=0;const pending=new Map();
 function send(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}))})}
 async function respond(m){
  const u=new URL(m.request.url);let payload={};
  if(u.pathname==='/api/chat/session')payload={employee,employees:[{name:'Victor',registered:true}]};
  else if(u.pathname==='/api/board')payload={snapshot,board,revision:0,updatedAt:null,updatedBy:null};
  else if(u.pathname==='/api/nomus')payload={snapshot,changes:{},configured:false,lastChecked:null,partial:false,message:'Teste isolado',page:1,pedidosCoberturaCompleta:true,pedidosIdentificados:1};
  else if(u.pathname==='/api/chat')payload={employee,threads:[],messages:[],hasMore:false};
  else if(u.pathname==='/api/packing-clients')payload={clientes:[],porPedido:{}};
  await send('Fetch.fulfillRequest',{requestId:m.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(payload)).toString('base64')});
 }
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.resolve(m.result)}else if(m.method==='Fetch.requestPaused')void respond(m.params).catch(e=>errors.push(e.message));else if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params.exceptionDetails));else if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value||a.description).join(' '))};
 async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async function until(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timeout: '+expression)}
 const theme=()=>evaluate('document.documentElement.dataset.theme');
 const toggle=()=>evaluate('document.querySelector(".theme-toggle").click()');
 async function shot(name){await pause(100);const r=await send('Page.captureScreenshot',{format:'png'});writeFileSync(path.join(dir,name+'.png'),Buffer.from(r.data,'base64'))}
 async function navigate(){await send('Page.navigate',{url:base});await until('!!document.querySelector(".theme-toggle")');await pause(150)}
 await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:base+'/api/*',requestStage:'Request'}]});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'}]});
 await navigate();await evaluate('localStorage.clear()');await navigate();await until('!!document.querySelector(".employee-login-form")');
 assert.equal(await theme(),'dark','first visit follows system theme');
 assert.equal(await evaluate('CSS.supports("color", "light-dark(white, black)")'),true);
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".employee-login-card")).backgroundColor'),'rgb(25, 37, 31)');
 await shot('login-dark');
 await toggle();await until('document.documentElement.dataset.theme==="light"');
 assert.equal(await evaluate('localStorage.getItem("pagnier-theme")'),'light');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".employee-login-card")).backgroundColor'),'rgb(255, 255, 255)');
 await navigate();assert.equal(await theme(),'light','explicit preference survives reload and system preference');
 await shot('login-light');
 await send('Emulation.setFocusEmulationEnabled',{enabled:true});await evaluate('document.querySelector(".theme-toggle").focus()');assert.equal(await evaluate('document.activeElement.classList.contains("theme-toggle")'),true);await send('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});await send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
 await until('document.documentElement.dataset.theme==="dark"');
 // Tab synchronization uses the same storage event as another tab.
 await evaluate('window.dispatchEvent(new StorageEvent("storage",{key:"pagnier-theme",newValue:"light"}))');await until('document.documentElement.dataset.theme==="light"');
 await toggle();await until('document.documentElement.dataset.theme==="dark"');
 employee='Victor';await navigate();await until('!!document.querySelector(".kanban-card")');
 assert.equal(await theme(),'dark');assert.equal(await evaluate('getComputedStyle(document.querySelector(".app-brand img")).backgroundColor'),'rgb(230, 237, 223)');await shot('board-dark');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".kanban-card")).backgroundColor'),'rgb(25, 37, 31)');
 await evaluate('document.querySelector(".card-open").click()');await until('!!document.querySelector(".card-dialog")');await shot('dialog-dark');
 await evaluate('document.querySelector(".card-dialog .close").click()');
 await evaluate('document.querySelector(".team-chat-launcher").click()');await until('!!document.querySelector(".team-chat-panel")');await shot('chat-dark');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".team-chat-panel")).backgroundColor'),'rgb(25, 37, 31)');
 await evaluate(`document.querySelector('[aria-label="Fechar mensagens"]').click()`);
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await shot('mobile-dark');
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'no page overflow on mobile');
 assert(await evaluate('(()=>{const r=document.querySelector(".theme-toggle").getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.height>=38})()'),'theme control remains reachable');
 await toggle();await until('document.documentElement.dataset.theme==="light"');await shot('mobile-light');
 await toggle();await until('document.documentElement.dataset.theme==="dark"');
 await send('Emulation.setEmulatedMedia',{media:'print'});
 assert.equal(await evaluate('getComputedStyle(document.documentElement).colorScheme'),'light');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".theme-toggle")).display'),'none');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".kanban-card")).backgroundColor'),'rgb(255, 255, 255)');
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: system preference, toggle, keyboard, persistence, tab sync, login, cards, dialog, chat, mobile and print.');
 console.log('Screenshots: '+dir);
} finally { socket?.close();browser.kill();server.kill(); }
