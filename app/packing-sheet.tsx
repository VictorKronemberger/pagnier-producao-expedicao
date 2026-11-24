"use client";
import {useEffect,useId,useRef,useState,type ClipboardEvent,type KeyboardEvent} from "react";
import {Plus,Search,Table2} from "lucide-react";
import {packingBalance} from "../lib/packing-assistant.mjs";
import {applySheetQuantities,sheetItems,type SheetChange} from "../lib/packing-sheet.mjs";
import {isDecimalDraft,type Shipment,type ShippingOP} from "../lib/shipping.mjs";
import {isMounted} from "../lib/ready-boxes.mjs";
import styles from "./packing-sheet.module.css";

const fold=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
function QuantityCell({value,label,disabled,onApply,onPaste,onKeyDown,row,col}:{value:string;label:string;disabled:boolean;onApply:(value:string)=>string;onPaste:(event:ClipboardEvent<HTMLInputElement>)=>void;onKeyDown:(event:KeyboardEvent<HTMLInputElement>)=>void;row:number;col:number}){
 const [draft,setDraft]=useState(value),[error,setError]=useState("");
 const errorId=useId();
 useEffect(()=>{setDraft(value);setError("")},[value]);
 function apply(raw:string){
  setDraft(raw);
  // Keep a trailing decimal separator while typing; persist its numeric value.
  const normalized=raw.replace(/[.,]$/,"");
  if(normalized===""&&raw!==""){setError("Complete a quantidade.");return}
  setError(onApply(normalized));
 }
 return <><input data-sheet-row={row} data-sheet-col={col} aria-label={label} aria-invalid={!!error} aria-describedby={error?errorId:undefined} disabled={disabled} inputMode="decimal" maxLength={13} placeholder="0" value={draft} onFocus={e=>e.target.select()} onChange={e=>{if(isDecimalDraft(e.target.value))apply(e.target.value);else setError("Use números positivos com até três casas decimais.")}} onBlur={()=>{setDraft(value);setError("")}} onPaste={onPaste} onKeyDown={onKeyDown}/>{error&&<small id={errorId} className={styles.error} role="alert">{error}</small>}</>;
}

