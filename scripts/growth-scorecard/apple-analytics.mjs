import {request,numeric,safeError} from './core.mjs';
import {parseDelimited,decompressMaybe} from '../store-downloads-to-notion.mjs';
// Replace the whole Date partition with the newest processingDate. Corrections
// and requests are alternatives, never additive batches of the same date.
export function applePageViews(batches,week,appId){
 const relevant=batches.map(b=>({...b,rows:b.rows.filter(r=>r.Date===week.start&&r['App Apple Identifier']===appId)})).filter(b=>b.rows.length).sort((a,b)=>b.processingDate.localeCompare(a.processingDate));
 if(!relevant.length)return null;
 const latest=relevant[0];if(relevant.filter(b=>b.processingDate===latest.processingDate).length>1)throw new Error('Ambiguous same-date report instances');
 const matched=latest.rows.filter(r=>r.Event==='Page view'&&r['Page Type']==='Product page');
 if(!matched.length||!matched.every(r=>numeric(r.Counts)!==null&&Number(r.Counts)>=0))return null;
 return {value:matched.reduce((s,r)=>s+Number(r.Counts),0),processingDate:latest.processingDate};
}
export async function readApplePageViews(owner,app,week){
 try{
  const token=owner?.analyticsToken||(owner?.analyticsAuth==='env'?owner.salesToken:owner?.token);if(!token)throw new Error();
  const list=async url=>{const all=[];do{const d=await request(url,{headers:{Authorization:'Bearer '+token}});all.push(...d.data);url=d.links?.next;}while(url);return all;};
  const root='https://api.appstoreconnect.apple.com/v1/';
  const requests=await list(root+'apps/'+app.iosAppleId+'/analyticsReportRequests?limit=200');
  const active=requests.filter(r=>!r.attributes?.stoppedDueToInactivity).sort((a,b)=>(a.attributes?.accessType==='ONGOING'?-1:1)-(b.attributes?.accessType==='ONGOING'?-1:1));
  for(const req of active){
   const reports=await list(root+'analyticsReportRequests/'+req.id+'/reports?limit=200');
   const report=reports.filter(r=>r.attributes?.name==='App Store Discovery and Engagement Standard');if(report.length!==1)continue;
   const instances=await list(root+'analyticsReports/'+report[0].id+'/instances?filter%5Bgranularity%5D=WEEKLY&limit=200');
   const batches=[];
   for(const instance of instances.filter(i=>i.attributes?.processingDate>=week.end)){
    const segments=await list(root+'analyticsReportInstances/'+instance.id+'/segments?limit=200');if(!segments.length)continue;
    const rows=[];for(const segment of segments){if(!segment.attributes?.url)throw new Error();const buffer=await request(segment.attributes.url,{binary:true});rows.push(...parseDelimited(decompressMaybe(buffer),'\t'));}
    batches.push({processingDate:instance.attributes.processingDate,rows});
   }
   const result=applePageViews(batches,week,app.iosAppleId);if(result)return {...result,status:'EARLY',complete:true,notes:'Complete weekly standard Discovery and Engagement report; latest processing-date replacement partition, all segments. Counts for Event=Page view and Page Type=Product page; not summed unique users. Provider calendar remains unverified for Istanbul normalization.'};
  }
  return {value:null,status:'WAITING',complete:false,notes:active.length?'Analytics access verified; existing active report request found, but no compatible complete weekly Discovery and Engagement partition is available. This read-only collector did not create a report request.':requests.length?'Only inactive Analytics report requests found for this app/account. Report provisioning needs review; this read-only collector did not create a request.':'No Analytics report request available for this app/account. One-time provisioning needs review; this read-only collector did not create a request.'};
 }catch(e){return {value:null,status:'WAITING',complete:false,notes:'Analytics report read: '+safeError(e)};}
}
