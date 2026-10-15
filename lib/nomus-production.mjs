import {quantityNumber} from "./production-quantity.mjs";
const validName=n=>typeof n==="string"&&/^OP[0-9]{1,12}$/.test(n);
export function productionPath(kind,values,page=1){
 if(!Number.isInteger(page)||page<1||page>20||!values.length||values.length>20)return "";
 if(kind==="ids"&&values.every(validName))return "ordens?pagina="+page+"&query="+encodeURIComponent(values.map(n=>'nome=="'+n+'"').join(","));
 if(kind==="operations"&&values.every(n=>Number.isSafeInteger(n)&&n>0))return "operacoesRoteiroOrdem?pagina="+page+"&query="+encodeURIComponent(values.map(n=>"idOrdem=="+n).join(","));
 return "";
}
export function allowedProductionPath(path){
 const m=path.match(/^(ordens|operacoesRoteiroOrdem)\?pagina=(\d+)&query=(.+)$/);if(!m)return false;
 try{const kind=m[1]==="ordens"?"ids":"operations",terms=decodeURIComponent(m[3]).split(",");
 const values=terms.map(t=>kind==="ids"?t.match(/^nome=="(OP[0-9]{1,12})"$/)?.[1]:/^idOrdem==[1-9][0-9]*$/.test(t)?Number(t.slice(9)):NaN);
 return productionPath(kind,values,Number(m[2]))===path;
 }catch{return false}
}
export function productionRequest(state,requested,stamp){
 const batch=state.productionBatch;
 if(batch)return {kind:"operations",names:batch.names,ids:batch.ids,page:batch.page,path:productionPath("operations",batch.ids,batch.page)};
 const known=new Map([...state.snapshot.grupos.flatMap(g=>g.ordens),...state.snapshot.semVinculo].map(o=>[o.nome,o]));
 const names=[...new Set(requested)].filter(n=>validName(n)&&known.has(n)&&!known.get(n).estoque&&stamp>=(state.production?.[n]?.nextAt??0)).slice(0,20);
 if(!names.length)return null;
 const ids=names.map(n=>state.productionIds?.[n]);
 return ids.every(n=>Number.isSafeInteger(n)&&n>0)?{kind:"operations",names,ids,page:1,path:productionPath("operations",ids)}:{kind:"ids",names,path:productionPath("ids",names)};
}
export function finalOperationQuantity(rows){
 if(!rows.length||rows.some(r=>!Number.isFinite(Number(r.operacao))||Number(r.operacao)<=0))return {quantity:null,operation:""};
 const last=Math.max(...rows.map(r=>Number(r.operacao))),finals=rows.filter(r=>Number(r.operacao)===last);
 if(finals.length!==1||finals[0].habilitarApontamentoUNSecundarias===true||quantityNumber(finals[0].qtdeProduzida)===null)return {quantity:null,operation:""};
 return {quantity:String(finals[0].qtdeProduzida),operation:String(finals[0].descricao??"")};
}
export function acceptProduction(state,request,rows,now){
 if(!Array.isArray(rows))throw Error("Formato de produção inesperado.");
 const stamp=Date.parse(now);state.production??={};state.productionIds??={};
 const record=(name,value)=>{state.production[name]={...value,checkedAt:now,nextAt:stamp+300000}};
 if(request.kind==="ids"){
  if(rows.length>=50)throw Error("Identificação de OP incompleta.");
  const pairs=[];
  for(const name of request.names){const found=rows.filter(r=>r.nome===name&&Number(r.idEmpresa)===1&&Number.isSafeInteger(r.id)&&r.id>0);
   if(found.length===1){state.productionIds[name]=found[0].id;pairs.push([name,found[0].id])}else record(name,{quantity:null,operation:"",reason:"OP não localizada na consulta"});
  }
  if(pairs.length)state.productionBatch={names:pairs.map(p=>p[0]),ids:pairs.map(p=>p[1]),page:1,rows:[]};
  return;
 }
 const batch=state.productionBatch??{names:request.names,ids:request.ids,page:1,rows:[]};
 const current=rows.filter(r=>request.ids.includes(r.idOrdem)&&request.names[request.ids.indexOf(r.idOrdem)]===r.nomeOrdem).map(r=>({id:r.id,idOrdem:r.idOrdem,nomeOrdem:r.nomeOrdem,operacao:r.operacao,qtdeProduzida:r.qtdeProduzida,descricao:r.descricao,habilitarApontamentoUNSecundarias:r.habilitarApontamentoUNSecundarias}));
 batch.rows=[...new Map([...batch.rows,...current].map(r=>[r.id,r])).values()];
 if(rows.length>=50){if(request.page>=20)throw Error("Roteiro de produção incompleto.");state.productionBatch={...batch,page:request.page+1};return}
 for(const name of request.names)record(name,finalOperationQuantity(batch.rows.filter(r=>r.nomeOrdem===name)));
 delete state.productionBatch;
}
export function withProductionQuantities(snapshot,state){
 const update=o=>{const cached=state.production?.[o.nome];return {...o,quantidadeProduzida:cached?.quantity??null,producaoConsultadaEm:cached?.checkedAt??"",operacaoProducao:cached?.operation??"",motivoProducao:cached?.reason??""}};
 return {...snapshot,grupos:snapshot.grupos.map(g=>({...g,ordens:g.ordens.map(update)})),semVinculo:snapshot.semVinculo.map(update)};
}
