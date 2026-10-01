// One explicitly approved W37 extension. This module is not called by normal
// collection/finalization and cannot authorize corrections to another week.
import {metric,windowFromStart} from './core.mjs';
import {warehouseRows} from './meeting.mjs';
import {notionProperties,propertiesMatch} from './notion.mjs';
import {weekManifest,propertyText,exclusions} from './week-lifecycle.mjs';
export const W37='2026-09-07';
export const CORRECTION_ID='W37-2026-mature-funnel-v1';
export const BASE_HASH='c64ad03e9b210c138338bd764b6cdefeb79ef7cbb50a18597fa23b0c35169695';
export const ARCHIVE_ID='3dc2cad5-82de-8155-8c2b-c4a0062006b0';
export function correctionRows(pages,audit){
 if(audit.week!==W37||audit.canonicalHash!==BASE_HASH||audit.results?.length!==2)throw Error('Unapproved mature audit scope');
 const expected={iOS:[430,212,21,12],Android:[964,691,79,4]},rows=warehouseRows(pages,W37),out=[];
 for(const platform of ['iOS','Android']){
  const a=audit.results.find(x=>x.platform===platform),n=a?.counts,reach=rows.find(r=>r.appName==='Ozard'&&r.platform===platform&&r.metric==='Paywall Reach'&&r.segment==='all'&&r.country==='GLOBAL');
  if(!a?.canonicalBaseMatches||!a.allCohortEventLinks?.completeLinks||JSON.stringify([n?.firstOpen,n?.paywallViewed,n?.checkoutStarted,n?.clientAck])!==JSON.stringify(expected[platform])||reach?.semantics?.denominator!==n.firstOpen||reach?.semantics?.numerator!==n.paywallViewed||!reach.notes.includes('Observation cutoff '+a.observationCutoff+'.'))throw Error('Mature cohort proof / canonical base mismatch');
  const base={pillar:'Monetization',source:reach.source,sourceAccount:reach.sourceAccount,sourceTimezone:reach.calendar,sourceUrl:'https://mixpanel.com/project/'+reach.sourceAccount+'/app/home',population:reach.semantics.population,unit:'ratio',definition:'mature_first_open_7d_journey_v1',complete:true,status:'EARLY'};
  const immature=reach.notes.match(/immature (\d+)/)?.[1];if(!immature)throw Error('Canonical maturity exclusions absent');
  const notes=`Explicit one-time W37 manual correction ${CORRECTION_ID}. Observation cutoff ${a.observationCutoff}. Same mature first-open cohort: firstOpen=${n.firstOpen}; paywall=${n.paywallViewed}; checkout=${n.checkoutStarted}; clientAck=${n.clientAck}. Each identity observed in [first-open, first-open + 7 days), fully elapsed at cutoff. Same raw distinct_id + exact paywall_view_id; client ack requires matching nonempty purchase_attempt_id and chronological order. Missing view/attempt IDs and unlinked payment events: 0. immature ${immature} excluded. Allowlisted clean release/build only; tester/public rollout coverage not fully verified. Product acknowledgements only; no RevenueCat temporal join.`;
  for(const [name,numerator,denominator]of [['Mature Cohort Paywall → Checkout',n.checkoutStarted,n.paywallViewed],['Mature Cohort Checkout → Client Ack',n.clientAck,n.checkoutStarted]])out.push(metric(windowFromStart(W37),{key:'ozard',name:'Ozard'},name,platform,{...base,value:numerator/denominator,numerator,denominator,notes}));
 }
 return out;
}
export function verifyCorrectionExtension(before,after,planned){
 if(weekManifest(before,W37).sourceFingerprint!==BASE_HASH||planned.length!==4)throw Error('Unapproved baseline / extension size');
 const baseline=new Map(before.map(p=>[p.id,p])),current=new Map(after.map(p=>[p.id,p]));
 // Compare every property and edit timestamp of existing rows, including fields
 // normally excluded from the FINAL calculation manifest.
 for(const [id,p]of baseline){const a=current.get(id);if(!a||JSON.stringify(p.properties)!==JSON.stringify(a.properties)||p.last_edited_time!==a.last_edited_time||p.archived!==a.archived)throw Error('Existing canonical row changed during correction');}
 const added=after.filter(p=>!baseline.has(p.id)),keys=new Set();
 for(const p of added){const key=propertyText(p.properties['Row Key']),r=planned.find(r=>r.id===key);if(!r||keys.has(key)||!propertiesMatch(p.properties,notionProperties(r,W37)))throw Error('Unexpected / duplicate correction row');keys.add(key);}
 return {complete:added.length===4,added:added.length};
}
export function correctedLifecycle(state,pages,planned,now=new Date().toISOString()){
 const old=state.weeks[W37];
 if(old?.correctionId===CORRECTION_ID){if(old.sourceFingerprint!==weekManifest(pages,W37).sourceFingerprint)throw Error('Correction already consumed; canonical drift');return state;}
 if(old?.status!=='FINAL'||old.sourceFingerprint!==BASE_HASH||old.snapshot?.status!=='VERIFIED'||old.snapshot.pageId!==ARCHIVE_ID)throw Error('Unexpected finalized baseline');
 const oldKeys=new Set(Object.keys(old.rowHashes)),original=pages.filter(p=>oldKeys.has(propertyText(p.properties['Row Key'])));
 if(weekManifest(original,W37).sourceFingerprint!==BASE_HASH)throw Error('Original FINAL values changed');
 const added=pages.filter(p=>p.properties.Week?.date?.start===W37&&!oldKeys.has(propertyText(p.properties['Row Key'])));
 if(added.length!==4||new Set(added.map(p=>propertyText(p.properties['Row Key']))).size!==4||added.some(p=>!planned.some(r=>r.id===propertyText(p.properties['Row Key'])&&propertiesMatch(p.properties,notionProperties(r,W37)))))throw Error('Incomplete or unexpected FINAL extension');
 const next=structuredClone(state);
 next.weeks[W37]={...old,mode:'MANUAL_CORRECTION',correctionId:CORRECTION_ID,reason:'Explicit user approval: add four verified mature-cohort derived rows, promote primary Ozard funnel, rebuild and relock W37 once. Existing 454 rows unchanged; W38+ normal FINAL immutability.',finalizedAt:now,...weekManifest(pages,W37),exclusions:exclusions(pages,W37),manualCorrections:[...(old.manualCorrections||[]),{correctionId:old.correctionId,finalizedAt:old.finalizedAt,sourceFingerprint:old.sourceFingerprint,snapshot:old.snapshot}],snapshot:{pageId:ARCHIVE_ID,status:'BUILDING',capturedAt:now,replaceAuthorized:true}};
 return next;
}
