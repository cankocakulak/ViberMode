import {appCentricBlocks} from './app-report.mjs';
import fs from 'node:fs';
import {diagnosticEconomics,maturePaymentView,alignedAggregate,storeView,paymentView,usageView,featureView,easyAggregateView,withFunnelComparison,stageText,number as funnelNumber,percent} from './funnel-presentation.mjs';
import {readLifecycle,saveLifecycle,finalWeekMatches,weekManifest,pageFingerprint} from './week-lifecycle.mjs';
import {isGlobal} from './country.mjs';
import path from 'node:path';
import {writePrivate,weekWindow,fingerprint,addDays,windowFromStart} from './core.mjs';
import {parseSemantics,compatibleTrend,rollingTrendRows,weeklyReportTitle} from './reporting-semantics.mjs';
const FEATURES=['Chat','Library','Notes','Podcast','Quiz','Solver'];
const textOf=p=>(p?.rich_text||p?.title||[]).map(t=>t.plain_text??t.text?.content??'').join('');
export function warehouseRows(pages,week,lifecycle={weeks:{}}){const state=lifecycle.weeks?.[week],verified=state?.status==='FINAL'&&finalWeekMatches(pages,week,state);return pages.filter(p=>p.properties.Week?.date?.start===week).map(p=>{
 const x=p.properties;return {pageId:p.id,week,weekStatus:verified?'FINAL':state?.status==='FINAL'?'RECONCILING':state?.status||'OPEN',finalizedVerified:!!verified,appName:x.App?.select?.name,metric:textOf(x.Metric),platform:x.Platform?.select?.name,segment:textOf(x.Segment),country:x.Country?.select?.name||'GLOBAL',value:x.Value?.number??null,unit:textOf(x.Unit),currency:textOf(x.Currency),status:x.Status?.select?.name,previous:x['Previous Week']?.number??null,wow:x['WoW Change']?.number??null,notes:textOf(x.Notes).split('\n[Report semantics] ')[0],semantics:parseSemantics(textOf(x.Notes)),sourceAccount:textOf(x['Source Account']),source:textOf(x.Source),calendar:textOf(x.Notes).match(/^Source calendar: ([^.]+)\./)?.[1]||''};
});}
export function featureRanking(rows,appName,platform,bottom=false){
 const candidates=rows.filter(r=>isGlobal(r)&&r.appName===appName&&r.platform===platform&&r.metric==='Feature Value Reach');
 const fallback=rows.find(r=>isGlobal(r)&&r.appName===appName&&r.platform===platform&&r.metric==='Top 3 Features');
 if(!candidates.length&&fallback?.status==='N/A')return 'N/A';
 if(candidates.length!==6||FEATURES.some(f=>candidates.filter(r=>r.segment===f).length!==1)||candidates.some(r=>!['READY','EARLY','ESTIMATE'].includes(r.status)||r.value===null||r.unit!=='ratio'||r.value<0||r.value>1)||new Set(candidates.map(r=>[r.week,r.source,r.calendar].join('|'))).size!==1)return 'WAITING';
 const sorted=[...candidates].sort((a,b)=>(bottom?a.value-b.value:b.value-a.value)||a.segment.localeCompare(b.segment));
 return (candidates.every(r=>r.status==='READY')?'READY':'EARLY')+' · '+sorted.slice(0,3).map(r=>r.segment+' '+(r.value*100).toFixed(1)+'%').join(', ');
}

