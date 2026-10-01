import {afCountryRows} from './country.mjs';
import {metric,keychain,numeric,safeError,addDays,dateInZone} from './core.mjs';
import {parseDelimited} from '../store-downloads-to-notion.mjs';
const PAID=new Set(['googleadwords_int','Facebook Ads','Apple Search Ads','tiktokglobal_int','bytedanceglobal_int']);
export function paidInstalls(rows,week,partnerRows){
 if(!rows.length||!partnerRows.length)throw new Error('Empty report is not proof of zero');
 const valid=r=>numeric(r.Installs)!==null&&Number(r.Installs)>=0&&r['Media Source (pid)'];
 if(!rows.every(r=>valid(r)&&r.Date>=week.start&&r.Date<=week.end)||!partnerRows.every(valid))throw new Error('Invalid report shape');
 const grouped=items=>{const g=new Map();for(const r of items){const k=r['Media Source (pid)'];g.set(k,(g.get(k)||0)+Number(r.Installs));}return g;};
 const daily=grouped(rows),summary=grouped(partnerRows);
 if([...new Set([...daily.keys(),...summary.keys()])].some(k=>(daily.get(k)||0)!==(summary.get(k)||0)))throw new Error('Partner daily / full-window totals differ');
 const unresolved=[...daily].filter(([k,n])=>n>0&&!PAID.has(k)&&k!=='Organic');
 const observed=[...daily].filter(([k])=>PAID.has(k)).reduce((s,[,n])=>s+n,0);
 return {total:[...daily.values()].reduce((s,n)=>s+n,0),organic:daily.get('Organic')||0,value:unresolved.length?null:observed,observed,unresolved:unresolved.map(([k,n])=>k+'='+n)};
}
export async function collectAppsFlyer(config,week){
 const token=keychain('viberboyz-appsflyer-reporting-api-token');const rows=[];
 for(const app of config.apps)for(const platform of ['iOS','Android']){
  const id=app.appsflyer?.[platform.toLowerCase()];const base={source:'AppsFlyer aggregate Pull API / partners daily reconciled to partners',sourceAccount:id||'',sourceUrl:'https://hq1.appsflyer.com/apiaccess/api/'+(id||''),sourceTimezone:'UTC',unit:'attributed paid installs',definition:'af_paid_ua_installs_v1'};
  try{
   if(!id||!token)throw new Error('Reporting credential/app identity absent');
   const get=async kind=>{const url=`https://hq1.appsflyer.com/api/agg-data/export/app/${encodeURIComponent(id)}/${kind}/v5?`+new URLSearchParams({from:week.start,to:week.end});
    const r=await fetch(url,{headers:{Authorization:'Bearer '+token,accept:'text/csv'},signal:AbortSignal.timeout(30000)});if(!r.ok){await r.body?.cancel();const e=new Error();e.status=r.status;throw e;}return parseDelimited(await r.text(),',');};
   // Default UA report excludes retargeting. Omit timezone explicitly for UTC.
   const [daily,partners]=await Promise.all([get('partners_by_date_report'),get('partners_report')]);
   const result=paidInstalls(daily,week,partners);try{const geo=await get('geo_by_date_report');rows.push(...afCountryRows(geo,daily,week,app,platform,base));}catch{}const closed=dateInZone(new Date(),'UTC')>=addDays(week.end,1);
   if(['ozard','easyspell'].includes(app.key))rows.push(metric(week,app,'AppsFlyer Installs',platform,{...base,definition:'af_total_ua_installs_v1',unit:'SDK first-launch installs',value:closed?result.total:null,status:closed?'EARLY':'WAITING',complete:closed,coverage:{dates:Array.from({length:7},(_,i)=>addDays(week.start,i)),observedDays:closed?7:0,expectedDays:7},notes:'PROVISIONAL acquisition reading. Organic + all attributed/custom UA sources; daily and weekly partner totals reconcile. First SDK launch, not store downloads, unique people, or paid installs. Retargeting excluded; classic attribution, no SKAN addition. UTC date window; attribution can revise. Collected '+new Date().toISOString()+'.'}));
   rows.push(metric(week,app,'AppsFlyer Paid Installs',platform,{...base,value:closed?(result.value??result.observed):null,status:closed?'EARLY':'WAITING',complete:closed&&result.value!==null,notes:`Exact requested UTC window; full-window partner totals reconcile to daily report. UA installs, not retargeting conversions. Sparse no-activity dates accepted only after total reconciliation. Verified paid-network installs=${result.observed}. `+(result.unresolved.length?'PARTIAL known-paid-network minimum; custom sources remain unclassified: '+result.unresolved.join(', ')+'. Not a complete all-paid total. ':'Paid media source identity verified. ')+'UTC source calendar and reporting revisions remain EARLY; not normalized to Istanbul.'}));
   for(const network of PAID){const value=partners.filter(r=>r['Media Source (pid)']===network).reduce((s,r)=>s+Number(r.Installs),0);rows.push(metric(week,app,'AppsFlyer Paid Installs Component',platform,{...base,segment:network,value:closed?value:null,status:closed?'EARLY':'WAITING',complete:closed,notes:'Exact network source in reconciled aggregate UA report; other custom sources are not allocated to this network.'}));}
  }catch(e){if(['ozard','easyspell'].includes(app.key))rows.push(metric(week,app,'AppsFlyer Installs',platform,{...base,definition:'af_total_ua_installs_v1',unit:'SDK first-launch installs',complete:false,notes:safeError(e)+'; fresh reconciled first-launch total unavailable; never substitute old week or zero.'}));rows.push(metric(week,app,'AppsFlyer Paid Installs',platform,{...base,notes:safeError(e)+'; no UI trailing-week or zero substitute.'}));}
 }
 return rows;
}
