import {emptyShipment,newBox,newItem,emptyPacking} from "../lib/shipping.mjs";
export function fixture(){
 const ops=[{id:"OP-QA",nome:"OP-QA",produto:"Produto de teste",quantidade:"10",unidade:"KG"}];
 const shipment={...emptyShipment(),transportadora:"Transportadora de teste",packing:{...emptyPacking(),invoiceNumero:"TESTE-001",invoiceData:"2026-03-25",exportadorNome:"Exportador de demonstração",exportadorEndereco:"Endereço de demonstração\nBrazil",destinatarioNome:"Destinatário de demonstração",destinatarioEndereco:"Endereço de demonstração\nNetherlands",paisOrigem:"Brazil",paisDestino:"Netherlands",assinante:"Responsável de demonstração",assinaturaData:"2026-03-25",pallets:"0"},caixas:[{...newBox([],"box-1"),comprimentoCm:"40",larguraCm:"30",alturaCm:"20",pesoBrutoKg:"11",pesoLiquidoKg:"10",itens:[{...newItem("item-1"),opId:"OP-QA",produto:"Produto de teste",unidade:"KG",quantidade:"10",descricaoDocumento:"Product for demonstration — not a commercial shipment.",sku:"TEST-SKU",hsCode:"000000",tipoEmbalagem:"Bags",unidadesEmbaladas:"2",pesoUnitarioKg:"5"}]}]};
 return {ops,shipment};
}
