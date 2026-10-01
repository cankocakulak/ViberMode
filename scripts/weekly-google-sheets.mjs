import fs from 'node:fs';
import path from 'node:path';
import {loadEnvFile,notionTokenState} from './store-downloads-to-notion.mjs';
import {writePrivate} from './growth-scorecard/core.mjs';
import {readLifecycle} from './growth-scorecard/week-lifecycle.mjs';
import {buildWeeklySheets} from './growth-scorecard/google-sheets.mjs';

const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const config=JSON.parse(fs.readFileSync('.growth-scorecard.local.json'));
const stateFile=arg('--sheet-state');if(!stateFile)throw Error('--sheet-state needs fresh Sheets metadata, including merges and rowGroups');
const sheetState=JSON.parse(fs.readFileSync(stateFile));
const out=arg('--output','tmp/weekly-sheets-refresh'),input=arg('--warehouse');
let pages;
if(input)pages=JSON.parse(fs.readFileSync(input));
else {
 config.envFiles.forEach(loadEnvFile);const token=notionTokenState({}).token;if(!token)throw Error('Notion credential unavailable');
 pages=[];let cursor;
 do {
  let data;
  for(let attempt=0;attempt<4;attempt++){
   const response=await fetch('https://api.notion.com/v1/data_sources/'+config.notion.dataSourceId+'/query',{method:'POST',headers:{Authorization:'Bearer '+token,'Notion-Version':'2025-09-03','Content-Type':'application/json'},body:JSON.stringify({page_size:100,...(cursor?{start_cursor:cursor}:{})}),signal:AbortSignal.timeout(60000)});
   if(response.status===429){await new Promise(r=>setTimeout(r,2000));continue;}
   if(!response.ok)throw Error('Canonical readback HTTP '+response.status);
   data=await response.json();break;
  }
  if(!data)throw Error('Canonical readback retry exhausted');
  pages.push(...data.results);cursor=data.has_more?data.next_cursor:null;
 }while(cursor);
}
const output=buildWeeklySheets(pages,config,readLifecycle(config),{sheetState,asOf:arg('--as-of')||new Date()});
writePrivate(path.join(out,'warehouse.local.json'),pages);
for(const [i,b]of output.batches.entries())writePrivate(path.join(out,`batch-${String(i).padStart(2,'0')}.local.json`),b);
writePrivate(path.join(out,'plan.local.json'),{...output.plan,batches:output.batches.map((b,i)=>({i,kind:b.kind,requests:b.requests.length})),preparedAt:new Date().toISOString()});
console.log(JSON.stringify({out,weeks:output.plan.weeks,sourceRows:output.plan.sourceRows,batches:output.batches.length}));
