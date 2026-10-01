import {reviewHistoricalBuilds} from './release-history.mjs';
import fs from 'node:fs';
import {addDays} from './core.mjs';
import {writePrivate} from './core.mjs';import {readLifecycle} from './week-lifecycle.mjs';
import {productEvents} from './product-export.mjs';import {discoverReleases} from './release-discovery.mjs';
import {evaluateReleases,contractHash} from './release-validation.mjs';
export const validationFile=(config,app,week)=>(config.releaseValidationDirectory||'docs/weekly-app-growth/release-validation')+'/'+week.start+'-'+app.key+'.local.json';
export async function prepareProductRelease(config,app,week){
 const file=validationFile(config,app,week);
 if(readLifecycle(config).weeks[week.start]?.status==='FINAL'){
  // Freeze the original accepted population. A newly discovered build is never
  // allowed to broaden FINAL rows through a routine collector/backfill.
  if(fs.existsSync(file))app.mixpanel.releaseValidation=JSON.parse(fs.readFileSync(file));
  return app;
 }
 try{const events=await productEvents(app,week),observed=[...new Map(events.map(e=>{const p=e.properties;return [[p.platform,p.app_version,p.build_number].join('|'),p];})).values()];
  const discovery=await discoverReleases(config,app,observed);
  const knownGood=Object.entries(app.mixpanel.minBuild).map(([platform,build])=>({platform,build:String(build),version:app.mixpanel.minVersion}));
  const baselineStats={};for(let n=1;n<=4;n++){const prior=validationFile(config,app,{start:addDays(week.start,-7*n)});if(!fs.existsSync(prior))continue;const previous=JSON.parse(fs.readFileSync(prior));if(previous.contract!==contractHash(app))continue;for(const b of previous.builds||[])if(['KNOWN_GOOD','AUTO_ACCEPTED_COMPATIBLE_BUILD'].includes(b.state)&&!baselineStats[b.platform])baselineStats[b.platform]=b.stats;}
  const evidence=app.mixpanel.releaseEvidence?.match(/Android (\S+) build (\d+)/);if(evidence)knownGood.push({platform:'android',version:evidence[1],build:evidence[2]});
  const result=evaluateReleases(events,app,week,discovery.releases,{knownGood,baselineStats});if(!app.mixpanel.timezone)for(const scope of Object.values(result.platforms)){scope.complete=false;scope.calendarVerified=false;scope.materiallyIncomplete=true;scope.review.push({version:'project calendar',build:'all',reasons:['Mixpanel project timezone unverified; exact weekly boundaries cannot be asserted']});}result.discoveryErrors=discovery.errors;app.mixpanel.releaseValidation=result;result.historicalReviews=reviewHistoricalBuilds(config,app,events);writePrivate(file,result);
 }catch(e){const result={week:week.start,app:app.key,contract:contractHash(app),builds:[],platforms:Object.fromEntries((app.key==='easyspell'?['android']:['ios','android']).map(platform=>[platform,{totalObservedActivity:0,acceptedActivity:0,coverage:0,complete:false,materiallyIncomplete:true,builds:[],review:[{version:'unknown',build:'unknown',reasons:[e.message]}],contract:contractHash(app)}]))};app.mixpanel.releaseValidation=result;writePrivate(file,result);}
 return app;
}
