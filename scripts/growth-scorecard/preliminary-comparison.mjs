// Presentation-only OPEN-to-FINAL comparison; never feeds canonical trends or stored WoW.
import {compatibleTrend,trendEligible,trendSignature} from './reporting-semantics.mjs';
import {addDays} from './core.mjs';
export function compatiblePreliminary(current,previous){
 if(!current||!previous||!['OPEN','RECONCILING'].includes(current.weekStatus))return false;
 // Reuse every observation-quality gate; this temporary candidate is never
 // written or returned as FINAL. The actual previous manifest must be verified.
 return trendEligible({...current,weekStatus:'FINAL',finalizedVerified:true})&&trendEligible(previous)&&addDays(previous.week,7)===current.week&&trendSignature(current)===trendSignature(previous);
}
export function preliminaryRows(allRows,week,app,format){
 const current=allRows.filter(r=>r.week===week.start&&r.appName===app&&r.country==='GLOBAL');
 const prior=allRows.filter(r=>r.week===addDays(week.start,-7)&&r.appName===app&&r.country==='GLOBAL');
 const specs=[['First-time / device downloads','Store Downloads'],['Store Conversion','Store CVR'],['Verified Initial Purchases','RevenueCat Verified Initial Purchases'],['Verified Period Revenue','Verified Revenue'],['Core Value Reach','Core Value Reach'],['D1','D1']];
 const out=[['Metric / platform',week.start+' · '+(current[0]?.weekStatus||'OPEN')+' / preliminary',addDays(week.start,-7)+' · FINAL','Δ']];
 for(const [label,metric] of specs)for(const platform of ['iOS','Android']){
  const a=current.find(r=>r.metric===metric&&r.platform===platform&&r.segment==='all');
  const b=prior.find(r=>r.metric===metric&&r.platform===platform&&r.segment==='all');
  if(!compatiblePreliminary(a,b)&&!compatibleTrend(a,b))continue;
  const delta=a.value-b.value;
  const text=a.unit==='ratio'?(delta>=0?'+':'−')+Math.abs(delta*100).toFixed(1)+'pp':b.value===0?'—':(delta>=0?'+':'−')+Math.abs(delta/b.value*100).toFixed(1)+'%';
  out.push([label+' · '+platform,format(a),format(b),text]);
 }
 if(out.length===1)out.push(['Compatible full-coverage comparisons pending','—','—','—']);
 return out;
}
