import assert from "node:assert/strict";
import {createClient} from "@libsql/client";
import {createTursoDatabase} from "../lib/turso-adapter.mjs";
import {reconcileNomusArchives} from "../lib/nomus-archive-store.mjs";
import {migrateTurso} from "./turso-migrations.mjs";
const client=createClient({url:":memory:",intMode:"bigint"}),db=createTursoDatabase(client);
const code="PD 900001",now="2026-10-20T15:00:00.000Z";
const state={snapshot:{grupos:[{id:code,ordens:[]}]},orders:{11:{code,companyId:1,createdDate:"2026-10-01"}},orderAbsences:{11:{code,confirmedAt:now,firstMissingAt:now,lastScanAt:now,scans:2,detailMisses:2,status:400}}};
const initial={sequence:[],details:{[code]:{responsavel:"Victor",nota:"Original",situacao:"Programado",envio:{caixas:[{id:"box"}]}}},invoices:{inv:{orderIds:[code]}}};
async function row(){const r=await db.prepare("SELECT payload, revision FROM production_board WHERE id=?").bind("main").first();return r?{board:JSON.parse(r.payload),revision:r.revision}:null}
function racingDB(action){let intercepted=false;return {prepare(sql){const statement=db.prepare(sql);return {bind(...args){const bound=statement.bind(...args);return {async first(...params){if(!intercepted&&sql.startsWith("UPDATE production_board SET payload=?")){intercepted=true;await action()}return bound.first(...params)}}}}}}}
try{
 await migrateTurso(client);
 await db.prepare("INSERT INTO production_board(id,payload,revision,updated_at,updated_by) VALUES(?,?,1,?,?)").bind("nomus",JSON.stringify(state),now,"Nomus").run();
 // First ever board is supported; no user browser needs to create it first.
 assert(await reconcileNomusArchives(db,state,1,now));assert.equal((await row()).revision,1);
 await db.prepare("UPDATE production_board SET payload=?,revision=revision+1 WHERE id=?").bind(JSON.stringify(initial),"main").run();
 const concurrent=racingDB(async()=>{const current=await row();current.board.details[code].nota="Edição concorrente";current.board.invoices.new={orderIds:[code]};await db.prepare("UPDATE production_board SET payload=?,revision=revision+1 WHERE id=?").bind(JSON.stringify(current.board),"main").run()});
 assert(await reconcileNomusArchives(concurrent,state,1,now));let current=await row();assert.equal(current.board.details[code].nota,"Edição concorrente");assert(current.board.invoices.new);assert(current.board.details[code].arquivado);assert.deepEqual(current.board.details[code].envio,initial.details[code].envio);
 const revision=current.revision;assert.equal(await reconcileNomusArchives(db,state,1,now),false);assert.equal((await row()).revision,revision);
 await db.prepare("UPDATE production_board SET payload=?,revision=revision+1 WHERE id=?").bind(JSON.stringify(initial),"main").run();
 // A newer ERP state invalidates pending evidence even between read and write.
 const changedERP=racingDB(async()=>{await db.prepare("UPDATE production_board SET payload=?,revision=revision+1 WHERE id=?").bind(JSON.stringify({...state,orderAbsences:{}}),"nomus").run()});
 assert.equal(await reconcileNomusArchives(changedERP,state,1,now),false);assert(!(await row()).board.details[code].arquivado);
 // Orders outside the company's/date scope cannot be archived by this job.
 const hidden={...state,hiddenOrderCodes:{[code]:true}};assert.equal(await reconcileNomusArchives(db,hidden,2,now),false);assert(!(await row()).board.details[code].arquivado);
 console.log("OK automatic archive store: in-memory Turso, initial insert, concurrent edits preserved, idempotence, stale ERP evidence rejected and scope respected.");
}finally{client.close()}
