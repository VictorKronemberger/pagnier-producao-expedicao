import {createClient} from '@libsql/client/web';
import {createTursoDatabase} from '../lib/turso-adapter.mjs';
import {tursoConfig,databaseProvider} from '../lib/database-config.mjs';
import {initialSync,publicSync} from '../lib/nomus-sync.mjs';
import {bootstrapNomus} from '../lib/nomus-bootstrap.mjs';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
let client,db,revision,state,owned=false,lastSaved;
let serverEpoch,startedAt;
const clock=()=>serverEpoch+(performance.now()-startedAt);
const timestamp=()=>new Date(clock()).toISOString();
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function persist(next){
 const payload=JSON.stringify({...next,leaseUntil:clock()+120000,nextAt:clock()+120000});
 const saved=await db.prepare('UPDATE production_board SET payload=?,revision=revision+1,updated_at=?,updated_by=? WHERE id=? AND revision=? RETURNING revision').bind(payload,timestamp(),'Nomus','nomus',revision).first();
 if(!saved){owned=false;throw Error('Capture lease lost; no concurrent changes overwritten.')}
 revision=saved.revision;state=next;lastSaved=structuredClone(next);
}
try{
 if(databaseProvider(process.env)!=='turso'||!process.env.NOMUS_API_KEY)throw Error('Configure Turso and Nomus before capturing.');
 client=createClient(tursoConfig(process.env));db=createTursoDatabase(client);
 // Use database time: the operator computer can be minutes behind Vercel.
 const time=await db.prepare("SELECT CAST(strftime('%s','now') AS INTEGER)*1000 AS clock").first();
 serverEpoch=Number(time.clock);startedAt=performance.now();
 for(let attempt=0;attempt<40;attempt++){
  const row=await db.prepare('SELECT payload,revision FROM production_board WHERE id=?').bind('nomus').first();
  state=row?JSON.parse(row.payload):initialSync(JSON.parse(readFileSync(new URL('../lib/production-snapshot.json',import.meta.url),'utf8')));revision=row?.revision??0;
  if(clock()<(state.leaseUntil??0)||clock()<(state.retryAt??0)){await pause(2000);continue}
  const dir=new URL('../backups/',import.meta.url);mkdirSync(dir,{recursive:true});
  writeFileSync(new URL('before-nomus-capture-'+Date.now()+'.json',dir),JSON.stringify({revision,state}),{flag:'wx',mode:0o600});
  const payload=JSON.stringify({...state,leaseUntil:clock()+120000,nextAt:clock()+120000});
  const now=timestamp();
  const claimed=revision?await db.prepare('UPDATE production_board SET payload=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? RETURNING revision').bind(payload,now,'nomus',revision).first():await db.prepare('INSERT INTO production_board(id,payload,revision,updated_at,updated_by) VALUES(?,?,1,?,?) ON CONFLICT(id) DO NOTHING RETURNING revision').bind('nomus',payload,now,'Nomus').first();
  if(claimed){revision=claimed.revision;owned=true;lastSaved=structuredClone(state);break}
 }
 if(!owned)throw Error('Another capture is active.');
 console.log('Capture started. ERP access: GET only. Shared lease acquired.');
 state=await bootstrapNomus(state,process.env.NOMUS_API_KEY,{refresh:process.argv.includes('--refresh'),includeProduction:process.argv.includes('--production'),verifyOrders:process.argv.includes('--verify-orders'),now:timestamp,pause:()=>pause(3000),checkpoint:async(next,progress)=>{
  await persist(next);
  console.log(JSON.stringify({...progress,orders:Object.keys(next.orders??{}).length,ops:Object.keys(next.ops??{}).length,pendingOps:Object.keys(next.pendingOps??{}).length,revision}));
 }});
 const view=publicSync(state,true);
 console.log('Capture complete:',JSON.stringify({orders:view.snapshot.pedidos.length,groups:view.snapshot.grupos.length,unlinked:view.snapshot.semVinculo.length,identified:view.pedidosIdentificados,partial:view.partial,lastChecked:view.lastChecked}));
}catch(error){console.error('Capture stopped:',error instanceof Error?error.message:'Unknown failure');process.exitCode=1}
finally{
 if(owned&&lastSaved){
  const next={...lastSaved};delete next.leaseUntil;next.nextAt=Math.max(clock()+22000,next.retryAt??0);
  try{await db.prepare('UPDATE production_board SET payload=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(JSON.stringify(next),timestamp(),'nomus',revision).run()}catch{console.error('Lease release could not be confirmed; it expires automatically.');process.exitCode=1}
 }
 client?.close();
}
