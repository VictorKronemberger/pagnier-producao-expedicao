import {archiveMissingOrders} from "./order-archive.mjs";
import {visibleOrderState} from "./order-visibility.mjs";
// The board has its own revision. Re-read on conflict and never replace concurrent
// edits with the board captured before an ERP request. Also reject stale ERP evidence.
export async function reconcileNomusArchives(db,state,nomusRevision,now=new Date().toISOString()){
 const scoped=visibleOrderState(state);
 if(!Object.values(scoped.orderAbsences??{}).some(e=>e.confirmedAt))return false;
 for(let attempt=0;attempt<3;attempt++){
  const current=await db.prepare("SELECT revision FROM production_board WHERE id=?").bind("nomus").first();
  if(current?.revision!==nomusRevision)return false;
  const row=await db.prepare("SELECT payload, revision FROM production_board WHERE id=?").bind("main").first();
  const previous=row?JSON.parse(row.payload):{sequence:[],details:{}};
  const next=archiveMissingOrders(previous,scoped,now);
  if(next===previous)return false;
  const payload=JSON.stringify(next),actor="Nomus · automático";
  const result=row?
   await db.prepare("UPDATE production_board SET payload=?,revision=revision+1,updated_at=?,updated_by=? WHERE id=? AND revision=? AND EXISTS (SELECT 1 FROM production_board WHERE id=? AND revision=?) RETURNING revision").bind(payload,now,actor,"main",row.revision,"nomus",nomusRevision).first():
   await db.prepare("INSERT INTO production_board(id,payload,revision,updated_at,updated_by) SELECT ?,?,1,?,? WHERE EXISTS (SELECT 1 FROM production_board WHERE id=? AND revision=?) ON CONFLICT(id) DO NOTHING RETURNING revision").bind("main",payload,now,actor,"nomus",nomusRevision).first();
  if(result)return true;
 }
 throw Error("Quadro atualizado por outra sessão; arquivamento será repetido na próxima sincronização.");
}
