// Pure presentation projections. Counts come from canonical values or explicit
// canonical numerator/denominator metadata; nothing is written to the warehouse.
import {compatibleTrend,coverageSignature} from './reporting-semantics.mjs';
const measured=r=>!!r&&['READY','EARLY'].includes(r.status)&&Number.isFinite(r.value);
const count=n=>Number.isInteger(n)&&n>=0;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-9;
export function one(rows,app,platform,metric,segment='all'){
 const found=rows.filter(r=>(r.country||'GLOBAL')==='GLOBAL'&&r.appName===app&&r.platform===platform&&r.metric===metric&&r.segment===segment);return found.length===1?found[0]:null;
}
function pair(r){const s=r?.semantics;return measured(r)&&count(s?.numerator)&&count(s?.denominator)&&s.denominator>0&&s.numerator<=s.denominator&&close(r.value,s.numerator/s.denominator);}
function scope(a,b){return a&&b&&a.week===b.week&&a.appName===b.appName&&a.platform===b.platform&&(a.country||'GLOBAL')===(b.country||'GLOBAL')&&a.calendar&&a.calendar===b.calendar&&a.sourceAccount===b.sourceAccount&&a.semantics?.population&&a.semantics.population===b.semantics?.population&&same(coverageSignature(a),coverageSignature(b));}
const cutoff=r=>r?.notes?.match(/[Oo]bservation cutoff (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/)?.[1];
const point=(id,label,n,rate,deps,extra={})=>({id,label,count:count(n)?n:null,rate:Number.isFinite(rate)?rate:null,deps:deps.filter(Boolean),...extra});
export function storeView(rows,app,platform){
 const get=m=>one(rows,app,platform,m),cvr=get('Store CVR'),views=get('Product Page Views'),downloads=get('Store Downloads');
 const out={app,platform,points:[]};
 if(platform==='iOS'){
  // Apple's rounded native CVR cannot reconstruct impressions or total downloads.
  const native=measured(cvr)&&cvr.semantics?.definition==='apple_native_weekly_conversion_rate_v1';
  out.points=[point('impressions','Native eligible impressions',native?cvr.semantics.denominator:null,null,[cvr]),point('views','Product Page Views',measured(views)?views.value:null,null,[views]),point('downloads','First-Time Downloads',measured(downloads)?downloads.value:null,null,[downloads]),point('native','Impression → Download conversion',null,native?cvr.value:null,[cvr])];out.linked=false;
 }else{
  const coverage=cvr?.semantics?.coverage;
  const aligned=!coverage||Array.isArray(coverage.numeratorDates)&&coverage.numeratorDates.length>0&&same(coverage.numeratorDates,coverage.denominatorDates)&&same(coverage.dates,coverage.numeratorDates);
  const valid=pair(cvr)&&cvr.semantics.definition==='play_listing_acquisition_conversion_v1'&&aligned;
  out.points=[point('listing-base','Matched listing visitors',valid?cvr.semantics.denominator:null,null,[cvr]),point('listing-acquisitions','Listing acquisitions',valid?cvr.semantics.numerator:null,valid?cvr.value:null,[cvr],{denominator:valid?cvr.semantics.denominator:null}),point('views','All observed listing visitors',measured(views)?views.value:null,null,[views]),point('downloads','Device downloads',measured(downloads)?downloads.value:null,null,[downloads])];out.linked=valid;
 }return out;
}
export function paymentView(rows,platform){
 const get=m=>one(rows,'Ozard',platform,m),reach=get('Paywall Reach'),viewers=get('Unique Paywall Viewers'),checkout=get('Paywall → Checkout Conversion'),ack=get('Paywall → Client Ack Conversion'),hop=get('Checkout → Client Ack Conversion');
 const mature=pair(reach)&&reach.semantics.definition==='clean_product_v1'&&/first-open cohort/.test(reach.notes||'');
 const weekly=pair(checkout)&&pair(ack)&&pair(hop)&&measured(viewers)&&scope(checkout,ack)&&scope(checkout,viewers)&&checkout.semantics.definition==='clean_product_v1'&&ack.semantics.definition==='clean_product_v1'&&hop.semantics.definition==='ordered_checkout_ack_v1'&&hop.semantics.population===checkout.semantics.population&&hop.week===checkout.week&&hop.platform===platform&&hop.calendar===checkout.calendar&&cutoff(checkout)&&cutoff(checkout)===cutoff(ack)&&cutoff(checkout)===cutoff(viewers)&&cutoff(checkout)===cutoff(hop)&&viewers.value===checkout.semantics.denominator&&viewers.value===ack.semantics.denominator&&hop.semantics.denominator===checkout.semantics.numerator&&hop.semantics.numerator===ack.semantics.numerator;
 const deps=[viewers,checkout,ack,hop];
 return {app:'Ozard',platform,cohortLinked:mature,weeklyLinked:weekly,points:[
  point('eligible','Eligible new cohort',mature?reach.semantics.denominator:null,null,[reach]),
  point('cohort-paywall','Paywall reached',mature?reach.semantics.numerator:null,mature?reach.value:null,[reach],{denominator:mature?reach.semantics.denominator:null,immature:Number(reach?.notes?.match(/immature (\d+)/)?.[1]||0)}),
  point('viewers','Weekly paywall viewers',measured(viewers)?viewers.value:null,null,[viewers]),
  point('checkout','Checkout started',pair(checkout)?checkout.semantics.numerator:null,weekly?checkout.value:null,deps,{denominator:weekly?viewers.value:null}),
  point('ack','Client purchase ack',pair(ack)?ack.semantics.numerator:null,weekly?hop.value:null,deps,{denominator:weekly?checkout.semantics.numerator:null,overall:weekly?ack.value:null})
 ]};
}
export function usageView(rows,app='Ozard',platform='iOS'){
 const get=m=>one(rows,app,platform,m),wau=get('Weekly Active Users'),core=get('Any Core Value Users'),reach=get('Core Value Reach'),repeat=get('Repeat Core Value Users'),noCore=get('No Core Value Users'),noReach=get('No Core Value Reach');
 const valid=[wau,core,noCore,reach,noReach].every(measured)&&scope(wau,core)&&scope(core,noCore)&&scope(wau,reach)&&scope(core,noReach)&&[wau.value,core.value,noCore.value].every(count)&&wau.value>0&&core.value+noCore.value===wau.value&&pair(reach)&&pair(noReach)&&reach.semantics.numerator===core.value&&reach.semantics.denominator===wau.value&&noReach.semantics.numerator===noCore.value&&noReach.semantics.denominator===wau.value&&core.semantics.denominator===wau.value&&noCore.semantics.denominator===wau.value&&['usage_coverage_active_intersection_v1','easyspell_android_active_intersection_v1'].includes(core.semantics.definition)&&noCore.semantics.definition===core.semantics.definition;
 const repeatValid=valid&&measured(repeat)&&scope(core,repeat)&&repeat.semantics.definition===core.semantics.definition&&repeat.semantics.denominator===wau.value&&count(repeat.value)&&repeat.value<=core.value&&/two distinct session_id/.test(repeat.notes||'');
 const deps=[wau,core,reach,noCore,noReach];
 const diagnostics=rows.filter(r=>(r.country||'GLOBAL')==='GLOBAL'&&r.appName===app&&r.platform===platform&&r.metric==='No Core Value Diagnostic Users');
 const partition=valid&&diagnostics.length>0&&new Set(diagnostics.map(r=>r.segment)).size===diagnostics.length&&diagnostics.every(r=>measured(r)&&scope(core,r)&&count(r.value)&&r.semantics.definition===core.semantics.definition&&r.semantics.denominator===noCore.value)&&diagnostics.reduce((s,r)=>s+r.value,0)===noCore.value;
 return {app,platform,linked:valid,repeatLinked:repeatValid,coverage:valid?[{label:'Any Core Value',count:core.value,rate:core.value/wau.value},{label:'No Core Value',count:noCore.value,rate:noCore.value/wau.value}]:null,diagnostics:partition?diagnostics.map(r=>({label:r.segment,count:r.value,rate:noCore.value?r.value/noCore.value:null})):[],points:[
  point('wau','Weekly Active Users',measured(wau)?wau.value:null,null,[wau]),
  point('core','Any Core Value Users',measured(core)?core.value:null,valid?reach.value:null,deps,{denominator:valid?wau.value:null}),
  point('repeat','Repeat Core Value Users',measured(repeat)?repeat.value:null,repeatValid&&core.value>0?repeat.value/core.value:null,[...deps,repeat],{denominator:repeatValid?core.value:null,overall:repeatValid?repeat.value/wau.value:null}),
  point('no-core','No Core Value Users',measured(noCore)?noCore.value:null,valid?noReach.value:null,deps,{denominator:valid?wau.value:null})
 ]};
}
export function featureView(rows,platform,proof){
 const core=one(rows,'Ozard',platform,'Any Core Value Users'),wau=one(rows,'Ozard',platform,'Weekly Active Users');
 return rows.filter(r=>(r.country||'GLOBAL')==='GLOBAL'&&r.appName==='Ozard'&&r.platform===platform&&r.metric==='Feature Value Reach'&&pair(r)).sort((a,b)=>b.value-a.value||a.segment.localeCompare(b.segment)).map(r=>{
  const compatible=measured(core)&&measured(wau)&&scope(wau,r)&&scope(core,r)&&r.semantics.denominator===wau.value&&core.semantics.denominator===wau.value&&r.semantics.numerator<=core.value&&core.value>0&&((proof?.canonicalCountsMatch===true&&proof.featureSubset?.[r.segment]===true)||(r.semantics.featureMembership?.subsetVerified===true&&r.semantics.featureMembership.featureUsers===r.semantics.numerator&&r.semantics.featureMembership.activeCoreFeatureUsers===r.semantics.numerator&&r.semantics.featureMembership.coreUsers===core.value&&r.semantics.featureMembership.wauUsers===wau.value));
  return {feature:r.segment,users:r.semantics.numerator,ofWau:r.value,ofCore:compatible?r.semantics.numerator/core.value:null,source:r.pageId};
 });
}
export function easyAggregateView(rows){
 return ['learning_session_started','learning_session_completed','activity_completed','app_opened','session_started'].map(event=>{const r=one(rows,'EasySpell','iOS','iOS Aggregate Usage',event);return point(event,event,measured(r)?r.value:null,null,[r],{eventCount:true});});
}
export function withFunnelComparison(view,previous){
 return {...view,points:view.points.map(p=>{const old=previous?.points.find(o=>o.id===p.id);const compatible=old&&p.deps.length>0&&p.deps.length===old.deps.length&&p.deps.every((r,i)=>compatibleTrend(r,old.deps[i]));return {...p,previous:compatible?{count:old.count,rate:old.rate}:null};})};
}
export const number=n=>Number.isFinite(n)?new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n):'—';
export const percent=(n,digits=1)=>Number.isFinite(n)?(n*100).toFixed(digits)+'%':'—';
export function partialLabel(point){const days=point.deps.map(r=>r.semantics?.coverage?.observedDays).filter(Number.isFinite);if(days.some(n=>n<7))return ' · PARTIAL '+Math.min(...days)+'/7 days';if(point.deps.some(r=>r.semantics?.complete===false||/PARTIAL/i.test(r.notes||'')))return ' · PARTIAL';return '';}
export function stageText(p,{rateOnly=false,includeFraction=true}={}){
 let value=rateOnly?percent(p.rate,2):number(p.count);
 if(!rateOnly&&p.rate!==null)value=(includeFraction&&count(p.denominator)?number(p.count)+' / '+number(p.denominator):value)+' · '+percent(p.rate);
 value+=partialLabel(p);
 if(p.immature>0)value+=' · mature subset';
 if(p.previous){const prev=p.previous,lines=[];if(!rateOnly&&Number.isFinite(prev.count)&&Number.isFinite(p.count)){let delta='';if(prev.count!==0){const pct=(p.count-prev.count)/Math.abs(prev.count)*100;delta=' · '+(pct>=0?'+':'−')+Math.abs(pct).toFixed(1)+'% WoW';}lines.push('Prev '+number(prev.count)+delta);}if(Number.isFinite(prev.rate)&&Number.isFinite(p.rate)){const pp=(p.rate-prev.rate)*100;lines.push('Prev '+percent(prev.rate)+' · '+(pp>=0?'+':'−')+Math.abs(pp).toFixed(1)+'pp');}if(lines.length)value+='\n'+lines.join(' · ');}
 return value;
}

