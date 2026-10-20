import {normalizeBoxModels} from "./box-models.mjs";
import {canonicalInvoices} from "./invoice.mjs";
import {canonicalShipping} from "./shipping.mjs";
export function canonical(board) {
 const details=Object.fromEntries(Object.entries(board.details).sort(([a],[b])=>a.localeCompare(b)).map(([id,d])=>[id,{
 responsavel:d.responsavel.trim(),responsavelConferencia:(d.responsavelConferencia??"").trim(),nota:d.nota.trim(),situacao:d.situacao,
 arquivado:d.arquivado===true,atendimentoEstoque:d.atendimentoEstoque===true,empresa:d.empresa??"",etiqueta:d.etiqueta??"",conferidas:[...(d.conferidas??[])].sort(),expedicao:[...(d.expedicao??[])].sort(),vistoNomus:d.vistoNomus??"",envio:canonicalShipping(d.envio)
 }]));
 return JSON.stringify({sequence:board.sequence,details,boxModels:normalizeBoxModels(board.boxModels),invoices:canonicalInvoices(board.invoices)});
}
// Merge independent records only. A shipment and its order remain one unit:
// an old editor must never restore a remotely deleted document.
export function mergeBoards(base,local,remote){
 const [b,l,r]=[base,local,remote].map(value=>JSON.parse(canonical(value)));
 const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 const conflicts=[];
 function choose(key,bv,lv,rv,localValue,remoteValue){
  if(same(lv,bv)||same(lv,rv))return remoteValue;
  if(same(rv,bv))return localValue;
  conflicts.push(key);return localValue;
 }
 function records(key){
  const result={};
  for(const id of new Set([...Object.keys(b[key]??{}),...Object.keys(l[key]??{}),...Object.keys(r[key]??{})])){
   const value=choose(key+":"+id,b[key]?.[id],l[key]?.[id],r[key]?.[id],local[key]?.[id],remote[key]?.[id]);
   if(value!==undefined)result[id]=value;
  }
  return result;
 }
 const board={...remote,sequence:choose("sequence",b.sequence,l.sequence,r.sequence,local.sequence,remote.sequence),details:records("details"),invoices:records("invoices"),boxModels:choose("boxModels",b.boxModels,l.boxModels,r.boxModels,local.boxModels,remote.boxModels)};
 return {board,conflicts};
}
export function createAutosave({write,read,onState,onSaved,onRemote=()=>{},delay=650}) {
 let current,baseline,revision=0,timer,inflight=false,paused=false,lastSent,disposed=false,epoch=0;
 const dirty=()=>!!current&&canonical(current)!==canonical(baseline);
 const emit=(status,error="")=>{if(!disposed)onState({status,dirty:dirty(),error})};
 function schedule(){clearTimeout(timer);if(disposed||paused||inflight)return;if(!dirty()){emit("saved");return}emit("pending");timer=setTimeout(flush,delay)}
 function receive(remote){
  if(disposed||inflight||!baseline||remote.revision<=revision||!remote.board)return false;
  const base=lastSent&&canonical(remote.board)===canonical(lastSent)?lastSent:baseline;
  const merged=mergeBoards(base,current,remote.board);
  if(merged.conflicts.length){clearTimeout(timer);paused=true;emit("error","Outra pessoa alterou o mesmo pedido, documento ou fila. Suas edições continuam nesta tela e não foram sobrescritas. Copie o que deseja manter e use Recarregar para conferir a versão da equipe.");return false}
  baseline=remote.board;current=merged.board;revision=remote.revision;lastSent=undefined;paused=false;
  onRemote(current,remote);onSaved(remote);schedule();return true;
 }
 async function flush(){
  clearTimeout(timer);if(disposed||paused||inflight||!dirty())return;
  const token=epoch;inflight=true;lastSent=current;emit("saving");
  try{const result=await write(lastSent,revision);if(disposed||token!==epoch)return;baseline=lastSent;revision=result.revision;lastSent=undefined;onSaved(result);inflight=false;schedule()}
  catch(e){if(disposed||token!==epoch)return;inflight=false;paused=true;emit("error",e instanceof Error?e.message:"Falha ao salvar.")}
 }
 return {
  reset(board,rev){epoch++;clearTimeout(timer);current=baseline=board;revision=rev;paused=false;inflight=false;lastSent=undefined;disposed=false;emit("saved")},
  enqueue(board){current=board;if(paused)emit("error","Salvamento pausado. Suas edições continuam nesta tela. Confira o conflito ou a conexão antes de continuar.");else schedule()},
  receive,getRevision:()=>revision,flush,
  async retry(){
   if(inflight||disposed)return;const token=epoch;inflight=true;emit("saving");
   try{const remote=await read();if(disposed||token!==epoch)return;const key=canonical(remote.board);
    if(key!==canonical(baseline)&&(!lastSent||key!==canonical(lastSent)))throw Error("Outra sessão alterou o quadro. Suas edições continuam na tela. Recarregue para usar a versão compartilhada.");
    baseline=remote.board;revision=remote.revision;paused=false;lastSent=undefined;onSaved(remote);inflight=false;schedule();
   }catch(e){if(disposed||token!==epoch)return;inflight=false;paused=true;emit("error",e instanceof Error?e.message:"Falha na conexão.")}
  },
  pause(){clearTimeout(timer);paused=true},
  dispose(){clearTimeout(timer);disposed=true;epoch++},
  isDirty:dirty
 };
}
