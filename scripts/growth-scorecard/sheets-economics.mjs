// Canonical rows stay unchanged. These helpers build spreadsheet presentation only.
const measured=r=>r&&Number.isFinite(r.value)&&['READY','EARLY','ESTIMATE'].includes(r.status);
export function metaPlatformSpend(row){
 if(!measured(row)||row.app!=='ozard'||row.segment!=='Meta'||row.platform!=='All'||row.currency!=='TRY'||!row.notes.startsWith('VERIFIED AMOUNT'))return null;
 const patterns=row.notes.includes('MX iOS ')?{iOS:['MX iOS ([0-9]+\\.[0-9]+)','UK iOS ([0-9]+\\.[0-9]+)'],Android:['Android ([0-9]+\\.[0-9]+)'],Web:['Ozard web ([0-9]+\\.[0-9]+)']}:{iOS:['iOS TRY ([0-9]+\\.[0-9]+)'],Android:['Android TRY ([0-9]+\\.[0-9]+)'],Web:['Ozard web TRY ([0-9]+\\.[0-9]+)']};
 const parts=Object.fromEntries(Object.entries(patterns).map(([p,patterns])=>[p,patterns.map(pattern=>({pattern,value:Number(row.notes.match(new RegExp(pattern))?.[1])}))]));
 if(Object.values(parts).flat().some(x=>!Number.isFinite(x.value))||Math.abs(Object.values(parts).flat().reduce((s,x)=>s+x.value,0)-row.value)>.005)return null;
 return parts;
}
export function knownMediaRows(rows){
 const measuredRows=rows.filter(r=>r.country==='GLOBAL'&&r.metric==='Media Ad Spend Component'&&measured(r)&&r.currency);
 return measuredRows.filter(r=>!measuredRows.some(x=>x.segment===r.segment&&((x.platform==='All')!==(r.platform==='All'))));
}
export function countryPaidScope(rows,platform){
 const total=rows.find(r=>r.metric==='AppsFlyer Paid Installs'&&r.platform===platform&&r.country==='GLOBAL'&&r.segment==='all');
 const countries=rows.filter(r=>r.metric==='AppsFlyer Paid Installs'&&r.platform===platform&&r.country!=='GLOBAL'&&r.segment==='all');
 const reconciled=measured(total)&&countries.length>0&&countries.every(measured)&&countries.reduce((s,r)=>s+r.value,0)===total.value;
 return {total,countries,reconciled};
}
export function googleCountryCpiAllowed(rows,platform){
 const s=countryPaidScope(rows,platform),google=rows.find(r=>r.country==='GLOBAL'&&r.platform===platform&&r.metric==='AppsFlyer Paid Installs Component'&&r.segment==='googleadwords_int');
 return s.reconciled&&s.total.complete===true&&measured(google)&&google.complete===true&&google.value===s.total.value&&google.value>0;
}

