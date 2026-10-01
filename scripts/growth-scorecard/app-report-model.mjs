import {one,percent} from './funnel-presentation.mjs';
import {OPERATING_EVENTS} from './operating.mjs';
export const measured=r=>r&&Number.isFinite(r.value)&&['READY','EARLY','ESTIMATE'].includes(r.status);
export function periodRatio(n,d){
 if(!measured(n)||!measured(d)||d.value<=0||n.week!==d.week||n.appName!==d.appName||n.platform!==d.platform||!n.calendar||n.calendar!==d.calendar||/unverified/i.test(n.calendar)||n.semantics?.complete!==true||d.semantics?.complete!==true)return null;
 const full=r=>{const c=r.semantics?.coverage;if(!c)return true;return c.observedDays===7&&c.expectedDays===7&&Array.isArray(c.dates)&&new Set(c.dates).size===7&&c.dates.every(x=>Date.parse(x)>=Date.parse(r.week)&&Date.parse(x)<Date.parse(r.week)+7*86400000);};
 if(!full(n)||!full(d))return null;
 return n.value/d.value;
}
export function appleDiscovery(rows,app){
 const get=m=>one(rows,app,'iOS',m),impressions=get('Unique Store Impressions'),downloads=get('Apple Total Downloads'),native=get('Store CVR');
 const ratio=periodRatio(downloads,impressions);
 const linked=ratio!==null&&native?.semantics?.definition==='apple_native_weekly_conversion_rate_v1'&&native.week===impressions.week&&native.calendar===impressions.calendar&&measured(native)&&Math.abs(ratio-native.value)<=0.000050001;
 return {impressions,downloads,native,linked,ratio,first:get('Store Downloads'),views:get('Product Page Views'),uniqueViews:get('Unique Product Page Views'),pageProxy:periodRatio(get('Store Downloads'),get('Product Page Views'))};
}
export function operatingView(rows,platform){
 const stages=OPERATING_EVENTS.map(e=>one(rows,'Ozard',platform,'Weekly Operating Users',e));
 const valid=stages.every(r=>measured(r)&&r.semantics?.definition==='weekly_operating_activity_v1'&&r.semantics.activity?.users===r.value)&&new Set(stages.map(r=>JSON.stringify([r.week,r.calendar,r.semantics.population,r.sourceAccount]))).size===1;
 return {platform,valid,stages:stages.map((r,i)=>{const a=r?.semantics?.activity;return {row:r,count:measured(r)?r.value:null,events:a?.eventCount??null,matched:valid?a.orderedFromFirstOpen:null,step:valid&&i>0&&a.linksComplete&&a.previousStageUsers>0?a.pairedFromPrevious/a.previousStageUsers:null,stepNumerator:valid?a.pairedFromPrevious:null,stepDenominator:valid?a.previousStageUsers:null,cumulative:valid&&a.fullChainLinksComplete&&a.firstOpenUsers>0?a.orderedFromFirstOpen/a.firstOpenUsers:null};})};
}
// The canonical activity rows already preserve the cumulative ordered subsets.
// Validate their shared population and linkage before projecting a strict funnel.
export function strictOperatingView(rows,platform){
 const activity=operatingView(rows,platform),stages=activity.stages;
 const first=stages[0]?.count;
 const cutoffs=stages.map(s=>s.row?.notes?.match(/Observation cutoff ([^ ]+)\./)?.[1]);
 const valid=activity.valid&&Number.isInteger(first)&&first>=0&&cutoffs.every(Boolean)&&new Set(cutoffs).size===1&&stages.every((s,i)=>{
  const a=s.row.semantics.activity;
  return (s.row.semantics.complete===true||s.row.semantics.releaseValidation&&!s.row.semantics.releaseValidation.materiallyIncomplete)&&a.fullChainLinksComplete===true&&a.firstOpenUsers===first&&Number.isInteger(a.orderedFromFirstOpen)&&a.orderedFromFirstOpen>=0&&a.orderedFromFirstOpen<=s.count&&(i===0?a.orderedFromFirstOpen===first:a.previousChainUsers===stages[i-1].matched&&a.orderedFromFirstOpen<=a.previousChainUsers);
 });
 return {platform,valid,stages:stages.map((s,i)=>({count:valid?s.matched:null,step:valid&&i>0&&stages[i-1].matched>0?s.matched/stages[i-1].matched:null,cumulative:valid&&first>0?s.matched/first:null}))};
}
export function aggregateMonetization(rows){
 const names=['onboarding_completed','paywall_viewed','purchase_started','purchase_completed','subscription_activated'];
 const stages=names.map(n=>one(rows,'EasySpell','iOS','iOS Aggregate Monetization Activity',n));
 const valid=stages.every(r=>measured(r)&&r.calendar==='UTC ingestion day'&&r.semantics?.definition==='identity_free_app_store_event_occurrences_v1'&&r.semantics?.coverage?.queriedDays===7&&r.semantics.coverage.queryStart===r.week&&Date.parse(r.semantics.coverage.queryEnd)-Date.parse(r.week)===6*86400000)&&new Set(stages.map(r=>JSON.stringify([r.week,r.sourceAccount,r.semantics.population,r.semantics.coverage.queryEnd]))).size===1;
 return {stages,valid,checkout:valid&&stages[1].value>0?stages[2].value/stages[1].value:null,ack:valid&&stages[2].value>0?stages[3].value/stages[2].value:null};
}
