import {skuPackingDescription} from "./packing-sku-descriptions.mjs";
// Documentary formatting only: never changes ERP names, quantities or physical weights.
const normalize=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const massPattern=/(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(quilogramas?|quilos?|kg|gramas?|grs?|g)(?![\p{L}\d])/giu;
function grams(number,kg=false){
 if(!/^\d+(?:[.,]\d{1,3})?$/.test(number))return null;
 const [whole,fraction=""]=number.replace(",",".").split(".");
 const thousandths=BigInt(whole)*1000n+BigInt(fraction.padEnd(3,"0"));
 const amount=kg?thousandths*1000n:thousandths;
 if(amount<=0n)return null;
 return (amount/1000n).toString()+(amount%1000n?"."+(amount%1000n).toString().padStart(3,"0").replace(/0+$/,""):"");
}
export function standardPackingDescription(item){
 const product=String(item.produto??""),normalized=normalize(product);
 const free=/\b(?:tobacco|tabacco|tabaco)[\s-]*free\b|\bfree[\s-]*(?:tobacco|tabacco|tabaco)\b|\bsem[\s-]*tabaco\b/;
 const tobaccoFree=free.test(normalized)||free.test(normalize(item.descricaoDocumento));
 const mapped=skuPackingDescription(item.sku);
 if(mapped&&!(tobaccoFree&&/Smokeless Tobacco Product/i.test(mapped)))return mapped;
 if(tobaccoFree)return null;
 if(/\b(?:kit|combo|cinzas?|kuripe|tepi|aplicador)\b/.test(normalized)||/^tabaco\b/.test(normalized))return null;
 if(!/\b(?:rape|hape|snuff|sacred connection|medicina sagrada|yawanawa|nukini|katukina|kaxinawa|kuntanawa|huni kuin|shawadawa|shawanawa|shanenawa|apurina|caboclo|shamanic|xamanico)\b/.test(normalized))return null;
 if(/\d\s*[x×*]\s*\d|\b(?:pack|pacote|caixa)\s*(?:c\/|com)?\s*\d/i.test(product))return null;
 const masses=[...product.matchAll(massPattern)];
 if(masses.length>1)return null;
 // Prefer the nominal pack size (including 7.1g); otherwise use its confirmed unit weight.
 const weight=masses.length?grams(masses[0][1],/^(?:kg|quilo)/i.test(masses[0][2])):grams(String(item.pesoUnitarioKg??""),true);
 if(!weight)return null;
 const name=product.replace(/\(\s*Smokeless Tobacco Product\s*\)/gi,"")
  .replace(/\bDry\s+Snuff\b/gi,"").replace(/\bSacred\s+Connection\b|\bMedicina\s+Sagrada\b/gi,"")
  .replace(/(?<!\p{L})(?:Rap[eé]|Hap[eé])(?!\p{L})/giu,"").replace(/\bShamanic\s+Snuff\b/gi,"Shamanic")
  .replace(massPattern,"").replace(/(?:\d+\s+)?\d+(?:[.,]\d+|\/\d+)?\s*(?:oz|ounces?)\b/gi,"")
  .replace(/\(\s*Maya\s*\)/gi,"").replace(/\bkg\b\s*$/i,"")
  .replace(/\s+/g," ").replace(/^[\s·,–—-]+|[\s·,–—-]+$/g,"").trim();
 if(!name)return null;
 return "Dry Snuff "+name+" - (Smokeless Tobacco Product) "+weight+"g";
}
export function packingProductDescription(item){return standardPackingDescription(item)??(item.descricaoDocumento||item.produto||"")}
