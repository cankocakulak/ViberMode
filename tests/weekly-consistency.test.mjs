import test from 'node:test';
import assert from 'node:assert/strict';
import {usageScopeNote,completedCohortPopulationNote} from '../scripts/growth-scorecard/presentation-quality.mjs';
const users=(app,platform,value)=>({appName:app,platform,value,metric:'Weekly Active Users',country:'GLOBAL',status:'EARLY'});
test('partial but measured Ozard populations do not imply missing iOS users',()=>{
 const rows=[users('Ozard','iOS',2717),users('Ozard','Android',6201)],original=structuredClone(rows),note=usageScopeNote(rows,'Ozard');
 assert.match(note,/production identity clusters/);assert.match(note,/coverage\/population compatibility/);assert.doesNotMatch(note,/No compatible iOS|iOS event counts/);assert.deepEqual(rows,original);
});
test('EasySpell aggregate events never become unique-user coverage through copy',()=>{
 const rows=[users('EasySpell','iOS',null),users('EasySpell','Android',6)];assert.match(usageScopeNote(rows,'EasySpell'),/aggregate event counts, not unique-user counts/);
});
test('broader completed cohort exposes acquisition-week population change',()=>{
 const current={week:'2026-09-14',appName:'Ozard',platform:'iOS',semantics:{cohort:{start:'2026-09-07',end:'2026-09-13'},population:JSON.stringify({builds:[{version:'3.1.10',build:'24'},{version:'3.1.11',build:'25'}]})}};
 const prior={week:'2026-09-07',appName:'Ozard',platform:'iOS',metric:'Paywall Reach',country:'GLOBAL',semantics:{population:JSON.stringify({versions:['3.1.10']})}};
 const note=completedCohortPopulationNote(current,[prior]);assert.match(note,/3.1.11 \/ 25/);assert.match(note,/frozen operating snapshot remains unchanged/);assert.equal(completedCohortPopulationNote(current,[{...prior,platform:'Android'}]),'');
});
test('audited cohort explanation comes from canonical revision metadata, without replacing counts',()=>{
 const r={value:1720,semantics:{cohort:{counts:{firstOpen:1720},populationRevision:{summary:'Earlier result was the initial W38 readback, not the frozen W37 mature subset.'}}}},before=structuredClone(r);
 assert.equal(completedCohortPopulationNote(r),r.semantics.cohort.populationRevision.summary);assert.deepEqual(r,before);
});
test('bounded product export windows cover each requested date exactly once',async()=>{
 const {projectionWindows}=await import('../scripts/growth-scorecard/product-export.mjs');const windows=projectionWindows({start:'2026-09-14'},new Date('2026-09-21T12:00:00Z')),dates=[];
 for(const w of windows){assert(Date.parse(w.end)-Date.parse(w.start)<=2*86400000);for(let d=Date.parse(w.start);d<=Date.parse(w.end);d+=86400000)dates.push(new Date(d).toISOString().slice(0,10));}
 assert.equal(dates[0],'2026-09-06');assert.equal(dates.at(-1),'2026-09-21');assert.equal(dates.length,16);assert.equal(new Set(dates).size,16);
});
