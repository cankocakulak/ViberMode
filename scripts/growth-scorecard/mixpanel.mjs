import {prepareProductRelease} from './release-runtime.mjs';
import {annotateCoverage} from './release-validation.mjs';
import {exportUsage} from './usage.mjs';
import {collectOzardRaw} from './mixpanel-raw.mjs';
import {metric,request,safeError,numeric,dateInZone,addDays} from './core.mjs';
export const OZARD_FEATURES=[['Notes','note_opened','properties["note_status"] == "completed"'],['Library','note_opened','properties["source"] == "library" and properties["has_lecture_notes"] == true'],['Quiz','quiz_question_answered',''],['Chat','chat_response_received',''],['Solver','solver_completed',''],['Podcast','podcast_started','']];
export function uniqueBucket(data,week){
 const values=Object.values(data.data?.values||{});if(values.length!==1)throw new Error('Expected one unsegmented series');
 const points=Object.entries(values[0]).sort(([a],[b])=>a.localeCompare(b));
 if(!points.length||numeric(points[0][1])===null)throw new Error('Missing unique bucket');
 // interval=7 returns a start-date aggregate plus zero-filled daily labels.
 // Verified against one bounded month bucket and independently nonzero daily counts.
 if(points.length>1&&(!week||points[0][0]!==week.start||points.length!==7||points.slice(1).some(([d,v])=>d>week.end||numeric(v)!==0)))throw new Error('Unexpected multi-bucket unique response');
 return Number(points[0][1]);
}
export function cleanFilter(app,platform){if(app.mixpanel.releaseValidation){const builds=app.mixpanel.releaseValidation.platforms[platform.toLowerCase()]?.builds||[];return `properties["platform"] == "${platform.toLowerCase()}" and (`+(builds.length?builds.map(b=>`(properties["app_version"] == "${b.version}" and number(properties["build_number"]) == ${Number(b.build)}${b.productionSince?' and properties["time"] >= '+Math.floor(Date.parse(b.productionSince)/1000):''})`).join(" or "):"false")+") ";}const versions=app.mixpanel.versions||[app.mixpanel.minVersion];return `properties["platform"] == "${platform.toLowerCase()}" and (`+versions.map(v=>`properties["app_version"] == "${v}"`).join(' or ')+`) and number(properties["build_number"]) >= ${app.mixpanel.minBuild[platform.toLowerCase()]} `;}
export function matureRetention(data,week,day,now=new Date()){
 const matureUntil=addDays(dateInZone(now),-(day+2)); // Entire birth day + full Nth 24h interval + ingestion day.
 const valid=Object.entries(data).filter(([date,v])=>date>=week.start&&date<=week.end&&date<=matureUntil&&numeric(v.first)!==null&&numeric(v.counts?.[day])!==null);
 const denominator=valid.reduce((s,[,v])=>s+Number(v.first),0);const numerator=valid.reduce((s,[,v])=>s+Number(v.counts[day]),0);
 return {value:denominator>0?numerator/denominator:null,denominator,numerator,notes:'Mature birth dates '+week.start+' to '+(valid.at(-1)?.[0]||'none')+'; n='+denominator+'; returned='+numerator+'; D'+day+' = ['+day*24+','+(day+1)*24+') hours after first open.'};
}
export async function collectMixpanel(config,week){const rows=[];
 for(const app of config.apps.filter(a=>a.mixpanel))await prepareProductRelease(config,app,week);
 for(const app of config.apps.filter(a=>a.mixpanel)){
 const prefix=app.key.toUpperCase().replaceAll('-','_');const user=process.env['MIXPANEL_'+prefix+'_SERVICE_ACCOUNT_USERNAME']||process.env.MIXPANEL_SERVICE_ACCOUNT_USERNAME;const secret=process.env['MIXPANEL_'+prefix+'_SERVICE_ACCOUNT_SECRET']||process.env.MIXPANEL_SERVICE_ACCOUNT_SECRET;
 const get=(endpoint,params)=>request((process.env.MIXPANEL_QUERY_BASE_URL||'https://mixpanel.com')+'/api/query/'+endpoint+'?'+new URLSearchParams({project_id:app.mixpanel.projectId,...params}),{headers:{Authorization:'Basic '+Buffer.from(user+':'+secret).toString('base64')}});
 for(const platform of ['iOS','Android']){
  const privacy=platform==='iOS'&&!app.privacy?.iosUniqueProductAnalytics;
  const base={source:'Mixpanel Query API / segmentation unique interval=7',sourceAccount:app.mixpanel.projectId,sourceUrl:'https://mixpanel.com/project/'+app.mixpanel.projectId+'/app/home',sourceTimezone:app.mixpanel.timezone||'unverified',pillar:'Monetization',definition:'clean_product_v1',notes:'Release-aware validated builds; unique identity clusters, not installs/people. Tester exclusion/public rollout coverage not fully verified; EARLY.'};
  if(privacy){for(const name of ['Unique Paywall Viewers','Paywall Reach','Paywall → Checkout Conversion','Paywall → Client Ack Conversion','D1','D7','Top 3 Features','Bottom 3 Features'])rows.push(metric(week,app,name,platform,{...base,pillar:['D1','D7','Top 3 Features','Bottom 3 Features'].includes(name)?'Retention & Engagement':'Monetization',source:'First-party aggregate analytics',status:'N/A',notes:'EasySpell iOS identity-free aggregate model cannot answer exact unique-user metric. Mixpanel remains off.'}));continue;}
  const clean=cleanFilter(app,platform);
  const count=async(event,extra='')=>{const d=await get('segmentation',{event,from_date:week.start,to_date:week.end,type:'unique',interval:'7',where:clean+(extra?' and ('+extra+')':'')});if(d.legend_size===0&&d.data?.series?.length===7&&Object.keys(d.data?.values||{}).length===0)return 0;return uniqueBucket(d,week);};
  const pending=name=>metric(week,app,name,platform,{...base,unit:'ratio',notes:name==='Paywall Reach'?'Need ordered first-open/install cohort → paywall within 7 days; never divide this week all viewers by downloads.':'Need ordered same-user/paywall_view_id funnel. Independent unique counts do not establish conversion.'});
  for(const name of ['Paywall Reach','Paywall → Checkout Conversion','Paywall → Client Ack Conversion'])rows.push(pending(name));
  try{if(!user||!secret)throw new Error();const value=await count('paywall_viewed',app.key==='easyspell'?'properties["paywall_version"] == "v2"':'');rows.push(metric(week,app,'Unique Paywall Viewers',platform,{...base,value: value===0&&!app.mixpanel.cleanSince&&!app.mixpanel.releaseEvidence?null:value,status:value===0&&!app.mixpanel.cleanSince&&!app.mixpanel.releaseEvidence?'WAITING':'EARLY',unit:'unique identity clusters',query:{event:'paywall_viewed',where:clean,interval:7}}));}catch(e){rows.push(metric(week,app,'Unique Paywall Viewers',platform,{...base,notes:safeError(e)}));}
  if(app.key==='ozard'){
   let active=null;try{active=await count('session_started');}catch{}
   const features=[];
   for(const[name,event,condition]of OZARD_FEATURES){try{const n=await count(event,condition);const r=metric(week,app,'Feature Value Reach',platform,{...base,pillar:'Retention & Engagement',segment:name,value:active>0&&n<=active?n/active:null,unit:'ratio',status:active>0&&n<=active?'EARLY':'WAITING',notes:base.notes+`; ${event}${condition?' where '+condition:''}; value users=${n}; active session users=${active}.`,numerator:n,denominator:active});rows.push(r);features.push(r);}catch(e){rows.push(metric(week,app,'Feature Value Reach',platform,{...base,pillar:'Retention & Engagement',segment:name,unit:'ratio',notes:safeError(e)}));}}
   const rankable=features.length===6&&features.every(r=>r.value!==null);
   for(const name of ['Top 3 Features','Bottom 3 Features'])rows.push(metric(week,app,name,platform,{...base,pillar:'Retention & Engagement',unit:'rank list',status:rankable?'EARLY':'WAITING',notes:'Presentation derived from this app/platform/week canonical Feature Value Reach rows. No independent ranking stored here. All six compatible feature values are required.'}));
   for(const day of [1,7]){const rbase={...base,pillar:'Retention & Engagement',unit:'ratio',segment:'clean-first-open-cohort',source:'Mixpanel retention / birth app_first_opened → session_started'};

    try{const d=await get('retention',{from_date:week.start,to_date:week.end,retention_type:'birth',born_event:'app_first_opened',event:'session_started',born_where:clean,where:clean,unit:'day',interval:'1',interval_count:String(day+1),unbounded_retention:'false'});const result=matureRetention(d,week,day);rows.push(metric(week,app,'D'+day,platform,{...rbase,...result,status:'EARLY'}));}catch(e){rows.push(metric(week,app,'D'+day,platform,{...rbase,notes:safeError(e)}));}
   }
  }else{
   try{const active=await count('session_started'),completed=await count('activity_completed','properties["activity_schema_version"] == "activity_v1"');
    const note=base.notes+' Android 1.0.14/build 18 source contract and live activity_v1 verified; prior 1.0.13 remains allowlisted. Project calendar and tester coverage remain limited. ';
    rows.push(metric(week,app,'Weekly Active Users',platform,{...base,pillar:'Retention & Engagement',unit:'unique identity clusters',value:active,status:'EARLY',notes:note+' Unique session_started identities.'}));
    rows.push(metric(week,app,'Core Value Reach',platform,{...base,pillar:'Retention & Engagement',unit:'ratio',value:active>0&&completed<=active?completed/active:null,status:'EARLY',numerator:completed,denominator:active,notes:note+' activity_completed/activity_v1 unique identities / session_started unique identities; '+completed+'/'+active+'; aggregate reach proxy, identity intersection not exported.'}));
    const d=await get('segmentation',{event:'activity_completed',from_date:week.start,to_date:week.end,type:'unique',interval:'7',on:'properties["activity_type"]',where:clean+' and properties["activity_schema_version"] == "activity_v1"'});
    for(const [type,points]of Object.entries(d.data?.values||{})){const n=Number(points[week.start]);if(Number.isFinite(n)&&active>0&&n<=active)rows.push(metric(week,app,'Feature Value Reach',platform,{...base,pillar:'Retention & Engagement',unit:'ratio',segment:type,value:n/active,status:'EARLY',numerator:n,denominator:active,notes:note+' Canonical activity completion family; '+n+'/'+active+'. Only observed activity types; zero/unobserved families not inferred.'}));}
   }catch(e){rows.push(metric(week,app,'Weekly Active Users',platform,{...base,pillar:'Retention & Engagement',notes:safeError(e)}));}
   for(const name of ['D1','D7','Top 3 Features','Bottom 3 Features'])rows.push(metric(week,app,name,platform,{...base,pillar:'Retention & Engagement',unit:name.startsWith('D')?'ratio':'rank list',notes:name.startsWith('D')?'app_opened is cold launch, not install/first-open; canonical birth cohort not proven.':'Observed canonical activity_completed/activity_v1 rows feed the report ranking; only observed families are shown, so full product-wide lowest-feature ranking is not claimed. Project timezone/tester coverage remain EARLY.'}));
  }
 }
 }
 for(const app of config.apps.filter(a=>a.key==='ozard'&&a.mixpanel)){try{const raw=await collectOzardRaw(app,week);for(const r of raw){const i=rows.findIndex(x=>x.id===r.id);if(i>=0)rows[i]=r;else rows.push(r);}for(const platform of ['iOS','Android']){const features=raw.filter(r=>r.platform===platform&&r.metric==='Feature Value Reach');if(features.length===6&&features.every(r=>r.value!==null))for(const r of rows.filter(r=>r.app===app.key&&r.platform===platform&&['Top 3 Features','Bottom 3 Features'].includes(r.metric)))r.status='EARLY';}}catch(e){for(const r of rows.filter(r=>r.app===app.key&&r.value===null))r.notes+=' Raw export: '+safeError(e);}}
 for(const app of config.apps.filter(a=>['ozard','easyspell'].includes(a.key))){try{for(const r of await exportUsage(app,week)){const i=rows.findIndex(x=>x.id===r.id);if(i>=0)rows[i]=r;else rows.push(r);}}catch(e){if(app.key==='easyspell')for(const name of ['Any Core Value Users','No Core Value Users','No Core Value Reach'])rows.push(metric(week,app,name,'Android',{pillar:'Retention & Engagement',unit:name.endsWith('Reach')?'ratio':'unique identity clusters',notes:'Exact active/core identity intersection unavailable: '+safeError(e)+'. Independent aggregate unique counts cannot prove set difference.'}));}}
 return config.apps.filter(a=>a.mixpanel).reduce((result,app)=>annotateCoverage(result,app),rows);
}
