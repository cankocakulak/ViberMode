// Scope explanations only; never relax aggregation or comparison eligibility.
export function usageScopeNote(rows,app){
 const hasUsers=platform=>rows.some(r=>r.appName===app&&r.country==='GLOBAL'&&r.platform===platform&&r.metric==='Weekly Active Users'&&Number.isFinite(r.value)&&['READY','EARLY'].includes(r.status));
 if(hasUsers('iOS')&&hasUsers('Android'))return 'iOS and Android are calculated separately from compatible production identity clusters. Cross-platform users are not deduplicated; a platform sum is withheld because coverage/population compatibility is incomplete.';
 if(app==='EasySpell')return 'EasySpell iOS provides aggregate event counts, not unique-user counts. Android unique users are shown separately; an app-wide user total is unavailable.';
 return 'Available platform identity counts are shown separately. A compatible cross-platform total is unavailable.';
}
export function completedCohortPopulationNote(row,historicalRows=[]){
 const c=row.semantics?.cohort;if(!c)return '';
 if(c.populationRevision?.summary)return c.populationRevision.summary;
 const parse=p=>{try{return JSON.parse(p);}catch{return {};}};
 const current=parse(row.semantics?.population),prior=historicalRows.find(r=>r.week===c.start&&r.appName===row.appName&&r.platform===row.platform&&r.metric==='Paywall Reach'&&r.country==='GLOBAL');
 const previous=parse(prior?.semantics?.population),oldVersions=previous.versions||previous.builds?.map(b=>b.version)||[];
 if(!oldVersions.length||!current.builds?.some(b=>!oldVersions.includes(b.version)))return '';
 return `Completed ${c.start} — ${c.end} cohort was recomputed in report week ${row.week} using the now-validated production build set (${current.builds.map(b=>b.version+' / '+b.build).join(', ')}). Its population differs from the frozen acquisition-week scope (${oldVersions.join(', ')}). The frozen operating snapshot remains unchanged.`;
}
export function topMarkets(rows,app){
 const eligible=metric=>rows.filter(r=>r.appName===app&&r.platform==='iOS'&&r.metric===metric&&!['GLOBAL','UNKNOWN'].includes(r.country)&&r.country&&Number.isFinite(r.value)&&r.value>0&&['READY','EARLY'].includes(r.status)).sort((a,b)=>b.value-a.value||a.country.localeCompare(b.country));
 let selected=eligible('Store Downloads'),by='observed first-time downloads';if(!selected.length){selected=eligible('AppsFlyer Paid Installs');by='observed AppsFlyer attributed installs';}
 return {rows:selected,by,caveat:selected.some(r=>!r.semantics?.complete)?'Observed country ranking; coverage / paid-source classification is incomplete. Not a complete country market-share estimate.':''};
}
export function refreshInfrastructureNotes(notes){return notes.replace(/Existing API blocker: (?=Analytics report read: HTTP 403)/g,'')
 .replace(/Analytics report read: HTTP 403[^.\n]*(?:\.|(?=\n)|$)/g,'Apple reporting access verified on 2026-09-21; compatible period availability remains the constraint.')
 .replace(/GCS service-account object reads HTTP 403[^.\n]*(?:\.|(?=\n)|$)/g,'Current GCS account access verified on 2026-09-21; current export freshness/partition availability remains the constraint.');}
