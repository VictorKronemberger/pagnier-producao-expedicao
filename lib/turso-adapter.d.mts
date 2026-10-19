import type {Client,ResultSet} from '@libsql/client';
import type {PostgresDatabase,DatabaseResult} from './postgres-adapter.mjs';
export function normalizeTursoResult(result:ResultSet):DatabaseResult;
export function createTursoDatabase(client:Client):PostgresDatabase;
