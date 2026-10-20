import {observeOrderPage,observeOrderPresence,finishOrderScan,orderAbsenceCandidate,observeOrderFailure} from "./nomus-order-presence.mjs";
import {SITE_START_DATE} from "./date-filter.mjs";
import {isCancelledOP,withOPStatus} from "./op-status.mjs";
import {allowedProductionPath,productionRequest,acceptProduction,withProductionQuantities} from "./nomus-production.mjs";
import {releaseState,restoreReleaseItems} from "./order-release.mjs";
import {lotPath,lotRows,withLotDates} from "./nomus-lots.mjs";
import {trackOPQuantity,prepareQuantityState} from "./production-quantity.mjs";
import {opFacts,orderFacts,diffFacts,newFacts} from "./nomus-changes.mjs";
import {visibleOrderState} from "./order-visibility.mjs";
import {isMedicineName,companyId,EXCLUDED_COMPANY_ID,excludeCompanyOrder,applyCompanyScope} from "./company-scope.mjs";
export const opsPath=page=>"ordens?pagina="+page+"&query="+encodeURIComponent("dataHoraCriacao>="+SITE_START_DATE+"T00:00:00");
const BASE="https://pagnier.nomus.com.br/pagnier/rest";
export function creationDate(value){const m=String(value??"").match(/^(\d{2})\/(\d{2})\/(\d{4})/);if(!m)return "";const iso=m[3]+"-"+m[2]+"-"+m[1],d=new Date(iso+"T12:00:00Z");return Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==iso?"":iso}
function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==="object")return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));return v}
async function hash(v){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(stable(v))));return Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,"0")).join("")}
export function initialSync(snapshot){return {version:2,opsScopeStart:SITE_START_DATE,snapshot:structuredClone(snapshot),ops:{},orders:{},clients:{},products:{},pendingOps:{},seenLinks:{},pages:{orders:1,ops:1,clients:1,products:1},turn:0,nextAt:0,lastChecked:null,lastCycle:null,partial:true,opsComplete:false,ordersComplete:false,message:"Leitura inicial em andamento.",changes:{},cycleCount:0}}
export function publicSync(state,configured){
 state=visibleOrderState(prepareQuantityState(applyCompanyScope(structuredClone(state))));
 state.snapshot=withOPStatus(state);
 state.snapshot=withProductionQuantities(withLotDates(state.snapshot,state),state);
 const groups=new Map(state.snapshot.grupos.map(g=>[g.id,g]));
 const pedidos=Object.entries(state.orders??{}).filter(([,o])=>o.code).map(([id,o])=>{
 o={...o,items:restoreReleaseItems(o,state.products)};const linked=groups.get(o.code);return {nomusId:Number(id),pedidoAusenteDesde:state.orderAbsences?.[id]?.confirmedAt??null,pedidoConsultaFalhou:!!state.orderReviewFailures?.[id]&&!state.orderAbsences?.[id]?.confirmedAt,pedidoRevisaoMotivo:state.orderReviewFailures?.[id]?.reason??null,pedidoConsultadoEm:o.checkedAt??null,liberacao:releaseState(o.items),id:o.code,codigo:o.code,criacao:o.createdDate??"",cliente:state.clients?.[o.clientId]??linked?.cliente??"",ordens:linked?.ordens??[],vinculo:linked?.ordens?.length?"linked":state.opsComplete&&!state.seenLinks?.[id]?"none":"unknown",itens:(o.items??[]).map(i=>({produto:state.products?.[i.productId]?.name??"",quantidade:i.quantity,unidade:state.products?.[i.productId]?.unit??"",status:i.status,item:i.item??""}))};
 });
 const awaitingCompany=Object.keys({...state.excludedOrderCodes,...Object.fromEntries(Object.keys(state.pendingCompanyGroups??{}).map(id=>[id,true])),...Object.fromEntries(Object.values(state.pendingCompanyOrders??{}).map(o=>[o.code,true]))}).filter(code=>!state.excludedOrderCodes?.[code]).length;
 return {recortePedidos:state.orderDateScope,pedidosEmpresaPendente:awaitingCompany,snapshot:{...state.snapshot,grupos:state.snapshot.grupos.map(g=>{const sale=pedidos.find(p=>p.id===g.id);return {...g,liberacao:sale?.liberacao??"unknown",...(sale?{itens:sale.itens,nomusId:sale.nomusId,pedidoAusenteDesde:sale.pedidoAusenteDesde,pedidoConsultadoEm:sale.pedidoConsultadoEm,pedidoConsultaFalhou:sale.pedidoConsultaFalhou,pedidoRevisaoMotivo:sale.pedidoRevisaoMotivo}:{})}}),pedidos},changes:state.changes,configured,lastChecked:state.lastChecked,lastCycle:state.lastCycle,partial:state.partial||awaitingCompany>0||pedidos.some(p=>p.pedidoConsultaFalhou),message:configured?(state.message+(awaitingCompany?" "+awaitingCompany+" pedido(s) oculto(s) até confirmar a empresa.":"")+(pedidos.some(p=>p.pedidoConsultaFalhou)?" Há pedidos não confirmados pelo Nomus; dados anteriores preservados.":"")):"Conexão com o Nomus não configurada.",page:state.pages?.ops??state.page??1,paginaPedidos:state.pages?.orders??1,pedidosConsultados:pedidos.length,pedidosCoberturaCompleta:!!state.ordersComplete,pedidosIdentificados:pedidos.filter(p=>p.cliente&&p.itens.every(i=>i.produto)).length};
}
export async function nomusGet(path,key,fetcher=fetch){
 const requestedPage=Number(new URLSearchParams(path.split("?")[1]).get("pagina"));
 const scopedOps=Number.isSafeInteger(requestedPage)&&requestedPage>0&&path===opsPath(requestedPage);
 if(!scopedOps&&!allowedProductionPath(path)&&!/^(ordens\?pagina=\d+|pedidos\?pagina=\d+|pedidos\/\d+|clientes\/\d+|produtos\/\d+|clientes\?pagina=\d+|produtos\?pagina=\d+|lotesSerie\?pagina=\d+&query=loteSerie%3D%3D%22OP\d+%22)$/.test(path))throw Error("Consulta não permitida.");
 const token=key.replace(/^Basic\s+/i,"").trim();if(!token||/\s/.test(token))throw Error("Chave do Nomus inválida.");
 const response=await fetcher(BASE+"/"+path,{method:"GET",headers:{Authorization:"Basic "+token,Accept:"application/json"},redirect:"manual",signal:AbortSignal.timeout(18000),cache:"no-store"});
 if(!response.ok){const e=new Error("Consulta ao Nomus indisponível (HTTP "+response.status+").");e.status=response.status;const delay=Number(response.headers.get("Retry-After"));if(Number.isFinite(delay)&&delay>0)e.retryAfterMs=Math.min(delay*1000,3600000);throw e}
 return response.json();
}
export async function syncStep(previous,key,{fetcher=fetch,now=new Date().toISOString(),requestedLots=[],requestedProduction=[],requestedOrder="",refreshOrder=false,refreshRecentOrders=false}={}){
 let state=prepareQuantityState(applyCompanyScope(structuredClone(previous)));const stamp=Date.parse(now);if(stamp<state.nextAt)return state;
 if(state.version!==2){const old=state;state=initialSync(old.snapshot);state.changes=old.changes??{}}
 for(const o of Object.values(state.orders??{}))o.items=restoreReleaseItems(o,state.products);
 if(state.opsScopeStart!==SITE_START_DATE){state.opsScopeStart=SITE_START_DATE;state.pages.ops=1;state.opsComplete=false;state.cycleCount=0;delete state.bootstrapCompletedAt}
 state.pages.clients??=1;state.pages.products??=1;
 const groups=new Map(state.snapshot.grupos.map(g=>[g.id,g]));
 const known=new Set([...state.snapshot.grupos.flatMap(g=>g.ordens),...Object.values(state.pendingCompanyGroups??{}).flatMap(g=>g.ordens),...state.snapshot.semVinculo].map(o=>o.id));
 function changed(id,text,event){const old=state.changes[id];state.changes[id]={at:now,items:[...new Set([text,...(old?.items??[])])].slice(0,30),events:[...(event?[{...event,summary:text,at:now}]:[]),...(old?.events??[])].slice(0,30)}}
 function ensureGroup(order){
 let g=groups.get(order.code);if(!g){g=structuredClone(state.pendingCompanyGroups?.[order.code]??{id:order.code,codigo:order.code,cliente:"",ordens:[],vinculo:"unknown"});groups.set(order.code,g)}
 if(state.clients[order.clientId])g.cliente=state.clients[order.clientId];
 g.criacao=order.createdDate??"";g.liberacao=releaseState(order.items);
 if(order.items)g.itens=order.items.map(i=>({produto:state.products[i.productId]?.name??"Produto aguardando consulta",quantidade:i.quantity,unidade:state.products[i.productId]?.unit??"",status:i.status,item:i.item??""}));
 return g;
 }
 function attachPending(){
 for(const [name,entry] of Object.entries(state.pendingOps)){
 const allowedLinks=entry.links.filter(l=>!Object.hasOwn(state.excludedOrders??{},l.orderId));
 if(entry.links.length&&!allowedLinks.length){state.excludedOps??={};state.excludedOps[name]=true;delete state.pendingOps[name];for(const g of groups.values())g.ordens=g.ordens.filter(o=>o.id!==name);state.snapshot.semVinculo=state.snapshot.semVinculo.filter(o=>o.id!==name);delete state.ops[name];continue}
 const links=allowedLinks.map(l=>({code:state.orders[l.orderId]?.code,client:l.client})).filter(l=>l.code);
 if(links.length!==allowedLinks.length)continue;
 if(links.length&&state.excludedOps)delete state.excludedOps[name];
 const old=state.ops[name];
 const priorOP=[...groups.values()].flatMap(g=>g.ordens).find(o=>o.id===name)||state.snapshot.semVinculo.find(o=>o.id===name);
 const events=[...new Map(links.flatMap(l=>state.changes[l.code]?.events??[]).map(e=>[e.at+e.entity+e.summary,e])).values()];
 entry.op=trackOPQuantity({...priorOP,...old},entry.op,now,events);
 for(const g of groups.values())g.ordens=g.ordens.filter(o=>o.id!==name);
 state.snapshot.semVinculo=state.snapshot.semVinculo.filter(o=>o.id!==name);
 for(const {code,client} of links){
 let g=groups.get(code);if(!g){g={id:code,codigo:code,cliente:client,ordens:[],vinculo:"linked"};groups.set(code,g)}
 g.vinculo="linked";if(client)g.cliente=client;g.ordens.push(entry.op);
 if(old&&old.hash!==entry.hash){const fields=diffFacts(old.facts,entry.facts);changed(code,"OP "+name+" atualizada",{kind:"updated",entity:"OP "+name,fields,note:!old.facts?"O valor anterior não foi registrado nesta consulta antiga.":!fields.length?"Outros dados da OP mudaram no Nomus; não há comparação disponível para esses campos.":""});}
 else if(!old&&!known.has(name))changed(code,"Nova OP "+name,{kind:"created",entity:"OP "+name,fields:newFacts(entry.facts)});
 }
 if(old&&old.hash!==entry.hash)for(const code of old.groups??[])if(!links.some(l=>l.code===code))changed(code,"Vínculo da OP "+name+" atualizado",{kind:"updated",entity:"OP "+name,fields:[{label:"Pedidos vinculados",before:(old.groups??[]).join(", "),after:links.map(l=>l.code).join(", ")||"Sem pedido"}]});
 if(!links.length&&!state.excludedOps?.[name])state.snapshot.semVinculo.push(entry.op);
 state.ops[name]={hash:entry.hash,groups:links.map(l=>l.code),facts:entry.facts,quantidadeProgramada:entry.op.quantidadeProgramada,quantidadeAnterior:entry.op.quantidadeAnterior,quantidadeAlteradaEm:entry.op.quantidadeAlteradaEm};delete state.pendingOps[name];
 }
 }
 const companyReview=Object.keys(state.pendingCompanyOrders??{}).find(id=>Number.isSafeInteger(Number(id))&&Number(id)>0&&stamp>=(state.companyRetryAt?.[id]??0));
 const absenceReview=orderAbsenceCandidate(visibleOrderState(state),now);
 const missingRelease=Object.entries(state.orders).find(([,o])=>o.items?.length&&o.items.some(i=>i.status===undefined)&&(o.createdDate>=SITE_START_DATE||groups.get(o.code)?.ordens?.length))?.[0];
 const missingOrder=[...new Set(Object.values(state.pendingOps).flatMap(e=>e.links.map(l=>l.orderId)))].find(id=>!state.orders[id]&&!Object.hasOwn(state.excludedOrders??{},id));
 const visibleOrders=Object.values(visibleOrderState(state).orders);
 const missingClient=visibleOrders.find(o=>!state.clients[o.clientId]&&Number.isInteger(o.clientId));
 const missingProduct=visibleOrders.flatMap(o=>o.items??[]).find(i=>!state.products[i.productId]&&Number.isInteger(i.productId));
 // One ERP GET per step. The shared database lease prevents parallel tabs from multiplying requests.
 let kind=!state.ordersComplete?"orders":["orders","ops","clients","products","detail"][state.turn%5];
 // Reuse hydrated catalogs between daily revalidations; missing visible details still load.
 if((kind==="clients"||kind==="products")&&stamp<(state.catalogNextAt?.[kind]??0))kind="detail";
 let path;
 const lotName=requestedLots.find(name=>lotPath(name)&&(!state.lots?.[name]||stamp>=(state.lots[name].nextAt??0)));
 const production=productionRequest(state,requestedProduction,stamp);
 const focusedOrder=Object.entries(state.orders).find(([id,o])=>o.code===requestedOrder&&/^[1-9]\d*$/.test(id)&&Number.isSafeInteger(Number(id))&&(refreshOrder||!o.checkedAt||stamp>=Date.parse(o.checkedAt)+300000))?.[0];
 const recent=refreshRecentOrders&&stamp>=(state.recentOrdersNextAt??0);
 if(focusedOrder){kind="detail";path="pedidos/"+focusedOrder;}
 else if(recent){kind="recent";path="pedidos?pagina=1";}
 else if(kind==="detail"){
 if(absenceReview)path="pedidos/"+absenceReview;
 else if(companyReview)path="pedidos/"+companyReview;
 else if(missingOrder)path="pedidos/"+missingOrder;
 else if(missingRelease)path="pedidos/"+missingRelease;
 else if(missingClient)path="clientes/"+missingClient.clientId;
 else if(missingProduct)path="produtos/"+missingProduct.productId;
 else {kind="ops";path=opsPath(state.pages.ops)}
 }else if(kind==="ops")path=opsPath(state.pages.ops);
 else path=({orders:"pedidos",ops:"ordens",clients:"clientes",products:"produtos"}[kind])+"?pagina="+state.pages[kind];
 if(!focusedOrder&&!recent&&lotName&&state.turn%2===1){kind="lots";path=lotPath(lotName,state.lots?.[lotName]?.page??1)}
 if(!focusedOrder&&!recent&&production&&state.turn%4!==0){kind="production";path=production.path}
 try{
 const result=await nomusGet(path,key,fetcher);
 if(kind==="production"){acceptProduction(state,production,result,now);
 }else if(kind==="lots"){
 if(!Array.isArray(result))throw Error("Formato de lotes inesperado.");
 state.lots??={};const previousLot=state.lots[lotName],page=previousLot?.page??1;
 const rows=[...(page>1?previousLot.rows:[]),...lotRows(result,lotName)];
 state.lots[lotName]={rows,page:result.length<50?1:page+1,nextAt:result.length<50?stamp+(rows.some(r=>r.expiry)?3600000:300000):0};
 }else if(kind==="orders"||kind==="recent"||path.startsWith("pedidos/")){
 const rows=Array.isArray(result)?result:[result];if((kind==="orders"||kind==="recent")&&!Array.isArray(result))throw Error("Formato inesperado.");
 if(kind==="orders")observeOrderPage(state,rows,state.pages.orders,now);
 const detailId=path.startsWith("pedidos/")?path.split("/")[1]:null;
 if(detailId&&(Array.isArray(result)||result?.id!==Number(detailId)||!Array.isArray(result.itensPedido)))throw Error("Pedido não confirmado pela consulta.");
 for(const p of rows){
 if(!p||!Number.isInteger(p.id)||typeof p.codigoPedido!=="string")continue;
 if(companyId(p.idEmpresa)===EXCLUDED_COMPANY_ID||isMedicineName(p.codigoPedido)||isMedicineName(state.clients?.[p.idPessoaCliente])){excludeCompanyOrder(state,p.id,p.codigoPedido);continue;}
 if(companyId(p.idEmpresa)===null){if(!Object.hasOwn(state.excludedOrders??{},p.id)){state.pendingCompanyOrders??={};state.pendingCompanyOrders[p.id]={code:p.codigoPedido,companyId:null};delete state.orders[p.id]}state.companyRetryAt??={};state.companyRetryAt[p.id]=stamp+3600000;continue}
 delete state.pendingCompanyOrders?.[p.id];delete state.companyRetryAt?.[p.id];
 delete state.excludedOrders?.[p.id];delete state.excludedOrderCodes?.[p.codigoPedido];
 const fingerprint=await hash(p),old=state.orders[p.id],source=Array.isArray(result)?"list":"detail";
 // Different endpoint representations get separate baselines to avoid false alerts.
 const facts=orderFacts(p,state.clients,state.products);
 if(old?.[source+"Hash"]&&old[source+"Hash"]!==fingerprint){const fields=diffFacts(old[source+"Facts"],facts);changed(p.codigoPedido,"Pedido atualizado no Nomus",{kind:"updated",entity:"Pedido "+p.codigoPedido,fields,note:!old[source+"Facts"]?"O valor anterior não foi registrado nesta consulta antiga.":!fields.length?"Outros dados do pedido mudaram no Nomus; não há comparação disponível para esses campos.":""});}
 const order={...old,createdDate:creationDate(p.dataCriacao)||old?.createdDate||"",companyId:companyId(p.idEmpresa),code:p.codigoPedido,clientId:p.idPessoaCliente,active:(p.itensPedido??[]).some(i=>[1,2,3].includes(Number(i.status))),items:(p.itensPedido??[]).map(i=>({productId:i.idProduto,quantity:String(i.quantidade??""),status:Number(i.status),item:String(i.item??"")})),[source+"Hash"]:fingerprint,[source+"Facts"]:facts};
 observeOrderPresence(state,p.id);order.checkedAt=now;state.orders[p.id]=order;if(order.active||groups.has(order.code))ensureGroup(order);
 }
 if(kind==="recent")state.recentOrdersNextAt=stamp+300000;
 if(kind==="orders"){if(rows.length<50){
 finishOrderScan(state,now);
 state.pages.orders=1;state.ordersComplete=true}else state.pages.orders++}
 }else if(kind==="clients"||kind==="products"){
 if(!Array.isArray(result))throw Error("Formato inesperado.");
 for(const item of result){if(!Number.isInteger(item.id))continue;if(kind==="clients")state.clients[item.id]=String(item.nome??"");else state.products[item.id]={name:String(item.descricao??item.nome??""),unit:String(item.siglaUnidadeMedida??"")};}
 state.pages[kind]=result.length<50?1:state.pages[kind]+1;
 if(result.length<50){state.catalogNextAt??={};state.catalogNextAt[kind]=stamp+86400000}
 }else if(kind==="ops"){
 if(!Array.isArray(result))throw Error("Formato inesperado.");
 for(const o of result){
 if(typeof o.nome!=="string")continue;
 if(companyId(o.idEmpresa)===EXCLUDED_COMPANY_ID||(o.itensPedido??[]).some(i=>isMedicineName(i.nomeCliente)||isMedicineName(state.orders[i.idPedido]?.code))){
 for(const i of o.itensPedido??[])if(isMedicineName(i.nomeCliente)||isMedicineName(state.orders[i.idPedido]?.code)){if(i.nomeCliente&&state.orders[i.idPedido]?.clientId)state.clients[state.orders[i.idPedido].clientId]=String(i.nomeCliente);excludeCompanyOrder(state,i.idPedido,state.orders[i.idPedido]?.code);}
 state.excludedOps??={};state.excludedOps[o.nome]=true;delete state.pendingOps[o.nome];delete state.ops[o.nome];
 for(const g of groups.values())g.ordens=g.ordens.filter(op=>op.id!==o.nome);
 for(const g of Object.values(state.pendingCompanyGroups??{}))g.ordens=g.ordens.filter(op=>op.id!==o.nome);
 state.snapshot.semVinculo=state.snapshot.semVinculo.filter(op=>op.id!==o.nome);continue;
 }
 if(companyId(o.idEmpresa)!==null)delete state.excludedOps?.[o.nome];
 if(Number.isInteger(o.idProduto))state.products[o.idProduto]={name:String(o.descricaoProduto??""),unit:String(o.unidadeMedida??"")};
 const links=[...new Map((o.itensPedido??[]).filter(i=>Number.isInteger(i.idPedido)).map(i=>[i.idPedido,{orderId:i.idPedido,client:String(i.nomeCliente??"")}])).values()];
 for(const l of links){state.seenLinks[l.orderId]=true;const cid=state.orders[l.orderId]?.clientId;if(cid&&l.client)state.clients[cid]=l.client;}
 const tracked=isCancelledOP(o)||known.has(o.nome)||!["Encerrada","Cancelada"].includes(o.status)||links.some(l=>state.orders[l.orderId]?.active);
 if(!tracked)continue;
 if(Number.isSafeInteger(o.id)&&o.id>0){state.productionIds??={};state.productionIds[o.nome]=o.id}
 state.opLotSources??={};state.opLotSources[o.nome]={product:o.idProduto,company:o.nomeEmpresa};
 const op={id:o.nome,nome:o.nome,situacaoNomus:String(o.status??state.ops[o.nome]?.facts?.situacao?.value??""),companyId:companyId(o.idEmpresa),produto:String(o.descricaoProduto??""),quantidade:String(o.qtde??""),unidade:String(o.unidadeMedida??""),criacao:creationDate(o.dataHoraCriacao)};
 state.pendingOps[o.nome]={op,links,hash:await hash(o),facts:opFacts(o,state.orders)};
 }
 state.cycleCount+=result.length;
 if(result.length<50){state.pages.ops=1;state.opsComplete=true;state.lastCycle=now;state.snapshot.ordensConsultadas=state.cycleCount;state.cycleCount=0}else state.pages.ops++;
 }else if(path.startsWith("clientes/")){
 if(typeof result.nome!=="string")throw Error("Cliente sem nome.");state.clients[path.split("/")[1]]=result.nome;
 }else if(path.startsWith("produtos/")){
 state.products[path.split("/")[1]]={name:String(result.descricao??result.nome??""),unit:String(result.siglaUnidadeMedida??"")};
 }
 attachPending();
 for(const [id,o] of Object.entries(state.orders)){
 const g=groups.get(o.code);if(!g)continue;
 ensureGroup(o);
 if(g.ordens.length)g.vinculo="linked";
 else g.vinculo=state.opsComplete&&!state.seenLinks[id]?"none":"unknown";
 }
 state.snapshot.grupos=[...groups.values()];state.snapshot.consultadoEm=now.slice(0,10);state.lastChecked=now;
 state.turn++;state.partial=!state.opsComplete||!state.ordersComplete;
 state.message=state.partial?"Leitura por páginas em andamento; vínculos ainda podem estar incompletos.":"Consulta periódica em andamento.";
 delete state.retryAt;
 state.nextAt=stamp+22000;
 }catch(e){
 if(kind==="orders"){delete state.orderScan;state.pages.orders=1;state.ordersComplete=false}
 if(path.startsWith("pedidos/"))observeOrderFailure(state,path.split("/")[1],e?.status,now);
 if(path.startsWith("pedidos/")&&state.orders[path.split("/")[1]]){state.orderReviewFailures??={};state.orderReviewFailures[path.split("/")[1]]={at:now,status:e?.status,reason:"detail_failed"}}
 if(kind==="recent")state.recentOrdersNextAt=stamp+300000;
 if(companyReview&&path==="pedidos/"+companyReview){state.companyRetryAt??={};state.companyRetryAt[companyReview]=stamp+3600000}
 state.partial=true;state.message=e?.status===400?"O Nomus recusou uma página. Cobertura parcial; dados anteriores preservados.":e?.status===401||e?.status===403?"Acesso ao Nomus não autorizado. Verifique a chave no servidor.":"Consulta temporariamente indisponível. Dados anteriores preservados.";
 if(e?.status===400&&kind!=="detail"){state.pages[kind]=1;if(kind==="ops"){state.opsComplete=false;state.cycleCount=0}else if(kind==="orders")state.ordersComplete=false}
 state.turn++;state.nextAt=stamp+Math.max(60000,e?.retryAfterMs??0);state.retryAt=state.nextAt;
 }
 return applyCompanyScope(state);
}
