import test from 'node:test';import assert from 'node:assert/strict';
import {metaPlatformSpend,knownMediaRows,countryPaidScope,googleCountryCpiAllowed} from '../scripts/growth-scorecard/sheets-economics.mjs';
const base={app:'ozard',platform:'All',segment:'Meta',currency:'TRY',status:'EARLY',metric:'Media Ad Spend Component',country:'GLOBAL'};
test('Meta platform costs require explicit proof and reconcile to source total without allocating web',()=>{
 const r={...base,value:16350.97,notes:'VERIFIED AMOUNT Sep 14–20: MX iOS 4325.31 + UK iOS 7774.67 + Android 874.08 + Ozard web 3376.91 = TRY 16350.97'};
 const a=metaPlatformSpend(r);assert.equal(a.iOS.reduce((s,r)=>s+r.value,0),12099.98);assert.equal(a.Web[0].value,3376.91);
 assert.equal(metaPlatformSpend({...r,value:16351}),null);assert.equal(metaPlatformSpend({...r,notes:'campaign name iOS'}),null);
});
test('overlapping app and OS spend are not double counted',()=>{
 const r=[{...base,value:50},{...base,platform:'iOS',value:50}];assert.deepEqual(knownMediaRows(r),[]);
});
const paid=(p,v,c='GLOBAL')=>({metric:'AppsFlyer Paid Installs',platform:p,country:c,segment:'all',value:v,status:'EARLY',complete:true});
test('country CPI rejects mixed-network installs and incomplete geo totals',()=>{
 const r=[paid('iOS',89),paid('iOS',84,'US'),paid('iOS',5,'MX'),{...paid('iOS',27),metric:'AppsFlyer Paid Installs Component',segment:'googleadwords_int'}];
 assert.equal(countryPaidScope(r,'iOS').reconciled,true);assert.equal(googleCountryCpiAllowed(r,'iOS'),false);
 r.at(-1).value=89;assert.equal(googleCountryCpiAllowed(r,'iOS'),true);r[1].value=83;assert.equal(googleCountryCpiAllowed(r,'iOS'),false);
});
