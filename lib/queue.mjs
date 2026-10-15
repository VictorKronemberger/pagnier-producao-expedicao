export function move(sequence,id,delta){const next=[...sequence];const i=next.indexOf(id);const j=i+delta;if(i<0||j<0||j>=next.length)return next;[next[i],next[j]]=[next[j],next[i]];return next;}
export function add(sequence,id){return sequence.includes(id)?[...sequence]:[...sequence,id];}
export function remove(sequence,id){return sequence.filter(x=>x!==id);}
