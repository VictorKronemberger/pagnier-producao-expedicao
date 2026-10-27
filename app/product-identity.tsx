export default function ProductIdentity({sku,name}:{sku?:string;name?:string}){
 const code=sku?.trim();
 return <span className="product-identity">
  <strong className={code?"product-sku":"product-name"}>{code||name||"Produto"}</strong>
  {code&&name&&<small title={name}>{name}</small>}
 </span>;
}
