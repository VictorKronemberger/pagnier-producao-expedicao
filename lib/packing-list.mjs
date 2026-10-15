import {canonicalShipping,analyzeShipment,emptyPacking,validDate} from "./shipping.mjs";
export function scaled(value){
 const m=String(value??"").match(/^(\d{1,9})(?:[.,](\d{1,3}))?$/);
 return m?BigInt(m[1])*1000n+BigInt((m[2]??"").padEnd(3,"0")):null;
}
export function weightText(grams){if(grams===null)return "—";return (grams/1000n).toString()+","+(grams%1000n).toString().padStart(3,"0")}
const count=v=>/^\d{1,6}$/.test(v??"")?Number(v):0;
export function inspectPacking(value,ops,{physicalOnly=false}={}){
 const s=canonicalShipping(value),p=s.packing??emptyPacking(),base=analyzeShipment(s,ops),issues=[...base.issues];
 if(!physicalOnly){for(const [key,label] of Object.entries({invoiceNumero:"Número da invoice",invoiceData:"Data da invoice",exportadorNome:"Nome do exportador",exportadorEndereco:"Endereço do exportador",destinatarioNome:"Nome do destinatário",destinatarioEndereco:"Endereço de entrega",paisOrigem:"País de origem",paisDestino:"País de destino",assinante:"Responsável pela revisão",assinaturaData:"Data da revisão"}))if(!p[key]?.trim())issues.push("Packing list: preencha "+label.toLowerCase()+".");
 if(!validDate(p.invoiceData)||!validDate(p.assinaturaData))issues.push("Packing list: revise as datas.");
 }
 let totalNet=0n,totalGross=0n,totalUnits=0;
 const boxes=s.caixas.map(b=>{
 let net=0n,units=0;
 const rows=b.itens.map((i,index)=>{
 const name=b.codigo+" / item "+(index+1),qty=count(i.unidadesEmbaladas),unitWeight=scaled(i.pesoUnitarioKg);
 if(!physicalOnly){if(!i.descricaoDocumento)issues.push(name+": informe a descrição documental.");
 if(!i.tipoEmbalagem)issues.push(name+": informe o tipo de embalagem (Bags, Bottle, Box…).");
 if(!i.hsCode)issues.push(name+": informe o HS Code confirmado pelo responsável.");else if(!/^[0-9. ]+$/.test(i.hsCode)||![6,8,10].includes(i.hsCode.replace(/[^0-9]/g,"").length))issues.push(name+": revise o formato do HS Code (6, 8 ou 10 dígitos).");
 }
 if(!qty)issues.push(name+": informe o número inteiro de unidades embaladas.");
 if(unitWeight===null||unitWeight<=0n)issues.push(name+": informe o peso líquido por unidade em kg.");
 const itemNet=unitWeight!==null?unitWeight*BigInt(qty):null;
 const u=i.unidade.trim().toUpperCase();
 let content=scaled(i.conteudoPorEmbalagem);
 if(content===null&&["UN","UNID","UNIDADE","UNIDADES","PC","PCS","PÇ","PÇS"].includes(u))content=1000n;
 if(content===null&&u==="KG")content=unitWeight;
 if(content===null&&u==="G"&&unitWeight!==null)content=unitWeight*1000n;
 const opAmount=scaled(i.quantidade);
 if(content===null||content<=0n)issues.push(name+": informe o conteúdo por embalagem na unidade da OP.");
 else if(opAmount!==null&&content*BigInt(qty)!==opAmount)issues.push(name+": unidades × conteúdo por embalagem não corresponde à quantidade embalada da OP.");
 if(u==="KG"&&opAmount!==null&&itemNet!==null&&opAmount!==itemNet)issues.push(name+": o peso líquido não corresponde à quantidade em KG da OP.");
 if(itemNet!==null)net+=itemNet;units+=qty;
 return {...i,units:qty,unitWeight,net:itemNet,content};
 });
 const declared=scaled(b.pesoLiquidoKg),gross=scaled(b.pesoBrutoKg);
 const limit=scaled(b.pesoMaximoKg),tare=scaled(b.taraKg);
 if(b.pesoMaximoKg&&(limit===null||limit<=0n))issues.push(b.codigo+": revise o limite de peso bruto.");
 if(b.pesoMaximoKg&&tare===null)issues.push(b.codigo+": informe a tara (caixa vazia e proteções).");
 if(limit!==null&&((gross!==null&&gross>limit)||(tare!==null&&net+tare>limit)))issues.push(b.codigo+": limite de peso excedido; distribua os itens em outra caixa.");
 if(gross!==null&&tare!==null&&gross<net+tare)issues.push(b.codigo+": peso bruto menor que itens mais tara; confira a pesagem.");

 if(declared!==null&&declared!==net)issues.push(b.codigo+": peso líquido informado difere da soma dos itens ("+weightText(net)+" kg).");
 if(gross!==null&&gross<net)issues.push(b.codigo+": peso bruto menor que o peso líquido calculado.");
 totalNet+=net;totalGross+=gross??0n;totalUnits+=units;
 return {...b,rows,net,gross,units};
 });
 return {shipment:s,packing:p,boxes,totalNet,totalGross,totalUnits,issues:[...new Set(issues)]};
}
