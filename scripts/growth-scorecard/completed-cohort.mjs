import {eligibleEvent,populationFor} from './release-validation.mjs';
import {metric,addDays,windowFromStart} from './core.mjs';
import {matureJourneyCounts} from './mature-journey.mjs';
// Publish a fully observed prior acquisition cohort in the current OPEN report.
// Never back-write its already FINAL acquisition week.
export function completedCohortRows(events,app,reportWeek,asOf){
 const cohortWeek=windowFromStart(addDays(reportWeek.start,-7));
 if(Date.parse(cohortWeek.startAt)<Date.parse(app.mixpanel.cleanSince)||Date.parse(cohortWeek.endAt)+7*86400000>+asOf)return [];
 const rows=[];
 for(const platform of ['iOS','Android']){
  const all=events.filter(e=>e.properties.platform===platform.toLowerCase()&&e.properties.distinct_id&&e.properties.time<=+asOf).sort((a,b)=>a.properties.time-b.properties.time),births=new Map(),byUser=new Map();
  for(const e of all){const id=e.properties.distinct_id;if(!byUser.has(id))byUser.set(id,[]);byUser.get(id).push(e);if(e.event==='app_first_opened'&&!births.has(id))births.set(id,e.properties.time);}
  const cohort=[...births].filter(([,t])=>t>=Date.parse(cohortWeek.startAt)&&t<Date.parse(cohortWeek.endAt)),counts=matureJourneyCounts(cohort,byUser);
  rows.push(metric(reportWeek,app,'7-Day Acquisition Cohort First Opens',platform,{pillar:'Monetization',segment:'mature-cohort:'+cohortWeek.start,value:cohort.length,unit:'unique identity clusters',source:'Mixpanel raw export / canonical events; completed acquisition cohort',sourceAccount:app.mixpanel.projectId,sourceTimezone:reportWeek.timezone,definition:'completed_acquisition_cohort_7d_v1',population:populationFor(app,platform),complete:counts.completeLinks,status:counts.completeLinks?'EARLY':'WAITING',cohort:{start:cohortWeek.start,end:cohortWeek.end,total:cohort.length,mature:cohort.length,pending:0,counts,cutoff:new Date(asOf).toISOString()},notes:`Observation cutoff ${new Date(asOf).toISOString()}. Fully elapsed seven-day follow-up for the entire acquisition week ${cohortWeek.start}..${cohortWeek.end}; immature 0. Exact raw identity, view and attempt links, chronological order. Published in report week ${reportWeek.start}; earlier FINAL rows and snapshot are never rewritten. Product acknowledgements, not verified store purchases. Clean release coverage remains EARLY.`}));
 }return rows;
}