const ADDITIVE=new Set(['Store Downloads','RevenueCat Verified Initial Purchases','Verified Revenue']);
const available=r=>r&&Number.isFinite(r.value)&&['READY','EARLY','ESTIMATE'].includes(r.status);
const comparable=r=>available(r)&&r.weekStatus==='FINAL'&&r.finalizedVerified===true&&r.comparisonVerified===true&&Number.isFinite(r.previous);
const signature=r=>JSON.stringify([r.week,r.unit,r.currency,r.calendar,r.source,r.sourceAccount]);
const num=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n);
export function formatValue(r,value=r.value){
 if(!Number.isFinite(value))return '—';
 if(r.unit==='ratio')return (value*100).toFixed(r.metric==='Store CVR'?2:1)+'%';
 if(r.currency){try{return new Intl.NumberFormat('en-US',{style:'currency',currency:r.currency,maximumFractionDigits:2,minimumFractionDigits:2}).format(value);}catch{return num(value)+' '+r.currency;}}
 return num(value);
}
function deltaText(r){
 if(!comparable(r))return '';
 const previous='Prev '+formatValue(r,r.previous),delta=r.value-r.previous;
 if(r.unit==='ratio')return previous+' · '+(delta>=0?'+':'−')+Math.abs(delta*100).toFixed(1)+'pp';
 if(r.previous===0||!Number.isFinite(r.wow))return previous;
 return previous+' · '+(r.wow>=0?'+':'−')+Math.abs(r.wow*100).toFixed(1)+'% WoW';
}
export function appKpi(rows,appName,metric,{breakdown=false,platform:onlyPlatform=null}={}){
 const matches=rows.filter(r=>isGlobal(r)&&r.appName===appName&&r.metric===metric&&(!onlyPlatform||r.platform===onlyPlatform));
 const totals=matches.filter(r=>r.platform==='All'&&r.segment==='all');
 const pick=platform=>{const found=matches.filter(r=>r.platform===platform);if(found.length===1)return found[0];const mature=found.filter(r=>r.segment?.startsWith('mature-cohort:')&&available(r));return mature.length===1?mature[0]:found.find(r=>r.segment==='all')||null;};
 const parts=['iOS','Android'].map(pick);const visible=parts.filter(available);
 let row=null,aggregated=false;
 if(totals.length===1){row=totals[0];if(!available(row)||(metric==='UGC Production Cost'&&(row.status==='ESTIMATE'||row.semantics?.complete===false)))return {text:'—',sources:[row],available:false};}
 else if(ADDITIVE.has(metric)&&parts.every(available)&&parts.every(r=>r.calendar&&!/unverified/i.test(r.calendar)&&r.semantics?.complete!==false&&!/(PARTIAL|Latest chart period incomplete|Incomplete export)/i.test(r.notes||''))&&signature(parts[0])===signature(parts[1])){
  const previous=parts.every(comparable)?parts.reduce((s,r)=>s+r.previous,0):null;
  const value=parts.reduce((s,r)=>s+r.value,0);
  row={...parts[0],value,previous,wow:previous!==null&&previous!==0?(value-previous)/Math.abs(previous):null,status:parts.every(r=>r.status==='READY')?'READY':'EARLY'};aggregated=true;
 }else if(!visible.length)return {text:'—',sources:matches,available:false};
 if(row){const change=deltaText(row);const detail=aggregated&&breakdown?parts.map(r=>r.platform+' '+formatValue(r)).join(' · '):'';
  return {text:formatValue(row)+coverageText(row)+(row.status==='ESTIMATE'?'\nESTIMATE · taban tahakkuk':'')+(change?'\n'+change:'')+(detail?'\n'+detail:''),value:row.value,row,sources:aggregated?parts:[row],aggregated,available:true,change};}
 // A partial platform is explicitly labelled, never called an app total. Ratios
 // and unique-user populations are never averaged or added without denominators.
 return {text:visible.map(r=>formatValue(r)+' ('+r.platform+')'+coverageText(r)+(deltaText(r)?' '+deltaText(r):'')).join('\n'),sources:matches,available:true,split:true};
}
export function meetingTable(rows,apps=['Ozard','EasySpell']){
 return [['Pillar','Metric',...apps],...[
  ['Acquisition','Downloads','Store Downloads'],['','Native Store CVR','Store CVR'],['','CPI','CPI'],
  ['Monetization','Paywall → Checkout','Paywall → Checkout Conversion'],['','New Purchases','RevenueCat Verified Initial Purchases'],['','Revenue','Verified Revenue'],
  ['Retention & Usage','Core Value Reach','Core Value Reach'],['','D1','D1'],['',renewalLabel(rows,'Subscription W1'),'Subscription W1']
 ].map(([pillar,label,metric])=>[pillar,label,...apps.map(app=>appKpi(rows,app,metric).text)])];
}
export function acquisitionInsight(rows,app){
 const get=m=>appKpi(rows,app,m);const downloads=get('Store Downloads'),spend=get('Total Acquisition Spend'),cpi=get('CPI');
 if(downloads.change&&spend.change&&cpi.change)return `Downloads ${downloads.change}; acquisition spend ${spend.change}; CPI ${cpi.change}.`;
 if(!cpi.available){const missing=[!get('Media Ad Spend').available?'medya harcaması':null,!get('UGC Production Cost').available?'UGC maliyeti':null,!downloads.available||downloads.sources.some(r=>!available(r)||r.semantics?.complete===false)?'tam indirme kapsamı':null].filter(Boolean);
  return (downloads.available?'Görünen indirmeler: '+downloads.text.replaceAll('\n',' · ')+'. ':'')+(missing.length?missing.join(', ')+' eksik; CPI üzerinden verimlilik yorumu yapılamıyor.':'Uyumlu maliyet ve indirme kapsamı doğrulanmadan CPI yorumu yapılamıyor.');}
 return 'CPI '+cpi.text.replaceAll('\n',' · ')+'. '+(cpi.change?'Haftalık karşılaştırma mevcut.':'Uyumlu önceki hafta verisi olmadığı için trend yorumu yapılmadı.');
}
export function featureLines(rows,app,bottom=false){
 const ranked=['iOS','Android'].map(platform=>{
  const candidates=rows.filter(r=>isGlobal(r)&&r.appName===app&&r.platform===platform&&r.metric==='Feature Value Reach');
  const valid=(app==='Ozard'?candidates.length===6&&FEATURES.every(f=>candidates.filter(r=>r.segment===f).length===1):candidates.length>0)&&candidates.every(r=>available(r)&&r.unit==='ratio'&&r.value>=0&&r.value<=1)&&new Set(candidates.map(signature)).size===1;
  return {platform,rows:valid?[...candidates].sort((a,b)=>(bottom?a.value-b.value:b.value-a.value)||a.segment.localeCompare(b.segment)).slice(0,3):[]};
 }).filter(p=>p.rows.length);
 if(!ranked.length)return [];
 return Array.from({length:Math.min(3,...ranked.map(p=>p.rows.length))},(_,i)=>{
  if(ranked.length===2&&ranked[0].rows[i].segment===ranked[1].rows[i].segment)return ranked[0].rows[i].segment+' — '+ranked.map(p=>p.platform+' '+formatValue(p.rows[i])).join(' · ');
  return ranked.map(p=>p.rows[i].segment+' '+formatValue(p.rows[i])+' ('+p.platform+')').join(' · ');
 });
}
const rich=s=>String(s).split('\n').flatMap((line,i)=>(((i?'\n':'')+line).match(/[\s\S]{1,1800}/g)||['']).map(content=>({type:'text',text:{content},...(i?{annotations:{color:'gray'}}:{})})));
export function compactRich(items){const out=[];for(const item of items){if(!item.text?.content)continue;const last=out.at(-1);if(last&&JSON.stringify(last.annotations||{})===JSON.stringify(item.annotations||{})&&JSON.stringify(last.text.link||null)===JSON.stringify(item.text.link||null))last.text.content+=item.text.content;else out.push(structuredClone(item));}return out;}
const paragraph=s=>({object:'block',type:'paragraph',paragraph:{rich_text:compactRich(rich(s))}});
const label=s=>({object:'block',type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:s},annotations:{bold:true}}]}});
const heading=(s,level=2)=>({object:'block',type:'heading_'+level,['heading_'+level]:{rich_text:rich(s)}});
const item=(s,type='bulleted_list_item')=>({object:'block',type,[type]:{rich_text:rich(s)}});
const table=cells=>({object:'block',type:'table',table:{table_width:cells[0].length,has_column_header:true,has_row_header:true,children:cells.map(row=>({object:'block',type:'table_row',table_row:{cells:row.map(rich)}}))}});
const metricTable=(rows,spec,breakdown=false)=>table([['Metric','Ozard','EasySpell'],...spec.map(([label,metric,platform])=>[label,...['Ozard','EasySpell'].map(app=>appKpi(rows,app,metric,{breakdown,platform}).text)])]);
export function renewalLabel(rows,metric){
 const cohorts=['Ozard','EasySpell'].flatMap(app=>appKpi(rows,app,metric).sources.flatMap(r=>{
  const date=r.segment?.match(/^mature-cohort:(\d{4}-\d{2}-\d{2})(?:;|$)/)?.[1];
  return date?[{app,platform:r.platform,date}]:[];
 }));
 const label=metric.replace('Subscription ','')+' Renewal';
 const dates=[...new Set(cohorts.map(r=>r.date))];
 const display=date=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
 if(dates.length===1)return label+' — '+display(dates[0])+' cohort';
 if(dates.length>1)return label+' — '+cohorts.map(r=>r.app+' '+r.platform+' '+display(r.date)+' cohort').join(' · ');
 return label;
}
const toggle=(title,children)=>({object:'block',type:'toggle',toggle:{rich_text:rich(title),children}});
function qualityNotes(rows){
 const notes=[];const primary=rows.filter(r=>isGlobal(r)&&['Ozard','EasySpell'].includes(r.appName));
 const missingCpi=['Ozard','EasySpell'].filter(a=>!appKpi(rows,a,'CPI').available);
 if(missingCpi.length)notes.push(missingCpi.join(' ve ')+': CPI için tam medya harcaması, kapsamı ve tutarı doğrulanmış UGC maliyeti ve uyumlu indirmeler birlikte gerekli; eksik bileşenler toplam kabul edilmedi.');
 for(const app of ['Ozard','EasySpell']){const partial=primary.filter(r=>r.appName===app&&available(r)&&/PARTIAL/.test(r.notes||'')&&['Store Downloads','Product Page Views','Store CVR'].includes(r.metric));if(partial.length)notes.push(app+' · kısmi mağaza kapsamı: '+partial.map(r=>r.metric+' '+r.platform+' ('+(r.notes.match(/Observed days ([^.]+)/)?.[1]||r.notes.match(/listing cohort ([^:]+)/)?.[1]||'eksik rapor günleri')+')').join('; ')+'.');const cohorts=primary.filter(r=>r.appName===app&&r.metric==='D7'&&available(r));if(cohorts.length)notes.push(app+' D7: '+cohorts.map(r=>r.platform+' '+(r.notes.match(/returned ([\d]+\/[\d]+)/)?.[1]||'olgun alt cohort')).join(' · ')+'; tüm haftanın cohort sonucu değildir.');}
 const downloadGaps=['Ozard','EasySpell'].map(a=>{const k=appKpi(rows,a,'Store Downloads');return !k.available?a+' indirmeleri':k.split?a+' toplam indirmeleri':null;}).filter(Boolean);
 if(downloadGaps.length)notes.push(downloadGaps.join(' ve ')+': tek bir app toplamı için platform kapsamı / sayım tanımı uyumlu değil. Platform etiketiyle gösterilen sayı app toplamı değildir.');
 if(primary.some(r=>/403|access missing|vendor\/report/.test(r.notes||'')))notes.push('Mağaza ve reklam hesabı erişim eksikleri sürüyor; ilgili indirme, mağaza dönüşümü ve harcama sonuçları eksik kalıyor.');
 if(primary.some(r=>['Subscription W1','Subscription M1'].includes(r.metric)&&r.segment==='all'&&r.value===null&&r.status==='EARLY'))notes.push('Bu haftanın yeni abonelerinin W1/M1 gözlem süresi tamamlanmadı; tabloda önceki olgun başlangıç cohort’ları gösteriliyor.');
 if(primary.some(r=>r.appName==='EasySpell'&&r.platform==='iOS'&&r.metric==='D7'&&r.status==='N/A'))notes.push('EasySpell iOS kullanıcı bazlı ürün metrikleri mevcut gizlilik modeli kapsamında hesaplanmıyor; Android kullanım verisi küçük örneklemle gösteriliyor; ilk kurulum cohort’u henüz yok.');
 return notes;
}
export function executiveBlocks(pages,week,databaseId,{snapshot=false,history=[],lifecycle={weeks:{}}}={}){
 const allWeeks=[...new Set(pages.map(p=>p.properties.Week?.date?.start).filter(Boolean))];
 const allRows=allWeeks.flatMap(w=>warehouseRows(pages,w,lifecycle));
 const rows=warehouseRows(pages,week.start,lifecycle).map(r=>{const prev=allRows.find(p=>compatibleTrend(r,p));return prev?{...r,previous:prev.value,wow:prev.value?(r.value-prev.value)/Math.abs(prev.value):null,comparisonVerified:true}:{...r,previous:null,wow:null,comparisonVerified:false};});
 const previous=allRows.filter(r=>r.week===addDays(week.start,-7));
 const evidence=[];for(const app of ['Ozard','EasySpell'])for(const metric of new Set(rows.filter(r=>isGlobal(r)&&r.appName===app).map(r=>r.metric))){const k=appKpi(rows,app,metric);evidence.push({app,metric,display:k.text,aggregation:k.aggregated?'sum of compatible platform values':'canonical row or labelled platforms',sourcePages:k.sources.map(r=>({id:r.pageId,value:r.value,previous:r.previous,status:r.status,unit:r.unit,currency:r.currency,calendar:r.calendar}))});}
 const compare=(builder,...args)=>withFunnelComparison(builder(rows,...args),builder(previous,...args));
 const stores=['iOS','Android'].flatMap(platform=>['Ozard','EasySpell'].map(app=>compare(storeView,app,platform)));
 const payments=['iOS','Android'].map(platform=>compare(paymentView,platform));
 const maturePayments=['iOS','Android'].map(platform=>compare(maturePaymentView,platform));
 const economics=diagnosticEconomics(rows);
 let aggregateProof=null;try{const a=JSON.parse(fs.readFileSync('docs/weekly-app-growth/aggregate-window-audit.local.json'));if(a.week===week.start&&a.sourceRows?.length===5&&a.sourceRows.every(x=>{const row=pages.find(p=>p.id===x.id);return row&&pageFingerprint(row)===x.hash;}))aggregateProof=a;}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}
 const aggregate=alignedAggregate(rows,aggregateProof);
 const usages=['iOS','Android'].map(platform=>compare(usageView,'Ozard',platform));
 const easyUsage=compare(usageView,'EasySpell','Android');
 const easyEvents=withFunnelComparison({points:easyAggregateView(rows)},{points:easyAggregateView(previous)}).points;
 let proof=null;try{const candidate=JSON.parse(fs.readFileSync('docs/weekly-app-growth/funnel-scope-audit.local.json'));if(candidate.week===week.start&&candidate.canonicalHash===weekManifest(pages,week.start).sourceFingerprint)proof=candidate;}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}
 const features=['iOS','Android'].map(platform=>({platform,items:featureView(rows,platform,proof?.platforms?.[platform])}));
 const p=(view,id)=>view.points.find(p=>p.id===id);
 const stage=(view,id,options)=>stageText(p(view,id),options);
 const iosStores=stores.filter(v=>v.platform==='iOS'),androidStores=stores.filter(v=>v.platform==='Android'),showImpressions=iosStores.some(v=>p(v,'impressions').count!==null);
 const money=(value,currency)=>formatValue({value,unit:'money',currency});
 const report=appCentricBlocks({rows,allRows,week,snapshot,history,stores,maturePayments,payments,economics,aggregate,usages,features,easyUsage},{heading,paragraph,label,table,toggle,appKpi,formatValue,coverageText,renewalLabel,countryTable});
 const blocks=report.blocks;
 blocks.push({object:'block',type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:'Weekly App Metrics ↗',link:{url:'https://www.notion.so/'+databaseId}}}]}});
 const trace=v=>({...v,points:v.points.map(({deps,...p})=>({...p,sources:deps.map(r=>r.pageId)}))});
 return {blocks,evidence,executive:report.summary,funnels:{stores:stores.map(trace),payments:payments.map(trace),maturePayments:maturePayments.map(trace),economics,aggregate:{aligned:aggregate.aligned,queriedDays:aggregate.queriedDays,completionEventRatio:aggregate.completionEventRatio,pairedSessions:false,populationIncomplete:true},usage:usages.map(trace),features,easyUsage:trace(easyUsage),easyEvents:easyEvents.map(({deps,...p})=>({...p,sources:deps.map(r=>r.pageId)}))}};
}

