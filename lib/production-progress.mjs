import {quantityNumber} from "./production-quantity.mjs";
export function productionProgress(op){
 const produced=quantityNumber(op.quantidadeProduzida),target=quantityNumber(op.quantidade);
 if(produced===null)return {state:"unknown",label:op.producaoConsultadaEm?"Sem confirmação":"Consultando Nomus",remaining:null,percent:null};
 if(produced===0)return {state:"pending",label:"Produção pendente",remaining:target,percent:target&&target>0?0:null};
 if(target===null||target<=0)return {state:"review",label:"Meta a confirmar",remaining:null,percent:null};
 return {state:produced>=target?"complete":"partial",label:produced>=target?"Produção concluída":"Produção parcial",remaining:Math.max(0,target-produced),percent:Math.min(100,Math.round(produced/target*100))};
}
