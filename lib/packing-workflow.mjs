import {inspectPacking} from "./packing-list.mjs";
import {inspectBoxReview} from "./box-review.mjs";
export const PACKING_STEPS=[{id:"orders",title:"Pedidos e destinatário"},{id:"boxes",title:"Itens e caixas"},{id:"document",title:"Dados do documento"},{id:"review",title:"Revisar e baixar"}];
export function packingWorkflow(shipment,ops){
 const physical=inspectBoxReview(shipment,ops),report=inspectPacking(shipment,ops),p=shipment?.packing??{};
 const recipientIssues=[['destinatarioNome','Nome do destinatário'],['destinatarioEndereco','Endereço de entrega'],['paisDestino','País de destino']].filter(([key])=>!p[key]?.trim()).map(([,label])=>label);
 const physicalIssues=new Set(physical.issues);
 const itemIssues=report.issues.filter(issue=>!issue.startsWith('Packing list:')&&!physicalIssues.has(issue));
 const documentIssues=report.issues.filter(issue=>issue.startsWith('Packing list:'));
 const ready=physical.reviewed&&report.issues.length===0&&!shipment?.packingExcluido;
 const next=!recipientIssues.length?(!physical.reviewed||itemIssues.length?'boxes':documentIssues.length?'document':'review'):'orders';
 const states={orders:{done:!recipientIssues.length,count:recipientIssues.length},boxes:{done:physical.reviewed&&!itemIssues.length,count:physical.reviewed?itemIssues.length:Math.max(1,physical.issues.length)},document:{done:!documentIssues.length,count:documentIssues.length},review:{done:false,count:0}};
 const action=next==='orders'?'Confirmar destinatário':next==='boxes'?(physical.reviewed?'Completar dados dos itens':'Conferir caixas na expedição'):next==='document'?'Completar dados do documento':'Revisar e baixar PDF ou Excel';
 return {physical,report,recipientIssues,itemIssues,documentIssues,ready,next,states,action};
}
