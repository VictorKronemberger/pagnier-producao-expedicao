"use client";
import {useEffect,useId,useRef,useState,type ClipboardEvent,type KeyboardEvent,type ReactNode} from "react";
import {Plus,Search,Table2,Maximize2,X,Package,Check,Copy} from "lucide-react";
import {packingBalance} from "../lib/packing-assistant.mjs";
import {applySheetQuantities,type SheetChange} from "../lib/packing-sheet.mjs";
import {isDecimalDraft,type Shipment,type ShippingOP} from "../lib/shipping.mjs";
import {isMounted,finishOuterBox,reopenOuterBox} from "../lib/ready-boxes.mjs";
import {assemblySheetColumns,createSheetOuter,addSheetSmallBoxes,moveSheetSmallBox,duplicateSheetSmallBox,removeEmptySheetSmallBox,type AssemblyColumn} from "../lib/assembly-sheet.mjs";
import {assemblyMode} from "../lib/assembly-mode.mjs";
import {smallBoxQuantity} from "../lib/small-box-search.mjs";
import type {BoxModel} from "../lib/box-models.mjs";
import styles from "./packing-sheet.module.css";
import PackingSheetScreen from "./packing-sheet-screen";

const fold=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
function QuantityCell({value,label,disabled,onApply,onPaste,onKeyDown,onFocus,row,col}:{onFocus:()=>void;value:string;label:string;disabled:boolean;onApply:(value:string)=>string;onPaste:(event:ClipboardEvent<HTMLInputElement>)=>void;onKeyDown:(event:KeyboardEvent<HTMLInputElement>)=>void;row:number;col:number}){
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
 return <><input data-sheet-row={row} data-sheet-col={col} aria-label={label} aria-invalid={!!error} aria-describedby={error?errorId:undefined} disabled={disabled} inputMode="decimal" maxLength={13} placeholder="0" value={draft} onFocus={e=>{e.target.select();onFocus()}} onChange={e=>{if(isDecimalDraft(e.target.value))apply(e.target.value);else setError("Use números positivos com até três casas decimais.")}} onBlur={()=>{setDraft(value);setError("")}} onPaste={onPaste} onKeyDown={onKeyDown}/>{error&&<small id={errorId} className={styles.error} role="alert">{error}</small>}</>;
}


