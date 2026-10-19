import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const schemaSQL=readFileSync(new URL('../migrations/turso/001_initial.sql',import.meta.url),'utf8');
export async function migrateTurso(client){
 const checksum=createHash('sha256').update(schemaSQL).digest('hex');
 // CHECK guards run inside the same write transaction as the schema changes.
 // The guard table is dropped before commit; a failure rolls everything back.
 await client.batch([
  'CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY,checksum TEXT NOT NULL,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE _pagnier_migration_guard(value INTEGER NOT NULL CHECK(value=0))',
  {sql:"INSERT INTO _pagnier_migration_guard SELECT COUNT(*) FROM schema_migrations WHERE name='001_initial' AND checksum<>?",args:[checksum]},
  ...schemaSQL.split('--> statement-breakpoint').map(sql=>sql.trim()),
  {sql:"INSERT INTO schema_migrations(name,checksum) VALUES('001_initial',?) ON CONFLICT(name) DO NOTHING",args:[checksum]},
  'DROP TABLE _pagnier_migration_guard'
 ],'write');
}
