import test from 'node:test';
import assert from 'node:assert/strict';
import {paidInstalls} from '../scripts/growth-scorecard/appsflyer.mjs';
import {projectionScope,projectionWindows,FOLLOWUP_EVENTS} from '../scripts/growth-scorecard/product-export.mjs';
const week={start:'2026-09-21',end:'2026-09-27'};
const row=(source,n,date='2026-09-21')=>({'Media Source (pid)':source,Installs:String(n),Date:date});
test('total first-launch installs include organic and unmapped while paid remains a minimum',()=>{
 const daily=[row('Organic',100),row('googleadwords_int',10),row('website',5)];const r=paidInstalls(daily,week,daily);
 assert.equal(r.total,115);assert.equal(r.organic,100);assert.equal(r.observed,10);assert.equal(r.value,null);
});
test('total installs cannot bypass weekly/daily reconciliation or infer an empty report is zero',()=>{
 assert.throws(()=>paidInstalls([row('Organic',100)],week,[row('Organic',99)]),/totals differ/);
 assert.throws(()=>paidInstalls([],week,[]),/not proof of zero/);
 assert.throws(()=>paidInstalls([row('Organic',1,'2026-09-20')],week,[row('Organic',1)]),/Invalid report shape/);
});
test('zero install is numeric only in a measured nonempty reconciled report',()=>{
 const d=[row('Organic',0)];const r=paidInstalls(d,week,d);assert.equal(r.total,0);assert.equal(r.value,0);
});
test('weekly product scope keeps boundary days and all cohort/retention event families',()=>{
 assert.deepEqual(projectionScope(week),{from:'2026-09-20',through:'2026-09-28'});
 for(const n of ['app_first_opened','session_started','onboarding_completed','paywall_viewed','purchase_started','purchase_completed','note_opened','activity_completed'])assert(FOLLOWUP_EVENTS.includes(n));
});

test('reconciliation partitions never pull all off-week activity across scope boundaries',()=>{
 const windows=projectionWindows(week,new Date('2026-10-01T00:00:00Z')),scope=projectionScope(week),dates=[];
 for(const w of windows){
  assert(!(w.start<scope.from&&w.end>=scope.from));
  assert(!(w.start<=scope.through&&w.end>scope.through));
  for(let d=Date.parse(w.start);d<=Date.parse(w.end);d+=86400000)dates.push(new Date(d).toISOString().slice(0,10));
 }
 assert.equal(dates[0],'2026-09-13');assert.equal(dates.at(-1),'2026-10-01');
 assert.equal(dates.length,19);assert.equal(new Set(dates).size,19);
});
