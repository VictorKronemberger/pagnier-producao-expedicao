import {headers} from "next/headers";
import {env} from "../lib/server-env";
import {sessionEmployee} from "../lib/team-chat.mjs";
export async function getPanelUser(){
 const cookie=(await headers()).get("cookie")??"";
 const token=cookie.split(";").map(value=>value.trim()).find(value=>value.startsWith("pagnier_employee="))?.slice(17)??"";
 if(!token||!env.DB)return null;
 const employee=await sessionEmployee(env.DB,token);
 return employee?{displayName:employee}:null;
}
