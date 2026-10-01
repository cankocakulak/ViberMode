import fs from 'node:fs';
import path from 'node:path';
import {addDays,fingerprint,writePrivate,windowFromStart} from './core.mjs';
export const LIFECYCLE_FILE='docs/weekly-app-growth/week-lifecycle.local.json';
export const COLLECTORS=['Apple','Google Play','RevenueCat','Mixpanel','Creator Hub','Ad cost','AppsFlyer','First-party'];
export const lifecyclePath=config=>config?.lifecycleFile||LIFECYCLE_FILE;
export function readLifecycle(config){try{return JSON.parse(fs.readFileSync(lifecyclePath(config)));}catch(e){if(e.code==='ENOENT')return {version:1,weeks:{}};throw e;}}
export function saveLifecycle(config,state){const file=lifecyclePath(config),tmp=file+'.tmp';writePrivate(tmp,state);fs.renameSync(tmp,file);}
export function finalizationCutoff(start){windowFromStart(start);return addDays(start,11)+'T21:30:00+03:00';}
export const propertyText=x=>(x?.rich_text||x?.title||[]).map(t=>t.plain_text??t.text?.content??'').join('');
export function pageFingerprint(page){const p=page.properties;return fingerprint(Object.keys(p).filter(k=>!['Latest Week','Previous Week','WoW Change'].includes(k)).sort().map(k=>{const v=p[k];return [k,v.title||v.rich_text?propertyText(v):v.select?v.select.name:v.date?{start:v.date.start,end:v.date.end||null}:('number'in v)?v.number:('url'in v)?v.url:('checkbox'in v)?v.checkbox:null];}));}
export function weekManifest(pages,start){const rows=pages.filter(p=>p.properties.Week?.date?.start===start);const entries=rows.map(p=>[propertyText(p.properties['Row Key']),pageFingerprint(p)]).sort(([a],[b])=>a.localeCompare(b));if(!entries.length||entries.some(([key])=>!key)||new Set(entries.map(([key])=>key)).size!==entries.length)throw Error('Invalid canonical week manifest');return {rowCount:entries.length,rowHashes:Object.fromEntries(entries),sourceFingerprint:fingerprint(entries)};}
export function finalWeekMatches(pages,start,entry){return entry?.status==='FINAL'&&entry.sourceFingerprint===weekManifest(pages,start).sourceFingerprint;}
export function exclusions(pages,start){return pages.filter(p=>p.properties.Week?.date?.start===start).filter(p=>{const n=propertyText(p.properties.Notes),status=p.properties.Status?.select?.name;return p.properties.Value?.number===null||!['READY','EARLY'].includes(status)||/PARTIAL|"complete":false|"mature":false|unverified/i.test(n);}).map(p=>({key:propertyText(p.properties['Row Key']),status:p.properties.Status?.select?.name,reason:p.properties.Value?.number===null?'Unavailable; canonical Notes retained':'Partial, immature, estimated or unverified scope; not comparison eligible'}));}
export function advanceWeek(previous,report,pages,now=new Date()){
 if(previous?.status==='FINAL')return previous;
 const run=report.reconciliation;if(!run||run.mode!=='collection')return previous||{status:'OPEN',cutoff:finalizationCutoff(report.week.start),runs:[]};
 const runs=[...(previous?.runs||[])];if(runs.some(r=>r.startedAt===run.startedAt))return previous;
 // Product adapters may return WAITING rows after a transport exception. A
 // fulfilled wrapper promise is not proof that this collector completed.
 const collectionErrors=[...new Set(report.rows.flatMap(r=>(r.releaseValidation?.review||[]).flatMap(v=>v.reasons||[])).filter(reason=>/^(Product (projection|export|event)|Raw journey timestamps|JQL\/raw|Journey export|Raw timestamp calibration credential)/.test(reason)))];
 const success=COLLECTORS.every(name=>run.collectors?.some(r=>r.name===name&&r.ok&&r.rowCount>0))&&!report.rows.some(r=>r.metric==='Provider Coverage')&&collectionErrors.length===0;
 const receipt={startedAt:run.startedAt,completedAt:run.completedAt,verifiedAt:now.toISOString(),success,...(collectionErrors.length?{collectionErrors}:{})};runs.push(receipt);
 const cutoff=finalizationCutoff(report.week.start),eligible=success&&runs.filter(r=>r.success).length>=2&&Date.parse(run.startedAt)>=Date.parse(cutoff)&&Date.parse(run.completedAt)>=Date.parse(run.startedAt)&&Date.parse(run.completedAt)<=+now;
 const state={status:runs.length===1&&success?'OPEN':'RECONCILING',cutoff,runs};
 if(eligible)Object.assign(state,{status:'FINAL',finalizedAt:now.toISOString(),mode:'SCHEDULED_RECONCILIATION',...weekManifest(pages,report.week.start),exclusions:exclusions(pages,report.week.start),snapshot:{status:'BUILDING',capturedAt:now.toISOString()}});
 return state;
}
export function recordReconciliation(config,report,pages){const state=readLifecycle(config);state.weeks[report.week.start]=advanceWeek(state.weeks[report.week.start],report,pages);saveLifecycle(config,state);return state;}
export function authorizeManualRepair(config,pages,start,{correctionId,reason,pageId}){
 if(!correctionId||!reason||!pageId)throw Error('Manual repair needs explicit correction ID, reason and existing page ID');
 const state=readLifecycle(config),old=state.weeks[start];
 if(old?.correctionId===correctionId){if(!finalWeekMatches(pages,start,old))throw Error('Canonical values changed after authorized correction; a new explicit correction is required');return state;}
 if(old?.status==='FINAL')throw Error('Final week already exists; require a separately reviewed correction migration');
 const now=new Date().toISOString();state.weeks[start]={status:'FINAL',mode:'MANUAL_CORRECTION',correctionId,reason,cutoff:finalizationCutoff(start),cutoffException:Date.parse(now)<Date.parse(finalizationCutoff(start)),finalizedAt:now,runs:old?.runs||[],...weekManifest(pages,start),exclusions:exclusions(pages,start),snapshot:{pageId,status:'BUILDING',capturedAt:now,replaceAuthorized:true}};saveLifecycle(config,state);return state;
}
