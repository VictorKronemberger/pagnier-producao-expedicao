// Dates and identities come from GET lotesSerie, never from the OP creation date.
export function lotDate(value){
 const m=String(value??"").match(/^(\d{2})\/(\d{2})\/(\d{4}|\d{2})(?:\s|$)/);if(!m)return "";
 const year=m[3].length===2?"20"+m[3]:m[3],iso=year+"-"+m[2]+"-"+m[1];
 const d=new Date(iso+"T12:00:00Z");return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===iso?iso:"";
}
export function lotPath(name,page=1){
 if(typeof name!=="string"||name.length>100||!/^OP[0-9]+$/.test(name))return "";
 return "lotesSerie?pagina="+page+"&query="+encodeURIComponent('loteSerie=="'+name+'"');
}
export function requestedLotNames(board){
 return [...new Set(Object.values(board?.details??{}).flatMap(d=>[...(d.envio?.caixas??[]),...(d.envio?.caixasEmMontagem??[])].flatMap(b=>(b.itens??[]).map(i=>i.opId))).filter(n=>lotPath(n)))];
}
export function lotRows(rows,name){
 return rows.filter(r=>r.loteSerie===name&&Number.isInteger(r.idProduto)).map(r=>({product:r.idProduto,description:String(r.descricaoProduto??""),company:String(r.nomeEmpresa??""),expiry:lotDate(r.dataHoraValidade)}));
}
export function withLotDates(snapshot,state){
 const update=op=>{
  const source=state.opLotSources?.[op.id];
  const cache=state.lots?.[op.nome];
  const rows=(cache?.page>1?[]:cache?.rows??[]).filter(r=>r.company===(source?.company||"PAGNIER COMERCIO LTDA")&&(source?.product?r.product===source.product:r.description===op.produto));
  const dates=new Set(rows.map(r=>r.expiry)),products=new Set(rows.map(r=>r.product));
  const validity=products.size===1&&dates.size===1?[...dates][0]:"";
  return {...op,validadeLote:validity};
 };
 return {...snapshot,grupos:snapshot.grupos.map(g=>({...g,ordens:g.ordens.map(update)})),semVinculo:snapshot.semVinculo.map(update)};
}
