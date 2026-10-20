export const manualArchiveReasons={manual:"Retirado da fila",nomus_deleted:"Excluído no Nomus",cancelled:"Pedido cancelado",duplicate:"Pedido duplicado",other:"Outro motivo"};
// Legacy reasons remain readable in existing history only.
export const archiveReasons={...manualArchiveReasons,nomus_missing:"Não localizado no Nomus (registro anterior)",unknown:"Motivo não registrado"};
export const archiveRestoreUnavailable="Restauração indisponível: este pedido não está na base atual consultada. O histórico permanece disponível. A restauração será liberada se o pedido voltar a aparecer na consulta.";
export function archiveReasonKey(record){return Object.hasOwn(archiveReasons,record?.motivo??"")?record.motivo:"unknown";}
// Import the known legacy dates once; do not invent dates, actors or reasons.
export function archiveEvents(record,archived=false){
 if(Array.isArray(record?.historico))return record.historico;
 const events=[];
 if(record?.em||record?.motivo||record?.por||archived)events.push({acao:"arquivar",motivo:record?.motivo,observacao:record?.observacao,em:record?.em,por:record?.por,automatico:record?.automatico});
 if(record?.restauradoEm)events.push({acao:"restaurar",em:record.restauradoEm,por:record.restauradoPor});
 return events;
}
export function archiveOrders(snapshot,board){
 const orders=new Map([...(snapshot?.pedidos??[]),...(snapshot?.grupos??[])].map(order=>[order.id,order]));
 return Object.entries(board.details??{}).filter(([,d])=>d.arquivado).map(([id,d])=>({...(orders.get(id)??{id,codigo:id,cliente:d.arquivo?.cliente??"",ordens:[]}),arquivo:d.arquivo,restauravel:orders.has(id)}));
}
export function changeArchive(board,order,{archived,reason="manual",note="",confirmedDeleted=false},actor,now){
 if(typeof archived!=="boolean"||!Object.keys(manualArchiveReasons).includes(reason)||typeof note!=="string"||note.length>500)throw Error("Revise o motivo e a observação do arquivamento.");
 if(archived&&reason==="nomus_deleted"&&confirmedDeleted!==true)throw Error("Confirme que a exclusão foi conferida no Nomus.");
 if(archived&&reason==="other"&&!note.trim())throw Error("Descreva o motivo na observação.");
 const previous=board.details[order.id]??{responsavel:"",nota:"",situacao:"A programar"};
 if(!!previous.arquivado===archived)throw Error(archived?"Este pedido já está arquivado.":"Este pedido já está ativo.");
 const historico=[...archiveEvents(previous.arquivo,!!previous.arquivado),{acao:archived?"arquivar":"restaurar",em:now,por:actor,...(archived?{motivo:reason,observacao:note.trim()}:{})}];
 const arquivo=archived?{motivo:reason,observacao:note.trim(),em:now,por:actor,cliente:order.cliente??"",historico}:{...previous.arquivo,restauradoEm:now,restauradoPor:actor,historico};
 return {...board,details:{...board.details,[order.id]:{...previous,arquivado:archived,arquivo}}};
}
