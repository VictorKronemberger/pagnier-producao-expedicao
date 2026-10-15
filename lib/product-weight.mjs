import {scaled,weightText} from "./packing-list.mjs";
// Infer only a single explicit mass; combinations and count-only names need review.
export function productUnitWeight(name){
 if(typeof name!=="string"||/\b(?:kit|combo|sortidos?)\b/i.test(name)||/\d\s*[x×*]\s*\d|\d\s*(?:kg|g|gramas?)\s*[x×*]\s*\d/i.test(name)||/\b(?:pack|pacote|caixa|cartela)\s*(?:c\/|com)?\s*\d/i.test(name))return null;
 const hits=[...name.matchAll(/(?<![\d.,])(\d+(?:[.,]\d{1,3})?)\s*(quilogramas?|quilos?|kg|gramas?|grs?|g)(?![\p{L}\d])/giu)];
 if(hits.length!==1)return null;
 const [,number,unit]=hits[0];
 // A thousands separator cannot safely be distinguished from a decimal separator.
 if(/^[1-9]\d*[.,]\d{3}$/.test(number))return null;
 const amount=scaled(number);if(amount===null||amount<=0n)return null;
 const kg=/^(?:kg|quilo)/i.test(unit);
 if(!kg&&amount%1000n!==0n)return null;
 const grams=kg?amount:amount/1000n;
 if(grams<=0n||grams>999999999999n)return null;
 return weightText(grams);
}
