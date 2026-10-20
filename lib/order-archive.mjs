import {orderIdentity} from "./nomus-order-presence.mjs";
export const archiveReasons={manual:"Retirado da fila",nomus_deleted:"Excluído no Nomus",nomus_missing:"Não localizado no Nomus"};
export function archiveOrders(snapshot,board){
 const orders=new Map([...(snapshot?.pedidos??[]),...(snapshot?.grupos??[])].map(order=>[order.id,order]));
 return Object.entries(board.details??{}).filter(([,d])=>d.arquivado).map(([id,d])=>({...(orders.get(id)??{id,codigo:id,cliente:d.arquivo?.cliente??"",ordens:[]}),arquivo:d.arquivo}));
}
export function changeArchive(board,order,{archived,reason="manual",note="",confirmedDeleted=false},actor,now){
 if(typeof archived!=="boolean"||!["manual","nomus_deleted"].includes(reason)||typeof note!=="string"||note.length>500)throw Error("Revise o motivo e a observação do arquivamento.");
 if(archived&&reason==="nomus_deleted"&&confirmedDeleted!==true)throw Error("Confirme que a exclusão foi conferida no Nomus.");
 const previous=board.details[order.id]??{responsavel:"",nota:"",situacao:"A programar"};
 if(!!previous.arquivado===archived)throw Error(archived?"Este pedido já está arquivado.":"Este pedido já está ativo.");
 const arquivo=archived?{motivo:reason,observacao:note.trim(),em:now,por:actor,cliente:order.cliente??""}:{...previous.arquivo,restauradoEm:now,restauradoPor:actor};
 return {...board,details:{...board.details,[order.id]:{...previous,arquivado:archived,arquivo}}};
}

// Called only on the server with trusted sync evidence, never client input.
export function archiveMissingOrders(board,state,now){
 let next=board;
 const identities=new Map();
 for(const [id,o] of Object.entries(state.orders??{})){
  const identity=orderIdentity(o.code);identities.set(identity,[...(identities.get(identity)??[]),id]);
 }
 for(const [nomusId,evidence] of Object.entries(state.orderAbsences??{})){
  const order=state.orders?.[nomusId];
  if(!order||order.code!==evidence.code||!evidence.confirmedAt||evidence.scans<2||evidence.detailMisses<2||identities.get(orderIdentity(order.code))?.length!==1)continue;
  const matching=Object.keys(board.details??{}).filter(id=>orderIdentity(id)===orderIdentity(order.code));
  if(matching.length>1)continue;
  const id=matching[0]??order.code,previous=next.details?.[id]??{responsavel:"",nota:"",situacao:"A programar"};
  // An intentional restore is respected for this same absence episode.
  if(previous.arquivado||previous.arquivo?.verificacao?.confirmadoEm===evidence.confirmedAt)continue;
  const client=state.clients?.[order.clientId]??state.snapshot.grupos.find(g=>g.id===order.code)?.cliente??"";
  const arquivo={motivo:"nomus_missing",automatico:true,em:now,por:"Nomus · automático",cliente:client,nomusId:Number(nomusId),observacao:"PD ausente em duas varreduras completas e não localizado em duas consultas individuais. Histórico preservado.",verificacao:{confirmadoEm:evidence.confirmedAt,primeiraAusenciaEm:evidence.firstMissingAt,ultimaVarreduraEm:evidence.lastScanAt,varreduras:evidence.scans,consultas:evidence.detailMisses,status:evidence.status}};
  next={...next,details:{...next.details,[id]:{...previous,arquivado:true,arquivo}}};
 }
 return next;
}
