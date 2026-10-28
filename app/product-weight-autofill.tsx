"use client";
import {useEffect,useRef,useState} from "react";
import {assemblyBoxes,type Shipment,type ShippingOP} from "../lib/shipping.mjs";
import {applyNomusWeights,needsNomusWeight,type NomusWeightRow} from "../lib/nomus-product-weight.mjs";
export default function ProductWeightAutofill({value,ops,disabled,onChange}:{value:Shipment;ops:ShippingOP[];disabled:boolean;onChange:(value:Shipment)=>void}){
 const latest=useRef({value,onChange});
 useEffect(()=>{latest.current={value,onChange}},[value,onChange]);
 const [attempt,setAttempt]=useState(0),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 const candidates=assemblyBoxes(value).flatMap(box=>box.itens).filter(item=>needsNomusWeight(item)&&ops.some(op=>op.id===item.opId&&op.produto===item.produto&&op.unidade===item.unidade));
 const key=JSON.stringify([...new Set(candidates.map(item=>JSON.stringify([item.opId,item.produto,item.unidade])))]);
 useEffect(()=>{
  if(disabled||key==="[]")return;
  const controller=new AbortController();let active=true;
  async function load(){
   if(!active)return;
   setBusy(true);setStatus("Consultando o peso líquido cadastrado no Nomus…");
   const identities:string[]=JSON.parse(key),rows:NomusWeightRow[]=[];let index=0,failed=0;
   async function worker(){while(active&&index<identities.length){const [id,produto,unidade]=JSON.parse(identities[index++]);try{
    const response=await fetch("/api/packing-products?op="+encodeURIComponent(id),{cache:"no-store",signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)])});
    if(!response.ok)throw Error();const row=await response.json() as Partial<NomusWeightRow>;
    if(row.opId!==id||row.produto!==produto||row.unidade!==unidade||typeof row.pesoLiquidoUnitarioKg!=="string")throw Error();rows.push(row as NomusWeightRow);
   }catch{if(active)failed++}}}
   await Promise.all([worker(),worker()]);if(!active)return;
   try{
    const result=applyNomusWeights(latest.current.value,rows);
    if(result.filled)latest.current.onChange(result.shipment);
    setStatus((result.filled?"Peso líquido preenchido com o cadastro do Nomus. Confira os dados e finalize as caixas alteradas novamente. ":"")+(failed?"Não foi possível consultar alguns produtos. Tente novamente. ":"")+(rows.some(row=>!row.pesoLiquidoUnitarioKg)?"Há produtos sem peso líquido válido no cadastro. ":"")+(!result.filled&&!failed?"Valores existentes preservados; confira os itens ainda pendentes.":""));
   }catch{setStatus("Não foi possível aplicar os pesos. Revise os itens e tente novamente.")}
   setBusy(false);
  }
  void Promise.resolve().then(load);return()=>{active=false;controller.abort()};
 },[key,disabled,attempt]);
 if(!candidates.length&&!status)return null;
 return <div className="next-task"><div><strong>Peso líquido do Nomus</strong><p role="status">{status||"Preenchimento automático pelo cadastro do produto."}</p></div>{candidates.length>0&&<button type="button" className="button" disabled={disabled||busy} onClick={()=>setAttempt(v=>v+1)}>{busy?"Consultando…":"Consultar pesos novamente"}</button>}</div>;
}
