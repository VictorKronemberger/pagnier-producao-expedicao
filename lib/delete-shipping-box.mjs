export function deleteShippingBox(shipment,kind,id,confirmation,outerId="") {
 if(confirmation!=="EXCLUIR")throw Error("Digite EXCLUIR para confirmar.");
 let next;
 if(kind==="outer"){
  if(!shipment.caixas.some(box=>box.id===id))throw Error("Caixa não encontrada.");
  next={...shipment,caixas:shipment.caixas.filter(box=>box.id!==id)};
 }else if(kind==="small"&&outerId){
  const outer=shipment.caixas.find(box=>box.id===outerId);
  if(!outer?.caixasInternas?.some(box=>box.id===id))throw Error("Caixa menor não encontrada.");
  next={...shipment,caixas:shipment.caixas.map(box=>box.id!==outerId?box:{...box,caixasInternas:box.caixasInternas.filter(inner=>inner.id!==id),itens:box.itens.filter(item=>item.caixaInternaId!==id),montada:false,pesoBrutoKg:"",pesoLiquidoKg:"",taraKg:""})};
 }else if(kind==="small"){
  if(!shipment.caixasEmMontagem?.some(box=>box.id===id))throw Error("Caixa menor não encontrada.");
  next={...shipment,caixasEmMontagem:shipment.caixasEmMontagem.filter(box=>box.id!==id)};
 }else throw Error("Tipo de caixa inválido.");
 return {...next,conferenciaPor:"",conferenciaEm:"",conferenciaBase:""};
}
