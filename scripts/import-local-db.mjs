import {readFileSync} from 'node:fs';
import {neon} from '@neondatabase/serverless';
import {validateTransfer,transferCounts,importTransfer} from './db-transfer.mjs';
try{
 const args=process.argv.slice(2),input=args.find(arg=>arg!=='--apply');
 if(!input)throw Error('Informe o arquivo exportado.');
 const file=JSON.parse(readFileSync(input,'utf8')),data=validateTransfer(file);
 console.log('Arquivo validado: '+JSON.stringify(transferCounts(data)));
 if(!args.includes('--apply'))console.log('Somente validação. Para importar no banco vazio definido em DATABASE_URL, execute novamente com --apply.');
 else{
  if(!process.env.DATABASE_URL)throw Error('DATABASE_URL ausente.');
  await importTransfer(neon(process.env.DATABASE_URL,{fullResults:true}),file);
  console.log('Importação concluída em uma transação. Faça login novamente; PINs preservados, sessões antigas não transferidas.');
 }
}catch{console.error('Importação não concluída. Verifique arquivo, DATABASE_URL, migrações e se o destino está vazio. Não há sobrescrita parcial.');process.exitCode=1}
