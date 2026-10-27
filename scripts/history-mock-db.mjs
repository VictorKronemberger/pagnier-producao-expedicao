// Legacy domain-route fixtures model the board only. Real atomic history writes
// are exercised by check-order-history-api.mjs on both database adapters.
export function enableHistoryBatch(db){
 const prepare=db.prepare.bind(db);
 db.prepare=sql=>sql.startsWith("INSERT INTO production_board")&&sql.includes(" SELECT ")?{bind(){return {first:async()=>null}}}:prepare(sql);
 db.batch=async statements=>{const results=[];for(const s of statements){const row=await s.first();results.push({results:row?[row]:[],success:true,meta:{changes:row?1:0}})}return results};
}
