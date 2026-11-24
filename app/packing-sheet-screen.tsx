"use client";
import {useEffect,useRef,type ReactNode} from "react";
import {createPortal} from "react-dom";
import styles from "./packing-sheet.module.css";

export default function PackingSheetScreen({children,onClose,labelledBy}:{children:ReactNode;onClose:()=>void;labelledBy:string}){
 const dialog=useRef<HTMLDialogElement>(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{
  const element=dialog.current;
  if(!element)return;
  const overflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  element.showModal();
  const expired=()=>close.current();
  // A disabled focused input can leave focus on body. Intercept Escape before
  // the parent order's document handler, even during a loading transition.
  const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"&&element.open){event.preventDefault();event.stopPropagation();close.current()}};
  document.addEventListener("keydown",escape,true);
  window.addEventListener("pagnier-session-expired",expired);
  return()=>{document.removeEventListener("keydown",escape,true);window.removeEventListener("pagnier-session-expired",expired);element.close();document.body.style.overflow=overflow};
 },[]);
 return createPortal(<dialog ref={dialog} className={styles.screen} aria-labelledby={labelledBy} onCancel={event=>{event.preventDefault();close.current()}} onKeyDown={event=>{event.stopPropagation();if(event.key==="Escape"){event.preventDefault();close.current()}}} onClick={event=>event.stopPropagation()}>{children}</dialog>,document.body);
}