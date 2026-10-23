"use client";
import {useEffect,useRef,useState} from "react";
import {applyProductDocumentData,type ProductDocumentData} from "../lib/packing-product-data.mjs";
import type {Shipment,ShippingOP} from "../lib/shipping.mjs";
export default function ProductDocumentAutofill({value,ops,disabled,onChange}:{value:Shipment;ops:ShippingOP[];disabled:boolean;onChange:(value:Shipment)=>void}){
 const latest=useRef({value,onChange});latest.current={value,onChange};
 const [attempt,setAttempt]=useState(0),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 const candidates=[...new Set(value.caixas.flatMap(box=>box.itens).filter(item=>(!item.sku?.trim()||!item.hsCode?.trim())&&ops.some(op=>op.id===item.opId&&op.produto===item.produto&&op.unidade===item.unidade)).map(item=>item.opId))];
 const key=JSON.stringify(candidates);
 useEffect(()=>{
 if(disabled||key==="[]"){setBusy(false);if(key==="[]")setStatus("SKU e HS Code preenchidos.");return;}
 const controller=new AbortController();let active=true;
 async function load(){
 setBusy(true);setStatus("Consultando referência e NCM dos produtos no Nomus…");
 const ids:string[]=JSON.parse(key),rows:ProductDocumentData[]=[];let failed=0,index=0;
 async function worker(){while(active&&index<ids.length){const id=ids[index++];try{
 const response=await fetch("/api/packing-products?op="+encodeURIComponent(id),{cache:"no-store",signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)])});
 if(!response.ok)throw Error();const row=await response.json() as Partial<ProductDocumentData>;if(row.opId!==id||typeof row.produto!=="string"||typeof row.unidade!=="string"||typeof row.sku!=="string"||row.sku.length>100||typeof row.hsCode!=="string"||row.hsCode&&!/^\d{8}$/.test(row.hsCode))throw Error();rows.push(row as ProductDocumentData);
 }catch{if(active)failed++}}}
 await Promise.all([worker(),worker()]);if(!active)return;
 const result=applyProductDocumentData(latest.current.value,rows);
 if(result.filled)latest.current.onChange(result.shipment);
 const absent=rows.filter(row=>!row.sku||!row.hsCode).length;
 setStatus((result.filled?result.filled+" campo(s) preenchido(s) com os dados do produto. ":"")+(failed?failed+" produto(s) não puderam ser consultados. Tente novamente. ":"")+(absent?absent+" produto(s) sem referência ou NCM válido no cadastro. ":"")+(!failed&&!absent&&!result.filled?"Dados já preenchidos; valores existentes preservados.":""));setBusy(false);
 }
 void load();return()=>{active=false;controller.abort()};
 },[key,disabled,attempt]);
 return <div className="next-task"><div><strong>SKU e HS Code do produto</strong><p role="status">{status||"Os campos vazios são preenchidos com a referência e o NCM cadastrados no Nomus."}</p></div><button type="button" className="button" disabled={disabled||busy||!candidates.length} onClick={()=>setAttempt(value=>value+1)}>{busy?"Consultando…":"Consultar novamente"}</button></div>;
}
