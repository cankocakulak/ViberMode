// A readable subtotal of existing components, never a replacement for canonical
// Total Acquisition Spend. Unknown networks are neither zero nor complete.
import {measured} from './app-report-model.mjs';
export function knownMarketing(rows,app){
 const own=rows.filter(r=>r.appName===app&&r.country==='GLOBAL');
 const media=own.filter(r=>r.metric==='Media Ad Spend Component'&&measured(r));
 const selected=[],ambiguous=[];
 for(const network of new Set(media.map(r=>r.segment))){
  const components=media.filter(r=>r.segment===network),all=components.filter(r=>r.platform==='All'),parts=components.filter(r=>r.platform!=='All');
  // An app total and platform components may overlap; do not silently add both.
  if(all.length&&parts.length){ambiguous.push(network);continue;}
  selected.push(...components);
 }
 const finalUgc=own.filter(r=>r.metric==='UGC Production Cost'&&measured(r)&&r.status!=='ESTIMATE'&&r.semantics?.complete===true);
 const ugc=finalUgc.length?finalUgc:own.filter(r=>r.metric==='UGC Estimated Accrued Cost'&&measured(r));
 const values=new Map();
 for(const [kind,components] of [['media',selected],['ugc',ugc]])for(const r of components){
  if(!r.currency||r.value<0)continue;
  const value=values.get(r.currency)||{currency:r.currency,media:0,ugc:0,subtotal:0,hasMedia:false,hasUgc:false};
  value[kind]+=r.value;value.subtotal+=r.value;value[kind==='media'?'hasMedia':'hasUgc']=true;values.set(r.currency,value);
 }
 const missing=[...new Set([...ambiguous,...own.filter(r=>r.metric==='Media Ad Spend Component'&&(!measured(r)||r.semantics?.complete!==true)).map(r=>r.segment)])];
 const apple=own.find(r=>r.metric==='Media Ad Spend Component'&&r.segment==='Apple Ads');
 return {amounts:[...values.values()],ugcEstimated:!finalUgc.length,missing,apple};
}
