import {decimal} from "./shipping.mjs";

const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();

export function smallBoxContents(items) {
 return items.map(item => {
  const quantity = decimal(item.quantidade);
  const amount = quantity === null ? "Quantidade a revisar" : quantity.toLocaleString("pt-BR", {maximumFractionDigits: 3}) + " " + (item.unidade || "unidades");
  return amount + " de " + (item.produto || "produto não informado");
 }).join("; ");
}

export function smallBoxOptions(boxes = [], query = "") {
 const terms = normalize(query).split(/\s+/).filter(Boolean);
 return boxes.flatMap((box, index) => {
  if (!box.pronta) return [];
  const label = box.codigo + " · " + smallBoxContents(box.itens) + " · Caixa menor " + (index + 1);
  const searchable = normalize(label);
  return terms.every(term => searchable.includes(term)) ? [{id: box.id, label}] : [];
 });
}
