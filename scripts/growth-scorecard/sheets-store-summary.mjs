// Presentation only: combine canonical-linked store numbers without changing definitions.
export function storeSummaryPresentation(sheetId, rows) {
 const width=rows[0].values.length, start=rows.findIndex(r=>r.values[0]?.userEnteredValue?.stringValue==='01  ACQUISITION · STORE')+1;
 if(start<1)throw Error('Store section missing');
 const original=rows.slice(start,start+15), at=(n,c)=>original[n].values[c];
 const rgb=h=>({red:parseInt(h.slice(0,2),16)/255,green:parseInt(h.slice(2,4),16)/255,blue:parseInt(h.slice(4,6),16)/255});
 const literal=s=>JSON.stringify(s), expr=c=>c?.userEnteredValue?.formulaValue?.slice(1)??(c?.userEnteredValue?.numberValue!=null?String(c.userEnteredValue.numberValue):literal(c?.userEnteredValue?.stringValue||'—'));
 const formatted=(c,pattern='#,##0')=>`IF(ISNUMBER(${expr(c)}),TEXT(${expr(c)},"${pattern}"),"—")`;
 const empty=c=>!c?.userEnteredValue?.formulaValue&&c?.userEnteredValue?.numberValue==null&&(!c?.userEnteredValue?.stringValue||c.userEnteredValue.stringValue==='—');
 const coverage=c=>(c?.userEnteredValue?.stringValue||'').replace('PARTIAL · ','Kısmi ').replace(' gün','').replace('Kaynak dönemi','').replace('—','');
 const days=c=>c?.note?.match(/\| ([^|]+) \|/)?.[1]?.trim()?.replace('PARTIAL · ','Kısmi ').replace(' gün','').replace('Kaynak dönemi','')||'';
 const val=s=>({userEnteredValue:{stringValue:s}});
 const out=[structuredClone(original[0])];
 function summary(label,platform,indices,formula,{height=38,bold=true,missingLabel}={}){
  const values=[val(label),val(platform),val('')];
  for(let c=3;c<width;c++){
   const missing=indices.every(i=>empty(at(i,c))),caution=indices.some(i=>at(i,c)?.userEnteredFormat?.backgroundColor);
   values.push({userEnteredValue:missing?{stringValue:missingLabel&&!empty(at(1,c))?missingLabel:'—'}:{formulaValue:'='+formula(c)},userEnteredFormat:{numberFormat:{type:'TEXT'},horizontalAlignment:'RIGHT',verticalAlignment:'MIDDLE',wrapStrategy:'WRAP',textFormat:{fontFamily:'Arial',fontSize:10,bold},backgroundColor:rgb(missing?'F3F5F7':caution?'FFF4D6':'FFFFFF')}});
  }
  out.push({values});return height;
 }
 summary('App Store CVR · indirme + ön sipariş\n÷ tekil gösterim','iOS',[5,6,7],c=>`${formatted(at(7,c),'0.00%')}&CHAR(10)&${formatted(at(6,c))}&" indirme / "&${formatted(at(5,c))}&" tekil gösterim"`,{missingLabel:'CVR verisi alınamadı'});
 summary('PPV dönem oranı · native CVR değil¹\nFirst Downloads / Product Page Views','iOS',[1,8],c=>{
  const a=coverage(at(3,c)),b=days(at(8,c)),caption=[a?'İnd. '+a:'',b?'PPV '+b:''].filter(Boolean).join(' · ');
  return (empty(at(10,c))?literal('Oran yok · takvimler farklı'):formatted(at(10,c),'0.0%'))+`&CHAR(10)&${formatted(at(1,c))}&" ilk indirme / "&${formatted(at(8,c))}&" PPV"`+(caption?`&CHAR(10)&${literal(caption)}`:'');
 });
 summary('Unique Product Page Views','iOS',[9],c=>formatted(at(9,c)),{height:23,bold:false});
 summary('Play CVR\nListing Acquisitions / Listing Visitors','Android',[12,13],c=>{
  // CVR uses its aligned denominator, not all independently observed visitor days.
  const acq=at(12,c),source=acq.userEnteredValue?.formulaValue;
  const denominator=source?{userEnteredValue:{formulaValue:source.replace(/!N(\d+)/g,'!O$1')}}:val('—');
  const cap=coverage(at(14,c));
  return `${formatted(at(13,c),'0.00%')}&CHAR(10)&${formatted(acq)}&" edinim / "&${formatted(denominator)}&" ziyaretçi"`+(cap?`&CHAR(10)&${literal(cap+' · aynı günler')}`:'');
 });
 summary('Device Downloads · listing’den ayrı','Android',[2],c=>`${formatted(at(2,c))}`+(coverage(at(4,c))?`&" · "&${literal(coverage(at(4,c)))}`:''),{height:26});
 out.push({values:[val('＋ Sayısal detaylar · ¹ eşleşmiş kullanıcı oranı değil'),...Array.from({length:width-1},()=>val(''))]});
 for(const index of [1,5,6,7,8,11,12,13])out.push(structuredClone(original[index]));
 for(const row of out)for(const cell of row.values)delete cell.note;
 if(out.length!==15)throw Error('Store summary must preserve row positions');
 const range={sheetId,startRowIndex:start,endRowIndex:start+15,startColumnIndex:0,endColumnIndex:width};
 const group={sheetId,dimension:'ROWS',startIndex:start+7,endIndex:start+15};
 const requests=[{updateCells:{range,rows:out,fields:'userEnteredValue,userEnteredFormat,note'}},
  {repeatCell:{range:{...range,endRowIndex:start+7},cell:{userEnteredFormat:{textFormat:{fontFamily:'Arial',fontSize:10,foregroundColor:rgb('243447')},verticalAlignment:'MIDDLE',wrapStrategy:'WRAP'}},fields:'userEnteredFormat(textFormat.fontFamily,textFormat.fontSize,textFormat.foregroundColor,verticalAlignment,wrapStrategy)'}},
  {updateDimensionProperties:{range:{sheetId,dimension:'ROWS',startIndex:start,endIndex:start+15},properties:{pixelSize:26},fields:'pixelSize'}}];
 for(const n of [1,2,4])requests.push({updateDimensionProperties:{range:{sheetId,dimension:'ROWS',startIndex:start+n,endIndex:start+n+1},properties:{pixelSize:n===1?42:58},fields:'pixelSize'}});
 for(const [a,b,color]of [[1,4,'E8EFF8'],[4,6,'E5F1EE']])requests.push({repeatCell:{range:{sheetId,startRowIndex:start+a,endRowIndex:start+b,startColumnIndex:0,endColumnIndex:3},cell:{userEnteredFormat:{backgroundColor:rgb(color),textFormat:{bold:true}}},fields:'userEnteredFormat(backgroundColor,textFormat.bold)'}});
 requests.push({repeatCell:{range:{sheetId,startRowIndex:start+6,endRowIndex:start+7,startColumnIndex:0,endColumnIndex:width},cell:{userEnteredFormat:{backgroundColor:rgb('F3F5F7'),textFormat:{fontFamily:'Arial',fontSize:9,foregroundColor:rgb('6B7D8E')}}},fields:'userEnteredFormat(backgroundColor,textFormat)'}},
 {addDimensionGroup:{range:group}},{updateDimensionGroup:{dimensionGroup:{range:group,depth:1,collapsed:true},fields:'collapsed'}},{updateDimensionProperties:{range:group,properties:{hiddenByUser:true},fields:'hiddenByUser'}});
 if(original[0].values.slice(3).every(empty))requests.push({updateDimensionProperties:{range:{sheetId,dimension:'ROWS',startIndex:start,endIndex:start+1},properties:{hiddenByUser:true},fields:'hiddenByUser'}});
 return requests;
}
