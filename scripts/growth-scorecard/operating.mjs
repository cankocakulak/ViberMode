import {eligibleEvent,populationFor} from './release-validation.mjs';
import {metric} from './core.mjs';
export const OPERATING_EVENTS=['app_first_opened','onboarding_completed','paywall_viewed','purchase_started','purchase_completed'];
// Input is the existing de-duplicated clean export. Identity sets stay in memory;
// only counts and explicit linkage evidence are stored in canonical Notes.
export function operatingRows(events,app,week,asOf=new Date()){
 const out=[];
 for(const platform of ['iOS','Android']){
  const ev=events.filter(e=>e.properties.platform===platform.toLowerCase()&&e.properties.time>=Date.parse(week.startAt)&&e.properties.time<Date.parse(week.endAt)&&OPERATING_EVENTS.includes(e.event));
  const users=new Map();for(const e of ev){const id=e.properties.distinct_id;if(!id)continue;if(!users.has(id))users.set(id,[]);users.get(id).push(e);}
  const counts=OPERATING_EVENTS.map(name=>new Set(ev.filter(e=>e.event===name).map(e=>e.properties.distinct_id)).size),chain=OPERATING_EVENTS.map(()=>new Set()),paired=OPERATING_EVENTS.map(()=>new Set());
  const missingView=ev.some(e=>OPERATING_EVENTS.indexOf(e.event)>=2&&!e.properties.paywall_view_id),missingAttempt=ev.some(e=>OPERATING_EVENTS.indexOf(e.event)>=3&&!e.properties.purchase_attempt_id);
  for(const[id,es]of users){const valid=(a,b,i)=>b.properties.time>=a.properties.time&&(i<3||!!a.properties.paywall_view_id&&a.properties.paywall_view_id===b.properties.paywall_view_id)&&(i<4||!!a.properties.purchase_attempt_id&&a.properties.purchase_attempt_id===b.properties.purchase_attempt_id);
   for(let i=1;i<5;i++)if(es.some(b=>b.event===OPERATING_EVENTS[i]&&es.some(a=>a.event===OPERATING_EVENTS[i-1]&&valid(a,b,i))))paired[i].add(id);
   let prior=es.filter(e=>e.event===OPERATING_EVENTS[0]);if(prior.length)chain[0].add(id);
   for(let i=1;i<5;i++){prior=es.filter(e=>e.event===OPERATING_EVENTS[i]&&prior.some(a=>valid(a,e,i)));if(prior.length)chain[i].add(id);}
  }
  for(let i=0;i<5;i++){const activity={eventCount:ev.filter(e=>e.event===OPERATING_EVENTS[i]).length,users:counts[i],firstOpenUsers:counts[0],orderedFromFirstOpen:chain[i].size,previousStageUsers:i?counts[i-1]:null,pairedFromPrevious:i?paired[i].size:null,previousChainUsers:i?chain[i-1].size:null,linksComplete:i<3||!missingView&&(i<4||!missingAttempt),fullChainLinksComplete:!missingView&&!missingAttempt};
   out.push(metric(week,app,'Weekly Operating Users',platform,{pillar:'Monetization',segment:OPERATING_EVENTS[i],value:counts[i],unit:'unique identity clusters',source:'Mixpanel raw export / canonical events; weekly operating activity',sourceAccount:app.mixpanel.projectId,sourceTimezone:week.timezone,definition:'weekly_operating_activity_v1',population:populationFor(app,platform),status:'EARLY',complete:true,activity,notes:`Observation cutoff ${new Date(asOf).toISOString()}. Event time inside [${week.startAt}, ${week.endAt}); no maturity gate. Every observed in-week event contributes to its stage event count, including returning users and Sunday activity. Distinct users are de-duplicated separately per stage and platform; they are not automatically nested. Ordered path requires first-open/onboarding/paywall chronology and exact view/attempt links for payment. A Monday acknowledgement belongs to the next week's activity, never the previous week's chain. Validated releases only; tester coverage remains EARLY. Identities never persisted.`}));
  }
 }return out;
}
