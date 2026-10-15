export type ClientDocument={nome:string;razaoSocial:string;registro:string;telefone:string;email:string;cidade:string;pais:string;enderecos:{label:string;value:string}[]};
export function clientDocument(v:unknown):ClientDocument;
export function clientKey(id:number):Promise<string>;
export function clientOptions(state:any):Promise<{id:number;key:string;nome:string}[]>;
