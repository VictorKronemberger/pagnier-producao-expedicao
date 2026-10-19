import {createClient} from '@libsql/client/web';
import {tursoConfig} from '../lib/database-config.mjs';
import {migrateTurso} from './turso-migrations.mjs';
let client;
try{
 client=createClient(tursoConfig(process.env));await migrateTurso(client);
 console.log('Migração Turso concluída. Tabelas e dados existentes preservados.');
}catch{console.error('Migração Turso não concluída. Confira URL, token de escrita, conectividade e checksum das migrações. Nenhuma credencial foi exibida.');process.exitCode=1}
finally{client?.close()}
