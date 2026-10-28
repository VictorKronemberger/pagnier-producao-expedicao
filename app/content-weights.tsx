import type {ReactNode} from "react";
import {ShoppingBag,Package,ChevronDown} from "lucide-react";
import ProductIdentity from "./product-identity";
import {sourceProductSku} from "../lib/product-code.mjs";
import {contentWeights,contentWeightLabel} from "../lib/content-weights.mjs";
import {weightText} from "../lib/packing-list.mjs";
import type {ShippingItem,ShippingOP,ShippingBox,InnerBox} from "../lib/shipping.mjs";

export function ProductWeights({items,ops}:{items:ShippingItem[];ops:ShippingOP[]}){
 const {rows,missing}=contentWeights(items);
 return <div className="product-weight-list">
 {rows.map(({item,weight,units,net})=><div className="product-weight-row" key={item.id}>
 <ProductIdentity sku={sourceProductSku(item,ops)} name={item.produto}/>
 <div className="product-weight-numbers"><span>{item.quantidade} {item.unidade}</span><span>Peso por unidade: <strong>{weight===null?"Pendente":weightText(weight)+" kg"}</strong></span><span>{units||"—"} unidades embaladas · Total: <strong>{net===null?"Pendente":weightText(net)+" kg"}</strong></span></div>
 </div>)}
 {missing>0&&<p className="check-help">{missing} {missing===1?"item com peso ou quantidade pendente.":"itens com peso ou quantidade pendente."} O total parcial considera apenas os itens completos.</p>}
 {!items.length&&<p className="check-help">Nenhum produto nesta embalagem.</p>}
 </div>;
}
export function PackageWeights({inner,items,ops,children}:{inner:InnerBox;items:ShippingItem[];ops:ShippingOP[];children?:ReactNode}){
 return <details className="inner-box package-weights"><summary>
 {inner.tipo==="bag"?<ShoppingBag size={17}/>:<Package size={17}/>}
 <strong>{inner.codigo}</strong><span>{items.length} {items.length===1?"item":"itens"}</span>
 <span className="package-weight-total">Peso líquido: <b>{contentWeightLabel(items)}</b></span><ChevronDown className="package-weight-chevron" size={16}/>
 </summary><div className="inner-box-body"><ProductWeights items={items} ops={ops}/><p className="check-help">Soma do peso líquido dos produtos, sem o peso da embalagem.</p>{children}</div></details>;
}
export default function BoxContentWeights({box,ops}:{box:ShippingBox;ops:ShippingOP[]}){
 const innerIds=new Set((box.caixasInternas??[]).map(inner=>inner.id));
 const direct=box.itens.filter(item=>!item.caixaInternaId||!innerIds.has(item.caixaInternaId));
 return <div className="box-content-weights">
 {(box.caixasInternas??[]).map(inner=><PackageWeights key={inner.id} inner={inner} items={box.itens.filter(item=>item.caixaInternaId===inner.id)} ops={ops}/>)}
 {direct.length>0&&<div>{innerIds.size>0&&<h5>Produtos avulsos</h5>}<ProductWeights items={direct} ops={ops}/></div>}
 <p className="check-help">Peso líquido calculado: <strong>{contentWeightLabel(box.itens)}</strong>.</p>
 </div>;
}
