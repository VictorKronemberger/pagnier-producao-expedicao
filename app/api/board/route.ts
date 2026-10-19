import {assertReleaseTransitions} from "../../../lib/order-release.mjs";
import {operationalGroups,stockEligibility} from "../../../lib/stock-orders.mjs";
import {assertDispatchTransitions} from "../../../lib/dispatch.mjs";
import {deleteDraftInvoice,assertNoInvoiceRemoval} from "../../../lib/invoice-delete.mjs";
import {normalizeBoxModels} from "../../../lib/box-models.mjs";
import {deleteDraftPacking,packingOrderIds} from "../../../lib/packing-delete.mjs";
import {visibleOrderState} from "../../../lib/order-visibility.mjs";
import {normalizeInvoices} from "../../../lib/invoice.mjs";
import {validateGroups,shipmentOps} from "../../../lib/shipment-groups.mjs";
import {scopeBoard,preserveExcludedNotes} from "../../../lib/company-scope.mjs";
import {env} from "../../../lib/server-env";
import {getPanelUser} from "../../employee-auth";
import {publicSync} from "../../../lib/nomus-sync.mjs";
import {readNomus} from "../../../lib/nomus-store";
import {normalizeShipment,type Shipment} from "../../../lib/shipping.mjs";
export const dynamic="force-dynamic";

