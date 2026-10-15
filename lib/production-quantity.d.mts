export type QuantityOP={id:string;quantidade:string;quantidadeProgramada?:string;quantidadeAnterior?:string;quantidadeAlteradaEm?:string};
export function quantityNumber(value:unknown):number|null;
export function quantityDifference(op:QuantityOP):{programmed:number|null;current:number|null;difference:number|null;reduced:boolean;increased:boolean;changed:boolean};
export function trackOPQuantity<T extends QuantityOP>(previous:any,incoming:T,at:string,events?:any[]):T & Partial<QuantityOP>;
export function quantityText(n:number|null):string;

export function prepareQuantityState<T>(state:T):T;
