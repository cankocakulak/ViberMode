import {reportingToken} from './apple-reporting-auth.mjs';
import {appleDiscoveryRows} from './apple-discovery.mjs';
import {storeCountryReadbacks} from './country.mjs';
import fs from 'node:fs';
import {readApplePageViews} from './apple-analytics.mjs';
import {appStoreConnectToken,googleAccessToken,readGoogleServiceAccount,parseDelimited,decompressMaybe} from '../store-downloads-to-notion.mjs';
import {metric,keychain,request,safeError,addDays,numeric,appleSalesWindowReady,fingerprint} from './core.mjs';
const TYPES=new Set(['1','1F','1T','F1']);
export async function appleInventory(config){
 const accounts=[];
 for(const account of config.appleAccounts){try{const p=account.keychainPrefix;
 const credentials={ascKeyId:keychain(p+'-asc-key-id'),ascIssuerId:keychain(p+'-asc-issuer-id'),ascApiKeyP8B64:keychain(p+'-asc-api-key-p8-b64')};
 const token=appStoreConnectToken(credentials);const apps=[];let next='https://api.appstoreconnect.apple.com/v1/apps?limit=200';
 while(next){const data=await request(next,{headers:{Authorization:'Bearer '+token}});apps.push(...data.data.map(a=>({id:a.id,name:a.attributes.name,bundleId:a.attributes.bundleId,sku:a.attributes.sku})));next=data.links?.next;}
 let salesToken=token;
 if(account.salesAuth==='env'){
  const candidate=appStoreConnectToken({ascKeyId:process.env.ASC_KEY_ID,ascIssuerId:process.env.ASC_ISSUER_ID,ascApiKeyP8B64:process.env.ASC_API_KEY_P8_B64});
  const proof=await request('https://api.appstoreconnect.apple.com/v1/apps?limit=200',{headers:{Authorization:'Bearer '+candidate}});
  if(!proof.data?.some(a=>apps.some(b=>b.id===a.id)))throw new Error('Sales credential ownership mismatch');salesToken=candidate;
 }
 let analyticsToken=account.analyticsAuth==='env'?salesToken:token,reportingError=null;
 if(account.reportingAuth){try{const candidate=reportingToken(account);if(candidate){for(const app of config.apps.filter(a=>apps.some(x=>x.id===a.iosAppleId))){await request('https://api.appstoreconnect.apple.com/v1/apps/'+app.iosAppleId,{headers:{Authorization:'Bearer '+candidate}});}salesToken=candidate;analyticsToken=candidate;}else reportingError='Reporting key not installed';}catch(e){reportingError=safeError(e);}}
 accounts.push({...account,token,salesToken,analyticsToken,reportingError,apps,status:'READY'});
 }catch(e){accounts.push({...account,apps:[],status:'WAITING',error:safeError(e)});}}
 return accounts;
}
export function mergeAppleDaily(slices){
 const valid=slices.filter(s=>s.value!==null);if(valid.length>1)return {value:null,status:'WAITING',notes:'Transfer-day overlap across accounts requires provenance reconciliation; not summed.'};
 return valid[0]||{value:null,status:'WAITING'};
}
export async function collectApple(config,week,inventory,{metrics=null}={}){
 const want=name=>!metrics||metrics.includes(name);
 const observations=[];const reports=new Map();
 for(const account of (want('Store Downloads')?inventory:[])){for(const vendor of account.vendorNumbers||[]){for(let day=week.start;day<=week.end;day=addDays(day,1)){
  const id=account.key+'|'+vendor+'|'+day;try{
   if(!account.token)throw new Error('Missing credentials');
   const q=new URLSearchParams({'filter[frequency]':'DAILY','filter[reportDate]':day,'filter[reportSubType]':'SUMMARY','filter[reportType]':'SALES','filter[vendorNumber]':vendor,'filter[version]':'1_0'});
   const b=await request('https://api.appstoreconnect.apple.com/v1/salesReports?'+q,{headers:{Authorization:'Bearer '+account.salesToken},binary:true});
   reports.set(id,{rows:parseDelimited(decompressMaybe(b),'\t'),day,account});
  }catch(e){reports.set(id,{error:safeError(e),day,account});}
 }}}
 for(const app of config.apps){
  const owners=inventory.filter(a=>a.apps.some(x=>x.id===app.iosAppleId));
  const histories=inventory.filter(a=>(app.historicalAppleProfiles||[]).includes(a.keychainPrefix));
  const required=[...new Map([...owners,...histories].map(a=>[a.key,a])).values()];
  const dailyEvidence={};let sum=0,complete=appleSalesWindowReady(week),observed=false,overlap=false;const problems=[];
  if(!complete)problems.push('PRELIMINARY: Sunday report cannot be finalized before following Monday 10:00 America/Los_Angeles; canonical weekly value withheld');
  if(!required.length||owners.length!==1) {complete=false;problems.push('Current ownership not uniquely resolved');}
  for(const a of required)if(a.status!=='READY'||!a.vendorNumbers?.length){complete=false;problems.push(a.label+': vendor/report access missing');}
  for(let day=week.start;day<=week.end;day=addDays(day,1)){
   const daySlices=[];let dayValid=required.length>0;
   for(const a of required){let total=0,valid=0,matched=false;
    for(const vendor of a.vendorNumbers||[]){const report=reports.get(a.key+'|'+vendor+'|'+day);
     if(!report||report.error){dayValid=false;complete=false;problems.push(day+' '+a.label+': '+(report?.error||'missing'));continue;}valid++;
     for(const row of report.rows){if(row['Apple Identifier']!==app.iosAppleId||!TYPES.has(row['Product Type Identifier']))continue;const n=numeric(row.Units);if(n===null){dayValid=false;complete=false;problems.push('Invalid Units');continue;}matched=true;total+=n;}
    }
    if(valid)observed=true;if(matched)daySlices.push({value:total,status:'READY'});
   }
   const merged=mergeAppleDaily(daySlices);if(daySlices.length>1){overlap=true;complete=false;}else {sum+=merged.value??0;if(dayValid&&required.every(a=>a.vendorNumbers?.length))dailyEvidence[day]={value:merged.value??0};}
  }
  if(want('Store Downloads')){observations.push(metric(week,app,'Store Downloads','iOS',{sourceEvidence:{v:1,kind:'sum',dates:dailyEvidence,references:['Apple Sales SUMMARY daily vendor partitions']},coverage:{dates:Object.keys(dailyEvidence),observedDays:Object.keys(dailyEvidence).length,expectedDays:7},source:'Apple Sales and Trends / SALES SUMMARY / Units [1,1F,1T,F1]',sourceAccount:required.map(a=>a.label).join('; '),sourceUrl:'https://appstoreconnect.apple.com/apps/'+app.iosAppleId+'/analytics',value:observed&&!overlap&&appleSalesWindowReady(week)&&(complete||(['ozard','easyspell'].includes(app.key)&&sum>0))?sum:null,status:observed&&!overlap&&appleSalesWindowReady(week)&&(complete||(['ozard','easyspell'].includes(app.key)&&sum>0))?'EARLY':'WAITING',unit:'first downloads',sourceTimezone:'America/Los_Angeles',definition:'apple_first_downloads_v1',complete,notes:[...new Set(problems),...(!complete&&sum>0?['PARTIAL observed reporting-account downloads only; recipient/transfer coverage not complete. This measured amount is not a finalized app-week total and is excluded from complete CPI']:[]),'Provider Monday–Sunday in Pacific Time; daily totals cannot be exactly rebucketed into Istanbul. No redownloads.'].join('; ')}));
  if(!complete&&['ozard','easyspell'].includes(app.key)){try{const d=JSON.parse(fs.readFileSync(`docs/weekly-app-growth/apple-downloads-${app.key}.local.json`));if(d.metric==='First-Time Downloads'){const daily=appleConsoleDaily({...d,metric:'Product Page Views'},app,week);if(daily?.days.length){const r=observations.at(-1);Object.assign(r,{sourceEvidence:uiEvidence(daily),value:daily.total,status:'EARLY',complete:daily.days.length===7,coverage:{dates:daily.days,observedDays:daily.days.length,expectedDays:7},source:'App Store Connect Analytics / official First-Time Downloads daily table',sourceTimezone:'UTC',notes:(daily.days.length===7?'All seven UTC days measured. ':'PARTIAL '+daily.days.length+'/7 days; missing days are unknown, not zero. ')+'Current-owner signed-in Analytics. First-Time Downloads excludes redownloads. Official fallback closes transfer/vendor report coverage for this week; Sales API account reconciliation still pending. Dates '+daily.days.join(', ')+'.'});}}}catch{}}
  }
  const owner=owners[0];if(want('Product Page Views')){let analytics=await readApplePageViews(owner,app,week);
  if(analytics.value==null&&['ozard','easyspell'].includes(app.key)){try{
   const d=JSON.parse(fs.readFileSync(`docs/weekly-app-growth/apple-console-${app.key}.local.json`));const daily=appleConsoleDaily(d,app,week);
   if(daily)analytics={...analytics,sourceEvidence:uiEvidence(daily),value:daily.total,status:'EARLY',complete:daily.days.length===7,coverage:{dates:daily.days,observedDays:daily.days.length,expectedDays:7},source:'App Store Connect Analytics / official Product Page Views daily table',sourceTimezone:'UTC',notes:'Official signed-in Analytics daily readback; '+daily.days.join(', ')+'. '+(daily.days.length===7?'All seven UTC dates measured.':'PARTIAL observed dates only; absent days unknown.')+' Existing API blocker: '+analytics.notes+' UI Analytics access succeeds; API role/report availability must be reconciled separately. Page-view events, not unique visitors; not divided into Pacific Sales downloads.'};
  }catch{}}
  observations.push(metric(week,app,'Product Page Views','iOS',{source:'Apple Analytics Reports API',sourceAccount:owner?.label||'',unit:'page views',sourceTimezone:'provider-calendar-unverified',definition:'apple_product_page_event_counts_v1',...analytics,sourceUrl:'https://appstoreconnect.apple.com/apps/'+app.iosAppleId+'/analytics'}));
  }
  if(!metrics){try{observations.push(...appleDiscoveryRows(JSON.parse(fs.readFileSync('docs/weekly-app-growth/apple-discovery.local.json')),app,week));}catch{}
  let native=null;try{native=appleNativeConversion(JSON.parse(fs.readFileSync(`docs/weekly-app-growth/apple-cvr-${app.key}.local.json`)),app,week);}catch{}
  observations.push(native||metric(week,app,'Store CVR','iOS',{source:'App Store Connect Analytics / native weekly Conversion Rate',sourceAccount:owner?.label||'',unit:'ratio',definition:'apple_native_weekly_conversion_rate_v1',notes:'Native weekly Conversion Rate readback unavailable for this exact app/week. Apple defines (Total Downloads + pre-orders) / unique-device impressions. No daily-average substitution and no first downloads / product-page-view division.'}));
  }
 }
 if(!metrics)observations.push(...storeCountryReadbacks(config,week,observations));return metrics?observations.filter(r=>metrics.includes(r.metric)):observations;
}
export function appleNativeConversion(d,app,week){
 if(d.app!==app.key||d.appleId!==app.iosAppleId||d.week!==week.start||d.end!==week.end||d.metric!=='Conversion Rate'||d.frequency!=='WEEKLY'||d.sourceTimezone!=='UTC'||!d.observedAt||d.rowStart!==week.start||!d.account)return null;
 if(!/^\d+(?:\.\d{1,2})?%$/.test(d.displayValue||''))return null;
 const value=Number(d.displayValue.slice(0,-1))/100;if(!Number.isFinite(value)||value<0||value>1)return null;
 return metric(week,app,'Store CVR','iOS',{source:'App Store Connect Analytics / native weekly Conversion Rate',sourceAccount:d.account,sourceUrl:'https://appstoreconnect.apple.com/apps/'+app.iosAppleId+'/analytics',sourceTimezone:'UTC',definition:'apple_native_weekly_conversion_rate_v1',unit:'ratio',value,status:'EARLY',complete:true,notes:'Official signed-in Analytics weekly row, '+week.start+'–'+week.end+' UTC; frequency Weeks; displayed '+d.displayValue+' (provider display precision). Apple native definition: (Total Downloads + pre-orders) / unique-device impressions. Total Downloads includes first downloads and redownloads. Not Product Page Views, not a daily-rate average, and not comparable to Play listing conversion. Observed '+d.observedAt+'.'});
}
export function appleConsoleDaily(d,app,week){
 if(d.app!==app.key||d.appleId!==app.iosAppleId||d.week!==week.start||d.metric!=='Product Page Views'||d.sourceTimezone!=='UTC')return null;
 const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],values=new Map();
 for(const row of d.rows||[]){const m=row.match(/^(\w{3}) (\d{1,2}), (\d{4})\s*([\d,]+)$/);if(!m)return null;const date=m[3]+'-'+String(months.indexOf(m[1])+1).padStart(2,'0')+'-'+m[2].padStart(2,'0');if(date<week.start||date>week.end||values.has(date))return null;values.set(date,Number(m[4].replaceAll(',','')));}
 return values.size?{days:[...values.keys()].sort(),values:Object.fromEntries(values),total:[...values.values()].reduce((a,b)=>a+b,0)}:null;
}
// Play's official CSV uses "Package name" and listing exports use
// "Country / region". Accept those exact aliases without weakening identity
// or duplicate-partition checks. Conflicting aliases are never guessed.
export function playExportPartition(data,app,week){
 const field=(r,keys)=>{const values=[...new Set(keys.filter(k=>Object.hasOwn(r,k)).map(k=>r[k]))];return values.length===1?values[0]:null;};
 const selected=data.filter(r=>r.Date>=week.start&&r.Date<=week.end);
 const dates=[...new Set(selected.map(r=>r.Date))].sort(),seen=new Set();let duplicate=false;
 const identityMatches=selected.length>0&&selected.every(r=>field(r,['Package name','Package Name'])===app.androidPackage&&field(r,['Country','Country / region'])!==null);
 for(const r of selected){const key=JSON.stringify([r.Date,field(r,['Package name','Package Name']),field(r,['Country','Country / region'])]);if(seen.has(key))duplicate=true;seen.add(key);}
 return {selected,dates,duplicate,identityMatches,last:[...new Set(data.map(r=>r.Date))].sort().at(-1),complete:dates.length===7&&Array.from({length:7},(_,i)=>addDays(week.start,i)).every(d=>dates.includes(d))};
}
export async function collectPlay(config,week,{metrics=null,readExport=null}={}){
 const rows=[];
 for(const app of config.apps){const url='https://play.google.com/store/apps/details?id='+app.androidPackage;
  for(const kind of ['downloads','listing'].filter(k=>!metrics||(k==='downloads'?metrics.includes('Store Downloads'):metrics.some(m=>['Product Page Views','Store CVR'].includes(m))))){let data=[],errors=[],accounts=[],references=[];
   for(const account of config.playAccounts.filter(a=>!app.playAccountKeys||app.playAccountKeys.includes(a.key))){try{
    if(readExport){data.push(...await readExport(account,app,week,kind));accounts.push(account.label);continue;}
    const sa=account.keychainService?JSON.parse(Buffer.from(keychain(account.keychainService),'base64').toString('utf8')):readGoogleServiceAccount({});
    const token=await googleAccessToken(sa);const bucket=account.bucket||process.env[account.bucketEnv];if(!bucket)throw new Error();
    const months=[...new Set([week.start.slice(0,7),week.end.slice(0,7)])].map(s=>s.replace('-',''));
    for(const month of months){const object=kind==='downloads'?`stats/installs/installs_${app.androidPackage}_${month}_country.csv`:`stats/store_performance/store_performance_${app.androidPackage}_${month}_country.csv`;
     references.push('gs://'+bucket+'/'+object);
     const buffer=await request(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(object)}?alt=media`,{headers:{Authorization:'Bearer '+token},binary:true});
     data.push(...parseDelimited(decompressMaybe(buffer),',').map(r=>({...r,_account:account.label})));accounts.push(account.label);
    }
   }catch(e){errors.push(account.label+': '+safeError(e));}}
   const {selected,dates,last,complete,duplicate,identityMatches}=playExportPartition(data,app,week);
   const base={source:'Google Play GCS '+(kind==='downloads'?'stats/installs':'stats/store_performance'),sourceAccount:[...new Set(accounts)].join('; '),sourceUrl:url,sourceTimezone:'provider-calendar-unverified',complete:complete&&!errors.length&&!duplicate&&identityMatches,coverage:{dates,observedDays:dates.length,expectedDays:7},notes:[...(app.playOwnershipVerified===false?['Current Play ownership/export mapping is unverified; legacy zero/stale export withheld']:[]),...errors,...(!complete?['Incomplete export; latest '+(last||'unavailable')]:[]),...(selected.length&&!identityMatches?['Export package/dimension identity mismatch; blocked']:[]),...(duplicate?['Overlapping account slices; blocked']:[]),'Day-only source calendar; Istanbul rebucketing not proven.'].join('; ')};
   const total=column=>selected.length&&selected.every(r=>numeric(r[column])!==null)?selected.reduce((s,r)=>s+numeric(r[column]),0):null;
   const usable=app.playOwnershipVerified===true&&base.complete;
   const evidence=(columns)=>({v:1,kind:columns.length===2?'ratio':'sum',dates:Object.fromEntries(dates.map(day=>[day,Object.fromEntries(columns.map(([key,col])=>[key,selected.filter(r=>r.Date===day).every(r=>numeric(r[col])!==null)?selected.filter(r=>r.Date===day).reduce((sum,r)=>sum+numeric(r[col]),0):null]))])),references,partitionHash:fingerprint(selected)});
   if(kind==='downloads'){const v=usable?total('Daily Device Installs'):null;rows.push(metric(week,app,'Store Downloads','Android',{...base,sourceEvidence:evidence([['value','Daily Device Installs']]),unit:'new device acquisitions',definition:'google_daily_device_installs_v1',value:v,status:v!==null?'EARLY':'WAITING'}));}
   else{const visitors=usable?(total('Store listing visitors')??total('Store Listing visitors')):null;const acquired=usable?(total('Store listing acquisitions')??total('Store Listing acquisitions')):null;
    rows.push(metric(week,app,'Product Page Views','Android',{...base,sourceEvidence:evidence([['value','Store listing visitors']]),definition:'play_listing_visitors_v1',unit:'daily listing visitors (summed)',value:visitors,status:visitors!==null&&!duplicate?'EARLY':'WAITING',notes:base.notes+'; Listing visitors, not iOS page-view events; daily uniques must not be called weekly unique users.'}));
    rows.push(metric(week,app,'Store CVR','Android',{...base,sourceEvidence:evidence([['numerator','Store listing acquisitions'],['denominator','Store listing visitors']]),numerator:acquired,denominator:visitors,definition:'play_listing_acquisition_conversion_v1',unit:'ratio',value:visitors>0&&acquired!==null?acquired/visitors:null,status:visitors>0&&acquired!==null&&!duplicate?'EARLY':'WAITING',notes:base.notes+'; Listing acquisitions / listing visitors from same report; weighted daily-cohort proxy, not all device downloads / visitors.'}));
   }
  }
 }
 for(const app of config.apps.filter(a=>['ozard','easyspell'].includes(a.key))){
  const read=kind=>{try{const d=JSON.parse(fs.readFileSync(`docs/weekly-app-growth/play-${kind}-${app.key}.local.json`));return playConsoleDaily(d,app,week);}catch{return null;}};
  const downloads=read('console'),visitors=read('visitors'),acquisitions=read('acquisitions');
  const replace=(name,value,days,extra={})=>{const row=rows.find(r=>r.app===app.key&&r.platform==='Android'&&r.metric===name);if(!row||row.value!==null||value===null)return;const apiAttempt=row.notes;Object.assign(row,{value,status:'EARLY',complete:days.length===7,coverage:{dates:days,observedDays:days.length,expectedDays:7},source:'Google Play Console / official Statistics table readback',sourceAccount:'Current canonical Play owner; package '+app.androidPackage,sourceUrl:'https://play.google.com/console/u/0/developers/5692533430791809099/app/'+({'ozard':'4975297524628858175','easyspell':'4972895546235541795'}[app.key])+'/statistics',notes:'Measured official Console fallback. Observed days '+days.join(', ')+'. '+(days.length<7?'PARTIAL: '+days.length+'/7 days; absent/suppressed days unknown, not zero; no full-week extrapolation. ':'')+'Current package/account verified in Console. Provider day-only calendar is not exactly rebucketed to Istanbul. Current GCS attempt: '+apiAttempt+'',...extra});};
  if(downloads)replace('Store Downloads',downloads.total,downloads.days,{sourceEvidence:uiEvidence(downloads)});
  if(visitors)replace('Product Page Views',visitors.total,visitors.days,{unit:'daily listing visitors (summed)'});
  const matchedDays=visitors&&acquisitions?visitors.days.filter(d=>acquisitions.days.includes(d)):[];const vSum=matchedDays.reduce((s,d)=>s+visitors.values[d],0),aSum=matchedDays.reduce((s,d)=>s+acquisitions.values[d],0);
  if(vSum>0)replace('Store CVR',aSum/vSum,matchedDays,{sourceEvidence:{v:1,kind:'ratio',dates:Object.fromEntries(matchedDays.map(d=>[d,{numerator:acquisitions.values[d],denominator:visitors.values[d]}])),references:['dated Play Console readback']},numerator:aSum,denominator:vSum,coverage:{dates:matchedDays,numeratorDates:matchedDays,denominatorDates:matchedDays,observedDays:matchedDays.length,expectedDays:7},notes:(matchedDays.length<7?'PARTIAL ':'')+'Play Console Statistics → Legacy store listing performance → All users / daily. Numerator=listing acquisitions (new + returning users with no installed copy on any device); denominator=listing visitors from the same population. This is install conversion, NOT the post-July-2026 Store Listing Performance button-click CTR. Observed days '+matchedDays.join(', ')+': '+aSum+' listing acquisitions / '+vSum+' listing visitors. Daily new + returning users without the app installed; matched acquisition/visitor date sets. This is not all device downloads divided by visitors. '+(matchedDays.length<7?'Remaining days are unreported, not zero; ':'All seven dates observed; ')+'provider calendar unverified.'});
 }
 return metrics?rows.filter(r=>metrics.includes(r.metric)):rows;
}
export function playConsoleDaily(d,app,week){
 if(d.app!==app.key||d.package!==app.androidPackage||d.week!==week.start||!d.observedAt)return null;
 const months=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];const values=new Map();
 for(const row of d.rows||[]){const m=String(row).match(/^\s*(\d{1,2}) (\S+) (\d{4}) Toplamdaki yüzdesi ([\d.]+) %/);if(!m)continue;const month=months.indexOf(m[2])+1;if(!month)continue;const day=m[3]+'-'+String(month).padStart(2,'0')+'-'+m[1].padStart(2,'0');if(day<week.start||day>week.end||values.has(day))return null;values.set(day,Number(m[4].replaceAll('.','')));}
 return values.size?{days:[...values.keys()].sort(),values:Object.fromEntries(values),total:[...values.values()].reduce((a,b)=>a+b,0)}:null;
}

function uiEvidence(daily){return {v:1,kind:"sum",dates:Object.fromEntries(daily.days.map(d=>[d,{value:daily.values[d]}])),references:["dated authenticated Console daily readback"]};}
