import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Dedicated local server and synthetic API responses: no ERP or database access.
const port=5176, debugPort=9246, base=`http://127.0.0.1:${port}`;
const dir=path.resolve('.sites-runtime/nomus-qa');mkdirSync(dir,{recursive:true});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{windowsHide:true,stdio:'ignore',env:{...process.env,DATABASE_PROVIDER:'neon',DATABASE_URL:'',TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',NOMUS_API_KEY:''}});
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--no-first-run',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${path.join(dir,'browser')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const order={id:'PV TESTE',codigo:'PV TESTE',cliente:'Cliente de teste',liberacao:'released',vinculo:'linked',criacao:'2026-10-25',ordens:[{id:'OP TESTE',nome:'OP TESTE',produto:'Produto teste 10g',quantidade:'80',unidade:'UNID',criacao:'2026-10-25'}]};
order.ordens[0].quantidadeProduzida='80';order.ordens[0].producaoConsultadaEm='2026-10-25T12:00:00.000Z';
order.itens=[{item:'00010',produto:'Produto atendido',quantidade:'2',unidade:'UNID',status:4},{item:'00020',produto:'Produto teste 10g',quantidade:'80',unidade:'UNID',status:2}];order.pedidoConsultadoEm='2026-10-25T12:00:00.000Z';
const snapshot={consultadoEm:'2026-10-25T12:00:00Z',ordensConsultadas:1,grupos:[order],pedidos:[order],semVinculo:[
{id:'OP9001',nome:'OP9001',produto:'Produto ativo',quantidade:'2',unidade:'UNID',criacao:'2026-10-25',situacaoNomus:'Liberada'},
{id:'OP9002',nome:'OP9002',produto:'Produto cancelado',quantidade:'2',unidade:'UNID',criacao:'2026-10-25',situacaoNomus:'Cancelada'},
{id:'OP9003',nome:'OP9003',produto:'Interna cancelada',quantidade:'4',unidade:'KG',criacao:'2026-10-25',situacaoNomus:'Cancelada'},
{id:'OP9004',nome:'OP9004',produto:'Situação não informada',quantidade:'2',unidade:'UNID',criacao:'2026-10-25'}]};
const board={sequence:['PV TESTE'],details:{'PV TESTE':{responsavel:'Victor',situacao:'Programado',nota:''}}};
let selectedRequest;let socket,employee='Victor';const errors=[];let captures=0,lastCapture='2026-10-25T12:00:00.000Z',refreshMode='updated',nomusRevision=1,compactReplies=0,requests=0,transportFailure=false;
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}if(i===99)throw Error('QA server did not start');await pause(300)}
 let pages;for(let i=0;i<60;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();if(pages.some(p=>p.type==='page'))break}catch{}await pause(200)}
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
 let id=0;const pending=new Map();
 function send(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}))})}
 async function respond(m){
  const u=new URL(m.request.url);let payload={},responseCode=200;
  if(u.pathname==='/api/chat/session')payload={employee,employees:[{name:'Victor',registered:true}]};
  else if(u.pathname==='/api/board')payload={snapshot,board,revision:0,updatedAt:null,updatedBy:null};
  else if(u.pathname==='/api/nomus'){
 const input=m.request.postData?JSON.parse(m.request.postData):{};requests++;selectedRequest=input.orderCode;
 if(input.refresh){captures++;await pause(500);if(refreshMode==='updated')lastCapture='2026-10-25T12:01:22.000Z';}
 if(input.refresh&&['updated','failed'].includes(refreshMode))nomusRevision++;
 payload={pedidoVarredura:{page:8,checked:350,pending:2,lastCompleted:"2026-10-25T11:45:00.000Z"},nomusRevision,snapshot,changes:{},configured:refreshMode!=='unconfigured',lastChecked:lastCapture,partial:refreshMode==='failed',message:'Falha simulada na consulta',page:1,pedidosCoberturaCompleta:true,pedidosIdentificados:1,refreshStatus:input.refresh?refreshMode:'cached'};
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
 await navigate();await until('!!document.querySelector(".nomus-capture time")');
 assert.equal(await evaluate('document.querySelector(".nomus-capture time").dateTime'),lastCapture);
 assert.match(await evaluate('document.querySelector(".nomus-capture time").textContent'),/09:00/);
 assert.match(await evaluate('document.querySelector(".nomus-scan-progress").textContent'),/próxima página 8 · 2 aguardando verificação/);
 await shot('capture-tiny-desktop');
 assert(await evaluate('(()=>{const el=document.querySelector(".nomus-capture"),r=el.getBoundingClientRect();return getComputedStyle(el).display==="flex"&&r.height<=24&&r.width<=90&&el.parentElement.classList.contains("data-strip")})()'),'capture reuses status row with no separate panel');
 const boardTop=await evaluate('document.querySelector(".kanban").getBoundingClientRect().top');
 await shot('capture-compact-desktop');
 await evaluate('document.querySelector(".theme-toggle").click()');await shot('capture-compact-alternate-theme');
 await evaluate('document.querySelector(".theme-toggle").click()');
 await evaluate('document.querySelector(".nomus-refresh").click();document.querySelector(".nomus-refresh").click()');
 await until('document.querySelector(".nomus-refresh").disabled');
 await until('!document.querySelector(".nomus-refresh").disabled');
 assert.equal(captures,1,'double click starts only one request');
 assert.equal(await evaluate('document.querySelector(".nomus-capture time").dateTime'),lastCapture);
 assert.match(await evaluate('document.querySelector(".nomus-capture-notice").textContent'),/Etapa capturada/);
 await shot('capture-desktop');
 await evaluate('document.querySelector(".card-open").click()');await until('!!document.querySelector(".card-dialog")');
 assert.equal(await evaluate('document.querySelector(".card-dialog .order-production-summary").dataset.productionState'),'complete');
 assert.equal(await evaluate('document.querySelector(".card-dialog .order-commercial").open'),false);
 assert.equal(await evaluate('document.querySelector(".card-dialog .release-notice")'),null,'commercial state does not create a yellow production warning');
 assert(!await evaluate('document.querySelector(".card-dialog").innerText.includes("sem confirmação de atendimento comercial")'));
 await shot('production-complete-overview');
 await evaluate('document.querySelector(".card-dialog .order-commercial summary").click()');
 assert.match(await evaluate('document.querySelector(".card-dialog .order-commercial").innerText'),/Status no pedido: Liberado/);
 assert.match(await evaluate('document.querySelector(".card-dialog .order-commercial").textContent'),/Pedido consultado em/);
 assert(!await evaluate('document.querySelector(".card-dialog .order-commercial").textContent.includes("Ainda não atendido")'));
 await until('!document.querySelector(".nomus-refresh").disabled');await evaluate('document.querySelector(".nomus-refresh").click()');await until('!document.querySelector(".nomus-refresh").disabled');
 assert.equal(selectedRequest,order.id,'refresh includes the opened order');await shot('commercial-status-detail');
 order.pedidoConsultaFalhou=true;nomusRevision++;
 await evaluate('document.querySelector(".nomus-refresh").click()');await until('!document.querySelector(".nomus-refresh").disabled');
 assert.match(await evaluate('document.querySelector(".card-dialog").textContent'),/Pedido não confirmado no Nomus/);
 assert.equal(await evaluate('document.querySelector(".card-dialog .order-commercial")'),null,'failed verification does not assert stale commercial status');
 order.pedidoConsultaFalhou=false;nomusRevision++;
 await evaluate('document.querySelector(".nomus-refresh").click()');await until('!document.querySelector(".nomus-refresh").disabled');
 await until('!!document.querySelector(".card-dialog .order-commercial")');
 await evaluate('document.querySelector(".order-production-summary button").click()');
 await until('document.querySelector("[data-detail-tab=expedition]").getAttribute("aria-pressed")==="true"');
 assert.match(await evaluate('document.querySelector(".pc-columns").textContent'),/Produzido/);
 assert.equal(await evaluate('document.querySelector(".pc-produced strong").textContent'),'80');
 assert.match(await evaluate('document.querySelector(".pc-production-state").textContent'),/Produção concluída/);
 await evaluate('document.querySelector("[data-detail-tab=overview]").click()');
 for(const [quantity,expected] of [['40','incomplete'],[null,'unknown'],['80','complete']]){
  order.ordens[0].quantidadeProduzida=quantity;nomusRevision++;
  await until('!document.querySelector(".nomus-refresh").disabled');await evaluate('document.querySelector(".nomus-refresh").click()');
  await until('!document.querySelector(".nomus-refresh").disabled');await until('document.querySelector(".order-production-summary").dataset.productionState==='+JSON.stringify(expected));
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
 await shot('production-overview-mobile');
 await evaluate('document.querySelector(".theme-toggle").click()');await shot('production-overview-dark');
 await evaluate('document.querySelector(".theme-toggle").click()');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await evaluate('document.querySelector(".card-dialog .close").click()');
 refreshMode='failed';await evaluate('document.querySelector(".nomus-refresh").click()');await until('!!document.querySelector(".nomus-capture-notice.is-error")');
 assert.equal(await evaluate('document.querySelector(".nomus-capture time").dateTime'),lastCapture,'failure does not advance capture timestamp');
 assert(await evaluate('!!document.querySelector(".kanban-card")'),'existing data stays visible');
 assert.equal(await evaluate('document.querySelector(".kanban").getBoundingClientRect().top'),boardTop,'error does not move the board');
 assert.equal(await evaluate('document.querySelector(".nomus-capture-notice").checkVisibility()'),false,'error details stay collapsed');
 await evaluate('document.querySelector(".nomus-capture summary").click()');
 assert(await evaluate('document.querySelector(".nomus-capture-notice").getBoundingClientRect().height>0'),'error can be inspected on demand');
 await shot('capture-error-details');
 await evaluate('document.querySelector(".nomus-capture details").dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
 assert.equal(await evaluate('document.querySelector(".nomus-capture details").open'),false);
 await shot('capture-error-compact');
 refreshMode='cooldown';await evaluate('document.querySelector(".nomus-refresh").click()');await until('document.querySelector(".nomus-capture-notice")?.textContent.includes("Aguarde alguns segundos")');
 assert(compactReplies>0,'browser sends the known revision and accepts responses without snapshot');
 assert(await evaluate('!!document.querySelector(".kanban-card")'),'unchanged response preserves orders');
 await evaluate(`document.querySelector('.app-navigation button[aria-label="Pendências"]').click()`);await until('!!document.querySelector(".cancelled-category")');
 assert.equal(await evaluate('document.querySelector(".pending-category h3 b").textContent'),'2');
 assert.equal(await evaluate('document.querySelector(".cancelled-category h3 b").textContent'),'2');
 assert.equal(await evaluate('document.querySelectorAll(".pending-category:first-of-type .unlinked-grid article").length'),2);
 assert.match(await evaluate('document.querySelector(".cancelled-category").textContent'),/OP9002/);
 assert.match(await evaluate('document.querySelector(".cancelled-category").textContent'),/OP9003/);
 await evaluate('document.querySelector(".theme-toggle").click();document.querySelector(".cancelled-category").scrollIntoView({block:"center"})');await shot('cancelled-desktop');
 await evaluate(`(()=>{const input=document.querySelector('input[aria-label="Buscar no quadro"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'OP9002');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await until('document.querySelector(".cancelled-category h3 b").textContent==="1"');assert.equal(await evaluate('document.querySelector(".pending-category h3 b").textContent'),'0');
 await evaluate(`document.querySelector('[aria-label="Limpar busca"]').click()`);
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await shot('capture-mobile');
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'no horizontal page overflow');
 assert(await evaluate('(()=>{const r=document.querySelector(".nomus-refresh").getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.height>=32})()'));
 await evaluate(`document.querySelector('.app-navigation button[aria-label="Invoices FedEx / DHL"]').click()`);
 await until('!!document.querySelector(".heading-actions .nomus-capture")');
 await evaluate('document.querySelector(".nomus-capture summary").click()');
 assert(await evaluate('(()=>{const r=document.querySelector(".nomus-capture details>div").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})()'),'detail popup stays within mobile viewport in other workspaces');
 await evaluate('document.body.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))');
 assert.equal(await evaluate('document.querySelector(".nomus-capture details").open'),false);
 transportFailure=true;await evaluate('document.querySelector(".nomus-refresh").click()');
 await until('document.querySelector(".nomus-capture-notice")?.textContent.includes("Banco indisponível no teste")');
 const afterFailure=requests;
 await evaluate('for(let i=0;i<5;i++)window.dispatchEvent(new Event("focus"))');await pause(300);
 assert.equal(requests,afterFailure,'background attempts respect outage backoff');
 transportFailure=false;refreshMode='updated';await evaluate('document.querySelector(".nomus-refresh").click()');
 await until('!document.querySelector(".nomus-refresh").disabled');assert.equal(requests,afterFailure+1,'manual refresh remains available during backoff');
 refreshMode='unconfigured';await evaluate('document.querySelector(".nomus-refresh").click()');await until('document.querySelector(".nomus-capture-notice")?.textContent.includes("não está configurada")');
 assert.equal(await evaluate('document.querySelector(".nomus-refresh").disabled'),true);
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS Nomus UI: revision-only responses, preserved snapshot, outage backoff, manual retry, capture date/time, immediate refresh, duplicate prevention, failure preservation, cooldown, separate cancellations, pending counts, search, dark mode and mobile.');
} finally {socket?.close();browser.kill();server.kill();}
