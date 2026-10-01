import fs from 'node:fs';
import {metric,addDays} from './core.mjs';
export const isGlobal=r=>(r.country||'GLOBAL')==='GLOBAL';
export const countryCode=v=>/^[A-Z]{2}$/.test(v||'')?v:'UNKNOWN';
export function rcCountryRows(chart,options,week,app,platform,initial,base){
 if(chart.unsupported_params&&Object.keys(chart.unsupported_params).length||chart.segments_limit!==null&&chart.segments_limit!==undefined)return [];
 const measure=initial?'Transactions':'Revenue',total=chart.summary?.total?.Total?.[measure];if(!Number.isFinite(total))return [];
 const codes=new Map((options?.filters?.find(x=>x.id==='country')?.options||[]).map(x=>[x.display_name,countryCode(x.id)]));
 const entries=(chart.segments||[]).filter(s=>!s.is_total).map(s=>[s.display_name,chart.summary?.total?.[s.display_name]?.[measure]]);
 if(!entries.every(([,v])=>Number.isFinite(v))||Math.abs(entries.reduce((s,[,v])=>s+v,0)-total)>.011)return [];
 const grouped=new Map();for(const [label,value]of entries){const code=codes.get(label)||'UNKNOWN';grouped.set(code,(grouped.get(code)||0)+value);}
 return [...grouped].map(([country,value])=>metric(week,app,initial?'RevenueCat Verified Initial Purchases':'Verified Revenue',platform,{...base,country,value,status:'EARLY',unit:initial?'verified new paid transactions':'money',currency:initial?null:'USD',complete:!chart.values?.some(v=>v.incomplete),geoDefinition:'RevenueCat transaction/storefront country; not acquisition-device location',notes:base.notes+' Country breakdown reconciled to the same response global total to $0.01. Country=RevenueCat transaction/storefront country. Missing country is UNKNOWN; no assumed acquisition geography.'}));
}
const PAID=new Set(['googleadwords_int','Facebook Ads','Apple Search Ads','tiktokglobal_int','bytedanceglobal_int']);
export function afCountryRows(geo,daily,week,app,platform,base){
 const group=rows=>{const d={};for(const r of rows){if(!Number.isFinite(Number(r.Installs))||r.Date<week.start||r.Date>week.end)return null;const k=r['Media Source (pid)'];d[k]=(d[k]||0)+Number(r.Installs);}return d;};
 const a=group(geo),b=group(daily);if(!a||!b||[...new Set([...Object.keys(a),...Object.keys(b)])].some(k=>(a[k]||0)!==(b[k]||0)))return [];
 const countries=new Set(geo.map(r=>countryCode(r.Country)));return [...countries].flatMap(country=>{const records=geo.filter(r=>countryCode(r.Country)===country),unknown=records.filter(r=>Number(r.Installs)>0&&!PAID.has(r['Media Source (pid)'])&&r['Media Source (pid)']!=='Organic');const n=records.filter(r=>PAID.has(r['Media Source (pid)'])).reduce((s,r)=>s+Number(r.Installs),0);return [metric(week,app,'AppsFlyer Paid Installs',platform,{...base,country,value:n,status:'EARLY',complete:!unknown.length,geoDefinition:'AppsFlyer install geolocation; UTC UA report',notes:'Country-day UA report reconciles per media source to the canonical partners daily report. '+(unknown.length?'PARTIAL known-paid minimum; custom paid-vs-owned sources unresolved. ':'Complete classified paid sources. ')+'Sparse dates are no-activity only after full-window network reconciliation.'})];});
}
export function storeCountryReadbacks(config,week,globalRows){const out=[];for(const app of config.apps.filter(a=>['ozard','easyspell'].includes(a.key)))for(const kind of ['downloads','cvr','views']){
 try{const d=JSON.parse(fs.readFileSync(`docs/weekly-app-growth/apple-country-${kind}-${app.key}.local.json`));if(d.week!==week.start||d.end!==week.end||d.app!==app.key||d.appleId!==app.iosAppleId||d.sourceTimezone!=='UTC'||!d.observedAt)continue;
 const global=globalRows.find(r=>isGlobal(r)&&r.app===app.key&&r.platform==='iOS'&&r.metric===d.metric);if(!global||global.value===null||global.sourceTimezone!==d.sourceTimezone||Math.abs(global.value-d.globalTotal)>1e-10)continue;
 const entries=Object.entries(d.countries);if(d.metric!=='Store CVR'&&entries.reduce((s,[,v])=>s+v,0)!==global.value)continue;
 for(const[country,value]of entries){if(countryCode(country)!==country||!Number.isFinite(value))continue;out.push(metric(week,app,d.metric,'iOS',{...global,id:undefined,country,value,status:'EARLY',complete:true,source:d.source,geoDefinition:'Apple App Store territory; UTC',coverage:{dates:Array.from({length:7},(_,i)=>addDays(week.start,i)),observedDays:7,expectedDays:7},notes:d.metric==='Store CVR'?'Native weekly App Store Impression → Download Conversion; (Total Downloads + pre-orders) / unique-device impressions, by territory. Provider-rounded weekly rate; numerator and denominator absolute counts not exposed in this readback. Never average territory rates for Rest.':'Official full-week territory table; exact sum reconciles to global '+global.value+'. Absent/suppressed territories are not published as zero. Observed '+d.observedAt+'.'}));}
 }catch{}}
 return out;}
