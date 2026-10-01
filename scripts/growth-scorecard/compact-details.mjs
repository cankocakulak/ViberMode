// Compact views of existing canonical models; no collection or metric writes.
import {block,caption,bar} from './dashboard-visuals.mjs';
import {one,number,percent} from './funnel-presentation.mjs';
import {operatingView,aggregateMonetization,measured,periodRatio} from './app-report-model.mjs';
import {platformSum,usageTotal,operatingTotal,totalLabel,totalNote} from './platform-totals.mjs';
import {usageScopeNote,completedCohortPopulationNote} from './presentation-quality.mjs';
const title=s=>block('paragraph',s,{bold:true});
const point=(v,id)=>v?.points.find(p=>p.id===id);
const countRate=p=>number(p?.count)+(Number.isFinite(p?.rate)?' · '+percent(p.rate):'');
const dates=r=>{if(!measured(r))return 'Observed dates unavailable';const c=r?.semantics?.coverage;return c?.dates?.length?c.dates.map(d=>d.slice(5)).join(', '):r?.week?r.week+' — '+new Date(Date.parse(r.week)+6*86400000).toISOString().slice(0,10):'—';};
export function usageDetails(app,model,ui){
 const {rows,usages,features,easyUsage,aggregate}=model,{table,toggle,coverageText,formatValue}=ui;
 const own=rows.filter(r=>r.appName===app&&r.country==='GLOBAL');
 const coverage=table([['Store metric','iOS · value / dates','Android · value / dates'],...['Store Downloads','Product Page Views','Store CVR'].map(m=>[m==='Product Page Views'?'Store Page / Listing Visitors':m==='Store CVR'?'Store Conversion':m,...['iOS','Android'].map(p=>{const r=one(rows,app,p,m);return r?(m==='Product Page Views'?(p==='iOS'?'Product Page Views: ':'Listing Visitors: '):m==='Store CVR'?(p==='iOS'?'Apple Native CVR: ':'Play Listing CVR: '):'')+formatValue(r)+coverageText(r)+'\n'+dates(r):'—';})])]);
 const blocks=[toggle('Store date coverage',[coverage,caption('Play CVR uses the same numerator/denominator dates. Device downloads are separate. Apple native CVR = total downloads / unique impressions; page views are not its denominator.')])];
 const views=app==='Ozard'?usages:[easyUsage];
 const combined=usageTotal(rows,app);
 blocks.push(table([['Usage','WAU','Core users · %WAU','Repeat · %Core','No Core · %WAU'],...views.map(v=>[v.platform,number(point(v,'wau')?.count),countRate(point(v,'core')),countRate(point(v,'repeat')),countRate(point(v,'no-core'))]),combined?[totalLabel,number(combined.wau),number(combined.core)+' · '+percent(combined.reach),number(combined.repeat)+' · '+percent(combined.repeatRate),number(combined.noCore)+' · '+percent(combined.noCoreRate)]:[totalLabel,'—','—','—','—']]),caption(combined?totalNote:usageScopeNote(rows,app)));
 if(app==='Ozard'){
  const names=[...new Set(features.flatMap(f=>f.items.map(i=>i.feature)))];
  blocks.push(title('Feature reach · users / %WAU'),table([['Feature','iOS','Android',totalLabel],...names.map(name=>{const total=platformSum(rows,app,'Feature Value Reach',name);return [name,...['iOS','Android'].map(p=>{const f=features.find(f=>f.platform===p)?.items.find(i=>i.feature===name);return f?number(f.users)+' · '+percent(f.ofWau)+'\n'+bar(f.ofWau,8)+(f.ofCore!==null?' · '+percent(f.ofCore)+' of Core':''):'—';}),total?number(total.numerator)+' · '+percent(total.value)+'\n'+bar(total.value,8):'—'];})]),caption('Features overlap; percentages do not sum to 100%.'));
 }else{
  blocks.push(title('iOS aggregate usage · event counts'),table([
   ['App Opens','Session Starts','Learning Starts','Completions','Activity Completions'],
   [3,4,0,1,2].map(i=>number(aggregate.points[i]?.count))
  ]),caption('Learning completion / start '+percent(aggregate.completionEventRatio)+' · period event ratio, not matched sessions. Feature ranking — insufficient sample.'));
  const observed=own.filter(r=>r.platform==='Android'&&r.metric==='Observed Activity Completions'&&measured(r));
  const fallback=own.filter(r=>r.platform==='Android'&&r.metric==='Feature Value Reach'&&measured(r));
  if(observed.length||fallback.length)blocks.push(toggle('Android · Observed activity types',[table([['Activity',observed.length?'Event occurrences':'Observed users'],...(observed.length?observed:fallback).map(r=>[r.segment,number(observed.length?r.value:r.semantics?.numerator)])])]));
 }
 const labels=[...new Set(views.flatMap(v=>v.diagnostics.map(d=>d.label)))];
 if(labels.length)blocks.push(toggle('No Core Value · breakdown',[table([['Group',...views.map(v=>v.platform),totalLabel],...labels.map(label=>{const parts=views.map(v=>v.diagnostics.find(d=>d.label===label)),total=combined&&parts.every(Boolean)?parts.reduce((s,d)=>s+d.count,0):null;return [label,...parts.map(d=>d?number(d.count)+' · '+percent(d.rate):'—'),total!==null?number(total)+' · '+percent(total/combined.noCore):'—'];})]),caption('Mutually exclusive groups · percentage of No-Core users.') ]));
 return blocks;
}
export function paymentDetails(app,model,ui){
 const {rows,maturePayments,week}=model,{table,toggle}=ui;
 if(app!=='Ozard'){
  const a=aggregateMonetization(rows);
  const purchases=one(rows,app,'iOS','RevenueCat Verified Initial Purchases'),downloads=one(rows,app,'iOS','Store Downloads'),proxy=periodRatio(purchases,downloads);
  return [table([
   ['Measurement','iOS','Android'],
   ['Ordered First Open user funnel','Unavailable · no linked user/event history','Unavailable · no canonical ordered stage populations'],
   ['7-day acquisition cohort','Unavailable','Unavailable'],
   ['Product events vs purchases','Partial aggregate events; not the RevenueCat population','Usage sample does not establish purchase transitions']
  ]),toggle('Available event ratios · not user conversion',[table([
   ['Period ratio','Numerator / denominator','Result'],
   ['Purchase Start / Paywall',a.valid?number(a.stages[2].value)+' / '+number(a.stages[1].value):'—',percent(a.checkout)],
   ['Client Ack / Purchase Start',a.valid?number(a.stages[3].value)+' / '+number(a.stages[2].value):'—',percent(a.ack)],
   ...(proxy!==null?[['iOS verified purchases / first downloads · separate period proxy',number(purchases.value)+' / '+number(downloads.value),percent(proxy)]]:[])
  ])]),caption('Daily identity-free counters cannot establish first-time users, event order or cumulative conversion. No new tracking is enabled.')];
 }
 const stageIds=['first-open','paywall','checkout','ack'];
 const reach=platformSum(rows,app,'Paywall Reach'),checkout=platformSum(rows,app,'Mature Cohort Paywall → Checkout'),ack=platformSum(rows,app,'Mature Cohort Checkout → Client Ack');
 const combined=reach&&checkout&&ack&&reach.numerator===checkout.denominator&&checkout.numerator===ack.denominator;
 const pending=maturePayments.map(v=>Number(one(rows,app,v.platform,'Paywall Reach')?.notes?.match(/immature (\d+)/)?.[1]));
 const blocks=[title('7-Day Acquisition Cohort · mature subset'),table([
  ['Platform','First Open','Paywall','Checkout','Client Ack','First Open → Ack'],
  ...maturePayments.map(v=>[v.platform,...stageIds.map((id,i)=>{const p=point(v,id);return number(p?.count)+(i?'\n'+percent(p?.rate)+' step':'');}),percent(point(v,'ack')?.overall,2)]),
  ...(combined?[[totalLabel,number(reach.denominator),number(reach.numerator)+'\n'+percent(reach.value)+' step',number(checkout.numerator)+'\n'+percent(checkout.value)+' step',number(ack.numerator)+'\n'+percent(ack.value)+' step',percent(ack.numerator/reach.denominator,2)]]:[])
 ])];
 blocks.push(table([
  ['Maturity · acquisition '+week.start+' — '+week.end,'Total clean First Opens','Mature','Pending','Observation cutoff'],
  ...maturePayments.map(v=>{const r=one(rows,app,v.platform,'Paywall Reach'),m=r?.semantics?.denominator??point(v,'first-open')?.count,n=Number(r?.notes?.match(/immature (\d+)/)?.[1]),cutoff=r?.notes?.match(/Observation cutoff ([^ ]+)\./)?.[1];return [v.platform,number(Number.isFinite(m)&&Number.isFinite(n)?m+n:null),number(m),number(n),cutoff||'—'];}),
  ...(combined&&pending.length===2&&pending.every(Number.isFinite)?[[totalLabel,number(reach.denominator+pending.reduce((a,b)=>a+b,0)),number(reach.denominator),number(pending.reduce((a,b)=>a+b,0)),reach.parts[0].notes.match(/Observation cutoff ([^ ]+)\./)?.[1]||'—']]:[])
 ]),caption('Same mature first-open cohort; each user observed for seven days. Client Ack is not a verified store purchase. '+totalNote));
 if(week.start==='2026-09-07')blocks.push(caption('Frozen W37 reference: Sep 15 12:53 UTC cutoff; 1,508 iOS / 4,720 Android total clean First Opens, including immature users excluded from the mature subset above. These are different populations from independent weekly First Open counts. The historical snapshot remains unchanged.'));
 const completed=rows.filter(r=>r.appName===app&&r.country==='GLOBAL'&&r.metric==='7-Day Acquisition Cohort First Opens'&&measured(r)&&r.semantics?.cohort?.pending===0);
 if(completed.length)blocks.push(table([['Completed acquisition cohort','Platform','First Open → Paywall → Checkout → Ack','First Open → Ack'],...completed.map(r=>{const c=r.semantics.cohort;return [c.start+' — '+c.end,r.platform,[c.counts.firstOpen,c.counts.paywallViewed,c.counts.checkoutStarted,c.counts.clientAck].map(number).join(' → '),percent(c.total?c.counts.clientAck/c.total:null,2)];})]));
 for(const r of completed){const note=completedCohortPopulationNote(r,model.allRows);if(note)blocks.push(caption(r.platform+' · '+note));}
 const views=['iOS','Android'].map(p=>operatingView(rows,p)),names=['First Open','Onboarding','Paywall','Checkout','Client Ack'];
 const weeklyCombined=operatingTotal(rows);
 blocks.push(toggle('Weekly Activity / Pairwise Diagnostics',[
  table([['Independent weekly unique users',...names],...views.map(v=>[v.platform,...v.stages.map(s=>number(s.count))]),...(weeklyCombined?[[totalLabel,...names.map((_,i)=>number(views.reduce((s,v)=>s+v.stages[i].count,0)))]]:[])]),
  table([['Pairwise transition','iOS · matched / prior stage','Android · matched / prior stage',totalLabel],...names.slice(1).map((name,j)=>{const parts=views.map(v=>v.stages[j+1]),n=parts.reduce((s,p)=>s+p.stepNumerator,0),d=parts.reduce((s,p)=>s+p.stepDenominator,0);return [names[j]+' → '+name,...parts.map(s=>s.step===null?'—':number(s.stepNumerator)+' / '+number(s.stepDenominator)+' · '+percent(s.step)),weeklyCombined&&parts.every(p=>p.step!==null)&&d>0?number(n)+' / '+number(d)+' · '+percent(n/d):'—'];})]),
  toggle('Event occurrences',[table([['Platform',...names],...views.map(v=>[v.platform,...v.stages.map(s=>number(s.events))]),...(weeklyCombined?[[totalLabel,...names.map((_,i)=>number(views.reduce((s,v)=>s+v.stages[i].events,0)))]]:[])])]),
  caption('Independent counts include returning users and may increase. Pairwise transitions use different populations; rates are not multiplied.')
 ]));
 return blocks;
}