export default function PackingSheet({value,ops,disabled,onChange,onOpen,onForm,orderLabel,saveStatus,model,allowInner=true}:{orderLabel?:string;saveStatus?:ReactNode;value:Shipment;ops:ShippingOP[];disabled:boolean;onChange:(next:Shipment)=>void;onOpen:(id:string,parentId?:string)=>void;onForm:(id:string,parentId?:string)=>void;model?:BoxModel;allowInner?:boolean}){
 const latest=useRef(value);latest.current=value;
 const table=useRef<HTMLDivElement>(null),openButton=useRef<HTMLButtonElement>(null);
 const [query,setQuery]=useState(""),[page,setPage]=useState(0),[notice,setNotice]=useState("");
 const [expanded,setExpanded]=useState(false),[activeBox,setActiveBox]=useState(""),[pendingOnly,setPendingOnly]=useState(false);
 const [scope,setScope]=useState("all"),[count,setCount]=useState("1"),[kind,setKind]=useState("inner");
 const helpId=useId(),titleId=useId(),mode=assemblyMode(value),hasSmall=mode!=="direct"&&allowInner;
 const allColumns=assemblySheetColumns(value),currentScope=scope==="all"||scope==="loose"||value.caixas.some(b=>b.id===scope)?scope:"all";
 const boxes=allColumns.filter(b=>currentScope==="all"||currentScope==="loose"?currentScope==="all"||b.inner&&!b.parentId:(b.parentId||(!b.inner?b.id:""))===currentScope);
 const selected=boxes.find(b=>b.key===activeBox)??boxes[0];
 const outer=value.caixas.find(b=>b.id===(selected?.parentId||(!selected?.inner?selected?.id:undefined)||currentScope));
 const destination=outer??value.caixas.find(b=>!isMounted(b));
 const balances=new Map(packingBalance(value,ops).map(b=>[b.opId,b]));
 const unique=[...new Map(ops.map(op=>[op.id,op])).values()];
 const pending=unique.filter(op=>{const b=balances.get(op.id);return !b||b.invalid||b.excess||b.remainingScaled===null||b.remainingScaled>BigInt(0)});
 const rows=unique.filter(op=>(!pendingOnly||pending.some(p=>p.id===op.id))&&fold([op.sku,op.produto,op.nome,op.unidade].join(" ")).includes(fold(query)));
 const lastPage=Math.max(0,Math.ceil(rows.length/20)-1),currentPage=Math.min(page,lastPage),visible=rows.slice(currentPage*20,currentPage*20+20);
 function closeScreen(){setExpanded(false);requestAnimationFrame(()=>openButton.current?.focus())}
 function showBox(id:string,parentId?:string,form=false){closeScreen();if(form)onForm(id,parentId);else onOpen(id,parentId)}
 function save(next:Shipment){onChange(next);latest.current=next;setNotice("")}
 function run(action:(s:Shipment)=>Shipment){
  if(disabled)return;
  try{const previous=assemblySheetColumns(latest.current),next=action(latest.current);save(next);const added=assemblySheetColumns(next).filter(b=>!previous.some(p=>p.key===b.key)).at(-1);if(added){setActiveBox(added.key);setScope(added.parentId||(!added.inner?added.id:"loose"));requestAnimationFrame(()=>table.current?.querySelector("thead th:last-child")?.scrollIntoView({block:"nearest",inline:"nearest"}))}return next}
  catch(error){setNotice("Não aplicado: "+(error instanceof Error?error.message:"Revise a montagem."))}
 }
 function createOuter(){const next=run(s=>{let n=createSheetOuter(s,model);if(hasSmall&&mode!=="mixed")n=addSheetSmallBoxes(n,n.caixas.at(-1)!.id,1,mode==="bags"?"bag":undefined);return n});if(next)setScope(next.caixas.at(-1)!.id)}
 function addSmall(){run(s=>{let n=s;let id=destination?.id;if(!id){n=createSheetOuter(n,model);id=n.caixas.at(-1)!.id}return addSheetSmallBoxes(n,id,Number(count),mode==="bags"||mode==="mixed"&&kind==="bag"?"bag":undefined)})}
 function moveBox(box:AssemblyColumn,target:string){run(s=>{let n=s;if(target==="new"){n=createSheetOuter(n,model);target=n.caixas.at(-1)!.id}return moveSheetSmallBox(n,box.id,box.parentId,target)})}
 function apply(changes:SheetChange[]){if(disabled)return "Aguarde para editar.";try{save(applySheetQuantities(latest.current,ops,changes));return ""}catch(error){const message=error instanceof Error?error.message:"Revise as quantidades.";setNotice("Não aplicado: "+message);return message}}
 function paste(event:ClipboardEvent<HTMLInputElement>,row:number,col:number){
  const raw=event.clipboardData.getData("text/plain");if(!/[\t\r\n]/.test(raw))return;event.preventDefault();
  const matrix=raw.replace(/\r\n?/g,"\n").replace(/\n$/,"").split("\n").map(line=>line.split("\t"));
  if(row+matrix.length>visible.length||matrix.some(line=>col+line.length>boxes.length)){setNotice("Não aplicado: a colagem ultrapassa as linhas ou caixas visíveis. Crie as caixas ou cole um intervalo menor.");return}
  const changes=matrix.flatMap((line,r)=>line.map((quantity,c)=>({boxId:boxes[col+c].id,parentId:boxes[col+c].parentId,opId:visible[row+r].id,quantity})));
  if(!apply(changes))setNotice(changes.length+" quantidades aplicadas.");
 }
 function move(event:KeyboardEvent<HTMLInputElement>,row:number,col:number){
  let targetRow=row;if(event.key==="Enter"||event.key==="ArrowDown")targetRow+=event.shiftKey?-1:1;else if(event.key==="ArrowUp")targetRow--;else return;
  const input=table.current?.querySelector<HTMLInputElement>('input[data-sheet-row="'+targetRow+'"][data-sheet-col="'+col+'"]');if(input&&!input.disabled){event.preventDefault();input.focus()}
 }
 function selectOuter(id:string){setScope(id);setActiveBox("");setNotice("")}
 const content=<section className={styles.sheet+(expanded?" "+styles.expanded:"")} aria-label="Planilha de montagem">
  <header className={styles.heading}><div><span className={styles.eyebrow}>MONTAGEM DO PEDIDO</span><h2 id={titleId}><Table2 size={23}/>Monte suas caixas em uma planilha</h2>{orderLabel&&<p className={styles.orderLabel}>{orderLabel}</p>}<p id={helpId}>{hasSmall?"Crie as menores dentro da Caixa 40 e digite as quantidades. Tudo se organiza aqui.":"Digite as quantidades de cada produto. O conteúdo da Caixa 40 aparece ao lado."}</p></div><div className={styles.headerActions}><div className={styles.saveStatus}>{saveStatus}</div>{expanded?<button type="button" className="button" onClick={closeScreen}><X size={17}/>Voltar à montagem</button>:<button ref={openButton} type="button" className="button primary" onClick={()=>setExpanded(true)}><Maximize2 size={17}/>Abrir tela da planilha</button>}</div></header>
  <div className={styles.progress} aria-label="Resumo da distribuição"><span><strong>{unique.length-pending.length} de {unique.length}</strong> produtos distribuídos</span><progress aria-label="Produtos distribuídos" value={unique.length-pending.length} max={unique.length||1}/><span>{pending.length?pending.length+" a distribuir ou revisar":"Tudo distribuído"}</span></div>
  <nav className={styles.boxTabs} aria-label="Caixas 40 da planilha"><button type="button" aria-pressed={currentScope==="all"} onClick={()=>selectOuter("all")}>Todas <small>{value.caixas.length}</small></button>{value.caixas.map(b=><button type="button" key={b.id} aria-pressed={currentScope===b.id} onClick={()=>selectOuter(b.id)}><Package size={16}/><span>{b.codigo}<small>{isMounted(b)?"Montada":(b.caixasInternas?.length??0)+" menores · "+smallBoxQuantity(b.itens)}</small></span></button>)}{!!value.caixasEmMontagem?.length&&<button type="button" aria-pressed={currentScope==="loose"} onClick={()=>selectOuter("loose")}>Sem Caixa 40 <small>{value.caixasEmMontagem.length}</small></button>}<button type="button" className={styles.newOuter} disabled={disabled||value.caixas.length>=100||!ops.length} onClick={createOuter}><Plus size={16}/>Nova Caixa 40</button></nav>
  {hasSmall&&<div className={styles.addRow}><span><strong>{destination?"Adicionar em "+destination.codigo:"Comece pelas caixas menores"}</strong><small>{destination?"As novas embalagens já ficam dentro desta Caixa 40.":"A primeira Caixa 40 será criada junto."}</small></span><label>Quantidade<input aria-label="Quantidade de novas embalagens" type="number" min="1" max="100" step="1" value={count} disabled={disabled} onChange={e=>setCount(e.target.value)}/></label>{mode==="mixed"&&<label>Embalagem<select aria-label="Tipo das novas embalagens" value={kind} onChange={e=>setKind(e.target.value)} disabled={disabled}><option value="inner">Caixa menor</option><option value="bag">Bag</option></select></label>}<button type="button" className="button primary" disabled={disabled||!ops.length||!!destination&&isMounted(destination)} onClick={addSmall}><Plus size={16}/>{mode==="bags"||mode==="mixed"&&kind==="bag"?"Adicionar bags":"Adicionar caixas menores"}</button></div>}
  <div className={styles.toolbar}><label className={styles.search}><Search size={18}/><input type="search" aria-label="Buscar produto na planilha" placeholder="Buscar SKU, produto ou OP" value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}}/></label><button type="button" className={styles.filter} aria-pressed={pendingOnly} onClick={()=>{setPendingOnly(!pendingOnly);setPage(0)}}>{pendingOnly&&<Check size={15}/>}Só falta embalar</button></div>
  <div className={styles.instructions}><span><kbd>Tab</kbd> próxima caixa <kbd>Enter</kbd> próximo produto · Cole células do Excel</span><span>0 ou apagar retira o item</span></div>
  {notice&&<p className={notice.startsWith("Não aplicado")?styles.error:styles.hint} role="status">{notice}</p>}
  <div className={styles.workspace}><div className={styles.gridPane}><p className={styles.mobileHint}>Deslize para os lados para ver as caixas.</p>
  {!boxes.length?<div className={styles.empty}><Package size={32}/><p>{outer?"Adicione as caixas menores para preencher esta Caixa 40.":"Crie sua primeira caixa para começar."}</p><small>Os produtos do pedido já estão prontos para preencher.</small></div>:<div className={styles.scroll} ref={table} tabIndex={0} role="region" aria-label="Quantidades por produto e caixa" aria-describedby={helpId}><table className={styles.table}><thead><tr><th scope="col">Produto / OP</th><th scope="col">Pedido</th><th scope="col">Falta embalar</th>{boxes.map(box=><th scope="col" key={box.key} data-selected={selected?.key===box.key}><button type="button" aria-pressed={selected?.key===box.key} onClick={()=>setActiveBox(box.key)}>{box.codigo}</button><small>{box.inner?box.tipo==="bag"?"Bag":"Caixa menor":"Produtos diretos"}{box.locked?" · Conferida":""}</small>{box.inner&&<select className={styles.destination} aria-label={"Caixa 40 de "+box.codigo} value={box.parentId??""} disabled={disabled||!!box.parentId&&box.locked} onChange={e=>moveBox(box,e.target.value)}><option value="">Sem Caixa 40</option>{value.caixas.map(b=><option key={b.id} value={b.id} disabled={isMounted(b)}>{b.codigo}{isMounted(b)?" · Montada":""}</option>)}<option value="new" disabled={value.caixas.length>=100}>+ Nova Caixa 40</option></select>}</th>)}</tr></thead><tbody>
   {visible.map((op,row)=>{const balance=balances.get(op.id);return <tr key={op.id} data-complete={!!balance&&!balance.invalid&&!balance.excess&&balance.remainingScaled===BigInt(0)}><th scope="row"><strong>{op.sku||op.nome}</strong><span>{op.produto}</span><small>{op.nome} · {op.unidade}</small></th><td>{balance?.target??"A confirmar"}<small>{op.unidade}</small></td><td className={balance?.excess?styles.error:styles.balance}>{balance?.invalid?"Revisar":balance?.excess?"Excesso: "+balance.remaining:balance?.remaining??"A confirmar"}<small>{op.unidade}</small></td>{boxes.map((box,col)=>{
    const items=box.itens.filter(i=>i.opId===op.id),conflict=items.length>1||items.some(item=>item.produto!==op.produto||item.unidade!==op.unidade);
    return <td key={box.key} data-selected={selected?.key===box.key}>{conflict?<button type="button" className="text-action" onClick={()=>showBox(box.id,box.parentId,true)}>Revisar itens</button>:<QuantityCell value={items[0]?.quantidade??""} label={(op.sku||op.produto)+" · "+op.nome+" · "+box.codigo+" ("+op.unidade+")"} disabled={disabled||box.locked} onFocus={()=>setActiveBox(box.key)} row={row} col={col} onApply={quantity=>{setActiveBox(box.key);return apply([{boxId:box.id,parentId:box.parentId,opId:op.id,quantity}])}} onPaste={event=>paste(event,row,col)} onKeyDown={event=>move(event,row,col)}/>}</td>;
   })}</tr>})}{!visible.length&&<tr><td colSpan={3+boxes.length}>Nenhum produto encontrado neste pedido.</td></tr>}
  </tbody></table></div>}
  <footer className={styles.footer}><span>{rows.length?currentPage*20+1:0}–{Math.min((currentPage+1)*20,rows.length)} de {rows.length} produtos</span>{lastPage>0&&<div><button type="button" className="button" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Anterior</button><button type="button" className="button" disabled={currentPage===lastPage} onClick={()=>setPage(currentPage+1)}>Próxima</button></div>}</footer></div>
  <aside className={styles.preview} aria-label="Conteúdo da caixa selecionada"><div className={styles.previewHeading}><Package size={23}/><div><span>{outer?"SUA CAIXA 40":"EMBALAGEM SELECIONADA"}</span><h3>{outer?.codigo??selected?.codigo??"Tudo começa aqui"}</h3></div></div>{outer?<><p>{smallBoxQuantity(outer.itens)} · {isMounted(outer)?"Montada":"Em montagem"}</p><div className={styles.conclude}>{isMounted(outer)?<button type="button" className="button primary" disabled={disabled} onClick={()=>run(s=>reopenOuterBox(s,outer.id))}>Reabrir Caixa 40</button>:<button type="button" className="button primary" disabled={disabled||!outer.itens.length} onClick={()=>run(s=>finishOuterBox(s,outer.id,ops))}><Check size={17}/>Concluir Caixa 40</button>}</div><div className={styles.composition} aria-label={"Composição de "+outer.codigo}>{allColumns.filter(c=>(c.parentId||(!c.inner?c.id:""))===outer.id).map(c=><button type="button" key={c.key} aria-pressed={selected?.key===c.key} onClick={()=>setActiveBox(c.key)}><span>{c.inner?c.codigo:"Direto na caixa"}<small>{c.itens.length?smallBoxQuantity(c.itens):"Vazia · preencha a coluna"}</small></span><span>{c.tipo==="bag"?"Bag":c.inner?"Menor":"Avulsos"}</span></button>)}{!outer.caixasInternas?.length&&mode!=="direct"&&<p>Adicione as menores usando o botão acima da tabela.</p>}</div></>:selected?<p>Escolha a Caixa 40 no topo da coluna para colocar esta embalagem dentro dela.</p>:<p>Crie uma Caixa 40 e acompanhe o conteúdo aqui.</p>}
  {selected&&<div className={styles.selectedContent}><h4>{selected.inner?selected.codigo:"Produtos na caixa"}<small>{selected.itens.length} itens</small></h4>{selected.itens.length?<ul>{selected.itens.map(item=><li key={item.id}><span><b>{item.sku||item.opId}</b><span>{item.produto}</span></span><strong>{item.quantidade}<small>{item.unidade}</small></strong></li>)}</ul>:<p className={styles.hint}>Digite na coluna {selected.codigo}. Os produtos aparecem aqui na hora.</p>}{selected.inner&&<div className={styles.smallActions}>{selected.itens.length>0?<button type="button" className="button" disabled={disabled||selected.locked||!allowInner} onClick={()=>run(s=>duplicateSheetSmallBox(s,selected,ops))}><Copy size={15}/>Duplicar {selected.tipo==="bag"?"bag":"caixa menor"}</button>:<button type="button" className="text-action" disabled={disabled||selected.locked} onClick={()=>run(s=>removeEmptySheetSmallBox(s,selected))}>Remover embalagem vazia</button>}{selected.locked&&!selected.parentId&&<button type="button" className="button" disabled={disabled} onClick={()=>run(s=>({...s,caixasEmMontagem:s.caixasEmMontagem?.map(b=>b.id===selected.id?{...b,pronta:false}:b)}))}>Editar conteúdo</button>}</div>}</div>}
  <div className={styles.previewActions}>{outer&&<><button type="button" className="button" onClick={()=>showBox(outer.id)}>Pesos e detalhes da Caixa 40</button><small>{isMounted(outer)?"Conteúdo concluído. Confira os pesos e medidas antes do embarque.":"Conclua após conferir os produtos e as caixas menores."}</small></>}{selected&&<button type="button" className="text-action" onClick={()=>showBox(selected.id,selected.parentId,true)}>Lotes e dados dos produtos</button>}</div>
  </aside></div>
 </section>;
 return expanded?<PackingSheetScreen labelledBy={titleId} onClose={closeScreen}>{content}</PackingSheetScreen>:content;
}