import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {emptyShipment} from '../lib/shipping.mjs';
import {changeArchive} from '../lib/order-archive.mjs';
import {deleteDraftPacking} from '../lib/packing-delete.mjs';
const port=5178,debugPort=9248,base=`http://127.0.0.1:${port}`,pause=ms=>new Promise(r=>setTimeout(r,ms));
const dir=path.resolve('.sites-runtime/archive-qa');mkdirSync(dir,{recursive:true});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{windowsHide:true,stdio:'ignore',env:{...process.env,DATABASE_PROVIDER:'neon',DATABASE_URL:'',TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',NOMUS_API_KEY:''}});
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--no-first-run','--disable-background-timer-throttling',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${path.join(dir,'browser')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
const groups=['A','B'].map(id=>({id,codigo:'PV '+id,cliente:'Cliente teste '+id,liberacao:'released',vinculo:'linked',criacao:'2026-10-25',ordens:[{id:'OP '+id,nome:'OP '+id,produto:'Produto teste',quantidade:'10',unidade:'UNID',criacao:'2026-10-25'}]}));
const snapshot={grupos:groups,pedidos:groups,semVinculo:[],consultadoEm:'2026-10-25T12:00:00Z',ordensConsultadas:2};
let board={sequence:['A','B'],details:Object.fromEntries(groups.map(g=>[g.id,{responsavel:'Victor',nota:'',situacao:'Programado',envio:{...emptyShipment(),packing:{...emptyShipment().packing,invoiceNumero:'PL-'+g.id}}}]))},revision=1,updatedBy='Teste',compact=0,failRead=false,holdRead=false,writes=0;
const errors=[],pages=[];
async function connect(target,employee){
 const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
 let id=0;const pending=new Map();
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);reject(Error('CDP timeout: '+method))},20000);pending.set(key,{resolve:value=>{clearTimeout(timer);resolve(value)},reject:error=>{clearTimeout(timer);reject(error)}});socket.send(JSON.stringify({id:key,method,params}))});
 async function respond(m){
  const u=new URL(m.request.url),method=m.request.method;let payload={},responseCode=200;
  if(u.pathname==='/api/chat/session')payload={employee,employees:[{name:employee,registered:true}]};
  else if(u.pathname==='/api/board'){
   if(method==='GET'){
    if(holdRead&&u.search){await pause(4000)}
    if(failRead){responseCode=503;payload={error:'Teste sem conexão'}}
    else if(u.searchParams.get('revision')===String(revision)){compact++;payload={unchanged:true,revision}}
    else payload={board,revision,updatedBy,...(u.searchParams.has('boardOnly')?{}:{snapshot})};
   }else{
    const input=JSON.parse(m.request.postData);
    if(input.revision!==revision){responseCode=409;payload={error:'Outra pessoa atualizou o quadro.'}}
    else{board=method==='POST'?changeArchive(board,groups.find(o=>o.id===input.orderId),input,employee,new Date().toISOString()):method==='DELETE'?deleteDraftPacking(board,input.owner):input.board;revision++;updatedBy=employee;writes++;payload={revision,updatedBy,...(['DELETE','POST'].includes(method)?{board}:{})}}
   }
  }else if(u.pathname==='/api/nomus')payload={snapshot,configured:false,changes:{},pedidosCoberturaCompleta:true,pedidosIdentificados:2};
  else if(u.pathname==='/api/chat')payload={employee,threads:[],messages:[]};
  else if(u.pathname==='/api/packing-clients')payload={clientes:[],porPedido:{}};
  await send('Fetch.fulfillRequest',{requestId:m.requestId,responseCode,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(payload)).toString('base64')});
 }
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.resolve(m.result)}else if(m.method==='Fetch.requestPaused')void respond(m.params).catch(e=>errors.push(e.message));else if(m.method==='Page.javascriptDialogOpening')void send('Page.handleJavaScriptDialog',{accept:true});else if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params.exceptionDetails))};
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const until=async expression=>{for(let i=0;i<130;i++){if(await evaluate(expression))return;await pause(100)}throw Error(employee+' timeout: '+expression)};
 await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:base+'/api/*',requestStage:'Request'}]});
 // Simulate two visible windows; background-tab updates are checked separately below.
 await send('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>"visible"});localStorage.setItem("pagnier-view",JSON.stringify({month:"range",start:"2026-10-01",end:"2026-10-31"}))'});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:base+'/?aba=packing'});await until('document.querySelectorAll(".packing-document-entry").length===2');
 const page={send,evaluate,until,socket};pages.push(page);return page;
}
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}if(i===99)throw Error('Server unavailable');await pause(300)}
 let targets;for(let i=0;i<60;i++){try{targets=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();if(targets.some(p=>p.type==='page'))break}catch{}await pause(200)}
 const a=await connect(targets.find(p=>p.type==='page'),'Victor');
 const target=await(await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`,{method:'PUT'})).json();
 const b=await connect(target,'Romulo');

 async function navigate(page,label){await page.evaluate(`document.querySelector('.app-navigation [aria-label="${label}"]').click()`)}
 async function change(page,selector,value,event='change'){await page.evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});const prototype=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event(${JSON.stringify(event)},{bubbles:true}))})()`)}
 async function confirm(page){await page.evaluate('document.querySelector(".archive-dialog button[type=submit]").click()');await page.until('!document.querySelector(".archive-dialog")')}
 await navigate(a,'Produção');await a.until('!!document.querySelector(".card-open")');await a.evaluate('document.querySelector(".card-open").click()');await a.until('!!document.querySelector(".card-dialog")');
 await change(a,'[aria-label="Etiqueta de envio"]','Carregamento');await a.until('document.querySelector(".autosave-status").textContent==="Salvo"');
 assert.equal(board.details.A.envio.transportadora,'Carregamento');
 assert.equal(await a.evaluate('document.querySelector(".card-dialog .order-more-actions").open'),false);
 await a.evaluate('document.querySelector(".card-dialog .order-more-actions summary").click();document.querySelector(".card-dialog .order-more-actions button").click()');await a.until('!!document.querySelector(".archive-dialog[open]")');
 assert(!board.details.A.arquivado,'opening confirmation cannot archive');
 assert.equal(await a.evaluate('document.activeElement.textContent'),'Cancelar','cancel is the initial focused action');
 await a.evaluate('document.querySelector(".archive-dialog footer button[type=button]").click()');await a.until('!document.querySelector(".archive-dialog")');assert(!board.details.A.arquivado);
 await a.evaluate('document.querySelector(".card-dialog .order-more-actions button").click()');await a.until('!!document.querySelector(".archive-dialog[open]")');
 await change(a,'[aria-label="Motivo do arquivamento"]','nomus_deleted');assert(await a.evaluate('document.querySelector(".archive-dialog button[type=submit]").disabled'));
 await a.evaluate('document.querySelector(".archive-check input").click()');
 await change(a,'[aria-label="Observação do arquivamento"]','Exclusão conferida no ERP','input');
 const preserved=structuredClone(board.details.A.envio),stage=board.details.A.situacao;
 await confirm(a);assert(board.details.A.arquivado);assert.equal(board.details.A.arquivo.por,'Victor');assert.equal(board.details.A.arquivo.motivo,'nomus_deleted');assert.deepEqual(board.details.A.envio,preserved);assert.equal(board.details.A.situacao,stage);
 await navigate(b,'Produção');await b.until('document.querySelectorAll(".card-open").length===1');
 for(const page of [a,b]){await navigate(page,'Arquivados');await page.until('!!document.querySelector("[data-archived-order=A]")')}
 assert.match(await a.evaluate('document.querySelector(".archived-orders").innerText'),/Exclusão confirmada por Victor/);
 await a.evaluate('document.querySelector("[data-archived-order=A] footer .button.ghost").click()');await a.until('!!document.querySelector(".card-dialog")');assert.match(await a.evaluate('document.querySelector(".card-dialog").innerText'),/Pedido arquivado/);
 await a.evaluate('[...document.querySelectorAll(".dialog-footer button")].find(b=>b.textContent==="Fechar").click()');await a.until('!document.querySelector(".card-dialog")');
 await a.evaluate('document.querySelector("[data-archived-order=A] footer .button:last-child").click()');await a.until('!!document.querySelector(".archive-dialog[open]")');await confirm(a);assert(!board.details.A.arquivado);assert.deepEqual(board.details.A.envio,preserved);assert.equal(board.details.A.situacao,stage);await b.until('!document.querySelector("[data-archived-order=A]")');
 // Catalog entry uses the same protected flow, and archive filters stay local.
 await navigate(a,'Pedidos de venda');await a.until('!!document.querySelector(".sales-order")');
 await a.evaluate('document.querySelector(".sales-order summary").click();document.querySelector(".sales-order .order-more-actions summary").click();document.querySelector(".sales-order .order-more-actions button").click()');await a.until('!!document.querySelector(".archive-dialog[open]")');await confirm(a);
 await navigate(a,'Arquivados');await a.until('document.querySelectorAll("[data-archived-order]").length===1');
 await change(a,'[aria-label="Filtrar motivo do arquivamento"]','nomus_deleted');await a.until('document.querySelectorAll("[data-archived-order]").length===0');
 await change(a,'[aria-label="Filtrar motivo do arquivamento"]','all');await a.until('document.querySelectorAll("[data-archived-order]").length===1');
 for(const width of [1440,390]){await a.send('Page.bringToFront');await a.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<640});await pause(250);assert(await a.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'no archive overflow at '+width);const shot=await a.send('Page.captureScreenshot',{format:'png'});writeFileSync(path.join(dir,'archives-'+width+'.png'),Buffer.from(shot.data,'base64'))}
 await navigate(b,'Produção');await b.until('!!document.querySelector(".filter-toggle")');await b.evaluate('document.querySelector(".filter-toggle").click()');await change(b,'[aria-label="Filtrar transportadora"]','Carregamento');await b.until('document.querySelectorAll(".card-open").length===1');
 assert.deepEqual(errors,[]);
 console.log('OK archive browser: safe menu, cancel focus, explicit deletion checkbox, history, preserved shipping, restore, catalog flow, cross-user synchronization, responsive archive and Carregamento filter.');
}finally{for(const p of pages)p.socket.close();browser.kill();server.kill()}
