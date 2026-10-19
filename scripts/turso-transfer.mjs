import {tables,validateTransfer,transferCounts} from './db-transfer.mjs';
export async function importTurso(client,file){
 const data=validateTransfer(file);
 const queries=[
  'CREATE TABLE _pagnier_import_guard(value INTEGER NOT NULL CHECK(value=0))',
  'INSERT INTO _pagnier_import_guard SELECT '+[...Object.keys(tables),'chat_sessions'].map(table=>`(SELECT COUNT(*) FROM ${table})`).join('+')
 ];
 for(const [table,columns] of Object.entries(tables)){
  for(let offset=0;offset<data[table].length;offset+=50){
   const rows=data[table].slice(offset,offset+50),args=[];
   const values=rows.map(row=>'('+columns.map(column=>{args.push(row[column]);return '?'}).join(',')+')');
   queries.push({sql:`INSERT INTO ${table} (${columns.join(',')}) VALUES ${values.join(',')}`,args});
  }
 }
 // Explicit IDs advance SQLite AUTOINCREMENT; no sequence reset is needed.
 for(const [table,rows] of Object.entries(data))queries.push({sql:`INSERT INTO _pagnier_import_guard SELECT ABS(COUNT(*)-?) FROM ${table}`,args:[rows.length]});
 queries.push('DROP TABLE _pagnier_import_guard');
 // A single server-side transaction avoids interactive transaction timeouts and
 // rejects an occupied destination before inserting anything.
 await client.batch(queries,'write');return transferCounts(data);
}
