import {packingBalance} from "./packing-assistant.mjs";
import {scaled,weightText} from "./packing-list.mjs";
const amount = value => weightText(value).replace(/,000$/, "").replace(/(,\d*?)0+$/, "$1");
export function smallBoxProgress(shipment, ops) {
 const staged = shipment.caixasEmMontagem ?? [];
 const drafts = staged.filter(box => !box.pronta);
 const ready = [
  ...staged.filter(box => box.pronta).map(box => ({...box, outerId: "", location: "Aguardando Caixa 40"})),
  ...shipment.caixas.flatMap(outer => (outer.caixasInternas ?? []).map(box => ({...box, itens: outer.itens.filter(item => item.caixaInternaId === box.id), outerId: outer.id, location: "Dentro de " + outer.codigo})))
 ];
 const pending = packingBalance(shipment, ops).map(row => {
  const draft = drafts.flatMap(box => box.itens).filter(item => item.opId === row.opId).reduce((sum, item) => sum + (scaled(item.quantidade) ?? 0n), 0n);
  return {...row, draft: amount(draft), hasDraft: draft > 0n};
 }).filter(row => row.invalid || row.excess || row.remainingScaled === null || row.remainingScaled > 0n || row.hasDraft);
 return {ready, pending, draftCount: drafts.length};
}
