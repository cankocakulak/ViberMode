#!/usr/bin/env node
import fs from 'node:fs';
import {loadEnvFile,appStoreConnectToken} from './store-downloads-to-notion.mjs';
import {reportingCredentials} from './growth-scorecard/apple-reporting-auth.mjs';
import {writePrivate,weekWindow} from './growth-scorecard/core.mjs';
const config=JSON.parse(fs.readFileSync('.growth-scorecard.local.json'));for(const f of config.envFiles||[])loadEnvFile(f);
const account=config.appleAccounts.find(a=>a.keychainPrefix==='kantlabs');
const credentials=reportingCredentials(account);
if(!credentials){console.log(JSON.stringify({state:'REPORTING_KEY_NOT_INSTALLED',privateKeyService:account.reportingAuth.privateKeyService,keyIdService:account.reportingAuth.keyIdService}));process.exitCode=2;}
else{
 let token;try{token=appStoreConnectToken(credentials);}catch{console.error('Reporting key cannot sign ES256; no secret printed');process.exit(1);}
 const output={keyId:credentials.ascKeyId,issuer:credentials.ascIssuerId,localReadable:true,checks:[]};
 if(!process.argv.includes('--local')){
  const get=async endpoint=>{const r=await fetch('https://api.appstoreconnect.apple.com/v1/'+endpoint,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});const status=r.status;if(!r.ok){await r.body?.cancel();return {status};}if(endpoint.startsWith('salesReports')){const bytes=(await r.arrayBuffer()).byteLength;return {status,bytes};}return {status,data:await r.json()};};
  const apps=await get('apps?limit=200');output.checks.push({endpoint:'apps',status:apps.status});
  let authorized=apps.status===200;
  for(const id of ['6753729850','6762075035']){const r=await get('apps/'+id);output.checks.push({appId:id,endpoint:'app',status:r.status});authorized&&=r.status===200;}
  if(authorized){
   for(const id of ['6753729850','6762075035']){
    let next='apps/'+id+'/analyticsReportRequests?limit=200',requests=[],status;
    do{const r=await get(next);status=r.status;if(status!==200)break;requests.push(...r.data.data);next=r.data.links?.next?.replace('https://api.appstoreconnect.apple.com/v1/','');}while(next);
    const active=requests.filter(r=>!r.attributes?.stoppedDueToInactivity);
    const reportTypes=[];for(const req of active){let endpoint='analyticsReportRequests/'+req.id+'/reports?limit=200',names=[],reportStatus;do{const r=await get(endpoint);reportStatus=r.status;if(reportStatus!==200)break;names.push(...r.data.data.map(x=>x.attributes.name));endpoint=r.data.links?.next?.replace('https://api.appstoreconnect.apple.com/v1/','');}while(endpoint);reportTypes.push({requestId:req.id,status:reportStatus,names});}
    output.checks.push({appId:id,endpoint:'analyticsReportRequests',status,requests:requests.map(r=>({id:r.id,...r.attributes})),reportTypes,initialization:status!==200?'UNKNOWN_ACCESS_BLOCKED':!active.length?'ADMIN_ONCE_REQUIRED':reportTypes.some(r=>r.status!==200)?'UNKNOWN_REPORT_LIST_BLOCKED':reportTypes.some(r=>r.names.includes('App Store Discovery and Engagement Standard'))?'EXISTING_DISCOVERY_REPORT_CONFIRMED':'ADMIN_REVIEW_RELEVANT_REPORT_TYPE_REQUIRED'});
   }
   const date=process.argv.includes('--date')?process.argv[process.argv.indexOf('--date')+1]:weekWindow().end;
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Invalid report date');
   const query=new URLSearchParams({'filter[frequency]':'DAILY','filter[reportDate]':date,'filter[reportSubType]':'SUMMARY','filter[reportType]':'SALES','filter[vendorNumber]':'94737364','filter[version]':'1_0'});
   const r=await get('salesReports?'+query);output.checks.push({endpoint:'salesReports',vendor:'94737364',date,...r});
  }
  writePrivate('docs/weekly-app-growth/apple-reporting-verification.local.json',output);
 }
 console.log(JSON.stringify(output,null,2));
}
