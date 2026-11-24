import {assertPackingCapacity} from "./shipping.mjs";
import {smallBoxIssue} from "./assembly-flow.mjs";
// Already weighed legacy boxes stay in conference; new boxes explicitly start in assembly.
export function isMounted(box){return box?.montada===true||(box?.montada===undefined&&!!box?.pesoBrutoKg)}
export function finishOuterBox(shipment,id,ops){
 const box=shipment.caixas.find(b=>b.id===id);const issue=smallBoxIssue(box,ops);
 if(issue)throw Error(issue);
 for(const inner of box.caixasInternas??[]){const problem=smallBoxIssue({...inner,itens:box.itens.filter(i=>i.caixaInternaId===inner.id)},ops);if(problem)throw Error(inner.codigo+": "+problem)}
 assertPackingCapacity(shipment,ops);
 return {...shipment,caixas:shipment.caixas.map(b=>b.id===id?{...b,montada:true}:b)};
}
export function reopenOuterBox(shipment,id){
 return {...shipment,caixas:shipment.caixas.map(b=>b.id===id?{...b,montada:false}:b)};
}
