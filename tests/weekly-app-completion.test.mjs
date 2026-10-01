import test from 'node:test';
import assert from 'node:assert/strict';
import {rawOzardMetrics} from '../scripts/growth-scorecard/mixpanel-raw.mjs';
import {windowFromStart,metric} from '../scripts/growth-scorecard/core.mjs';
import {playConsoleDaily,appleConsoleDaily} from '../scripts/growth-scorecard/stores.mjs';
import {derivedRows} from '../scripts/weekly-app-growth.mjs';
import {appKpi} from '../scripts/growth-scorecard/meeting.mjs';
const week=windowFromStart('2026-09-07'), app={key:'ozard',name:'Ozard',androidPackage:'app.oz',iosAppleId:'123',mixpanel:{versions:['3.1.10'],minBuild:{ios:24,android:70},cleanSince:'2026-09-06T00:00:00Z'}};
const at=Date.parse('2026-09-07T00:00:00Z');
const e=(event,h,user='a',props={})=>({event,properties:{time:at+h*3600000,distinct_id:user,platform:'ios',app_version:'3.1.10',build_number:24,session_id:'s'+h,...props}});
test('raw journeys reject wrong user, wrong view and wrong event order; deduped users stay bounded',()=>{
 const events=[e('session_started',0),e('session_started',0,'b'),e('paywall_viewed',1,'a',{paywall_view_id:'p'}),e('paywall_viewed',1,'b',{paywall_view_id:'q'}),e('purchase_started',0,'a',{paywall_view_id:'p'}),e('purchase_started',2,'b',{paywall_view_id:'p'}),e('purchase_started',2,'a',{paywall_view_id:'p',purchase_attempt_id:'x'}),e('purchase_completed',3,'a',{paywall_view_id:'p',purchase_attempt_id:'wrong'})];
 const pick=ev=>rawOzardMetrics(ev,app,week,new Date('2026-09-16T00:00Z')).filter(r=>r.platform==='iOS');let rows=pick(events);
 assert.equal(rows.find(r=>r.metric==='Paywall → Checkout Conversion').value,.5);assert.equal(rows.find(r=>r.metric==='Paywall → Client Ack Conversion').value,0);
 events.push(e('purchase_completed',4,'a',{paywall_view_id:'p',purchase_attempt_id:'x'}),events[0]);rows=pick(events);assert.equal(rows.find(r=>r.metric==='Paywall → Client Ack Conversion').value,.5);assert.equal(rows.find(r=>r.metric==='Weekly Active Users').value,2);
 assert.equal(rows.find(r=>r.metric==='Feature Value Reach'&&r.segment==='Library').value,0);
});
test('D7 only includes exact fully observed intervals; immature users never inflate denominator',()=>{
 const events=[e('app_first_opened',0),e('session_started',168),e('app_first_opened',24,'b'),e('session_started',192,'b')];
 const rows=rawOzardMetrics(events,app,week,new Date(at+193*3600000));const d=rows.find(r=>r.platform==='iOS'&&r.metric==='D7');assert.equal(d.value,1);assert.equal(d.denominator,1);assert.equal(d.numerator,1);
});
test('official Console fallback preserves observed days and refuses stale identity/week',()=>{
 const data={app:'ozard',package:'app.oz',week:week.start,observedAt:'2026-09-15',rows:[' 12 Eyl 2026 Toplamdaki yüzdesi 548 %100',' 7 Eyl 2026 Toplamdaki yüzdesi 289 %100']};assert.equal(playConsoleDaily(data,app,week).total,837);assert.equal(playConsoleDaily(data,app,week).days.length,2);assert.equal(playConsoleDaily({...data,package:'old'},app,week),null);assert.equal(playConsoleDaily({...data,week:'2026-08-31'},app,week),null);
 assert.equal(appleConsoleDaily({app:'ozard',appleId:'123',week:week.start,metric:'Product Page Views',sourceTimezone:'UTC',rows:['Sep 7, 2026254','Sep 8, 20261,000']},app,week).total,1254);
});
test('mapped UGC estimate cannot feed business CPI even with complete media and downloads',()=>{
 const r=(name,platform,value,extra={})=>metric(week,app,name,platform,{value,status:'EARLY',complete:true,currency:'TRY',...extra});
 const inputs=[r('Media Ad Spend','All',80),r('UGC Production Cost','All',20,{status:'ESTIMATE',complete:false}),r('Store Downloads','iOS',25),r('Store Downloads','Android',25)];let result=derivedRows({apps:[app]},week,inputs);assert.equal(result.find(r=>r.metric==='CPI').value,null);assert.equal(result.find(r=>r.metric==='CPI').status,'WAITING');assert.equal(result.find(r=>r.metric==='CPI — Final').value,null);
 inputs[0].complete=false;assert.equal(derivedRows({apps:[app]},week,inputs).find(r=>r.metric==='CPI').value,null);inputs[0].complete=true;inputs[3].complete=false;assert.equal(derivedRows({apps:[app]},week,inputs).find(r=>r.metric==='CPI').value,null);
});
test('meeting surfaces mature renewal and labelled estimate, not immature blank',()=>{
 const rows=[{appName:'Ozard',metric:'Subscription W1',platform:'iOS',segment:'all',status:'EARLY',value:null},{appName:'Ozard',metric:'Subscription W1',platform:'iOS',segment:'mature-cohort:2026-08-31;plan:P1W',status:'EARLY',value:8/14,unit:'ratio'}];assert.match(appKpi(rows,'Ozard','Subscription W1').text,/57.1%/);
 assert.equal(appKpi([{appName:'Ozard',metric:'UGC Production Cost',platform:'All',segment:'all',status:'ESTIMATE',value:25.02,currency:'TRY'}],'Ozard','UGC Production Cost').text,'—');
});

