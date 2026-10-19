import {staffNames} from "./staff.mjs";
export class ChatError extends Error {constructor(message,status=400){super(message);this.status=status}}
export const SESSION_DAYS=30;
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
export const randomToken=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export async function tokenHash(token){return hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))}
export async function pinHash(pin,salt){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveBits"]);return hex(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:new TextEncoder().encode(salt),iterations:100000},key,256))}
function equal(a,b){let diff=a.length^b.length;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^(b.charCodeAt(i)||0);return diff===0}
export async function loginChat(db,{name,pin,register},now=Date.now()){
 if(!staffNames.includes(name)||typeof pin!=="string"||!/^\d{4,8}$/.test(pin))throw new ChatError("Escolha seu nome e informe um PIN de 4 a 8 números.");
 let account=await db.prepare("SELECT * FROM chat_employees WHERE name=?").bind(name).first();
 if(register===true){
  if(account)throw new ChatError("Este funcionário já tem PIN. Use Entrar.",409);
  const salt=randomToken(),hash=await pinHash(pin,salt);
  account=await db.prepare("INSERT INTO chat_employees(name,pin_hash,salt,failures,locked_until) VALUES(?,?,?,0,0) ON CONFLICT(name) DO NOTHING RETURNING *").bind(name,hash,salt).first();
  if(!account)throw new ChatError("Este funcionário já tem PIN. Use Entrar.",409);
 }else{
  if(!account)throw new ChatError("Use Primeiro acesso para criar seu PIN.");
  if(account.locked_until>now)throw new ChatError("Muitas tentativas. Aguarde alguns minutos e tente novamente.",429);
  if(!equal(await pinHash(pin,account.salt),account.pin_hash)){
   await db.prepare("UPDATE chat_employees SET failures=CASE WHEN locked_until>0 AND locked_until<=? THEN 1 ELSE failures+1 END, locked_until=CASE WHEN failures>=4 AND (locked_until=0 OR locked_until>?) THEN ? ELSE 0 END WHERE name=?").bind(now,now,now+300000,name).run();
   throw new ChatError("PIN incorreto.",401);
  }
 }
 const token=randomToken();
 await db.batch([
  db.prepare("UPDATE chat_employees SET failures=0,locked_until=0 WHERE name=?").bind(name),
  db.prepare("DELETE FROM chat_sessions WHERE expires_at<=?").bind(now),
  db.prepare("INSERT INTO chat_sessions(token_hash,employee,expires_at) VALUES(?,?,?)").bind(await tokenHash(token),name,now+SESSION_DAYS*86400000)
 ]);
 return {token,name};
}
export async function sessionEmployee(db,token,now=Date.now()){
 if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
 const row=await db.prepare("SELECT employee FROM chat_sessions WHERE token_hash=? AND expires_at>?").bind(await tokenHash(token),now).first();return row?.employee??null;
}
export function assertChannel(channel,allowed){if(channel!=="general"&&!(typeof channel==="string"&&channel.startsWith("order:")&&allowed.has(channel.slice(6))))throw new ChatError("Pedido indisponível para conversa.",404);return channel}
export function validateMessage(input,allowed){
 const channel=assertChannel(input?.channel,allowed),body=typeof input?.body==="string"?input.body.trim():"";
 if(!body||body.length>2000)throw new ChatError("Escreva uma mensagem de até 2.000 caracteres.");
 if(typeof input.clientId!=="string"||!/^[a-zA-Z0-9_-]{10,80}$/.test(input.clientId))throw new ChatError("Identificador da mensagem inválido.");
 const reference=input.reference||"";if(reference&&(typeof reference!=="string"||!allowed.has(reference)))throw new ChatError("Pedido de referência indisponível.");
 const mentions=staffNames.filter(name=>new RegExp("@"+name+"(?![\\p{L}\\p{N}_])","iu").test(body));
 return {channel,body,clientId:input.clientId,reference,mentions};
}
export async function sendMessage(db,employee,input,allowed,now=new Date().toISOString()){
 const m=validateMessage(input,allowed);
 await db.prepare("INSERT INTO chat_messages(client_id,channel,author,body,mentions,reference_order,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(author,client_id) DO NOTHING").bind(m.clientId,m.channel,employee,m.body,JSON.stringify(m.mentions),m.reference,now).run();
 const saved=await db.prepare("SELECT * FROM chat_messages WHERE author=? AND client_id=?").bind(employee,m.clientId).first();
 if(saved.channel!==m.channel||saved.body!==m.body||saved.reference_order!==m.reference)throw new ChatError("Este envio já foi registrado com outro conteúdo.",409);
 return publicMessage(saved);
}
export function publicMessage(m){return {id:m.id,channel:m.channel,author:m.author,body:m.body,mentions:JSON.parse(m.mentions),reference:m.reference_order,createdAt:m.created_at}}
const summaries=new WeakMap();
export async function chatSummary(db,employee,allowed){
 const marker=await db.prepare("SELECT (SELECT COALESCE(MAX(id),0) FROM chat_messages) AS latest,COALESCE(SUM(last_id),0) AS reads FROM chat_reads WHERE employee=?").bind(employee).first();
 let cache=summaries.get(db);if(!cache){cache=new Map();summaries.set(db,cache)}
 const previous=cache.get(employee),key=JSON.stringify(marker);
 const visible=rows=>rows.filter(row=>row.channel==="general"||allowed.has(row.channel.slice(6))).map(row=>({...row}));
 if(previous?.key===key&&Date.now()<previous.expiresAt)return visible(previous.rows);

 const result=await db.prepare(`SELECT m.channel,MAX(m.id) AS lastId,MAX(m.created_at) AS lastAt,COUNT(*) AS count,
 SUM(CASE WHEN m.id>COALESCE(r.last_id,0) AND m.author<>? THEN 1 ELSE 0 END) AS unread,
 SUM(CASE WHEN m.id>COALESCE(r.last_id,0) AND m.author<>? AND EXISTS(SELECT 1 FROM json_each(m.mentions) WHERE value=?) THEN 1 ELSE 0 END) AS mentions
 FROM chat_messages m LEFT JOIN chat_reads r ON r.channel=m.channel AND r.employee=? GROUP BY m.channel ORDER BY lastId DESC`).bind(employee,employee,employee,employee).all();
 if(cache.size>=50)cache.clear();
 cache.set(employee,{key,rows:result.results,expiresAt:Date.now()+60000});
 return visible(result.results);
}
export async function readMessages(db,channel,before=0){
 const query=before?db.prepare("SELECT * FROM chat_messages WHERE channel=? AND id<? ORDER BY id DESC LIMIT 61").bind(channel,before):db.prepare("SELECT * FROM chat_messages WHERE channel=? ORDER BY id DESC LIMIT 61").bind(channel);
 const result=await query.all();
 return {messages:result.results.slice(0,60).reverse().map(publicMessage),hasOlder:result.results.length>60};
}
export async function markRead(db,employee,channel,id){
 if(!Number.isSafeInteger(id)||id<1)throw new ChatError("Leitura inválida.");
 await db.prepare("INSERT INTO chat_reads(employee,channel,last_id) SELECT ?,?,MIN(?,COALESCE(MAX(id),0)) FROM chat_messages WHERE channel=? ON CONFLICT(employee,channel) DO UPDATE SET last_id=MAX(chat_reads.last_id,excluded.last_id)").bind(employee,channel,id,channel).run();
}
