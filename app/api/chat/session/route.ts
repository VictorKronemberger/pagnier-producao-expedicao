import {staffNames} from "../../../../lib/staff.mjs";
import {loginChat,sessionEmployee,tokenHash} from "../../../../lib/team-chat.mjs";
import {chatDatabase,chatToken,chatCookie,chatBody,chatJson,chatFailure} from "../../../../lib/chat-server";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{const db=await chatDatabase(request);const accounts=await db.prepare("SELECT name FROM chat_employees").all<{name:string}>();return chatJson({employee:await sessionEmployee(db,chatToken(request)),employees:staffNames.map(name=>({name,registered:accounts.results.some(a=>a.name===name)}))})}catch(e){return chatFailure(e)}}
export async function POST(request:Request){try{const db=await chatDatabase(request,true),input=await chatBody(request);const result=await loginChat(db,input);return chatJson({employee:result.name},200,{"Set-Cookie":chatCookie(request,result.token)})}catch(e){return chatFailure(e)}}
export async function DELETE(request:Request){try{const db=await chatDatabase(request,true);await db.prepare("DELETE FROM chat_sessions WHERE token_hash=?").bind(await tokenHash(chatToken(request))).run();return chatJson({ok:true},200,{"Set-Cookie":chatCookie(request,"")})}catch(e){return chatFailure(e)}}