export function addEconomicsSection({app,weeks,canonical,ref,add,metric,cell,text,rows,groups}){
 const start=rows.length,subheaders=[],important=[],platformRows=[],networkRows=[];
 const own=w=>canonical.filter(r=>r.appName===app&&r.week===w),get=(w,m,p='All',seg='all')=>own(w).find(r=>r.country==='GLOBAL'&&r.metric===m&&r.platform===p&&r.segment===seg);
 const quote=s=>'"'+String(s).replaceAll('"','""')+'"',money=(expr,currency='TRY')=>`"${currency==='TRY'?'₺':currency==='USD'?'$':currency+' '}"&TEXT(${expr},"#,##0.00")`;
 const term=r=>({value:r.value,currency:r.currency,expression:ref(r),row:r});
 const costs=(w,p='All')=>knownMediaRows(own(w)).flatMap(r=>{
  if(p==='All'||r.platform===p)return [term(r)];
  const split=metaPlatformSpend(r);if(!split?.[p])return [];
  const extract=x=>`VALUE(REGEXEXTRACT(${ref(r,'X')},${quote(x.pattern)}))`,all=Object.values(split).flat().map(extract).join('+');
  return [{value:split[p].reduce((s,x)=>s+x.value,0),currency:r.currency,row:r,expression:`IF(ABS((${all})-${ref(r)})<0.005,${split[p].map(extract).join('+')},NA())`}];
 });
 const sum=ts=>ts.length&&new Set(ts.map(t=>t.currency)).size===1?ts.map(t=>t.expression).join('+'):null;
 const paid=(w,p)=>p==='All'?['iOS','Android'].map(p=>get(w,'AppsFlyer Paid Installs',p)):[get(w,'AppsFlyer Paid Installs',p)];
 const paidExpr=rs=>rs.length&&rs.every(measured)&&rs.every(r=>r.definition===rs[0].definition&&r.sourceTimezone===rs[0].sourceTimezone&&r.unit===rs[0].unit)?rs.map(r=>ref(r)).join('+'):null;
 const formula=(f,opts={})=>cell(f||'—',{formula:!!f,...opts});
 const sub=s=>{subheaders.push(rows.length);add(s,'','',()=>text(''));};
 sub('PAZARTESİ ÖN SONUÇ · ilk açılış esaslı install, mağaza indirmesi değil');
 for(const p of ['iOS','Android'])metric('Toplam install · AppsFlyer','AppsFlyer Installs',p);
 add('Toplam install · AppsFlyer','Genel','adet',w=>{const rs=['iOS','Android'].map(p=>get(w,'AppsFlyer Installs',p));const e=paidExpr(rs);return formula(e&&rs.every(r=>r.complete===true)?'='+e:null,{caution:true});});
 for(const p of ['All','iOS','Android','Web']){
  if(p==='Web'&&!weeks.some(w=>costs(w,p).length))continue;
  platformRows.push({row:rows.length,platform:p});important.push(rows.length);
  add('Bilinen medya · paid installs',p==='All'?'Genel':p,'',w=>{
   const ts=costs(w,p),s=sum(ts),ps=p==='Web'?[]:paid(w,p),pe=paidExpr(ps);
   if(!s&&!pe)return text('—');
   const spend=s?money(s,ts[0].currency):quote('Veri alınamadı'),installs=pe?`${quote(ps.some(r=>r.complete!==true)?'≥':'')}&TEXT(${pe},"#,##0")`:quote(p==='Web'?'OS’a dağıtılmadı':'Veri alınamadı');
   return formula(`="Harcama: "&${spend}&CHAR(10)&"${p==='Web'?'Kapsam':'Paid install'}: "&${installs}`,{caution:true});
  });
 }
 metric('UGC · taban tahakkuk tahmini','UGC Estimated Accrued Cost');
 add('Bilinen marketing · medya + UGC tabanı','Genel','',w=>{const ts=costs(w),u=get(w,'UGC Production Cost'),estimate=get(w,'UGC Estimated Accrued Cost'),ugc=measured(u)&&u.complete===true?u:measured(estimate)?estimate:null;if(ugc)ts.push(term(ugc));const s=sum(ts);return formula(s?'='+money(s,ts[0].currency)+(ugc?'':`&" · UGC eksik"`):null,{caution:true});});
 metric('Business CPI · tam maliyet / store download','CPI');
 sub('AĞ CPI = o ağın harcaması ÷ o ağdan gelen paid install');
 const networkSource={'Google Ads':'googleadwords_int',Meta:'Facebook Ads','Apple Ads':'Apple Search Ads'};
 for(const network of Object.keys(networkSource))for(const p of ['iOS','Android']){
  const applicable=weeks.some(w=>{const install=get(w,'AppsFlyer Paid Installs Component',p,networkSource[network]);return install?.value>0||costs(w,p).some(t=>t.row.segment===network);});
  if(!applicable)continue;networkRows.push(rows.length);
  add(network+' · dönemsel CPI¹',p,'',w=>{
   const ts=costs(w,p).filter(t=>t.row.segment===network),s=sum(ts),n=get(w,'AppsFlyer Paid Installs Component',p,networkSource[network]);
   if(!s&&!measured(n))return text('—');
   const sp=s?money(s,ts[0].currency):quote('Veri alınamadı'),ip=measured(n)?`TEXT(${ref(n)},"#,##0")`:quote('—');
   const ratio=s&&measured(n)&&n.value>0?money(`(${s})/${ref(n)}`,ts[0].currency):quote(!s?'Harcama eksik':!measured(n)?'Install verisi eksik':'0 install · hesaplanmaz');
   return formula(`="Harcama: "&${sp}&CHAR(10)&"Paid install: "&${ip}&CHAR(10)&"CPI: "&${ratio}`,{caution:!!s});
  });
 }
 if(app==='EasySpell'){networkRows.push(rows.length);add('Google Ads · iki platform toplamı¹','Genel','',w=>{
  const ts=['iOS','Android'].flatMap(p=>costs(w,p).filter(t=>t.row.segment==='Google Ads')),rs=['iOS','Android'].map(p=>get(w,'AppsFlyer Paid Installs Component',p,'googleadwords_int')),s=sum(ts),p=paidExpr(rs);
  return formula(ts.length===2&&s&&p&&rs.reduce((n,r)=>n+r.value,0)>0?`="Harcama: "&${money(s,ts[0].currency)}&CHAR(10)&"Paid install: "&TEXT(${p},"#,##0")&CHAR(10)&"CPI: "&${money(`(${s})/(${p})`,ts[0].currency)}`:null,{caution:true});
 });}
 sub('¹ Ağ CPI: dönemsel oran · takvimler farklı. ≥ = en az');
 sub('PAID INSTALL ÜLKELERİ · iOS / Android / Toplam');
 const latest=[...weeks].reverse().find(w=>['iOS','Android'].every(p=>countryPaidScope(own(w),p).reconciled));
 const rank=new Map();for(const r of own(latest).filter(r=>r.metric==='AppsFlyer Paid Installs'&&r.country!=='GLOBAL'&&r.value>0))rank.set(r.country,(rank.get(r.country)||0)+r.value);
 const top=[...rank].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,5).map(([c])=>c),names=new Intl.DisplayNames(['tr'],{type:'region'});
 const countryLabel=c=>c==='UNKNOWN'?'Bilinmeyen ülke':names.of(c==='UK'?'GB':c)+' · '+c;
 function countryLine(code,rest=false){
  add(rest?'Diğer ülkeler':countryLabel(code),'iOS / And. / Σ','paid',w=>{
   const scopes=['iOS','Android'].map(p=>countryPaidScope(own(w),p));if(scopes.some(s=>!s.reconciled))return text('—');
   const selected=scopes.map(s=>s.countries.filter(r=>rest?!top.includes(r.country):r.country===code));
   const partial=selected.map(rs=>rs.some(r=>r.complete!==true)),exprs=selected.map(rs=>rs.length?rs.map(r=>ref(r)).join('+'):'0');
   return formula('='+exprs.map((e,i)=>`${quote(partial[i]?'≥':'')}&TEXT(${e},"#,##0")`).join('&" / "&')+`&" / "&${quote(partial.some(Boolean)?'≥':'')}&TEXT((${exprs[0]})+(${exprs[1]}),"#,##0")`,{caution:partial.some(Boolean)});
  });
 }
 for(const c of top)countryLine(c);if(top.length)countryLine('',true);
 sub('＋ Diğer ülkeler · ağ harcamaları · kapsam');const detailStart=rows.length;
 const all=[...new Set(canonical.filter(r=>r.appName===app&&r.metric==='AppsFlyer Paid Installs'&&r.country!=='GLOBAL'&&r.value>0).map(r=>r.country))].filter(c=>!top.includes(c)).sort();for(const c of all)countryLine(c);
 // Country CPI is available only when every paid install in that platform is Google.
 const geoCosts=canonical.filter(r=>r.appName===app&&r.metric==='Media Ad Spend Component'&&r.segment==='Google Ads'&&r.country!=='GLOBAL'&&measured(r));
 for(const p of ['iOS','Android'])if(weeks.some(w=>googleCountryCpiAllowed(own(w),p)))for(const c of [...new Set(geoCosts.filter(r=>r.platform===p).map(r=>r.country))].sort()){
  networkRows.push(rows.length);add('Google · '+countryLabel(c)+' · CPI¹',p,'',w=>{
   if(!googleCountryCpiAllowed(own(w),p))return text('—');const cost=geoCosts.find(r=>r.week===w&&r.platform===p&&r.country===c),sc=countryPaidScope(own(w),p),n=sc.countries.find(r=>r.country===c);
   if(!measured(cost))return text('—');const number=n?ref(n):'0',ratio=n?.value>0?money(`${ref(cost)}/${number}`,cost.currency):quote('0 install · hesaplanmaz');
   return formula(`="Harcama: "&${money(ref(cost),cost.currency)}&CHAR(10)&"Paid install: "&TEXT(${number},"#,##0")&CHAR(10)&"CPI: "&${ratio}`,{caution:true});
  });
 }
 for(const r of [...new Map(canonical.filter(r=>r.appName===app&&r.metric==='Media Ad Spend Component'&&r.country==='GLOBAL').map(r=>[[r.platform,r.segment].join('|'),r])).values()])metric(r.segment+' · kaynak harcama',r.metric,r.platform,r.segment);
 metric('Media Spend · tam kapsam','Media Ad Spend');metric('UGC Cost · kesinleşmiş','UGC Production Cost');metric('Total Acquisition Spend · tam kapsam','Total Acquisition Spend');metric('Paid Media CPI · tam kapsam','Paid Media CPI');
 add('Kapsam notu','Genel','',w=>own(w).length?text(app==='Ozard'?'≥ paid: sınıflanmamış kaynaklar var. Web harcaması OS’a bölünmedi. Ülke tutarları gerçek geo verisidir; kampanya adı kullanılmadı.':'Apple Ads install’ları toplamda var; harcaması eksik. Google CPI yalnız Google install’larıyla.'):text('—'));
 groups.push({start:detailStart,end:rows.length});
 return {start,end:rows.length,subheaders,important,platformRows,networkRows,detailStart};
}

