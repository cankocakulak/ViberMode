import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {saveLifecycle,readLifecycle,weekManifest,advanceWeek,finalizationCutoff,authorizeManualRepair,COLLECTORS,finalWeekMatches} from '../scripts/growth-scorecard/week-lifecycle.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {windowFromStart,metric} from '../scripts/growth-scorecard/core.mjs';
import {appleNativeConversion} from '../scripts/growth-scorecard/stores.mjs';
import {checkoutAckRow,derivedRows} from '../scripts/weekly-app-growth.mjs';
import {notesWithSemantics,parseSemantics,compatibleTrend,trendDelta,rollingTrendRows,weeklyReportTitle,comparisonMetadata} from '../scripts/growth-scorecard/reporting-semantics.mjs';
import {ensureWeeklyHistory,appKpi} from '../scripts/growth-scorecard/meeting.mjs';
import {notionProperties,propertiesMatch,publishNotion} from '../scripts/growth-scorecard/notion.mjs';
const week=windowFromStart('2026-09-07'),app={key:'ozard',name:'Ozard',iosAppleId:'6753729850'};
test('native Apple CVR requires exact identity, full week and weekly aggregation',()=>{
 const d={app:'ozard',appleId:app.iosAppleId,week:week.start,end:week.end,rowStart:week.start,metric:'Conversion Rate',frequency:'WEEKLY',sourceTimezone:'UTC',account:'owner',observedAt:'2026-09-15T12:00:00Z',displayValue:'31.05%'};
 assert.equal(appleNativeConversion(d,app,week).value,.3105);
 for(const patch of [{frequency:'DAILY'},{appleId:'wrong'},{end:'2026-09-12'},{week:'2026-08-31'},{rowStart:'2026-08-31'},{sourceTimezone:'Pacific'},{displayValue:'—'}])assert.equal(appleNativeConversion({...d,...patch},app,week),null);
});
test('checkout ack uses compatible ordered counts, rejects distinct windows/populations',()=>{
 const common={status:'EARLY',definition:'clean_product_v1',source:'Mixpanel raw / canonical events',sourceAccount:'same',sourceTimezone:'Europe/Istanbul',notes:'Observation cutoff 2026-09-15T12:00:00.000Z.',denominator:934};
 const inputs=[metric(week,app,'Paywall → Checkout Conversion','iOS',{...common,value:90/934,numerator:90}),metric(week,app,'Paywall → Client Ack Conversion','iOS',{...common,value:28/934,numerator:28})];
 assert.equal(checkoutAckRow(app,week,inputs,'iOS').value,28/90);
 for(const patch of [{denominator:933},{population:'different-clean-build'},{window:{startAt:'different'}},{sourceAccount:'other'},{numerator:91},{notes:'Observation cutoff 2026-09-16T12:00:00.000Z.'},{definition:'legacy'}])assert.equal(checkoutAckRow(app,week,[inputs[0],{...inputs[1],...patch}],'iOS').value,null);
});
test('UGC mapped minimum is withheld from executive and business CPI',()=>{
 const r=(name,platform,value,extra={})=>metric(week,app,name,platform,{value,status:'READY',complete:true,currency:'TRY',...extra});
 const inputs=[r('Media Ad Spend','All',80),r('UGC Production Cost','All',20,{status:'ESTIMATE',complete:false}),r('Store Downloads','iOS',25),r('Store Downloads','Android',25)];
 assert.equal(derivedRows({apps:[app]},week,inputs).find(r=>r.metric==='CPI').value,null);
 assert.equal(appKpi([{appName:'Ozard',metric:'UGC Production Cost',platform:'All',segment:'all',value:25.02,status:'ESTIMATE'}],'Ozard','UGC Production Cost').text,'—');
});
const trend=(w,value,extra={})=>({week:w,appName:'Ozard',metric:'Verified Revenue',platform:'iOS',segment:'all',value,unit:'money',currency:'USD',calendar:'UTC',source:'RC',sourceAccount:'same',status:'EARLY',weekStatus:'FINAL',finalizedVerified:true,semantics:{v:1,definition:'v1',complete:true,mature:true,population:null,cohortLag:null,cohortPlan:null},...extra});
test('trends require adjacent complete compatible definitions, calendars, currencies and populations',()=>{
 const a=trend('2026-09-07',120),b=trend('2026-08-31',100);assert.equal(trendDelta(a,b),'↑20.0%');
 for(const patch of [{week:'2026-08-24'},{currency:'TRY'},{calendar:'Europe/Istanbul'},{platform:'Android'},{semantics:{...b.semantics,definition:'v2'}},{semantics:{...b.semantics,complete:false}},{semantics:{...b.semantics,mature:false}},{semantics:{...b.semantics,population:'new-build'}},{semantics:null}])assert.ok(!compatibleTrend(a,{...b,...patch}));
 assert.equal(trendDelta(a,{...b,value:0}),'');assert.equal(trendDelta({...a,unit:'ratio',value:.121},{...b,unit:'ratio',value:.1}),'+2.1pp');
 const rows=rollingTrendRows([a,trend('2026-08-24',50)],week,'Ozard',r=>String(r.value)).find(r=>r.metric==='Verified Revenue'&&r.platform==='iOS');assert.deepEqual(rows.cells,['Revenue · iOS','—','50','—','120']);
});
test('mature renewal comparisons align relative cohort age, not calendar cohort identity',()=>{
 const a=trend('2026-09-07',.5,{metric:'Subscription W1',unit:'ratio',segment:'mature-cohort:2026-08-31;plan:P1W'}),b=trend('2026-08-31',.4,{metric:'Subscription W1',unit:'ratio',segment:'mature-cohort:2026-08-24;plan:P1W'});
 a.semantics={...a.semantics,cohortLag:7,cohortPlan:'P1W'};b.semantics={...b.semantics,cohortLag:7,cohortPlan:'P1W'};assert.equal(trendDelta(a,b),'+10.0pp');assert.ok(!compatibleTrend(a,{...b,semantics:{...b.semantics,cohortLag:14}}));
});
test('long caveats survive existing Notes property; immature product cohorts are not trends',()=>{
 const r=metric(week,app,'D7','iOS',{status:'EARLY',value:.1,definition:'v1',source:'raw canonical events',notes:'x'.repeat(3000)+' Observation cutoff 2026-09-15T12:00:00.000Z; immature 2 excluded.'});
 assert.equal(comparisonMetadata(r).mature,false);assert.equal(comparisonMetadata(r).complete,true);const notes=notionProperties(r,week.start).Notes.rich_text.map(t=>t.text.content).join('');assert.equal(notes,notesWithSemantics(r));assert.equal(parseSemantics(notes).definition,'v1');
});
function fakeNotion(){
 let next=0;const children=new Map([['parent',[]]]),pages=new Map(),writes=[];
 const put=(id,blocks)=>children.set(id,blocks.map(b=>{const copy=structuredClone(b);copy.id='block'+(++next);copy.has_children=!!copy[copy.type].children;if(copy.has_children){put(copy.id,copy[copy.type].children);delete copy[copy.type].children;}return copy;}));
 const api=async(endpoint,method='GET',body)=>{
  if(method!=='GET')writes.push({endpoint,method,body:structuredClone(body)});
  if(endpoint==='pages'&&method==='POST'){const id='page'+(++next),title=body.properties.title.title.map(t=>t.text.content).join('');pages.set(id,{id,is_locked:false});children.get(body.parent.page_id).push({id,type:'child_page',child_page:{title}});put(id,body.children);return {id};}
  const id=endpoint.split('/')[1];if(endpoint.startsWith('blocks/')){
   if(method==='DELETE'){for(const [parent,rows]of children)children.set(parent,rows.filter(b=>b.id!==id));return {};}
   if(method==='PATCH'){const old=children.get(id)||[];put(id,body.children);children.set(id,[...old,...children.get(id)]);return {};}
   return {results:structuredClone(children.get(id)||[]),has_more:false};
  }
  if(method==='PATCH'){Object.assign(pages.get(id),body);return structuredClone(pages.get(id));}return structuredClone(pages.get(id));
 };return {api,writes,children,pages};
}
test('only FINAL weeks create archives; verified archives reject later canonical drift',async()=>{
 assert.equal(weeklyReportTitle('2026-09-07'),'W37 · Sep 7–13, 2026');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'week-final-')),f=fakeNotion(),config={lifecycleFile:path.join(dir,'state.json'),notion:{parentPageId:'parent',databaseId:'warehouse'}},r=metric(week,app,'Verified Revenue','iOS',{value:20,status:'EARLY',notes:'as-of caveat',definition:'v1'}),page={id:'source',properties:notionProperties(r,week.start)},render=()=>({blocks:[]});
 try{
  for(const status of ['OPEN','RECONCILING']){saveLifecycle(config,{version:1,weeks:{[week.start]:{status}}});assert.equal((await ensureWeeklyHistory(config,[page],f.api,render)).created,0);assert.equal(f.writes.length,0);}
  const state={version:1,weeks:{[week.start]:{status:'FINAL',finalizedAt:'2026-09-18T19:00:00Z',...weekManifest([page],week.start),snapshot:{status:'BUILDING',capturedAt:'2026-09-18T19:00:00Z'}}}};saveLifecycle(config,state);
  const first=await ensureWeeklyHistory(config,[page],f.api,render);assert.equal(first.created,2);assert.ok(f.pages.get(first.reports[0].pageId).is_locked);const frozen=JSON.stringify([...f.children]);assert.match(frozen,/as-of caveat/);
  f.writes.length=0;assert.equal((await ensureWeeklyHistory(config,[page],f.api,render)).created,0);assert.equal(f.writes.length,0);
  page.properties.Value.number=99;await assert.rejects(ensureWeeklyHistory(config,[page],f.api,render),/Final canonical week changed/);assert.equal(f.writes.length,0);assert.equal(JSON.stringify([...f.children]),frozen);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('Friday cutoff requires successful post-cutoff collection and warehouse verification; replay cannot finalize',()=>{
 const page={properties:notionProperties(metric(week,app,'Store Downloads','Android',{value:10,status:'EARLY',notes:'PARTIAL 2/7 days'}),week.start)};
 const report=(at,ok=true)=>({week,rows:[{metric:'Store Downloads'}],reconciliation:{mode:'collection',startedAt:at,completedAt:new Date(Date.parse(at)+60000).toISOString(),collectors:COLLECTORS.map(name=>({name,ok,rowCount:1}))}});
 const now=new Date('2026-09-18T20:00:00Z');assert.equal(finalizationCutoff(week.start),'2026-09-18T21:30:00+03:00');
 let state=advanceWeek(null,report('2026-09-14T18:30:00Z'),[page],now);assert.equal(state.status,'OPEN');
 state=advanceWeek(state,report('2026-09-16T18:30:00Z'),[page],now);assert.equal(state.status,'RECONCILING');
 assert.equal(advanceWeek(state,{week,rows:[]},[page],now).status,'RECONCILING');
 const cached=report('2026-09-18T18:30:00Z');cached.reconciliation.mode='cached-product';assert.equal(advanceWeek(state,cached,[page],now).status,'RECONCILING');
 assert.equal(advanceWeek(state,report('2026-09-18T18:29:59Z'),[page],now).status,'RECONCILING');
 assert.equal(advanceWeek(state,report('2026-09-18T18:30:00Z',false),[page],now).status,'RECONCILING');
 const transport=report('2026-09-18T18:30:00Z');transport.rows.push({metric:'Paywall Reach',status:'WAITING',releaseValidation:{review:[{reasons:['Product projection response invalid or exceeds per-platform bound']}]}});
 const blocked=advanceWeek(state,transport,[page],now);assert.equal(blocked.status,'RECONCILING');assert.equal(blocked.runs.at(-1).success,false);assert.equal(blocked.runs.at(-1).collectionErrors.length,1);
 transport.rows.at(-1).releaseValidation.review[0].reasons=['Unvalidated production build'];assert.equal(advanceWeek(state,transport,[page],now).status,'FINAL');
 const final=advanceWeek(state,report('2026-09-18T18:30:00Z'),[page],now);assert.equal(final.status,'FINAL');assert.equal(final.exclusions.length,1);assert.ok(finalWeekMatches([page],week.start,final));
 assert.equal(advanceWeek(final,report('2026-09-20T18:30:00Z'),[page],now),final);
});
test('FINAL state is verified against canonical content; partial/open/drifted rows cannot enter trends',()=>{
 const a=trend('2026-09-07',120),b=trend('2026-08-31',100);for(const patch of [{weekStatus:'OPEN'},{weekStatus:'RECONCILING'},{finalizedVerified:false},{semantics:{...a.semantics,coverage:{observedDays:6,expectedDays:7}}},{notes:'PARTIAL 6/7 days'}])assert.equal(trendDelta({...a,...patch},b),'');
});
test('manual W37 repair authorization is one-time, carries exclusions, rejects a changed replay',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'week-repair-')),config={lifecycleFile:path.join(dir,'state.json')},page={properties:notionProperties(metric(week,app,'Store Downloads','Android',{value:36,status:'EARLY',notes:'PARTIAL 4/7 days'}),week.start)},args={correctionId:'W37-once',reason:'Explicit user repair',pageId:'archive'};
 try{const first=authorizeManualRepair(config,[page],week.start,args),again=authorizeManualRepair(config,[page],week.start,args);assert.deepEqual(first,again);assert.equal(first.weeks[week.start].mode,'MANUAL_CORRECTION');assert.equal(first.weeks[week.start].exclusions.length,1);page.properties.Value.number=37;assert.throws(()=>authorizeManualRepair(config,[page],week.start,args),/changed after authorized correction/);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('canonical read-back verifies definitions, coverage, dimensions and units as well as numbers',()=>{
 const expected=notionProperties(metric(week,app,'Verified Revenue','iOS',{value:20,status:'EARLY',notes:'complete coverage',definition:'v1'}),week.start);
 assert.ok(propertiesMatch(structuredClone(expected),expected));
 for(const [key,value]of Object.entries({Notes:{rich_text:[{text:{content:'stale coverage'}}]},Unit:{rich_text:[{text:{content:'wrong unit'}}]},Country:{select:{name:'TR'}},Week:{date:{start:'2026-08-31'}}})){const actual=structuredClone(expected);actual[key]=value;assert.equal(propertiesMatch(actual,expected),false);}
});

test('FINAL publisher ignores a stale replay without writes and rejects live canonical drift',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'week-protected-')),config={lifecycleFile:path.join(dir,'state.json'),notion:{dataSourceId:'warehouse'}},oldWeek=windowFromStart('2026-08-31');
 const original=metric(oldWeek,app,'Verified Revenue','iOS',{value:20,status:'EARLY',notes:'verified coverage',definition:'v1'}),page={id:'canonical',properties:notionProperties(original,oldWeek.start)};
 saveLifecycle(config,{version:1,weeks:{[oldWeek.start]:{status:'FINAL',...weekManifest([page],oldWeek.start)}}});
 const originalFetch=globalThis.fetch,originalToken=process.env.NOTION_API_KEY,calls=[];process.env.NOTION_API_KEY='test-only-not-a-real-token';
 globalThis.fetch=async(url,options)=>{calls.push({url,method:options.method});assert.equal(url,'https://api.notion.com/v1/data_sources/warehouse/query');assert.equal(options.method,'POST');return {ok:true,status:200,json:async()=>({results:[page],has_more:false})};};
 try{const stale=metric(oldWeek,app,'Verified Revenue','iOS',{value:99,status:'EARLY'}),result=await publishNotion(config,{week:oldWeek,rows:[stale]},{recordRun:true});assert.equal(result.finalizedWriteProtected,true);assert.equal(result.updated,0);assert.equal(result.created,0);assert.equal(page.properties.Value.number,20);assert.equal(calls.length,1);page.properties.Value.number=21;await assert.rejects(publishNotion(config,{week:oldWeek,rows:[stale]}),/Final canonical week changed/);assert.equal(calls.length,2);}
 finally{globalThis.fetch=originalFetch;if(originalToken===undefined)delete process.env.NOTION_API_KEY;else process.env.NOTION_API_KEY=originalToken;fs.rmSync(dir,{recursive:true,force:true});}
});
