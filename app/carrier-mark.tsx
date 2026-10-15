import type {ReactNode} from "react";
const brand=(value:string)=>/\bfed[ -]?ex\b/i.test(value)?"fedex":/\bdhl\b/i.test(value)?"dhl":"";
export default function CarrierMark({value,decorative=false}:{value:string;decorative?:boolean}){
 const name=brand(value);return name?<img className={"carrier-logo carrier-logo-"+name} src={"/carriers/"+name+".svg"} alt={decorative?"":name==="fedex"?"FedEx":"DHL"} aria-hidden={decorative||undefined} width={name==="dhl"?88:66} height={24}/>:<span>{value}</span>;
}
export function CarrierControl({value,children}:{value:string;children:ReactNode}){return <span className={"carrier-control"+(brand(value)?" has-logo":"")}>{children}{brand(value)&&<CarrierMark value={value} decorative/>}</span>}
