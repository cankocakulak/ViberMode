import fs from 'node:fs';import {readLifecycle} from './week-lifecycle.mjs';import {persistReview} from './late-data.mjs';import {eligibleEvent,populationFor} from './release-validation.mjs';import {windowFromStart} from './core.mjs';
// Propose, never apply: adding a build to a FINAL population is a semantic
// correction, not late store data. Existing controlled review artifacts are used.
export function reviewHistoricalBuilds(config,app,events,{loadReport=start=>{const file='docs/weekly-app-growth/'+start+'.local.json';return fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):null;}}={}){
 const reviews=[];for(const [start,state]of Object.entries(readLifecycle(config).weeks)){if(state.status!=='FINAL')continue;const report=loadReport(start);if(!report)continue;const window=windowFromStart(start);
 for(const platform of ['iOS','Android']){const old=report.rows.find(r=>r.app===app.key&&r.platform===platform&&r.metric==='Weekly Active Users'&&(r.country||'GLOBAL')==='GLOBAL');if(!old?.population)continue;let prior;try{prior=JSON.parse(old.population);}catch{continue;}
 const previous=p=>prior.builds?prior.builds.some(b=>b.version===String(p.app_version)&&String(b.build)===String(p.build_number)):prior.versions?.includes(p.app_version)&&Number(p.build_number)>=Number(typeof prior.minBuild==='object'?prior.minBuild[p.platform]:prior.minBuild);
 const affected=events.filter(e=>e.properties.platform===platform.toLowerCase()&&e.properties.time>=Date.parse(window.startAt)&&e.properties.time<Date.parse(window.endAt)&&eligibleEvent(app,e.properties)&&!previous(e.properties));if(!affected.length)continue;
 const builds=[...new Set(affected.map(e=>e.properties.app_version+' ('+e.properties.build_number+')'))].sort();const reasons=['population_changed','validated_builds_active_in_FINAL_week: '+builds.join(', ')];
 reviews.push(persistReview(config,{state:'PROVIDER_REVISION_REVIEW',reasons,changedObservedDates:[],old,candidate:{...old,value:null,population:populationFor(app,platform)},observedNewBuildEvents:affected.length,action:'Explicit historical population correction required; recompute and review before authorizing any canonical/snapshot change.'},'release-validation-'+app.key+'-'+start));
 }}return reviews;
}
