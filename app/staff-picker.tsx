"use client";
export const staffNames=["Pedro","Romulo","Hannibal","Victor","Daniel"];
const colors=[
 {backgroundColor:"#dff3e5",color:"#275c40",borderColor:"#b9d9c4"},
 {backgroundColor:"#e3ecd7",color:"#4a6035",borderColor:"#c3d2ad"},
 {backgroundColor:"#d7eee5",color:"#245f4d",borderColor:"#adcfbf"},
 {backgroundColor:"#eef2d8",color:"#59612e",borderColor:"#d1d8af"},
 {backgroundColor:"#d1e5d5",color:"#355b3d",borderColor:"#abcab1"}
];
export function staffStyle(name?:string){const index=staffNames.indexOf(name??"");return index<0?undefined:colors[index]}
export default function StaffPicker({label,value,onChange,disabled=false}:{label:string;value:string;onChange:(value:string)=>void;disabled?:boolean}){
 return <div className="staff-picker"><span className={"staff-picker-avatar "+(!value?"unassigned":"")} style={staffStyle(value)} aria-hidden="true">{value?value.trim().slice(0,1).toUpperCase():"—"}</span><select className="staff-select" aria-label={label} value={value} disabled={disabled} onChange={e=>onChange(e.target.value)}><option value="">Selecionar funcionário</option>{value&&!staffNames.includes(value)&&<option value={value}>{value} · registro anterior</option>}{staffNames.map(name=><option key={name} value={name}>{name}</option>)}</select></div>
}
