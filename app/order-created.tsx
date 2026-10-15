import {CalendarDays} from "lucide-react";
export default function OrderCreated({value}:{value?:string}){
 const date=value&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:"";
 const label=date?date.split("-").reverse().join("/"):"Sem data";
 const description=date?"Criação do pedido de venda: "+label:"Data de criação do pedido de venda ainda não disponível no Nomus";
 return <time className="order-created" dateTime={date||undefined} title={description} aria-label={description}><CalendarDays size={12} aria-hidden="true"/>{label}</time>;
}
