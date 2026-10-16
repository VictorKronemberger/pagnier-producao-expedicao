import {chatTestDatabase} from "../scripts/chat-test-db.mjs";
import {loginChat,sessionEmployee,sendMessage,chatSummary,readMessages,markRead} from "../lib/team-chat.mjs";
import {staffNames} from "../lib/staff.mjs";
const {db:chatDb,sqlite}=chatTestDatabase();let chatEmployee=null,loseResponse=true,passthrough=false;
const chatAllowed=new Set(["PV TESTE","PV SEM OP"]);
await loginChat(chatDb,{name:"Victor",pin:"5826",register:true});
import {deleteDraftPacking} from "../lib/packing-delete.mjs";
import {emptyShipment,newBox} from "../lib/shipping.mjs";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdirSync,writeFileSync,existsSync,readFileSync} from "node:fs";
import path from "node:path";
const dir=path.resolve(".sites-runtime/team-chat-browser-qa");mkdirSync(dir,{recursive:true});
const browser=spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless","--disable-gpu","--no-first-run","--remote-debugging-port=9239","--user-data-dir="+dir,"about:blank"],{windowsHide:true,stdio:"ignore"});
const pdfDir=path.resolve(".sites-runtime/packing-download-qa");mkdirSync(pdfDir,{recursive:true});const invoice="QA-"+Date.now();
let clientReads=0;let socket;let rejectNextConfirmation=false;const confirmations=[];const pause=ms=>new Promise(r=>setTimeout(r,ms));
const snapshot={consultadoEm:"2026-10-25",ordensConsultadas:3,grupos:[
{id:"PV TESTE",codigo:"PV TESTE",cliente:"Cliente de teste",liberacao:"released",ordens:[{id:"OP TESTE",nome:"OP TESTE",produto:"Produto teste 10g",quantidade:"80",quantidadeProgramada:"100",quantidadeAnterior:"100",quantidadeAlteradaEm:"2026-10-25T12:00:00.000Z",unidade:"UNID",criacao:"2026-10-21"}],vinculo:"linked"},
{id:"PV SEM OP",codigo:"PV SEM OP",cliente:"Cliente sem OP",ordens:[],vinculo:"none"}],
semVinculo:[{id:"OP KG",nome:"OP KG",produto:"Mistura KG",quantidade:"10",unidade:"KG",criacao:"2026-10-22"}]};
snapshot.pedidos=[...snapshot.grupos,...Array.from({length:51},(_,i)=>({id:"PV CAT "+i,codigo:"PV CAT "+i,cliente:"Cliente catálogo",ordens:[],itens:[{produto:"Produto catálogo",quantidade:"2",unidade:"KG"}]}))];
let board={sequence:[],details:{"PV TESTE":{responsavel:"Nome anterior",nota:"",situacao:"A programar",conferidas:["OP TESTE"]}}},revision=0,writes=0,concurrent=0,maxConcurrent=0;
try{
 let pages;for(let i=0;i<60;i++){try{pages=await(await fetch("http://127.0.0.1:9239/json")).json();if(pages.some(p=>p.type==="page"))break}catch{}await pause(200)}
 socket=new WebSocket(pages.find(p=>p.type==="page").webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});
 let id=0;const pending=new Map();
 function send(method,params={}){return new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});socket.send(JSON.stringify({id:i,method,params}))})}
 async function respond(m){
 const url=new URL(m.request.url);
 if(passthrough){await send("Fetch.continueRequest",{requestId:m.requestId});return}
 let payload,status=200;
 if(url.pathname.startsWith("/api/chat")){
 if(passthrough){await send("Fetch.continueRequest",{requestId:m.requestId});return}
 try{
 const input=m.request.postData?JSON.parse(m.request.postData):{};
 if(url.pathname==="/api/chat/session"){
 if(m.request.method==="POST"){const result=await loginChat(chatDb,input);chatEmployee=result.name;payload={employee:chatEmployee}}
 else if(m.request.method==="DELETE"){chatEmployee=null;payload={ok:true}}
 else payload={employee:chatEmployee,employees:staffNames.map(name=>({name,registered:!!sqlite.prepare("SELECT name FROM chat_employees WHERE name=?").get(name)}))};
 }else if(!chatEmployee){status=401;payload={error:"Entre no chat"}}
 else if(url.pathname==="/api/chat/read"){await markRead(chatDb,chatEmployee,input.channel,input.id);payload={ok:true}}
 else if(m.request.method==="POST"){payload={message:await sendMessage(chatDb,chatEmployee,input,chatAllowed)};if(loseResponse){loseResponse=false;status=503;payload={error:"Falha simulada após gravar; tente novamente."}}}
 else payload={employee:chatEmployee,threads:await chatSummary(chatDb,chatEmployee,chatAllowed),...(url.searchParams.has("summary")?{}:await readMessages(chatDb,url.searchParams.get("channel")||"general",Number(url.searchParams.get("before")||0)))};
 }catch(error){status=error.status||500;payload={error:error.message}}
 }else if(url.pathname==="/api/board"){
 if(m.request.method==="DELETE"){
 const body=JSON.parse(m.request.postData);
 if(body.revision!==revision){status=409;payload={error:"Conflito no teste"}}else{try{board=deleteDraftPacking(board,body.owner);revision++;writes++;payload={board,revision,updatedAt:new Date().toISOString(),updatedBy:"Teste"}}catch(e){status=400;payload={error:e.message}}}
 }else if(m.request.method==="PUT"){
 concurrent++;maxConcurrent=Math.max(maxConcurrent,concurrent);const body=JSON.parse(m.request.postData);await pause(300);
 if(body.revision!==revision){status=409;payload={error:"Conflito no teste"}}else{board=body.board;revision++;writes++;payload={revision,updatedAt:new Date().toISOString(),updatedBy:"Teste"}}
 concurrent--;
 }else payload={snapshot,board,revision,updatedAt:null,updatedBy:null};
 }else if(url.pathname==="/api/nomus")payload={snapshot,changes:{"PV TESTE":{at:"2026-10-25T12:00:00.000Z",items:["OP TESTE atualizada"],events:[{at:"2026-10-25T12:00:00.000Z",summary:"OP TESTE atualizada",entity:"OP TESTE",kind:"updated",fields:[{label:"Quantidade",before:"100",after:"80"}]}]}},configured:true,lastChecked:"2026-10-25T12:00:00.000Z",partial:false,message:"Teste isolado",page:1,pedidosCoberturaCompleta:true,pedidosIdentificados:53,paginaPedidos:1};
 else if(url.pathname==="/api/packing-clients"){clientReads++;
 payload=url.searchParams.has("key")?{key:url.searchParams.get("key"),cliente:{nome:"Cliente sem OP",razaoSocial:"Titular de teste",registro:"REGISTRO TESTE",telefone:"TESTE",email:"teste@example.invalid",cidade:"Cidade",pais:"Netherlands",enderecos:[{label:"Principal",value:"Endereco teste"}]}}:{clientes:[{key:"a".repeat(64),nome:"Cliente de teste"},{key:"b".repeat(64),nome:"Cliente sem OP"}],selecionado:"a".repeat(64),porPedido:{"PV TESTE":"a".repeat(64),"PV SEM OP":"b".repeat(64)}};
 }else {status=404;payload={error:"API bloqueada no teste"}}
 await send("Fetch.fulfillRequest",{requestId:m.requestId,responseCode:status,responseHeaders:[{name:"Content-Type",value:"application/json"}],body:Buffer.from(JSON.stringify(payload)).toString("base64")});
 }
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.resolve(m.result)}else if(m.method==="Fetch.requestPaused")void respond(m.params);else if(m.method==="Page.javascriptDialogOpening"){confirmations.push(m.params.message);void send("Page.handleJavaScriptDialog",{accept:!rejectNextConfirmation});rejectNextConfirmation=false}};
 async function evaluate(expression){const r=await send("Runtime.evaluate",{expression:"{"+expression+"}",awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async function until(expression){for(let i=0;i<80;i++){if(await evaluate(expression))return;await pause(150)}throw Error("Timeout: "+expression)}
 const waitForSave=async()=>{await pause(150);await until('[...document.querySelectorAll(".autosave-status")].every(el=>el.textContent==="Salvo")')};
 await send("Page.enable");await send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.removeItem(\"pagnier-view\")"});await send("Fetch.enable",{patterns:[{urlPattern:"*://127.0.0.1:5173/api/*",requestStage:"Request"}]});await send("Emulation.setDeviceMetricsOverride",{width:1280,height:900,deviceScaleFactor:1,mobile:false});

 await send("Page.navigate",{url:"http://127.0.0.1:5173/signin-with-chatgpt?return_to=/"});await until('!!document.querySelector(".employee-login-form")');
 assert.equal(await evaluate('!!document.querySelector(".kanban")'),false);
 assert.equal(await evaluate('!!document.querySelector(".team-chat-panel")'),false);
 passthrough=true;
 const real=await evaluate(`(async()=>{const r=await fetch('/api/chat/session');return {status:r.status,data:await r.json()}})()`);
 assert.equal(real.status,200,JSON.stringify(real));assert.equal(real.data.employees.length,5);
 for(const path of ['/api/board','/api/nomus','/api/packing-clients'])assert.equal(await evaluate(`(async()=>{const r=await fetch(${JSON.stringify(path)});return r.status})()`),401,path+' must require employee login');
 passthrough=false;
 let loginShot=await send('Page.captureScreenshot',{format:'png'});writeFileSync('.sites-runtime/employee-login-desktop.png',Buffer.from(loginShot.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(100);
 loginShot=await send('Page.captureScreenshot',{format:'png'});writeFileSync('.sites-runtime/employee-login-mobile.png',Buffer.from(loginShot.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 const fill=async(selector,value,select=false)=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event(${JSON.stringify(select?'change':'input')},{bubbles:true}));})()`);

 await fill('.employee-login-form select','Pedro',true);await evaluate(`document.querySelector('.employee-login-form .text-action').click()`);
 await fill('[aria-label="PIN de acesso"]','2846');await fill('[aria-label="Confirmar PIN de acesso"]','2846');await evaluate(`document.querySelector('.employee-login-form').requestSubmit()`);await until(`!!document.querySelector('.team-chat-launcher')`);await waitForSave();
 assert.equal(await evaluate(`!!document.querySelector('.team-chat-panel')`),false);
 await evaluate(`document.querySelector('.team-chat-launcher').click()`);await until(`!!document.querySelector('.team-chat-composer')`);
 await fill('[aria-label="Mensagem para a equipe"]','@Victor, confira este pedido. <script>texto literal</script>');
 await evaluate(`document.querySelector('[aria-label="Referenciar pedido"]').click()`);await until(`!!document.querySelector('.team-chat-reference-picker button')`);await evaluate(`document.querySelector('.team-chat-reference-picker button').click()`);
 await evaluate(`document.querySelector('.team-chat-composer').requestSubmit()`);await until(`!!document.querySelector('.team-chat-error')`);
 assert(await evaluate(`document.querySelector('[aria-label="Mensagem para a equipe"]').value.includes('@Victor')`));
 await evaluate(`document.querySelector('.team-chat-composer').requestSubmit()`);await until(`document.querySelector('[aria-label="Mensagem para a equipe"]').value===''`);
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM chat_messages').get().n,1);
 assert.equal(await evaluate(`document.querySelectorAll('.team-chat-message script').length`),0);
 await evaluate(`document.querySelector('[aria-label="Sair do painel"]').click()`);await until(`!!document.querySelector('.employee-login-form')`);
 await fill('.employee-login-form select','Victor',true);await fill('[aria-label="PIN de acesso"]','5826');await evaluate(`document.querySelector('.employee-login-form').requestSubmit()`);await until(`!!document.querySelector('.team-chat-launcher b')`);
 assert.equal(await evaluate(`!!document.querySelector('.team-chat-panel')`),false);assert.equal(await evaluate(`document.title.startsWith('(1)')`),true);
 await evaluate(`document.querySelector('.team-chat-launcher').click()`);await until(`document.querySelectorAll('.team-chat-message').length===1`);
 assert.equal(await evaluate(`document.querySelector('.team-chat-message.mentioned strong').textContent`),'Pedro');
 await fill('[aria-label="Mensagem para a equipe"]','Já conferi, @Pedro.');await evaluate(`document.querySelector('.team-chat-composer').requestSubmit()`);await until(`document.querySelectorAll('.team-chat-message').length===2`);
 assert.equal(sqlite.prepare('SELECT author FROM chat_messages ORDER BY id DESC LIMIT 1').get().author,'Victor');
 await evaluate(`document.querySelector('[aria-label="Fechar mensagens"]').click()`);await evaluate(`document.querySelector('.card-chat').click()`);await until(`document.querySelector('.team-chat-channel').textContent.includes('PV TESTE')`);
 await fill('[aria-label="Mensagem para a equipe"]','@Pedro, pedido pronto para documentação.');await evaluate(`document.querySelector('.team-chat-composer').requestSubmit()`);await until(`document.querySelectorAll('.team-chat-message').length===1`);
 assert.equal(sqlite.prepare('SELECT channel FROM chat_messages ORDER BY id DESC LIMIT 1').get().channel,'order:PV TESTE');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(200);
 assert(await evaluate(`(()=>{const r=document.querySelector('.team-chat-panel').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()`));
 let shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync('.sites-runtime/team-chat-mobile.png',Buffer.from(shot.data,'base64'));
 await evaluate(`document.querySelector('.team-chat-channel .text-action').click()`);await until(`!!document.querySelector('.card-dialog')`);assert.equal(await evaluate(`!!document.querySelector('.team-chat-panel')`),false);
 await evaluate(`document.querySelector('.card-dialog .close').click()`);
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await evaluate(`document.querySelector('.card-chat').click()`);await until(`!!document.querySelector('.team-chat-composer')`);
 shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync('.sites-runtime/team-chat-desktop.png',Buffer.from(shot.data,'base64'));
 await sendMessage(chatDb,'Pedro',{channel:'general',body:'@Victor, um novo recado',clientId:'qa-second-employee'},chatAllowed);
 await evaluate(`document.querySelector('[aria-label="Fechar mensagens"]').click()`);
 await evaluate(`document.dispatchEvent(new Event('visibilitychange'))`);await until(`!!document.querySelector('.team-chat-launcher b')`);
 assert.equal(await evaluate(`document.querySelector('.team-chat-launcher b').textContent`),'1');
 await send('Page.reload');await until(`!!document.querySelector('.team-chat-launcher b')`);assert.equal(await evaluate(`!!document.querySelector('.team-chat-panel')`),false);

 for(let i=0;i<65;i++)await sendMessage(chatDb,'Pedro',{channel:'general',body:'Histórico '+i,clientId:'history-browser-'+i},chatAllowed);
 await evaluate(`document.querySelector('.team-chat-launcher').click()`);await until(`!!document.querySelector('.team-chat-channel')`);
 await evaluate(`document.querySelector('.team-chat-channel>button').click()`);await until(`!!document.querySelector('.team-chat-thread')`);await evaluate(`document.querySelector('.team-chat-thread').click()`);await until(`!!document.querySelector('.team-chat-older')`);
 await evaluate(`document.querySelector('.team-chat-older').click()`);await until(`!document.querySelector('.team-chat-older')`);
 await evaluate(`document.dispatchEvent(new Event('visibilitychange'))`);await pause(700);assert.equal(await evaluate(`!!document.querySelector('.team-chat-older')`),false);

 await fill('[aria-label="Mensagem para a equipe"]','Rascunho preservado durante a nova entrada');
 chatEmployee=null;await evaluate(`document.dispatchEvent(new Event('visibilitychange'))`);await until(`!!document.querySelector('.employee-login-form')`);
 assert.equal(await evaluate(`document.querySelector('.employee-login-form select').disabled`),true);
 assert.equal(await evaluate(`!!document.querySelector('[hidden] .kanban')`),true);
 await fill('[aria-label="PIN de acesso"]','5826');await evaluate(`document.querySelector('.employee-login-form').requestSubmit()`);await until(`!document.querySelector('.employee-login-form')`);
 assert.equal(await evaluate(`document.querySelector('[aria-label="Mensagem para a equipe"]').value`),'Rascunho preservado durante a nova entrada');
 console.log('OK site login/chat: protected APIs, first PIN before dashboard, unread/title without opening chat, session expiry and draft preservation, identity switch, shared messages, retry deduplication, mentions, references, order action, mobile, unread and persistence.');
}finally{socket?.close();browser.kill();sqlite.close()}
