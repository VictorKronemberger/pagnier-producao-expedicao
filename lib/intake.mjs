import {autoResaleShipping} from "./stock-orders.mjs";
import {canQueue,hasStarted} from "./order-release.mjs";
export function receiveOrders(board,groups){
 const next={...board,sequence:[...board.sequence],details:{...board.details}};let changed=false;
 for(const g of groups){
 if(board.details[g.id]?.arquivado||board.details[g.id]?.atendimentoEstoque)continue;
 if(!hasStarted(board.details[g.id])&&autoResaleShipping(g)){
 if(!next.sequence.includes(g.id))next.sequence.push(g.id);
 next.details[g.id]={responsavel:"",nota:"",etiqueta:"",conferidas:[],vistoNomus:"",...next.details[g.id],atendimentoEstoque:true,situacao:"Conclu\u00eddo"};changed=true;
 continue;
 }
 if(!canQueue(g)&&!hasStarted(board.details[g.id])){
 if(g.liberacao!=="unknown"&&next.sequence.includes(g.id)){next.sequence=next.sequence.filter(id=>id!==g.id);next.details[g.id]={...next.details[g.id],situacao:"A programar"};changed=true;}
 continue;
 }
 if(!g.ordens.length){
 if(g.vinculo==="none"&&!hasStarted(board.details[g.id])&&next.sequence.includes(g.id)){
 next.sequence=next.sequence.filter(id=>id!==g.id);
 next.details[g.id]={...next.details[g.id],situacao:"A programar"};changed=true;
 }
 continue;
 }
 if(next.sequence.includes(g.id))continue;
 next.sequence.push(g.id);next.details[g.id]={responsavel:"",nota:"",etiqueta:"",conferidas:[],vistoNomus:"",...next.details[g.id],situacao:"Programado"};changed=true;
 }
 return changed?next:board;
}
