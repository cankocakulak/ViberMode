import {productEvents} from './product-export.mjs';
import {eligibleEvent,populationFor} from './release-validation.mjs';
import {completedCohortRows} from './completed-cohort.mjs';
import {operatingRows} from './operating.mjs';
import {matureJourneyCounts} from './mature-journey.mjs';
import {metric,keychain,addDays,dateInZone} from './core.mjs';
const DAY=86400000;
const EVENT_NAMES=['onboarding_completed','app_first_opened','session_started','paywall_viewed','purchase_started','purchase_completed','note_opened','quiz_question_answered','chat_response_received','solver_completed','podcast_started'];
export function rawOzardMetrics(events,app,week,now=new Date()){
 const start=Date.parse(week.startAt),end=Date.parse(week.endAt),asOf=+now-3600000;
 const clean=events.filter(e=>{const p=e.properties;return ['ios','android'].includes(p.platform)&&eligibleEvent(app,p)&&p.time>=Date.parse(app.mixpanel.cleanSince)&&p.time<=asOf&&p.distinct_id;});
 const seen=new Set(),unique=[];for(const e of clean){const p=e.properties,k=JSON.stringify([e.event,p.distinct_id,p.time,p.$insert_id||null]);if(!seen.has(k)){seen.add(k);unique.push(e);}}
 const rows=[];
 for(const platform of ['iOS','Android']){
  const all=unique.filter(e=>e.properties.platform===platform.toLowerCase()).sort((a,b)=>a.properties.time-b.properties.time);
  const weekly=all.filter(e=>e.properties.time>=start&&e.properties.time<end);
  const ids=es=>new Set(es.map(e=>e.properties.distinct_id));const active=ids(weekly.filter(e=>e.event==='session_started'));
  const base={source:'Mixpanel raw export / canonical events; in-memory identity and journey joins',sourceAccount:app.mixpanel.projectId,sourceUrl:'https://mixpanel.com/project/'+app.mixpanel.projectId+'/app/home',sourceTimezone:week.timezone,definition:'clean_product_v1',population:populationFor(app,platform),status:'EARLY',pillar:'Retention & Engagement',unit:'ratio'};
  const caveat='Validated release/build population. Raw-export distinct_id identity clusters; no device guessing or PII persisted. Tester/public rollout coverage not fully verified. Observation cutoff '+new Date(asOf).toISOString()+'.';
  const emit=(name,value,extra={})=>rows.push(metric(week,app,name,platform,{...base,value,notes:caveat,...extra}));
  emit('Weekly Active Users',active.size,{unit:'unique identity clusters',denominator:active.size,notes:caveat+' Distinct session_started identities in reporting week.'});
  const sessions=new Set(weekly.filter(e=>e.event==='session_started'&&e.properties.session_id).map(e=>JSON.stringify([e.properties.distinct_id,e.properties.session_id])));
  const sessionEvents=weekly.filter(e=>e.event==='session_started');
  emit('Sessions per Active User',active.size&&sessionEvents.every(e=>e.properties.session_id)?sessions.size/active.size:null,{unit:'sessions / active identity',numerator:sessions.size,denominator:active.size,notes:caveat+' Distinct (identity,session_id) sessions / weekly active identities; deduplicated session starts.'});
  const isValue=e=>e.event==='note_opened'?(e.properties.note_status==='completed'||e.properties.source==='library'&&e.properties.has_lecture_notes===true):['quiz_question_answered','chat_response_received','solver_completed','podcast_started'].includes(e.event);
  const valueUsers=ids(weekly.filter(isValue));const reached=[...valueUsers].filter(x=>active.has(x)).length;
  const families={Notes:e=>e.event==='note_opened'&&e.properties.note_status==='completed',Library:e=>e.event==='note_opened'&&e.properties.source==='library'&&e.properties.has_lecture_notes===true,Quiz:e=>e.event==='quiz_question_answered',Chat:e=>e.event==='chat_response_received',Solver:e=>e.event==='solver_completed',Podcast:e=>e.event==='podcast_started'};
  for(const [family,accept] of Object.entries(families)){const featureIds=ids(weekly.filter(accept)),n=featureIds.size,intersection=[...featureIds].filter(id=>active.has(id)&&valueUsers.has(id)).length;emit('Feature Value Reach',active.size&&n<=active.size?n/active.size:null,{segment:family,numerator:n,denominator:active.size,featureMembership:{featureUsers:n,activeCoreFeatureUsers:intersection,coreUsers:reached,wauUsers:active.size,subsetVerified:intersection===n},notes:caveat+' Existing canonical '+family+' value-event users / weekly session-active users; '+n+'/'+active.size+'.'});}
  emit('Core Value Reach',active.size?reached/active.size:null,{numerator:reached,denominator:active.size,notes:caveat+' Union of six existing canonical value families intersected with weekly session-active identities; '+reached+'/'+active.size+'.'});
  const births=new Map();for(const e of all.filter(e=>e.event==='app_first_opened'))if(!births.has(e.properties.distinct_id))births.set(e.properties.distinct_id,e.properties.time);
  const cohort=[...births].filter(([,t])=>t>=start&&t<end);
  const byUser=new Map();for(const e of all){const id=e.properties.distinct_id;if(!byUser.has(id))byUser.set(id,[]);byUser.get(id).push(e);}
  for(const day of [1,7]){
   const eligible=cohort.filter(([,t])=>t+(day+1)*DAY<=asOf);
   const retained=eligible.filter(([id,t])=>byUser.get(id).some(e=>e.event==='session_started'&&e.properties.time>=t+day*DAY&&e.properties.time<t+(day+1)*DAY)).length;
   emit('D'+day,eligible.length?retained/eligible.length:null,{segment:'clean-first-open-cohort',numerator:retained,denominator:eligible.length,notes:caveat+` Clean first-open birth cohort ${week.start}..${week.end}; fully mature exact [${day*24},${(day+1)*24}) hour intervals only; returned ${retained}/${eligible.length}; immature ${cohort.length-eligible.length} excluded. No ingestion-day gate discards mature users.`});
  }
  const reachCohort=cohort.filter(([,t])=>t+7*DAY<=asOf);
  const paywallReached=reachCohort.filter(([id,t])=>byUser.get(id).some(e=>e.event==='paywall_viewed'&&e.properties.time>=t&&e.properties.time<t+7*DAY)).length;
  emit('Paywall Reach',reachCohort.length?paywallReached/reachCohort.length:null,{pillar:'Monetization',numerator:paywallReached,denominator:reachCohort.length,notes:caveat+` Ordered app_first_opened → paywall_viewed within 7 days; same raw identity; ${paywallReached}/${reachCohort.length} fully mature first-open cohort members; immature ${cohort.length-reachCohort.length} excluded.`});
  const matureJourney=matureJourneyCounts(reachCohort,byUser);
  for(const [name,numerator,denominator]of [['Mature Cohort Paywall → Checkout',matureJourney.checkoutStarted,matureJourney.paywallViewed],['Mature Cohort Checkout → Client Ack',matureJourney.clientAck,matureJourney.checkoutStarted]])emit(name,matureJourney.completeLinks&&denominator>0?numerator/denominator:null,{pillar:'Monetization',definition:'mature_first_open_7d_journey_v1',numerator,denominator,complete:matureJourney.completeLinks,status:matureJourney.completeLinks&&denominator>0?'EARLY':'WAITING',notes:caveat+` Same mature first-open cohort ${week.start}..${week.end}; firstOpen=${matureJourney.firstOpen}; paywall=${matureJourney.paywallViewed}; checkout=${matureJourney.checkoutStarted}; clientAck=${matureJourney.clientAck}. Each identity is observed only in [first-open, first-open + 7 days), fully elapsed at cutoff. Same raw distinct_id + exact paywall_view_id; client ack requires matching nonempty purchase_attempt_id and chronological order. Missing view IDs=${matureJourney.missingViewIds}; missing attempt IDs=${matureJourney.missingAttemptIds}; unlinked checkout events=${matureJourney.unlinkedCheckoutEvents}; unlinked acknowledgement events=${matureJourney.unlinkedAckEvents}; immature ${cohort.length-reachCohort.length} excluded. Product acknowledgements only; no RevenueCat temporal join.`});
  const views=weekly.filter(e=>e.event==='paywall_viewed');const viewers=ids(views),checkout=new Set(),ack=new Set();let missingViews=0;
  for(const v of views){const p=v.properties;if(!p.paywall_view_id){missingViews++;continue;}
   const journey=byUser.get(p.distinct_id).filter(e=>e.properties.paywall_view_id===p.paywall_view_id&&e.properties.time>=p.time&&e.properties.time<Math.min(end,p.time+7*DAY));
   for(const s of journey.filter(e=>e.event==='purchase_started')){checkout.add(p.distinct_id);if(journey.some(e=>e.event==='purchase_completed'&&e.properties.time>=s.properties.time&&(!s.properties.purchase_attempt_id||!e.properties.purchase_attempt_id||s.properties.purchase_attempt_id===e.properties.purchase_attempt_id)))ack.add(p.distinct_id);}
  }
  for(const[name,set]of [['Paywall → Checkout Conversion',checkout],['Paywall → Client Ack Conversion',ack]])emit(name,viewers.size?set.size/viewers.size:null,{pillar:'Monetization',numerator:set.size,denominator:viewers.size,notes:caveat+` Same identity + exact paywall_view_id, chronologically ordered paywall → checkout${name.includes('Ack')?' → client acknowledgement':''}; attempts agree where available. Weekly-window observed funnel (max 7 days); late conversions outside week excluded, not a fully matured paywall cohort. ${set.size}/${viewers.size} unique viewers; ${missingViews} view events lack journey ID. Client ack is not a verified store purchase.`});
  emit('Unique Paywall Viewers',viewers.size,{pillar:'Monetization',unit:'unique identity clusters',notes:caveat+' Weekly raw distinct identities with paywall_viewed; cross-check against Query API.'});
 }
 rows.push(...operatingRows(unique,app,week,new Date(asOf)),...completedCohortRows(unique,app,week,new Date(asOf)));
 return rows;
}
export async function collectOzardRaw(app,week,now=new Date()){
 if(app.mixpanel.releaseValidation)return rawOzardMetrics(await productEvents(app,week,now),app,week,now);
 const secret=keychain('viberboyz-mixpanel-ozard-api-secret');if(!secret)throw new Error('Raw export credential unavailable');
 const q=new URLSearchParams({from_date:addDays(week.start,-8),to_date:dateInZone(now,'UTC'),event:JSON.stringify(EVENT_NAMES),time_in_ms:'true'});
 const r=await fetch('https://data.mixpanel.com/api/2.0/export?'+q,{headers:{Authorization:'Basic '+Buffer.from(secret+':').toString('base64')},signal:AbortSignal.timeout(180000)});
 if(!r.ok){const e=new Error('Raw export failed');e.status=r.status;throw e;}
 // Only transient raw event memory. Persist/publish aggregate metric rows only.
 const events=(await r.text()).split('\n').filter(s=>s.trim()).map(s=>JSON.parse(s));
 return rawOzardMetrics(events,app,week,now);
}
