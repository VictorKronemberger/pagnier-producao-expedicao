import assert from "node:assert/strict";
import {receiveOrders} from "../lib/intake.mjs";
import {autoResaleShipping,operationalGroups} from "../lib/stock-orders.mjs";
import {catalogProduct} from "../lib/product-catalog.mjs";
import {initialSync,publicSync,syncStep} from "../lib/nomus-sync.mjs";
const item={produto:"Kuripe",quantidade:"2",unidade:"UNID",status:2,tipoProduto:"Mercadoria para revenda",grupoProduto:"Aplicadores"};
const sale={id:"R1",codigo:"R1",liberacao:"released",vinculo:"none",ordens:[],itens:[item]};
const board={sequence:[],details:{R1:{nota:"Keep",envio:{caixas:[]}}}};
assert(autoResaleShipping(sale));
const next=receiveOrders(board,[sale]);assert.deepEqual(next.sequence,["R1"]);assert(next.details.R1.atendimentoEstoque);assert.equal(next.details.R1.situacao,"Conclu\u00eddo");assert.equal(next.details.R1.nota,"Keep");assert.deepEqual(next.details.R1.envio,board.details.R1.envio);assert.equal(receiveOrders(next,[sale]),next);
const groups=operationalGroups({grupos:[sale],pedidos:[sale]},next);assert(groups[0].estoque);assert.equal(groups[0].ordens[0].produto,"Kuripe");
for(const bad of [{...sale,liberacao:"partial"},{...sale,liberacao:"waiting"},{...sale,liberacao:"unknown"},{...sale,vinculo:"unknown"},{...sale,ordens:[{id:"OP1"}]},{...sale,itens:[]},{...sale,itens:[{...item,tipoProduto:""}]},{...sale,itens:[item,{...item,tipoProduto:"Produto acabado"}]},{...sale,itens:[{...item,status:1}]},{...sale,itens:[{...item,status:4}]},{...sale,itens:[{...item,unidade:""}]}]){assert(!autoResaleShipping(bad));assert(!receiveOrders(board,[bad]).details.R1.atendimentoEstoque)}
for(const detail of [{arquivado:true},{situacao:"Em acompanhamento"},{situacao:"Conclu\u00eddo"},{situacao:"Pronto para envio"},{atendimentoEstoque:true}]){const saved={sequence:["R1"],details:{R1:{...board.details.R1,...detail}}};assert.equal(receiveOrders(saved,[sale]),saved)}
const raw={id:7,descricao:"Kuripe",siglaUnidadeMedida:"UNID",nomeGrupoProduto:"Aplicadores",nomeTipoProduto:"Mercadoria para revenda"};
let state=initialSync({grupos:[],semVinculo:[]});state.ordersComplete=true;state.opsComplete=true;state.turn=4;state.orders[1]={code:"R1",companyId:1,createdDate:"2026-10-27",clientId:2,items:[{productId:7,quantity:"2",status:2}]};state.clients[2]="QA";state.products[7]={name:"Kuripe",unit:"UNID"};state.snapshot.grupos=[{id:"R1",codigo:"R1",ordens:[]}];
let called;state=await syncStep(state,"fixture",{fetcher:async url=>{called=url;return Response.json(raw)}});assert(called.endsWith("produtos/7"));assert.deepEqual(state.products[7],catalogProduct(raw));
let view=publicSync(state,true);assert(autoResaleShipping(view.snapshot.grupos[0]));assert.equal(view.snapshot.pedidos[0].itens[0].grupoProduto,"Aplicadores");
state=await syncStep({...state,nextAt:0,turn:1},"fixture",{fetcher:async()=>Response.json([{id:8,idEmpresa:1,nome:"OP8",idProduto:7,descricaoProduto:"Kuripe",unidadeMedida:"UNID",qtde:"2",itensPedido:[]}])});assert.equal(state.products[7].type,raw.nomeTipoProduto);
console.log("OK resale intake: confirmed classification, whole release, mixed/unknown/OP guards, preserved work, idempotency, stock products and legacy hydration.");

// A legacy catalog must classify recent released orders before older linked production.
const legacy=initialSync({grupos:[{id:"OLD",codigo:"OLD",ordens:[{id:"OP OLD"}]},{id:"NEW",codigo:"NEW",ordens:[]}],semVinculo:[]});
legacy.ordersComplete=true;legacy.opsComplete=true;
legacy.orders={1:{code:"OLD",companyId:1,createdDate:"2026-10-01",clientId:1,items:[{productId:8,quantity:"1",status:2}]},2:{code:"NEW",companyId:1,createdDate:"2026-10-27",clientId:2,items:[{productId:7,quantity:"2",status:2}]}};
legacy.products={7:{name:"Kuripe",unit:"UNID"},8:{name:"Manufactured",unit:"UNID"}};
for(const turn of [2,3,4]){
 let calls=0;const classified=await syncStep({...legacy,turn},"fixture",{fetcher:async url=>{calls++;assert(url.endsWith("produtos/7"));return Response.json(raw)}});
 assert.equal(calls,1);const order=publicSync(classified,true).snapshot.grupos.find(g=>g.id==="NEW");
 assert(autoResaleShipping(order));assert.equal(receiveOrders({sequence:[],details:{}},[order]).details.NEW.situacao,"Conclu\u00eddo");
}
let recentPath;
await syncStep({...legacy,turn:3},"fixture",{refreshRecentOrders:true,fetcher:async url=>{recentPath=url;return Response.json([])}});
assert(recentPath.endsWith("pedidos?pagina=1"));
console.log("OK released resale classification priority across detail/catalog turns, one GET and recent order priority preserved.");

const alternateType={...sale,itens:[item,{...item,produto:"Kuripe alternativo",tipoProduto:"Produtos para revenda"}]};
assert(autoResaleShipping(alternateType));assert.equal(receiveOrders(board,[alternateType]).details.R1.situacao,"Conclu\u00eddo");
assert(!autoResaleShipping({...sale,itens:[item,{...item,tipoProduto:"Materia Prima / Revenda"}]}));
console.log("OK both Nomus resale types route together; manufacturing/raw material classifications remain outside automatic resale.");