export default function PackingSheet({value,ops,inner,disabled,onChange,onCreate,onOpen,onForm}:{value:Shipment;ops:ShippingOP[];inner:boolean;disabled:boolean;onChange:(next:Shipment)=>void;onCreate:()=>void;onOpen:(id:string)=>void;onForm:(id:string)=>void}){
 const latest=useRef(value);latest.current=value;
 const table=useRef<HTMLDivElement>(null);
 const [query,setQuery]=useState(""),[page,setPage]=useState(0),[notice,setNotice]=useState("");
 const helpId=useId();
 const boxes=inner?(value.caixasEmMontagem??[]):value.caixas.filter(b=>!isMounted(b));
 const balances=new Map(packingBalance(value,ops).map(b=>[b.opId,b]));
 const unique=[...new Map(ops.map(op=>[op.id,op])).values()];
 const rows=unique.filter(op=>fold([op.sku,op.produto,op.nome,op.unidade].join(" ")).includes(fold(query)));
 const lastPage=Math.max(0,Math.ceil(rows.length/20)-1),currentPage=Math.min(page,lastPage),visible=rows.slice(currentPage*20,currentPage*20+20);
 const label=inner?(value.organizacao==="bags"?"bag":"caixa menor"):"Caixa 40";
 function apply(changes:SheetChange[]){
  try{const next=applySheetQuantities(latest.current,ops,changes);onChange(next);latest.current=next;setNotice("");return ""}
  catch(error){const message=error instanceof Error?error.message:"Revise as quantidades.";setNotice("Não aplicado: "+message);return message}
 }
 function paste(event:ClipboardEvent<HTMLInputElement>,row:number,col:number){
  const raw=event.clipboardData.getData("text/plain");
  if(!/[\t\r\n]/.test(raw))return;
  event.preventDefault();
  const matrix=raw.replace(/\r\n?/g,"\n").replace(/\n$/,"").split("\n").map(line=>line.split("\t"));
  if(row+matrix.length>visible.length||matrix.some(line=>col+line.length>boxes.length)){setNotice("Não aplicado: a colagem ultrapassa as linhas desta página ou as caixas disponíveis. Crie as caixas necessárias ou cole um intervalo menor.");return}
  const changes=matrix.flatMap((line,r)=>line.map((quantity,c)=>({boxId:boxes[col+c].id,opId:visible[row+r].id,quantity})));
  if(!apply(changes))setNotice(changes.length+" quantidades aplicadas. Confira o conteúdo das caixas.");
 }
 function move(event:KeyboardEvent<HTMLInputElement>,row:number,col:number){
  let targetRow=row,targetCol=col;
  if(event.key==="Enter"||event.key==="ArrowDown")targetRow+=event.shiftKey?-1:1;
  else if(event.key==="ArrowUp")targetRow--;
  else return; // Tab and Shift+Tab retain native keyboard behavior.
  const input=table.current?.querySelector<HTMLInputElement>('input[data-sheet-row="'+targetRow+'"][data-sheet-col="'+targetCol+'"]');
  if(input&&!input.disabled){event.preventDefault();input.focus()}
 }
 return <section className={styles.sheet} aria-label="Planilha de montagem">
  <header className={styles.heading}><div><h4><Table2 size={18}/>Preencha as caixas pelo pedido</h4><p id={helpId}>Digite a quantidade de cada produto em cada caixa. Tab avança; Enter desce. Você também pode colar células do Excel.</p></div><button type="button" className="button primary" disabled={disabled||boxes.length>=100||!ops.length} onClick={onCreate}><Plus size={16}/>Nova {label}</button></header>
  <label className={styles.search}><Search size={17}/><input type="search" aria-label="Buscar produto na planilha" placeholder="Buscar SKU, produto ou OP" value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}}/></label>
  <p className={styles.hint}>As quantidades usam a unidade da OP. O saldo considera todas as caixas e embalagens deste envio. Apagar ou digitar 0 retira o produto da caixa.</p>
  {!boxes.length?<p className={styles.empty}>Crie uma {label} para preencher os produtos do pedido.</p>:<div className={styles.scroll} ref={table} tabIndex={0} role="region" aria-label="Quantidades por produto e caixa" aria-describedby={helpId}><table className={styles.table}><thead><tr><th scope="col">Produto / OP</th><th scope="col">Na OP</th><th scope="col">Falta embalar</th>{boxes.map(box=><th scope="col" key={box.id}><button type="button" onClick={()=>onOpen(box.id)}>{box.codigo}</button><small>{inner&&"pronta" in box&&box.pronta?"Conferida · editar no formulário":inner?"Nesta embalagem":"Direto nesta caixa"}</small></th>)}</tr></thead><tbody>
   {visible.map((op,row)=>{const balance=balances.get(op.id);return <tr key={op.id}><th scope="row"><strong>{op.sku||op.nome}</strong><span>{op.produto}</span><small>{op.nome} · {op.unidade}</small></th><td>{balance?.target??"A confirmar"}<small>{op.unidade}</small></td><td className={balance?.excess?styles.error:styles.balance}>{balance?.invalid?"Revisar":balance?.excess?"Excesso: "+balance.remaining:balance?.remaining??"A confirmar"}<small>{op.unidade}</small></td>{boxes.map((box,col)=>{
    const items=sheetItems(box,op.id,inner),locked=inner&&"pronta" in box&&!!box.pronta;
    const conflict=items.length>1||items.some(item=>item.produto!==op.produto||item.unidade!==op.unidade);
    return <td key={box.id}>{conflict?<button type="button" className="text-action" onClick={()=>onForm(box.id)}>Revisar itens</button>:<QuantityCell value={items[0]?.quantidade??""} label={(op.sku||op.produto)+" · "+op.nome+" · "+box.codigo+" ("+op.unidade+")"} disabled={disabled||locked} row={row} col={col} onApply={quantity=>apply([{boxId:box.id,opId:op.id,quantity}])} onPaste={event=>paste(event,row,col)} onKeyDown={event=>move(event,row,col)}/>}</td>;
   })}</tr>})}
   {!visible.length&&<tr><td colSpan={3+boxes.length}>Nenhum produto encontrado neste pedido.</td></tr>}
  </tbody></table></div>}
  <footer className={styles.footer}><span>{rows.length?currentPage*20+1:0}–{Math.min((currentPage+1)*20,rows.length)} de {rows.length} produtos</span>{lastPage>0&&<div><button type="button" className="button" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Anterior</button><button type="button" className="button" disabled={currentPage===lastPage} onClick={()=>setPage(currentPage+1)}>Próxima</button></div>}<span>O conteúdo da caixa aparece abaixo enquanto você preenche.</span></footer>
  {notice&&<p className={notice.startsWith("Não aplicado")?styles.error:styles.hint} role="status">{notice}</p>}
 </section>;
}