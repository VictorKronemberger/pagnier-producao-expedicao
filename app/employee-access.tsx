"use client";
import ThemeToggle from "./theme-toggle";
import {useCallback,useEffect,useRef,useState} from "react";
import {LogIn,MessageSquare,LoaderCircle} from "lucide-react";
import Dashboard from "./production-dashboard";
import {staffNames} from "../lib/staff.mjs";
type Session={employee:string|null;employees:{name:string;registered:boolean}[];error?:string};
class SessionRequestError extends Error {
 constructor(message:string,readonly unavailable=false){super(message)}
}
async function sessionRequest(method="GET",body?:unknown){
 let response:Response;
 try{response=await fetch("/api/chat/session",{method,cache:"no-store",signal:AbortSignal.timeout(15000),headers:{"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})})}
 catch{throw new SessionRequestError("Não foi possível conectar ao painel. Verifique sua conexão e tente novamente.",true)}
 const data=await response.json().catch(()=>null) as Session|null;
 if(!response.ok||!data)throw new SessionRequestError(data?.error||"O serviço de entrada está indisponível. Tente novamente em instantes.",response.status>=500||!data);
 return data;
}
export default function EmployeeAccess(){
 const [employee,setEmployee]=useState<string|null>(null),[locked,setLocked]=useState(false),[accounts,setAccounts]=useState<Session["employees"]>([]),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [serviceError,setServiceError]=useState(""),[checking,setChecking]=useState(false);
 const loading=useRef(false);
 const [name,setName]=useState(""),[pin,setPin]=useState(""),[confirmPin,setConfirmPin]=useState(""),[firstAccess,setFirstAccess]=useState(false);
 const expired=useCallback(()=>{setLocked(true);setPin("");setConfirmPin("");setFirstAccess(false);setError("Sua sessão terminou. Entre novamente para continuar; as edições abertas foram preservadas.")},[]);
 const load=useCallback(async()=>{
  if(loading.current)return;
  loading.current=true;setChecking(true);
  try{const data=await sessionRequest();setEmployee(current=>data.employee??current);setAccounts(data.employees);setServiceError("");setError("")}
  catch(e){setServiceError((e as Error).message)}
  finally{loading.current=false;setChecking(false);setReady(true)}
 },[]);
 useEffect(()=>{void load();window.addEventListener("pagnier-session-expired",expired);return()=>window.removeEventListener("pagnier-session-expired",expired)},[load,expired]);
 async function enter(e:React.FormEvent){e.preventDefault();if(busy||checking||serviceError)return;if(firstAccess&&pin!==confirmPin){setError("Os PINs não conferem.");return}setBusy(true);setError("");try{const data=await sessionRequest("POST",{name:employee||name,pin,register:firstAccess&&!employee});setEmployee(data.employee);setLocked(false);setPin("");setConfirmPin("");setFirstAccess(false);setAccounts(old=>old.map(a=>a.name===data.employee?{...a,registered:true}:a))}catch(e){if(e instanceof SessionRequestError&&e.unavailable)setServiceError(e.message);else setError((e as Error).message)}finally{setBusy(false)}}
 const leave=useCallback(async()=>{await sessionRequest("DELETE");setEmployee(null);setLocked(false);setName("");setPin("");setConfirmPin("");setFirstAccess(false);setError("")},[]);
 return <>
 {employee&&<div hidden={locked} inert={locked}><Dashboard employee={employee} sessionActive={!locked} onSessionExpired={expired} onSignOut={leave}/></div>}
 {(!employee||locked)&&<main className="employee-access"><section className="employee-login-card" aria-label="Entrada dos funcionários"><ThemeToggle/><img className="employee-login-logo" src="/pagnier-logo-botanico.png" alt="Pagnier Comércio"/><span className="employee-login-eyebrow">PRODUÇÃO E EXPEDIÇÃO</span>{!ready?<p className="employee-login-loading"><LoaderCircle size={20} className="spin"/>Verificando sua entrada…</p>:<form className="team-chat-login employee-login-form" onSubmit={enter}><h1>{locked?"Continue de onde parou":firstAccess?"Crie seu acesso":"Entre no painel"}</h1><p>Use seu nome e PIN para acompanhar os pedidos e receber os recados da equipe.</p>{(serviceError||error)&&<div className="employee-login-error" role="alert">{serviceError||error}{serviceError&&<button type="button" disabled={checking} onClick={()=>void load()}>{checking?"Verificando…":"Tentar novamente"}</button>}</div>}<label>Funcionário<select aria-label="Funcionário" value={employee||name} required disabled={busy||!!employee} onChange={e=>{setName(e.target.value);setFirstAccess(false);setPin("");setConfirmPin("");setError("")}}><option value="">Selecione seu nome</option>{staffNames.map(person=><option key={person}>{person}</option>)}</select></label><label>{firstAccess?"Novo PIN":"PIN"}<input aria-label="PIN de acesso" type="password" inputMode="numeric" pattern="[0-9]{4,8}" minLength={4} maxLength={8} autoComplete={firstAccess?"new-password":"current-password"} required disabled={busy} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,""))}/></label>{firstAccess&&<label>Confirme o PIN<input aria-label="Confirmar PIN de acesso" type="password" inputMode="numeric" pattern="[0-9]{4,8}" minLength={4} maxLength={8} autoComplete="new-password" required disabled={busy} value={confirmPin} onChange={e=>setConfirmPin(e.target.value.replace(/\D/g,""))}/></label>}<small>De 4 a 8 números. Use o mesmo PIN que você já criou no chat.</small><button className="button primary" disabled={busy||checking||!!serviceError||!(employee||name)}><LogIn size={17}/>{busy?"Entrando…":firstAccess?"Criar PIN e entrar":"Entrar"}</button>{!employee&&!serviceError&&!checking&&name&&accounts.some(a=>a.name===name&&!a.registered)&&<button type="button" className="text-action" disabled={busy} onClick={()=>{setFirstAccess(!firstAccess);setError("")}}>{firstAccess?"Já tenho um PIN":"Primeiro acesso? Criar meu PIN"}</button>}<div className="employee-login-note"><MessageSquare size={18}/><span>Ao entrar, suas mensagens não lidas aparecem no botão Mensagens, sem precisar abrir o chat.</span></div></form>}</section></main>}
 </>
}
