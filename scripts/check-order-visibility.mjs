import assert from 'node:assert/strict';
import {visibleOrderState} from '../lib/order-visibility.mjs';
import {matchesCreation,clampStart} from '../lib/date-filter.mjs';
import {scopeBoard,preserveExcludedNotes} from '../lib/company-scope.mjs';
const s={orders:{1:{code:'OLD',createdDate:'2026-08-31'},2:{code:'NEW',createdDate:'2026-09-01'},3:{code:'LINK',createdDate:'2020-01-01'},4:{code:'UNKNOWN'},5:{code:'FUTURE',createdDate:'2026-11-01'}},snapshot:{grupos:[{id:'OLD',ordens:[]},{id:'NEW',ordens:[]},{id:'LINK',ordens:[{id:'OP1'}]}],semVinculo:[]},changes:{OLD:{at:'x'}}};
const v=visibleOrderState(s);assert.deepEqual(Object.keys(v.orders),['2','3','5']);assert.equal(v.snapshot.grupos.length,2);assert(!v.changes.OLD);assert.equal(Object.keys(s.orders).length,5);assert(v.hiddenOrderCodes.OLD);assert(v.hiddenOrderCodes.UNKNOWN);
assert(!matchesCreation({criacao:'2026-08-31'},'all','',''));assert(matchesCreation({criacao:'2026-09-01'},'all','',''));assert(matchesCreation({criacao:'2026-11-01'},'all','',''));assert(matchesCreation({},'unknown','',''));assert(!matchesCreation({},'all','',''));assert.equal(clampStart('2026-03-01'),'2026-09-01');assert(!matchesCreation({criacao:'2026-08-31'},'range','2026-01-01','2026-10-10'));
const board={sequence:['OLD','NEW'],details:{OLD:{nota:'Preservar'},NEW:{nota:'Atual'}}};const scoped=scopeBoard(board,v.hiddenOrderCodes);assert.deepEqual(scoped.sequence,['NEW']);assert.equal(preserveExcludedNotes(board,scoped,v.hiddenOrderCodes).details.OLD.nota,'Preservar');
console.log('OK recorte: 01/09 inclusivo, futuros permitidos, antigos sem OP ocultos, vínculo antigo preservado, sem data em revisão e anotações mantidas.');
