"use client";
import {ChevronDown,PencilLine} from "lucide-react";
import type {ReactNode} from "react";
// A native summary acts as the disclosure button, including keyboard activation.
export default function SectionAction({title,description}:{title:ReactNode;description?:ReactNode}){
 return <summary className="section-action"><PencilLine size={17} className="section-action-icon" aria-hidden="true"/><span className="section-action-copy"><strong>{title}</strong>{description&&<small>{description}</small>}</span><span className="section-action-toggle" aria-hidden="true"><span className="when-closed">Abrir</span><span className="when-open">Fechar</span><ChevronDown size={16}/></span></summary>
}
