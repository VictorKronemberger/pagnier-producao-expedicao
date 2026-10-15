import {requestedLotNames} from "./nomus-lots.mjs";
import {applyCompanyScope} from "./company-scope.mjs";
import {env} from "cloudflare:workers";
import snapshot from "./production-snapshot.json";
import {initialSync,syncStep,publicSync,nomusGet} from "./nomus-sync.mjs";
export const nomusKey=()=>((env as unknown as Record<string,string>).NOMUS_API_KEY??"");
export async function readNomus(){
 const db=env.DB;if(!db)throw Error("Banco indisponível.");
 const row=await db.prepare("SELECT payload,revision FROM production_board WHERE id=?").bind("nomus").first<{payload:string;revision:number}>();
 return {state:applyCompanyScope(row?JSON.parse(row.payload):initialSync(snapshot)),revision:row?.revision??0};
}
export async function pollNomus(requestedProduction:string[]=[]){
 const db=env.DB;if(!db)throw Error("Banco indisponível.");
 const {state,revision}=await readNomus(),key=nomusKey();
 if(!key||Date.now()<state.nextAt)return publicSync(state,!!key);
 const now=new Date().toISOString(),lease=JSON.stringify({...state,nextAt:Date.now()+60000});
 let claimed;
 if(revision===0)claimed=await db.prepare("INSERT INTO production_board(id,payload,revision,updated_at,updated_by) VALUES(?,?,1,?,?) ON CONFLICT(id) DO NOTHING RETURNING revision").bind("nomus",lease,now,"Nomus").first();
 else claimed=await db.prepare("UPDATE production_board SET payload=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? RETURNING revision").bind(lease,now,"nomus",revision).first();
 if(!claimed)return publicSync((await readNomus()).state,true);
 const token=(env as unknown as Record<string,string>).NOMUS_PREVIEW_TOKEN;
 const fetcher:typeof fetch=token?async(input,init)=>{const path=String(input).replace("https://pagnier.nomus.com.br/pagnier/rest/","");return fetch("http://127.0.0.1:5173/__nomus-read?path="+encodeURIComponent(path),{method:"GET",headers:{"x-nomus-preview":token},signal:init?.signal})}:fetch;
 const boardRow=await db.prepare("SELECT payload FROM production_board WHERE id=?").bind("main").first<{payload:string}>();
 const requestedLots=requestedLotNames(boardRow?JSON.parse(boardRow.payload):{});
 const next=await syncStep(state,key,{fetcher,requestedLots,requestedProduction,refreshRecentOrders:true});
 await db.prepare("UPDATE production_board SET payload=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?").bind(JSON.stringify(next),now,"nomus",revision+1).run();
 return publicSync((await readNomus()).state,true);
}

export async function readNomusClient(id:number){
 if(!Number.isInteger(id)||id<1)throw Error("Cliente inválido.");
 const token=(env as unknown as Record<string,string>).NOMUS_PREVIEW_TOKEN;
 const fetcher:typeof fetch=token?async(input,init)=>{const path=String(input).replace("https://pagnier.nomus.com.br/pagnier/rest/","");return fetch("http://127.0.0.1:5173/__nomus-read?path="+encodeURIComponent(path),{method:"GET",headers:{"x-nomus-preview":token},signal:init?.signal})}:fetch;
 return nomusGet("clientes/"+id,nomusKey(),fetcher);
}
