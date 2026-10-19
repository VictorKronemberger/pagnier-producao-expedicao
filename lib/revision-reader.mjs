// Only one bounded payload per database instance. Validate the revision in SQL
// on every read; no time-based stale cache and no cached authentication.
export function createRevisionReader(id,{maxLength=4_000_000}={}){
 const cache=new WeakMap();
 return async function read(db){
  const previous=cache.get(db);
  const row=await db.prepare('SELECT revision,CASE WHEN revision=? THEN NULL ELSE payload END AS payload FROM production_board WHERE id=?').bind(previous?.revision??-1,id).first();
  if(!row){cache.delete(db);return null}
  const payload=row.payload??previous?.payload;
  if(typeof payload!=='string')throw Error('Missing revision payload.');
  if(payload.length<=maxLength)cache.set(db,{revision:row.revision,payload});else cache.delete(db);
  return {revision:row.revision,payload};
 };
}
