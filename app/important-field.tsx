"use client";
import {Children,cloneElement,isValidElement,useId,useLayoutEffect,useRef,useState,type ReactElement,type ReactNode} from "react";
import {ArrowDown} from "lucide-react";
export default function ImportantField({label,value,required=true,valid=true,className="",hint,children}:{label:ReactNode;value?:string;required?:boolean;valid?:boolean;className?:string;hint?:string;children:ReactNode}){
 const id=useId(),empty=!value?.trim(),pending=required&&(empty||!valid);
 return <label className={"important-field "+className} data-field-pending={pending?"true":undefined}>
 <span className="field-title">{label}{pending&&<small id={id} className="field-state">{empty?"Preencher":"Revisar"}</small>}</span>
 {Children.map(children,child=>isValidElement(child)&&typeof child.type==="string"&&["input","select","textarea"].includes(child.type)?cloneElement(child as ReactElement<Record<string,unknown>>,{"placeholder":(child.props as Record<string,unknown>).placeholder??(child.type==="textarea"||(child.type==="input"&&!(child.props as Record<string,unknown>).type)?"Clique para preencher":undefined),"aria-required":required||undefined,"aria-invalid":pending&&!empty||undefined,"aria-describedby":pending?id:undefined}):child)}
 {pending&&hint&&<small className="field-hint">{hint}</small>}
 </label>
}
export function FillingGuide(){
 const ref=useRef<HTMLDivElement>(null),[state,setState]=useState({count:0,label:"",action:"Preencher"});
 useLayoutEffect(()=>{
 const scope=ref.current?.closest("fieldset"),fields=[...(scope?.querySelectorAll<HTMLElement>('[data-field-pending="true"]')??[])].filter(el=>!el.closest('[hidden],[inert]'));
 const field=fields[0],control=field?.querySelector('input,select,textarea');
 const next={count:fields.length,label:control?.getAttribute("aria-label")??"próximo campo",action:field?.querySelector(".field-state")?.textContent??"Preencher"};
 setState(old=>old.count===next.count&&old.label===next.label&&old.action===next.action?old:next);
 });
 function next(){
 const scope=ref.current?.closest("fieldset");
 const fields=[...(scope?.querySelectorAll<HTMLElement>('[data-field-pending="true"]')??[])];
 const field=fields.find(el=>!el.closest('[hidden],[inert]')&&el.querySelector('input:not(:disabled),select:not(:disabled),textarea:not(:disabled)'));
 if(!field)return;
 const parents:HTMLDetailsElement[]=[];let parent=field.parentElement;
 while(parent&&parent!==scope){if(parent instanceof HTMLDetailsElement)parents.unshift(parent);parent=parent.parentElement}
 parents.forEach(el=>el.open=true);
 requestAnimationFrame(()=>{const control=field.querySelector<HTMLElement>('input:not(:disabled),select:not(:disabled),textarea:not(:disabled)');control?.focus({preventScroll:true});field.scrollIntoView({block:"center",behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?"auto":"smooth"})});
 }
 return <div className="filling-guide" ref={ref}>{state.count>0&&<><span>{state.count} {state.count===1?"campo pede atenção":"campos pedem atenção"} nesta etapa</span><button type="button" className="button primary fill-next-field" onClick={next}><ArrowDown size={16}/>{state.action}: {state.label}</button></>}</div>
}
