import {neon} from "@neondatabase/serverless";
import {createClient} from "@libsql/client/web";
import {createPostgresDatabase,type PostgresDatabase} from "./postgres-adapter.mjs";
import {createTursoDatabase} from "./turso-adapter.mjs";
import {databaseProvider,tursoConfig} from "./database-config.mjs";
let database:PostgresDatabase|undefined;
export const env={
 get DB(){
  if(database)return database;
  if(databaseProvider(process.env)==="turso")return database=createTursoDatabase(createClient(tursoConfig(process.env)));
  if(!process.env.DATABASE_URL)return undefined;
  return database=createPostgresDatabase(neon(process.env.DATABASE_URL,{fullResults:true}));
 },
 get CRON_SECRET(){return process.env.CRON_SECRET??""},
 get NOMUS_API_KEY(){return process.env.NOMUS_API_KEY??""}
};
