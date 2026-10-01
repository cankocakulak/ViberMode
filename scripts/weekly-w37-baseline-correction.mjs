#!/usr/bin/env node
// Explicitly approved, narrowly scoped one-time correction; ordinary runs never
// invoke this entry point. A durable journal makes interrupted creation resumable.
import fs from 'node:fs';
import {loadEnvFile,notionTokenState} from './store-downloads-to-notion.mjs';
import {writePrivate,fingerprint,windowFromStart} from './growth-scorecard/core.mjs';
import {readLifecycle,saveLifecycle,weekManifest} from './growth-scorecard/week-lifecycle.mjs';
import {readTree,canonicalBlock,publishMeeting} from './growth-scorecard/meeting.mjs';
import {notionProperties,indexExisting,propertiesMatch} from './growth-scorecard/notion.mjs';
import {W37,CORRECTION_ID,BASE_HASH,ARCHIVE_ID,correctionRows,verifyCorrectionExtension,correctedLifecycle} from './growth-scorecard/w37-mature-correction.mjs';
const publish=process.argv.includes('--publish'),config=JSON.parse(fs.readFileSync('.growth-scorecard.local.json'));
const journalFile='docs/weekly-app-growth/w37-mature-correction-journal.local.json',lock='.growth-scorecard.local.json.lock';let fd;
try{fd=fs.openSync(lock,'wx',0o600);fs.writeSync(fd,String(process.pid));}catch{throw Error('Scorecard writer already running');}
process.on('exit',()=>{fs.closeSync(fd);fs.unlinkSync(lock);});
for(const f of config.envFiles)loadEnvFile(f);const token=notionTokenState({}).token;if(!token)throw Error('Existing Notion credential unavailable');
const owned=new Set([config.notion.meetingPageId,ARCHIVE_ID]),projections=new Set([ARCHIVE_ID]),writes=[];let planned=[];
const api=async(endpoint,method='GET',body)=>{
 const query=method==='POST'&&/^data_sources\/[^/]+\/query$/.test(endpoint);
 if(method!=='GET'&&!query){
  if(!publish)throw Error('Dry run write prohibited');
  const target=endpoint.split('/')[1];
  const createCanonical=endpoint==='pages'&&method==='POST'&&body?.parent?.data_source_id===config.notion.dataSourceId&&planned.some(r=>propertiesMatch(body.properties,notionProperties(r,W37)));
  const updateProjection=endpoint.startsWith('blocks/')&&owned.has(target)&&['PATCH','DELETE'].includes(method);
  const lockProjection=endpoint.startsWith('pages/')&&method==='PATCH'&&projections.has(target)&&Object.keys(body||{}).length===1&&(body.is_locked===true||target===ARCHIVE_ID&&body.is_locked===false);
  if(!createCanonical&&!updateProjection&&!lockProjection)throw Error('One-time correction write boundary rejected '+endpoint);
  writes.push({method,endpoint});
 }
 for(let attempt=0;attempt<4;attempt++){
  const r=await fetch('https://api.notion.com/v1/'+endpoint,{method,headers:{Authorization:'Bearer '+token,'Notion-Version':'2025-09-03','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
  if(r.status===429){await new Promise(resolve=>setTimeout(resolve,Math.min(10,Number(r.headers.get('retry-after'))||2)*1000));continue;}
  if(!r.ok)throw Error('Notion HTTP '+r.status);
  const d=await r.json();if(endpoint.startsWith('blocks/')){if(d.id)owned.add(d.id);for(const b of d.results||[]){owned.add(b.id);if(b.type==='child_page'&&b.child_page.title==='Historical Weekly Reports')projections.add(b.id);}}
  return d;
 }throw Error('Notion rate limit');
};
async function query(id){const out=[];let cursor;do{const d=await api('data_sources/'+id+'/query','POST',{page_size:100,...(cursor?{start_cursor:cursor}:{})});out.push(...d.results);cursor=d.has_more?d.next_cursor:null;}while(cursor);return out;}
const stable=pages=>[...pages].sort((a,b)=>a.id.localeCompare(b.id)).map(p=>({id:p.id,archived:p.archived,last_edited_time:p.last_edited_time,properties:p.properties}));
let pages=await query(config.notion.dataSourceId),state=readLifecycle(config),journal;
try{journal=JSON.parse(fs.readFileSync(journalFile));}catch(e){if(e.code!=='ENOENT')throw e;}
if(!journal){
 if(state.weeks[W37]?.sourceFingerprint!==BASE_HASH||weekManifest(pages,W37).sourceFingerprint!==BASE_HASH)throw Error('Baseline changed before authorized correction');
 const archive=await readTree(api,ARCHIVE_ID),page=await api('pages/'+ARCHIVE_ID);
 if(!page.is_locked||fingerprint(archive.map(canonicalBlock))!==state.weeks[W37].snapshot.contentFingerprint)throw Error('Baseline archive lock/content mismatch');
 const historicalId=process.env.NOTION_APP_DOWNLOADS_DATABASE_ID||process.env.NOTION_DATABASE_ID;if(!historicalId)throw Error('Historical database identity missing');
 const historical=await api('databases/'+historicalId),historySources=historical.data_sources.map(x=>x.id),historicalRows=await Promise.all(historySources.map(query));
 journal={id:CORRECTION_ID,createdAt:new Date().toISOString(),before:pages,lifecycleBefore:state,archiveBefore:{page,blocks:archive},historySources,historicalRows,phase:'PREPARED'};
 if(publish)writePrivate(journalFile,journal);
}
if(journal.id!==CORRECTION_ID)throw Error('Correction journal identity mismatch');
planned=correctionRows(journal.before,JSON.parse(fs.readFileSync('docs/weekly-app-growth/mature-cohort-audit.local.json')));
const initial=verifyCorrectionExtension(journal.before,pages,planned);
console.log(JSON.stringify({phase:publish?'PUBLISH':'PREVIEW',oldRows:journal.before.length,planned:planned.map(r=>({metric:r.metric,platform:r.platform,numerator:r.numerator,denominator:r.denominator,value:r.value})),alreadyAdded:initial.added}));
if(!publish)process.exit(0);
for(const r of planned){const old=indexExisting(pages).get(r.id);if(old){if(!propertiesMatch(old.properties,notionProperties(r,W37)))throw Error('Existing correction row conflicts');continue;}
 // Never retry an uncertain POST blindly. On the next explicit invocation the
 // fresh full query above detects any successfully created row before retrying.
 await api('pages','POST',{parent:{type:'data_source_id',data_source_id:config.notion.dataSourceId},properties:notionProperties(r,W37)});
 pages=await query(config.notion.dataSourceId);verifyCorrectionExtension(journal.before,pages,planned);
}
pages=await query(config.notion.dataSourceId);if(!verifyCorrectionExtension(journal.before,pages,planned).complete)throw Error('Correction read-back incomplete');
state=correctedLifecycle(readLifecycle(config),pages,planned);saveLifecycle(config,state);
journal.phase='CANONICAL_VERIFIED';writePrivate(journalFile,journal);
const result=await publishMeeting(config,{week:windowFromStart(W37)},pages,api);
if(!result?.verified)throw Error('Meeting was not published');
const count=writes.length,again=await publishMeeting(config,{week:windowFromStart(W37)},pages,api);
if(writes.length!==count||again.updated!==0)throw Error('Correction rerun not idempotent');
const after=await query(config.notion.dataSourceId),verified=verifyCorrectionExtension(journal.before,after,planned);
const historicalAfter=await Promise.all(journal.historySources.map(query));
if(fingerprint(journal.historicalRows.map(stable))!==fingerprint(historicalAfter.map(stable)))throw Error('Historical downloads DB changed');
const final=readLifecycle(config).weeks[W37],page=await api('pages/'+ARCHIVE_ID);
if(!verified.complete||final.snapshot.status!=='VERIFIED'||!page.is_locked||weekManifest(after,W37).sourceFingerprint!==final.sourceFingerprint)throw Error('FINAL correction verification failed');
journal.phase='VERIFIED';journal.verifiedAt=new Date().toISOString();writePrivate(journalFile,journal);
const evidence={correctionId:CORRECTION_ID,result,rerun:again,rerunWrites:writes.length-count,existingCanonicalUnchanged:true,addedRows:4,totalRows:after.length,historicalUnchanged:true,historicalRows:historicalAfter.map(x=>x.length),archiveLocked:page.is_locked,archiveVerified:true,sourceFingerprint:final.sourceFingerprint,writes};
writePrivate('docs/weekly-app-growth/w37-mature-correction-verification.local.json',evidence);
console.log(JSON.stringify({...evidence,writes:writes.length}));
