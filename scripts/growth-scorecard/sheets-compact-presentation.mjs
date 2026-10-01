// Presentation-only: existing metric cells and formulas are never replaced.
export function compactSheetPresentation(sheetId,rows) {
 const width=rows[0].values.length,end=rows.length;
 const val=x=>({userEnteredValue:{stringValue:x}});
 const text=c=>c?.formattedValue??c?.userEnteredValue?.stringValue??'';
 const label=r=>text(r.values[0]);
 const shortDate=d=>new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
 const headers=[val('Metrik'),val('Platform'),val('Birim'),...rows[0].values.slice(3).map((c,i)=>{
  const date=text(rows[1].values[i+3]),state=text(rows[2].values[i+3]),hasReport=text(rows[3].values[i+3]).startsWith('Ön veri');
  return val(text(c)+' · '+shortDate(date.slice(0,10))+'–'+shortDate(date.slice(-10))+'\n'+(state==='FINAL'?'Kesinleşti':state==='RECONCILING'||hasReport?'Ön veri':'Hafta açık'));
 })];
 const quality=rows.filter(r=>['Hafta durumu','Karşılaştırma kuralı','Download tarih kapsamı','Listing / CVR tarih kapsamı','Product coverage','Tam maliyet için eksik kapsam'].includes(label(r))).map(r=>({values:r.values.map(c=>({userEnteredValue:c.userEnteredValue||{}}))}));
 const title={values:[val('VERİ DURUMU · Sarı: kısmi / tahmin · Gri: veri yok'),...Array.from({length:width-1},()=>({}))]};
 const qs=end+1,qe=qs+quality.length,range={sheetId,startRowIndex:0,endRowIndex:qe,startColumnIndex:0,endColumnIndex:width};
 const requests=[
  {repeatCell:{range,cell:{},fields:'note'}},
  {updateSheetProperties:{properties:{sheetId,gridProperties:{frozenRowCount:1}},fields:'gridProperties.frozenRowCount'}},
  {updateCells:{range:{...range,endRowIndex:1},rows:[{values:headers}],fields:'userEnteredValue'}},
  {updateDimensionProperties:{range:{sheetId,dimension:'ROWS',startIndex:0,endIndex:1},properties:{pixelSize:40},fields:'pixelSize'}},
  {updateDimensionProperties:{range:{sheetId,dimension:'ROWS',startIndex:1,endIndex:6},properties:{hiddenByUser:true},fields:'hiddenByUser'}},
  {updateCells:{range:{...range,startRowIndex:end},rows:[title,...quality],fields:'userEnteredValue'}},
  {mergeCells:{range:{sheetId,startRowIndex:end,endRowIndex:end+1,startColumnIndex:0,endColumnIndex:3},mergeType:'MERGE_ALL'}},
  {repeatCell:{range:{...range,startRowIndex:end},cell:{userEnteredFormat:{textFormat:{fontFamily:'Arial',fontSize:10},wrapStrategy:'WRAP',verticalAlignment:'MIDDLE'}},fields:'userEnteredFormat(textFormat,wrapStrategy,verticalAlignment)'}},
  {repeatCell:{range:{...range,startRowIndex:end,endRowIndex:qs},cell:{userEnteredFormat:{backgroundColor:{red:.86,green:.90,blue:.94},textFormat:{bold:true}}},fields:'userEnteredFormat(backgroundColor,textFormat.bold)'}},
  {updateDimensionProperties:{range:{sheetId,dimension:'ROWS',startIndex:end,endIndex:qs},properties:{pixelSize:28},fields:'pixelSize'}},
  {updateDimensionProperties:{range:{sheetId,dimension:'ROWS',startIndex:qs,endIndex:qe},properties:{pixelSize:44},fields:'pixelSize'}},
  {addDimensionGroup:{range:{sheetId,dimension:'ROWS',startIndex:qs,endIndex:qe}}},
  {updateDimensionGroup:{dimensionGroup:{range:{sheetId,dimension:'ROWS',startIndex:qs,endIndex:qe},depth:1,collapsed:true},fields:'collapsed'}},
  {updateDimensionProperties:{range:{sheetId,dimension:'ROWS',startIndex:qs,endIndex:qe},properties:{hiddenByUser:true},fields:'hiddenByUser'}}
 ];
 // Keep unknown values visually quiet; amber remains reserved for observed partials/estimates.
 for(let r=6;r<end;r++)for(let c=3;c<width;c++)if(text(rows[r].values[c])==='—'&&!rows[r].values[c].userEnteredValue?.formulaValue)requests.push({repeatCell:{range:{sheetId,startRowIndex:r,endRowIndex:r+1,startColumnIndex:c,endColumnIndex:c+1},cell:{userEnteredFormat:{backgroundColor:{red:.96,green:.97,blue:.98},textFormat:{foregroundColor:{red:.59,green:.62,blue:.66}}}},fields:'userEnteredFormat(backgroundColor,textFormat.foregroundColor)'}});
 const cost=rows.findIndex(r=>label(r)==='Tam maliyet için eksik kapsam');
 if(cost>=0)requests.push({updateDimensionProperties:{range:{sheetId,dimension:'ROWS',startIndex:cost,endIndex:cost+1},properties:{hiddenByUser:true},fields:'hiddenByUser'}});
 return {requests,rowCount:qe};
}
