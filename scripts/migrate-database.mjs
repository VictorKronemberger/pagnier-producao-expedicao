import {databaseProvider} from '../lib/database-config.mjs';
try{await import(databaseProvider(process.env)==='turso'?'./migrate-turso.mjs':'./migrate-postgres.mjs')}
catch{console.error('Configure DATABASE_PROVIDER como turso ou neon.');process.exitCode=1}
