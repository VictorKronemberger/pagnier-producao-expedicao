import {createRevisionReader} from "./revision-reader.mjs";
import {requestedLotNames} from "./nomus-lots.mjs";
import {applyCompanyScope} from "./company-scope.mjs";
import {env} from "./server-env";
import snapshot from "./production-snapshot.json";
import {initialSync,publicSync,nomusGet,syncStep} from "./nomus-sync.mjs";
export const nomusKey=()=>((env as unknown as Record<string,string>).NOMUS_API_KEY??"");
const readNomusRow=createRevisionReader("nomus");
export async function readNomus(){
 const db=env.DB;if(!db)throw Error("Banco indisponível.");
 const row=await readNomusRow(db);
 return {state:applyCompanyScope(row?JSON.parse(row.payload):initialSync(snapshot)),revision:row?.revision??0};
}
export async function pollNomus(requestedProduction:string[]=[],manualRefresh=false,knownRevision?:number,requestedOrder=""){
 const db=env.DB;if(!db)throw Error("Banco indisponível.");
 const {state,revision}=await readNomus(),key=nomusKey();
 const stamp=Date.now();
 const reply=(current:typeof state,currentRevision:number,status:string)=>knownRevision===currentRevision?
  {unchanged:true,nomusRevision:currentRevision,refreshStatus:status,configured:!!key,lastChecked:current.lastChecked,message:key?current.message:"Conexão com o Nomus não configurada."}:
  {...publicSync(current,!!key),nomusRevision:currentRevision,refreshStatus:status};
 if(!key)return reply(state,revision,"unconfigured");
 if(stamp<(state.leaseUntil??0))return reply(state,revision,"busy");
 if(stamp<(state.retryAt??0)||manualRefresh&&stamp<(state.manualNextAt??0))return reply(state,revision,"cooldown");
 if(!manualRefresh&&stamp<state.nextAt)return reply(state,revision,"cached");
 const now=new Date(stamp).toISOString(),lease=JSON.stringify({...state,nextAt:stamp+60000,leaseUntil:stamp+60000});
 let claimed;
 if(revision===0)claimed=await db.prepare("INSERT INTO production_board(id,payload,revision,updated_at,updated_by) VALUES(?,?,1,?,?) ON CONFLICT(id) DO NOTHING RETURNING revision").bind("nomus",lease,now,"Nomus").first();
 else claimed=await db.prepare("UPDATE production_board SET payload=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? RETURNING revision").bind(lease,now,"nomus",revision).first();
 if(!claimed){const latest=await readNomus();return reply(latest.state,latest.revision,"busy")}
 const fetcher:typeof fetch=fetch;
 const boardRow=await db.prepare("SELECT payload FROM production_board WHERE id=?").bind("main").first<{payload:string}>();
 const requestedLots=requestedLotNames(boardRow?JSON.parse(boardRow.payload):{});
 const next=await syncStep(manualRefresh?{...state,nextAt:0}:state,key,{fetcher,requestedLots,requestedProduction,requestedOrder,refreshOrder:manualRefresh,refreshRecentOrders:true});
 delete next.leaseUntil;
 if(manualRefresh)next.manualNextAt=Date.now()+10000;
 const saved=await db.prepare("UPDATE production_board SET payload=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? RETURNING revision").bind(JSON.stringify(next),new Date().toISOString(),"nomus",revision+1).first<{revision:number}>();
 if(saved)return reply(next,saved.revision,next.retryAt?"failed":"updated");
 const latest=await readNomus();return reply(latest.state,latest.revision,"busy");
}

export async function readNomusClient(id:number){
 if(!Number.isInteger(id)||id<1)throw Error("Cliente inválido.");
 const fetcher:typeof fetch=fetch;
 return nomusGet("clientes/"+id,nomusKey(),fetcher);
}

export async function readNomusProduct(id:number){
 if(!Number.isInteger(id)||id<1)throw Error("Produto inválido.");
 const fetcher:typeof fetch=fetch;
 return nomusGet("produtos/"+id,nomusKey(),fetcher);
}
