import {spawn} from "node:child_process";
import {mkdirSync,writeFileSync} from "node:fs";
// Explicit list: these tests use fixtures, an in-memory database or intercepted browser APIs.
const unitTests=["check-delete-shipping-box.mjs","check-small-box-progress.mjs",
 "check-allocation.mjs",
 "check-assembly-flow.mjs",
 "check-small-box-search.mjs",
 "check-assembly-modes.mjs",
 "check-box-models-api.mjs",
 "check-box-review.mjs",
 "check-company-scope.mjs",
 "check-connected-api.mjs",
 "check-connected-flow.mjs",
 "check-direct-box-rule.mjs",
 "check-features.mjs",
 "check-board-live.mjs",
 "check-flow.mjs",
 "check-groups.mjs",
 "check-inner-boxes.mjs",
 "check-integration.mjs",
 "check-invoice-delete.mjs",
 "check-invoice-prepare.mjs",
 "check-invoice.mjs",
 "check-nomus-changes.mjs",
 "check-nomus-bootstrap.mjs",
 "check-order-release.mjs",
 "check-order-archive.mjs",
 "check-order-visibility.mjs",
 "check-packing-assistant.mjs",
 "check-packing-delete.mjs",
 "check-packing-excel.mjs",
 "check-packing-workflow.mjs",
 "check-packing.mjs",
 "check-packing-product-description.mjs",
 "check-packing-sku-descriptions.mjs",
 "check-product-document-reuse.mjs",
 "check-product-lots.mjs",
 "check-product-weight.mjs",
 "check-production-fulfilled.mjs",
 "check-production-quantity.mjs",
 "check-queue.mjs",
 "check-ready-boxes.mjs",
 "check-sales-complete.mjs",
 "check-shipping-carrier.mjs",
 "check-shipping.mjs",
 "check-sync.mjs",
 "check-documentation-ready.mjs",
 "check-team-chat.mjs",
 "check-postgres.mjs",
 "check-turso.mjs",
 "check-vercel-api.mjs"
];
// Legacy browser scripts remain available for the old local D1 panel.
const browserTests=["check-packing-confirmation-browser.mjs","check-delete-box-browser.mjs","check-small-progress-browser.mjs","check-small-build-layout-browser.mjs","check-box-operations-browser.mjs","check-team-chat-browser.mjs"];
const includeBrowser=process.argv.includes("--browser"),selected=[...unitTests,...(includeBrowser?browserTests:[])];
const startedAt=new Date().toISOString(),results=[];
mkdirSync(".sites-runtime/audit",{recursive:true});
for(const file of selected){
 console.log("RUN "+file);
 const result=await new Promise(resolve=>{
  let output="",timedOut=false;
  const child=spawn(process.execPath,["scripts/"+file],{windowsHide:true,stdio:["ignore","pipe","pipe"]});
  const timer=setTimeout(()=>{timedOut=true;child.kill()},browserTests.includes(file)?240000:90000);
  child.stdout.on("data",d=>output+=d);child.stderr.on("data",d=>output+=d);
  child.on("error",error=>{output+=error.message});
  child.on("close",code=>{clearTimeout(timer);resolve({file,ok:code===0&&!timedOut,code,timedOut,output})});
 });
 writeFileSync(".sites-runtime/audit/"+file+".log",result.output);
 results.push({file:result.file,ok:result.ok,code:result.code,timedOut:result.timedOut});
 console.log((result.ok?"PASS ":"FAIL ")+file);if(!result.ok)console.log(result.output.slice(-2200));
 writeFileSync(".sites-runtime/audit/system-results.json",JSON.stringify({startedAt,finishedAt:new Date().toISOString(),includeBrowser,realERP:false,results},null,2));
 if(result.timedOut){console.log("Tempo excedido. Execução interrompida para revisar o processo de teste.");break}
}
console.log("TOTAL "+results.filter(r=>r.ok).length+"/"+selected.length);
process.exitCode=results.some(r=>!r.ok)||results.length!==selected.length?1:0;
