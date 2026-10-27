import {boxReviewKey} from "./box-review.mjs";
// Only operational fields are audited. Client-supplied history and ERP snapshots are ignored.
const stages={"A programar":"Aguardando liberação","Programado":"Na fila","Em acompanhamento":"Produzindo","Bloqueado":"Bloqueado","Concluído":"Preparar envio","Pronto para envio e documentação":"Preparar envio","Pronto para envio":"Pronto para envio","Atendido totalmente e enviado":"Enviados"};
const modes={direct:"Direto na Caixa 40",inner:"Caixas menores",bags:"Bags",mixed:"Modo misto"};
const detailFields={responsavel:"Responsável",responsavelConferencia:"Responsável pela conferência",nota:"Orientações do supervisor",situacao:"Etapa",etiqueta:"Etiqueta",empresa:"Empresa",arquivado:"Arquivado",atendimentoEstoque:"Atendimento de estoque",conferidas:"OPs conferidas",expedicao:"Conferência de produtos"};
const shipmentFields={organizacao:"Montagem",conferenciaPor:"Conferência física por",conferenciaEm:"Conferência física em",referencia:"Referência",transportadora:"Transportadora",modalidade:"Modalidade",previsaoEnvio:"Previsão de envio",dataEnvio:"Data de saída",rastreio:"Rastreio",cidadeDestino:"Cidade",paisDestino:"País",responsavelEmbalagem:"Responsável pela embalagem",observacoes:"Observações"};
const packingFields={invoiceNumero:"Número da invoice",invoiceData:"Data da invoice",exportadorNome:"Exportador",exportadorEndereco:"Endereço do exportador",exportadorRef:"Referência do exportador",destinatarioNome:"Destinatário",destinatarioEndereco:"Endereço do destinatário",destinatarioRegistro:"Registro do destinatário",contatoNome:"Contato",contatoTelefone:"Telefone",contatoFax:"Fax",contatoEmail:"E-mail",compradorNome:"Comprador",compradorEndereco:"Endereço do comprador",compradorRegistro:"Registro do comprador",compradorContato:"Contato do comprador",pedidoComprador:"Pedido do comprador",outrasReferencias:"Outras referências",paisOrigem:"País de origem",paisDestino:"País de destino",termosEntrega:"Condições de entrega",termosPagamento:"Condições de pagamento",preTransporte:"Pré-transporte",localRecebimento:"Local de recebimento",vooNavio:"Voo / navio",portoEmbarque:"Porto de embarque",portoDesembarque:"Porto de desembarque",destinoFinal:"Destino final",pallets:"Pallets",assinante:"Revisor documental",assinaturaData:"Data da revisão"};
const boxFields={codigo:"Identificação",montada:"Finalizada",embalagem:"Embalagem",lacre:"Lacre",comprimentoCm:"Comprimento (cm)",larguraCm:"Largura (cm)",alturaCm:"Altura (cm)",pesoBrutoKg:"Peso bruto (kg)",pesoLiquidoKg:"Peso líquido (kg)",pesoMaximoKg:"Limite (kg)",taraKg:"Tara (kg)",modeloNome:"Modelo",observacoes:"Observações"};
const itemFields={produto:"Produto",opId:"OP / origem",unidade:"Unidade",quantidade:"Quantidade",unidadesEmbaladas:"Unidades embaladas",pesoUnitarioKg:"Peso por unidade (kg)",conteudoPorEmbalagem:"Conteúdo por embalagem",lote:"Lote",validade:"Validade",tipoEmbalagem:"Embalagem documental",descricaoDocumento:"Descrição documental",hsCode:"HS Code",sku:"SKU"};
const invoiceFields={number:"Número",carrier:"Transportadora",date:"Data",exportDate:"Data de exportação",dataEnvio:"Data de saída",waybill:"AWB / rastreio",exportReferences:"Referências",countryExport:"País de exportação",countryManufacture:"País de fabricação",countryDestination:"País de destino",currency:"Moeda",freight:"Frete",packagesTotal:"Volumes",location:"Local",signerName:"Responsável",signerTitle:"Cargo",signerId:"Registro do responsável",signatureDate:"Data da revisão",notes:"Observações",passport:"Passaporte",orderIds:"Pedidos"};
const partyFields={company:"Nome",taxId:"Registro",stateReg:"Inscrição",address:"Endereço",city:"Cidade",state:"Estado",country:"País",zip:"CEP",phone:"Telefone",email:"E-mail",contact:"Contato",department:"Departamento"};
const invoiceItemFields={description:"Descrição",hsCode:"HS Code",quantity:"Quantidade",unit:"Unidade",unitWeightKg:"Peso unitário (kg)",unitValue:"Valor unitário",packages:"Volumes",packaging:"Embalagem",marks:"Identificação",partNumber:"Referência",sourceOrder:"Pedido de origem"};
const text=v=>Array.isArray(v)?[...v].sort().join(", "):typeof v==="boolean"?(v?"Sim":"Não"):String(v??"").trim();
function add(changes,field,before,after){if(text(before)!==text(after))changes.push({field,before:text(before),after:text(after)})}
function fields(changes,a={},b={},labels,prefix=""){for(const [key,label] of Object.entries(labels)){let old=a?.[key],value=b?.[key];if(typeof old==="boolean"||typeof value==="boolean"){old=!!old;value=!!value}if(key==="situacao"){old=stages[old]??old;value=stages[value]??value}if(key==="organizacao"){old=modes[old]??old;value=modes[value]??value}add(changes,prefix+label,old,value)}}
function collection(changes,old=[],next=[],labels,prefix){
 const a=new Map(old.map(v=>[v.id,v])),b=new Map(next.map(v=>[v.id,v]));
 for(const id of new Set([...a.keys(),...b.keys()])){const before=a.get(id),after=b.get(id),label=prefix+(after?.codigo||before?.codigo||after?.produto||before?.produto||after?.description||before?.description||id);
 if(!before||!after)add(changes,label,before?"Existente":"",after?"Criado":"Excluído");
 fields(changes,before,after,labels,label+" · ");}
}
function packageMap(s={}){const map=new Map();for(const b of s.caixas??[]){map.set(b.id,{...b,kind:"Caixa 40",location:"No envio"});for(const i of b.caixasInternas??[])map.set(i.id,{...i,kind:i.tipo==="bag"?"Bag":"Caixa menor",location:b.codigo,pronta:true})}for(const b of s.caixasEmMontagem??[])map.set(b.id,{...b,kind:b.tipo==="bag"?"Bag":"Caixa menor",location:"Em preparo"});return map}
function products(s={}){const packages=packageMap(s);return [...(s.caixas??[]),...(s.caixasEmMontagem??[])].flatMap(b=>(b.itens??[]).map(i=>({...i,location:packages.get(i.caixaInternaId||b.id)?.codigo||b.codigo})))}
function shipmentChanges(a,b){
 const changes=[];fields(changes,a,b,shipmentFields,"Envio · ");
 const wasDocument=!!a&&!a.packingExcluido,isDocument=!!b&&!b.packingExcluido;
 if(wasDocument!==isDocument)add(changes,"Packing list · Documento",wasDocument?"Disponível":"",isDocument?(a?.packingExcluido?"Recriado":"Criado"):"Excluído");
 fields(changes,a?.packing,b?.packing,packingFields,"Packing list · ");
 add(changes,"Envio · Pedidos agrupados",a?.agrupamento?.pedidos,b?.agrupamento?.pedidos);
 add(changes,"Envio · Titular do agrupamento",a?.agrupamento?.titularNome,b?.agrupamento?.titularNome);
 if(a?.conferenciaBase&&a?.conferenciaEm===b?.conferenciaEm&&boxReviewKey(a,[])!==boxReviewKey(b,[]))add(changes,"Conferência física","Conferência anterior","Revisar após alteração");
 const old=packageMap(a),next=packageMap(b);
 for(const id of new Set([...old.keys(),...next.keys()])){const x=old.get(id),y=next.get(id),label=(y?.kind||x?.kind)+" "+(y?.codigo||x?.codigo);
 if(!x||!y)add(changes,label,x?"Existente":"",y?"Criada":"Excluída");
 fields(changes,x,y,{...boxFields,location:"Localização",pronta:"Pronta",kind:"Tipo"},label+" · ");}
 collection(changes,products(a),products(b),{...itemFields,location:"Embalagem física"},"Produto · ");
 return changes;
}
const shipmentIds=(board,id)=>board.details?.[id]?.envio?.agrupamento?.pedidos??[id];
export function orderHistoryChanges(previous={},next={}){
 const out=new Map();
 function record(ids,changes){if(!changes.length)return;const related=[...new Set(ids)].filter(Boolean);for(const id of related){const entry=out.get(id)??{orderId:id,relatedOrders:new Set(),changes:[]};related.forEach(v=>entry.relatedOrders.add(v));entry.changes.push(...changes);out.set(id,entry)}}
 for(const id of new Set([...Object.keys(previous.details??{}),...Object.keys(next.details??{})])){
 const a=previous.details?.[id],b=next.details?.[id],changes=[];
 if(!a&&b)add(changes,"Registro no painel","","Pedido recebido");
 if(a&&!b)add(changes,"Registro no painel","Existente","Removido");
 fields(changes,a,b,detailFields);
 if(a?.arquivo?.motivo!==b?.arquivo?.motivo||a?.arquivo?.observacao!==b?.arquivo?.observacao)fields(changes,a?.arquivo,b?.arquivo,{motivo:"Motivo do arquivamento",observacao:"Observação do arquivamento"});
 record([id],changes);record([...shipmentIds(previous,id),...shipmentIds(next,id)],shipmentChanges(a?.envio,b?.envio));
 }
 // Ignore shifts caused solely by new arrivals; record actual reorderings among existing cards.
 const common=new Set((previous.sequence??[]).filter(id=>(next.sequence??[]).includes(id))),old=(previous.sequence??[]).filter(id=>common.has(id)),sorted=(next.sequence??[]).filter(id=>common.has(id));
 for(const id of common)if(old.indexOf(id)!==sorted.indexOf(id))record([id],[{field:"Prioridade na fila",before:String(previous.sequence.indexOf(id)+1),after:String(next.sequence.indexOf(id)+1)}]);
 for(const id of new Set([...Object.keys(previous.invoices??{}),...Object.keys(next.invoices??{})])){
 const a=previous.invoices?.[id],b=next.invoices?.[id],changes=[],prefix="Invoice "+(b?.number||a?.number||id)+" · ";
 if(!a||!b)add(changes,prefix+"Documento",a?"Existente":"",b?"Criada":"Excluída");
 fields(changes,a,b,invoiceFields,prefix);
 for(const [key,label] of [["shipper","Remetente"],["consignee","Destinatário"],["buyer","Comprador"]])fields(changes,a?.[key],b?.[key],partyFields,prefix+label+" · ");
 collection(changes,a?.items,b?.items,invoiceItemFields,prefix+"Produto · ");
 record([...(a?.orderIds??[]),...(b?.orderIds??[])],changes);
 }
 return [...out.values()].map(e=>({...e,relatedOrders:[...e.relatedOrders],changes:[...new Map(e.changes.map(c=>[JSON.stringify(c),c])).values()]}));
}
