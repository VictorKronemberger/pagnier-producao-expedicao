"use client";
import {useEffect,useRef,type ReactNode} from "react";
import styles from "./header-menu.module.css";
export default function HeaderMenu({label,trigger,children,className="",align="end"}:{label:string;trigger:ReactNode;children:ReactNode;className?:string;align?:"start"|"end"}){
 const ref=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{
  const close=(event:PointerEvent)=>{if(!ref.current?.contains(event.target as Node))ref.current?.removeAttribute("open")};
  document.addEventListener("pointerdown",close);
  return ()=>document.removeEventListener("pointerdown",close);
 },[]);
 return <details ref={ref} className={styles.menu+" "+className} onKeyDown={event=>{
  if(event.key==="Escape"){event.stopPropagation();ref.current?.removeAttribute("open");ref.current?.querySelector("summary")?.focus()}
 }} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))ref.current?.removeAttribute("open")}}>
  <summary aria-label={label} title={label}>{trigger}</summary>
  <div className={styles.panel} data-align={align} onClick={event=>{
   const button=(event.target as Element).closest("button");
   if(button&&!button.disabled&&!button.closest("[data-menu-stay]")){
    ref.current?.removeAttribute("open");
    if(ref.current?.contains(document.activeElement))ref.current.querySelector("summary")?.focus();
   }
  }}>{children}</div>
 </details>;
}
