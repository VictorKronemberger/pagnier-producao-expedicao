import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Dedicated local server and synthetic API responses: no ERP or database access.
const port=5190, debugPort=9250, base=`http://127.0.0.1:${port}`;
const dir=path.resolve('.sites-runtime/archive-qa');mkdirSync(dir,{recursive:true});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{windowsHide:true,stdio:'ignore',env:{...process.env,DATABASE_PROVIDER:'neon',DATABASE_URL:'',TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',NOMUS_API_KEY:''}});
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--no-first-run',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${path.join(dir,'browser')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const order={id:'PV TESTE',codigo:'PV TESTE',cliente:'Cliente de teste',liberacao:'released',vinculo:'linked',criacao:'2026-09-15',ordens:[{id:'OP TESTE',nome:'OP TESTE',produto:'Produto teste 10g',quantidade:'80',unidade:'UNID',criacao:'2026-09-15'}]};
const snapshot={consultadoEm:'2026-10-25T12:00:00Z',ordensConsultadas:1,grupos:[order],pedidos:[order],semVinculo:[
{id:'OP9001',nome:'OP9001',produto:'Produto ativo',quantidade:'2',unidade:'UNID',criacao:'2026-09-15',situacaoNomus:'Liberada'},
{id:'OP9002',nome:'OP9002',produto:'Produto cancelado',quantidade:'2',unidade:'UNID',criacao:'2026-09-15',situacaoNomus:'Cancelada'},
{id:'OP9003',nome:'OP9003',produto:'Interna cancelada',quantidade:'4',unidade:'KG',criacao:'2026-09-15',situacaoNomus:'Cancelada'},
{id:'OP9004',nome:'OP9004',produto:'Situação não informada',quantidade:'2',unidade:'UNID',criacao:'2026-09-15'}]};
let revision=0;let board={sequence:['PV TESTE'],details:{'PV TESTE':{responsavel:'Victor',situacao:'Programado',nota:''}}};
let socket,employee='Victor';const errors=[];let captures=0,lastCapture='2026-10-25T12:00:00.000Z',refreshMode='updated',nomusRevision=1,compactReplies=0,requests=0,transportFailure=false;
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}if(i===99)throw Error('QA server did not start');await pause(300)}
 let pages;for(let i=0;i<60;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();if(pages.some(p=>p.type==='page'))break}catch{}await pause(200)}
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
 let id=0;const pending=new Map();
 function send(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}))})}
 async function respond(m){
  const u=new URL(m.request.url);let payload={},responseCode=200;
  if(u.pathname==='/api/chat/session')payload={employee,employees:[{name:'Victor',registered:true}]};
  else if(u.pathname==='/api/board'){if(m.request.method==='PUT'){board=JSON.parse(m.request.postData).board;revision++;payload={revision,updatedAt:new Date().toISOString(),updatedBy:'Victor'}}else payload={snapshot,board,revision,updatedAt:null,updatedBy:null};}
  else if(u.pathname==='/api/nomus'){
 const input=m.request.postData?JSON.parse(m.request.postData):{};requests++;
 if(input.refresh){captures++;await pause(500);if(refreshMode==='updated')lastCapture='2026-10-25T12:01:22.000Z';}
 if(input.refresh&&['updated','failed'].includes(refreshMode))nomusRevision++;
 payload={nomusRevision,snapshot,changes:{},configured:refreshMode!=='unconfigured',lastChecked:lastCapture,partial:refreshMode==='failed',message:'Falha simulada na consulta',page:1,pedidosCoberturaCompleta:true,pedidosIdentificados:1,refreshStatus:input.refresh?refreshMode:'cached'};
 if(input.knownRevision===nomusRevision){delete payload.snapshot;delete payload.changes;payload.unchanged=true;compactReplies++}
 if(transportFailure){responseCode=503;payload={error:'Banco indisponível no teste'}}
 }
  else if(u.pathname==='/api/chat')payload={employee,threads:[],messages:[],hasMore:false};
  else if(u.pathname==='/api/packing-clients')payload={clientes:[],porPedido:{}};
  await send('Fetch.fulfillRequest',{requestId:m.requestId,responseCode,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(payload)).toString('base64')});
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
 await navigate();await until('!!document.querySelector(".kanban-card")');
 await evaluate('document.querySelector(".filter-toggle").click()');
 assert(await evaluate('!!Array.from(document.querySelectorAll("option")).find(e=>e.textContent==="Desde 01/09/2026")'));
 await evaluate('document.querySelector(".kanban-card").click()');await until('!!document.querySelector(".card-dialog")');
 const lanes=await evaluate('Array.from(document.querySelectorAll(".kanban-list")).map(e=>e.dataset.stage)');
 assert.equal(lanes[lanes.indexOf('shipping')+1],'ready');assert.equal(lanes[lanes.indexOf('ready')+1],'sent');
 assert(await evaluate('document.querySelector(\'[data-stage="ready"]\').textContent.includes("Pronto para envio")'));
 async function moveStage(value){await evaluate(`(()=>{const s=document.querySelector(".dialog-fields label:first-child select");s.value=${JSON.stringify(value)};s.dispatchEvent(new Event("change",{bubbles:true}))})()`)}
 await moveStage('ready');
 for(let i=0;i<100&&board.details['PV TESTE'].situacao!=='Pronto para envio';i++)await pause(100);
 assert.equal(board.details['PV TESTE'].situacao,'Pronto para envio');assert(!board.details['PV TESTE'].envio);
 await navigate();await until('!!document.querySelector(\'[data-stage="ready"] .kanban-card\')');
 await shot('ready-for-shipping');
 await evaluate('document.querySelector(\'[data-stage="ready"] .kanban-card\').click()');await until('!!document.querySelector(".card-dialog")');
 await moveStage('queue');
 for(let i=0;i<100&&board.details['PV TESTE'].situacao!=='Programado';i++)await pause(100);
 assert.equal(board.details['PV TESTE'].situacao,'Programado');
 await shot('archive-action');
 await evaluate('Array.from(document.querySelectorAll(".dialog-footer button")).find(b=>b.textContent.trim()==="Arquivar pedido").click()');
 await until('!document.querySelector(".kanban-card")&&!document.querySelector(".card-dialog")');
 for(let i=0;i<100&&!board.details['PV TESTE'].arquivado;i++)await pause(100);
 assert.equal(board.details['PV TESTE'].arquivado,true);assert.equal(board.details['PV TESTE'].situacao,'Programado');assert(!board.details['PV TESTE'].envio);
 await navigate();await until('!!document.querySelector(".kanban")');assert.equal(await evaluate('document.querySelectorAll(".kanban-card").length'),0);
 await evaluate('Array.from(document.querySelectorAll("button")).find(b=>b.textContent.trim()==="Pedidos de venda").click()');
 await until('!!document.querySelector(".sales-catalog")');assert.equal(await evaluate('document.querySelectorAll(".sales-order").length'),0);
 await evaluate('(()=>{const s=document.querySelector(".sales-results select");s.value="archived";s.dispatchEvent(new Event("change",{bubbles:true}))})()');
 await until('!!document.querySelector(".sales-order")');await evaluate('document.querySelector(".sales-order summary").click()');await shot('archived-orders');
 await evaluate('Array.from(document.querySelectorAll(".sales-order button")).find(b=>b.textContent.trim()==="Restaurar pedido").click()');
 for(let i=0;i<100&&board.details['PV TESTE'].arquivado;i++)await pause(100);
 assert.equal(board.details['PV TESTE'].arquivado,false);assert.equal(board.details['PV TESTE'].situacao,'Programado');
 await navigate();await until('!!document.querySelector(".kanban-card")');assert.equal(errors.length,0,errors.join('\n'));
 console.log('OK browser: ready-for-shipping column position, move and reload persistence; September OP visible, archive without procedures, saved after reload, archived catalog filter, restore to previous stage. Synthetic data only.');
}finally{socket?.close();browser.kill();server.kill();}
