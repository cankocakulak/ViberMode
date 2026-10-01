import fs from 'node:fs';
import {metric,fingerprint} from './core.mjs';
// IDs are account-scoped. An approved mapping survives only while its observed
// destination set and app identity stay unchanged. Names never assign cost.
export function campaignDestinationProof(id,ads,assets){const collect=rows=>rows.filter(r=>String(r.campaign?.id)===String(id)).flatMap(r=>r.adGroupAd?[...(r.adGroupAd.ad.finalUrls||[]),...(r.adGroupAd.ad.finalMobileUrls||[])]:r.assetGroup?.finalUrls||[]);return [...new Set([...collect(ads),...collect(assets)])].sort();}
export function mapCampaign(customer,campaign,apps,mapping,destinations){
 const s=campaign.appCampaignSetting;for(const app of apps){if(s?.appStore==='APPLE_APP_STORE'&&s.appId===app.iosAppleId)return {app:app.key,platform:'iOS',proof:'configured Apple app ID'};if(s?.appStore==='GOOGLE_APP_STORE'&&s.appId===app.androidPackage)return {app:app.key,platform:'Android',proof:'configured Android package'};}
 const saved=mapping?.campaigns?.find(m=>m.customer===customer&&m.campaignId===String(campaign.id));
 if(!saved||!destinations.length||fingerprint(destinations)!==saved.destinationFingerprint)return {app:null,classification:'shared/unmapped',reason:'No reviewed ID+unchanged destination proof'};
 return {app:saved.app,platform:'All',classification:saved.classification,proof:saved.proof};
}
export function googleMappedRows(config,week,customer,data,ads,assets,mapping){
 const rows=[],campaigns=[...new Map(data.map(r=>[String(r.campaign.id),r.campaign])).values()];
 for(const campaign of campaigns){const selected=data.filter(r=>r.campaign.id===campaign.id),dest=campaignDestinationProof(campaign.id,ads,assets),mapped=mapCampaign(customer,campaign,config.apps,mapping,dest);if(!mapped.app||mapped.platform!=='All')continue;
 const app=config.apps.find(a=>a.key===mapped.app);if(!app)continue;const currency=selected[0].customer.currencyCode,tz=selected[0].customer.timeZone;if(selected.some(r=>r.customer.currencyCode!==currency||r.customer.timeZone!==tz))continue;
 rows.push(metric(week,app,'Media Ad Spend Component','All',{segment:'Google Ads campaign '+campaign.id,value:selected.reduce((s,r)=>s+Number(r.metrics.costMicros)/1e6,0),unit:'money',currency,status:'EARLY',complete:false,source:'Google Ads / reviewed campaign ID + current destinations',sourceAccount:customer,sourceTimezone:tz,definition:'google_mapped_website_campaign_cost_v1',notes:'Deterministic app attribution: '+mapped.proof+'. Exact campaign '+campaign.id+'; no OS allocation. This component alone is not complete total media coverage.'}));
 }
 return rows;
}
export function readGoogleMapping(){try{return JSON.parse(fs.readFileSync('docs/weekly-app-growth/google-campaign-map.json'));}catch{return {campaigns:[]};}}
export function googleCountryRows(config,week,customer,data,geo,geoIds){
 const codes=new Map(geoIds.map(x=>[String(x.geoTargetConstant.id),x.geoTargetConstant.countryCode]));const out=[];
 for(const app of config.apps)for(const platform of ['iOS','Android']){
 const campaignRows=data.filter(r=>platform==='iOS'?r.campaign.appCampaignSetting?.appStore==='APPLE_APP_STORE'&&r.campaign.appCampaignSetting.appId===app.iosAppleId:r.campaign.appCampaignSetting?.appStore==='GOOGLE_APP_STORE'&&r.campaign.appCampaignSetting.appId===app.androidPackage);
 if(!campaignRows.length)continue;const ids=new Set(campaignRows.map(r=>r.campaign.id)),byCountry=new Map();let valid=true;
 for(const id of ids){const total=campaignRows.filter(r=>r.campaign.id===id).reduce((s,r)=>s+Number(r.metrics.costMicros),0),parts=geo.filter(r=>r.campaign.id===id);if(total!==parts.reduce((s,r)=>s+Number(r.metrics.costMicros),0)){valid=false;break;}for(const r of parts){const code=codes.get(String(r.userLocationView.countryCriterionId))||'UNKNOWN';byCountry.set(code,(byCountry.get(code)||0)+Number(r.metrics.costMicros));}}
 if(!valid)continue;for(const[country,micros]of byCountry)out.push(metric(week,app,'Media Ad Spend Component',platform,{country,segment:'Google Ads',value:micros/1e6,status:'EARLY',unit:'money',currency:campaignRows[0].customer.currencyCode,source:'Google Ads user_location_view / country',sourceAccount:customer,sourceTimezone:campaignRows[0].customer.timeZone,definition:'google_app_campaign_cost_v1',complete:true,geoDefinition:'Google Ads actual user location country; not campaign targeting',notes:'Country costs reconcile exactly in micros to each deterministic app campaign. Google component only, not total media coverage. Country omitted from provider becomes UNKNOWN; no targeted-country substitution.'}));
 }return out;
}
