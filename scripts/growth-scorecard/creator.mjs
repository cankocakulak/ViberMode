import {metric,request,dateInZone,numeric,safeError,fingerprint} from './core.mjs';
export const briefIdentityFingerprint=brief=>fingerprint([brief.id,brief.title,brief.description,brief.scenario,brief.priority,brief.language,brief.metadata?.categoryId||null]);
export function attributeBrief(brief,categories,config){
 if(!brief)return null;
 const category=categories.find(c=>c.id===brief.metadata?.categoryId);
 const proof=config.verifiedCategories?.[category?.id];
 const links=[...(category?.data?.materials||[]),...(category?.data?.exampleContents||[])];
 const canonical=config.canonicalApps?.find(a=>a.key===proof?.app);
 const identityMatches=!config.canonicalApps||(canonical?.iosAppleId===proof?.appleId&&canonical?.androidPackage===proof?.androidPackage);
 if(identityMatches&&proof?.app&&proof.appleId&&proof.androidPackage&&proof.sourceUrls?.length&&proof.sourceUrls.every(u=>links.includes(u)))return proof.app;
 // Individually audited legacy briefs are pinned to their reviewed content and
 // canonical store identity. A renamed/changed brief must be reviewed again.
 const reviewed=config.verifiedBriefs?.[brief.id];
 const target=config.canonicalApps?.find(a=>a.key===reviewed?.app);
 if(reviewed?.fingerprint===briefIdentityFingerprint(brief)&&reviewed.evidence?.length&&reviewed.sourceUrls?.length&&target?.iosAppleId===reviewed.appleId&&target?.androidPackage===reviewed.androidPackage)return target.key;
 // No runtime fuzzy names, priority aliases or title-only overrides.
 return null;
}
export function creatorRows(config,week,{briefs,categories,submissions,creators,earnings}){
 const rows=[];const unique=new Map(submissions.map(x=>[x.submission.id,x.submission]));
 const posted=[...unique.values()].filter(s=>s.status==='approved'&&s.metadata?.postedAt&&dateInZone(s.metadata.postedAt)>=week.start&&dateInZone(s.metadata.postedAt)<=week.end);
 const mapped=posted.map(s=>({s,key:attributeBrief(briefs.find(b=>b.id===s.brief_id),categories,{...config.creator,canonicalApps:config.apps})}));
 const unmapped=mapped.filter(x=>!x.key).length;
 for(const app of config.apps){const selected=mapped.filter(x=>x.key===app.key);const groups=new Map();let unresolved=0;
  for(const{s}of selected){const e=earnings.find(e=>e.submission_id===s.id);const p=creators.find(c=>c.account?.id===s.creator_id)?.payout_settings;
   const currency=e?.currency||p?.currency;const g=groups.get(currency||'UNKNOWN')||{base:0,final:0,baseCount:0,finalCount:0,count:0,formulas:[],bonusPending:0};g.count++;
   if(e?.status==='payable'&&numeric(e.total_amount)!==null&&e.config_snapshot&&currency){g.final+=Number(e.total_amount);g.finalCount++;}
   else unresolved++;
   const datedTerms=p?.created_at&&p?.updated_at&&Date.parse(p.created_at)<=Date.parse(s.metadata.postedAt)&&Date.parse(p.updated_at)<=Date.parse(s.metadata.postedAt);
   const base=e?numeric(e.base_amount):(datedTerms&&numeric(p?.monthly_content_limit)>0&&numeric(p?.payout_amount)!==null?Number(p.payout_amount)/Number(p.monthly_content_limit):null);
   if(base!==null&&currency){g.base+=base;g.baseCount++;g.formulas.push(e?'snapshotted base '+base:p.payout_amount+'/'+p.monthly_content_limit+' (terms last updated '+p.updated_at.slice(0,10)+')');}
   if(numeric(p?.view_bonus_per_1000)>0&&!e?.config_snapshot)g.bonusPending++;
   groups.set(currency||'UNKNOWN',g);
  }
  const common={source:'Creator Hub / approved posted submissions + earning snapshots',sourceAccount:'Kant Creator Hub — standard',sourceTimezone:'Europe/Istanbul',sourceUrl:'https://github.com/KantAkademi2/kant-ugc-backend/blob/main/src/services/creator-event-service.ts',definition:'ugc_posted_accrual_v1'};
  const only=groups.size===1?[...groups][0]:null;
  const finalized=only&&selected.length>0&&only[1].finalCount===selected.length;
  const covered=unmapped===0;
  const businessComplete=!!finalized&&covered;
  const estimated=only&&selected.length>0&&only[1].baseCount===selected.length;
  const notes=`${selected.length} deterministically attributed approved+posted content; ${unmapped} unmapped deliveries across all apps in this posting week are not attributed to this app. Estimate = sum of dated applicable package payout / content quota, not monthly / 4. ${(only?.[1].formulas||[]).join(' + ')}. ${only?.[1].bonusPending||0} deliveries may accrue additional view bonus; unobserved bonus is excluded, not verified zero. Estimate is base accrued minimum, reconciled to final earnings later. Legacy paymentAmount=0/paid is not expense proof. App cost counted once, no OS allocation. ${selected.flatMap(({s})=>config.creator.deliveryAuditNotes?.[s.id]||[]).join(" ")}`;
  const diagnosticNotes='MAPPED BASE MODEL ONLY — incomplete, not business UGC total. Creator terms/currency need reconciliation: API writes TRY while historical earnings UI formats USD; account admin labels payout per content while dashboard divides payout by monthly quota. Dated records alone do not resolve this semantic conflict. No FX or inferred contractual amount. '+notes;
  rows.push(metric(week,app,'UGC Production Cost','All',{...common,unit:'money',currency:businessComplete?only[0]:null,value:businessComplete?only[1].final:null,status:businessComplete?'READY':'WAITING',complete:businessComplete,attributionComplete:covered,notes:businessComplete?notes:'Business UGC total blocked: '+(!covered?'unmapped current-week deliveries; ':'')+(!finalized?'final payable earnings/bonus and contractual currency not reconciled. ':'')+diagnosticNotes}));
  for(const[name,value,status]of (['ozard','easyspell'].includes(app.key)?[['UGC Estimated Accrued Cost',estimated?only[1].base:null,estimated?'ESTIMATE':'WAITING'],['UGC Finalized Cost',finalized?only[1].final:null,finalized?'READY':'WAITING']]:[]))rows.push(metric(week,app,name,'All',{...common,unit:'money',currency:only?.[0]||null,value,status,notes:name==='UGC Finalized Cost'?notes:diagnosticNotes,complete:name==='UGC Finalized Cost'&&!!finalized}));
  for(const[currency,g]of groups){rows.push(metric(week,app,'UGC Base Cost Estimate','All',{...common,segment:'currency:'+currency,unit:'money',currency:currency==='UNKNOWN'?null:currency,value:g.baseCount===g.count?g.base:null,status:g.baseCount===g.count?'ESTIMATE':'WAITING',complete:false,notes:diagnosticNotes}));}
 }
 return rows;
}
export async function collectCreator(config,week){try{
 const get=ep=>request(config.creator.baseUrl+'/internal/'+ep,{headers:{'x-internal-api-key':process.env.KANT_BACKEND_INTERNAL_API_KEY}});
 const [b,c,s,a,e]=await Promise.all([get('creator-briefs?limit=500'),get('creator-content-categories'),get('creator-accounts/content-submissions?limit=5000&compact=true'),get('creator-accounts?limit=500'),get('creator-events/earnings?limit=5000')]);
 if(!b.success||!c.success||!s.success||!a.success||!e.success||b.briefs.length>=500||s.submissions.length>=5000||a.creators.length>=500||e.earnings.length>=5000)throw new Error('Coverage not proven');
 return creatorRows(config,week,{briefs:b.briefs,categories:c.categories,submissions:s.submissions,creators:a.creators,earnings:e.earnings});
 }catch(e){return config.apps.map(a=>metric(week,a,'UGC Production Cost','All',{source:'Creator Hub',unit:'money',notes:safeError(e)+'; no zero assumed'}));}}
