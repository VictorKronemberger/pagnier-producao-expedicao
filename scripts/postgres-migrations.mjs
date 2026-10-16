import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const schemaSQL=readFileSync(new URL('../migrations/postgres/001_initial.sql',import.meta.url),'utf8');
export async function migratePostgres(sql){
 const hash=createHash('sha256').update(schemaSQL).digest('hex');
 const guard=`DO $$ BEGIN IF EXISTS(SELECT 1 FROM schema_migrations WHERE name='001_initial' AND checksum<>'${hash}') THEN RAISE EXCEPTION 'Migration checksum mismatch'; END IF; END $$`;
 return sql.transaction([
  sql.query("SELECT pg_advisory_xact_lock(731842901)"),
  sql.query('CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY,checksum TEXT NOT NULL,applied_at TIMESTAMPTZ NOT NULL DEFAULT now())'),
  sql.query(guard),
  ...schemaSQL.split('--> statement-breakpoint').map(s=>sql.query(s.trim())),
  sql.query("INSERT INTO schema_migrations(name,checksum) VALUES('001_initial',$1) ON CONFLICT(name) DO NOTHING",[hash])
 ]);
}
