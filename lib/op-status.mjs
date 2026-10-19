// Only an explicit ERP status confirms cancellation. Missing links/status do not.
export function isCancelledOP(op){return String(op?.situacaoNomus??op?.status??"").trim().toLocaleLowerCase("pt-BR")==="cancelada";}
export function withOPStatus(state){
 const enrich=op=>({...op,situacaoNomus:String(op.situacaoNomus??state.ops?.[op.id]?.facts?.situacao?.value??"").trim()});
 return {...state.snapshot,grupos:state.snapshot.grupos.map(g=>({...g,ordens:g.ordens.map(enrich)})),semVinculo:state.snapshot.semVinculo.map(enrich)};
}
export function cancelledProduction(snapshot){
 const result=new Map();
 for(const op of snapshot?.semVinculo??[])if(isCancelledOP(op))result.set(op.id,{...op,pedidos:[]});
 for(const group of snapshot?.grupos??[])for(const op of group.ordens??[])if(isCancelledOP(op)){
 const entry=result.get(op.id)??{...op,pedidos:[]};
 if(!entry.pedidos.includes(group.codigo))entry.pedidos.push(group.codigo);result.set(op.id,entry);
 }
 return [...result.values()].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{numeric:true}));
}
