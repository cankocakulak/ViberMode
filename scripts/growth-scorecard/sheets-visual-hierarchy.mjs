// Numeric cells and formulas stay numeric; hierarchy is a presentation overlay.
export function sheetVisualHierarchy(sheetId,rows){
 const width=rows[0].values.length,requests=[];
 const text=c=>c?.formattedValue??c?.userEnteredValue?.stringValue??'';
 const color=h=>({red:parseInt(h.slice(0,2),16)/255,green:parseInt(h.slice(2,4),16)/255,blue:parseInt(h.slice(4,6),16)/255});
 const range=(r,c=0,end=width)=>({sheetId,startRowIndex:r,endRowIndex:r+1,startColumnIndex:c,endColumnIndex:end});
 const format=(r,style,fields,c=0,end=width)=>requests.push({repeatCell:{range:range(r,c,end),cell:{userEnteredFormat:{...style,...(style.textFormat&&fields.split(',').includes('textFormat')?{textFormat:{fontFamily:'Arial',...style.textFormat}}:{})}},fields:fields.split(',').map(f=>'userEnteredFormat.'+f).join(',')}});
 const height=(r,pixelSize)=>requests.push({updateDimensionProperties:{range:{sheetId,dimension:'ROWS',startIndex:r,endIndex:r+1},properties:{pixelSize},fields:'pixelSize'}});
 const label=(r,stringValue)=>requests.push({updateCells:{range:range(r,0,1),rows:[{values:[{userEnteredValue:{stringValue}}]}],fields:'userEnteredValue'}});
 const titles={
  '01  ACQUISITION · STORE':'01  ACQUISITION · STORE',
  '02  ACQUISITION · HARCAMA & CPI':'02  HARCAMA & CPI',
  '03  BÜTÇE · HAFTALIK GİRİŞ BAĞLANTISI':'03  BÜTÇE · PLAN / GERÇEKLEŞEN',
  '04  MONETIZATION · FUNNEL':'04  MONETIZATION · FUNNEL',
  '05  REVENUECAT · FINANCIAL TRUTH':'05  DOĞRULANMIŞ SATIŞ & GELİR',
  '06  RETENTION & USAGE':'06  RETENTION & KULLANIM',
  '07  FEATURE REACH · % WAU':'07  ÖZELLİK KULLANIMI · % WAU',
  '08  iOS AGGREGATE USAGE · PARTIAL':'08  iOS TOPLU KULLANIM · KISMİ',
  '7-DAY ACQUISITION COHORT · İKİ AYRI NÜFUS':'7 GÜNLÜK COHORT · AYRI NÜFUSLAR'
 };
 let platform;
 const steps=['First Open','Onboarding Completed','Paywall Viewed','Checkout Started','Client Ack'];
 const short=['First Open','Onboarding','Paywall','Checkout','Client Ack'];
 for(let r=6;r<rows.length;r++){
  const name=text(rows[r].values[0]),scope=text(rows[r].values[1]);
  if(titles[name]){
   label(r,titles[name]);height(r,30);
   format(r,{backgroundColor:color('314B62'),textFormat:{bold:true,fontSize:10,foregroundColor:color('FFFFFF')}},'backgroundColor,textFormat');
  }
  if(name==='Weekly new-user funnel · aynı nüfus'){
   platform=scope;label(r,'Haftalık yeni kullanıcılar');height(r,30);
   format(r,{backgroundColor:color(platform==='iOS'?'E8EFF8':'E5F1EE'),textFormat:{fontSize:9,bold:true,foregroundColor:color('314B62')}},'backgroundColor,textFormat');
  }
  if(name.endsWith(' · ordered users')){
   const n=steps.indexOf(name.replace(' · ordered users',''));
   if(n>=0){label(r,String(n+1).padStart(2,'0')+' · '+short[n]);height(r,26);
    format(r,{textFormat:{fontSize:11,bold:true,foregroundColor:color('243447')}},'textFormat',0,1);
    format(r,{textFormat:{fontSize:11,bold:true}},'textFormat.fontSize,textFormat.bold',3);
    format(r,{borders:{top:{style:'SOLID',color:color('E5EAF0')}}},'borders.top');
   }
  }
  if(name.includes(' · step conversion')||name.includes(' · cumulative')){
   const step=name.includes(' · step conversion');
   label(r,step?'↓ Önceki adımdan':'↳ İlk açılıştan toplam');height(r,16);
   format(r,{textFormat:{fontSize:9,bold:false,foregroundColor:color('6B7D8E')},wrapStrategy:'CLIP'},'textFormat,wrapStrategy');
   // Muted secondary labels; the exact rates retain their original formula and number format.
   requests.push({repeatCell:{range:range(r,1,3),cell:{userEnteredFormat:{textFormat:{foregroundColor:color('A2ADB8')}}},fields:'userEnteredFormat.textFormat.foregroundColor'}});
  }
  if(name==='Tamamlanan önceki acquisition cohort'){
   label(r,'Tamamlanan 7 günlük cohort');height(r,26);
   format(r,{backgroundColor:color('EDF2F7'),textFormat:{bold:true,fontSize:10}},'backgroundColor,textFormat');
  }
  if(name.startsWith('↳ Tamamlanan cohort · ')){
   label(r,name.replace('↳ Tamamlanan cohort · ','↳ '));height(r,24);
  }
  if(name.startsWith('Bu haftanın olgunlaşmış alt kümesi · ')){
   const stage=name.split(' · ')[1];label(r,(stage==='First Open'?'Olgunlaşan alt küme · ':'↳ ')+stage);height(r,24);
   if(stage==='First Open')format(r,{textFormat:{bold:true},borders:{top:{style:'SOLID',color:color('DDE5EC')}}},'textFormat.bold,borders.top');
  }
  if(name==='iOS product telemetry · partial'){
   label(r,'iOS · Kısmi ürün telemetrisi');height(r,30);
   format(r,{backgroundColor:color('EDF2F7'),textFormat:{fontSize:9,bold:true}},'backgroundColor,textFormat');
  }
  if(name.endsWith(' · tagged events')){
   label(r,name.replace(' · tagged events',' · olay'));height(r,26);
   format(r,{textFormat:{bold:true}},'textFormat.bold',3);
  }
  const key=['Business CPI · tam maliyet / indirme','Total Acquisition Spend · tam kapsam','Bilinen medya harcaması · alt toplam','Bilinen marketing · medya + UGC tabanı','Planlanan bütçe','Doğrulanmış bütçe gerçekleşmesi · tüm kayıtlı satırlar','Bütçe farkı · gerçekleşen − hedef','Store Downloads · uyumlu toplam','WAU','Core Users','Core Value Reach','D1 Retention','D7 Retention'].includes(name)||(['Verified Initial Purchases','Verified Period Revenue'].includes(name)&&scope==='Genel / uyumlu');
  if(key){format(r,{textFormat:{bold:true}},'textFormat.bold');format(r,{textFormat:{fontSize:11}},'textFormat.fontSize',3);}
  if(name==='Bilinen medya harcaması · alt toplam')label(r,'Bilinen medya harcaması');
  if(name==='Bilinen marketing · medya + UGC tabanı')label(r,'Bilinen marketing · UGC tabanı dahil');
  if(name==='Doğrulanmış bütçe gerçekleşmesi · tüm kayıtlı satırlar')label(r,'Doğrulanmış gerçekleşen harcama');
 }
 return requests;
}
