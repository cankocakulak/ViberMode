import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import cp from 'node:child_process';
export const STATUSES=['READY','EARLY','ESTIMATE','WAITING','N/A','NOT INSTRUMENTED'];
export function keychain(service){try{return cp.execFileSync('security',['find-generic-password','-s',service,'-w'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{return null;}}
export function dateInZone(value,timezone='Europe/Istanbul'){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
export function addDays(date,days){return new Date(Date.parse(date+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);}
// Sales daily reports normally arrive by 08:00 Pacific. Allow two more hours;
// Intl keeps this boundary correct when Pacific switches between PDT and PST.
export function appleSalesWindowReady(week,now=new Date()){
 const date=dateInZone(now,'America/Los_Angeles');
 const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'2-digit',hourCycle:'h23'}).format(now));
 const monday=addDays(week.end,1);return date>monday||(date===monday&&hour>=10);
}
export function weekWindow(reference=new Date()){
 const today=dateInZone(reference),day=new Date(today+'T12:00:00Z').getUTCDay();const start=addDays(today,-((day+6)%7)-7);return windowFromStart(start);
}
export function windowFromStart(start){if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||Number.isNaN(Date.parse(start+'T12:00:00Z'))||new Date(start+'T12:00:00Z').toISOString().slice(0,10)!==start||new Date(start+'T12:00:00Z').getUTCDay()!==1)throw new Error('Week must start on a valid Monday');return {start,end:addDays(start,6),startAt:start+'T00:00:00+03:00',endAt:addDays(start,7)+'T00:00:00+03:00',timezone:'Europe/Istanbul'};}
export function rowId(row){return JSON.stringify([row.week,row.app,row.metric,row.platform,row.segment,...(row.country&&row.country!=='GLOBAL'?[row.country]:[])]);}
export function metric(week,app,metricName,platform='All',extra={}){
 const r={week:week.start,app:app.key,appName:app.name,pillar:'Acquisition',metric:metricName,platform,segment:'all',country:'GLOBAL',value:null,unit:'count',currency:null,previousWeek:null,wowChange:null,source:'',sourceAccount:'',status:'WAITING',notes:'',sourceUrl:null,window:{...week},...extra};
 if(!STATUSES.includes(r.status))throw new Error('Invalid status');
 if(r.value!==null&&(typeof r.value!=='number'||!Number.isFinite(r.value)))throw new Error('Metric value must be finite or null');
 if(['WAITING','N/A','NOT INSTRUMENTED'].includes(r.status))r.value=null;
 r.id=rowId(r);return r;
}
export const numeric=v=>v!==null&&v!==undefined&&String(v).trim()!==''&&Number.isFinite(Number(v))?Number(v):null;
export function comparable(a,b){return a&&b&&a.weekStatus==='FINAL'&&b.weekStatus==='FINAL'&&a.finalizedVerified===true&&b.finalizedVerified===true&&a.value!==null&&b.value!==null&&a.unit===b.unit&&a.currency===b.currency&&a.status==='READY'&&b.status==='READY'&&a.definition===b.definition&&a.sourceTimezone===b.sourceTimezone&&a.complete!==false&&b.complete!==false&&((!a.releaseValidation&&!b.releaseValidation&&a.population===b.population)||(a.releaseValidation?.complete&&b.releaseValidation?.complete&&a.releaseValidation.contract===b.releaseValidation.contract));}
export function applyPrevious(rows,previous){const map=new Map(previous.map(r=>[JSON.stringify([r.app,r.metric,r.platform,r.segment,r.country||'GLOBAL']),r]));return rows.map(r=>{const p=map.get(JSON.stringify([r.app,r.metric,r.platform,r.segment,r.country||'GLOBAL']));return {...r,previousWeek:comparable(r,p)?p.value:null,wowChange:comparable(r,p)&&p.value!==0?(r.value-p.value)/Math.abs(p.value):null};});}
export function ratio(n,d){if(!n||!d||n.value===null||d.value===null||d.value<=0)return null;return n.value/d.value;}
export function sumCompatible(rows){if(!rows.length||rows.some(r=>r.value===null||r.status!=='READY'))return null;const first=rows[0];if(rows.some(r=>r.currency!==first.currency||r.sourceTimezone!==first.sourceTimezone||r.week!==first.week))return null;return rows.reduce((s,r)=>s+r.value,0);}
export function validateRows(rows){const seen=new Set();for(const r of rows){if(seen.has(rowId(r)))throw new Error('Duplicate canonical metric identity');seen.add(rowId(r));if(r.value!==null&&(typeof r.value!=='number'||!Number.isFinite(r.value)))throw new Error('Invalid numeric value');if(!STATUSES.includes(r.status)||r.id!==rowId(r))throw new Error('Invalid metric identity/status');if(['WAITING','N/A','NOT INSTRUMENTED'].includes(r.status)&&r.value!==null)throw new Error('Unavailable metric cannot have a value');}return rows;}
export function writePrivate(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{mode:0o600});fs.chmodSync(file,0o600);}
export async function request(url,{headers={},body,method='GET',binary=false}={}){
 const response=await fetch(url,{headers,method,...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 if(!response.ok){await response.body?.cancel();const e=new Error('HTTP '+response.status);e.status=response.status;throw e;}
 return binary?Buffer.from(await response.arrayBuffer()):response.json();
}
export function safeError(e){return e.status?'HTTP '+e.status:e.name==='TimeoutError'?'Provider timeout':'Provider unavailable';}
export function fingerprint(value){return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');}