// Normalize only rendered fields; Notion adds IDs, timestamps and default styles.
function canonicalRich(items){return (items||[]).map(t=>({text:t.text?.content??t.plain_text??'',link:t.text?.link?.url??null,color:t.annotations?.color||'default',bold:t.annotations?.bold||false}));}
export function canonicalBlock(b){const p=b[b.type];if(!p)throw new Error('Unsupported page block');
 if(b.type==='callout')return {type:b.type,text:canonicalRich(p.rich_text),color:p.color||'default',icon:p.icon?.emoji||null,...(p.children?.length?{children:p.children.map(canonicalBlock)}:{})};
 if(b.type==='table')return {type:b.type,width:p.table_width,columnHeader:p.has_column_header,rowHeader:p.has_row_header,children:(p.children||[]).map(canonicalBlock)};
 if(b.type==='table_row')return {type:b.type,cells:p.cells.map(canonicalRich)};
 return {type:b.type,text:canonicalRich(p.rich_text),...(p.children?.length?{children:p.children.map(canonicalBlock)}:{})};
}
export async function readTree(api,id){const blocks=[];let cursor;do{const d=await api('blocks/'+id+'/children?page_size=100'+(cursor?'&start_cursor='+cursor:''));for(const b of d.results){if(b.has_children)b[b.type].children=await readTree(api,b.id);blocks.push(b);}cursor=d.has_more?d.next_cursor:null;}while(cursor);return blocks;}
async function patchTree(api,old,wanted){let updated=0;
 for(let i=0;i<wanted.length;i++){
  const a=old[i],b=wanted[i];const type=b.type;const {children,...body}=b[type];
  const oldWithout={...a,[type]:{...a[type]}};delete oldWithout[type].children;
  if(JSON.stringify(canonicalBlock(oldWithout))!==JSON.stringify(canonicalBlock({...b,[type]:body}))){await api('blocks/'+a.id,'PATCH',{[type]:body});updated++;}
  if(children)updated+=await patchTree(api,a[type].children,children);
 }return updated;
}
const sameShape=(a,b)=>a.length===b.length&&a.every((x,i)=>x.type===b[i].type&&((!x[x.type].children&&!b[i][b[i].type].children)||sameShape(x[x.type].children||[],b[i][b[i].type].children||[])));
async function directChildren(api,id){const all=[];let cursor;do{const d=await api('blocks/'+id+'/children?page_size=100'+(cursor?'&start_cursor='+cursor:''));all.push(...d.results);cursor=d.has_more?d.next_cursor:null;}while(cursor);return all;}
export function snapshotBlocks(config,pages,start,entry,lifecycle,render=executiveBlocks){
 const week=windowFromStart(start),rows=warehouseRows(pages,start,lifecycle),generated=render(pages,week,config.notion.databaseId,{snapshot:true,lifecycle}),appendix=[];
 for(const app of [...new Set(rows.map(r=>r.appName))]){const appRows=rows.filter(r=>r.appName===app);for(let i=0;i<appRows.length;i+=40)appendix.push(toggle(app+' · kaynak kayıtları '+(i/40+1),[table([['Metric / platform / segment / country','Value','Status','Caveat'],...appRows.slice(i,i+40).map(r=>[r.metric+' · '+r.platform+' · '+r.segment+' · '+(r.country||'GLOBAL'),r.value===null?'—':String(r.value)+(r.currency?' '+r.currency:'')+' '+r.unit,r.status,r.notes||'—'])])]));}
 return [paragraph('Immutable weekly projection · '+start+' · captured '+entry.snapshot.capturedAt+' · source '+entry.sourceFingerprint),paragraph('FINAL · '+(entry.mode==='MANUAL_CORRECTION'?'Explicit manual correction: '+entry.reason+(entry.cutoffException?' · scheduled cutoff exception.':''):'Friday reconciliation completed and canonical read-back verified.')+' Partial/unavailable metrics remain labelled and excluded from comparisons. Later changes require an explicit manual correction.'),...(entry.correctionNote?[paragraph(entry.correctionNote)]:[]),...generated.blocks,...appendix];
}
// Notion accepts only two child levels per append request. Keep nested detail
// toggles intact by creating their shell, then appending their content by ID.
function appendPlan(block){
 const pending=[];
 const depth=b=>b[b.type]?.children?.length?1+Math.max(...b[b.type].children.map(depth)):0;
 function trim(b,level=0,path=[]){
  const body=b[b.type],children=body.children;
  if(level>0&&b.type==='toggle'&&depth(b)+level>2){
   const {children,...shell}=body;pending.push({path,children});return {...b,[b.type]:shell};
  }
  return children?{...b,[b.type]:{...body,children:children.map((c,i)=>trim(c,level+1,[...path,i]))}}:b;
 }
 const shell=trim(block);if(depth(shell)>2)throw Error('Projection nesting exceeds supported append depth');
 return {shell,pending};
}
export async function appendBatches(api,id,blocks){
 const plans=blocks.map(appendPlan);let batch=[];
 async function flush(){
  if(!batch.length)return;
  const result=await api('blocks/'+id+'/children','PATCH',{children:batch.map(p=>p.shell)});
  if(batch.some(p=>p.pending.length)){
   if(result.results?.length!==batch.length)throw Error('Nested projection append returned unexpected block identities');
   for(let i=0;i<batch.length;i++)for(const p of batch[i].pending){
    let parent=result.results[i].id;
    for(const index of p.path){const children=await directChildren(api,parent);if(!children[index])throw Error('Nested projection parent not found');parent=children[index].id;}
    await appendBatches(api,parent,p.children);
   }
  }
  batch=[];
 }
 for(const p of plans){
  if(batch.length&&(batch.length>=50||Buffer.byteLength(JSON.stringify([...batch.map(x=>x.shell),p.shell]))>320000))await flush();
  if(Buffer.byteLength(JSON.stringify(p.shell))>320000)throw Error('One projection block exceeds bounded payload');batch.push(p);
 }
 await flush();
}
export async function ensureWeeklyHistory(config,pages,api,render=executiveBlocks){
 const lifecycle=readLifecycle(config),parent=config.notion.parentPageId,children=await directChildren(api,parent),roots=children.filter(b=>b.type==='child_page'&&b.child_page.title==='Historical Weekly Reports');
 if(roots.length>1)throw Error('Duplicate weekly history folders require reconciliation');
 const latest=weekWindow().start,weeks=[...new Set(pages.map(p=>p.properties.Week?.date?.start).filter(w=>w&&w<=latest&&lifecycle.weeks[w]?.status==='FINAL'))].sort();
 let root=roots[0],created=0;
 if(!root&&weeks.length){root=await api('pages','POST',{parent:{type:'page_id',page_id:parent},properties:{title:{type:'title',title:rich('Historical Weekly Reports')}},children:[paragraph('FINAL haftaların canonical warehouse değerlerinden üretilen arşiv. OPEN / RECONCILING haftalar kilitlenmez.')]});created++;}
 if(!root)return {rootId:null,created:0,reports:[]};
 const existing=await directChildren(api,root.id),history=[];
 for(const start of weeks){
  const entry=lifecycle.weeks[start];if(!finalWeekMatches(pages,start,entry))throw Error('Final canonical week changed; explicit manual correction required: '+start);
  const title=weeklyReportTitle(start),matches=existing.filter(b=>b.type==='child_page'&&b.child_page.title===title);if(matches.length>1)throw Error('Duplicate immutable weekly reports require reconciliation');let page=matches[0];
  if(entry.snapshot?.status==='VERIFIED'){
   if(!page||page.id!==entry.snapshot.pageId)throw Error('Final archive identity missing/changed');
   const actual=await readTree(api,page.id);if(fingerprint(actual.map(canonicalBlock))!==entry.snapshot.contentFingerprint)throw Error('Immutable archive changed; manual correction required');
   const p=await api('pages/'+page.id);if(!p.is_locked)await api('pages/'+page.id,'PATCH',{is_locked:true});
  }else{
   entry.snapshot||={status:'BUILDING',capturedAt:entry.finalizedAt};
   if(page&&entry.snapshot.pageId!==page.id&&!entry.snapshot.replaceAuthorized)throw Error('Legacy archive needs explicit one-time repair');
   if(page&&entry.snapshot.replaceAuthorized&&entry.snapshot.pageId!==page.id)throw Error('Repair page identity mismatch');
   const wanted=snapshotBlocks(config,pages,start,entry,lifecycle,render);
   if(!page){page=await api('pages','POST',{parent:{type:'page_id',page_id:root.id},properties:{title:{type:'title',title:rich(title)}},children:[wanted[0]]});created++;entry.snapshot.pageId=page.id;saveLifecycle(config,lifecycle);}
   const old=await readTree(api,page.id),current=await api('pages/'+page.id);
   if(current.is_locked&&!entry.snapshot.replaceAuthorized)throw Error('Unverified locked archive needs manual correction');
   if(current.is_locked){writePrivate(path.resolve(config.archiveBackupDirectory||'docs/weekly-app-growth',start+'.'+(entry.lateCorrectionId||'pre-repair')+'-archive.local.json'),{page:current,blocks:old});await api('pages/'+page.id,'PATCH',{is_locked:false});}
   if(JSON.stringify(old.map(canonicalBlock))!==JSON.stringify(wanted.map(canonicalBlock))){
    // Only an explicitly authorized repair or an unverified BUILDING archive can
    // enter this branch. A FINAL/VERIFIED archive never does.
    if(old.some(b=>['child_page','child_database','link_to_page'].includes(b.type)))throw Error('Unexpected nested resource in archive');
    for(const b of old)await api('blocks/'+b.id,'DELETE');await appendBatches(api,page.id,wanted);
   }
   const actual=await readTree(api,page.id);if(JSON.stringify(actual.map(canonicalBlock))!==JSON.stringify(wanted.map(canonicalBlock)))throw Error('Final snapshot read-back mismatch');
   await api('pages/'+page.id,'PATCH',{is_locked:true});
   entry.snapshot={...entry.snapshot,status:'VERIFIED',replaceAuthorized:false,contentFingerprint:fingerprint(actual.map(canonicalBlock)),verifiedAt:new Date().toISOString()};saveLifecycle(config,lifecycle);
  }
  history.push({week:start,title,pageId:page.id,url:'https://www.notion.so/'+page.id.replaceAll('-',''),status:'FINAL'});
 }
 return {rootId:root.id,created,reports:history.reverse()};
}
export async function publishMeeting(config,report,pages,api){
 if(report.week.start!==weekWindow().start)return null;
 const id=config.notion.meetingPageId;if(!id)throw new Error('Existing Meeting Scorecard page required');
 const history=await ensureWeeklyHistory(config,pages,api);
 const generated=executiveBlocks(pages,report.week,config.notion.databaseId,{history:history.reports,lifecycle:readLifecycle(config)});const wanted=generated.blocks;
 const old=await readTree(api,id);let updated=0;
 if(JSON.stringify(old.map(canonicalBlock))!==JSON.stringify(wanted.map(canonicalBlock))){
  if(sameShape(old,wanted))updated=await patchTree(api,old,wanted);
  else{
   // Archive only this explicitly authorized report page's former presentation.
   // Keep a private backup; never delete a database or a child page.
   if(old.some(b=>['child_page','child_database','link_to_page'].includes(b.type)))throw new Error('Unexpected embedded resource; preserve page and review');
   writePrivate(path.resolve('docs/weekly-app-growth/meeting-page-backup.local.json'),old);
   await appendBatches(api,id,wanted);updated++;
   for(const b of old){await api('blocks/'+b.id,'DELETE');updated++;}
  }
 }
 const actual=await readTree(api,id);
 if(JSON.stringify(actual.map(canonicalBlock))!==JSON.stringify(wanted.map(canonicalBlock)))throw new Error('Executive report read-back mismatch');
 const result={pageId:id,url:'https://www.notion.so/'+id.replaceAll('-',''),week:report.week.start,updated,executive:generated.executive,evidence:generated.evidence,funnels:generated.funnels,history,contentFingerprint:fingerprint(wanted.map(canonicalBlock))};
 writePrivate(path.resolve('docs/weekly-app-growth/meeting-scorecard.local.json'),result);
 return {url:result.url,rows:4,sections:3,verified:true,updated,historyCreated:history.created,weeklyReports:history.reports.length};
}

