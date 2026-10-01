#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import crypto from 'node:crypto';
import {loadEnvFile,notionTokenState} from './store-downloads-to-notion.mjs';
import {writePrivate,windowFromStart,safeError} from './growth-scorecard/core.mjs';
import {readLifecycle,finalWeekMatches} from './growth-scorecard/week-lifecycle.mjs';
import {recentFinalWeeks,canonicalRow,incomplete,classifyLateData,persistReview,applyCorrection,resumeCorrections} from './growth-scorecard/late-data.mjs';
import {appleInventory,collectApple,collectPlay} from './growth-scorecard/stores.mjs';
export async function runLateData(argv=process.argv.slice(2)){
 const configPath=path.resolve(argv.includes('--config')?argv[argv.indexOf('--config')+1]:'.growth-scorecard.local.json');
 const config=JSON.parse(fs.readFileSync(configPath)),publish=argv.includes('--publish');if(config.lateData?.enabled===false)return {disabled:true};for(const f of config.envFiles||[])loadEnvFile(f);
 const lock=configPath+'.lock',fd=fs.openSync(lock,'wx',0o600);fs.writeSync(fd,String(process.pid));
 try{
  const token=notionTokenState({}).token;if(!token)throw Error('Notion credential missing');
  const api=async(endpoint,method='GET',body)=>{const r=await fetch('https://api.notion.com/v1/'+endpoint,{method,headers:{Authorization:'Bearer '+token,'Notion-Version':'2025-09-03','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Notion HTTP '+r.status);return r.json();};
  const list=async()=>{const pages=[];let cursor;do{const d=await api('data_sources/'+config.notion.dataSourceId+'/query','POST',{page_size:100,...(cursor?{start_cursor:cursor}:{})});pages.push(...d.results);cursor=d.has_more?d.next_cursor:null;}while(cursor);return pages;};
  const deps={api,list};if(publish)await resumeCorrections(config,deps);if(argv.includes('--resume-only'))return {resumed:true};
  const state=readLifecycle(config),runId=crypto.randomUUID(),output={runId,publish,weeks:[],reviews:[],corrections:[],unchanged:[],unsupported:0};let pages=await list();
  for(const start of recentFinalWeeks(state)){
   if(!finalWeekMatches(pages,start,state.weeks[start]))throw Error('FINAL manifest drift; review required');
   const rows=pages.filter(p=>p.properties.Week?.date?.start===start).map(p=>canonicalRow(p,config)),eligible=rows.filter(incomplete),changes=[];
   output.weeks.push({week:start,incomplete:eligible.length});
   const groups=new Map();
   for(const old of eligible){
    const supported=old.country==='GLOBAL'&&old.segment==='all'&&(['Store Downloads','Product Page Views'].includes(old.metric)||old.platform==='Android'&&old.metric==='Store CVR')&&['iOS','Android'].includes(old.platform);
    if(!supported){output.unsupported++;persistReview(config,{state:'NO_DATE_PARTITION_ADAPTER',reasons:['No targeted date-partition adapter; no blind historical collection'],old,candidate:null},runId);continue;}
    const key=old.app+'|'+old.platform;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(old);
   }
   for(const group of groups.values()){
    const app=config.apps.find(a=>a.key===group[0].app);if(!app)continue;
    const scoped={...config,apps:[app]},week=windowFromStart(start),metrics=[...new Set(group.map(r=>r.metric))];let candidates=[];
    try{candidates=group[0].platform==='Android'?await collectPlay(scoped,week,{metrics}):await collectApple(scoped,week,await appleInventory(scoped),{metrics});}catch(e){output.reviews.push({week:start,app:app.key,state:'PROVIDER_UNAVAILABLE',error:safeError(e)});continue;}
    for(const old of group){const candidate=candidates.find(r=>r.id===old.id);const result=classifyLateData(old,candidate,{equivalentSources:config.lateData?.equivalentSources});
     if(result.state==='SAFE_LATE_DATA')changes.push(result);
     else if(result.state==='NO_NEW_DATA')output.unchanged.push({week:start,app:old.app,metric:old.metric,value:old.value,coverage:old.coverage,state:result.state,candidateStatus:candidate?.status,candidateNotes:candidate?.notes});
     else if(result.state==='PROVIDER_REVISION_REVIEW'){const file=persistReview(config,result,runId);output.reviews.push({week:start,app:old.app,metric:old.metric,state:result.state,reasons:result.reasons,changedObservedDates:result.changedObservedDates,observedPeriodComparison:result.observedPeriodComparison,file});}
    }
   }
   if(changes.length){if(publish){output.corrections.push(await applyCorrection(config,{week:start,changes,runId},deps));pages=await list();}else output.corrections.push({week:start,state:'SAFE_DRY_RUN',rows:changes.length});}
  }
  writePrivate('docs/weekly-app-growth/late-data/latest-run.local.json',output);console.log(JSON.stringify(output));return output;
 }finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)runLateData().catch(e=>{console.error(e.message);process.exitCode=1;});
