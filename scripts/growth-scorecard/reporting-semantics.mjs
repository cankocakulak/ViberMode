import {addDays,fingerprint} from './core.mjs';
export const TREND_METRICS=[
 ['Acquisition','Downloads','Store Downloads'],['Acquisition','Native Store CVR','Store CVR'],['Acquisition','CPI','CPI'],
 ['Monetization','Paywall → Checkout','Paywall → Checkout Conversion'],['Monetization','New Purchases','RevenueCat Verified Initial Purchases'],['Monetization','Revenue','Verified Revenue'],
 ['Retention & Usage','Core Value Reach','Core Value Reach'],['Retention & Usage','D1','D1'],['Retention & Usage','W1 Renewal','Subscription W1']
];
export function comparisonMetadata(r){
 const cutoff=r.notes?.match(/Observation cutoff (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/i)?.[1];
 const raw=r.source?.includes('canonical events');
 const fullyObserved=raw&&cutoff&&Date.parse(cutoff)>=Date.parse(r.window?.endAt);
 const mature=r.segment?.startsWith('mature-cohort:');
 const immature=Number(r.notes?.match(/immature (\d+)/i)?.[1]||0);
 const partial=/PARTIAL|Incomplete export|Latest chart period incomplete/i.test(r.notes||'');
 const complete=r.complete===false?false:r.complete===true||r.status==='READY'||!!fullyObserved||!!mature;
 const sourceCohort=r.segment?.match(/^(?:mature|start)-cohort:(\d{4}-\d{2}-\d{2})/)?.[1]||null;
 const cohortLag=sourceCohort?(Date.parse(r.week)-Date.parse(sourceCohort))/86400000:null;
 return {v:1,...(r.releaseValidation?{releaseValidation:r.releaseValidation}:{}),...(r.sourceEvidence?{sourceEvidence:r.sourceEvidence}:{}),...(r.cohort?{cohort:r.cohort}:{}),...(r.activity?{activity:r.activity}:{}),...(r.featureMembership?{featureMembership:r.featureMembership}:{}),country:r.country||'GLOBAL',coverage:r.coverage||null,geoDefinition:r.geoDefinition||null,definition:r.definition||null,complete:complete&&!partial,mature:immature===0&&!r.segment?.startsWith('start-cohort:'),population:r.population||null,cohortLag,cohortPlan:r.segment?.match(/;plan:([^;]+)/)?.[1]||null,numerator:r.numerator??null,denominator:r.denominator??null};
}
export function notesWithSemantics(r){
 const metadata=comparisonMetadata(r);
 return (r.sourceTimezone?'Source calendar: '+r.sourceTimezone+'. ':'')+(r.notes||'')+'\n[Report semantics] '+JSON.stringify(metadata);
}
export function parseSemantics(notes){try{return JSON.parse(notes.match(/\n\[Report semantics\] (\{[^\n]+\})/)?.[1]||'null');}catch{return null;}}
export function trendEligible(r){return !!r&&r.weekStatus==='FINAL'&&r.finalizedVerified===true&&Number.isFinite(r.value)&&['READY','EARLY'].includes(r.status)&&r.semantics?.v===1&&r.semantics.definition&&r.semantics.complete&&(!r.semantics.releaseValidation||r.semantics.releaseValidation.complete)&&r.semantics.mature&&(!r.semantics.coverage||r.semantics.coverage.observedDays===7&&r.semantics.coverage.expectedDays===7)&&!(/PARTIAL|immature [1-9]/i.test(r.notes||''))&&r.calendar&&!/unverified/i.test(r.calendar)&&!['UGC Production Cost'].includes(r.metric);}
export function coverageSignature(r){const c=r.semantics?.coverage;if(!c)return 'full-source-period';const relative=dates=>(dates||[]).map(d=>(Date.parse(d)-Date.parse(r.week))/86400000).sort((a,b)=>a-b);return [c.expectedDays,c.observedDays,relative(c.dates),relative(c.numeratorDates),relative(c.denominatorDates)];}
export function trendSignature(r){
 const s=r.semantics;
 const segment=r.segment?.replace(/(?:mature|start)-cohort:\d{4}-\d{2}-\d{2}/,'mature-cohort:relative');
 return fingerprint([r.appName,r.metric,r.platform,segment,r.country||'GLOBAL',r.unit,r.currency,r.calendar,r.source,r.sourceAccount,s?.definition,s?.releaseValidation?.complete?['release-contract',s.releaseValidation.contract]:s?.population,s?.cohortLag,s?.cohortPlan,coverageSignature(r)]);
}
export function compatibleTrend(a,b){return trendEligible(a)&&trendEligible(b)&&addDays(b.week,7)===a.week&&trendSignature(a)===trendSignature(b);}
export function trendDelta(a,b){
 if(!compatibleTrend(a,b))return '';
 const d=a.value-b.value;
 if(a.unit==='ratio')return (d>=0?'+':'−')+Math.abs(d*100).toFixed(1)+'pp';
 if(b.value===0)return '';
 return (d>0?'↑':d<0?'↓':'→')+Math.abs(d/b.value*100).toFixed(1)+'%';
}
export function rollingTrendRows(rows,week,app,format){
 const weeks=[3,2,1,0].map(i=>addDays(week.start,-7*i));
 return TREND_METRICS.flatMap(([group,label,metric])=>{
  const relevant=rows.filter(r=>(r.country||'GLOBAL')==='GLOBAL'&&r.appName===app&&r.metric===metric&&weeks.includes(r.week));
  const platforms=metric==='CPI'?['All']:['iOS','Android'];
  return platforms.map(platform=>{
   const chosen=weeks.map(w=>{const options=relevant.filter(r=>r.week===w&&r.platform===platform);const mature=options.filter(r=>r.segment?.startsWith('mature-cohort:')&&Number.isFinite(r.value));return mature.length===1?mature[0]:options.find(r=>r.segment==='all'||r.segment==='clean-first-open-cohort');});
   // The most recent eligible definition anchors the entire line. Values from
   // different versions/calendars/cohort ages are withheld, not joined visually.
   const anchor=[...chosen].reverse().find(trendEligible);
   const points=chosen.map(r=>anchor&&trendEligible(r)&&trendSignature(r)===trendSignature(anchor)?r:null);
   return {group,label:label+(platform==='All'?'':' · '+platform),metric,platform,points,cells:[label+(platform==='All'?'':' · '+platform),...points.map((r,i)=>r?format(r)+(i&&trendDelta(r,points[i-1])?'\n'+trendDelta(r,points[i-1]):''):'—')]};
  });
 });
}
export function weeklyReportTitle(start){const d=new Date(start+'T12:00:00Z');const thursday=new Date(+d+3*86400000);const year=thursday.getUTCFullYear();const jan4=new Date(Date.UTC(year,0,4,12));const first=new Date(+jan4-((jan4.getUTCDay()+6)%7)*86400000);const week=Math.round((+d-+first)/604800000)+1;const end=new Date(Date.parse(addDays(start,6)+'T12:00:00Z'));const month=x=>new Intl.DateTimeFormat('en-US',{month:'short',timeZone:'UTC'}).format(x);return `W${week} · ${month(d)} ${d.getUTCDate()}–${d.getUTCMonth()===end.getUTCMonth()?'':month(end)+' '}${end.getUTCDate()}, ${year}`;}
