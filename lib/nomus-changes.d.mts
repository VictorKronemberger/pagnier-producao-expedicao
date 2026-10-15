export type ChangeField={label:string;before:string;after:string};
export type ChangeEvent={at:string;summary:string;kind:string;entity:string;fields:ChangeField[];note?:string};
export function opFacts(o:any,orders?:any):any;
export function orderFacts(p:any,clients?:any,products?:any):any;
export function diffFacts(before:any,after:any):ChangeField[];
export function newFacts(facts:any):ChangeField[];
