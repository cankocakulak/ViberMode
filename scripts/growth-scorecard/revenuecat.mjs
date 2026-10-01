import {rcCountryRows} from './country.mjs';
import {metric,keychain,request,safeError,numeric,addDays} from './core.mjs';
export function revenueTotal(chart,measure){
 if(chart.object!=='chart_data'||chart.unsupported_params&&Object.keys(chart.unsupported_params).length)throw new Error('Unsupported chart parameters');
 if(!chart.measures?.some(m=>m.display_name===measure))throw new Error('Measure absent');
 const totals=chart.summary?.total;const value=totals?.[measure]??totals?.Total?.[measure];
 if(numeric(value)===null)throw new Error('Missing total');return {value:Number(value),incomplete:chart.values?.some(v=>v.incomplete===true)||false};
}
export function renewalValue(chart,label){
 if(chart.unsupported_params&&Object.keys(chart.unsupported_params).length)return {value:null,status:'WAITING',notes:'Provider rejected retention filters'};
 const periods=chart.periods||chart.segments||[];
 const index=periods.findIndex(p=>p.display_name===label+' rate'&&p.unit==='%');
 const v=chart.values?.find(v=>v.cohort==='Total'&&v.period===index);
 const n=chart.values?.find(v=>v.cohort==='Total'&&v.period===0);
 if(index<0||!v||numeric(n?.value)===null)return {value:null,status:'WAITING',notes:'Expected period metadata not available'};
 if(n.value===0)return {value:null,status:'N/A',notes:'No subscriptions in this plan/start cohort'};
 if(v.incomplete===true||numeric(v.value)===null||chart.values?.some(x=>x.cohort!=='Total'&&x.period===index&&x.incomplete===true))return {value:null,status:'EARLY',notes:'Renewal cohort not mature; auto-renew preference is not an observed renewal'};
 const absoluteIndex=periods.findIndex(p=>p.display_name===label&&p.unit==='#');
 const numerator=chart.values?.find(x=>x.cohort==='Total'&&x.period===absoluteIndex)?.value;
 return {value:Number(v.value)/100,status:'EARLY',numerator:numeric(numerator),denominator:Number(n.value),notes:'Mature RevenueCat '+label+'; observed renewed='+numerator+'; original subscriptions='+n.value+'; provider-reported cohort rate (not auto-renew preference); UTC cohort, not Istanbul-rebucketed'};
}
export async function collectRevenueCat(config,week){const rows=[];
 for(const app of config.apps.filter(a=>a.revenuecat)){
  const rc=app.revenuecat;const token=keychain('viberboyz-revenuecat-api-key-'+rc.profile);const base='https://api.revenuecat.com/v2/projects/'+rc.projectId;
  const get=ep=>request(base+ep,{headers:{Authorization:'Bearer '+token}});
  let options;try{options=await get('/charts/revenue/options');}catch{}
  for(const platform of ['iOS','Android']){
   const platformKey=platform==='iOS'?'ios':'android';const appId=rc.apps[platformKey];
   const common={pillar:'Monetization',source:'RevenueCat Charts API',sourceAccount:rc.projectId,sourceTimezone:'UTC',sourceUrl:'https://app.revenuecat.com/projects/'+rc.projectId.replace(/^proj/,'')+'/charts/revenue',definition:'rc_charts_v3',notes:'RevenueCat verified production transactions; UTC Monday–Sunday source window (03:00 TRT boundaries). Currency converted by RevenueCat, not local guessed FX.'};
   for(const initial of [false,true]){
    const name=initial?'RevenueCat Verified Initial Purchases':'Verified Revenue';
    try{if(!token||!options?.filters?.find(f=>f.id==='app_id')?.options.some(x=>x.id===appId))throw new Error();
     const filters=[{name:'app_id',values:[appId]}];if(initial)filters.push({name:'transaction_type',values:['New']},{name:'channel',values:['Subscriptions']});
     const params=new URLSearchParams({start_date:week.start,end_date:week.end,resolution:'0',currency:'USD',segment:'country',filters:JSON.stringify(filters)});
     const d=await get('/charts/revenue?'+params);const v=revenueTotal(d,initial?'Transactions':'Revenue');
     rows.push(...rcCountryRows(d,options,week,app,platform,initial,common));
     rows.push(metric(week,app,name,platform,{...common,value:v.value,status:'EARLY',complete:!v.incomplete,unit:initial?'verified new paid transactions':'money',currency:initial?null:'USD',notes:common.notes+(initial?' transaction_type=New; excludes renewals, resubscriptions/product changes; counts paid transactions, not unique people or zero-price trials.':' Gross sales basis, net of refunds/downward adjustments in the reporting period; not proceeds/MRR.')+(v.incomplete?' Latest chart period incomplete.':'')}));
    }catch(e){rows.push(metric(week,app,name,platform,{...common,unit:initial?'verified new paid transactions':'money',notes:safeError(e)}));}
   }
   for(const[duration,name,label]of [['P1W','Subscription W1','Week 1'],['P1M','Subscription M1','Month 1'],['P1Y','Subscription Y1','Year 1']]){
    const commonRetention={...common,pillar:'Retention & Engagement',unit:'ratio',segment:'start-cohort:'+week.start+';plan:'+duration,sourceUrl:'https://app.revenuecat.com/projects/'+rc.projectId.replace(/^proj/,'')+'/charts/subscription_retention'};
    try{const q=new URLSearchParams({start_date:week.start,end_date:week.end,resolution:'0',filters:JSON.stringify([{name:'app_id',values:[appId]},{name:'product_duration',values:[duration]}])});const d=await get('/charts/subscription_retention?'+q);rows.push(metric(week,app,name,platform,{...commonRetention,...renewalValue(d,label)}));}
    catch(e){rows.push(metric(week,app,name,platform,{...commonRetention,notes:safeError(e)}));}
   }
   for(const[duration,name,label,offset]of [['P1W','Subscription W1','Week 1',-7],['P1W','Subscription W2','Week 2',-14],['P1M','Subscription M1','Month 1',-35],['P1M','Subscription M2','Month 2',-70]]){
    const start=addDays(week.start,offset),end=addDays(start,6);
    const commonRetention={...common,pillar:'Retention & Engagement',unit:'ratio',segment:'mature-cohort:'+start+';plan:'+duration,sourceUrl:'https://app.revenuecat.com/projects/'+rc.projectId.replace(/^proj/,'')+'/charts/subscription_retention'};
    try{const q=new URLSearchParams({start_date:start,end_date:end,resolution:'0',filters:JSON.stringify([{name:'app_id',values:[appId]},{name:'product_duration',values:[duration]}])});const d=await get('/charts/subscription_retention?'+q);const result=renewalValue(d,label);rows.push(metric(week,app,name,platform,{...commonRetention,...result,notes:'Mature historical subscription start cohort '+start+'..'+end+' displayed as of reporting week '+week.start+'. '+result.notes}));}
    catch(e){rows.push(metric(week,app,name,platform,{...commonRetention,notes:safeError(e)}));}
   }
  }
 }
 return rows;
}
