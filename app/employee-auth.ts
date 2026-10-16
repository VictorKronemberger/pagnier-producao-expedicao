import {headers} from "next/headers";
import {env} from "cloudflare:workers";
import {getChatGPTUser} from "./chatgpt-auth";
import {sessionEmployee} from "../lib/team-chat.mjs";
export async function getPanelUser(){
 const user=await getChatGPTUser();if(!user||!env.DB)return null;
 const cookie=(await headers()).get("cookie")??"";
 const token=cookie.split(";").map(value=>value.trim()).find(value=>value.startsWith("pagnier_employee="))?.slice(17)??"";
 const employee=await sessionEmployee(env.DB,token);
 return employee?{...user,displayName:employee}:null;
}
