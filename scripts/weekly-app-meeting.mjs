#!/usr/bin/env node
// Presentation-only entry point: the write boundary permits blocks belonging to
// the Meeting Scorecard and weekly projection pages; never warehouse/database rows.
import fs from 'node:fs';
import path from 'node:path';
import {loadEnvFile,notionTokenState} from './store-downloads-to-notion.mjs';
import {weekWindow,writePrivate,fingerprint} from './growth-scorecard/core.mjs';
import {publishMeeting} from './growth-scorecard/meeting.mjs';
import {authorizeManualRepair,readLifecycle} from './growth-scorecard/week-lifecycle.mjs';
const repairIndex=process.argv.indexOf('--repair-week'),repairWeek=repairIndex>=0?process.argv[repairIndex+1]:null;
if(repairWeek&&repairWeek!=='2026-09-07')throw Error('This one-time repair authorization is only for W37 2026');
const repairPageId='3dc2cad5-82de-8155-8c2b-c4a0062006b0';
const config=JSON.parse(fs.readFileSync('.growth-scorecard.local.json'));
// Share the warehouse publisher's existing lock: both can update this page.
const lock=path.resolve('.growth-scorecard.local.json.lock');let lockFd;
try{lockFd=fs.openSync(lock,'wx',0o600);fs.writeSync(lockFd,String(process.pid));}catch{throw new Error('Scorecard writer already running; retry after it completes');}
process.on('exit',()=>{fs.closeSync(lockFd);fs.unlinkSync(lock);});
for(const file of config.envFiles)loadEnvFile(file);
const token=notionTokenState({}).token;if(!token)throw new Error('Notion credential unavailable');
const owned=new Set([config.notion.meetingPageId]);const projectionPages=new Set();const writes=[];
const api=async(endpoint,method='GET',body)=>{
 if(method!=='GET'){
  const query=method==='POST'&&/^data_sources\/[^/]+\/query$/.test(endpoint);
  const target=endpoint.split('/')[1];
  const createProjection=endpoint==='pages'&&method==='POST'&&body?.parent?.type==='page_id'&&(body.parent.page_id===config.notion.parentPageId||projectionPages.has(body.parent.page_id));
  const lockProjection=endpoint.startsWith('pages/')&&method==='PATCH'&&projectionPages.has(target)&&Object.keys(body||{}).length===1&&(body.is_locked===true||(repairWeek&&target.replaceAll('-','')===repairPageId.replaceAll('-','')&&body.is_locked===false));
  if(!query&&!createProjection&&!lockProjection&&!(endpoint.startsWith('blocks/')&&owned.has(target)))throw new Error('Presentation-only write boundary rejected '+endpoint);
  if(!query)writes.push({method,endpoint});
 }
 for(let attempt=0;attempt<4;attempt++){
  const r=await fetch('https://api.notion.com/v1/'+endpoint,{method,headers:{Authorization:'Bearer '+token,'Notion-Version':'2025-09-03','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
  if(r.status===429){await new Promise(resolve=>setTimeout(resolve,Math.min(10,Number(r.headers.get('retry-after'))||2)*1000));continue;}
  if(!r.ok)throw new Error('Notion HTTP '+r.status);
  const d=await r.json();if(endpoint.startsWith('blocks/')){if(d.id)owned.add(d.id);for(const b of d.results||[]){owned.add(b.id);if(b.type==='child_page'&&((endpoint.startsWith('blocks/'+config.notion.parentPageId+'/')&&b.child_page.title==='Historical Weekly Reports')||projectionPages.has(endpoint.split('/')[1])))projectionPages.add(b.id);}}if(endpoint==='pages'&&method==='POST')projectionPages.add(d.id);return d;
 }throw new Error('Notion rate limit');
};
async function query(id){const rows=[];let cursor;do{const d=await api('data_sources/'+id+'/query','POST',{page_size:100,...(cursor?{start_cursor:cursor}:{})});rows.push(...d.results);cursor=d.has_more?d.next_cursor:null;}while(cursor);return rows;}
const stable=rows=>[...rows].sort((a,b)=>a.id.localeCompare(b.id)).map(p=>({id:p.id,archived:p.archived,last_edited_time:p.last_edited_time,properties:p.properties}));
const warehouse=await query(config.notion.dataSourceId);
const historicalId=process.env.NOTION_APP_DOWNLOADS_DATABASE_ID||process.env.NOTION_DATABASE_ID;
const history=historicalId?await api('databases/'+historicalId):null;
const historySources=history?.data_sources?.map(x=>x.id)||[];
const historical=await Promise.all(historySources.map(query));
const week=weekWindow();
writePrivate(path.resolve('docs/weekly-app-growth/meeting-redesign-before.local.json'),{warehouse,historicalMetadata:history,historical,week});
console.log(JSON.stringify({warehouseRows:warehouse.length,historicalRows:historical.map(x=>x.length),week:week.start}));
if(!process.argv.includes('--publish'))process.exit(0);
if(repairWeek)authorizeManualRepair(config,warehouse,repairWeek,{correctionId:'W37-2026-canonical-repair-v1',reason:'User-requested one-time rebuild and relock from reconciled canonical warehouse; pre-Friday manual close, partial rows remain excluded from comparisons',pageId:repairPageId});
const result=await publishMeeting(config,{week},warehouse,api);
const writesBeforeRerun=writes.length;
const again=await publishMeeting(config,{week},warehouse,api);
const rerunWrites=writes.length-writesBeforeRerun;
if(again.updated!==0||again.historyCreated!==0||rerunWrites!==0)throw new Error('Meeting rerun was not idempotent');
const after=await query(config.notion.dataSourceId);const historyAfter=await Promise.all(historySources.map(query));
if(fingerprint(stable(warehouse))!==fingerprint(stable(after)))throw new Error('Warehouse changed during presentation update');
if(fingerprint(historical.map(stable))!==fingerprint(historyAfter.map(stable)))throw new Error('Historical DB changed during presentation update');
const evidence={result,rerun:again,rerunWrites,warehouseUnchanged:true,historicalUnchanged:true,historicalDatabaseChecked:Boolean(history),historicalRows:historical.map(x=>x.length),writes};
writePrivate(path.resolve('docs/weekly-app-growth/meeting-redesign-verification.local.json'),evidence);
console.log(JSON.stringify({...evidence,writes:writes.length}));
