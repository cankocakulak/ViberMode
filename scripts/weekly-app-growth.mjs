#!/usr/bin/env node
import {readLifecycle} from './growth-scorecard/week-lifecycle.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadEnvFile} from './store-downloads-to-notion.mjs';
import {metric,weekWindow,windowFromStart,addDays,applyPrevious,validateRows,writePrivate,safeError,fingerprint} from './growth-scorecard/core.mjs';
import {appleInventory,collectApple,collectPlay} from './growth-scorecard/stores.mjs';
import {collectRevenueCat} from './growth-scorecard/revenuecat.mjs';
import {collectMixpanel} from './growth-scorecard/mixpanel.mjs';
import {collectCreator} from './growth-scorecard/creator.mjs';
import {collectAds} from './growth-scorecard/ads.mjs';
import {collectAppsFlyer} from './growth-scorecard/appsflyer.mjs';
import {collectFirstParty,collectIOSAggregate} from './growth-scorecard/first-party.mjs';
import {publishNotion} from './growth-scorecard/notion.mjs';
export function derivedRows(config,week,rows){return config.apps.flatMap(a=>{
 const get=(name,platform,segment='all')=>rows.find(r=>(r.country||'GLOBAL')==='GLOBAL'&&r.app===a.key&&r.metric===name&&r.platform===platform&&r.segment===segment);
 const measured=r=>r&&r.value!==null&&['READY','EARLY','ESTIMATE'].includes(r.status);
 const complete=r=>measured(r)&&r.complete!==false;
 const media=get('Media Ad Spend','All'),ugc=get('UGC Production Cost','All');
 const total=complete(media)&&complete(ugc)&&ugc.status!=='ESTIMATE'&&ugc.attributionComplete!==false&&media.currency&&media.currency===ugc.currency?media.value+ugc.value:null;
 const status=total===null?'WAITING':ugc.status==='ESTIMATE'?'ESTIMATE':'EARLY';
 const common={source:'Canonical scorecard / compatible components',unit:'money',definition:'complete_acquisition_cost_v1',complete:total!==null,sourceTimezone:week.timezone,currency:total!==null?media.currency:null,notes:'Requires complete media network coverage and complete attributable UGC in one verified currency. Mapped base minima and unresolved bonuses/terms cannot feed business CPI. No arbitrary FX or OS allocation. Native-calendar limitations remain EARLY; unknown network spend is not zero.'};
 const downloads=['iOS','Android'].map(p=>get('Store Downloads',p));
 const count=downloads.every(complete)?downloads.reduce((s,r)=>s+r.value,0):null;
 const cpi=total!==null&&count>0?total/count:null;
 const out=[metric(week,a,'Total Acquisition Spend','All',{...common,value:total,status}),metric(week,a,'CPI','All',{...common,value:cpi,status:cpi===null?'WAITING':status,unit:'money / store download',notes:'CPI = (complete Media Ad Spend + attributable UGC Production Cost) / Store Downloads. Business blend of first Apple downloads and new Play device acquisitions; both require full seven-day coverage. '+common.notes})];
 for(const final of (['ozard','easyspell'].includes(a.key)?[false,true]:[])){const value=cpi!==null&&(!final||media.status==='READY'&&ugc.status==='READY')?cpi:null;out.push(metric(week,a,final?'CPI — Final':'CPI — Estimated','All',{...common,value,status:value===null?'WAITING':final?'READY':'ESTIMATE',unit:'money / store download'}));}
 for(const p of ['iOS','Android']){
  if(a.key==='ozard')out.push(checkoutAckRow(a,week,rows,p));
  const spend=get('Media Ad Spend',p),installs=get('AppsFlyer Paid Installs',p);const value=complete(spend)&&complete(installs)&&installs.value>0?spend.value/installs.value:null;
  out.push(metric(week,a,'Paid Media CPI',p,{...common,definition:'complete_paid_media_cpi_v1',complete:value!==null,value,status:value!==null?'EARLY':'WAITING',currency:value!==null?spend.currency:null,unit:'money / attributed paid install',notes:'Paid Media CPI = complete Media Ad Spend / AppsFlyer Paid Installs; unknown media coverage blocks full CPI. Network components reported separately.'}));
  const google=get('Media Ad Spend Component',p,'Google Ads'),ginstalls=get('AppsFlyer Paid Installs Component',p,'googleadwords_int');
  if(measured(google)&&measured(ginstalls)&&ginstalls.value>0)out.push(metric(week,a,'Paid Media CPI Component',p,{source:'Google Ads + AppsFlyer canonical component rows',segment:'Google Ads',sourceTimezone:'native Google account vs AppsFlyer UTC',currency:google.currency,unit:'money / attributed paid install',value:google.value/ginstalls.value,status:'EARLY',numerator:google.value,denominator:ginstalls.value,notes:'Google-only period cost / Google attributed installs; '+google.value+'/'+ginstalls.value+'. Same app/platform and calendar date labels; native timezone boundaries and attribution lag differ. This is a diagnostic period ratio, not total paid CPI or install-cohort cost.'}));
  const purchases=get('RevenueCat Verified Initial Purchases',p),download=get('Store Downloads',p);const rate=complete(purchases)&&complete(download)&&purchases.sourceTimezone===download.sourceTimezone&&purchases.week===download.week&&download.value>0?purchases.value/download.value:null;
  if(['ozard','easyspell'].includes(a.key))out.push(metric(week,a,'Purchase Rate / Store Download',p,{source:'RevenueCat + canonical Store Downloads',pillar:'Monetization',value:rate,status:rate===null?'WAITING':'EARLY',unit:'ratio',notes:rate===null?'Requires real verified initial purchases and complete seven-day same-platform downloads; partial download days cannot be the denominator.':'Weekly initial purchase transactions / first store downloads; '+purchases.value+'/'+download.value+'. Period proxy, not a same-user acquisition cohort funnel. Source calendars: RevenueCat UTC and store '+download.sourceTimezone+'; differing midnight boundaries remain a limitation.'}));
 }
 return out;
});}
export function checkoutAckRow(app,week,rows,platform){
 const find=name=>rows.find(r=>(r.country||'GLOBAL')==='GLOBAL'&&r.app===app.key&&r.week===week.start&&r.platform===platform&&r.segment==='all'&&r.metric===name);
 const checkout=find('Paywall → Checkout Conversion'),ack=find('Paywall → Client Ack Conversion');
 const cutoff=r=>r?.notes?.match(/Observation cutoff ([^.]+\.\d+Z)/)?.[1];
 const valid=checkout&&ack&&[checkout,ack].every(r=>r.value!==null&&r.definition==='clean_product_v1'&&r.source.includes('canonical events')&&Number.isInteger(r.numerator)&&r.numerator>=0&&Number.isInteger(r.denominator)&&r.denominator>0)&&checkout.denominator===ack.denominator&&checkout.source===ack.source&&checkout.population===ack.population&&checkout.window?.startAt===ack.window?.startAt&&checkout.window?.endAt===ack.window?.endAt&&checkout.sourceAccount===ack.sourceAccount&&checkout.sourceTimezone===ack.sourceTimezone&&cutoff(checkout)&&cutoff(checkout)===cutoff(ack)&&ack.numerator<=checkout.numerator&&checkout.numerator>0;
 return metric(week,app,'Checkout → Client Ack Conversion',platform,{pillar:'Monetization',source:'Canonical ordered Mixpanel journey counts',sourceAccount:checkout?.sourceAccount||'',sourceTimezone:checkout?.sourceTimezone||week.timezone,unit:'ratio',definition:'ordered_checkout_ack_v1',releaseValidation:checkout?.releaseValidation,population:checkout?.population,value:valid?ack.numerator/checkout.numerator:null,status:valid?'EARLY':'WAITING',complete:!!valid,numerator:valid?ack.numerator:null,denominator:valid?checkout.numerator:null,notes:valid?`Existing ordered same-identity/paywall_view_id journey: ${ack.numerator}/${checkout.numerator} distinct checkout users reached client acknowledgement. Same ${checkout.denominator} weekly paywall viewers and observation cutoff ${cutoff(checkout)}. Purchase attempts agree where available. In-week observed funnel; late acknowledgements excluded. Client ack is not RevenueCat verified purchase.`:'Requires compatible ordered canonical checkout and acknowledgement counts, same viewer population/window/cutoff; no division of rounded displayed rates.'});
}
export async function main(argv=process.argv.slice(2)){
 const args={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--'))throw new Error('Expected named option');const key=argv[i].slice(2);args[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}
 const configPath=path.resolve(args.config||'.growth-scorecard.local.json');const config=JSON.parse(fs.readFileSync(configPath));config._configPath=configPath;for(const file of config.envFiles||[])loadEnvFile(file);
 const lock=configPath+'.lock';let fd;try{fd=fs.openSync(lock,'wx',0o600);}catch{throw new Error('Scorecard is already running or stale lock needs review');}
 try{fs.writeSync(fd,String(process.pid));let report;
 if(args.replay)report=JSON.parse(fs.readFileSync(path.resolve(args.replay)));
 else{const week=args.week?windowFromStart(args.week):weekWindow();if(week.start>weekWindow().start)throw new Error('Only completed weeks are allowed');
 const priorSnapshotPath=path.resolve('docs/weekly-app-growth/'+week.start+'.local.json');if(readLifecycle(config).weeks[week.start]?.status==='FINAL'){console.log(JSON.stringify({week:week.start,status:'FINAL',skippedCollectors:true}));const frozen=fs.existsSync(priorSnapshotPath)?JSON.parse(fs.readFileSync(priorSnapshotPath)):{week,rows:[]};if(args.publish)await publishNotion(config,frozen);return frozen;}const collectionStartedAt=new Date().toISOString();const snapshot=args['reuse-product']&&fs.existsSync(priorSnapshotPath)?JSON.parse(fs.readFileSync(priorSnapshotPath)):null;
 const inventory=await appleInventory(config);const jobs=[['Apple',()=>collectApple(config,week,inventory)],['Google Play',()=>collectPlay(config,week)],['RevenueCat',()=>collectRevenueCat(config,week)],['Mixpanel',()=>snapshot?snapshot.rows.filter(r=>r.collector==='Mixpanel'||r.source.startsWith('Mixpanel')||r.source==='First-party aggregate analytics'):collectMixpanel(config,week)],['Creator Hub',()=>collectCreator(config,week)],['Ad cost',()=>collectAds(config,week)],['AppsFlyer',()=>collectAppsFlyer(config,week)],['First-party',async()=>{const rows=await collectFirstParty(config,week);try{rows.push(...await collectIOSAggregate(config,week));}catch{}return rows;}]];
 const out=await Promise.allSettled(jobs.map(async([name,run])=>{const result=await run();console.log(JSON.stringify({provider:name,rows:result.length,available:result.filter(r=>r.value!==null).length}));return result.map(r=>({...r,collector:name}));}));
 let rows=out.flatMap((o,i)=>o.status==='fulfilled'?o.value:config.apps.map(a=>metric(week,a,'Provider Coverage','All',{segment:jobs[i][0],source:jobs[i][0],notes:safeError(o.reason)})));
 rows.push(...derivedRows(config,week,rows));const previousPath=path.resolve('docs/weekly-app-growth/'+addDays(week.start,-7)+'.local.json');const previous=fs.existsSync(previousPath)?JSON.parse(fs.readFileSync(previousPath)).rows:[];rows=applyPrevious(rows,previous);validateRows(rows);
 report={version:1,generatedAt:new Date().toISOString(),reconciliation:{mode:snapshot?'cached-product':'collection',startedAt:collectionStartedAt,completedAt:new Date().toISOString(),collectors:out.map((o,i)=>({name:jobs[i][0],ok:o.status==='fulfilled',rowCount:o.status==='fulfilled'?o.value.length:0}))},week,registryFingerprint:fingerprint(config.apps),ownership:inventory.map(({token,salesToken,analyticsToken,...a})=>a),rows};
 const file=path.resolve(args.output||'docs/weekly-app-growth/'+week.start+'.local.json');writePrivate(file,report);console.log(JSON.stringify({report:file,rows:rows.length,statuses:rows.reduce((s,r)=>(s[r.status]=(s[r.status]||0)+1,s),{})}));}
 // Old backfill/replay snapshots may contain former handwritten rank summaries.
 report.rows=report.rows.map(r=>['Top 3 Features','Bottom 3 Features'].includes(r.metric)&&r.status==='EARLY'?{...r,notes:'Presentation derived from this app/platform/week canonical Feature Value Reach rows. No independent ranking stored here. All six compatible feature values are required.'}:r);
 validateRows(report.rows);if(args.publish){const result=await publishNotion(config,report,{recordRun:!args.replay});writePrivate(path.resolve('docs/weekly-app-growth/'+report.week.start+'.publish.local.json'),result);console.log(JSON.stringify(result));}return report;
 }finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message?.startsWith('Notion HTTP')?e.message:'Scorecard stopped: '+safeError(e));process.exitCode=1;});