export function diagnosticEconomics(rows){
 const full=r=>r?.semantics?.complete===true&&(!r.semantics.coverage||r.semantics.coverage.expectedDays===7&&r.semantics.coverage.observedDays===7&&(!r.semantics.coverage.dates||same([...new Set(r.semantics.coverage.dates.map(d=>(Date.parse(d)-Date.parse(r.week))/86400000))].sort((a,b)=>a-b),[0,1,2,3,4,5,6])));
 const networkSources={'Google Ads':'googleadwords_int','Meta':'Facebook Ads','Apple Ads':'Apple Search Ads'};
 const components=rows.filter(r=>(r.country||'GLOBAL')==='GLOBAL'&&['Ozard','EasySpell'].includes(r.appName)&&r.metric==='Media Ad Spend Component'&&measured(r));
 return components.map(spend=>{const download=one(rows,spend.appName,spend.platform,'Store Downloads'),installs=one(rows,spend.appName,spend.platform,'AppsFlyer Paid Installs Component',networkSources[spend.segment]),published=one(rows,spend.appName,spend.platform,'Paid Media CPI Component',spend.segment);
  const compatible=r=>measured(r)&&r.value>0&&spend.currency&&spend.value>=0&&spend.platform!=='All'&&r.week===spend.week&&r.calendar===spend.calendar&&r.calendar&&!/unverified/i.test(r.calendar)&&full(r)&&full(spend);
  // A verified component is a lower-bound numerator even when other accounts /
  // networks are unknown. Its dates must still lie inside the same source week;
  // the denominator must be complete. Never add unlike cross-store count units.
  const spendDates=spend.semantics?.coverage?.dates;
  const spendWindow=!spendDates||spendDates.length>0&&spendDates.every(d=>Date.parse(d)>=Date.parse(spend.week)&&Date.parse(d)<Date.parse(spend.week)+7*86400000);
  const floorCompatible=measured(download)&&download.value>0&&spend.value>=0&&spend.currency&&spend.platform!=='All'&&download.week===spend.week&&download.calendar===spend.calendar&&download.calendar&&!/unverified/i.test(download.calendar)&&full(download)&&spendWindow;
  const knownDownload=floorCompatible?spend.value/download.value:null,paid=compatible(installs)?spend.value/installs.value:null;
  const proxy=paid===null&&measured(published)&&measured(installs)&&installs.value>0&&published.currency===spend.currency&&published.semantics?.numerator===spend.value&&published.semantics?.denominator===installs.value&&close(published.value,spend.value/installs.value)?published.value:null;
  return {app:spend.appName,platform:spend.platform,network:spend.segment,spend:spend.value,currency:spend.currency,knownSpendPerDownload:knownDownload,costFloorFormula:knownDownload!==null?`${spend.value} ${spend.currency} / ${download.value} ${download.unit}`:null,costFloorCaveat:'Lower bound / diagnostic; unknown networks and UGC excluded; not Business CPI',networkPaidCpi:paid,networkPaidDateProxy:proxy,paidInstalls:measured(installs)?installs.value:null,week:spend.week,spendCalendar:spend.calendar,downloadCalendar:download?.calendar||null,installCalendar:installs?.calendar||null,source:spend.source,scope:spend.platform==='All'?'App total component; no OS allocation':spend.semantics?.complete===true?'Verified component; other spend excluded':'Measured partial component',blocker:knownDownload===null?(spend.platform==='All'?'No compatible combined store denominator: cross-store counting units/calendars differ or are unverified; web spend has no mobile OS allocation':download?.semantics?.complete!==true?'Complete store-download window missing':download?.calendar!==spend.calendar?'Spend/download calendars differ':'Coverage or currency not compatible'):null,sources:[spend,download,installs,published].filter(Boolean).map(r=>r.pageId)};
 });
}
export function maturePaymentView(rows,platform){
 const reach=one(rows,'Ozard',platform,'Paywall Reach'),checkout=one(rows,'Ozard',platform,'Mature Cohort Paywall → Checkout'),ack=one(rows,'Ozard',platform,'Mature Cohort Checkout → Client Ack');
 const valid=pair(reach)&&pair(checkout)&&pair(ack)&&scope(reach,checkout)&&scope(checkout,ack)&&checkout.semantics.definition==='mature_first_open_7d_journey_v1'&&ack.semantics.definition===checkout.semantics.definition&&cutoff(reach)&&cutoff(reach)===cutoff(checkout)&&cutoff(checkout)===cutoff(ack)&&reach.semantics.numerator===checkout.semantics.denominator&&checkout.semantics.numerator===ack.semantics.denominator;
 const deps=[reach,checkout,ack];return {app:'Ozard',platform,linked:valid,points:[point('first-open','Mature first-open cohort',valid?reach.semantics.denominator:null,null,deps),point('paywall','Paywall viewed',valid?reach.semantics.numerator:null,valid?reach.value:null,deps,{denominator:valid?reach.semantics.denominator:null}),point('checkout','Purchase started',valid?checkout.semantics.numerator:null,valid?checkout.value:null,deps,{denominator:valid?checkout.semantics.denominator:null}),point('ack','Client ack',valid?ack.semantics.numerator:null,valid?ack.value:null,deps,{denominator:valid?ack.semantics.denominator:null,overall:valid?ack.semantics.numerator/reach.semantics.denominator:null})]};
}
export function alignedAggregate(rows,proof){
 const points=easyAggregateView(rows),canonicalQuery=points.every(p=>{const r=p.deps[0],c=r?.semantics?.coverage;return c?.queriedDays===7&&c.queryStart===r.week&&Date.parse(c.queryEnd)-Date.parse(c.queryStart)===6*86400000;});
 const valid=(canonicalQuery||proof?.canonicalValuesMatch===true&&proof.queriedDays===7)&&points.every(p=>p.count!==null&&p.deps.length===1&&p.deps[0].calendar==='UTC ingestion day'&&p.deps[0].semantics?.definition==='identity_free_app_store_event_occurrences_v1')&&new Set(points.map(p=>p.deps[0].week)).size===1&&new Set(points.map(p=>p.deps[0].sourceAccount)).size===1;
 const started=points[0],completed=points[1],population=started.deps[0]?.semantics?.population;
 const samePopulation=canonicalQuery&&population&&population===completed.deps[0]?.semantics?.population;
 const compatible=valid&&(samePopulation||proof?.sameLearningAggregateScope===true)&&started.count>0&&completed.count<=started.count;
 return {points,aligned:valid,queriedDays:valid?7:null,completionEventRatio:compatible?completed.count/started.count:null,pairedSessions:false,populationIncomplete:true};
}
