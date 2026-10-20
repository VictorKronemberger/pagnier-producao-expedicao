import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {emptyShipment,newItem,normalizeShipment} from '../lib/shipping.mjs';

// Dedicated local server and synthetic API responses: no ERP or database access.
const port=5180, debugPort=9250, base=`http://127.0.0.1:${port}`;
const dir=path.resolve('.sites-runtime/multiplier-qa');mkdirSync(dir,{recursive:true});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{windowsHide:true,stdio:'ignore',env:{...process.env,DATABASE_PROVIDER:'neon',DATABASE_URL:'',TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',NOMUS_API_KEY:''}});
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--no-first-run',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${path.join(dir,'browser')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const order={id:'PV TESTE',codigo:'PV TESTE',cliente:'Cliente de teste',liberacao:'released',vinculo:'linked',criacao:'2026-10-25',ordens:[{id:'OP TESTE',nome:'OP TESTE',produto:'Produto teste 10g',quantidade:'72',unidade:'UNID',criacao:'2026-10-25'}]};
const snapshot={consultadoEm:'2026-10-25T12:00:00Z',ordensConsultadas:1,grupos:[order],pedidos:[order],semVinculo:[]};
const item={...newItem('item-original'),opId:'OP TESTE',produto:'Produto teste 10g',unidade:'UNID',quantidade:'18',unidadesEmbaladas:'18',pesoUnitarioKg:'0,010',origemPeso:'manual',lote:'LOTE-TESTE',validade:'2027-10-20',caixaInternaId:'original'};
let board={sequence:['PV TESTE'],details:{'PV TESTE':{responsavel:'Victor',situacao:'Programado',nota:'',envio:{...emptyShipment(),organizacao:'inner',caixasEmMontagem:[{id:'original',codigo:'Caixa teste',pronta:true,itens:[item]}]}}}},revision=1,writes=0;
const shipment=()=>board.details['PV TESTE'].envio;
async function saved(count){for(let i=0;i<100;i++){if(shipment().caixasEmMontagem.length===count)return;await pause(100)}throw Error('Copies not saved: '+count)}

let socket,employee='Victor';const errors=[];
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}if(i===99)throw Error('QA server did not start');await pause(300)}
 let pages;for(let i=0;i<60;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();if(pages.some(p=>p.type==='page'))break}catch{}await pause(200)}
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
 let id=0;const pending=new Map();
 function send(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}))})}
 async function respond(m){
  const u=new URL(m.request.url);let payload={};
  if(u.pathname==='/api/chat/session')payload={employee,employees:[{name:'Victor',registered:true}]};
  else if(u.pathname==='/api/board'){
   if(m.request.method==='PUT'){
    const input=JSON.parse(m.request.postData);assert.equal(input.revision,revision);
    input.board.details['PV TESTE'].envio=normalizeShipment(input.board.details['PV TESTE'].envio,order.ordens,shipment());
    board=input.board;revision++;writes++;payload={revision,updatedBy:'Victor'};
   }else payload=u.searchParams.get('revision')===String(revision)?{unchanged:true,revision}:{snapshot,board,revision,updatedBy:'Victor'};
  }

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

 await send('Page.addScriptToEvaluateOnNewDocument',{source:'localStorage.setItem("pagnier-view",JSON.stringify({month:"range",start:"2026-10-01",end:"2026-10-31"}))'});
 async function openBoxes(){
  await navigate();await until('!!document.querySelector(".card-open")');
  await evaluate('document.querySelector(".card-open").click()');await until('!!document.querySelector("[data-detail-tab=expedition]")');
  await evaluate('document.querySelector("[data-detail-tab=expedition]").click()');
  await evaluate('document.querySelector("[data-expedition-step=boxes]").click()');await until('!!document.querySelector("[data-assembly-step=small]")');
  await evaluate('document.querySelector("[data-assembly-step=small]").click()');await until('!!document.querySelector(".box-multiplier")');
 }
 async function setInput(selector,value){await evaluate('(()=>{const el=document.querySelector('+JSON.stringify(selector)+');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));})()');await pause(100)}
 const input='.box-multiplier input',button='.box-multiplier button';
 await openBoxes();
 assert.equal(await evaluate('document.querySelector(".box-multiplier input").max'),'3');
 for(const themeName of ['light','dark'])for(const width of [1440,768,390]){
  await evaluate('document.documentElement.dataset.theme='+JSON.stringify(themeName));
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<640});
  await evaluate('document.querySelector(".box-multiplier").scrollIntoView({block:"center"})');await pause(200);
  const layout=await evaluate('(()=>{const box=document.querySelector(".box-multiplier"),i=box.querySelector("input").getBoundingClientRect(),b=box.querySelector("button").getBoundingClientRect();return {overflow:box.scrollWidth>box.clientWidth+1,left:box.getBoundingClientRect().left,right:box.getBoundingClientRect().right,inputHeight:i.height,buttonHeight:b.height,bottomDifference:Math.abs(i.bottom-b.bottom),stacked:b.top>=i.bottom}})()');
  assert(!layout.overflow&&layout.left>=0&&layout.right<=width,JSON.stringify(layout));
  assert.equal(layout.inputHeight,42);assert.equal(layout.buttonHeight,42);
  if(width>480)assert(layout.bottomDifference<1,'aligned controls');else assert(layout.stacked,'mobile stacks controls');
  await shot('multiplier-'+themeName+'-'+width);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 for(const value of ['', '0','-1','1.5','4']){
  await setInput(input,value);assert(await evaluate('document.querySelector(".box-multiplier button").disabled'),'invalid count '+value);
 }
 await setInput(input,'2');
 assert((await evaluate('document.querySelector(".box-copy-hint").textContent')).includes('1 original + 2 cópias = 3 caixas iguais'));
 await evaluate('document.querySelector(".box-multiplier button").click()');await saved(3);
 await until('!!document.querySelector(".box-copy-success")');
 assert.equal(new Set(shipment().caixasEmMontagem.map(b=>b.id)).size,3);
 const copies=shipment().caixasEmMontagem;
 for(const box of copies){assert.equal(box.pronta,true);assert.equal(box.itens[0].quantidade,'18');assert.equal(box.itens[0].lote,'LOTE-TESTE');assert.equal(box.itens[0].caixaInternaId,box.id)}
 assert.equal(new Set(copies.map(b=>b.itens[0].id)).size,3);
 await setInput(input,'2');assert(await evaluate('document.querySelector(".box-multiplier button").disabled'),'excess blocked');
 await setInput(input,'1');await evaluate('document.querySelector(".box-multiplier button").click()');await saved(4);
 await until('document.querySelector(".box-multiplier button").disabled');
 assert((await evaluate('document.querySelector(".box-copy-hint").textContent')).includes('Saldo insuficiente'));
 const prior=writes;await evaluate('document.querySelector(".box-multiplier button").click()');await pause(500);assert.equal(writes,prior);
 await shot('zero-balance');
 await openBoxes();assert.equal(await evaluate('document.querySelectorAll(".box-selector button").length'),4,'copies survive reload');
 await evaluate('document.querySelectorAll(".box-selector button")[1].click()');
 await evaluate('[...document.querySelectorAll(".box-focus button")].find(b=>b.textContent==="Editar conteúdo").click()');
 await until('!document.querySelector(".packed-quantity input").disabled');await setInput('.packed-quantity input','9');
 for(let i=0;i<100&&shipment().caixasEmMontagem[1].itens[0].quantidade!=='9';i++)await pause(100);
 assert.equal(shipment().caixasEmMontagem[1].itens[0].quantidade,'9');assert.equal(shipment().caixasEmMontagem[0].itens[0].quantidade,'18','editing copy preserves original');
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: aligned controls, light/dark and mobile, invalid counts, batch creation, IDs, metadata, balance blocking, save/reload and independent edits.');
 console.log('Screenshots: '+dir);
} finally {socket?.close();browser.kill();server.kill()}
