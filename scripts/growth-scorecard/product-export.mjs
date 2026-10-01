import {keychain,addDays,dateInZone} from './core.mjs';
// Raw identities remain transient. Project only reporting fields while streaming;
// large provider payloads (chat bodies, images) never enter retained memory/files.
const FIELDS=['platform','app_version','build_number','time','distinct_id','$insert_id','session_id','paywall_view_id','purchase_attempt_id','note_status','source','has_lecture_notes','screen_name','activity_type','activity_schema_version','mp_country_code','feature','feature_id','is_testflight','is_internal','is_debug','is_sandbox','environment','build_channel','distribution_channel','release_channel'];
// Outside the report week only these events feed retention, completed cohorts,
// and release-contract checks. Keep ALL event names inside the week for no-core
// classification; do not discard unknown weekly activity.
export const FOLLOWUP_EVENTS=['app_first_opened','session_started','onboarding_started','onboarding_completed','paywall_viewed','purchase_started','purchase_completed','note_opened','quiz_question_answered','chat_response_received','solver_completed','podcast_started','activity_completed'];
export function projectionScope(week){return {from:addDays(week.start,-1),through:addDays(week.end||addDays(week.start,6),1)};}
const cache=new WeakMap();
export function projectionWindows(week,now){
 const windows=[],last=dateInZone(now,'UTC');
 const scope=projectionScope(week);
 // Never let a three-day request straddle the full-activity scope boundary:
 // otherwise later follow-up days also fetch every event and exhaust the cap.
 for(let start=addDays(week.start,-8);start<=last;){
  const boundary=start<scope.from?addDays(scope.from,-1):start<=scope.through?scope.through:last;
  const end=[addDays(start,2),boundary,last].sort()[0];windows.push({start,end});start=addDays(end,1);
 }
 return windows;
}
export async function productEvents(app,week,now=new Date()){
 if(cache.has(app))return cache.get(app);
 const promise=read(app,week,now);cache.set(app,promise);return promise;
}
async function read(app,week,now){
 const prefix=app.key.toUpperCase(),user=process.env['MIXPANEL_'+prefix+'_SERVICE_ACCOUNT_USERNAME']||process.env.MIXPANEL_SERVICE_ACCOUNT_USERNAME,secret=process.env['MIXPANEL_'+prefix+'_SERVICE_ACCOUNT_SECRET']||process.env.MIXPANEL_SERVICE_ACCOUNT_SECRET;
 if(user&&secret){try{return await restoreJourneyPrecision(await queryProjection(app,week,now,user,secret),app,week,now);}catch(e){if(![401,403,429].includes(e.status))throw e;}}
 return exportProjection(app,week,now);
}
async function queryProjection(app,week,now,user,secret){
 const platforms=app.key==='easyspell'?['android']:(app.mixpanel.exportPlatforms||['ios','android']);
 // Bound each JSON response below the runtime string limit. Platform/date
 // partitions are disjoint; retain every raw identity/event without aggregation.
 const events=[];
 const platformCounts=new Map();
 for(const platform of platforms)for(const window of projectionWindows(week,now)){
 const scope=projectionScope(week),outside=window.end<scope.from||window.start>scope.through;
 const script=`function main(){return Events({from_date:${JSON.stringify(window.start)},to_date:${JSON.stringify(window.end)}}).filter(function(e){return e.properties.platform===${JSON.stringify(platform)}${outside?' && '+JSON.stringify(FOLLOWUP_EVENTS)+'.indexOf(e.name)!==-1':''};}).map(function(e){var p={distinct_id:e.distinct_id,time:e.time,sampling_factor:e.sampling_factor};${JSON.stringify(FIELDS.filter(k=>!['time','distinct_id'].includes(k)))}.forEach(function(k){if(e.properties[k]!==undefined)p[k]=e.properties[k];});return {event:e.name,properties:p};});}`;
 const r=await fetch((process.env.MIXPANEL_QUERY_BASE_URL||'https://mixpanel.com')+'/api/query/jql?project_id='+app.mixpanel.projectId,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(user+':'+secret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({script}),signal:AbortSignal.timeout(360000)});
 if(!r.ok){await r.body?.cancel();const e=Error('Product projection HTTP '+r.status);e.status=r.status;throw e;}
 const batch=await r.json();if(!Array.isArray(batch))throw Error('Product projection response is not an array');if(batch.some(e=>typeof e.event!=='string'||!Number.isFinite(e.properties?.time)||e.properties.sampling_factor!==1))throw Error('Product projection event shape or sampling invalid');if((platformCounts.get(platform)||0)+batch.length>2000000)throw Error('Product projection per-platform bound exceeded: '+platform+' '+((platformCounts.get(platform)||0)+batch.length));
 platformCounts.set(platform,(platformCounts.get(platform)||0)+batch.length);
 for(const e of batch)events.push(e);
 console.log(JSON.stringify({productProjection:app.key,platform,from:window.start,to:window.end,events:batch.length}));
 }
 app.mixpanel.eventTransport='Mixpanel Query API / JQL raw event field projection; event distinct_id and epoch-millisecond time retained; no groupByUser or identity merge';
 return events;
}
async function exportProjection(app,week,now){
 const legacy=keychain('viberboyz-mixpanel-'+app.key+'-api-secret'),prefix=app.key.toUpperCase(),user=process.env['MIXPANEL_'+prefix+'_SERVICE_ACCOUNT_USERNAME']||process.env.MIXPANEL_SERVICE_ACCOUNT_USERNAME,secret=process.env['MIXPANEL_'+prefix+'_SERVICE_ACCOUNT_SECRET']||process.env.MIXPANEL_SERVICE_ACCOUNT_SECRET;
 if(!legacy&&(!user||!secret))throw Error('Product export credential unavailable');
 const start=Date.parse(week.startAt)-8*86400000,end=+now;
 const events=[],platformCounts=new Map(),platforms=app.key==='easyspell'?['android']:(app.mixpanel.exportPlatforms||['ios','android']);
 const dates=[];for(let d=addDays(week.start,-8);d<=dateInZone(now,'UTC');d=addDays(d,1))dates.push(d);
 const canonical=new Set(['app_first_opened','session_started','onboarding_started','onboarding_completed','paywall_viewed','purchase_started','purchase_completed','note_opened','quiz_question_answered','chat_response_received','solver_completed','podcast_started','activity_completed']);
 for(const day of dates){
 const q=new URLSearchParams({from_date:day,to_date:day,time_in_ms:'true',where:'('+platforms.map(p=>'properties["platform"] == "'+p+'"').join(' or ')+')',...((day<projectionScope(week).from||day>projectionScope(week).through)?{event:JSON.stringify([...canonical])}:{}),...(!legacy?{project_id:app.mixpanel.projectId}:{})});
 const r=await fetch('https://data.mixpanel.com/api/2.0/export?'+q,{headers:{Authorization:'Basic '+Buffer.from(legacy?legacy+':':user+':'+secret).toString('base64')},signal:AbortSignal.timeout(240000)});
 if(!r.ok){await r.body?.cancel();throw Error('Product export HTTP '+r.status);}
 const decoder=new TextDecoder();let buffer='';
 const take=line=>{if(!line.trim())return;const e=JSON.parse(line),p=e.properties;if(p.time<start||p.time>=end||!platforms.includes(p.platform))return;events.push({event:e.event,properties:Object.fromEntries(FIELDS.filter(k=>p[k]!==undefined).map(k=>[k,p[k]]))});platformCounts.set(p.platform,(platformCounts.get(p.platform)||0)+1);if(platformCounts.get(p.platform)>2000000)throw Error('Product export per-platform event limit exceeded');};
 for await(const chunk of r.body){buffer+=decoder.decode(chunk,{stream:true});let i;while((i=buffer.indexOf('\n'))>=0){take(buffer.slice(0,i));buffer=buffer.slice(i+1);}if(buffer.length>50000000)throw Error('Product event exceeds safe bound');}take(buffer);console.log(JSON.stringify({productExport:app.key,day,retainedEvents:events.length}));}
 app.mixpanel.eventTransport='Mixpanel Raw Export streamed daily partitions; raw identity and millisecond timestamps retained; no sampling or identity merge';
 return events;
}
// JQL projects event times to whole seconds. Keep raw millisecond precision for
// ordered funnels and exact-hour retention, and calibrate the projection clock.
const ORDERED=new Set(['app_first_opened','session_started','onboarding_started','onboarding_completed','paywall_viewed','purchase_started','purchase_completed']);
export async function restoreJourneyPrecision(events,app,week,now){
 if(app.key!=='ozard')return events;
 const secret=keychain('viberboyz-mixpanel-'+app.key+'-api-secret');if(!secret)throw Error('Raw timestamp calibration credential unavailable');
 const q=new URLSearchParams({from_date:addDays(week.start,-8),to_date:dateInZone(now,'UTC'),event:JSON.stringify([...ORDERED]),time_in_ms:'true'});
 const r=await fetch('https://data.mixpanel.com/api/2.0/export?'+q,{headers:{Authorization:'Basic '+Buffer.from(secret+':').toString('base64')},signal:AbortSignal.timeout(360000)});if(!r.ok){await r.body?.cancel();throw Error('Raw journey timestamps HTTP '+r.status);}
 const platforms=app.mixpanel.exportPlatforms||['ios','android'],raw=[],decoder=new TextDecoder();let buffer='';const take=line=>{if(!line.trim())return;const e=JSON.parse(line),p=e.properties;if(!platforms.includes(p.platform))return;raw.push({event:e.event,properties:Object.fromEntries(FIELDS.filter(k=>p[k]!==undefined).map(k=>[k,p[k]]))});if(raw.length>1000000)throw Error('Journey export exceeds bound');};for await(const chunk of r.body){buffer+=decoder.decode(chunk,{stream:true});let i;while((i=buffer.indexOf('\n'))>=0){take(buffer.slice(0,i));buffer=buffer.slice(i+1);}}take(buffer);
 return restoreProjectedEvents(events,raw,app,week,now);
}
export function restoreProjectedEvents(events,raw,app,week,now){
 const indexed=new Map();for(const e of raw.filter(e=>e.properties.$insert_id)){const k=e.event+'|'+e.properties.$insert_id;if(!indexed.has(k))indexed.set(k,[]);indexed.get(k).push(e);}
 const offsets=new Map();let matches=0,identityMismatch=0;
 for(const e of events.filter(e=>ORDERED.has(e.event))){const candidates=indexed.get(e.event+'|'+e.properties.$insert_id);if(!candidates)continue;const same=candidates.filter(r=>r.properties.distinct_id===e.properties.distinct_id);matches++;if(!same.length){identityMismatch++;continue;}const other=same.reduce((a,b)=>Math.abs(a.properties.time-e.properties.time)<=Math.abs(b.properties.time-e.properties.time)?a:b);const delta=Math.floor(e.properties.time/1000)*1000-Math.floor(other.properties.time/1000)*1000;offsets.set(delta,(offsets.get(delta)||0)+1);}
 const dominant=[...offsets].sort((a,b)=>b[1]-a[1])[0],offset=dominant?.[0],outliers=matches-(dominant?.[1]||0);
 if(matches<10||identityMismatch||!dominant||outliers/matches>.001)throw Error('JQL/raw identity or clock parity unverified: matches='+matches+', identityMismatch='+identityMismatch+', outliers='+outliers);
 if(Math.abs(offset)>14*3600000||offset%60000)throw Error('JQL/raw clock offset invalid');
 app.mixpanel.eventTransport='Mixpanel JQL safe-field projection + Raw Export precise journey timestamps; '+matches+' matching insert IDs, identity parity verified, projection clock offset '+offset+'ms, raw timestamp outliers restored '+outliers+'; no sampling or identity merge';
 return [...events.filter(e=>!ORDERED.has(e.event)).map(e=>({...e,properties:{...e.properties,time:e.properties.time-offset}})),...raw].filter(e=>e.properties.time>=Date.parse(week.startAt)-8*86400000&&e.properties.time<+now);
}
