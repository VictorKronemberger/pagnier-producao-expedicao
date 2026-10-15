export const ASSEMBLY_MODES = [
 {id:"direct",label:"Sem caixas menores",description:"Produtos diretamente nas Caixas 40."},
 {id:"inner",label:"Com caixas menores",description:"Prepare as menores e depois distribua nas Caixas 40."},
 {id:"mixed",label:"Modo misto",description:"Caixas menores e produtos avulsos no mesmo embarque."}
];
export function assemblyMode(s){
 if(["direct","inner","mixed"].includes(s?.organizacao))return s.organizacao;
 const inner=!!s?.caixasEmMontagem?.length||s?.caixas?.some(b=>b.caixasInternas?.length||b.itens?.some(i=>i.caixaInternaId));
 const direct=s?.caixas?.some(b=>b.itens?.some(i=>!i.caixaInternaId));
 return inner?(direct?"mixed":"inner"):direct?"direct":"";
}
export function assemblyModeIssue(s,mode){
 if(!["direct","inner","mixed"].includes(mode))return "Escolha como organizar este embarque.";
 if(mode==="direct"&&(s.caixasEmMontagem?.length||s.caixas?.some(b=>b.caixasInternas?.length||b.itens?.some(i=>i.caixaInternaId))))return "Há caixas menores neste embarque. Retire o conteúdo delas antes de escolher a distribuição direta, ou use o modo misto.";
 if(mode==="inner"&&s.caixas?.some(b=>b.itens?.some(i=>!i.caixaInternaId)))return "Há produtos avulsos nas Caixas 40. Remova esses itens antes de escolher somente caixas menores, ou use o modo misto.";
 return "";
}
export function selectAssemblyMode(s,mode){
 const issue=assemblyModeIssue(s,mode);if(issue)throw Error(issue);
 return {...s,organizacao:mode};
}
