import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {tables,digest,validateTransfer,transferCounts} from './db-transfer.mjs';
let sqlite;
try{
 const input=process.argv[2];
 if(!input||!existsSync(input))throw Error('Informe o caminho do banco SQLite local existente.');
 sqlite=new DatabaseSync(resolve(input),{readOnly:true});sqlite.exec('BEGIN');
 const data={};
 for(const [table,columns] of Object.entries(tables)){
  const exists=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
  if(!exists&&table==='production_board')throw Error('Banco incorreto: production_board não existe.');
  data[table]=exists?sqlite.prepare(`SELECT ${columns.join(',')} FROM ${table}`).all():[];
 }
 sqlite.exec('COMMIT');sqlite.close();sqlite=null;
 const file={format:'pagnier-local-v1',createdAt:new Date().toISOString(),tables:data,checksum:digest(data)};
 validateTransfer(file);
 const directory=new URL('../backups/',import.meta.url);mkdirSync(directory,{recursive:true});
 const output=new URL('pagnier-'+Date.now()+'.json',directory);
 writeFileSync(output,JSON.stringify(file),{flag:'wx',mode:0o600});
 console.log('Backup criado em backups/'+output.pathname.split('/').pop());
 console.log(JSON.stringify(transferCounts(data)));
 console.log('Contém dados privados e hashes dos PINs. Guarde fora do GitHub. Sessões não são exportadas.');
}catch{console.error('Exportação não concluída. Confira o caminho do SQLite, permissões e estrutura. A origem permanece intacta.');process.exitCode=1}
finally{sqlite?.close()}
