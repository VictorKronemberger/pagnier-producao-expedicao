import {createHash,randomUUID} from "node:crypto";
import {orderHistoryChanges} from "./order-history.mjs";
const prefix=id=>"order-history:"+createHash("sha256").update(id).digest("hex")+":";
const padded=n=>String(n).padStart(16,"0");
// Separate rows in the existing document store keep history out of board polling/autosave.
// The unique commit marker makes the INSERTs conditional on this exact successful CAS,
// even if two saves by the same person arrive in the same millisecond.
export async function saveBoardWithHistory(db,previous,next,revision,actor,at){
 const commit=randomUUID(),payload=JSON.stringify({...next,_historyCommit:commit});
 const write=revision===0?db.prepare("INSERT INTO production_board (id,payload,revision,updated_at,updated_by) VALUES (?,?,1,?,?) ON CONFLICT(id) DO NOTHING RETURNING revision").bind("main",payload,at,actor):
 db.prepare("UPDATE production_board SET payload=?,revision=revision+1,updated_at=?,updated_by=? WHERE id=? AND revision=? RETURNING revision").bind(payload,at,actor,"main",revision);
 const events=orderHistoryChanges(previous,next);
 if(!events.length)return write.first();
 const records=events.map(event=>db.prepare("INSERT INTO production_board (id,payload,revision,updated_at,updated_by) SELECT ?,?,?,?,? FROM production_board WHERE id=? AND revision=? AND payload LIKE ?").bind(prefix(event.orderId)+padded(revision+1),JSON.stringify(event),revision+1,at,actor,"main",revision+1,'%"_historyCommit":"'+commit+'"%'));
 const results=await db.batch([write,...records]);
 return results[0].results[0]??null;
}
export async function readOrderHistory(db,orderId,before,hidden={}){
 const key=prefix(orderId),upper=before?key+padded(before):key+"~";
 const response=await db.prepare("SELECT id,payload,revision,updated_at,updated_by FROM production_board WHERE id>=? AND id<? ORDER BY id DESC LIMIT 21").bind(key,upper).all();
 const rows=response.results.slice(0,20);
 const entries=rows.flatMap(row=>{const value=JSON.parse(row.payload);if(value.orderId!==orderId||value.relatedOrders.some(id=>hidden[id]))return [];return [{id:row.id,revision:row.revision,at:row.updated_at,actor:row.updated_by,changes:value.changes}]});
 return {entries,nextCursor:response.results.length>20?rows.at(-1).revision:null};
}
