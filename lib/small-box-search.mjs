import {decimal} from "./shipping.mjs";

const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();

export function smallBoxContents(items) {
 return items.map(item => {
  const quantity = decimal(item.quantidade);
  const amount = quantity === null ? "Quantidade a revisar" : quantity.toLocaleString("pt-BR", {maximumFractionDigits: 3}) + " " + (item.unidade || "unidades");
  return amount + " de " + (item.sku ? item.sku + " · " : "") + (item.produto || "produto não informado");
 }).join("; ");
}

export function smallBoxQuantity(items) {
 const totals = new Map();
 for (const item of items) {
  const value = decimal(item.quantidade);
  if (value === null) return "Revisar quantidade";
  const unit = item.unidade?.trim().toUpperCase() || "unidades";
  totals.set(unit, (totals.get(unit) ?? 0) + Math.round(value * 1000));
 }
 return [...totals].map(([unit, value]) => (value / 1000).toLocaleString("pt-BR", {maximumFractionDigits: 3}) + " " + unit).join(" + ") || "Vazia";
}

export function smallBoxOptions(boxes = [], query = "") {
 const terms = normalize(query).split(/\s+/).filter(Boolean);
 return boxes.flatMap((box, index) => {
  if (!box.pronta) return [];
  const contents = smallBoxContents(box.itens), quantity = smallBoxQuantity(box.itens);
  const label = box.codigo + " · " + contents + " · " + (box.tipo==="bag"?"Bag":"Caixa menor") + " " + (index + 1);
  const searchable = normalize(label + " " + quantity);
  return terms.every(term => searchable.includes(term)) ? [{id: box.id, label, title: box.codigo, number: index + 1, quantity, contents, type:box.tipo==="bag"?"bag":"box"}] : [];
 });
}
