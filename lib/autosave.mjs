import {normalizeBoxModels} from "./box-models.mjs";
import {canonicalInvoices} from "./invoice.mjs";
import {canonicalShipping} from "./shipping.mjs";
export function canonical(board) {
 const details=Object.fromEntries(Object.entries(board.details).sort(([a],[b])=>a.localeCompare(b)).map(([id,d])=>[id,{
 responsavel:d.responsavel.trim(),responsavelConferencia:(d.responsavelConferencia??"").trim(),nota:d.nota.trim(),situacao:d.situacao,
 atendimentoEstoque:d.atendimentoEstoque===true,empresa:d.empresa??"",etiqueta:d.etiqueta??"",conferidas:[...(d.conferidas??[])].sort(),expedicao:[...(d.expedicao??[])].sort(),vistoNomus:d.vistoNomus??"",envio:canonicalShipping(d.envio)
 }]));
 return JSON.stringify({sequence:board.sequence,details,boxModels:normalizeBoxModels(board.boxModels),invoices:canonicalInvoices(board.invoices)});
}
export function createAutosave({write,read,onState,onSaved,delay=650}) {
 let current,baseline,revision=0,timer,inflight=false,paused=false,lastSent,disposed=false;
 const dirty=()=>!!current&&canonical(current)!==canonical(baseline);
 const emit=(status,error="")=>{if(!disposed)onState({status,dirty:dirty(),error})};
 function schedule(){clearTimeout(timer);if(disposed||paused||inflight)return;if(!dirty()){emit("saved");return}emit("pending");timer=setTimeout(flush,delay)}
 async function flush(){
 clearTimeout(timer);if(disposed||paused||inflight||!dirty())return;
 inflight=true;lastSent=current;emit("saving");
 try{const result=await write(lastSent,revision);baseline=lastSent;revision=result.revision;if(!disposed)onSaved(result);inflight=false;schedule()}
 catch(e){inflight=false;paused=true;emit("error",e instanceof Error?e.message:"Falha ao salvar.")}
 }
 return {
 reset(board,rev){clearTimeout(timer);current=baseline=board;revision=rev;paused=false;disposed=false;emit("saved")},
 enqueue(board){current=board;if(paused)emit("error","Salvamento pausado. Verifique a conexão ou o conflito antes de continuar.");else schedule()},
 flush,
 async retry(){
 if(inflight)return;inflight=true;emit("saving");
 try{const remote=await read();const key=canonical(remote.board);
 if(key!==canonical(baseline)&&(!lastSent||key!==canonical(lastSent)))throw Error("Outra sessão alterou o quadro. Suas edições continuam na tela. Recarregue para usar a versão compartilhada.");
 baseline=remote.board;revision=remote.revision;paused=false;if(!disposed)onSaved(remote);inflight=false;schedule()
 }catch(e){inflight=false;paused=true;emit("error",e instanceof Error?e.message:"Falha na conexão.")}
 },
 pause(){clearTimeout(timer);paused=true},
 dispose(){clearTimeout(timer);disposed=true},
 isDirty:dirty
 };
}