const states=["A programar","Programado","Em acompanhamento","Bloqueado","Concluído","Pronto para envio e documentação","Pronto para envio","Atendido totalmente e enviado"];
function json(data:unknown,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store"}})}
export async function GET(){
 if(!await getPanelUser())return json({error:"Entre para acessar o painel."},401);
 if(!env.DB)return json({error:"Banco indisponível."},503);
 try{
 const nomusState=visibleOrderState((await readNomus()).state);const snapshot=publicSync(nomusState,false).snapshot;
 const row=await env.DB.prepare("SELECT payload, revision, updated_at, updated_by FROM production_board WHERE id = ?").bind("main").first<{payload:string;revision:number;updated_at:string;updated_by:string}>();
 return json({snapshot,board:scopeBoard(row?JSON.parse(row.payload):{sequence:[],details:{}},nomusState.hiddenOrderCodes),revision:row?.revision??0,updatedAt:row?.updated_at??null,updatedBy:row?.updated_by??null});
 }catch{return json({error:"Não foi possível carregar as prioridades. Tente novamente."},503)}
}
export async function PUT(request:Request){
 const user=await getPanelUser();if(!user)return json({error:"Entre para salvar."},401);
 const origin=request.headers.get("origin");if(!origin||origin!==new URL(request.url).origin)return json({error:"Origem inválida."},403);
 if(!env.DB)return json({error:"Banco indisponível."},503);
 let data;try{const raw=await request.text();if(new TextEncoder().encode(raw).length>1000000)return json({error:"Conteúdo muito grande."},413);data=JSON.parse(raw)}catch{return json({error:"Dados inválidos."},400)}
 let snapshot:any,previous:any,excludedCodes:any;try{const state=visibleOrderState((await readNomus()).state);snapshot=publicSync(state,false).snapshot;excludedCodes=state.hiddenOrderCodes;const saved=await env.DB.prepare("SELECT payload FROM production_board WHERE id=?").bind("main").first<{payload:string}>();previous=saved?JSON.parse(saved.payload):{details:{}};}catch{return json({error:"Banco indisponível. Suas edições permanecem na tela."},503)}
 const available=[...new Map([...snapshot.grupos,...(snapshot.pedidos??[])].map((g:any)=>[g.id,g])).values()] as any[];
 const groups=operationalGroups(snapshot,data?.board??{details:{}});
 const allowed=new Set<string>(groups.map((g:any)=>g.id));
 const detailIds=new Set<string>(available.map((g:any)=>g.id));
 const {revision}=data??{};let board=data?.board;if(board&&Array.isArray(board.sequence)&&board.details&&typeof board.details==="object"&&!Array.isArray(board.details))board=scopeBoard(board,excludedCodes);
 if(!Number.isInteger(revision)||revision<0||!board||!Array.isArray(board.sequence)||board.sequence.length>allowed.size||new Set(board.sequence).size!==board.sequence.length||board.sequence.some((id:unknown)=>typeof id!=="string"||!allowed.has(id))||!board.details||typeof board.details!=="object"||Array.isArray(board.details))return json({error:"Fila inválida."},400);
 try{assertReleaseTransitions(previous,board,groups)}catch(e){return json({error:e instanceof Error?e.message:"Confira a liberação do pedido."},400)}
 try{validateGroups(board,groups)}catch(e){return json({error:e instanceof Error?e.message:"Agrupamento inválido."},400)}
 let invoices;try{invoices=normalizeInvoices(board.invoices??scopeBoard({...previous,sequence:previous.sequence??[]},excludedCodes).invoices??{},[...snapshot.grupos,...(snapshot.pedidos??[])].map((p:any)=>p.id))}catch(e){return json({error:e instanceof Error?e.message:"Invoice inválida."},400)}
 try{assertNoInvoiceRemoval(scopeBoard({...previous,sequence:previous.sequence??[]},excludedCodes).invoices,invoices)}catch(e){return json({error:e instanceof Error?e.message:"Exclusão de invoice inválida."},400)}
 let boxModels;try{boxModels=normalizeBoxModels(board.boxModels??previous.boxModels??[])}catch(e){return json({error:e instanceof Error?e.message:"Modelo inválido."},400)}
 const details:Record<string,{responsavel:string;responsavelConferencia:string;nota:string;situacao:string;etiqueta:string;conferidas:string[];expedicao:string[];vistoNomus:string;empresa:string;arquivado?:boolean;atendimentoEstoque?:boolean;envio?:Shipment}>={};
 for(const [id,d] of Object.entries(board.details) as [string,any][]){
 if(!detailIds.has(id)||!d||typeof d.responsavel!=="string"||d.responsavel.length>100||typeof d.nota!=="string"||d.nota.length>1500||!states.includes(d.situacao))return json({error:"Revise responsável, observação e situação."},400);
 if(d.arquivado!==undefined&&typeof d.arquivado!=="boolean")return json({error:"Arquivamento inválido."},400);
 if(d.atendimentoEstoque!==undefined&&typeof d.atendimentoEstoque!=="boolean")return json({error:"Tipo de atendimento inválido."},400);
 if(d.atendimentoEstoque&&!previous.details[id]?.atendimentoEstoque){const reason=stockEligibility(available.find(g=>g.id===id));if(reason)return json({error:reason},400)}
 if(previous.details[id]?.atendimentoEstoque&&!d.atendimentoEstoque)return json({error:"Mantenha o atendimento de estoque para preservar o trabalho deste pedido."},400);
 const responsavelConferencia=d.responsavelConferencia??"";if(typeof responsavelConferencia!=="string"||responsavelConferencia.length>100)return json({error:"Responsável pela conferência inválido."},400);
 const empresa=d.empresa??"";if(!["","Maya","Sacred Connection","Four visions","Katukina","Haux Haux","Nayaku"].includes(empresa))return json({error:"Empresa inválida."},400);
 const etiqueta=d.etiqueta??"";const conferidas=d.conferidas??[];const expedicao=d.expedicao??[];
 const vistoNomus=d.vistoNomus??"";if(typeof vistoNomus!=="string"||vistoNomus.length>30||(vistoNomus&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(vistoNomus)))return json({error:"Confirmação de leitura inválida."},400);
 const opIds=new Set([...(groups.find((g:any)=>g.id===id)?.ordens??[]).map((o:any)=>o.id),...(previous.details[id]?.conferidas??[]),...(previous.details[id]?.expedicao??[])]);
 if(!["","Urgente","Atenção","Normal"].includes(etiqueta)||!Array.isArray(conferidas)||new Set(conferidas).size!==conferidas.length||conferidas.some((v:unknown)=>typeof v!=="string"||!opIds.has(v)))return json({error:"Etiqueta ou checklist inválida."},400);
 if(!Array.isArray(expedicao)||new Set(expedicao).size!==expedicao.length||expedicao.some((v:unknown)=>typeof v!=="string"||!opIds.has(v)))return json({error:"Conferência da expedição inválida."},400);
 let envio:Shipment|undefined;try{envio=d.envio===undefined?previous.details[id]?.envio:normalizeShipment(d.envio,shipmentOps(d.envio,id,groups),previous.details[id]?.envio)}catch(e){return json({error:e instanceof Error?e.message:"Dados de envio inválidos."},400)}
 details[id]={...(d.arquivado?{arquivado:true}:{}),...(d.atendimentoEstoque?{atendimentoEstoque:true}:{}),responsavel:d.responsavel.trim(),responsavelConferencia:responsavelConferencia.trim(),nota:d.nota.trim(),situacao:d.situacao,etiqueta,conferidas,expedicao,vistoNomus,empresa,envio};
 }
 try{assertDispatchTransitions(previous,{...board,details,invoices},groups)}catch(e){return json({error:e instanceof Error?e.message:"Conclua a conferência antes do envio."},400)}
 const payload=JSON.stringify(preserveExcludedNotes(previous,{sequence:board.sequence,details,invoices,boxModels},excludedCodes));const now=new Date().toISOString();
 try{
 let result;
 if(revision===0)result=await env.DB.prepare("INSERT INTO production_board (id,payload,revision,updated_at,updated_by) VALUES (?,?,1,?,?) ON CONFLICT(id) DO NOTHING RETURNING revision").bind("main",payload,now,user.displayName).first();
 else result=await env.DB.prepare("UPDATE production_board SET payload=?,revision=revision+1,updated_at=?,updated_by=? WHERE id=? AND revision=? RETURNING revision").bind(payload,now,user.displayName,"main",revision).first();
 if(!result)return json({error:"Outra sessão atualizou a fila. Suas alterações continuam na tela; anote-as e recarregue antes de salvar."},409);
 return json({revision:revision+1,updatedAt:now,updatedBy:user.displayName});
 }catch{return json({error:"Falha ao salvar. Suas alterações continuam na tela; recarregue as prioridades para conferir o resultado antes de tentar novamente."},503)}
}

export async function DELETE(request:Request){
 const user=await getPanelUser();if(!user)return json({error:"Entre para excluir um documento."},401);
 const origin=request.headers.get("origin");if(!origin||origin!==new URL(request.url).origin)return json({error:"Origem inválida."},403);
 if(!env.DB)return json({error:"Banco indisponível."},503);
 let data;try{const raw=await request.text();if(new TextEncoder().encode(raw).length>2000)return json({error:"Conteúdo muito grande."},413);data=JSON.parse(raw)}catch{return json({error:"Dados inválidos."},400)}
 const isInvoice=data?.kind==="invoice";
 if(!data||![undefined,"packing","invoice"].includes(data.kind)||!Number.isInteger(data.revision)||data.revision<1||(isInvoice?typeof data.invoiceId!=="string"||!(/^[a-zA-Z0-9_-]{1,80}$/).test(data.invoiceId):typeof data.owner!=="string"||!data.owner||data.owner.length>150))return json({error:"Documento inválido."},400);
 try{
 const state=visibleOrderState((await readNomus()).state),snapshot=publicSync(state,false).snapshot;
 const saved=await env.DB.prepare("SELECT payload, revision FROM production_board WHERE id=?").bind("main").first<{payload:string;revision:number}>();
 if(!saved||saved.revision!==data.revision)return json({error:"Outra sessão atualizou o quadro. Recarregue e confira o documento antes de excluir."},409);
 const previous=JSON.parse(saved.payload);let next;
 if(isInvoice){
 const visible=scopeBoard(previous,state.hiddenOrderCodes),invoice=visible.invoices?.[data.invoiceId];
 const allowed=new Set([...snapshot.grupos,...(snapshot.pedidos??[])].map((g:any)=>g.id));
 if(!invoice||invoice.orderIds.some((id:string)=>!allowed.has(id)))return json({error:"Invoice indisponível ou fora do recorte permitido."},400);
 try{next=deleteDraftInvoice(previous,data.invoiceId)}catch(e){return json({error:e instanceof Error?e.message:"Não foi possível excluir esta invoice."},400)}
 }else{
 const allowed=new Set(operationalGroups(snapshot,previous).map((g:any)=>g.id));
 if(packingOrderIds(previous,data.owner).some(id=>!allowed.has(id)))return json({error:"O packing list contém um pedido fora do recorte permitido."},400);
 try{next=deleteDraftPacking(previous,data.owner)}catch(e){return json({error:e instanceof Error?e.message:"Não foi possível excluir este packing list."},400)}
 }
 const now=new Date().toISOString();
 const result=await env.DB.prepare("UPDATE production_board SET payload=?,revision=revision+1,updated_at=?,updated_by=? WHERE id=? AND revision=? RETURNING revision").bind(JSON.stringify(next),now,user.displayName,"main",data.revision).first();
 if(!result)return json({error:"Outra sessão alterou o quadro. Recarregue antes de tentar excluir."},409);
 return json({board:scopeBoard(next,state.hiddenOrderCodes),revision:data.revision+1,updatedAt:now,updatedBy:user.displayName});
 }catch{return json({error:"Não foi possível confirmar a exclusão. Recarregue a lista para conferir antes de tentar novamente."},503)}
}
