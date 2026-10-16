import {createHash} from 'node:crypto';
export const tables={
 production_board:['id','payload','revision','updated_at','updated_by'],
 chat_employees:['name','pin_hash','salt','failures','locked_until'],
 chat_messages:['id','client_id','channel','author','body','mentions','reference_order','created_at'],
 chat_reads:['employee','channel','last_id']
};
const integers=new Set(['revision','failures','locked_until','id:chat_messages','last_id']);
export const digest=data=>createHash('sha256').update(JSON.stringify(data)).digest('hex');
export function validateTransfer(file){
 if(file?.format!=='pagnier-local-v1'||!file.tables||file.checksum!==digest(file.tables))throw Error('Arquivo inválido ou checksum divergente.');
 if(Object.keys(file.tables).sort().join()!==Object.keys(tables).sort().join())throw Error('Tabelas inesperadas.');
 for(const [table,columns] of Object.entries(tables)){
  const rows=file.tables[table];if(!Array.isArray(rows))throw Error('Tabela inválida.');
  for(const row of rows){
   if(!row||Object.keys(row).sort().join()!==[...columns].sort().join())throw Error('Colunas inválidas.');
   for(const column of columns){
    const numeric=integers.has(column)||integers.has(column+':'+table),value=row[column];
    if(numeric?(!Number.isSafeInteger(value)||value<0):typeof value!=='string')throw Error('Valor inválido.');
   }
   if(table==='production_board')JSON.parse(row.payload);
   if(table==='chat_messages'&&!Array.isArray(JSON.parse(row.mentions)))throw Error('Menções inválidas.');
  }
 }
 return file.tables;
}
export function transferCounts(data){return Object.fromEntries(Object.entries(data).map(([name,rows])=>[name,rows.length]))}
export async function importTransfer(sql,file){
 const data=validateTransfer(file);
 // One transaction and an exclusive lock: nothing is overwritten, even if users
 // begin using the target while an import is being prepared.
 const statements=[sql.query('LOCK TABLE production_board,chat_employees,chat_sessions,chat_messages,chat_reads IN ACCESS EXCLUSIVE MODE'),sql.query(`DO $$ BEGIN IF EXISTS(SELECT 1 FROM production_board) OR EXISTS(SELECT 1 FROM chat_employees) OR EXISTS(SELECT 1 FROM chat_sessions) OR EXISTS(SELECT 1 FROM chat_messages) OR EXISTS(SELECT 1 FROM chat_reads) THEN RAISE EXCEPTION 'Destination must be empty'; END IF; END $$`)];
 for(const [table,columns] of Object.entries(tables)){
  for(let offset=0;offset<data[table].length;offset+=100){
   const rows=data[table].slice(offset,offset+100),values=[];
   const tuples=rows.map(row=>'('+columns.map(column=>{values.push(row[column]);return '$'+values.length}).join(',')+')');
   statements.push(sql.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES ${tuples.join(',')}`,values));
  }
 }
 statements.push(sql.query("SELECT setval(pg_get_serial_sequence('chat_messages','id'),COALESCE(MAX(id),1),COUNT(*)>0) FROM chat_messages"));
 // Check exact row counts before committing the same transaction.
 const checks=Object.entries(data).map(([table,rows])=>`(SELECT COUNT(*) FROM ${table})<>${rows.length}`).join(' OR ');
 statements.push(sql.query(`DO $$ BEGIN IF ${checks} THEN RAISE EXCEPTION 'Import count mismatch'; END IF; END $$`));
 await sql.transaction(statements);
 return transferCounts(data);
}
