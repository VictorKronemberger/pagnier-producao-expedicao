import {randomBytes,timingSafeEqual} from "node:crypto";
import {nomusGet} from "../lib/nomus-sync.mjs";
export const nomusPreviewToken=randomBytes(32).toString("hex");
export function nomusPreview(){
 return {name:"nomus-read-only-preview",configureServer(server){
 server.middlewares.use("/__nomus-read",async(req,res)=>{
 const supplied=Buffer.from(String(req.headers["x-nomus-preview"]??""));
 const expected=Buffer.from(nomusPreviewToken);
 if(req.method!=="GET"||supplied.length!==expected.length||!timingSafeEqual(supplied,expected)){res.statusCode=403;res.end();return}
 res.setHeader("Content-Type","application/json");res.setHeader("Cache-Control","no-store");
 try{const path=new URL(req.url,"http://localhost").searchParams.get("path")??"";const data=await nomusGet(path,process.env.NOMUS_API_KEY??"");res.end(JSON.stringify(data))}
 catch(e){res.statusCode=e.status??503;res.end(JSON.stringify({error:"Consulta indisponível."}))}
 });
 }};
}
