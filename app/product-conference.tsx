"use client";
import ProductIdentity from "./product-identity";
import {productionProgress} from "../lib/production-progress.mjs";
import {useMemo,useState,useId,useRef,useEffect} from "react";
import {Search,X,ArrowRight,Package,AlertCircle,ChevronLeft,ChevronRight,SlidersHorizontal} from "lucide-react";
import StaffPicker from "./staff-picker";
import {CarrierControl} from "./carrier-mark";
import ContextHelp from "./context-help";
import {analyzeShipment,type Shipment,type ShippingOP} from "../lib/shipping.mjs";
import {quantityDifference,quantityText,quantityNumber} from "../lib/production-quantity.mjs";
type OP=ShippingOP&{criacao?:string;quantidadeProgramada?:string};
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();
const format=(n:number|null)=>n===null?"—":n.toLocaleString("pt-BR",{maximumFractionDigits:3});
const pageSize=20;
const defaultFilters={packing:"all",issue:"all",unit:"all",box:"all",sort:"original"};
const packingOptions=[["all","Todas as situações"],["none","Sem embalagem"],["partial","Parcialmente embalados"],["complete","Totalmente embalados"]];
const issueOptions=[["all","Todas"],["any","Com divergência"],["changed","Quantidade alterada"],["excess","Excesso nas caixas"],["incomplete","Dados incompletos"]];
const sortOptions=[["original","Ordem original"],["product","Produto (A–Z)"],["op","Número da OP"],["remaining","Maior saldo (por unidade)"]];
const compare=(a:string,b:string)=>a.localeCompare(b,"pt-BR",{numeric:true,sensitivity:"base"});
const unitKey=(unit:string)=>unit.trim().toUpperCase()||"__unknown__";
export default function ProductConference({ops,onVisibleOps,value,person,carrier,carrierSource,onCarrier,stock=false,disabled=false,onPerson,onBox,onContinue}:{ops:OP[];onVisibleOps?:(names:string[])=>void;value?:Shipment;person:string;carrier:string;carrierSource:string;onCarrier:(value:string)=>void;stock?:boolean;disabled?:boolean;onPerson:(name:string)=>void;onBox:(id:string)=>void;onContinue:()=>void}){
 const [query,setQuery]=useState(""),[filter,setFilter]=useState("all"),[page,setPage]=useState(1);
 const [filtersOpen,setFiltersOpen]=useState(false),[extra,setExtra]=useState(defaultFilters);
 const searchId=useId(),searchRef=useRef<HTMLInputElement>(null);
 const rows=useMemo(()=>{const allocations=analyzeShipment(value,ops).allocation;return ops.map(op=>{const allocation=allocations.find(a=>a.opId===op.id)!,difference=quantityDifference(op);return {op,allocation,difference,attention:difference.changed||["unknown","review","excess"].includes(allocation.status)}})},[value,ops]);
 const attention=rows.filter(r=>r.attention).length,pending=rows.filter(r=>(r.allocation.restante??0)>0).length;
 const tokens=normalize(query).split(/\s+/).filter(Boolean);
 const units=[...new Set(rows.map(r=>unitKey(r.op.unidade)))].sort(compare);
 const boxes=[...new Map(rows.flatMap(r=>r.allocation.caixas).map(b=>[b.id,b])).values()].sort((a,b)=>compare(a.codigo,b.codigo));
 const extraCount=[extra.packing,extra.issue,extra.unit,extra.box].filter(v=>v!=="all").length;
 const filtered=rows.filter(r=>{
 const a=r.allocation;
 return (filter==="all"||filter==="attention"&&r.attention||filter==="pending"&&(a.restante??0)>0)
 &&tokens.every(t=>normalize((r.op.sku??"")+" "+r.op.nome+" "+r.op.produto+" "+r.op.unidade).includes(t))
 &&(extra.packing==="all"||a.status===extra.packing)
 &&(extra.issue==="all"||extra.issue==="any"&&r.attention||extra.issue==="changed"&&r.difference.changed||extra.issue==="excess"&&(a.restante??0)<0||extra.issue==="incomplete"&&["unknown","review"].includes(a.status))
 &&(extra.unit==="all"||unitKey(r.op.unidade)===extra.unit)
 &&(extra.box==="all"||a.caixas.some(b=>b.id===extra.box));
 });
 if(extra.sort!=="original")filtered.sort((a,b)=>{
 if(extra.sort==="product")return compare(a.op.produto,b.op.produto)||compare(a.op.nome,b.op.nome);
 if(extra.sort==="op")return compare(a.op.nome,b.op.nome);
 return compare(unitKey(a.op.unidade),unitKey(b.op.unidade))||((b.allocation.restante??-Infinity)-(a.allocation.restante??-Infinity))||compare(a.op.nome,b.op.nome);
 });
 function setExtraFilter(key:keyof typeof defaultFilters,value:string){setExtra(current=>({...current,[key]:value}));setPage(1)}
 function clearFilters(){setExtra(defaultFilters);setFilter("all");setPage(1)}
 const chips=[
 ...(extra.packing!=="all"?[{key:"packing" as const,label:packingOptions.find(o=>o[0]===extra.packing)![1]}]:[]),
 ...(extra.issue!=="all"?[{key:"issue" as const,label:issueOptions.find(o=>o[0]===extra.issue)![1]}]:[]),
 ...(extra.unit!=="all"?[{key:"unit" as const,label:"Unidade: "+(extra.unit==="__unknown__"?"Não informada":extra.unit)}]:[]),
 ...(extra.box!=="all"?[{key:"box" as const,label:"Caixa: "+(boxes.find(b=>b.id===extra.box)?.codigo??"Removida")}]:[]),
 ...(extra.sort!=="original"?[{key:"sort" as const,label:sortOptions.find(o=>o[0]===extra.sort)![1]}]:[])
 ];
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize)),current=Math.min(page,pages),visible=filtered.slice((current-1)*pageSize,current*pageSize);
 const visibleNames=visible.filter(r=>!r.op.estoque&&!stock).map(r=>r.op.nome).filter(n=>/^OP[0-9]{1,12}$/.test(n)).join(",");
 useEffect(()=>{onVisibleOps?.(visibleNames?visibleNames.split(","):[]);return()=>onVisibleOps?.([])},[visibleNames,onVisibleOps]);
 function reset(){setQuery("");clearFilters();searchRef.current?.focus()}
 return <section className={"product-conference"+(!stock?" pc-with-production":"")} aria-label="Conferência dos produtos">
 <header className="pc-heading"><div><h3>{stock?"Conferir estoque":"Conferir produtos"}<ContextHelp label="Conferência dos produtos">Compare os produtos físicos com as quantidades da OP. Os números de alocação mostram o que foi cadastrado nas Caixas 40; eles não confirmam a contagem física. A busca inclui todos os produtos deste pedido.</ContextHelp></h3><span>{ops.length} {stock?"produtos":"ordens de produção"}</span></div><div className="pc-setup"><div className="pc-owner"><label>Responsável</label><StaffPicker label="Responsável pela conferência" value={person} disabled={disabled} onChange={onPerson}/></div><div className="pc-carrier"><div><label htmlFor={searchId+"-carrier"}>Transportadora</label><ContextHelp label="Transportadora do envio">Escolha a transportadora planejada. Ela aparece no cartão e no filtro de envio do quadro. Pedidos agrupados compartilham essa escolha. {carrierSource==="invoice"?"A seleção exibida vem da invoice; escolher outra transportadora define o envio sem alterar a invoice.":"Essa escolha não contrata frete nem altera invoices já criadas."}</ContextHelp></div><CarrierControl value={carrier}><select id={searchId+"-carrier"} aria-label="Transportadora do envio" disabled={disabled} value={carrier} onChange={e=>onCarrier(e.target.value)}><option value="" disabled={carrierSource==="invoice"}>{carrierSource==="invoice"&&!carrier?"Múltiplas nas invoices":"A definir"}</option><option>FedEx</option><option>DHL</option><option>Carregamento</option><option value="Outra">Outra transportadora</option>{carrier&&!["FedEx","DHL","Carregamento","Outra"].includes(carrier)&&<option value={carrier}>{carrier}</option>}</select></CarrierControl></div></div></header>
 <div className="pc-search"><label htmlFor={searchId}>Buscar SKU, produto ou OP</label><div><Search size={18} aria-hidden="true"/><input id={searchId} ref={searchRef} type="search" autoComplete="off" placeholder="SKU, nome, número da OP ou unidade" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} onKeyDown={e=>{if(e.key==="Escape"&&query){e.stopPropagation();setQuery("");setPage(1)}}}/>{query&&<button type="button" aria-label="Limpar busca de produtos" onClick={()=>{setQuery("");setPage(1);searchRef.current?.focus()}}><X size={17}/></button>}</div></div>
 <div className="pc-tools"><div className="pc-filters" aria-label="Filtrar produtos">{[["all","Todos",rows.length],["attention","A revisar",attention],["pending","A embalar",pending]].map(([key,label,count])=><button type="button" key={key} data-conference-filter={key} aria-pressed={filter===key} onClick={()=>{setFilter(String(key));setPage(1)}}>{label}<span>{count}</span></button>)}</div><button type="button" className="pc-filter-toggle" aria-expanded={filtersOpen} aria-controls={searchId+"-filters"} onClick={()=>setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={15} aria-hidden="true"/>Filtros{extraCount>0&&<span>{extraCount}</span>}</button><span className="pc-result" role="status" aria-live="polite">{filtered.length?((current-1)*pageSize+1)+"–"+Math.min(current*pageSize,filtered.length)+" de "+filtered.length:"0 resultados"}</span></div>
 {filtersOpen&&<div className="pc-advanced" id={searchId+"-filters"}>
 <label>Situação da embalagem<select aria-label="Filtrar situação da embalagem" value={extra.packing} onChange={e=>setExtraFilter("packing",e.target.value)}>{packingOptions.map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
 <label>Divergência<select aria-label="Filtrar divergência" value={extra.issue} onChange={e=>setExtraFilter("issue",e.target.value)}>{issueOptions.map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
 <label>Unidade<select aria-label="Filtrar unidade" value={extra.unit} onChange={e=>setExtraFilter("unit",e.target.value)}><option value="all">Todas as unidades</option>{units.map(u=><option key={u} value={u}>{u==="__unknown__"?"Não informada":u}</option>)}</select></label>
 <label>Caixa 40<select aria-label="Filtrar caixa" value={extra.box} onChange={e=>setExtraFilter("box",e.target.value)}><option value="all">Todas as caixas</option>{boxes.map(b=><option key={b.id} value={b.id}>{b.codigo}</option>)}{extra.box!=="all"&&!boxes.some(b=>b.id===extra.box)&&<option value={extra.box}>Caixa removida</option>}</select></label>
 <label>Ordenar por<select aria-label="Ordenar produtos" value={extra.sort} onChange={e=>setExtraFilter("sort",e.target.value)}>{sortOptions.map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
 <div className="pc-filter-actions"><ContextHelp label="Filtros da conferência">Combine os filtros com a busca e com Todos, A revisar ou A embalar. Situação considera a distribuição nas Caixas 40; Totalmente embalados não confirma conferência física. Caixa mostra os produtos daquele volume, mantendo os totais do pedido nas colunas. Maior saldo ordena dentro de cada unidade, sem comparar kg com unidades. Limpar filtros mantém sua busca.</ContextHelp><button type="button" className="text-action" disabled={!extraCount&&extra.sort==="original"&&filter==="all"} onClick={clearFilters}>Limpar filtros</button></div>
 </div>}
 {chips.length>0&&<div className="pc-active-filters" aria-label="Filtros aplicados à conferência">{chips.map(c=><button type="button" key={c.key} aria-label={"Remover filtro de produtos: "+c.label} onClick={()=>setExtraFilter(c.key,c.key==="sort"?"original":"all")}>{c.label}<X size={13} aria-hidden="true"/></button>)}</div>}
 <div className="pc-columns" aria-hidden="true"><span>SKU / produto / OP</span>{!stock&&<span>Produzido</span>}<span>{stock?"No pedido":"Na OP"}</span><span>Em Caixas 40</span><span>Falta embalar</span></div>
 <ul className="pc-list" aria-label="Produtos para conferência">{visible.map(({op,allocation:a,difference:d,attention:warning})=><li key={op.id} className={"pc-row"+(warning?" pc-row-attention":"")} data-op-id={op.id}>
 <div className="pc-row-grid"><div className="pc-product"><ProductIdentity sku={op.sku} name={op.produto}/><span className="pc-op">{op.nome}</span>{d.changed&&<span className="pc-change"><AlertCircle size={13} aria-hidden="true"/>Quantidade alterada: {quantityText(d.programmed)} → {quantityText(d.current)} {op.unidade}</span>}{["unknown","review"].includes(a.status)&&<span className="pc-change"><AlertCircle size={13} aria-hidden="true"/>Dados a revisar</span>}</div>
 {!stock&&(()=>{const progress=productionProgress(op);return <div className={"pc-number pc-produced pc-production-"+progress.state}><small>Produzido</small><strong>{quantityNumber(op.quantidadeProduzida)===null?"—":format(quantityNumber(op.quantidadeProduzida))}</strong>{quantityNumber(op.quantidadeProduzida)!==null&&<span>{op.unidade}</span>}<span className="pc-production-state">{progress.label}</span>{progress.state==="partial"&&<span className="pc-production-balance">Faltam {format(progress.remaining)} {op.unidade}</span>}</div>})()}
 <div className="pc-number"><small>{stock?"No pedido":"Na OP"}</small><strong>{format(a.previsto)}</strong><span>{op.unidade}</span></div>
 <div className="pc-number"><small>Em Caixas 40</small><strong>{format(a.embalado)}</strong><span>{op.unidade}</span></div>
 <div className={"pc-number pc-remaining "+(a.status==="excess"?"pc-excess":a.status==="complete"?"pc-complete":"")}><small>{a.restante!==null&&a.restante<0?"Excesso":"Falta embalar"}</small><strong>{format(a.restante===null?null:Math.abs(a.restante))}</strong><span>{a.restante!==null&&a.restante<0?op.unidade+" em excesso":op.unidade}</span></div></div>
 <details className="pc-details"><summary>Detalhes{a.caixas.length?" · "+a.caixas.length+" caixa(s)":""}</summary><div><dl>{!stock&&op.motivoProducao&&<div><dt>Dados da produção</dt><dd>{op.motivoProducao}</dd></div>}{!stock&&op.producaoConsultadaEm&&<div><dt>Produção consultada</dt><dd>{new Date(op.producaoConsultadaEm).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})}{op.operacaoProducao&&" · "+op.operacaoProducao}</dd></div>}<div><dt>Criação da OP</dt><dd>{op.criacao?op.criacao.split("-").reverse().join("/"):"Não informada"}</dd></div>{d.programmed!==null&&<div><dt>Quantidade programada</dt><dd>{quantityText(d.programmed)} {op.unidade}</dd></div>}</dl>{a.caixas.length>0&&<div className="pc-box-links">{a.caixas.map(b=><button type="button" key={b.id} onClick={()=>onBox(b.id)} aria-label={"Abrir "+b.codigo+" com "+format(b.quantidade)+" "+a.unidade+" de "+op.nome}><Package size={14}/>{b.codigo}<strong>{format(b.quantidade)} {a.unidade}</strong><ArrowRight size={13}/></button>)}</div>}</div></details>
 </li>)}</ul>
 {!visible.length&&<div className="pc-empty"><Search size={22} aria-hidden="true"/><strong>{!ops.length?"Nenhum produto disponível":filter==="attention"&&!query&&!extraCount?"Nenhuma divergência de quantidade":filter==="pending"&&!query&&!extraCount?"Nenhum saldo a embalar":"Nenhum produto encontrado"}</strong>{(query||filter!=="all"||extraCount>0)&&<button type="button" className="text-action" onClick={reset}>Mostrar todos os produtos</button>}</div>}
 {pages>1&&<nav className="pc-pagination" aria-label="Páginas de produtos"><button type="button" disabled={current===1} onClick={()=>setPage(current-1)}><ChevronLeft size={16}/>Anterior</button><span>{current} / {pages}</span><button type="button" disabled={current===pages} onClick={()=>setPage(current+1)}>Próxima<ChevronRight size={16}/></button></nav>}
 <footer className="pc-footer"><ContextHelp label="Quantidades e divergências">Produzido é a quantidade apontada na última operação do roteiro da OP. As etapas não são somadas. Não confirma baixa de estoque nem atendimento comercial do pedido. Produção pendente indica zero apontado na etapa final; Produção parcial indica quantidade abaixo da OP; Produção concluída indica quantidade igual ou maior que a OP. Consultando Nomus indica consulta pendente; Sem confirmação indica que não foi possível confirmar a quantidade, e não significa produção pendente. A atualização ocorre por lotes enquanto o painel estiver aberto; veja a data em Detalhes. Na OP é a quantidade atual no Nomus. Em Caixas 40 conta somente o conteúdo já colocado nas caixas maiores; caixas menores ainda em preparo não entram nessa coluna. A revisar reúne quantidades alteradas, excessos e dados inconsistentes. A embalar mostra o saldo positivo. Os filtros não alteram os dados nem confirmam a conferência.</ContextHelp><button type="button" className="button primary" disabled={disabled||!ops.length} onClick={onContinue}>Continuar para montagem das caixas<ArrowRight size={16}/></button></footer>
 </section>;
}
