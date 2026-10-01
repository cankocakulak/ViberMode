import fs from 'node:fs';
import path from 'node:path';
import {fingerprint,writePrivate,addDays,windowFromStart} from './core.mjs';
import {parseSemantics} from './reporting-semantics.mjs';
import {propertyText,pageFingerprint,weekManifest,finalWeekMatches,readLifecycle,saveLifecycle,exclusions} from './week-lifecycle.mjs';
import {notionProperties,propertiesMatch,indexExisting} from './notion.mjs';
import {publishMeeting,readTree,canonicalBlock} from './meeting.mjs';
import {weekWindow} from './core.mjs';
export const incomplete=r=>r.status==='WAITING'||r.complete===false||/PARTIAL|Incomplete export/i.test(r.notes||'')||r.coverage?.observedDays<r.coverage?.expectedDays||r.coverage?.dates&&Array.from({length:7},(_,i)=>addDays(r.week,i)).some(d=>!r.coverage.dates.includes(d));
export function recentFinalWeeks(lifecycle){return Object.keys(lifecycle.weeks).filter(w=>lifecycle.weeks[w].status==='FINAL').sort().reverse().slice(0,4);}
export function canonicalRow(page,config){
 const p=page.properties,notes=propertyText(p.Notes),s=parseSemantics(notes)||{},app=config.apps.find(a=>a.name===p.App?.select?.name),week=p.Week.date.start;
 return {...s,id:propertyText(p['Row Key']),pageId:page.id,app:app?.key,appName:p.App?.select?.name,week,window:windowFromStart(week),metric:propertyText(p.Metric),pillar:p.Pillar?.select?.name,platform:p.Platform?.select?.name,segment:propertyText(p.Segment),country:p.Country?.select?.name||'GLOBAL',value:p.Value?.number??null,status:p.Status?.select?.name,unit:propertyText(p.Unit),currency:propertyText(p.Currency)||null,source:propertyText(p.Source),sourceAccount:propertyText(p['Source Account']),sourceTimezone:notes.match(/^Source calendar: ([^.]+)\./)?.[1]||null,sourceUrl:p['Report / Source URL']?.url||null,previousWeek:p['Previous Week']?.number??null,wowChange:p['WoW Change']?.number??null,notes:notes.split('\n[Report semantics] ')[0].replace(/^Source calendar: [^.]+\. /,'')};
}
const equal=(a,b)=>fingerprint(a)===fingerprint(b);
function evidenceValid(r){
 const e=r.sourceEvidence,days=Object.keys(e?.dates||{}).sort(),expected=[...(r.coverage?.dates||[])].sort();
 if(e?.v!==1||!equal(days,expected)||days.some(d=>d<r.week||d>addDays(r.week,6)))return false;
 const keys=e.kind==='ratio'?['numerator','denominator']:e.kind==='sum'?['value']:[];
 if(!keys.length||days.some(d=>keys.some(k=>!Number.isFinite(e.dates[d][k])||e.dates[d][k]<0)))return false;
 if(r.value===null)return r.status==='WAITING';
 const sums=Object.fromEntries(keys.map(k=>[k,days.reduce((n,d)=>n+e.dates[d][k],0)]));
 const value=e.kind==='ratio'?(sums.denominator>0?sums.numerator/sums.denominator:null):sums.value;
 return Number.isFinite(value)&&Math.abs(value-r.value)<1e-10;
}
export function classifyLateData(old,candidate,{equivalentSources=[]}={}){
 const result={state:'NO_NEW_DATA',reasons:[],changedObservedDates:[],old,candidate};
 if(!candidate||!Number.isFinite(candidate.value))return result;
 if(!incomplete(old))return {...result,state:'NOT_ELIGIBLE'};
 const keys=['id','week','app','metric','platform','country','segment','definition','population','sourceTimezone','unit','currency','sourceAccount'];
 for(const k of keys)if((old[k]??null)!==(candidate[k]??null))result.reasons.push(k+'_changed');
 if(!old.definition||!old.sourceTimezone)result.reasons.push('missing_semantic_contract');
 if(old.source!==candidate.source&&!equivalentSources.some(a=>a.approvalId&&a.rowKey===old.id&&a.from===old.source&&a.to===candidate.source))result.reasons.push('source_changed');
 const a=old.sourceEvidence,b=candidate.sourceEvidence,previousDates=old.coverage?.dates||[],newDates=candidate.coverage?.dates||[];
 if(!evidenceValid(old))result.reasons.push('previous_daily_evidence_missing_or_invalid');
 if(!evidenceValid(candidate))result.reasons.push('candidate_daily_evidence_missing_or_invalid');
 if(a?.kind!==b?.kind)result.reasons.push('partition_semantics_changed');
 for(const date of previousDates){if(!newDates.includes(date))result.reasons.push('observed_date_removed');if(a?.dates?.[date]&&b?.dates?.[date]&&!equal(a.dates[date],b.dates[date]))result.changedObservedDates.push(date);}
 if(result.changedObservedDates.length)result.reasons.push('observed_values_changed');
 // Preserve evidence of an aggregate overlap revision even if old daily detail
 // was not retained. Do not invent which individual dates changed.
 if(previousDates.length&&previousDates.every(d=>b?.dates?.[d])){
  const fields=b.kind==='ratio'?['numerator','denominator']:['value'];
  result.observedPeriodComparison=Object.fromEntries(fields.map(k=>[k,{old:old[k]??null,candidate:previousDates.reduce((sum,d)=>sum+(b.dates[d][k]??0),0)}]));
  if(fields.some(k=>Number.isFinite(old[k])&&result.observedPeriodComparison[k].candidate!==old[k]))result.reasons.push('observed_period_total_changed');
 }
 if(result.reasons.length)return {...result,state:'PROVIDER_REVISION_REVIEW'};
 if(newDates.length<=previousDates.length)return result;
 return {...result,state:'SAFE_LATE_DATA',reason:'LATE_PROVIDER_DATA'};
}
export function persistReview(config,result,runId){
 const payload={...result,reconciliationRunId:runId};
 const id=fingerprint([result.old.id,result.state,result.reasons,result.old.value,result.old.coverage,result.candidate?.value,result.candidate?.coverage,result.candidate?.sourceEvidence]);
 const file=path.join(config.lateData?.directory||'docs/weekly-app-growth/late-data',`review-${id}.local.json`);
 if(!fs.existsSync(file))writePrivate(file,{id,createdAt:new Date().toISOString(),...payload});return file;
}
export function correctionProperties(row){const p=notionProperties(row,weekWindow().start);return Object.fromEntries(['Value','Status','Notes','Source','Source Account','Report / Source URL'].map(k=>[k,p[k]]));}
const atomic=(file,data)=>{writePrivate(file+'.tmp',data);fs.renameSync(file+'.tmp',file);};
export async function applyCorrection(config,{week,changes,runId},{api,list,refresh=async pages=>publishMeeting(config,{week:weekWindow()},pages,api)}){
 const dir=config.lateData?.directory||'docs/weekly-app-growth/late-data';
 const id=fingerprint([week,[...changes].sort((a,b)=>a.old.id.localeCompare(b.old.id)).map(c=>[c.old.id,c.candidate.value,c.candidate.coverage,c.candidate.sourceEvidence])]);
 const file=path.join(dir,`correction-${id}.local.json`);let journal=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):null;
 if(journal?.state==='COMMITTED')return {id,state:'COMMITTED',replay:true};
 let pages=await list(),state=readLifecycle(config),entry=state.weeks[week];
 if(!journal){
  if(!finalWeekMatches(pages,week,entry)||entry.snapshot?.status!=='VERIFIED')throw Error('Correction requires matching FINAL canonical manifest and verified archive');
  if(changes.some(c=>classifyLateData(c.old,c.candidate,{equivalentSources:config.lateData?.equivalentSources}).state!=='SAFE_LATE_DATA'))throw Error('Unsafe correction rejected');
  const existing=indexExisting(pages);
  for(const c of changes){const page=existing.get(c.old.id);if(!page||!equal(canonicalRow(page,config),c.old))throw Error('Correction candidate canonical baseline changed');}
  const archive=await readTree(api,entry.snapshot.pageId);
  if(fingerprint(archive.map(canonicalBlock))!==entry.snapshot.contentFingerprint)throw Error('Snapshot baseline changed');
  journal={id,state:'PREPARED',reason:'LATE_PROVIDER_DATA',week,correctionTimestamp:new Date().toISOString(),reconciliationRunId:runId,oldLifecycle:entry,oldManifest:weekManifest(pages,week),archive,changes:changes.map(c=>({app:c.old.app,metric:c.old.metric,platform:c.old.platform,week,old:c.old,new:c.candidate,pageId:existing.get(c.old.id).id,before:existing.get(c.old.id),properties:correctionProperties(c.candidate)}))};
  atomic(file,journal);
 }
 // Before *any* mutation or resumed write, every unrelated row must retain its
 // old hash, and every target must be either precisely before or precisely after.
 const current=indexExisting(pages),target=new Map(journal.changes.map(c=>[c.old.id,c]));
 const manifest=weekManifest(pages,week);
 if(manifest.rowCount!==journal.oldManifest.rowCount)throw Error('Historical row membership changed');
 for(const [key,hash] of Object.entries(manifest.rowHashes)){const c=target.get(key),p=current.get(key);if(!c){if(hash!==journal.oldManifest.rowHashes[key])throw Error('Unrelated historical row changed');}else{const expected={...c.before,properties:{...c.before.properties,...c.properties}};if(pageFingerprint(p)!==pageFingerprint(c.before)&&pageFingerprint(p)!==pageFingerprint(expected))throw Error('Correction target changed outside journal');}}
 for(const c of journal.changes){if(!propertiesMatch(current.get(c.old.id).properties,c.properties))await api('pages/'+c.pageId,'PATCH',{properties:c.properties});}
 pages=await list();const verified=indexExisting(pages);
 for(const c of journal.changes)if(!propertiesMatch(verified.get(c.old.id)?.properties,c.properties))throw Error('Late correction readback mismatch');
 const after=weekManifest(pages,week);for(const [key,hash]of Object.entries(after.rowHashes))if(!target.has(key)&&hash!==journal.oldManifest.rowHashes[key])throw Error('Unrelated row changed during correction');
 state=readLifecycle(config);
 if(state.weeks[week]?.lateCorrectionId!==id){state.weeks[week]={...journal.oldLifecycle,...after,exclusions:exclusions(pages,week),mode:'LATE_PROVIDER_DATA',lateCorrectionId:id,correctionNote:'Corrected after late provider data',snapshot:{...journal.oldLifecycle.snapshot,status:'BUILDING',capturedAt:journal.correctionTimestamp,replaceAuthorized:true}};saveLifecycle(config,state);}
 journal.state='CANONICAL_VERIFIED';journal.newManifest=after;atomic(file,journal);
 // Existing renderer reads all FINAL canonical rows, hence recalculates current
 // WoW/trends. Only the affected archive is marked BUILDING for replacement.
 await refresh(pages);
 const final=readLifecycle(config).weeks[week];
 if(final.snapshot?.status!=='VERIFIED'||!finalWeekMatches(await list(),week,final))throw Error('Corrected snapshot not verified');
 if(!(await api('pages/'+final.snapshot.pageId)).is_locked)throw Error('Corrected snapshot lock readback failed');
 journal.state='COMMITTED';journal.snapshot=final.snapshot;atomic(file,journal);return {id,state:'COMMITTED',rows:journal.changes.length};
}
export async function resumeCorrections(config,deps){const dir=config.lateData?.directory||'docs/weekly-app-growth/late-data';if(!fs.existsSync(dir))return [];const results=[];for(const file of fs.readdirSync(dir).filter(f=>f.startsWith('correction-')&&f.endsWith('.local.json'))){const j=JSON.parse(fs.readFileSync(path.join(dir,file)));if(j.state!=='COMMITTED')results.push(await applyCorrection(config,{week:j.week,changes:j.changes.map(c=>({old:c.old,candidate:c.new})),runId:j.reconciliationRunId},deps));}return results;}
