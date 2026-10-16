import {neon} from '@neondatabase/serverless';
import {migratePostgres} from './postgres-migrations.mjs';
try{
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL ausente. Configure .env.local ou o ambiente.');
 await migratePostgres(neon(process.env.DATABASE_URL,{fullResults:true}));
 console.log('Migração PostgreSQL concluída. Tabelas existentes preservadas.');
}catch{console.error('Migração não concluída. Confira DATABASE_URL, acesso ao Neon e versão das migrações. Nenhuma credencial foi exibida.');process.exitCode=1}
