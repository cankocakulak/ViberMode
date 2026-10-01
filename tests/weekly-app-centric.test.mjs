import test from 'node:test';import assert from 'node:assert/strict';
import {operatingRows} from '../scripts/growth-scorecard/operating.mjs';
import {completedCohortRows} from '../scripts/growth-scorecard/completed-cohort.mjs';
import {periodRatio,appleDiscovery,operatingView,strictOperatingView,aggregateMonetization} from '../scripts/growth-scorecard/app-report-model.mjs';
import {appleDiscoveryRows} from '../scripts/growth-scorecard/apple-discovery.mjs';
import {featureView} from '../scripts/growth-scorecard/funnel-presentation.mjs';
import {windowFromStart,metric} from '../scripts/growth-scorecard/core.mjs';
import {notionProperties} from '../scripts/growth-scorecard/notion.mjs';
import {warehouseRows} from '../scripts/growth-scorecard/meeting.mjs';
const week=windowFromStart('2026-09-07'),app={key:'ozard',name:'Ozard',iosAppleId:'123',mixpanel:{projectId:'p',minVersion:'1',minBuild:{ios:1,android:1},cleanSince:'2026-09-01'}};
const project=rows=>warehouseRows(rows.map((r,i)=>({id:String(i),properties:notionProperties(r,week.start)})),rows[0].week);
const ev=(event,id,time,more={})=>({event,properties:{distinct_id:id,platform:'ios',time:Date.parse(time),paywall_view_id:'v',purchase_attempt_id:'a',...more}});
test('operating Sunday activity has no maturity gate; Monday belongs to next week, returning users stay in stages',()=>{
 const data=[ev('app_first_opened','new','2026-09-13T10:00:00Z'),ev('onboarding_completed','new','2026-09-13T10:01:00Z'),ev('paywall_viewed','new','2026-09-13T10:02:00Z'),ev('purchase_started','new','2026-09-13T10:03:00Z'),ev('purchase_completed','new','2026-09-13T10:04:00Z'),ev('paywall_viewed','return','2026-09-13T11:00:00Z'),ev('purchase_started','return','2026-09-13T11:01:00Z'),ev('purchase_completed','return','2026-09-14T00:01:00Z')];
 const view=operatingView(project(operatingRows(data,app,week)),'iOS');assert.deepEqual(view.stages.map(s=>s.count),[1,1,2,2,1]);assert.equal(view.stages[4].cumulative,1);assert.equal(view.stages[4].step,.5);assert.equal(view.stages[4].matched,1);
});
test('missing payment identity suppresses conversion without discarding observed activity',()=>{
 const data=[ev('paywall_viewed','u','2026-09-10T01:00:00Z'),ev('purchase_started','u','2026-09-10T02:00:00Z',{paywall_view_id:null})],v=operatingView(project(operatingRows(data,app,week)),'iOS');assert.equal(v.stages[3].count,1);assert.equal(v.stages[3].step,null);assert.equal(v.stages[4].cumulative,null);
});
test('later report publishes fully mature prior cohort without a row in that historical week',()=>{
 const next=windowFromStart('2026-09-14'),data=[ev('app_first_opened','u','2026-09-13T10:00:00Z'),ev('paywall_viewed','u','2026-09-14T01:00:00Z'),ev('purchase_started','u','2026-09-14T01:01:00Z'),ev('purchase_completed','u','2026-09-14T01:02:00Z')];
 assert.equal(completedCohortRows(data,app,next,new Date('2026-09-18')).length,0);
 const out=completedCohortRows(data,app,next,new Date('2026-09-21'));assert.ok(out.every(r=>r.week===next.start));assert.equal(out[0].cohort.pending,0);assert.equal(out[0].cohort.counts.clientAck,1);assert.equal(out[0].segment,'mature-cohort:2026-09-07');
});
test('Apple native numbers reconcile rounded provider rate; never reverse-divide CVR to invent counts',()=>{
 const d={week:week.start,end:week.end,calendar:'UTC',frequency:'week',checkedAt:'today',account:'owner',apps:{Ozard:{appId:'123',uniqueImpressions:5230,totalDownloads:1624,uniquePageViews:1829}}};
 const rows=project([...appleDiscoveryRows(d,app,week),metric(week,app,'Store CVR','iOS',{value:.3105,status:'EARLY',unit:'ratio',sourceTimezone:'UTC',complete:true,definition:'apple_native_weekly_conversion_rate_v1'})]);
 assert.equal(appleDiscovery(rows,'Ozard').linked,true);assert.equal(appleDiscovery(rows.filter(r=>r.metric!=='Apple Total Downloads'),'Ozard').linked,false);assert.equal(appleDiscoveryRows({...d,week:'2026-08-31'},app,week).length,0);
});
test('period proxy rejects partial and mismatched calendars',()=>{
 const r={week:week.start,appName:'EasySpell',platform:'iOS',calendar:'UTC',value:30,status:'EARLY',semantics:{complete:true}},d={...r,value:195};assert.equal(periodRatio(r,d),30/195);assert.equal(periodRatio(r,{...d,calendar:'Europe/Istanbul'}),null);assert.equal(periodRatio(r,{...d,semantics:{complete:false}}),null);
});
test('aggregate event ratios require identical channel/version/query scope',()=>{
 const names=['onboarding_completed','paywall_viewed','purchase_started','purchase_completed','subscription_activated'];const rows=project(names.map((name,i)=>metric(week,{key:'easyspell',name:'EasySpell'},'iOS Aggregate Monetization Activity','iOS',{segment:name,value:[29,27,5,3,3][i],status:'EARLY',sourceTimezone:'UTC ingestion day',definition:'identity_free_app_store_event_occurrences_v1',population:'same',coverage:{queriedDays:7,queryStart:week.start,queryEnd:week.end}})));
 assert.equal(aggregateMonetization(rows).checkout,5/27);rows[2].semantics.population='different';assert.equal(aggregateMonetization(rows).checkout,null);
});
test('future frozen feature membership evidence allows Core ratio without raw identities',()=>{
 const base={week:week.start,appName:'Ozard',platform:'iOS',country:'GLOBAL',segment:'all',status:'EARLY',calendar:'Europe/Istanbul',sourceAccount:'p',semantics:{population:'same',coverage:null,denominator:10}};
 const rows=[{...base,metric:'Weekly Active Users',value:10},{...base,metric:'Any Core Value Users',value:5},{...base,metric:'Feature Value Reach',segment:'Chat',value:.3,semantics:{...base.semantics,numerator:3,featureMembership:{featureUsers:3,activeCoreFeatureUsers:3,coreUsers:5,wauUsers:10,subsetVerified:true}}}];
 assert.equal(featureView(rows,'iOS')[0].ofCore,.6);rows[2].semantics.featureMembership.coreUsers=6;assert.equal(featureView(rows,'iOS')[0].ofCore,null);
});

