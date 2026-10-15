export function recipientPatch(existing,doc,address,replace=false){
 const incoming={destinatarioNome:doc.razaoSocial||doc.nome,destinatarioEndereco:address,destinatarioRegistro:doc.registro,contatoTelefone:doc.telefone,contatoEmail:doc.email,paisDestino:doc.pais};
 return Object.fromEntries(Object.entries(incoming).filter(([key,value])=>replace||(!existing?.[key]?.trim()&&!!value?.trim())));
}
export function pendingOrderSelection(ids,confirmed){return ids.length!==confirmed.length||ids.some(id=>!confirmed.includes(id))}
// Keep a shared destination aligned while preserving deliberate manual differences.
export function bridgeDestination(previous,next){
 const oldShipping=previous?.paisDestino??"",oldDocument=previous?.packing?.paisDestino??"";
 const shipping=next.paisDestino??"",document=next.packing?.paisDestino??"";
 if(shipping!==oldShipping&&document===oldDocument&&(!document||document===oldShipping))return {...next,packing:{...next.packing,paisDestino:shipping}};
 if(document!==oldDocument&&shipping===oldShipping&&(!shipping||shipping===oldDocument))return {...next,paisDestino:document};
 return next;
}
