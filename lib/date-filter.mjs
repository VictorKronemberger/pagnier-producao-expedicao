export const SITE_START_DATE="2026-09-01";
export const SITE_START_LABEL="01/09/2026";
export function clampStart(value){return value&&value<SITE_START_DATE?SITE_START_DATE:value;}
export function matchesCreation(op,mode,start,end){if(mode==="unknown")return !op.criacao;if(!op.criacao||op.criacao<SITE_START_DATE)return false;if(mode==="all")return true;start=clampStart(start);if(!start||!end||start>end)return false;return op.criacao>=start&&op.criacao<=end;}
