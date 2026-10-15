const base="http://127.0.0.1:5173";
const a=await fetch(base+"/signin-with-chatgpt?return_to=/",{redirect:"manual"});
const cookie=a.headers.getSetCookie().map(v=>v.split(";")[0]).join("; ");
const r=await fetch(base+"/api/nomus",{headers:{cookie}});const s=await r.json();
console.log(JSON.stringify({pedidos:s.pedidosConsultados,identificados:s.pedidosIdentificados,cobertura:s.pedidosCoberturaCompleta,grupos:s.snapshot?.grupos.length}));
