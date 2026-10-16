import {neon} from "@neondatabase/serverless";
import {createPostgresDatabase,type PostgresDatabase} from "./postgres-adapter.mjs";
let database:PostgresDatabase|undefined;
export const env={
 get DB(){
  if(!process.env.DATABASE_URL)return undefined;
  return database??=createPostgresDatabase(neon(process.env.DATABASE_URL,{fullResults:true}));
 },
 get NOMUS_API_KEY(){return process.env.NOMUS_API_KEY??""}
};
