"use client";
import {useId,useState,useRef,useLayoutEffect,useEffect,type ReactNode} from "react";
import {CircleHelp} from "lucide-react";
export default function ContextHelp({label,children}:{label:string;children:ReactNode}){
 const id=useId();const [hover,setHover]=useState(false),[pinned,setPinned]=useState(false),[focus,setFocus]=useState(false);
 const open=hover||pinned||focus;
 useEffect(()=>{if(!open)return;const dismiss=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();setHover(false);setFocus(false);setPinned(false)}};document.addEventListener("keydown",dismiss,true);return()=>document.removeEventListener("keydown",dismiss,true)},[open]);
 const tip=useRef<HTMLSpanElement>(null);const [shift,setShift]=useState(0);
 useLayoutEffect(()=>{if(!open){setShift(0);return}const fit=()=>{const el=tip.current;if(!el)return;setShift(current=>{const r=el.getBoundingClientRect(),left=r.left-current,right=r.right-current;return left<12?12-left:right>window.innerWidth-12?window.innerWidth-12-right:0})};fit();window.addEventListener("resize",fit);return()=>window.removeEventListener("resize",fit)},[open]);
 return <span className="context-help" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
 <button type="button" className="context-help-trigger" aria-label={"Ajuda: "+label} aria-expanded={open} aria-describedby={open?id:undefined} onFocus={e=>{if(e.currentTarget.matches(":focus-visible"))setFocus(true)}} onBlur={()=>{setFocus(false);setPinned(false)}} onClick={()=>{setPinned(!pinned);setFocus(false)}} onKeyDown={e=>{if(e.key==="Escape"&&open){e.stopPropagation();setHover(false);setFocus(false);setPinned(false)}}}><CircleHelp size={16} aria-hidden="true"/></button>
 {open&&<span ref={tip} style={{translate:`${shift}px 0`}} id={id} role="tooltip" className="context-help-content">{children}</span>}
 </span>;
}