export function coverageText(r){const c=r.semantics?.coverage||r.coverage;if(c?.observedDays<7)return ' · PARTIAL '+c.observedDays+'/7 days';if(/PARTIAL/i.test(r.notes||'')){const n=r.notes.match(/(?:PARTIAL:?\s*)(\d)\/7/);return n?' · PARTIAL '+n[1]+'/7 days':' · PARTIAL';}return '';}
function androidCoverageBlock(rows){return toggle('Android store coverage · ayrı tarih pencereleri',[table([['App / metric','Observed dates','Coverage','Matched numerator / denominator'],...['Ozard','EasySpell'].flatMap(app=>['Store Downloads','Product Page Views','Store CVR'].map(metric=>{const r=rows.find(r=>isGlobal(r)&&r.appName===app&&r.platform==='Android'&&r.metric===metric),c=r?.semantics?.coverage;return [app+' · '+metric,(c?.dates||[]).map(d=>d.slice(5)).join(', ')||'—',c?(c.observedDays===7?'7/7 days':'PARTIAL '+c.observedDays+'/7 days'):'—',metric==='Store CVR'&&r?.semantics?.denominator?`${r.semantics.numerator} / ${r.semantics.denominator} · aynı tarihler`:'—'];}))]),paragraph('Downloads yeni cihaz edinme sayısıdır. Listing Visitors günlük unique ziyaretçi toplamıdır. CVR yalnız acquisition ve visitor tarih kesişiminden hesaplanır; device downloads bu oranın payı değildir. Eksik/suppressed günler sıfır kabul edilmez.')]);}
export function countryTable(rows,app,platform='iOS'){
 const countries=rows.filter(r=>r.appName===app&&r.platform===platform&&r.metric==='Store Downloads'&&!isGlobal(r)&&r.country!=='UNKNOWN'&&available(r)&&r.semantics?.complete).sort((a,b)=>b.value-a.value||a.country.localeCompare(b.country));
 if(!countries.length)return null;const top=countries.slice(0,5),codes=new Set(top.map(r=>r.country));
 const metrics=['Store Downloads','Store CVR','AppsFlyer Paid Installs','Media Ad Spend','CPI','RevenueCat Verified Initial Purchases','Verified Revenue'];
 const globalFor=metric=>rows.find(r=>isGlobal(r)&&r.appName===app&&r.platform===platform&&r.metric===metric&&r.segment==='all');
 const get=(metric,country)=>{const found=rows.filter(r=>r.appName===app&&r.platform===platform&&r.metric===metric&&r.country===country&&r.segment==='all');if(found.length!==1||!available(found[0]))return '—';const r=found[0];if(['Media Ad Spend','CPI'].includes(metric)&&r.semantics?.complete!==true)return '—';return formatValue(r)+(r.semantics?.complete===false?' · partial':'');};
 const rest=metric=>{if(['Store CVR','CPI','Media Ad Spend'].includes(metric))return '—';const global=globalFor(metric),parts=rows.filter(r=>!isGlobal(r)&&r.appName===app&&r.platform===platform&&r.metric===metric&&r.segment==='all');if(!available(global)||!parts.length||parts.some(r=>!available(r))||Math.abs(parts.reduce((s,r)=>s+r.value,0)-global.value)>.011)return '—';return formatValue(global,parts.filter(r=>!codes.has(r.country)).reduce((s,r)=>s+r.value,0))+(parts.some(r=>r.semantics?.complete===false)?' · partial':'');};
 const names=new Intl.DisplayNames(['en'],{type:'region'});return [['Country','Downloads','Native Store CVR','Paid Installs','Media Spend','CPI','New Purchases','Revenue'],...top.map(r=>[names.of(r.country),...metrics.map(m=>get(m,r.country))]),['Rest',...metrics.map(rest)]];
}
function countryBlocks(rows){const children=[];for(const app of ['Ozard','EasySpell']){const t=countryTable(rows,app);if(t)children.push(label(app+' · Top 5 by iOS downloads + Rest'),table(t));}
 if(!children.length)return [];children.push(paragraph('Global toplamlar ana tabloda kalır. Bu drilldown iOS / App Store territory esaslıdır; Android ülke indirme kapsamı henüz doğrulanmadığı için platformlar birleştirilmedi. Paid installs=AppsFlyer install konumu (UTC), revenue/purchases=RevenueCat storefront ülkesi. Ülke bazlı tam medya/UGC maliyeti yok; CPI —. Rest oranları ortalama alınmaz; missing ülkeler sıfır değildir.'));
 const google=rows.filter(r=>!isGlobal(r)&&r.segment==='Google Ads'&&r.metric==='Media Ad Spend Component'&&available(r));if(google.length)children.push(table([['Google component · total spend değil','Country','Spend'],...google.map(r=>[r.appName+' '+r.platform,r.country,formatValue(r)])]));
 const usage=rows.filter(r=>!isGlobal(r)&&r.country!=='UNKNOWN'&&r.metric==='Core Value Reach'&&available(r)&&r.semantics?.denominator>=100&&r.semantics?.numerator>=10&&r.semantics.denominator-r.semantics.numerator>=10);if(usage.length)children.push(table([['Country usage · stable session country','WAU','Any Core Value Reach'],...usage.map(r=>[r.appName+' '+r.platform+' '+r.country,String(r.semantics.denominator),formatValue(r)])]));
 children.push(paragraph('Ülke retention/paywall yüzdeleri yayınlanmadı: olgun aynı-ülke cohort ve yeterli örneklem doğrulanmadı. Kullanım oranı gösterme eşiği: ≥100 aktif, ≥10 core ve ≥10 non-core; bilinmeyen/değişen konum dağıtılmaz.'));
 return [toggle('Top Countries · downloads sıralaması',children)];}
function usageExplanation(rows){const data=rows.filter(r=>isGlobal(r)&&r.appName==='Ozard'&&r.metric==='No Core Value Diagnostic Users'&&available(r));const groups=[...new Set(data.map(r=>r.segment))].sort();return toggle('Ozard · No Core Value kullanıcıları ne yapıyor?',[table([['Mutually exclusive group','iOS','Android'],...groups.map(g=>[g,...['iOS','Android'].map(p=>{const r=data.find(r=>r.segment===g&&r.platform===p);return r?formatValue(r):'0';})])]),paragraph('Gruplar her platformun No Core Value toplamını tam olarak böler. “Other known non-core flows” mevcut upload/generation/flashcards/hesap akışlarını içerir; core tanımı değiştirilmedi. Olayı tanınmayan kullanıcılar unclassified kalır. Feature yüzdeleri birbiriyle örtüşebilir; bu gruplar örtüşmez.')]);}
