import {tables,digest,validateTransfer} from './db-transfer.mjs';
// One repeatable-read, read-only transaction captures all operational tables together.
export async function exportNeon(sql){
 const entries=Object.entries(tables);
 const results=await sql.transaction(entries.map(([table,columns])=>sql.query(`SELECT ${columns.join(',')} FROM ${table}`)),{isolationLevel:'RepeatableRead',readOnly:true,fullResults:true,arrayMode:false});
 const data={};
 for(let i=0;i<entries.length;i++){
  const [table,columns]=entries[i];
  const numeric=new Set(['revision','failures','locked_until','last_id',...(table==='chat_messages'?['id']:[])]);
  data[table]=results[i].rows.map(row=>Object.fromEntries(columns.map(column=>[column,numeric.has(column)?Number(row[column]):row[column]])));
 }
 const file={format:'pagnier-local-v1',source:'neon',createdAt:new Date().toISOString(),tables:data,checksum:digest(data)};
 validateTransfer(file);return file;
}
