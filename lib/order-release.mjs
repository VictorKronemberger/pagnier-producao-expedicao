// Nomus Pedido API: 1 awaiting release; 2 released; 3 partially fulfilled.
// https://atendimento.nomus.com.br/hc/pt-br/articles/35195264156187-Pedido
export const releaseLabels={waiting:"Aguardando liberação",partial:"Liberação parcial",released:"Liberado",closed:"Atendido / encerrado",unknown:"Consultando liberação"};
export function releaseState(items){
 const states=(items??[]).map(i=>Number(i.status));
 if(!states.length)return "unknown";
 const waiting=states.includes(1),released=states.some(s=>s===2||s===3);
 if(waiting)return released?"partial":"waiting";
 if(states.some(s=>!Number.isInteger(s)||s<1||s>8))return "unknown";
 return released?"released":"closed";
}
export function canQueue(order){return order.liberacao===undefined||["released","partial"].includes(order.liberacao)}
export function hasStarted(detail){return !!detail?.atendimentoEstoque||["Em acompanhamento","Bloqueado","Concluído","Pronto para envio e documentação","Atendido totalmente e enviado"].includes(detail?.situacao)}
export function awaitsRelease(order,detail){return !hasStarted(detail)&&(order.liberacao==="waiting"||order.liberacao==="partial"&&!order.ordens?.length)}
export function pendingReleaseItems(order){return (order.itens??[]).filter(i=>Number(i.status)===1)}
export function assertReleaseTransitions(previous,next,groups){
 for(const g of groups){
 const before=previous.details?.[g.id],after=next.details?.[g.id];
 if(!next.sequence?.includes(g.id)||hasStarted(before)||canQueue(g))continue;
 if(!previous.sequence?.includes(g.id)||after?.situacao!==before?.situacao)throw Error(g.codigo+": aguarde a liberação no Nomus antes de colocar em produção.");
 }
}
