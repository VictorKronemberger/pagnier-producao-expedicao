import {readFileSync} from 'node:fs';
import {createClient} from '@libsql/client/web';
import {tursoConfig} from '../lib/database-config.mjs';
import {validateTransfer,transferCounts} from './db-transfer.mjs';
import {importTurso} from './turso-transfer.mjs';
let client;
try{
 const args=process.argv.slice(2),input=args.find(arg=>arg!=='--apply');
 if(!input)throw Error('Informe o backup.');
 const file=JSON.parse(readFileSync(input,'utf8')),data=validateTransfer(file);
 console.log('Arquivo validado: '+JSON.stringify(transferCounts(data)));
 if(!args.includes('--apply'))console.log('Somente validação. Para importar no Turso vazio, execute novamente com --apply.');
 else{
  client=createClient(tursoConfig(process.env));await importTurso(client,file);
  console.log('Transferência concluída em uma transação. PINs preservados. Entre novamente no painel.');
 }
}catch{console.error('Importação Turso não concluída. Confira backup, URL, token, migrações e destino vazio. Se a resposta se perdeu, confira o destino antes de repetir: nada é sobrescrito.');process.exitCode=1}
finally{client?.close()}
