import {readLifecycle,finalWeekMatches,recordReconciliation} from './week-lifecycle.mjs';
import {notionTokenState} from '../store-downloads-to-notion.mjs';
import {validateRows,weekWindow} from './core.mjs';
import {publishMeeting} from './meeting.mjs';
import {notesWithSemantics} from './reporting-semantics.mjs';
export function notionProperties(r,latestWeek){
 const rich=value=>({rich_text:value?(String(value).match(/[\s\S]{1,1900}/g)||[]).map(content=>({type:'text',text:{content}})):[]});
 return {'Metric':{title:[{type:'text',text:{content:r.metric}}]},Week:{date:{start:r.week}},App:{select:{name:r.appName}},Pillar:{select:{name:r.pillar}},Platform:{select:{name:r.platform}},Segment:rich(r.segment),Country:{select:{name:r.country||'GLOBAL'}},Value:{number:r.value},Unit:rich(r.unit),Currency:rich(r.currency),'Previous Week':{number:r.previousWeek},'WoW Change':{number:r.wowChange},Source:rich(r.source),'Source Account':rich(r.sourceAccount),Status:{select:{name:r.status}},Notes:rich(notesWithSemantics(r)),'Report / Source URL':{url:r.sourceUrl},'Row Key':rich(r.id),'Latest Week':{checkbox:r.week===latestWeek}};
}
export function propertiesMatch(actual,expected){return Object.entries(expected).every(([k,v])=>{const o=actual[k];if(v.number!==undefined||'number'in v)return o?.number===v.number;if(v.checkbox!==undefined)return o?.checkbox===v.checkbox;if(v.url!==undefined||'url'in v)return o?.url===v.url;if(v.select)return o?.select?.name===v.select.name;if(v.date)return o?.date?.start===v.date.start;const kind=v.title?'title':'rich_text';return(o?.[kind]||[]).map(t=>t.plain_text??t.text?.content??'').join('')===(v[kind]||[]).map(t=>t.text.content).join('');});}
export function indexExisting(pages){const map=new Map();for(const p of pages){const key=p.properties?.['Row Key']?.rich_text?.map(t=>t.plain_text??t.text?.content??'').join('');if(!key)continue;if(map.has(key))throw new Error('Existing duplicate Row Key; reconciliation required');map.set(key,p);}return map;}
export async function publishNotion(config,report,{recordRun=false}={}){validateRows(report.rows);const token=notionTokenState({}).token;if(!token)throw new Error('Notion credential unavailable');
 const api=async(endpoint,method='GET',body)=>{for(let attempt=0;attempt<4;attempt++){const r=await fetch('https://api.notion.com/v1/'+endpoint,{method,headers:{Authorization:'Bearer '+token,'Notion-Version':'2025-09-03','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});if(r.status===429){await new Promise(resolve=>setTimeout(resolve,Math.min(30,Number(r.headers.get('retry-after'))||2)*1000));continue;}if(!r.ok){const e=new Error('Notion HTTP '+r.status);e.status=r.status;throw e;}return r.json();}throw new Error('Notion rate limit');};
 const list=async()=>{const pages=[];let cursor;do{const d=await api('data_sources/'+config.notion.dataSourceId+'/query','POST',{page_size:100,...(cursor?{start_cursor:cursor}:{})});pages.push(...d.results);cursor=d.has_more?d.next_cursor:null;}while(cursor);return pages;};
 const lifecycle=readLifecycle(config);if(lifecycle.weeks[report.week.start]?.status==='FINAL'){
  const pages=await list();if(!finalWeekMatches(pages,report.week.start,lifecycle.weeks[report.week.start]))throw Error('Final canonical week changed; explicit correction required');
  const meeting=await publishMeeting(config,report,pages,api);return {created:0,updated:0,unchanged:pages.filter(p=>p.properties.Week?.date?.start===report.week.start).length,finalizedWriteProtected:true,meeting};
 }
 const schema=await api('data_sources/'+config.notion.dataSourceId);if(!schema.properties.Country)await api('data_sources/'+config.notion.dataSourceId,'PATCH',{properties:{Country:{select:{options:[{name:'GLOBAL'},{name:'UNKNOWN'}]}}}});else if(schema.properties.Country.type!=='select')throw Error('Country property type mismatch');
 const pages=await list();const existing=indexExisting(pages);const latest=weekWindow().start;let created=0,updated=0,unchanged=0;
 for(const r of report.rows){const properties=notionProperties(r,latest);const old=existing.get(r.id);
  // Full property replacement clears previously available values when a source fails.
  if(old){const same=propertiesMatch(old.properties,properties);if(same){unchanged++;continue;}await api('pages/'+old.id,'PATCH',{properties});updated++;}
  else{await api('pages','POST',{parent:{type:'data_source_id',data_source_id:config.notion.dataSourceId},properties});created++;}
  if((created+updated)%25===0)console.log(JSON.stringify({notionProgress:created+updated,of:report.rows.length}));
  await new Promise(resolve=>setTimeout(resolve,360));
 }
 for(const p of pages){if(p.properties['Latest Week']?.checkbox&&p.properties.Week?.date?.start!==latest&&lifecycle.weeks[p.properties.Week?.date?.start]?.status!=='FINAL'){await api('pages/'+p.id,'PATCH',{properties:{'Latest Week':{checkbox:false}}});await new Promise(r=>setTimeout(r,360));}}
 // A failed/removed adapter must not leave last-run values looking current.
 const present=new Set(report.rows.map(r=>r.id));
 for(const [key,p]of existing){if(p.properties.Week?.date?.start===report.week.start&&!present.has(key)){
  if(p.properties.Value?.number===null&&p.properties['Previous Week']?.number===null&&p.properties['WoW Change']?.number===null&&p.properties.Status?.select?.name==='WAITING'&&(p.properties.Notes?.rich_text||[]).map(t=>t.plain_text??t.text?.content??'').join('')==='Metric absent from latest collector result; prior value cleared. Check provider coverage and registry changes.')continue;
  await api('pages/'+p.id,'PATCH',{properties:{Value:{number:null},'Previous Week':{number:null},'WoW Change':{number:null},Status:{select:{name:'WAITING'}},Notes:{rich_text:[{type:'text',text:{content:'Metric absent from latest collector result; prior value cleared. Check provider coverage and registry changes.'}}]}}});await new Promise(r=>setTimeout(r,360));
 }}
 const verified=indexExisting(await list());for(const r of report.rows){const p=verified.get(r.id);if(!p||!propertiesMatch(p.properties,notionProperties(r,latest)))throw new Error('Notion read-back mismatch');}
 if(recordRun)recordReconciliation(config,report,[...verified.values()]);
 const meeting=await publishMeeting(config,report,[...verified.values()],api);
 return {created,updated,unchanged,verified:report.rows.length,totalRows:verified.size,databaseUrl:'https://www.notion.so/'+config.notion.databaseId,meeting};
}
