import {canonicalShipping} from "./shipping.mjs";
import {inspectPacking} from "./packing-list.mjs";
// Change detector, not an authorization signature. Only physical data participates.
export function boxReviewKey(value,ops){
 const s=canonicalShipping(value);
 const boxes=s.caixas.map(({id,codigo,embalagem,lacre,comprimentoCm,larguraCm,alturaCm,pesoBrutoKg,pesoLiquidoKg,pesoMaximoKg,taraKg,caixasInternas,itens})=>({id,codigo,embalagem,lacre,comprimentoCm,larguraCm,alturaCm,pesoBrutoKg,pesoLiquidoKg,...(caixasInternas?.length?{caixasInternas}:{}),...(pesoMaximoKg||taraKg?{pesoMaximoKg,taraKg}:{}),itens:itens.map(({caixaInternaId,id,opId,produto,unidade,quantidade,unidadesEmbaladas,pesoUnitarioKg,conteudoPorEmbalagem,lote,validade})=>({... (caixaInternaId?{caixaInternaId}:{}),id,opId,produto,unidade,quantidade,unidadesEmbaladas,pesoUnitarioKg,conteudoPorEmbalagem,lote,validade}))}));
 const source=JSON.stringify({boxes,...(s.caixasEmMontagem?.length?{caixasEmMontagem:s.caixasEmMontagem}:{}),ops:ops.map(({id,produto,unidade,quantidade})=>({id,produto,unidade,quantidade})).sort((a,b)=>a.id.localeCompare(b.id))});
 let hash=14695981039346656037n;
 for(let i=0;i<source.length;i++){hash^=BigInt(source.charCodeAt(i));hash=BigInt.asUintN(64,hash*1099511628211n)}
 return "v1-"+hash.toString(16);
}
export function inspectBoxReview(value,ops){
 const report=inspectPacking(value,ops,{physicalOnly:true});
 const pending=value?.caixas?.filter(b=>b.montada===false).length??0;
 if(pending)report.issues.unshift("Finalize as "+pending+" Caixa(s) 40 em montagem antes da conferência.");
 const reviewed=!!value?.conferenciaPor?.trim()&&!!value?.conferenciaEm&&value.conferenciaBase===boxReviewKey(value,ops)&&report.issues.length===0;
 return {reviewed,issues:report.issues,changed:!!value?.conferenciaBase&&!reviewed,report};
}
export function confirmBoxReview(value,ops,person,at){
 const state=inspectBoxReview(value,ops);
 if(state.issues.length)throw Error(state.issues[0]);
 if(!person?.trim())throw Error("Escolha o responsável pela conferência.");
 return {...value,conferenciaPor:person.trim(),conferenciaEm:at,conferenciaBase:boxReviewKey(value,ops)};
}
