import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {emptyShipment} from '../lib/shipping.mjs';
import {deleteDraftPacking} from '../lib/packing-delete.mjs';
const port=5177,debugPort=9247,base=`http://127.0.0.1:${port}`,pause=ms=>new Promise(r=>setTimeout(r,ms));
const dir=path.resolve('.sites-runtime/board-live-qa');mkdirSync(dir,{recursive:true});
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
    else{board=method==='DELETE'?deleteDraftPacking(board,input.owner):input.board;revision++;updatedBy=employee;writes++;payload={revision,updatedBy,...(method==='DELETE'?{board}:{})}}
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
 await a.evaluate('document.querySelector("[data-packing-delete=A]").click()');
 await a.until('document.querySelectorAll(".packing-document-entry").length===1');
 await b.until('document.querySelectorAll(".packing-document-entry").length===1');
 assert(!await b.evaluate('!!document.querySelector("[data-packing-delete=A]")'),'remote packing disappears without reload');
 assert.equal(board.details.A.envio.packingExcluido,true);
 for(const p of [a,b]){await p.evaluate('document.querySelector(".app-navigation [aria-label=Produção]").click()');await p.until('!!document.querySelector(".card-open")')}
 async function shot(page,name){await page.send('Page.bringToFront');await pause(250);const image=await page.send('Page.captureScreenshot',{format:'png'});writeFileSync(path.join(dir,name+'.png'),Buffer.from(image.data,'base64'))}
 const heights=[];
 for(const width of [1900,1440,1100,390]){
  await a.send('Page.bringToFront');await a.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<640});await pause(150);
  const height=await a.evaluate('document.querySelector(".kanban").getBoundingClientRect().top-document.querySelector(".board-main").getBoundingClientRect().top');heights.push({width,height});

  assert(height<=(width>=1400?100:width>=1000?145:230),'compact header at '+width+': '+height);
  assert(await a.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'no page overflow at '+width);
  await shot(a,'compact-header-'+width);
 }
 await a.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 if(await a.evaluate('document.documentElement.dataset.theme!=="dark"'))await a.evaluate('document.querySelector(".theme-toggle").click()');
 await a.until('document.documentElement.dataset.theme==="dark"&&getComputedStyle(document.documentElement).colorScheme==="dark"');
 assert.equal(await a.evaluate('getComputedStyle(document.querySelector(".app-brand img")).backgroundImage'),'none');
 assert.equal(await a.evaluate('getComputedStyle(document.querySelector(".app-brand img")).backgroundColor'),'rgba(0, 0, 0, 0)');
 assert.match(await a.evaluate('getComputedStyle(document.querySelector(".app-brand img")).filter'),/brightness\(0\)/);
 await shot(a,'compact-header-dark');await a.evaluate('document.querySelector(".theme-toggle").click()');await a.until('document.documentElement.dataset.theme==="light"');await shot(a,'compact-header-light');
 console.log('Header height:',JSON.stringify(heights));
 for(const p of [a,b]){await p.evaluate('document.querySelector(".card-open").click()');await p.until('!!document.querySelector(".card-dialog textarea")')}

 const edit=text=>`(()=>{const el=document.querySelector('.card-dialog textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,${JSON.stringify(text)});el.dispatchEvent(new Event('input',{bubbles:true}))})()`;
 await a.evaluate(edit('Orientação compartilhada'));await b.until('document.querySelector(".card-dialog textarea").value==="Orientação compartilhada"');
 await a.evaluate(`(()=>{const el=[...document.querySelectorAll('.card-dialog select')].find(s=>[...s.options].some(o=>o.text==='Produzindo'));el.value=[...el.options].find(o=>o.text==='Produzindo').value;el.dispatchEvent(new Event('change',{bubbles:true}))})()`);
 await b.until(`[...document.querySelectorAll('.card-dialog select')].some(s=>s.selectedOptions[0]?.text==='Produzindo')`);
 // Overlapping writes to the same record: first save wins; the other draft stays visible.
 holdRead=true;
 await Promise.all([a.evaluate(edit('Texto de Victor')),b.evaluate(edit('Texto de Romulo'))]);await pause(1100);holdRead=false;
 await pause(4200);
 const values=await Promise.all([a.evaluate('document.querySelector(".card-dialog textarea").value'),b.evaluate('document.querySelector(".card-dialog textarea").value')]);
 assert.deepEqual(values,['Texto de Victor','Texto de Romulo']);
 assert((await a.evaluate('document.body.innerText')).includes('mesmo pedido')||(await b.evaluate('document.body.innerText')).includes('mesmo pedido'),'conflict is visible');
 assert(['Texto de Victor','Texto de Romulo'].includes(board.details.A.nota));
 assert.equal(board.details.A.envio.packingExcluido,true,'later edits cannot restore deleted packing');
 // Clean reload after reviewing a conflict, followed by an offline/reconnect check.
 for(const p of [a,b]){await p.evaluate(`document.querySelector('[aria-label="Recarregar quadro"]').click()`);await p.until('document.querySelector(".autosave-status").textContent==="Salvo"')}
 await b.evaluate('Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>"hidden"});true');await pause(400);
 await a.evaluate(edit('Atualizado ao voltar à aba'));await pause(4000);
 assert.notEqual(await b.evaluate('document.querySelector(".card-dialog textarea").value'),'Atualizado ao voltar à aba');
 await b.evaluate('Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>"visible"});document.dispatchEvent(new Event("visibilitychange"))');
 await b.until('document.querySelector(".card-dialog textarea").value==="Atualizado ao voltar à aba"');
 failRead=true;await b.until('document.body.innerText.includes("Esta tela pode estar desatualizada")');failRead=false;
 await b.evaluate('window.dispatchEvent(new Event("online"))');await b.until('!document.body.innerText.includes("Esta tela pode estar desatualizada")');
 assert(compact>0,'unchanged polling uses compact replies');assert(writes>=4);assert.deepEqual(errors,[]);
 console.log('OK two browser sessions: packing deletion, note edits, stage moves, concurrent conflict with preserved drafts, reconnect and compact polling. No real ERP/database accessed.');
}finally{for(const p of pages)p.socket.close();browser.kill();server.kill()}
