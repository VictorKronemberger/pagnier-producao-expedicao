import {decimal,isDecimalDraft,newBox} from "./shipping.mjs";
export const modelFields=["nome","comprimentoCm","larguraCm","alturaCm","pesoMaximoKg","taraKg"];
export function normalizeBoxModels(value=[]){
 if(!Array.isArray(value)||value.length>50)throw Error("Cadastre até 50 modelos de caixa.");
 const ids=new Set(),names=new Set();
 return value.map(m=>{
 if(!m||typeof m!=="object"||typeof m.id!=="string"||!/^[a-zA-Z0-9_-]{1,80}$/.test(m.id)||ids.has(m.id))throw Error("Modelo de caixa inválido.");ids.add(m.id);
 const result={id:m.id};
 for(const key of modelFields){if(typeof m[key]!=="string"||m[key].length>(key==="nome"?80:13))throw Error("Revise o modelo de caixa.");result[key]=m[key].trim()}
 for(const key of modelFields.filter(k=>k!=="nome"))if(!isDecimalDraft(result[key]))throw Error("Use até três casas decimais nas medidas e pesos.");
 if(!result.nome||names.has(result.nome.toLocaleLowerCase("pt-BR")))throw Error("Use um nome único para cada modelo.");names.add(result.nome.toLocaleLowerCase("pt-BR"));
 for(const key of ["comprimentoCm","larguraCm","alturaCm"])if((decimal(result[key])??0)<=0)throw Error("Informe as três medidas externas do modelo em cm.");
 if(result.pesoMaximoKg&&(decimal(result.pesoMaximoKg)??0)<=0)throw Error("Informe um limite de peso bruto válido.");
 if(result.taraKg&&decimal(result.taraKg)===null)throw Error("Informe uma tara válida.");
 if(result.pesoMaximoKg&&(result.taraKg===""||decimal(result.taraKg)>=decimal(result.pesoMaximoKg)))throw Error("Informe o peso da caixa vazia e proteções (tara), menor que o limite bruto.");
 return result;
 });
}
export function boxFromModel(boxes,id,model){const box=newBox(boxes,id);if(!model)return box;const m=normalizeBoxModels([model])[0];return {...box,modeloNome:m.nome,...Object.fromEntries(modelFields.filter(k=>k!=="nome").map(k=>[k,m[k]]))}}
