import {topMarkets,usageScopeNote} from './presentation-quality.mjs';
// Typography and disclosure only. Models, values and comparison rules are unchanged.
import {block,caption,bar,text} from './dashboard-visuals.mjs';
import {appleDiscovery,strictOperatingView,aggregateMonetization,measured} from './app-report-model.mjs';
import {one} from './funnel-presentation.mjs';
import {percent,number} from './funnel-presentation.mjs';
import {usageDetails,paymentDetails} from './compact-details.mjs';
import {platformSum,usageTotal,operatingTotal,mediaPlatformTotals,totalLabel,totalNote} from './platform-totals.mjs';
import {preliminaryRows} from './preliminary-comparison.mjs';
import {knownMarketing} from './marketing-summary.mjs';
const textOf=b=>(b[b.type]?.rich_text||[]).map(t=>t.text?.content||'').join('');
function compactChildren(blocks){
 return blocks.flatMap(b=>{
  const p=b[b.type];
  if(['column_list','column'].includes(b.type))return compactChildren(p.children||[]);
  if(b.type==='divider')return [];
  if(b.type==='toggle')return [block('paragraph',textOf(b),{bold:true}),...compactChildren(p.children||[])];
  if(b.type==='callout')return [block('paragraph',textOf(b),{bold:true}),...compactChildren(p.children||[])];
  if(b.type.startsWith('heading_'))return [{object:'block',type:'paragraph',paragraph:{rich_text:(p.rich_text||[]).map(t=>({...t,annotations:{...t.annotations,bold:true}}))}}];
  return b;
 });
}
export function compactDashboard(source,model,ui){
 const {rows,economics,usages,stores,easyUsage,aggregate}=model;
 const {heading,paragraph,toggle,formatValue,table,appKpi,renewalLabel,coverageText}=ui;
 const k=(app,metric,platform)=>appKpi(rows,app,metric,platform?{platform}:{}).text;
 const money=(value,currency)=>formatValue({value,unit:'money',currency});
 const point=(v,id)=>v?.points.find(p=>p.id===id);
 const appStarts=source.map((b,i)=>b.type==='heading_1'&&['Ozard','EasySpell'].includes(textOf(b))?i:-1).filter(i=>i>=0);
 const marketingTable=table([['App','Verified Media Spend · known components','UGC Base Estimate','Complete Acquisition Cost','Store Volume'],...['Ozard','EasySpell'].map(app=>{
  const known=knownMarketing(rows,app),complete=appKpi(rows,app,'Total Acquisition Spend');
  const media=economics.filter(e=>e.app===app).map(e=>e.network+(e.platform==='All'?'':' '+e.platform)+': '+(e.spend===0?'0 · verified zero':money(e.spend,e.currency))).join('\n')||'Pending';
  const ugc=rows.find(r=>r.appName===app&&r.country==='GLOBAL'&&r.metric==='UGC Estimated Accrued Cost'&&measured(r));
  const acquisition=['iOS','Android'].map(p=>{const r=one(rows,app,p,'Store Downloads');return p+': '+(r&&measured(r)?number(r.value)+coverageText(r):'—')+' · '+(p==='iOS'?'first-time':'new device');}).join('\n');
  return [app,media+'\nOther networks: Pending',ugc?formatValue(ugc)+' · ESTIMATE':'Pending',complete.available?complete.text:'Pending',acquisition];
 })]);
 const introduction=source.slice(1,appStarts[0]).filter(b=>b.type!=='divider');
 const out=[block('paragraph','Acquisition Spend & Store Volume',{bold:true}),...introduction.filter(b=>b.type!=='table'),marketingTable,
  caption('UGC: base model only · final earnings / bonus / currency pending. Media and UGC estimates are not combined. Store counting units remain platform-specific.'),
  ...introduction.filter(b=>b.type==='table')];
 for(let a=0;a<appStarts.length;a++){
  const start=appStarts[a],app=textOf(source[start]),end=appStarts[a+1]??source.findIndex((b,i)=>i>start&&b.type==='toggle'&&textOf(b)==='Past Weeks');
  const content=source.slice(start+1,end>=0?end:source.length).filter(b=>b.type!=='divider');
  const appBlockStart=out.length;
  const own=rows.filter(r=>r.appName===app),ios=appleDiscovery(rows,app),android=stores.find(v=>v.app===app&&v.platform==='Android');
  const usage=p=>app==='Ozard'?usages.find(v=>v.platform===p):p==='Android'?easyUsage:null;
  const androidDownloads=one(rows,app,'Android','Store Downloads');
  const rate=(metric,p)=>k(app,metric,p).replace(' ('+p+')','');
  const total=metric=>{const value=appKpi(rows,app,metric);return value.available&&!value.split?value.text:'—';};
  const cohort=metric=>renewalLabel(own,metric);
  const shape=(platform)=>{const v=usage(platform);return v?number(point(v,'core').count)+' / '+number(point(v,'wau').count)+' · '+percent(point(v,'core').rate):'Aggregate only';};
  const combinedUsage=usageTotal(rows,app);
  const installRows=['iOS','Android'].map(p=>one(rows,app,p,'AppsFlyer Installs'));
  if(installRows.some(measured)){
   const paidRows=['iOS','Android'].map(p=>one(rows,app,p,'AppsFlyer Paid Installs'));
   const count=r=>measured(r)?(r.semantics?.complete===false?'≥':'')+number(r.value):'—';
   const compatible=(rs,full=true)=>rs.every(r=>measured(r)&&(!full||r.semantics?.complete===true))&&rs.every(r=>r.calendar===rs[0].calendar&&r.unit===rs[0].unit&&r.semantics?.definition===rs[0].semantics?.definition);
   out.push(block('paragraph',app+' · Acquisition ön sonuç',{bold:true}),table([['Platform','Toplam install · ilk açılış','Paid install'],...['iOS','Android'].map((p,i)=>[p,count(installRows[i]),count(paidRows[i])]),['Genel',compatible(installRows)?number(installRows.reduce((n,r)=>n+r.value,0)):'—',compatible(paidRows,false)?(paidRows.some(r=>r.semantics?.complete!==true)?'≥':'')+number(paidRows.reduce((n,r)=>n+r.value,0)):'—']]),caption('AppsFlyer · UTC hafta · ön sonuç, uzlaştırmada güncellenir. Mağaza indirmesi değildir. Ağ harcaması / paid install oranları Acquisition economics bölümündedir.'));
  }

  out.push(heading(app,3),block('paragraph','Acquisition',{bold:true}),table([
   ['Platform','Store discovery','Store Conversion','Download composition','Store Page / Listing Visitors','First DL / PPV'],
   ['iOS',ios.linked?number(ios.impressions.value)+' → '+number(ios.downloads.value)+'\nUnique impressions → total downloads':'—',ios.linked?percent(ios.native.value,2)+coverageText(ios.native)+'\nApple Native CVR':'—',number(ios.downloads?.value)+' total\n'+rate('Store Downloads','iOS')+' first-time\n'+(measured(ios.downloads)&&measured(ios.first)&&ios.downloads.value>=ios.first.value&&ios.downloads.calendar===ios.first.calendar&&(ios.downloads.semantics?.complete&&ios.first.semantics?.complete||JSON.stringify(ios.downloads.semantics?.coverage?.dates||[])===JSON.stringify(ios.first.semantics?.coverage?.dates||[]))?number(ios.downloads.value-ios.first.value):'—')+' redownloads',number(ios.views?.value)+coverageText(ios.views||{})+' Product Page Views\nUnique '+number(ios.uniqueViews?.value),ios.pageProxy!==null?percent(ios.pageProxy)+'\nPeriod proxy':'—'],
   ['Android',android?.linked?number(point(android,'listing-base').count)+' → '+number(point(android,'listing-acquisitions').count)+'\nListing visitors → acquisitions':'—',rate('Store CVR','Android')+'\nPlay Listing CVR',rate('Store Downloads','Android')+'\nDevice downloads · separate',rate('Product Page Views','Android')+' Listing Visitors','—'],
   ['Compatible store total','—','—',total('Store Downloads'),'—','—']
  ]),caption('Only compatible store totals. Apple / Play counting units and calendars differ; native CVRs are not averaged. Listing coverage appears beside Android CVR. First Downloads / Product Page Views is a period proxy, not matched viewers.'));
  const known=economics.filter(e=>e.app===app),global=own.filter(r=>r.country==='GLOBAL');
  const costDisplay=[...known,...mediaPlatformTotals(rows,app,known)];
  const estimate=global.filter(r=>r.metric==='UGC Estimated Accrued Cost'&&measured(r));
  const costRows=['iOS','Android','All'].filter(p=>p==='All'||known.some(e=>e.platform===p)).map(p=>{
   const components=costDisplay.filter(e=>e.platform===p).sort((a,b)=>b.spend-a.spend);
   return [p==='All'?'Known components':p,
    components.map(e=>e.network+' '+money(e.spend,e.currency)+(e.spend===0?' · verified zero':'')).join('\n')||'—',
    estimate.filter(r=>r.platform===p).map(r=>formatValue(r)+'\nESTIMATE').join('\n')||'—',
    components.filter(e=>e.spend>0).map(e=>e.network+': '+(e.paidInstalls!==null?number(e.paidInstalls):'unavailable')).join('\n')||'—',
    components.filter(e=>e.spend>0).map(e=>e.network+': '+(e.networkPaidDateProxy!==null?money(e.networkPaidDateProxy,e.currency)+'\nCalendar proxy':e.networkPaidCpi!==null?money(e.networkPaidCpi,e.currency):'Pending — matched denominator unavailable')).join('\n')||'—',
    p==='All'?(appKpi(rows,app,'CPI').available?k(app,'CPI'):'Pending'):'—'];
  });
  out.push(block('paragraph','Acquisition economics · known components',{bold:true}),table([['Scope','Verified media components','UGC Base Estimate','Attributed installs','Network spend / install','Full Business CPI'],...costRows]));
  const appleAds=global.find(r=>r.metric==='Media Ad Spend Component'&&r.segment==='Apple Ads');
  if(!measured(appleAds))out.push(block('paragraph','Apple Search Ads · Pending',{bold:true}));
  if(known.some(e=>e.networkPaidDateProxy!==null))out.push(caption('Network spend / attributed install · diagnostic. Provider spend and install calendars are not perfectly aligned.'));
  if(!appKpi(rows,app,'CPI').available)out.push(caption('Business CPI · Pending — complete media, final UGC and compatible store coverage required.'));
  if(app==='Ozard'){
   const combined=operatingTotal(rows);
   const strict=[...['iOS','Android'].map(p=>strictOperatingView(rows,p)),...(combined?[combined]:[])];
   const ft=table([['Weekly new-user funnel','First Open','Onboarding','Paywall','Checkout','Client Ack'],...strict.map(v=>[v.platform,...v.stages.map(s=>number(s.count))])]);
   strict.forEach((v,j)=>v.stages.forEach((stage,i)=>{
    ft.table.children[j+1].table_row.cells[i+1]=[
     text(number(stage.count),{bold:true}),
     text('\n'+(bar(stage.cumulative,6)||'0%'),{color:i&&stage.step<.15?'orange':v.platform==='iOS'?'blue':'green'}),
     text('\n'+(i?percent(stage.step)+' step':'Start')+'\n'+percent(stage.cumulative,2)+' total',{color:'gray'})
    ];
   }));
   out.push(ft,caption('Same in-week First Open population · step = previous stage · total = First Open. '+totalNote));
  }else{
   const activity=aggregateMonetization(rows);
   out.push(block('paragraph','User funnel · unavailable for EasySpell',{bold:true}),caption('Aggregate · App Opens include repeat launches; First Open and linked-user stages are unavailable.'),caption('Entry events · '+number(aggregate.points[3].count)+' App Opens · '+number(aggregate.points[4].count)+' Session Starts. Repeat activity included; not new users.'));
   const activityTable=table([
    ['Observed events · partial','Onboarding','Paywall','Purchase Start','Client Ack','Subscription Start'],
    ['iOS · event counts',...activity.stages.map(r=>number(r?.value))]
   ]);
   if(activity.valid)for(const [column,ratio,denom] of [[3,activity.checkout,'Paywall'],[4,activity.ack,'Purchase Start']])activityTable.table.children[1].table_row.cells[column]=[text(number(activity.stages[column-1].value),{bold:true}),text('\n'+percent(ratio)+' / '+denom+' events',{color:'gray'})];
   out.push(activityTable,caption('Event-count ratios, not user conversion. Partial product telemetry and RevenueCat verified transactions cover different populations.'));
  }
  if(app==='Ozard')out.push(caption('Client Ack counts this week’s First Open users who completed the full ordered path within the week. RevenueCat Initial Purchases counts all verified new paid transactions during the week. Different populations.'));
  out.push(table([
   ['RevenueCat · Financial Truth','Verified Initial Purchases','Verified Period Revenue'],
   ...['iOS','Android'].map(p=>[p,rate('RevenueCat Verified Initial Purchases',p),rate('Verified Revenue',p)]),
   ['Platform total · transactions',total('RevenueCat Verified Initial Purchases'),total('Verified Revenue')]
  ]));
  if(app==='EasySpell')out.push(block('paragraph','iOS aggregate usage · Partial',{bold:true}),table([['App Opens','Session Starts','Learning Starts','Completions','Activity Completions'],[3,4,0,1,2].map(i=>number(aggregate.points[i]?.count))]),caption('Aggregate event counts · not unique users. Android usage: small sample.'));
  else out.push(caption('Usage · calculated within tracked clean-build population; production coverage remains EARLY.'));
  out.push(table([
   ['Usage & Retention','Core Users / WAU','D1','D7',cohort('Subscription W1'),cohort('Subscription M1')],
   ...['iOS','Android'].map(p=>[p,shape(p),rate('D1',p),rate('D7',p),rate('Subscription W1',p),rate('Subscription M1',p)]),
   [totalLabel,combinedUsage?number(combinedUsage.core)+' / '+number(combinedUsage.wau)+' · '+percent(combinedUsage.reach):'—',...['D1','D7','Subscription W1','Subscription M1'].map(m=>{const v=platformSum(rows,app,m);return v?percent(v.value):'—';})]
  ]),caption(combinedUsage?totalNote:usageScopeNote(rows,app)));
  const groups=[];let group=null;
  for(const b of content){
   if(b.type==='heading_3'&&['Acquisition','Monetization','Usage','Retention'].includes(textOf(b))){group={name:textOf(b),blocks:[]};groups.push(group);continue;}
   if(b.type==='callout'&&textOf(b)==='Data Coverage'){group={name:'Coverage & source details',blocks:[]};groups.push(group);}
   if(b.type==='toggle'&&textOf(b)==='4-week trends'){groups.push({name:'4-week trends',blocks:b.toggle.children});continue;}
   if(group)group.blocks.push(b);
  }
  const countries=ui.countryTable(rows,app);
  const market=topMarkets(rows,app),marketRows=market.rows,marketBy=market.by;
  out.push(block('paragraph','Top Markets · iOS '+marketBy,{bold:true}),paragraph(marketRows.length?marketRows.slice(0,3).map(r=>r.country+' '+number(r.value)).join(' · '):'Pending'));
  if(market.caveat)out.push(caption(market.caveat));
  for(const platform of ['iOS','Android']){const scope=rows.find(r=>r.appName===app&&r.platform===platform&&r.semantics?.releaseValidation)?.semantics.releaseValidation;if(scope)out.push(caption('Product analytics coverage · '+platform+' '+percent(scope.coverage)+' of observed non-test activity'+(scope.complete?'':' · PARTIAL')+' · '+scope.builds.map(b=>b.version+' ('+b.build+')').join(', ')+(scope.review.length?' · '+scope.review.length+' legacy / unverified builds excluded'+(scope.materiallyIncomplete?' · NEW_BUILD_REVIEW_REQUIRED: '+scope.review.slice(0,2).map(b=>b.version+' '+b.reasons.join(', ')).join('; '):''):'')+'. Store-released builds; untagged TestFlight on the same build cannot be separated.'));}
  const comparisons=preliminaryRows(model.allRows,model.week,app,formatValue);
  if(!model.snapshot)out.push(block('paragraph','Weekly snapshot · OPEN / preliminary vs previous FINAL',{bold:true}),table(comparisons));
  const usageBlocks=usageDetails(app,model,ui);
  const storeBlock=usageBlocks.shift();
  const technical=content.find(b=>b.type==='toggle'&&textOf(b)==='Technical / Data Quality');
  const coverage=content.find(b=>b.type==='callout'&&textOf(b)==='Data Coverage');
  const trends=content.find(b=>b.type==='toggle'&&textOf(b)==='4-week trends');
  out.push(toggle('Store, Markets & Acquisition Sources',compactChildren([storeBlock,...(countries?[table(countries),caption('iOS · Top 5 by downloads + Rest. Provider country populations remain separate.')]:[caption('Store country volume · Pending. Available iOS AppsFlyer paid-install countries shown separately.'),table([['Country','Paid installs · iOS'],...marketRows.map(r=>[r.country,number(r.value)])])]),table([['Network','Platform','Known spend','Attributed installs'],...known.map(e=>[e.network,e.platform,money(e.spend,e.currency),number(e.paidInstalls)])]),caption('Apple Native CVR: unique impressions → total downloads (including redownloads). Play Listing CVR: matched listing visitors → acquisitions. Different denominators.')])));
  out.push(toggle(app==='Ozard'?'Usage & Feature Drilldown':'Usage Details',compactChildren(usageBlocks)));
  out.push(toggle(app==='Ozard'?'Funnel & Cohort Diagnostics':'Monetization Diagnostics',compactChildren([...paymentDetails(app,model,ui),...(app==='Ozard'&&model.week.start==='2026-09-14'?[caption('W38 source audit: Android 16 identities emitted First Open in an earlier period too. Accepted operating counts remain unchanged; seven-day cohort uses earliest observed First Open. These event-defined populations differ.')]:[]),paragraph(['Subscription W2','Subscription M2'].map(m=>cohort(m)+' '+k(app,m)).join('\n'))])));
  out.push(toggle('Data Quality & Missing Sources',compactChildren([...['iOS','Android'].flatMap(platform=>{const scope=rows.find(r=>r.appName===app&&r.platform===platform&&r.semantics?.releaseValidation)?.semantics.releaseValidation;return scope?[paragraph(platform+' build coverage · '+percent(scope.coverage)),...scope.review.map(b=>caption(b.version+' ('+b.build+') · NEW_BUILD_REVIEW_REQUIRED · '+b.reasons.join(', ')))]:[];}),...(coverage?[coverage]:[]),...(model.week.start==='2026-09-14'?[caption('Apple coverage audit · Daily data exposes Sep 14–19 only (6/7). Weekly grouping returns different totals while its visible date control still ends Sep 19; weekly totals/native CVR are withheld until the period reconciles. No Sunday zero or redownload subtraction across these scopes.')]:[]),...(technical?.toggle.children||[])])));
  out.push(toggle('Full Trends & History',compactChildren([...(trends?.toggle.children||[]),...model.history.map(h=>({object:'block',type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:h.title,link:{url:h.url}}}]}}))])));

 }
 const past=source.find(b=>b.type==='toggle'&&textOf(b)==='Past Weeks');if(past)out.push(past);
 return out;
}
