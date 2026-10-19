import {neon} from '@neondatabase/serverless';
import {mkdirSync,writeFileSync} from 'node:fs';
import {exportNeon} from './neon-export.mjs';
import {transferCounts} from './db-transfer.mjs';
try{
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL ausente.');
 const file=await exportNeon(neon(process.env.DATABASE_URL,{fullResults:true}));
 const directory=new URL('../backups/',import.meta.url);mkdirSync(directory,{recursive:true});
 const name='neon-'+Date.now()+'.json';
 writeFileSync(new URL(name,directory),JSON.stringify(file),{flag:'wx',mode:0o600});
 console.log('Backup criado em backups/'+name);console.log(JSON.stringify(transferCounts(file.tables)));
 console.log('PINs e dados preservados. Sessões exigirão novo login. Mantenha este arquivo fora do GitHub.');
}catch{console.error('Exportação Neon não concluída. Confira conexão e cota do Neon. A origem não foi alterada; não use um banco vazio como substituto dos dados atuais.');process.exitCode=1}
