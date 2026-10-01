import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWeeklySheets} from '../scripts/growth-scorecard/google-sheets.mjs';
import {metric,windowFromStart} from '../scripts/growth-scorecard/core.mjs';
import {notionProperties} from '../scripts/growth-scorecard/notion.mjs';
import {weekManifest} from '../scripts/growth-scorecard/week-lifecycle.mjs';

const config={apps:[{key:'ozard',name:'Ozard'},{key:'easyspell',name:'EasySpell'}]};
const row=metric(windowFromStart('2026-09-07'),config.apps[0],'Store Downloads','iOS',{value:1494,status:'READY',sourceTimezone:'America/Los_Angeles',complete:true,definition:'first-downloads'});
const pages=[{id:'source-page',properties:notionProperties(row,'2026-09-07')}];
const lifecycle={weeks:{'2026-09-07':{status:'FINAL',...weekManifest(pages,'2026-09-07')}}};
const sheetState={sheets:[['Ozard',21092201],['EasySpell',21092202],['_Weekly Source',21092203]].map(([title,sheetId])=>({properties:{title,sheetId,gridProperties:{rowCount:700,columnCount:26}},merges:[],rowGroups:[]}))};
sheetState.sheets.push({properties:{title:'Haftalık Giriş',sheetId:596298529,gridProperties:{rowCount:1384,columnCount:44}}});
const build=(p=pages,l=lifecycle,date='2026-09-22T08:00:00Z')=>buildWeeklySheets(p,config,l,{sheetState,asOf:date});

test('deterministic presentation preserves FINAL values and appends current budget week',()=>{
 const first=build(),second=build();assert.deepEqual(first,second);
 assert.deepEqual(first.plan.weeks,['2026-09-07','2026-09-21']);
 const source=first.batches.find(b=>b.kind==='source-0').requests[0].updateCells.rows;
 assert.equal(source[1].values[7].userEnteredValue.numberValue,1494);
 assert.equal(pages[0].properties.Value.number,1494);
});
test('FINAL fingerprint drift blocks publication',()=>{
 const changed=structuredClone(pages);changed[0].properties.Value.number=1495;
 assert.throws(()=>build(changed),/FINAL manifest drift/);
});
test('all mutations remain inside three owned tabs; no budget input writes',()=>{
 const allowed=new Set([21092201,21092202,21092203]);
 for(const b of build().batches)for(const req of b.requests){
  const x=Object.values(req)[0],id=x.range?.sheetId??x.properties?.sheetId??x.dimensionGroup?.range?.sheetId;
  assert.ok(allowed.has(id));assert.ok(!req.addSheet&&!req.deleteSheet);
 }
});
test('future week columns remain unique and valid across a year boundary',()=>{
 const out=build(pages,lifecycle,'2027-01-05T08:00:00Z');
 assert.deepEqual(out.plan.weeks,['2026-09-07','2027-01-04']);
 const title=out.batches.find(b=>b.kind==='Ozard-values-0').requests[0].updateCells.rows[0];
 assert.equal(title.values[4].userEnteredValue.stringValue,'W1');
});
test('budget formulas keep blank actuals unavailable and require verified registered rows',()=>{
 const rows=build().batches.filter(b=>b.kind.startsWith('Ozard-values')).flatMap(b=>b.requests[0].updateCells.rows);
 const actual=rows.find(r=>r.values[0].userEnteredValue.stringValue?.startsWith('Girilen gerçekleşen'));
 const complete=rows.find(r=>r.values[0].userEnteredValue.stringValue?.startsWith('Doğrulanmış bütçe'));
 assert.match(actual.values[4].userEnteredValue.formulaValue,/ISNUMBER/);
 assert.match(actual.values[4].userEnteredValue.formulaValue,/=0,"—"/);
 assert.match(complete.values[4].userEnteredValue.formulaValue,/MATCH\("Harcama geçerli"/);
 assert.match(actual.values[4].userEnteredValue.formulaValue,/MATCH\("Gerçek harcama \$"/);
 assert.match(actual.values[4].userEnteredValue.formulaValue,/\$A\$3:\$AR\$1384/);
 const planned=rows.find(r=>r.values[0].userEnteredValue.stringValue==='Planlanan bütçe');
 assert.match(planned.values[4].userEnteredValue.formulaValue,/MATCH\("Bütçe hedefi \$"/);
});

test('budget formulas fail closed without fresh budget metadata',()=>{
 const withoutBudget={sheets:sheetState.sheets.filter(s=>s.properties.title!=='Haftalık Giriş')};
 assert.throws(()=>buildWeeklySheets(pages,config,lifecycle,{sheetState:withoutBudget}),/Fresh budget tab metadata/);
});
