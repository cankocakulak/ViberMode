import test from 'node:test';
import assert from 'node:assert/strict';
import {appKpi,meetingTable,featureLines,acquisitionInsight} from '../scripts/growth-scorecard/meeting.mjs';
const row=(platform,value,extra={})=>({pageId:platform,week:'2026-09-07',appName:'Ozard',metric:'Verified Revenue',platform,segment:'all',value,unit:'money',currency:'USD',calendar:'UTC',source:'RevenueCat Charts API',sourceAccount:'same-project',status:'EARLY',previous:null,wow:null,notes:'',weekStatus:'FINAL',finalizedVerified:true,comparisonVerified:true,...extra});
test('executive total reconciles compatible platform values including genuine zero',()=>{
 const r=[row('iOS',432.45),row('Android',295.43)];const k=appKpi(r,'Ozard','Verified Revenue',{breakdown:true});assert.equal(k.value,727.88);assert.equal(k.text,'$727.88\niOS $432.45 · Android $295.43');assert.equal(k.sources.length,2);
 const p=r.map((r,i)=>({...r,metric:'RevenueCat Verified Initial Purchases',unit:'verified new paid transactions',currency:'',value:i?0:30}));assert.equal(appKpi(p,'Ozard','RevenueCat Verified Initial Purchases').text,'30');
});
test('missing/incompatible platforms never masquerade as full total',()=>{
 for(const extra of [{currency:'TRY'},{calendar:'Europe/Istanbul'},{unit:'proceeds'},{notes:'Latest chart period incomplete.'}])assert.ok(appKpi([row('iOS',10),row('Android',20,extra)],'Ozard','Verified Revenue').split);
 const k=appKpi([row('iOS',10),row('Android',null,{status:'WAITING'})],'Ozard','Verified Revenue');assert.equal(k.text,'$10.00 (iOS)');assert.equal(k.aggregated,undefined);
});
test('ratios are not averaged and missing KPI has no status jargon',()=>{
 const rows=[row('iOS',.1,{metric:'D1',unit:'ratio',currency:''}),row('Android',.8,{metric:'D1',unit:'ratio',currency:''})];assert.equal(appKpi(rows,'Ozard','D1').text,'10.0% (iOS)\n80.0% (Android)');
 assert.equal(appKpi([], 'Ozard','CPI').text,'—');assert.equal(meetingTable([]).length,10);assert.ok(!JSON.stringify(meetingTable([])).match(/WAITING|EARLY|N\/A/));
});
test('WoW uses compatible canonical previous values, never averages platform percentages',()=>{
 const rows=[row('iOS',120,{status:'READY',previous:100,wow:.2}),row('Android',20,{status:'READY',previous:10,wow:1})];const k=appKpi(rows,'Ozard','Verified Revenue');assert.equal(k.text,'$140.00\nPrev $110.00 · +27.3% WoW');
 rows[1].previous=null;assert.equal(appKpi(rows,'Ozard','Verified Revenue').text,'$140.00');
 assert.equal(appKpi([row('All',10,{status:'READY',previous:0,wow:null})],'Ozard','Verified Revenue').text,'$10.00\nPrev $0.00');
 const ratio=row('iOS',.121,{metric:'D1',unit:'ratio',currency:'',status:'READY',previous:.1,wow:.21});assert.match(appKpi([ratio],'Ozard','D1').text,/\+2.1pp/);
});
test('feature ranking follows raw values and keeps incompatible population rankings separate',()=>{
 const names=['Chat','Notes','Library','Quiz','Solver','Podcast'];const rows=names.flatMap((name,i)=>['iOS','Android'].map(platform=>row(platform,(6-i)/10,{metric:'Feature Value Reach',segment:name,unit:'ratio',currency:''})));
 assert.equal(featureLines(rows,'Ozard')[0],'Chat — iOS 60.0% · Android 60.0%');rows.find(r=>r.platform==='Android'&&r.segment==='Podcast').value=.9;
 assert.equal(featureLines(rows,'Ozard')[0],'Chat 60.0% (iOS) · Podcast 90.0% (Android)');assert.deepEqual(featureLines([], 'EasySpell'),[]);
});
test('acquisition narrative cannot infer efficiency from a spend component',()=>{
 const rows=[row('All',10,{metric:'Media Ad Spend Component'})];const s=acquisitionInsight(rows,'Ozard');assert.match(s,/medya harcaması/);assert.match(s,/CPI üzerinden verimlilik yorumu yapılamıyor/);
});

test('empty optional children normalize like Notion without changing populated archive blocks',async()=>{
 const {canonicalBlock}=await import('../scripts/growth-scorecard/meeting.mjs');
 const base={type:'toggle',toggle:{rich_text:[{type:'text',text:{content:'No additional diagnostics'}}]}};
 assert.deepEqual(canonicalBlock({...base,toggle:{...base.toggle,children:[]}}),canonicalBlock(base));
 const populated={...base,toggle:{...base.toggle,children:[{type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:'Preserved'}}]}}]}};
 assert.equal(canonicalBlock(populated).children[0].text[0].text,'Preserved');
});
