import {quantityNumber} from "./production-quantity.mjs";
export function productionProgress(op){
 const produced=quantityNumber(op.quantidadeProduzida),target=quantityNumber(op.quantidade);
 if(produced===null)return {state:"unknown",label:op.producaoConsultadaEm?"Sem confirmação":"Consultando Nomus",remaining:null,percent:null};
 if(produced===0)return {state:"pending",label:"Produção pendente",remaining:target,percent:target&&target>0?0:null};
 if(target===null||target<=0)return {state:"review",label:"Meta a confirmar",remaining:null,percent:null};
 return {state:produced>=target?"complete":"partial",label:produced>=target?"Produção concluída":"Produção parcial",remaining:Math.max(0,target-produced),percent:Math.min(100,Math.round(produced/target*100))};
}

export function productionSummary(ops){
 const states=ops.map(op=>productionProgress(op).state),total=states.length;
 const complete=states.filter(s=>s==="complete").length,unconfirmed=states.filter(s=>s==="unknown"||s==="review").length;
 return {total,complete,unconfirmed,state:total>0&&complete===total?"complete":unconfirmed===total?"unknown":"incomplete"};
}
