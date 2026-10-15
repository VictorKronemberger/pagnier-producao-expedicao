const str=(v,max=700)=>typeof v==="string"?v.trim().slice(0,max):typeof v==="number"?String(v):"";
const address=v=>[ [str(v.endereco),str(v.numero,30)].filter(Boolean).join(", "),str(v.complemento),str(v.bairro),[str(v.municipio),str(v.uf,40),str(v.cep,30)].filter(Boolean).join(" · "),str(v.pais,80)].filter(Boolean).join("\n").slice(0,700);
export function clientDocument(v){
 if(!v||typeof v.nome!=="string")throw Error("Cadastro indisponível.");
 const addresses=[{label:"Endereço principal",value:address(v)},...(Array.isArray(v.enderecos)?v.enderecos:[]).filter(a=>a.ativo!==false).map((a,i)=>({label:"Endereço adicional "+(i+1),value:address({...a,pais:a.pais||v.pais})}))].filter(a=>a.value);
 return {nome:str(v.nome,150),razaoSocial:str(v.razaoSocial,150),registro:[str(v.cnpj||v.cpf,100),v.inscricaoEstadual?"IE: "+str(v.inscricaoEstadual,100):""].filter(Boolean).join("\n"),telefone:str(v.telefone,80),email:str(v.email,150),cidade:str(v.municipio,100),pais:str(v.pais,80),enderecos:addresses};
}
export async function clientKey(id){const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("packing-client:"+id));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("")}
export async function clientOptions(state){
 const ids=[...new Set(Object.values(state.orders??{}).map(o=>o.clientId).filter(Number.isInteger))];
 return Promise.all(ids.map(async id=>({id,key:await clientKey(id),nome:state.clients?.[id]||Object.values(state.orders).find(o=>o.clientId===id)?.code||"Cliente a identificar"})));
}
