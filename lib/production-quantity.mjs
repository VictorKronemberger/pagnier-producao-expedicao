export function quantityNumber(value){
 const text=String(value??"").trim();
 if(!/^\d+(?:[.,]\d{1,6})?$/.test(text))return null;
 const n=Number(text.replace(",","."));return Number.isFinite(n)&&n<=1e12?n:null;
}
export function quantityDifference(op){
 const programmed=quantityNumber(op.quantidadeProgramada),current=quantityNumber(op.quantidade);
 const difference=programmed===null||current===null?null:Math.round((programmed-current)*1e6)/1e6;
 return {programmed,current,difference,reduced:difference!==null&&difference>0,increased:difference!==null&&difference<0,changed:difference!==null&&difference!==0};
}
export function trackOPQuantity(previous,incoming,at,events=[]){
 const oldValue=previous?.quantidade??previous?.facts?.quantidade?.value;
 let baseline=previous?.quantidadeProgramada;
 if(quantityNumber(baseline)===null){
 const earliest=[...events].filter(e=>e.entity==="OP "+incoming.id).sort((a,b)=>a.at.localeCompare(b.at)).flatMap(e=>e.fields.filter(f=>f.label==="Quantidade")).find(f=>quantityNumber(f.before)!==null||quantityNumber(f.after)!==null);
 baseline=earliest?(quantityNumber(earliest.before)!==null?earliest.before:earliest.after):quantityNumber(oldValue)!==null?oldValue:incoming.quantidade;
 }
 const lastKnown=[...events].filter(e=>e.entity==="OP "+incoming.id).sort((a,b)=>b.at.localeCompare(a.at)).flatMap(e=>e.fields.filter(f=>f.label==="Quantidade").map(f=>({...f,at:e.at}))).find(f=>quantityNumber(f.before)!==null&&quantityNumber(f.after)===quantityNumber(incoming.quantidade)&&quantityNumber(f.before)!==quantityNumber(f.after));
 const changed=quantityNumber(oldValue)!==null&&quantityNumber(incoming.quantidade)!==null&&quantityNumber(oldValue)!==quantityNumber(incoming.quantidade);
 return {...incoming,...(quantityNumber(baseline)!==null?{quantidadeProgramada:String(baseline)}:{}),
 ...(changed?{quantidadeAnterior:String(oldValue),quantidadeAlteradaEm:at}:previous?.quantidadeAlteradaEm?{quantidadeAnterior:previous.quantidadeAnterior,quantidadeAlteradaEm:previous.quantidadeAlteradaEm}:lastKnown?{quantidadeAnterior:lastKnown.before,quantidadeAlteradaEm:lastKnown.at}:{})};
}
export const quantityText=n=>n===null?"A confirmar":n.toLocaleString("pt-BR",{maximumFractionDigits:6});

export function prepareQuantityState(state){
 const events=Object.values(state.changes??{}).flatMap(c=>c.events??[]);
 const unique=[...new Map(events.map(e=>[e.at+e.entity+e.summary,e])).values()];
 for(const op of [...state.snapshot.grupos.flatMap(g=>g.ordens),...state.snapshot.semVinculo]){
 const tracked=trackOPQuantity({...op,...state.ops?.[op.id]},op,state.lastChecked??"",unique);
 Object.assign(op,tracked);
 if(state.ops?.[op.id])Object.assign(state.ops[op.id],{quantidadeProgramada:tracked.quantidadeProgramada,quantidadeAnterior:tracked.quantidadeAnterior,quantidadeAlteradaEm:tracked.quantidadeAlteradaEm});
 }
 return state;
}
