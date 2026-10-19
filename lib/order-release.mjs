// Nomus Pedido API: 1 awaiting release; 2 released; 3 partially fulfilled.
// https://atendimento.nomus.com.br/hc/pt-br/articles/35195264156187-Pedido
export const releaseLabels={waiting:"Aguardando liberação",partial:"Liberação parcial",released:"Liberado",closed:"Atendido / encerrado",unknown:"Consultando liberação"};
export function releaseState(items){
 const states=(items??[]).map(i=>Number(i.status));
 if(!states.length)return "unknown";
 const waiting=states.includes(1),released=states.some(s=>s===2||s===3);
 if(waiting)return released||states.some(s=>s===4||s===5)?"partial":"waiting";
 if(states.some(s=>!Number.isInteger(s)||s<1||s>8))return "unknown";
 return released?"released":"closed";
}
export function canQueue(order){return order.liberacao===undefined||["released","partial"].includes(order.liberacao)}
export function hasStarted(detail){return !!detail?.atendimentoEstoque||["Em acompanhamento","Bloqueado","Concluído","Pronto para envio e documentação","Pronto para envio","Atendido totalmente e enviado"].includes(detail?.situacao)}
export function awaitsRelease(order,detail){return !hasStarted(detail)&&(order.liberacao==="waiting"||order.liberacao==="partial"&&!order.ordens?.length)}
export function pendingReleaseItems(order){return (order.itens??[]).filter(i=>Number(i.status)===1)}
export function assertReleaseTransitions(previous,next,groups){
 for(const g of groups){
 const before=previous.details?.[g.id],after=next.details?.[g.id];
 if(!next.sequence?.includes(g.id)||hasStarted(before)||canQueue(g))continue;
 if(!previous.sequence?.includes(g.id)||after?.situacao!==before?.situacao)throw Error(g.codigo+": aguarde a liberação no Nomus antes de colocar em produção.");
 }
}

// Recover only legacy entries whose saved ERP facts still match every item.
export function restoreReleaseItems(order,products={}){
 const items=order.items??[];if(!items.length||items.every(i=>i.status!==undefined))return items;
 const sources=[order.listFacts,order.detailFacts].filter(Boolean);if(!sources.length)return items;
 const candidates=sources.map(facts=>{
 const entries=Object.entries(facts).filter(([key])=>key.endsWith(":situacao"));
 if(entries.length!==items.length)return null;
 const statuses=[];
 for(let index=0;index<items.length;index++){
 const [key,fact]=entries[index],prefix=key.slice(0,-9),item=items[index],status=Number(fact.value);
 if(!Number.isInteger(status)||status<1||status>8||String(facts[prefix+":quantidade"]?.value)!==String(item.quantity))return null;
 const product=facts[prefix+":produto"]?.value;
 if(product!=="Produto #"+item.productId&&product!==products[item.productId]?.name)return null;
 if(item.status!==undefined&&Number(item.status)!==status)return null;
 statuses.push(status);
 }
 return statuses;
 });
 if(candidates.some(v=>!v)||candidates.some(v=>JSON.stringify(v)!==JSON.stringify(candidates[0])))return items;
 return items.map((item,i)=>item.status===undefined?{...item,status:candidates[0][i]}:item);
}
export function pendingFulfillmentItems(order){
 const items=order.itens??[];
 return items.some(i=>[3,4,5].includes(Number(i.status)))?items.filter(i=>[1,2,3].includes(Number(i.status))):[];
}
