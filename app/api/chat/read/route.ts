import {assertChannel,markRead} from "../../../../lib/team-chat.mjs";
import {chatIdentity,chatAllowedOrders,chatBody,chatJson,chatFailure} from "../../../../lib/chat-server";
export async function POST(request:Request){try{const {db,employee}=await chatIdentity(request,true),input=await chatBody(request),allowed=await chatAllowedOrders();await markRead(db,employee,assertChannel(input.channel,allowed),input.id);return chatJson({ok:true})}catch(e){return chatFailure(e)}}
