import {assemblyModeIssue} from "./assembly-mode.mjs";
import {emptyShipment,newBox} from "./shipping.mjs";
export function shipmentOwner(board,id){return Object.entries(board.details??{}).find(([,d])=>d.envio?.agrupamento?.pedidos?.includes(id))?.[0]??id}
export function shipmentOps(shipment,owner,groups){const ids=shipment?.agrupamento?.pedidos??[owner];return [...new Map(groups.filter(g=>ids.includes(g.id)).flatMap(g=>g.ordens).map(o=>[o.id,o])).values()]}
export function normalizeGrouping(g){
 if(g===undefined)return undefined;
 if(!g||!Array.isArray(g.pedidos)||!g.pedidos.length||g.pedidos.length>50||new Set(g.pedidos).size!==g.pedidos.length||g.pedidos.some(id=>typeof id!=="string"||id.length>150)||typeof g.titularKey!=="string"||!/^[a-f0-9]{64}$/.test(g.titularKey)||typeof g.titularNome!=="string"||!g.titularNome.trim()||g.titularNome.length>150||typeof g.confirmadoEm!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(g.confirmadoEm))throw Error("Revise e confirme o agrupamento de pedidos.");
 return {pedidos:[...g.pedidos],titularKey:g.titularKey,titularNome:g.titularNome.trim(),confirmadoEm:g.confirmadoEm};
}
export function validateGroups(board,groups){
 const allowed=new Set(groups.map(g=>g.id)),owners=new Map();
 for(const [owner,d] of Object.entries(board.details??{})){
 const group=normalizeGrouping(d.envio?.agrupamento);if(!group)continue;
 if(!group.pedidos.includes(owner)||group.pedidos.some(id=>!allowed.has(id)))throw Error("O envio contém um pedido fora do quadro permitido.");
 for(const id of group.pedidos){if(owners.has(id))throw Error("Um pedido já pertence a outro envio agrupado.");owners.set(id,owner)}
 }
}
export function mergeShipment(board,owner,ids,holder,packingPatch,now,idFactory){
 const original=board.details[owner]?.envio??emptyShipment(),previousIds=original.agrupamento?.pedidos??[owner];
 if(previousIds.some(id=>!ids.includes(id)))throw Error("Mantenha os pedidos já agrupados para preservar suas caixas.");
 const next=structuredClone(original);
 for(const id of ids.filter(id=>id!==owner&&!previousIds.includes(id))){
 if(shipmentOwner(board,id)!==id||board.details[id]?.envio?.agrupamento)throw Error("Este pedido já está agrupado.");
 const source=board.details[id]?.envio;
 for(const inner of source?.caixasEmMontagem??[]){
 const copy=structuredClone(inner),innerId=idFactory();copy.id=innerId;
 copy.itens=copy.itens.map(i=>({...i,id:idFactory(),caixaInternaId:innerId}));
 const codes=new Set((next.caixasEmMontagem??[]).map(b=>b.codigo));let n=1;while(codes.has(copy.codigo)){copy.codigo=(copy.tipo==="bag"?"BAG-":"INT-")+String(n++).padStart(2,"0")}
 next.caixasEmMontagem=[...(next.caixasEmMontagem??[]),copy];
 }
 if((next.caixasEmMontagem?.length??0)>100)throw Error("O envio ultrapassa 100 embalagens em montagem.");
 for(const box of source?.caixas??[]){
 const copy=structuredClone(box);copy.id=idFactory();
 if(next.caixas.some(b=>b.codigo===copy.codigo))copy.codigo=newBox(next.caixas,copy.id).codigo;
 copy.itens=copy.itens.map(i=>({...i,id:idFactory()}));next.caixas.push(copy);
 }
 }
 if(next.caixas.length>100)throw Error("O envio ultrapassa o limite de 100 caixas.");
 const inners=[...(next.caixasEmMontagem??[]),...next.caixas.flatMap(b=>b.caixasInternas??[])];
 if(next.organizacao&&assemblyModeIssue(next,next.organizacao))next.organizacao="mixed";
 else if(!next.organizacao&&inners.some(b=>b.tipo==="bag"))next.organizacao=inners.some(b=>b.tipo!=="bag")||next.caixas.some(b=>b.itens.some(i=>!i.caixaInternaId))?"mixed":"bags";
 next.packingExcluido=false;
 next.packing={...next.packing,...packingPatch};
 next.agrupamento=ids.length>1?{pedidos:ids,titularKey:holder.key,titularNome:holder.nome,confirmadoEm:now}:undefined;
 return next;
}