export function economicsStyles(sheetId,layout,width){
 const requests=[],r=(start,end= start+1)=>({sheetId,startRowIndex:start,endRowIndex:end,startColumnIndex:0,endColumnIndex:width});
 for(const row of layout.subheaders)requests.push({mergeCells:{range:{...r(row),endColumnIndex:3},mergeType:'MERGE_ALL'}},{repeatCell:{range:r(row),cell:{userEnteredFormat:{backgroundColor:{red:.92,green:.95,blue:.97},textFormat:{fontFamily:'Arial',fontSize:9,bold:true},wrapStrategy:'WRAP'}},fields:'userEnteredFormat(backgroundColor,textFormat,wrapStrategy)'}},{updateDimensionProperties:{range:{sheetId,dimension:'ROWS',startIndex:row,endIndex:row+1},properties:{pixelSize:26},fields:'pixelSize'}});
 for(const {row,platform}of layout.platformRows)requests.push({repeatCell:{range:r(row),cell:{userEnteredFormat:{textFormat:{fontFamily:'Arial',fontSize:10,bold:true},wrapStrategy:'WRAP'}},fields:'userEnteredFormat(textFormat,wrapStrategy)'}},{repeatCell:{range:{...r(row),endColumnIndex:3},cell:{userEnteredFormat:{backgroundColor:platform==='Android'?{red:.90,green:.95,blue:.93}:{red:.91,green:.94,blue:.98}}},fields:'userEnteredFormat.backgroundColor'}},{updateDimensionProperties:{range:{sheetId,dimension:'ROWS',startIndex:row,endIndex:row+1},properties:{pixelSize:40},fields:'pixelSize'}});
 for(const row of layout.networkRows)requests.push({repeatCell:{range:{...r(row),startColumnIndex:3},cell:{userEnteredFormat:{textFormat:{fontFamily:'Arial',fontSize:9,bold:false},wrapStrategy:'WRAP',verticalAlignment:'MIDDLE'}},fields:'userEnteredFormat(textFormat,wrapStrategy,verticalAlignment)'}},{updateDimensionProperties:{range:{sheetId,dimension:'ROWS',startIndex:row,endIndex:row+1},properties:{pixelSize:54},fields:'pixelSize'}});
 return requests;
}
