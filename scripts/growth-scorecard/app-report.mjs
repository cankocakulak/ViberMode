import {compactDashboard} from './compact-dashboard.mjs';
import {card,columns,title,smallTitle,caption,divider,reachBar,splitBar,tile,keyValue,barCaption} from './dashboard-visuals.mjs';
import {appleDiscovery,operatingView,strictOperatingView,aggregateMonetization,periodRatio,measured} from './app-report-model.mjs';
import {one,number,percent} from './funnel-presentation.mjs';
import {rollingTrendRows} from './reporting-semantics.mjs';
import {addDays} from './core.mjs';
const events=['First Open','Onboarding Completed','Paywall Viewed','Purchase / Checkout Started','Client Purchase Ack'];
export function appCentricBlocks(model,ui){
 const {rows,allRows,week,snapshot,history,stores,maturePayments,payments,economics,aggregate,usages,features,easyUsage}=model;
 const {heading,paragraph,label,table,toggle,appKpi,formatValue,coverageText,renewalLabel,countryTable}=ui;
 const k=(app,m,options={})=>appKpi(rows,app,m,options).text;
 const money=(v,c)=>formatValue({value:v,unit:'money',currency:c});
 const point=(v,id)=>v.points.find(p=>p.id===id);
 const renewalTitle=(own,metric)=>{const existing=renewalLabel(own,metric);if(existing.includes('cohort'))return existing;const dates=[...new Set(own.filter(r=>r.metric===metric).map(r=>r.segment?.match(/^mature-cohort:(\d{4}-\d{2}-\d{2})/)?.[1]).filter(Boolean))];return existing+(dates.length?' — '+dates.map(d=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'))).join(' / ')+' cohort':' — cohort unavailable');};
 const summary=[['Metric','Ozard','EasySpell'],...[
  ...(rows.some(r=>r.metric==='AppsFlyer Installs')?[['Installs · AppsFlyer ön sonuç','AppsFlyer Installs']]:[]),['Store Downloads','Store Downloads'],['Verified Initial Purchases','RevenueCat Verified Initial Purchases'],['Verified Period Revenue','Verified Revenue'],['Core Value Reach','Core Value Reach']
 ].map(([name,m])=>[name,k('Ozard',m),k('EasySpell',m)+(m==='Core Value Reach'&&one(rows,'EasySpell','Android','Weekly Active Users')?.value<100?' · small Android sample':'')])];
 const blocks=[heading('Executive Summary'),paragraph(`${week.start} — ${week.end} · ${rows[0]?.weekStatus||'OPEN'}`),table(summary)];
 for(const app of ['Ozard','EasySpell']){
  const own=rows.filter(r=>r.appName===app),global=own.filter(r=>r.country==='GLOBAL'),ios=appleDiscovery(rows,app),android=stores.find(v=>v.app===app&&v.platform==='Android');
  const ownEconomics=economics.filter(e=>e.app===app),cvr=one(rows,app,'Android','Store CVR');
  blocks.push(divider(),heading(app,1),heading('Acquisition',3),columns([
   [card('iOS · App Store',[],'blue_background','📱'),caption('Unique Impressions → Total Downloads'),title(ios.linked?`${number(ios.impressions.value)} → ${number(ios.downloads.value)}`:'Pending','blue'),smallTitle(ios.linked?percent(ios.native.value,2)+' Native CVR':'Native CVR · Pending','blue'),caption('Unique Impressions → Total Downloads · Native CVR'),paragraph('First Downloads '+k(app,'Store Downloads',{platform:'iOS'})),paragraph('PPV '+number(ios.views?.value)+' · Unique PPV '+number(ios.uniqueViews?.value)),...(ios.pageProxy!==null?[caption('First Downloads / Product Page Views · period proxy'),paragraph(`${number(ios.first.value)} / ${number(ios.views.value)} ≈ ${percent(ios.pageProxy)}`)]:[])],
   [card('Android · Google Play',[],'green_background','📱'),caption('Listing Visitors → Listing Acquisitions'),title(android?.linked?`${number(point(android,'listing-base').count)} → ${number(point(android,'listing-acquisitions').count)}`:'Pending','green'),smallTitle(android?.linked?percent(point(android,'listing-acquisitions').rate)+coverageText(cvr).replace(' days',''):'Conversion · Pending','green'),divider(),paragraph('Device Downloads '+k(app,'Store Downloads',{platform:'Android'})),caption('Separate device population')]
  ]));
  const estimates=global.filter(r=>r.metric==='UGC Estimated Accrued Cost'&&measured(r));
  const ugc=global.find(r=>r.metric==='UGC Production Cost'&&measured(r));
  const economicBlocks=[
   ...ownEconomics.filter(e=>e.networkPaidDateProxy===null).sort((a,b)=>b.spend-a.spend).map(e=>keyValue(e.network+(e.platform==='All'?'':' · '+e.platform),money(e.spend,e.currency),e.spend===0?'Verified zero':'Known component')),
   ...estimates.map(r=>keyValue('UGC accrued estimate',formatValue(r))),...(ugc?[keyValue('Verified UGC cost',formatValue(ugc))]:[])
  ];
  for(const e of ownEconomics.filter(e=>e.networkPaidCpi!==null))economicBlocks.push(paragraph(`${e.network} · ${e.platform} Network Paid CPI ${money(e.networkPaidCpi,e.currency)} (${money(e.spend,e.currency)} / ${number(e.paidInstalls)} attributed installs)`));
  const dateProxies=ownEconomics.filter(e=>e.networkPaidDateProxy!==null);
  if(dateProxies.length)economicBlocks.push(label('Network spend / attributed install · diagnostic'),...dateProxies.sort((a,b)=>a.platform==='iOS'?-1:1).map(e=>keyValue(e.network.replace(' Ads','')+' '+e.platform,`${money(e.spend,e.currency)} / ${number(e.paidInstalls)} installs → ${money(e.networkPaidDateProxy,e.currency)}`)),caption('provider spend and install calendars are not perfectly aligned'));
  if(app==='Ozard'){
   const meta=ownEconomics.filter(e=>e.network==='Meta');
   if(!meta.length||meta.every(e=>e.paidInstalls===null))economicBlocks.push(paragraph('Meta-attributed installs: unavailable for the verified spend scope\nMeta CPI: pending'));
   else if(meta.every(e=>e.networkPaidCpi===null))economicBlocks.push(paragraph('Meta CPI: pending · denominator scope/calendar not compatible'));
  }
  const floors=ownEconomics.filter(e=>e.knownSpendPerDownload!==null);
  if(floors.length)economicBlocks.push(paragraph(floors.map(e=>`${e.network} · ${e.platform} Known Cost Floor ${money(e.knownSpendPerDownload,e.currency)}\n${e.costFloorFormula} · lower bound; unresolved media networks and UGC excluded.`).join('\n')));
  const missingNetworks=[...new Set(global.filter(r=>r.metric==='Media Ad Spend Component'&&(!measured(r)||r.semantics?.complete!==true)).map(r=>r.segment))];
  economicBlocks.push(paragraph(appKpi(rows,app,'CPI').available?'Full Business CPI: '+k(app,'CPI'):'Full Business CPI: Pending\n'+[...(missingNetworks.length?[missingNetworks.join(', ')+' full spend/account coverage']:[]),...(!appKpi(rows,app,'UGC Production Cost').available?['final UGC earnings, bonuses and currency reconciliation']:[])].join('; ')));
  blocks.push(card('Acquisition Economics',economicBlocks,'gray_background','💰'));
  blocks.push(heading('Monetization',3));
  if(app==='Ozard'){
   const views=['iOS','Android'].map(p=>operatingView(rows,p));
   const strict=['iOS','Android'].map(p=>strictOperatingView(rows,p));
   blocks.push(label('Weekly Operating Funnel · New Users'),columns(strict.map(v=>[
    card(v.platform,[],v.platform==='iOS'?'blue_background':'green_background','📱'),
    ...v.stages.flatMap((stage,i)=>[keyValue(['First Open','Onboarding','Paywall','Checkout','Client Ack'][i],number(stage.count)),barCaption(stage.cumulative,(i?'↓ '+percent(stage.step)+' step · ':'')+percent(stage.cumulative,2)+' from First Open',i>0&&stage.step<.15?'orange':v.platform==='iOS'?'blue':'green')])
   ])),card('Key drop-offs',[
    paragraph('Paywall → Checkout  ·  '+strict.map(v=>v.platform+' '+percent(v.stages[3].step)).join('  /  ')),
    paragraph('Checkout → Ack  ·  '+strict.map(v=>v.platform+' '+percent(v.stages[4].step)).join('  /  '))
   ],'orange_background','↘️'));
   const line=(v,i)=>{const s=v.stages[i];return s.step===null?'—':`${number(s.stepNumerator)} / ${number(s.stepDenominator)} · ${percent(s.step)}`;};
   blocks.push(toggle('Weekly Activity / Pairwise Diagnostics',[paragraph('Primary funnel: same in-week First Open population; every later stage is an ordered subset. All qualifying events occur inside the reporting week. Bars are rounded; labels retain exact counts and conversion rates.'),table([['Independent weekly unique users','iOS','Android'],...events.map((name,i)=>[name,...views.map(v=>number(v.stages[i].count))])]),table([['Transition · matched / prior-stage users','iOS','Android'],...events.slice(1).map((name,j)=>[events[j]+' → '+name,...views.map(v=>line(v,j+1))])]),table([['Event occurrences','iOS','Android'],...events.map((name,i)=>[name,...views.map(v=>number(v.stages[i].events))])]),paragraph('Independent weekly activity includes returning users and can increase between stages. Pairwise rates use each preceding independent stage population; they are not a single-population funnel and must not be multiplied. The primary new-user funnel uses cumulative ordered subsets instead. Sunday events count this week; Monday events count next week. Client Ack is not a verified store purchase. Clean release coverage remains EARLY.') ]));
   const cohort=[];
   for(const v of maturePayments){const reach=one(rows,app,v.platform,'Paywall Reach'),mature=point(v,'first-open').count,pending=Number(reach?.notes?.match(/immature (\d+)/)?.[1]),cutoff=reach?.notes?.match(/Observation cutoff ([^.]+(?:\.\d+)?Z)/)?.[1];
    cohort.push(paragraph(v.platform+' · acquisition '+week.start+'–'+week.end+'\nTotal clean first opens '+number(Number.isFinite(mature)&&Number.isFinite(pending)?mature+pending:null)+' · matured '+number(mature)+' · pending '+number(pending)+'\n'+(v.linked?[mature,point(v,'paywall').count,point(v,'checkout').count,point(v,'ack').count].map(number).join(' → ')+' · First Open → Ack '+percent(point(v,'ack').overall,2):'Pending')+'\n'+(pending>0?'Mature subset only; full acquisition cohort pending.':Number.isFinite(pending)&&mature!==null?'Fully mature cohort.':'Cohort coverage pending.')+(cutoff?' Observation cutoff '+cutoff:'')));
   }
   for(const r of global.filter(r=>r.metric==='7-Day Acquisition Cohort First Opens'&&measured(r)&&r.semantics?.cohort?.pending===0)){const c=r.semantics.cohort;cohort.push(paragraph(r.platform+' · FINAL 7-day result · acquisition '+c.start+'–'+c.end+'\nTotal '+number(c.total)+' · matured '+number(c.mature)+' · pending 0\n'+[c.counts.firstOpen,c.counts.paywallViewed,c.counts.checkoutStarted,c.counts.clientAck].map(number).join(' → ')+' · '+percent(c.total?c.counts.clientAck/c.total:null,2)+' First Open → Ack'));}
   cohort.push(paragraph('First Open → Paywall → Checkout → Client Ack within each user’s next seven days. Only fully elapsed members enter conversion calculations. Once the entire acquisition week matures, its final result is published in the next open reporting week; its earlier FINAL snapshot is not rewritten.'));
   blocks.push(toggle('7-Day Acquisition Cohort Funnel',cohort));
  }else{
   const a=aggregateMonetization(rows);
   blocks.push(card('Aggregate Product Telemetry · Partial',[
    title(number(a.stages[3]?.value)+' Client Acks','orange'),paragraph('Onboarding '+number(a.stages[0]?.value)+' · Paywall '+number(a.stages[1]?.value)),paragraph('Purchase Starts '+number(a.stages[2]?.value)+' · Subscription Starts '+number(a.stages[4]?.value)),
    ...(a.valid?[paragraph('Paywall → Start '+percent(a.checkout)+' · Start → Ack '+percent(a.ack))]:[]),
    caption('Tagged aggregate events · different population from verified transactions')
   ],'orange_background','⚠️'));
  }
  blocks.push(card('RevenueCat · Financial Truth',[
   ...['RevenueCat Verified Initial Purchases','Verified Revenue'].flatMap((m,i)=>{const [value,...detail]=k(app,m,{breakdown:true}).split('\n');return [smallTitle((i?'Verified Period Revenue  ':'Verified Initial Purchases  ')+value,'green'),...(detail.length?[caption(detail.join(' · '))]:[])];})
  ],'green_background','✅'));
  if(app==='EasySpell'){const proxy=periodRatio(one(rows,app,'iOS','RevenueCat Verified Initial Purchases'),ios.first);if(proxy!==null)blocks.push(paragraph('iOS verified purchases / first downloads '+number(one(rows,app,'iOS','RevenueCat Verified Initial Purchases').value)+' / '+number(ios.first.value)+' ≈ '+percent(proxy)+' · period proxy'));}
  blocks.push(heading('Usage',3));
  if(app==='Ozard'){
   for(const v of usages){
    const wau=point(v,'wau'),core=point(v,'core'),repeat=point(v,'repeat'),none=point(v,'no-core');
    blocks.push(label(v.platform),columns([
     tile('WAU',number(wau.count)),tile('Core Users',number(core.count),percent(core.rate)+' of WAU','green'),tile('Repeat Core',number(repeat.count),percent(Number.isFinite(repeat.count)&&core.count>0?repeat.count/core.count:null)+' of Core','blue')
    ]),splitBar(core.rate),caption('Core '+number(core.count)+' · '+percent(core.rate)+'   /   No Core '+number(none.count)+' · '+percent(none.rate)));
   }
   blocks.push(label('Feature Reach'),columns(features.map(f=>[
    card(f.platform,[],f.platform==='iOS'?'blue_background':'green_background','📊'),
    ...[...f.items].sort((a,b)=>b.ofWau-a.ofWau||a.feature.localeCompare(b.feature)).flatMap(item=>[
     paragraph(item.feature+'  '+number(item.users)+' · '+percent(item.ofWau)+' WAU'+(item.ofCore!==null?' · '+percent(item.ofCore)+' Core':'')),reachBar(item.ofWau,f.platform==='iOS'?'blue':'green')
    ])
   ])),caption('Features overlap · % of WAU'));
   const groups=[...new Set(usages.flatMap(v=>v.diagnostics.map(d=>d.label)))];
   blocks.push(toggle('No Core Value · what users did',[table([['Mutually exclusive group','iOS','Android'],...groups.map(g=>[g,...usages.map(v=>{const d=v.diagnostics.find(d=>d.label===g);return d?number(d.count)+' · '+percent(d.rate):'—';})])]) ]));
  }else{
   blocks.push(card('iOS Aggregate Usage',[
    paragraph('App Opens '+number(aggregate.points[3].count)+' · Session Starts '+number(aggregate.points[4].count)),
    caption('Learning Starts → Completions'),title(number(aggregate.points[0].count)+' → '+number(aggregate.points[1].count),'blue'),
    ...(aggregate.completionEventRatio!==null?[smallTitle(percent(aggregate.completionEventRatio)+' aggregate ratio','blue'),reachBar(aggregate.completionEventRatio)]:[]),
    paragraph('Activity Completions '+number(aggregate.points[2].count))
   ],'blue_background','📊'));
   blocks.push(paragraph('Android · WAU '+number(point(easyUsage,'wau').count)+' · Core '+number(point(easyUsage,'core').count)+' ('+percent(point(easyUsage,'core').rate)+') · No Core '+number(point(easyUsage,'no-core').count)+' ('+percent(point(easyUsage,'no-core').rate)+')\nFeature ranking — insufficient sample'));
   blocks.push(label('Observed activity types'));
   const observed=global.filter(r=>r.platform==='Android'&&r.metric==='Observed Activity Completions'&&measured(r));
   if(observed.length)blocks.push(paragraph('Observed activities · '+observed.map(r=>r.segment+' '+number(r.value)).join(' · ')));
   else {const activities=global.filter(r=>r.platform==='Android'&&r.metric==='Feature Value Reach'&&measured(r));if(activities.length)blocks.push(paragraph('Observed activity users · '+activities.map(r=>r.segment+' '+number(r.semantics?.numerator)).join(' · ')));}
  }
  blocks.push(heading('Retention',3),columns(['D1','D7'].map(m=>tile(m,k(app,m),appKpi(rows,app,m).available?'Mature observations':'Pending'))),columns(['W1','M1'].map(p=>tile(renewalTitle(own,'Subscription '+p),k(app,'Subscription '+p)))));
  blocks.push(card('Data Coverage',[
   paragraph('Acquisition  ● '+(['iOS','Android'].every(p=>['Store Downloads','Product Page Views','Store CVR'].every(m=>{const r=one(rows,app,p,m);return measured(r)&&r.semantics?.complete;}))?'Complete':'Partial')+'    ·    Spend  ● '+(appKpi(rows,app,'Media Ad Spend').available?'Complete':'Partial')),
   paragraph('Monetization  ● '+(app==='Ozard'?(['iOS','Android'].every(p=>operatingView(rows,p).valid)?'Complete within tracked clean-build population':'Partial observations'):'Partial telemetry / Financial truth')),
   paragraph('Usage  ● '+(app==='Ozard'?(usages.every(v=>v.linked)?'Complete within tracked clean-build population':'Partial clean-build'):'Aggregate iOS / Small Android sample')+'    ·    Retention  ● Mature / Pending')
  ],'gray_background','📍'));
  const countries=countryTable(rows,app);if(countries)blocks.push(toggle('Top Countries',[table(countries),paragraph('Top 5 by iOS downloads + Rest. Global totals remain primary. Country and provider definitions are not mixed.') ]));
  const details=[paragraph('Aggregate product telemetry covers only the available identity-free tagged event population; RevenueCat covers verified transactions. These are not the same population. Aggregate event ratios are not unique-user funnel conversions. Feature populations overlap and percentages do not sum to 100%. Display bars are rounded visual aids; numeric labels remain authoritative.'),paragraph('Business CPI requires complete media + attributable UGC and a compatible complete store-download denominator. Known components and UGC estimates are not a complete numerator.'),...ownEconomics.filter(e=>e.knownSpendPerDownload===null).map(e=>paragraph(e.network+' · '+e.platform+' floor pending: '+e.blocker)),...ownEconomics.filter(e=>e.networkPaidDateProxy!==null).map(e=>paragraph(e.network+' · '+e.platform+' native-date spend/install proxy '+money(e.networkPaidDateProxy,e.currency)+' = '+money(e.spend,e.currency)+' / '+number(e.paidInstalls)+'. Spend Istanbul; installs UTC. Not aligned Network Paid CPI.')),paragraph('Apple native conversion uses total downloads, including redownloads, over unique-device impressions. First downloads and page-view event counts are separate. The page-view ratio is a period diagnostic, never a linked-user funnel. Unique page views alone do not prove page-attributed downloads.'),paragraph('Play listing = same-date listing acquisitions / visitors from legacy Statistics, users without an installed copy. Device downloads are separate. A compatible non-listing acquisition population was not verified; do not subtract device downloads and listing acquisitions.'),...global.filter(r=>['Store Downloads','Product Page Views','Store CVR'].includes(r.metric)).map(r=>paragraph(r.platform+' · '+(r.metric==='Product Page Views'&&r.platform==='Android'?'Listing Visitors':r.metric)+' · '+r.calendar+' · '+(r.semantics?.coverage?.dates||[week.start+'–'+week.end]).join(', ')+coverageText(r))),paragraph('Retention remains mature-cohort based. Weekly operating activity, seven-day acquisition follow-up and retention have distinct populations. New cohort completion never rewrites an older FINAL report.'),...['W2','M2'].map(p=>paragraph(renewalLabel(own,'Subscription '+p)+' '+k(app,'Subscription '+p)))];
  if(app==='Ozard'){const observedMeta=global.filter(r=>r.metric==='AppsFlyer Paid Installs Component'&&r.segment==='Facebook Ads'&&measured(r));if(observedMeta.length)details.push(paragraph('Observed Meta-attributed installs: '+observedMeta.map(r=>r.platform+' '+number(r.value)+' ('+r.calendar+')').join(' · ')+'. These platform observations do not supply a denominator matching the app-level verified Meta spend, which includes web and uses the spend-provider calendar. Meta CPI remains pending.'));}
  if(app==='Ozard')details.push(paragraph('W37 feature %Core withheld: exact membership did not reconcile to the frozen usage baseline after late arrivals. Future FINAL feature rows preserve aggregate subset/intersection proof from the same in-memory population; raw identities are never stored. Weekly operating readback includes late arrivals available at its stated cutoff and does not replace older frozen usage counts.'));
  else details.push(paragraph('iOS counters query all seven UTC ingestion dates, but cover only app_store-tagged numeric release events. Observed dates and excluded-channel counts remain in each canonical row. This is partial telemetry coverage, not complete user activity. No user identities or Mixpanel; period ratios use the same version/channel/window. RevenueCat remains separate verified financial truth.'));
  const blockers=[...new Set(global.filter(r=>!measured(r)&&/403|credential|permission|token|unmapped/i.test(r.notes||'')).map(r=>r.metric+' · '+r.platform+': '+r.notes))];
  if(blockers.length)details.push(...blockers.slice(0,10).map(s=>paragraph(s.slice(0,1600))));
  blocks.push(toggle('Technical / Data Quality',details));
  if(!snapshot){const weeks=[3,2,1,0].map(i=>addDays(week.start,-7*i)),trends=rollingTrendRows(allRows,week,app,formatValue).filter(r=>r.points.some(Boolean));blocks.push(toggle('4-week trends',[paragraph('Canonical FINAL values only. Incompatible or partial observations are withheld.'),...(trends.length?[table([['Metric',...weeks.map(w=>w.slice(5))],...trends.map(r=>r.cells)])]:[paragraph('Compatible finalized history pending.')]) ]));}
 }
 if(!snapshot&&history.length)blocks.push(toggle('Past Weeks',history.map(h=>({object:'block',type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:h.title,link:{url:h.url}}}]}}))));
 return {blocks:compactDashboard(blocks,model,ui),summary};
}
