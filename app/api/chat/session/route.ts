import {staffNames} from "../../../../lib/staff.mjs";
import {loginChat,sessionEmployee,tokenHash} from "../../../../lib/team-chat.mjs";
import {chatDatabase,chatToken,sessionResponse,chatBody,chatJson,chatFailure} from "../../../../lib/chat-server";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{const db=await chatDatabase(request);const accounts=await db.prepare("SELECT name FROM chat_employees").all<{name:string}>();const token=chatToken(request),employee=await sessionEmployee(db,token),data={employee,employees:staffNames.map(name=>({name,registered:accounts.results.some(a=>a.name===name)}))};return employee&&!request.headers.get("cookie")?.includes("pagnier_employee=")?sessionResponse(request,data,token):chatJson(data)}catch(e){return chatFailure(e)}}
export async function POST(request:Request){try{const db=await chatDatabase(request,true),input=await chatBody(request);const result=await loginChat(db,input);return sessionResponse(request,{employee:result.name},result.token)}catch(e){return chatFailure(e)}}
export async function DELETE(request:Request){try{const db=await chatDatabase(request,true);await db.prepare("DELETE FROM chat_sessions WHERE token_hash=?").bind(await tokenHash(chatToken(request))).run();return sessionResponse(request,{ok:true},"")}catch(e){return chatFailure(e)}}
