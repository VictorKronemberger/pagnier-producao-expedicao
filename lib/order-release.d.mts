export type ReleaseState="waiting"|"partial"|"released"|"closed"|"unknown";
export const releaseLabels:Record<ReleaseState,string>;
export function releaseState(items?:{status?:number|string}[]):ReleaseState;
export function canQueue(order:{liberacao?:ReleaseState}):boolean;
export function hasStarted(detail?:{situacao?:string;atendimentoEstoque?:boolean}):boolean;
export function awaitsRelease(order:{liberacao?:ReleaseState;ordens?:unknown[]},detail?:{situacao?:string;atendimentoEstoque?:boolean}):boolean;
export function pendingReleaseItems<T extends {status?:number|string}>(order:{itens?:T[]}):T[];
export function assertReleaseTransitions(previous:any,next:any,groups:any[]):void;
