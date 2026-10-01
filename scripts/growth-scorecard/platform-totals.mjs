// Display-only platform totals requested by the user. These are not deduplicated
// cross-platform people, canonical All rows, or a source for weekly comparisons.
import {measured,strictOperatingView} from './app-report-model.mjs';
import {OPERATING_EVENTS} from './operating.mjs';
export const totalLabel='Platform-summed · not deduped';
export const totalNote='Platform-summed = iOS + Android platform counts; a person on both platforms may count twice. Rates use summed numerators / denominators, not averages.';
const cutoff=r=>r.notes?.match(/Observation cutoff ([^ ]+)\./)?.[1]||null;
export function platformSum(rows,app,metric,segment){
 const candidates=rows.filter(r=>r.appName===app&&r.country==='GLOBAL'&&r.metric===metric&&(!segment||r.segment===segment)&&measured(r));
 const parts=['iOS','Android'].map(p=>candidates.filter(r=>r.platform===p));
 if(parts.some(p=>p.length!==1))return null;
 const selected=parts.map(p=>p[0]);
 const signature=r=>JSON.stringify([r.week,r.metric,r.segment,r.unit,r.currency,r.calendar,r.source,r.sourceAccount,r.semantics?.definition,r.semantics?.population,r.semantics?.coverage,cutoff(r)]);
 if(selected.some(r=>r.semantics?.complete!==true||!r.calendar||/unverified/i.test(r.calendar)||!r.semantics?.definition||r.semantics?.coverage?.observedDays<7)||signature(selected[0])!==signature(selected[1]))return null;
 const value=selected.reduce((s,r)=>s+r.value,0),n=selected.map(r=>r.semantics.numerator),d=selected.map(r=>r.semantics.denominator);
 const compatibleRatio=selected.every((r,i)=>Number.isInteger(n[i])&&n[i]>=0&&Number.isInteger(d[i])&&d[i]>0&&n[i]<=d[i]&&Math.abs(r.value-n[i]/d[i])<=.000050001);
 const numerator=compatibleRatio?n.reduce((a,b)=>a+b,0):null,denominator=compatibleRatio?d.reduce((a,b)=>a+b,0):null;
 if(selected[0].unit==='ratio'&&!compatibleRatio)return null;
 return {value:selected[0].unit==='ratio'?numerator/denominator:value,numerator,denominator,parts:selected};
}
export function usageTotal(rows,app){
 const names=['Weekly Active Users','Any Core Value Users','Repeat Core Value Users','No Core Value Users'];
 const sums=names.map(m=>platformSum(rows,app,m));
 if(sums.some(s=>!s))return null;
 const [wau,core,repeat,noCore]=sums.map(s=>s.value);
 if(wau<=0||core+noCore!==wau||repeat>core)return null;
 return {wau,core,repeat,noCore,reach:core/wau,repeatRate:core>0?repeat/core:null,noCoreRate:noCore/wau};
}
export function operatingTotal(rows){
 const views=['iOS','Android'].map(p=>strictOperatingView(rows,p));
 if(views.some(v=>!v.valid)||OPERATING_EVENTS.some(e=>!platformSum(rows,'Ozard','Weekly Operating Users',e)))return null;
 const counts=OPERATING_EVENTS.map((_,i)=>views.reduce((s,v)=>s+v.stages[i].count,0));
 return {platform:totalLabel,valid:true,stages:counts.map((count,i)=>({count,step:i&&counts[i-1]>0?count/counts[i-1]:null,cumulative:counts[0]>0?count/counts[0]:null}))};
}
export function mediaPlatformTotals(rows,app,economics){
 const totals=[];
 for(const network of new Set(economics.map(e=>e.network))){
  if(economics.some(e=>e.network===network&&e.platform==='All'))continue;
  const spend=platformSum(rows,app,'Media Ad Spend Component',network),parts=economics.filter(e=>e.network===network&&['iOS','Android'].includes(e.platform));
  if(!spend||parts.length!==2)continue;
  const e=parts[0],matched=parts.every(p=>p.paidInstalls!==null&&(p.networkPaidCpi!==null||p.networkPaidDateProxy!==null)&&p.spendCalendar===e.spendCalendar&&p.installCalendar===e.installCalendar);
  const installs=matched?parts.reduce((s,p)=>s+p.paidInstalls,0):null;
  const aligned=parts.every(p=>p.networkPaidCpi!==null);
  totals.push({...e,platform:'All',spend:spend.value,paidInstalls:installs,networkPaidCpi:aligned&&installs>0?spend.value/installs:null,networkPaidDateProxy:!aligned&&installs>0?spend.value/installs:null});
 }
 return totals;
}
