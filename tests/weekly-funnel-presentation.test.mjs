import {matureJourneyCounts} from '../scripts/growth-scorecard/mature-journey.mjs';
import {compactRich} from '../scripts/growth-scorecard/meeting.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {diagnosticEconomics,alignedAggregate,maturePaymentView,storeView,paymentView,usageView,featureView,easyAggregateView,withFunnelComparison,stageText} from '../scripts/growth-scorecard/funnel-presentation.mjs';
const base=(metric,value,extra={})=>({pageId:metric,week:'2026-09-07',weekStatus:'FINAL',finalizedVerified:true,appName:'Ozard',platform:'iOS',country:'GLOBAL',segment:'all',unit:'ratio',currency:'',metric,value,status:'EARLY',calendar:'Europe/Istanbul',source:'canonical source',sourceAccount:'project',notes:'Observation cutoff 2026-09-16T12:00:00.000Z.',semantics:{v:1,definition:'clean_product_v1',population:'clean-versions',complete:true,mature:true,numerator:null,denominator:null},...extra});
const semantics=(r,patch)=>({...r,semantics:{...r.semantics,...patch}});
const rate=(metric,n,d,extra={})=>semantics(base(metric,n/d,extra),{numerator:n,denominator:d});
function usage(){return [base('Weekly Active Users',100,{unit:'unique identity clusters'}),base('Any Core Value Users',40,{unit:'unique identity clusters'}),base('No Core Value Users',60,{unit:'unique identity clusters'}),rate('Core Value Reach',40,100),rate('No Core Value Reach',60,100),base('Repeat Core Value Users',10,{unit:'unique identity clusters',notes:'At least two distinct session_id values containing core.'}),base('No Core Value Diagnostic Users',60,{segment:'Navigation',unit:'unique identity clusters'})].map(r=>semantics(r,{definition:'usage_coverage_active_intersection_v1',denominator:r.metric==='No Core Value Diagnostic Users'?60:100}));}
function payment(){return [rate('Paywall Reach',20,40,{notes:'Ordered first-open cohort; immature 60 excluded.'}),base('Unique Paywall Viewers',100,{unit:'unique identity clusters'}),rate('Paywall → Checkout Conversion',10,100),rate('Paywall → Client Ack Conversion',3,100),semantics(rate('Checkout → Client Ack Conversion',3,10),{definition:'ordered_checkout_ack_v1'})];}
const pt=(v,id)=>v.points.find(p=>p.id===id);
test('Apple native denominator is never inferred from rounded CVR or first downloads',()=>{
 const rows=[semantics(base('Store CVR',.3105),{definition:'apple_native_weekly_conversion_rate_v1'}),base('Product Page Views',2611),base('Store Downloads',1494)];const v=storeView(rows,'Ozard','iOS');assert.equal(v.linked,false);assert.equal(pt(v,'impressions').count,null);assert.equal(pt(v,'native').rate,.3105);assert.equal(pt(v,'views').rate,null);assert.equal(pt(v,'downloads').rate,null);
});
test('Play links matched listing denominator, not all observed visitors or device downloads',()=>{
 const c=semantics(rate('Store CVR',15,66,{platform:'Android'}),{definition:'play_listing_acquisition_conversion_v1',complete:false,coverage:{expectedDays:7,observedDays:2,dates:['2026-09-10','2026-09-11'],numeratorDates:['2026-09-10','2026-09-11'],denominatorDates:['2026-09-10','2026-09-11']}});
 const rows=[c,base('Product Page Views',79,{platform:'Android'}),base('Store Downloads',36,{platform:'Android'})];let v=storeView(rows,'Ozard','Android');assert.equal(v.linked,true);assert.equal(pt(v,'listing-base').count,66);assert.equal(pt(v,'listing-acquisitions').count,15);assert.equal(pt(v,'views').count,79);assert.equal(pt(v,'downloads').rate,null);assert.match(stageText(pt(v,'listing-acquisitions')),/PARTIAL 2\/7/);
 c.semantics.coverage.denominatorDates=['2026-09-11'];v=storeView(rows,'Ozard','Android');assert.equal(v.linked,false);assert.equal(pt(v,'listing-acquisitions').rate,null);
});
test('payment cohorts stay separate and ordered weekly stages require exact shared counts and cutoffs',()=>{
 const rows=payment(),v=paymentView(rows,'iOS');assert.equal(v.cohortLinked,true);assert.equal(v.weeklyLinked,true);assert.equal(pt(v,'eligible').count,40);assert.equal(pt(v,'cohort-paywall').count,20);assert.equal(pt(v,'viewers').count,100);assert.equal(pt(v,'ack').rate,.3);assert.equal(pt(v,'ack').overall,.03);assert.equal(pt(v,'cohort-paywall').immature,60);
 for(const mutate of [rs=>rs[3].semantics.denominator=99,rs=>rs[2].semantics.population='other cohort',rs=>rs[4].notes='Observation cutoff 2026-09-17T12:00:00.000Z.',rs=>rs[1].value=101]){const copy=structuredClone(rows);mutate(copy);const bad=paymentView(copy,'iOS');assert.equal(bad.weeklyLinked,false);assert.equal(pt(bad,'ack').rate,null);}
 assert.ok(!v.points.some(p=>p.id.includes('verified')));
});
test('usage uses a proven partition and repeat/core ratio, with exact non-core decomposition',()=>{
 const v=usageView(usage());assert.equal(v.linked,true);assert.equal(v.repeatLinked,true);assert.equal(pt(v,'repeat').rate,.25);assert.equal(pt(v,'repeat').overall,.1);assert.equal(v.coverage.reduce((s,x)=>s+x.rate,0),1);assert.equal(v.diagnostics[0].rate,1);
 for(const mutate of [rs=>rs[2].value=59,rs=>rs[1].semantics.population='different',rs=>rs[4].semantics.denominator=99]){const rs=usage();mutate(rs);const bad=usageView(rs);assert.equal(bad.coverage,null);assert.equal(bad.repeatLinked,false);}
 const rs=usage();rs[6].value=59;assert.deepEqual(usageView(rs).diagnostics,[]);
});
test('feature core penetration needs canonical-compatible identity subset proof',()=>{
 const rows=[...usage(),rate('Feature Value Reach',20,100,{segment:'Chat'})];const f=featureView(rows,'iOS',{canonicalCountsMatch:true,featureSubset:{Chat:true}})[0];assert.equal(f.users,20);assert.equal(f.ofWau,.2);assert.equal(f.ofCore,.5);
 assert.equal(featureView(rows,'iOS',null)[0].ofCore,null);assert.equal(featureView(rows,'iOS',{canonicalCountsMatch:false,featureSubset:{Chat:true}})[0].ofCore,null);assert.equal(featureView(rows,'iOS',{canonicalCountsMatch:true,featureSubset:{Chat:false}})[0].ofCore,null);
});
test('EasySpell iOS aggregate event counts never acquire a user/session conversion rate',()=>{
 const rows=['learning_session_started','learning_session_completed','activity_completed','app_opened','session_started'].map((segment,i)=>base('iOS Aggregate Usage',[85,48,323,54,86][i],{appName:'EasySpell',segment}));const v=easyAggregateView(rows);assert.deepEqual(v.map(p=>p.count),[85,48,323,54,86]);assert.ok(v.every(p=>p.rate===null&&p.eventCount));
});
test('W38 FINAL stage comparisons show both count and pp changes from compatible W37',()=>{
 const prior=usage(),current=usage().map(r=>({...r,week:'2026-09-14'}));current[1].value=50;current[2].value=50;current[3].value=.5;current[3].semantics.numerator=50;current[4].value=.5;current[4].semantics.numerator=50;current[5].value=20;
 const v=withFunnelComparison(usageView(current),usageView(prior));assert.match(stageText(pt(v,'core')),/Prev 40 · \+25.0% WoW/);assert.match(stageText(pt(v,'core')),/Prev 40.0% · \+10.0pp/);assert.match(stageText(pt(v,'repeat')),/Prev 10 · \+100.0% WoW/);assert.match(stageText(pt(v,'repeat')),/Prev 25.0% · \+15.0pp/);
 for(const patch of [{weekStatus:'OPEN'},{finalizedVerified:false},{semantics:{...current[5].semantics,complete:false}},{calendar:'UTC'},{semantics:{...current[5].semantics,mature:false}}]){const copy=structuredClone(current);copy[5]={...copy[5],...patch};const blocked=withFunnelComparison(usageView(copy),usageView(prior));assert.equal(pt(blocked,'repeat').previous,null);}
});
test('missing previous week or partial store week never produces a funnel delta',()=>{
 const r=semantics(rate('Store CVR',50,100,{platform:'Android'}),{definition:'play_listing_acquisition_conversion_v1',complete:false,coverage:{dates:['2026-09-07'],numeratorDates:['2026-09-07'],denominatorDates:['2026-09-07'],observedDays:1,expectedDays:7}});const now=storeView([r],'Ozard','Android'),old=storeView([{...r,week:'2026-08-31'}],'Ozard','Android');assert.ok(withFunnelComparison(now,old).points.every(p=>p.previous===null));assert.ok(withFunnelComparison(usageView(usage()),usageView([])).points.every(p=>p.previous===null));
});

