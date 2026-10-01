import {addEconomicsSection,economicsStyles} from './sheets-economics.mjs';
import {sheetVisualHierarchy} from './sheets-visual-hierarchy.mjs';
import {storeSummaryPresentation} from './sheets-store-summary.mjs';
import {compactSheetPresentation} from './sheets-compact-presentation.mjs';
import {warehouseRows,appKpi} from './meeting.mjs';
import {strictOperatingView,periodRatio} from './app-report-model.mjs';
import {compatibleTrend} from './reporting-semantics.mjs';
import {compatiblePreliminary} from './preliminary-comparison.mjs';
import {addDays,weekWindow,windowFromStart} from './core.mjs';
import {canonicalRow} from './late-data.mjs';
import {finalWeekMatches} from './week-lifecycle.mjs';
import {weeklyReportTitle} from './reporting-semantics.mjs';
import {knownMarketing} from './marketing-summary.mjs';
const columnName=n=>{let s='';for(;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
export function buildWeeklySheets(pages,config,lifecycle,{asOf=new Date(),sheetState}={}) {
if(!sheetState?.sheets)throw Error('Fresh Google Sheets metadata is required');
for(const [w,s] of Object.entries(lifecycle.weeks))if(s.status==='FINAL'&&!finalWeekMatches(pages,w,s))throw Error('FINAL manifest drift: '+w);
const data={rows:pages.map(p=>canonicalRow(p,config)),lifecycle};
const canonical=data.rows.filter(r=>['ozard','easyspell'].includes(r.app)).sort((a,b)=>a.id.localeCompare(b.id));
const historical=[...new Set(canonical.map(r=>r.week))].sort(),weeks=[...new Set([...historical,addDays(weekWindow(asOf).start,7)])].sort(),views=Object.fromEntries(historical.map(w=>[w,warehouseRows(pages,w,data.lifecycle)]));
const width=weeks.length+3;
const ids={Ozard:21092201,EasySpell:21092202,source:21092203},sourceName='_Weekly Source';
const headers=['Row key','Week','App','Metric','Platform','Segment','Country','Value','Status','Unit','Currency','Coverage','Complete','Numerator','Denominator','Ordered stage','Previous ordered stage','First opens','Cohort first opens','Cohort paywall','Cohort checkout','Cohort ack','Cohort start','Notes','Source URL','Source calendar'];
const cv=v=>v===undefined||v===null?{}:{userEnteredValue:typeof v==='number'?{numberValue:v}:typeof v==='boolean'?{boolValue:v}:{stringValue:String(v)}};
const color=h=>({red:parseInt(h.slice(0,2),16)/255,green:parseInt(h.slice(2,4),16)/255,blue:parseInt(h.slice(4,6),16)/255});
const idx=new Map(canonical.map((r,i)=>[r.id,i+2]));const ref=(r,col='H')=>`'${sourceName}'!${col}${idx.get(r.id)}`;
const val=r=>r&&Number.isFinite(r.value)?`=IF(ISNUMBER(${ref(r)}),${ref(r)},"—")`:null;
const get=(app,w,m,p='All',seg='all')=>canonical.find(r=>r.appName===app&&r.week===w&&r.metric===m&&r.platform===p&&(r.country||'GLOBAL')==='GLOBAL'&&(typeof seg==='function'?seg(r):r.segment===seg));
const getV=r=>views[r?.week]?.find(x=>x.pageId===r.pageId);
const cover=r=>!r?'—':r.coverage?.observedDays!==undefined?`${r.coverage.observedDays<7?'PARTIAL · ':''}${r.coverage.observedDays}/7 gün`:r.releaseValidation?.coverage!==undefined?`PARTIAL · ${(r.releaseValidation.coverage*100).toFixed(2)}%`:r.value===null?'—':r.complete===false?'Kısmi kapsam':'Kaynak dönemi';
const note=r=>r?`${r.status} | ${cover(r)} | ${r.sourceTimezone||''}\n${r.numerator!=null||r.denominator!=null?`${r.numerator??'—'} / ${r.denominator??'—'}\n`:''}${r.notes||''}\n${r.sourceUrl||''}`:'Bu hafta için doğrulanmış canonical değer yok.';
const cell=(value,{formula=false,note:n,ratio=false,money,caution=false,decimal=false}={})=>({...cv(value),...(formula&&value?{userEnteredValue:{formulaValue:value}}:{}),...(n?{note:n.slice(0,7000)}:{}),userEnteredFormat:{numberFormat:{type:ratio?'PERCENT':'NUMBER',pattern:ratio?'0.0%':money?`"${money} "#,##0.00`:decimal?'#,##0.00':'#,##0'},horizontalAlignment:'RIGHT',...(caution?{backgroundColor:color('FFF4D6')}:{})}});
const srcRows=[headers,...canonical.map(r=>[r.id,r.week,r.appName,r.metric,r.platform,r.segment,r.country||'GLOBAL',r.value,r.status,r.unit,r.currency,cover(r),r.complete===true,r.numerator,r.denominator,r.activity?.orderedFromFirstOpen,r.activity?.previousChainUsers,r.activity?.firstOpenUsers,r.cohort?.counts?.firstOpen,r.cohort?.counts?.paywallViewed,r.cohort?.counts?.checkoutStarted,r.cohort?.counts?.clientAck,r.cohort?.start,r.notes,r.sourceUrl,r.sourceTimezone])].map(a=>({values:a.map(cv)}));
const result=[];
const setup=[];
for(const [title,sid]of [['Ozard',ids.Ozard],['EasySpell',ids.EasySpell],[sourceName,ids.source]]) {
 const s=sheetState.sheets.find(s=>s.properties.sheetId===sid);if(!s||s.properties.title!==title)throw Error('Target tab identity mismatch: '+title);
 const gp=s.properties.gridProperties;
 setup.push({updateSheetProperties:{properties:{sheetId:sid,gridProperties:{rowCount:Math.max(gp.rowCount,canonical.length+100),columnCount:Math.max(gp.columnCount,sid===ids.source?26:width)}},fields:'gridProperties(rowCount,columnCount)'}});
 if(sid!==ids.source){for(const m of s.merges||[])setup.push({unmergeCells:{range:m}});for(const g of [...(s.rowGroups||[])].sort((a,b)=>b.depth-a.depth))setup.push({deleteDimensionGroup:{range:g.range}});setup.push({updateDimensionProperties:{range:{sheetId:sid,dimension:'ROWS',startIndex:0,endIndex:gp.rowCount},properties:{hiddenByUser:false},fields:'hiddenByUser'}});}
 setup.push({updateCells:{range:{sheetId:sid,startRowIndex:0,endRowIndex:gp.rowCount,startColumnIndex:0,endColumnIndex:gp.columnCount},rows:[],fields:sid===ids.source?'userEnteredValue':'userEnteredValue,userEnteredFormat,note'}});
}
result.push({kind:'prepare-owned-tabs',requests:setup});
for(let start=0;start<srcRows.length;start+=75)result.push({kind:'source-'+start,requests:[{updateCells:{range:{sheetId:ids.source,startRowIndex:start,endRowIndex:Math.min(start+75,srcRows.length),startColumnIndex:0,endColumnIndex:26},rows:srcRows.slice(start,start+75),fields:'userEnteredValue'}}]});
const plans={};
for(const app of ['Ozard','EasySpell']){
 const sid=ids[app],rows=[],groups=[],sections=[],used=new Set();
 const add=(label,scope,unit,fn)=>{const rr=rows.length+1;rows.push({values:[cv(label),cv(scope),cv(unit),...weeks.map((w,i)=>fn(w,i,rr))]});return rr;};
 const text=(v,n)=>cell(v,{note:n});
 const section=t=>{sections.push(rows.length);add(t,'','',()=>cv(''));};
 add(app+' · Haftalık performans','','',w=>text(weeklyReportTitle(w).split(' · ')[0]));
 add('Metrikler ↓ / Haftalar →','','',w=>text(w+' → '+new Date(Date.parse(w)+6*864e5).toISOString().slice(0,10)));
 add('Hafta durumu','','',w=>text(data.lifecycle.weeks[w]?.status||'DEVAM EDİYOR'));
 add('Karşılaştırma kuralı','','',w=>text(data.lifecycle.weeks[w]?.status==='FINAL'?'Kilitli tarihçe':historical.includes(w)?'Ön veri · uzlaştırılıyor':'Yalnız bütçe / hafta açık'));
 add('— eksik veri · sarı = kısmi / tahmin · ayrıntı için hücre notu','','',()=>cv(''));
 add('Metrik','Platform / kapsam','Birim',()=>cv(''));
 const metric=(label,m,p='All',seg='all',opts={})=>add(label,p==='All'?'Genel':p,opts.unit||'',w=>{const r=get(app,w,m,p,seg);if(r)used.add(r.id);return cell(val(r)||'—',{formula:!!val(r),note:note(r),ratio:r?.unit==='ratio',decimal:r?.metric==='Sessions per Active User',money:r?.currency,caution:r&&(r.status==='ESTIMATE'||r.complete===false||r.coverage?.observedDays<7||r.releaseValidation&&!r.releaseValidation.complete)});});
 const total=(label,m)=>add(label,'Genel / uyumlu','',w=>{const k=views[w]?appKpi(views[w],app,m):null;const refs=k?.available&&!k.split?k.sources.map(x=>canonical.find(r=>r.pageId===x.pageId)):[];return cell(refs.length?'='+refs.map(r=>ref(r)).join('+'):'—',{formula:refs.length>0,note:refs.length?'Mevcut scorecard uyumluluk kontrolünden geçen platform toplamı.': 'Platform birimi / takvimi / kapsamı uyumlu değil veya veri eksik; toplanmadı.',money:k?.row?.currency});});
 section('01  ACQUISITION · STORE');
 total('Store Downloads · uyumlu toplam','Store Downloads');
 metric('First-time Downloads','Store Downloads','iOS');metric('Device Downloads · ayrı nüfus','Store Downloads','Android');
 for(const p of ['iOS','Android'])add('Download tarih kapsamı',p,'gün',w=>text(cover(get(app,w,'Store Downloads',p)),note(get(app,w,'Store Downloads',p))));
 metric('Unique Impressions','Unique Store Impressions','iOS');metric('Total Downloads · Apple native','Apple Total Downloads','iOS');
 metric('Unique Impressions → Total Downloads · Native CVR','Store CVR','iOS');
 metric('Product Page Views','Product Page Views','iOS');metric('Unique Product Page Views','Unique Product Page Views','iOS');
 add('First Downloads / PPV · period proxy','iOS','%',w=>{const a=get(app,w,'Store Downloads','iOS'),b=get(app,w,'Product Page Views','iOS'),ok=a&&b&&periodRatio(getV(a),getV(b))!==null;return cell(ok?`=${ref(a)}/${ref(b)}`:'—',{formula:ok,ratio:true,note:'Aynı dönem oranı; indirmeler bu sayfa ziyaretçileriyle eşleştirilmiş değildir. Eksik/uyumsuz tarih kapsamı varsa gösterilmez.'});});
 metric('Listing Visitors','Product Page Views','Android');
 add('Listing Acquisitions · CVR numerator','Android','adet',w=>{const r=get(app,w,'Store CVR','Android');return cell(r?.numerator!=null?'='+ref(r,'N'):'—',{formula:r?.numerator!=null,note:note(r),caution:r?.coverage?.observedDays<7});});
 metric('Listing Visitor → Install · Native CVR','Store CVR','Android');
 add('Listing / CVR tarih kapsamı','Android','gün',w=>text(cover(get(app,w,'Store CVR','Android')),note(get(app,w,'Store CVR','Android'))));
 section('02  ACQUISITION · HARCAMA & CPI');
 const economics=addEconomicsSection({app,weeks,canonical,ref,add,metric,cell,text,rows,groups});
 section('03  BÜTÇE · HAFTALIK GİRİŞ BAĞLANTISI');
 const budgetGrid=sheetState.sheets.find(s=>s.properties.title==='Haftalık Giriş')?.properties.gridProperties;
 if(!budgetGrid||budgetGrid.rowCount<3)throw Error('Fresh budget tab metadata is required');
 const budgetEnd=columnName(budgetGrid.columnCount),budgetData=`'Haftalık Giriş'!$A$3:$${budgetEnd}$${budgetGrid.rowCount}`,budgetHeaders=`'Haftalık Giriş'!$A$2:$${budgetEnd}$2`;
 const budgetColumn=header=>`INDEX(${budgetData},0,MATCH("${header}",${budgetHeaders},0))`;
 const A=budgetColumn('Hafta seç →'),C=budgetColumn('App / proje'),E=budgetColumn('Bütçe hedefi $'),F=budgetColumn('Gerçek harcama $'),V=budgetColumn('Harcama geçerli');
 const budget=(type,w)=>{const date=`DATE(${w.split('-').map(Number).join(',')})`,cond=`(${A}=${date})*(${C}="${app}")`,n=`COUNTIFS(${A},${date},${C},"${app}")`,valid=`COUNTIFS(${A},${date},${C},"${app}",${V},1)`;if(type==='coverage')return `=IF(${n}=0,"—",${valid}&" / "&${n}&" kanal-dönem doğrulandı")`;const col=type==='plan'?E:F;const count=`SUMPRODUCT(${cond}*ISNUMBER(${col}))`;if(type==='complete')return `=IF(AND(${n}>0,${valid}=${n}),SUMIFS(${F},${A},${date},${C},"${app}"),"—")`;return `=IF(${count}=0,"—",SUMIFS(${col},${A},${date},${C},"${app}"))`;};
 const bp=add('Planlanan bütçe','App toplamı','USD',w=>cell(budget('plan',w),{formula:true,money:'USD',note:'Haftalık Giriş Bütçe hedefi $ alanı; aynı hafta/app satırları. Boş ≠ sıfır. Ayı aşan haftanın dönemleri birlikte toplanır.'}));
 add('Girilen gerçekleşen harcama · kısmi olabilir','App toplamı','USD',w=>cell(budget('entered',w),{formula:true,money:'USD',note:'Haftalık Giriş Gerçek harcama $ alanı. Yalnız girilmiş tutarlar; bilinmeyen kanallar sıfır kabul edilmez. Canonical media spend yerine geçmez.',caution:true}));
 const bc=add('Doğrulanmış bütçe gerçekleşmesi · tüm kayıtlı satırlar','App toplamı','USD',w=>cell(budget('complete',w),{formula:true,money:'USD',note:'Yalnız o app/haftanın tüm kayıtlı kanal-dönem satırlarında Harcama geçerli=1 ise. Bu, bütçe tablosu tamamlığıdır; listelenmeyen ağlar/ortak bütçe/UGC nedeniyle Business CPI kapsam kanıtı değildir.'}));
 add('Bütçe farkı · gerçekleşen − hedef','App toplamı','USD',(w,i)=>{const col=columnName(4+i);return cell(`=IF(AND(ISNUMBER(${col}${bp}),ISNUMBER(${col}${bc})),${col}${bc}-${col}${bp},"—")`,{formula:true,money:'USD'});});
 add('Bütçe doğrulama durumu','App toplamı','',w=>cell(budget('coverage',w),{formula:true,note:'Haftalık Giriş Harcama geçerli doğrulama alanı kullanılır; başlık adına göre eşlenir. TRY / USD kendiliğinden çevrilmez.'}));
 section('04  MONETIZATION · FUNNEL');
 if(app==='Ozard'){
  for(const p of ['iOS','Android']){
   add('Weekly new-user funnel · aynı nüfus',p,'kullanıcı',w=>{const v=views[w]?strictOperatingView(views[w],p):null;return text(v?.valid?v.stages.map(s=>s.count.toLocaleString('en-US')).join(' → '):'—','First Open → Onboarding → Paywall → Checkout → Client Ack. Bütün olaylar rapor haftasında, sıralı ve önceki adımın alt kümesi.');});
   const ev=['app_first_opened','onboarding_completed','paywall_viewed','purchase_started','purchase_completed'],names=['First Open','Onboarding Completed','Paywall Viewed','Checkout Started','Client Ack'];
   for(let i=0;i<ev.length;i++){
    add(names[i]+' · ordered users',p,'kullanıcı',w=>{const r=get(app,w,'Weekly Operating Users',p,ev[i]),v=views[w]?strictOperatingView(views[w],p):null;return cell(v?.valid?'='+ref(r,'P'):'—',{formula:v?.valid,note:note(r)});});
    if(i)add('↳ '+names[i]+' · step conversion',p,'%',w=>{const r=get(app,w,'Weekly Operating Users',p,ev[i]),v=views[w]?strictOperatingView(views[w],p):null;return cell(v?.valid?`=IFERROR(${ref(r,'P')}/${ref(r,'Q')},"—")`:'—',{formula:v?.valid,ratio:true,note:'Önceki sıralı adımdan dönüşüm; independent activity oranı değildir.'});});
    if(i)add('↳ First Open → '+names[i]+' · cumulative',p,'%',w=>{const r=get(app,w,'Weekly Operating Users',p,ev[i]),v=views[w]?strictOperatingView(views[w],p):null;return cell(v?.valid?`=IFERROR(${ref(r,'P')}/${ref(r,'R')},"—")`:'—',{formula:v?.valid,ratio:true});});
   }
  }
 }else{
  add('iOS product telemetry · partial','iOS','',()=>text('Event occurrences ≠ verified purchases','Kimliksiz, etiketli olay nüfusu; unique-user funnel değildir. First Open bulunmadığında eklenmez. RevenueCat işlemleri farklı nüfustur.'));
  for(const [e,n]of [['onboarding_completed','Onboarding'],['paywall_viewed','Paywall'],['purchase_started','Purchase Start'],['purchase_completed','Client Ack'],['subscription_activated','Subscription Start']])metric(n+' · tagged events','iOS Aggregate Monetization Activity','iOS',e);
 }
 for(const p of ['iOS','Android']){metric('Paywall Reach · mature subset','Paywall Reach',p);metric('Paywall → Checkout · observed diagnostic','Paywall → Checkout Conversion',p);metric('Paywall → Client Ack · observed diagnostic','Paywall → Client Ack Conversion',p);}
 if(app==='Ozard'){
  section('7-DAY ACQUISITION COHORT · İKİ AYRI NÜFUS');
  for(const p of ['iOS','Android']){
   add('Tamamlanan önceki acquisition cohort',p,'tarih',w=>{const r=get(app,w,'7-Day Acquisition Cohort First Opens',p,r=>r.segment.startsWith('mature-cohort:'));return text(r?.cohort?.start||'—',note(r));});
   for(const [label,col]of [['First Open','S'],['Paywall','T'],['Checkout','U'],['Client Ack','V']])add('↳ Tamamlanan cohort · '+label,p,'kullanıcı',w=>{const r=get(app,w,'7-Day Acquisition Cohort First Opens',p,r=>r.segment.startsWith('mature-cohort:'));return cell(r?.cohort?.pending===0?'='+ref(r,col):'—',{formula:r?.cohort?.pending===0,note:note(r)});});
   add('↳ Tamamlanan cohort · First Open → Ack',p,'%',w=>{const r=get(app,w,'7-Day Acquisition Cohort First Opens',p,r=>r.segment.startsWith('mature-cohort:'));return cell(r?.cohort?.pending===0?`=IFERROR(${ref(r,'V')}/${ref(r,'S')},"—")`:'—',{formula:r?.cohort?.pending===0,ratio:true,note:note(r)});});
   for(const [label,m,col]of [['First Open','Paywall Reach','O'],['Paywall','Paywall Reach','N'],['Checkout','Mature Cohort Paywall → Checkout','N'],['Client Ack','Mature Cohort Checkout → Client Ack','N']])add('Bu haftanın olgunlaşmış alt kümesi · '+label,p,'kullanıcı',w=>{const r=get(app,w,m,p);return cell(r&&Number.isFinite(r.value)?'='+ref(r,col):'—',{formula:r&&Number.isFinite(r.value),note:note(r),caution:true});});
  }
 }
 section('05  REVENUECAT · FINANCIAL TRUTH');
 for(const [m,l]of [['RevenueCat Verified Initial Purchases','Verified Initial Purchases'],['Verified Revenue','Verified Period Revenue']]){total(l,m);for(const p of ['iOS','Android'])metric(l,m,p);}
 section('06  RETENTION & USAGE');
 for(const [m,l]of [['Weekly Active Users','WAU'],['Any Core Value Users','Core Users'],['Core Value Reach','Core Value Reach'],['Repeat Core Value Users','Repeat Core Users'],['No Core Value Users','No-core Users'],['No Core Value Reach','No-core Reach'],['D1','D1 Retention'],['D7','D7 Retention']])for(const p of ['iOS','Android'])metric(l,m,p,m==='D1'||m==='D7'?r=>['all','clean-first-open-cohort'].includes(r.segment):'all');
 for(const p of ['iOS','Android'])add('Product coverage',p,'%',w=>text(cover(get(app,w,'Weekly Active Users',p))));
 for(const [m,l]of [['Subscription W1','W1 Renewal'],['Subscription W2','W2 Renewal'],['Subscription M1','M1 Renewal'],['Subscription M2','M2 Renewal']])for(const p of ['iOS','Android']){metric(l+' · mature start cohort',m,p,r=>r.segment.startsWith('mature-cohort:'));add('↳ '+l+' · cohort başlangıcı',p,'tarih',w=>text(get(app,w,m,p,r=>r.segment.startsWith('mature-cohort:'))?.segment.match(/\d{4}-\d{2}-\d{2}/)?.[0]||'—'));}
 const features=[...new Set(canonical.filter(r=>r.appName===app&&r.metric==='Feature Value Reach').map(r=>r.segment))].sort();
 if(features.length){section('07  FEATURE REACH · % WAU');for(const f of features)for(const p of ['iOS','Android'])metric(f,'Feature Value Reach',p,f);}
 if(app==='EasySpell'){section('08  iOS AGGREGATE USAGE · PARTIAL');for(const s of [...new Set(canonical.filter(r=>r.appName===app&&r.metric==='iOS Aggregate Usage').map(r=>r.segment))])metric(s,'iOS Aggregate Usage','iOS',s);}
 section('WEEK-OVER-WEEK · YALNIZ UYUMLU KARŞILAŞTIRMALAR');const st=rows.length;
 for(const m of ['Store Downloads','Store CVR','CPI','RevenueCat Verified Initial Purchases','Verified Revenue','Core Value Reach','D1','Subscription W1'])for(const p of m==='CPI'?['All']:['iOS','Android'])add(m+' · WoW',p,'Δ',w=>{const a=get(app,w,m,p,m==='Subscription W1'?r=>r.segment.startsWith('mature-cohort:'):m==='D1'?r=>['all','clean-first-open-cohort'].includes(r.segment):'all'),prev=new Date(Date.parse(w)-7*864e5).toISOString().slice(0,10),b=get(app,prev,m,p,m==='Subscription W1'?r=>r.segment.startsWith('mature-cohort:'):m==='D1'?r=>['all','clean-first-open-cohort'].includes(r.segment):'all');if(!a||!b||!compatibleTrend(getV(a),getV(b))&&!compatiblePreliminary(getV(a),getV(b)))return text('—','Kısmi veya uyumsuz nüfus/takvim/cohort; yanıltıcı değişim oranı üretilmez.');const rate=a.unit==='ratio';return cell(rate?`=(${ref(a)}-${ref(b)})*100`:`=IFERROR((${ref(a)}-${ref(b)})/ABS(${ref(b)}),"—")`,{formula:true,ratio:!rate,decimal:rate,note:rate?'Percentage-point farkı (pp).':'RECONCILING karşılaştırma ön veridir; önceki hafta manifesti doğrulanmış FINAL.'});});groups.push({start:st,end:rows.length});
 const normalized=r=>[r.metric,r.platform,r.segment.replace(/(?:mature|start)-cohort:\d{4}-\d{2}-\d{2}/,m=>m.split(':')[0]+':lag'+(Math.round((Date.parse(r.week)-Date.parse(m.split(':')[1]))/864e5))),r.country||'GLOBAL'].join('|');
 for(const [name,test]of [['TÜM CANONICAL DETAYLAR · activity / cohorts / diagnostics',r=>(r.country||'GLOBAL')==='GLOBAL'],['COUNTRY DETAYLARI · canonical provider kapsamı',r=>(r.country||'GLOBAL')!=='GLOBAL']]){section(name);const start=rows.length;const keys=[...new Map(canonical.filter(r=>r.appName===app&&test(r)).map(r=>[normalized(r),r])).entries()].sort(([a],[b])=>a.localeCompare(b));for(const [key,ex]of keys)add(ex.metric+' · '+ex.segment.replace(/\d{4}-\d{2}-\d{2}/,'cohort'),ex.platform+((ex.country||'GLOBAL')==='GLOBAL'?'':' · '+ex.country),ex.currency||ex.unit,w=>{const r=canonical.find(x=>x.appName===app&&x.week===w&&normalized(x)===key);return cell(val(r)||'—',{formula:!!val(r),ratio:r?.unit==='ratio',decimal:r?.metric==='Sessions per Active User',money:r?.currency,note:note(r),caution:r?.complete===false||r?.status==='ESTIMATE'});});groups.push({start,end:rows.length});}
 plans[app]={sheetId:sid,rows:rows.length,groups,sections};
 for(let start=0;start<rows.length;start+=70)result.push({kind:app+'-values-'+start,requests:[{updateCells:{range:{sheetId:sid,startRowIndex:start,endRowIndex:Math.min(start+70,rows.length),startColumnIndex:0,endColumnIndex:width},rows:rows.slice(start,start+70),fields:'userEnteredValue,userEnteredFormat,note'}}]});
 const range={sheetId:sid,startRowIndex:0,endRowIndex:rows.length,startColumnIndex:0,endColumnIndex:width};
 const tall=rows.flatMap((r,i)=>!sections.includes(i)&&i>5&&(String(r.values[0]?.userEnteredValue?.stringValue||'').length>49||r.values.some(c=>String(c.userEnteredValue?.stringValue||'').length>34))?[i]:[]);
 result.push({kind:app+'-format',requests:[{repeatCell:{range,cell:{userEnteredFormat:{textFormat:{fontFamily:'Arial',fontSize:10,foregroundColor:color('243447')},verticalAlignment:'MIDDLE',wrapStrategy:'WRAP'}},fields:'userEnteredFormat(textFormat,verticalAlignment,wrapStrategy)'}},{updateDimensionProperties:{range:{sheetId:sid,dimension:'COLUMNS',startIndex:0,endIndex:1},properties:{pixelSize:390},fields:'pixelSize'}},{updateDimensionProperties:{range:{sheetId:sid,dimension:'COLUMNS',startIndex:1,endIndex:2},properties:{pixelSize:115},fields:'pixelSize'}},{updateDimensionProperties:{range:{sheetId:sid,dimension:'COLUMNS',startIndex:2,endIndex:3},properties:{pixelSize:85},fields:'pixelSize'}},{updateDimensionProperties:{range:{sheetId:sid,dimension:'COLUMNS',startIndex:3,endIndex:width},properties:{pixelSize:225},fields:'pixelSize'}},{updateDimensionProperties:{range:{sheetId:sid,dimension:'ROWS',startIndex:0,endIndex:rows.length},properties:{pixelSize:26},fields:'pixelSize'}},{repeatCell:{range:{...range,endRowIndex:6},cell:{userEnteredFormat:{backgroundColor:color('EDF2F7'),textFormat:{fontFamily:'Arial',fontSize:10,bold:true},wrapStrategy:'WRAP'}},fields:'userEnteredFormat(backgroundColor,textFormat,wrapStrategy)'}},{updateDimensionProperties:{range:{sheetId:sid,dimension:'ROWS',startIndex:0,endIndex:6},properties:{pixelSize:28},fields:'pixelSize'}},{mergeCells:{range:{sheetId:sid,startRowIndex:4,endRowIndex:5,startColumnIndex:0,endColumnIndex:3},mergeType:'MERGE_ALL'}},...sections.flatMap(s=>[{mergeCells:{range:{sheetId:sid,startRowIndex:s,endRowIndex:s+1,startColumnIndex:0,endColumnIndex:3},mergeType:'MERGE_ALL'}},{repeatCell:{range:{sheetId:sid,startRowIndex:s,endRowIndex:s+1,startColumnIndex:0,endColumnIndex:width},cell:{userEnteredFormat:{backgroundColor:color('DCE6EF'),textFormat:{bold:true}}},fields:'userEnteredFormat(backgroundColor,textFormat.bold)'}}]),...tall.map(i=>({updateDimensionProperties:{range:{sheetId:sid,dimension:'ROWS',startIndex:i,endIndex:i+1},properties:{pixelSize:44},fields:'pixelSize'}})),...groups.flatMap(g=>g.end>g.start?[{addDimensionGroup:{range:{sheetId:sid,dimension:'ROWS',startIndex:g.start,endIndex:g.end}}},{updateDimensionGroup:{dimensionGroup:{range:{sheetId:sid,dimension:'ROWS',startIndex:g.start,endIndex:g.end},depth:1,collapsed:true},fields:'collapsed'}},{updateDimensionProperties:{range:{sheetId:sid,dimension:'ROWS',startIndex:g.start,endIndex:g.end},properties:{hiddenByUser:true},fields:'hiddenByUser'}}]:[])]});
 const compact=compactSheetPresentation(sid,rows);result.push({kind:app+'-compact',requests:compact.requests});plans[app].rows=compact.rowCount;result.push({kind:app+'-hierarchy',requests:sheetVisualHierarchy(sid,rows)});result.push({kind:app+'-store-summary',requests:storeSummaryPresentation(sid,rows)});result.push({kind:app+'-economics-style',requests:economicsStyles(sid,economics,width)});
}
for(const b of result)for(const req of b.requests){if(Object.keys(req).length!==1)throw Error('Invalid request');if(req.updateCells?.rows.length){const u=req.updateCells;if(u.rows.length!==u.range.endRowIndex-u.range.startRowIndex||u.rows.some(r=>r.values.length!==u.range.endColumnIndex-u.range.startColumnIndex))throw Error('Bad rectangle');}}
return {batches:result,plan:{weeks,sourceRows:canonical.length,plans,width}};
}
