export type ShippingOP={sku?:string;productId?:number;quantidadeProduzida?:string|null;producaoConsultadaEm?:string;operacaoProducao?:string;motivoProducao?:string;validadeLote?:string;estoque?:boolean;id:string;nome:string;produto:string;quantidade:string;unidade:string};
export type Packing=Record<"invoiceNumero"|"invoiceData"|"exportadorNome"|"exportadorEndereco"|"exportadorRef"|"destinatarioNome"|"destinatarioEndereco"|"destinatarioRegistro"|"contatoNome"|"contatoTelefone"|"contatoFax"|"contatoEmail"|"compradorNome"|"compradorEndereco"|"compradorRegistro"|"compradorContato"|"pedidoComprador"|"outrasReferencias"|"paisOrigem"|"paisDestino"|"termosEntrega"|"termosPagamento"|"preTransporte"|"localRecebimento"|"vooNavio"|"portoEmbarque"|"portoDesembarque"|"destinoFinal"|"pallets"|"assinante"|"assinaturaData",string>;
export const packingFields:Record<string,number>;
export function emptyPacking():Packing;
export type InnerBox={id:string;codigo:string;tipo?:"bag"};
export type ShippingItem={origemLote?:string;origemValidade?:string;caixaInternaId?:string;origemPeso?:string;conteudoPorEmbalagem:string;descricaoDocumento:string;sku:string;hsCode:string;tipoEmbalagem:string;unidadesEmbaladas:string;pesoUnitarioKg:string;id:string;opId:string;produto:string;unidade:string;quantidade:string;lote:string;validade:string};
export type ShippingBox={montada?:boolean;caixasInternas?:InnerBox[];modeloNome?:string;pesoMaximoKg?:string;taraKg?:string;id:string;codigo:string;embalagem:string;lacre:string;comprimentoCm:string;larguraCm:string;alturaCm:string;pesoBrutoKg:string;pesoLiquidoKg:string;observacoes:string;itens:ShippingItem[]};
export type PreparedBox=InnerBox&{pronta?:boolean;itens:ShippingItem[]};
export type Shipment={organizacao?:string;packingExcluido?:boolean;caixasEmMontagem?:PreparedBox[];conferenciaPor?:string;conferenciaEm?:string;conferenciaBase?:string;agrupamento?:import("./shipment-groups.mjs").ShipmentGroup;packing?:Packing;referencia:string;transportadora:string;modalidade:string;previsaoEnvio:string;dataEnvio:string;rastreio:string;cidadeDestino:string;paisDestino:string;responsavelEmbalagem:string;observacoes:string;caixas:ShippingBox[]};
export const shipmentFields:Record<string,number>;
export const MODES:string[];
export function emptyShipment():Shipment;
export function newBox(boxes:ShippingBox[],id:string):ShippingBox;
export function newItem(id:string):ShippingItem;
export function newInnerBox(box:ShippingBox,id:string,tipo?:"bag"):InnerBox;
export function isDecimalDraft(v:unknown):boolean;
export function decimal(v:unknown):number|null;
export function validDate(v:string):boolean;
export function canonicalShipping(value?:Shipment):Shipment;
export function normalizeShipment(value:unknown,ops:ShippingOP[],previous?:Shipment):Shipment|undefined;
export function analyzeShipment(value:Shipment|undefined,ops:ShippingOP[]):{boxes:number;bruto:number;liquido:number;volume:number;weightCount:number;netCount:number;dimensionCount:number;quantidades:{unidade:string;quantidade:number}[];allocation:{opId:string;produto:string;unidade:string;previsto:number|null;embalado:number;restante:number|null;caixas:{id:string;codigo:string;quantidade:number}[];status:"none"|"partial"|"complete"|"excess"|"unknown"|"review"}[];issues:string[]};

export function assemblyBoxes(shipment?:Shipment):ShippingBox[];

export function assertPackingCapacity(value:Shipment,ops:ShippingOP[],previous?:Shipment):void;