test('Notion paragraph style merging is normalized without changing archive fingerprint rules',()=>{
 const part=(content,color)=>({type:'text',text:{content},...(color?{annotations:{color}}:{})});const input=[part('iOS'),part('██','green'),part('░░','gray'),part(''),part('\nCounts','gray'),part('\nTotal','gray')];const original=structuredClone(input);const out=compactRich(input);assert.equal(out.length,3);assert.equal(out[2].text.content,'░░\nCounts\nTotal');assert.deepEqual(input,original);assert.deepEqual(compactRich(out),out);
});

test('diagnostic spend ratios require app/platform/week/calendar coverage; known spend remains visible',()=>{
 const spend=base('Media Ad Spend Component',100,{unit:'money',currency:'TRY',segment:'Google Ads'}),downloads=base('Store Downloads',50,{unit:'count'}),installs=base('AppsFlyer Paid Installs Component',10,{unit:'attributed installs',segment:'googleadwords_int'});
 const get=rs=>diagnosticEconomics(rs)[0];assert.equal(get([spend,downloads,installs]).knownSpendPerDownload,2);assert.equal(get([spend,downloads,installs]).networkPaidCpi,10);
 assert.equal(get([spend,{...downloads,calendar:'UTC'},installs]).knownSpendPerDownload,null);assert.equal(get([spend,semantics(downloads,{complete:false}),installs]).knownSpendPerDownload,null);assert.equal(get([spend,downloads,{...installs,value:0}]).networkPaidCpi,null);assert.equal(get([{...spend,platform:'All'},downloads,installs]).knownSpendPerDownload,null);
 assert.equal(get([spend,{...downloads,calendar:'UTC'},installs]).spend,100);
 const floor=get([semantics(spend,{complete:false}),downloads,installs]);assert.equal(floor.knownSpendPerDownload,2);assert.equal(floor.networkPaidCpi,null);assert.match(floor.costFloorCaveat,/unknown networks and UGC excluded/);assert.equal(floor.costFloorFormula,'100 TRY / 50 count');
 assert.equal(get([semantics(spend,{complete:false,coverage:{dates:['2026-09-06']}}),downloads,installs]).knownSpendPerDownload,null);
 assert.equal(get([spend,semantics(downloads,{coverage:{expectedDays:7,observedDays:6}}),installs]).knownSpendPerDownload,null);
 const proxy=semantics(base('Paid Media CPI Component',10,{unit:'money / attributed install',currency:'TRY',segment:'Google Ads'}),{numerator:100,denominator:10});const d=get([spend,downloads,{...installs,calendar:'UTC'},proxy]);assert.equal(d.networkPaidCpi,null);assert.equal(d.networkPaidDateProxy,10);
});
test('identity-free aggregate ratio is permitted only for audited identical weekly scope, never paired sessions',()=>{
 const rows=['learning_session_started','learning_session_completed','activity_completed','app_opened','session_started'].map((segment,i)=>semantics(base('iOS Aggregate Usage',[85,48,323,54,86][i],{appName:'EasySpell',segment,calendar:'UTC ingestion day'}),{definition:'identity_free_app_store_event_occurrences_v1',complete:false}));
 const proof={canonicalValuesMatch:true,sameLearningAggregateScope:true,queriedDays:7};const out=alignedAggregate(rows,proof);assert.equal(out.completionEventRatio,48/85);assert.equal(out.pairedSessions,false);assert.equal(out.populationIncomplete,true);
 assert.equal(alignedAggregate(rows,{...proof,sameLearningAggregateScope:false}).completionEventRatio,null);assert.equal(alignedAggregate(rows,{...proof,canonicalValuesMatch:false}).completionEventRatio,null);assert.equal(alignedAggregate(rows,{...proof,queriedDays:6}).completionEventRatio,null);
 const future=rows.map(r=>semantics({...r,week:'2026-09-14'},{population:'ios/app_store/1.0.16',coverage:{queriedDays:7,queryStart:'2026-09-14',queryEnd:'2026-09-20',observedDays:3,expectedDays:7}}));
 assert.equal(alignedAggregate(future,null).completionEventRatio,48/85);
 future[1].semantics.population='ios/app_store/another-version';assert.equal(alignedAggregate(future,null).completionEventRatio,null);
 future[0].semantics.coverage.queryEnd='2026-09-19';assert.equal(alignedAggregate(future,null).aligned,false);
});
test('same-cohort product journey enforces view, attempt and chronological links within first-open + seven days',()=>{
 const event=(event,time,view='v1',attempt='a1')=>({event,properties:{time,paywall_view_id:view,purchase_attempt_id:attempt}});const birth=1000,eligible=[['u',birth]],valid=[event('paywall_viewed',1001),event('purchase_started',1002),event('purchase_completed',1003)];
 const count=events=>matureJourneyCounts(eligible,new Map([['u',events]]));assert.deepEqual({...count(valid)},{firstOpen:1,paywallViewed:1,checkoutStarted:1,clientAck:1,missingViewIds:0,missingAttemptIds:0,unlinkedCheckoutEvents:0,unlinkedAckEvents:0,completeLinks:true});
 assert.equal(count([valid[0],{...valid[1],properties:{...valid[1].properties,paywall_view_id:'different'}},valid[2]]).checkoutStarted,0);
 assert.equal(count([valid[0],valid[1],event('purchase_completed',1003,'v1','wrong')]).clientAck,0);
 assert.equal(count([valid[0],valid[1],event('purchase_completed',birth+7*86400000)]).clientAck,0);
 assert.equal(count([event('paywall_viewed',999),valid[1],valid[2]]).paywallViewed,0);
 assert.equal(count([valid[0],event('purchase_started',1002,'v1',null),valid[2]]).completeLinks,false);
 assert.equal(count([valid[0],event('purchase_started',1002,null),valid[2]]).completeLinks,false);
 assert.equal(count([valid[0],valid[1],event('purchase_completed',1003,'other')]).unlinkedAckEvents,1);
});
test('mature end-to-end display needs newly canonical stages and same cohort cutoff, not weekly checkout totals',()=>{
 const reach=rate('Paywall Reach',212,430),checkout=semantics(rate('Mature Cohort Paywall → Checkout',21,212),{definition:'mature_first_open_7d_journey_v1'}),ack=semantics(rate('Mature Cohort Checkout → Client Ack',12,21),{definition:'mature_first_open_7d_journey_v1'});
 const v=maturePaymentView([reach,checkout,ack],'iOS');assert.equal(v.linked,true);assert.equal(pt(v,'ack').overall,12/430);assert.equal(maturePaymentView([reach,checkout],'iOS').linked,false);assert.equal(maturePaymentView([reach,{...checkout,notes:'Observation cutoff 2026-09-17T12:00:00.000Z.'},ack],'iOS').linked,false);
});