test('UGC base uses dated terms; later contract edits and unfinalized bonuses cannot become final cost',async()=>{
 const {creatorRows}=await import('../scripts/growth-scorecard/creator.mjs');const config={apps:[app],creator:{verifiedCategories:{cat:{app:'ozard',appleId:'123',androidPackage:'app.oz',sourceUrls:['https://example.test/oz']}}}};
 const input={briefs:[{id:'brief',metadata:{categoryId:'cat'}}],categories:[{id:'cat',data:{exampleContents:['https://example.test/oz']}}],submissions:[{submission:{id:'s',brief_id:'brief',creator_id:'creator',status:'approved',metadata:{postedAt:'2026-09-08T12:00Z'}}}],creators:[{account:{id:'creator'},payout_settings:{currency:'TRY',payout_amount:100,monthly_content_limit:12,created_at:'2026-07-01',updated_at:'2026-08-01',view_bonus_per_1000:.8}}],earnings:[]};
 let rows=creatorRows(config,week,input);assert.equal(rows.find(r=>r.metric==='UGC Estimated Accrued Cost').value,100/12);assert.equal(rows.find(r=>r.metric==='UGC Production Cost').status,'WAITING');assert.equal(rows.find(r=>r.metric==='UGC Finalized Cost').value,null);
 input.creators[0].payout_settings.updated_at='2026-09-09';rows=creatorRows(config,week,input);assert.equal(rows.find(r=>r.metric==='UGC Production Cost').value,null);
});

test('reviewed legacy brief attribution fails closed after content or canonical identity changes',async()=>{
 const {attributeBrief,briefIdentityFingerprint}=await import('../scripts/growth-scorecard/creator.mjs');
 const brief={id:'b',priority:'Ozard AI',description:'Explicit approved product brief',metadata:{}};
 const config={canonicalApps:[app],verifiedBriefs:{b:{app:app.key,appleId:app.iosAppleId,androidPackage:app.androidPackage,fingerprint:briefIdentityFingerprint(brief),sourceUrls:['https://apps.apple.com/app/id123'],evidence:['Reviewed brief and approved uploaded video']}}};
 assert.equal(attributeBrief(brief,[],config),'ozard');assert.equal(attributeBrief({...brief,description:'changed'},[],config),null);assert.equal(attributeBrief(brief,[],{...config,canonicalApps:[{...app,androidPackage:'different'}]}),null);assert.equal(attributeBrief({id:'unknown',priority:'Ozard AI'},[],config),null);
});
test('renewal labels use actual mature start cohort, never reporting week',async()=>{
 const {renewalLabel}=await import('../scripts/growth-scorecard/meeting.mjs');
 for(const [period,date,label]of [['W1','2026-08-31','Aug 31'],['W2','2026-08-24','Aug 24'],['M1','2026-08-03','Aug 3'],['M2','2026-06-29','Jun 29']]){
 const r=metric(week,app,'Subscription '+period,'iOS',{value:.5,status:'EARLY',unit:'ratio',segment:'mature-cohort:'+date+';plan:P1W'});
 assert.equal(renewalLabel([r],r.metric),period+' Renewal — '+label+' cohort');
 }
});
test('ad evidence rejects stale weeks, wrong app identities and changed Google spend inventory',async()=>{
 const {applyAdsReadback}=await import('../scripts/growth-scorecard/ads.mjs');const {fingerprint}=await import('../scripts/growth-scorecard/core.mjs');
 const row=metric(week,app,'Media Ad Spend Component','iOS',{segment:'Google Ads',sourceAccount:'account'}),data=[{cost:1}];
 const e={week:week.start,end:week.end,observedAt:'2026-09-15',components:[{app:app.key,appleId:app.iosAppleId,package:app.androidPackage,network:'Google Ads',platform:'iOS',sourceAccount:'account',value:0,complete:true,evidence:['full campaign audit'],inventoryFingerprint:fingerprint(data)}]};
 const read=(ev=e,d=data)=>applyAdsReadback([row],{apps:[app]},week,ev,d)[0];assert.equal(read().value,0);assert.equal(read({...e,week:'2026-08-31'}).value,null);assert.equal(read(e,[{cost:2}]).value,null);assert.equal(read({...e,components:[{...e.components[0],package:'legacy'}]}).value,null);
});
