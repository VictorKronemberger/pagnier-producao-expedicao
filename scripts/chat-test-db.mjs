import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
export function chatTestDatabase(){
 const sqlite=new DatabaseSync(":memory:");sqlite.exec(readFileSync(new URL("../drizzle/0001_pink_skreet.sql",import.meta.url),"utf8"));
 const db={prepare(sql){let values=[];const statement={bind(...args){values=args;return statement},async first(){return sqlite.prepare(sql).get(...values)??null},async all(){return {results:sqlite.prepare(sql).all(...values)}},async run(){return sqlite.prepare(sql).run(...values)}};return statement},async batch(statements){sqlite.exec("BEGIN");try{const results=[];for(const s of statements)results.push(await s.run());sqlite.exec("COMMIT");return results}catch(error){sqlite.exec("ROLLBACK");throw error}}};return {db,sqlite};
}