test('strict weekly funnel excludes returning activity and out-of-order stages from cumulative subsets',()=>{
 const data=[ev('app_first_opened','new','2026-09-13T10:00:00Z'),ev('onboarding_completed','new','2026-09-13T10:01:00Z'),ev('paywall_viewed','new','2026-09-13T10:02:00Z'),ev('purchase_started','new','2026-09-13T10:03:00Z'),ev('purchase_completed','new','2026-09-13T10:04:00Z'),ev('app_first_opened','late','2026-09-13T11:00:00Z'),ev('paywall_viewed','late','2026-09-13T11:01:00Z'),ev('onboarding_completed','late','2026-09-13T11:02:00Z'),ev('paywall_viewed','return','2026-09-13T12:00:00Z'),ev('purchase_started','return','2026-09-13T12:01:00Z'),ev('purchase_completed','return','2026-09-14T00:01:00Z')];
 const rows=project(operatingRows(data,app,week)),v=strictOperatingView(rows,'iOS');
 assert.equal(v.valid,true);assert.deepEqual(v.stages.map(s=>s.count),[2,2,1,1,1]);assert.deepEqual(v.stages.map(s=>s.step),[null,1,.5,1,1]);assert.deepEqual(v.stages.map(s=>s.cumulative),[1,1,.5,.5,.5]);assert.deepEqual(operatingView(rows,'iOS').stages.map(s=>s.count),[2,2,3,2,1]);
});
test('strict projection rejects non-nested or differently sampled canonical chain evidence',()=>{
 const rows=project(operatingRows([ev('app_first_opened','u','2026-09-10T01:00:00Z')],app,week));
 assert.equal(strictOperatingView(rows,'iOS').valid,true);
 const broken=structuredClone(rows);broken[2].semantics.activity.orderedFromFirstOpen=2;assert.equal(strictOperatingView(broken,'iOS').valid,false);
 const cutoffs=structuredClone(rows);cutoffs[1].notes=cutoffs[1].notes.replace(/Observation cutoff [^ ]+/, 'Observation cutoff 2026-09-01T00:00:00.000Z.');assert.equal(strictOperatingView(cutoffs,'iOS').valid,false);
});
