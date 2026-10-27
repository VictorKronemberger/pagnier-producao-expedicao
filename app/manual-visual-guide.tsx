"use client";
import {useId,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,Maximize2,X} from "lucide-react";
import {manualVisuals,type ManualVisual} from "../lib/manual-visuals";
import styles from "./manual-visual.module.css";

function AnnotatedPhoto({scene,number}:{scene:ManualVisual;number:number}){
 const id=useId();
 const [x,y,w,h]=scene.target;
 // Keep the highlighted control in the upper half, clear of the explanation.
 const cw=Math.min(scene.width,Math.max(w+100,scene.width*.64)),ch=cw/1.25;
 const cx=Math.max(0,Math.min(scene.width-cw,x+w/2-cw/2)),cy=Math.max(0,y+h/2-ch*.26);
 const arrowX=cx+cw*.5,arrowY=cy+ch*.9;
 return <figure className={styles.photo}>
 <svg viewBox={[cx,cy,cw,ch].join(" ")} role="img" aria-labelledby={id+"-title"} preserveAspectRatio="xMidYMin slice">
 <title id={id+"-title"}>{scene.title}: área destacada na tela de demonstração</title>
 <defs><marker id={id+"-arrow"} markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#176c4a"/></marker></defs>
 <image href={"/manual/"+scene.image} width={scene.width} height={scene.height}/>
 <rect x={x-5} y={y-5} width={w+10} height={h+10} rx="10" fill="#24855a12" stroke="#176c4a" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
 <path d={`M${arrowX},${arrowY} Q${arrowX},${y+h+35} ${x+w/2},${y+h+12}`} fill="none" stroke="#176c4a" strokeWidth="2.5" vectorEffect="non-scaling-stroke" markerEnd={"url(#"+id+"-arrow)"}/>
 </svg>
 <figcaption className={styles.callout} aria-live="polite" aria-atomic="true"><span className={styles.number}>{number}</span><div><strong>{scene.title}</strong><p>{scene.text}</p></div></figcaption>
 </figure>;
}
export default function ManualVisualGuide({topic}:{topic:string}){
 const scenes=manualVisuals[topic], [index,setIndex]=useState(0),dialog=useRef<HTMLDialogElement>(null);
 if(!scenes?.length)return null;
 const scene=scenes[index];
 function controls(){return <div className={styles.controls}>
 <button type="button" aria-label="Destaque anterior" disabled={index===0} onClick={()=>setIndex(index-1)}><ArrowLeft size={18}/></button>
 <div className={styles.dots} aria-label="Destaques da imagem">{scenes.map((s,i)=><button type="button" key={i} aria-label={`Destaque ${i+1}: ${s.title}`} aria-pressed={i===index} onClick={()=>setIndex(i)}>{i+1}</button>)}</div>
 <button type="button" aria-label="Próximo destaque" disabled={index===scenes.length-1} onClick={()=>setIndex(index+1)}><ArrowRight size={18}/></button>
 </div>}
 return <section className={styles.guide} data-manual-visual={topic} aria-label="Guia visual">
 <div className={styles.toolbar}><span>NA TELA · {index+1}/{scenes.length}</span><button type="button" onClick={()=>dialog.current?.showModal()}><Maximize2 size={16}/>Ampliar imagem</button></div>
 <AnnotatedPhoto scene={scene} number={index+1}/>{controls()}
 <small className={styles.example}>Tela de demonstração · dados fictícios</small>
 <dialog className={styles.dialog} ref={dialog} aria-label="Imagem explicada ampliada" onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close()}}>
 <div className={styles.dialogTop}><strong>Guia visual</strong><button type="button" autoFocus aria-label="Fechar imagem ampliada" onClick={()=>dialog.current?.close()}><X size={20}/></button></div>
 <AnnotatedPhoto scene={scene} number={index+1}/>{controls()}
 </dialog>
 </section>;
}
