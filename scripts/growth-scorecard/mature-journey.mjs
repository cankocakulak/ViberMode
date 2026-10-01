// Derive an ordered product funnel from the existing in-memory event export.
// No additional collection, identities on disk, or RevenueCat identity guess.
export function matureJourneyCounts(eligible,byUser){
 const result={firstOpen:eligible.length,paywallViewed:0,checkoutStarted:0,clientAck:0,missingViewIds:0,missingAttemptIds:0,unlinkedCheckoutEvents:0,unlinkedAckEvents:0};
 for(const [id,birth]of eligible){const end=birth+7*86400000,user=(byUser.get(id)||[]).filter(e=>e.properties.time>=birth&&e.properties.time<end),views=user.filter(e=>e.event==='paywall_viewed');if(views.length)result.paywallViewed++;
  const payments=user.filter(e=>['purchase_started','purchase_completed'].includes(e.event)),linkedStarts=new Set(),linkedAcks=new Set();
  result.missingViewIds+=[...views,...payments].filter(e=>!e.properties.paywall_view_id).length;
  result.missingAttemptIds+=payments.filter(e=>!e.properties.purchase_attempt_id).length;
  let checkout=false,ack=false;
  for(const view of views){const p=view.properties;if(!p.paywall_view_id)continue;const journey=user.filter(e=>e.properties.paywall_view_id===p.paywall_view_id&&e.properties.time>=p.time);
   for(const start of journey.filter(e=>e.event==='purchase_started')){checkout=true;linkedStarts.add(start);if(!start.properties.purchase_attempt_id)continue;
    for(const done of journey.filter(e=>e.event==='purchase_completed'&&e.properties.time>=start.properties.time)){if(done.properties.purchase_attempt_id===start.properties.purchase_attempt_id){ack=true;linkedAcks.add(done);}}
   }
  }
  if(checkout)result.checkoutStarted++;if(ack)result.clientAck++;
  result.unlinkedCheckoutEvents+=payments.filter(e=>e.event==='purchase_started'&&!linkedStarts.has(e)).length;
  result.unlinkedAckEvents+=payments.filter(e=>e.event==='purchase_completed'&&!linkedAcks.has(e)).length;
 }
 return {...result,completeLinks:result.missingViewIds===0&&result.missingAttemptIds===0&&result.unlinkedCheckoutEvents===0&&result.unlinkedAckEvents===0};
}
