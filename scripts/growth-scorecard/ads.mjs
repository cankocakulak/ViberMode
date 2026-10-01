import {googleMappedRows,googleCountryRows,readGoogleMapping} from './google-campaign-map.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {metric,keychain,request,numeric,safeError,fingerprint} from './core.mjs';
export async function googleToken(){
 const raw=process.env.GOOGLE_ADS_SERVICE_ACCOUNT_JSON;
 const b64=process.env.GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64||keychain('viberboyz-google-ads-service-account-json-b64');
 const file=process.env.GOOGLE_ADS_JSON_KEY_FILE_PATH||process.env.GOOGLE_ADS_SERVICE_ACCOUNT_PATH;
 const sa=raw?JSON.parse(raw):b64?JSON.parse(Buffer.from(b64,'base64')):file?JSON.parse(fs.readFileSync(file)):null;
 let body;
 if(sa){const now=Math.floor(Date.now()/1000);const enc=v=>Buffer.from(JSON.stringify(v)).toString('base64url');const claim={iss:sa.client_email,scope:'https://www.googleapis.com/auth/adwords',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600};if(process.env.GOOGLE_ADS_IMPERSONATED_EMAIL)claim.sub=process.env.GOOGLE_ADS_IMPERSONATED_EMAIL;
 const unsigned=enc({alg:'RS256',typ:'JWT'})+'.'+enc(claim);const jwt=unsigned+'.'+crypto.sign('RSA-SHA256',Buffer.from(unsigned),sa.private_key).toString('base64url');body=new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt});
 }else{body=new URLSearchParams({grant_type:'refresh_token',client_id:process.env.GOOGLE_ADS_CLIENT_ID||keychain('viberboyz-google-ads-client-id'),client_secret:process.env.GOOGLE_ADS_CLIENT_SECRET||keychain('viberboyz-google-ads-client-secret'),refresh_token:process.env.GOOGLE_ADS_REFRESH_TOKEN||keychain('viberboyz-google-ads-refresh-token')});}
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body,signal:AbortSignal.timeout(30000)});if(!r.ok){const e=new Error();e.status=r.status;throw e;}return(await r.json()).access_token;
}
export function matchGoogleApp(campaign,app,platform){const s=campaign.appCampaignSetting;return platform==='iOS'?s?.appStore==='APPLE_APP_STORE'&&s.appId===app.iosAppleId:s?.appStore==='GOOGLE_APP_STORE'&&s.appId===app.androidPackage;}

// Dated official readbacks supplement existing component rows. They cannot
// create total spend, cross a reporting week, or survive an identity change.
export function applyAdsReadback(rows,config,week,evidence,googleData=[]){
 if(evidence?.week!==week.start||evidence?.end!==week.end||!evidence.observedAt)return rows;
 return rows.map(row=>{
  if(row.metric!=='Media Ad Spend Component'||(row.country||'GLOBAL')!=='GLOBAL')return row;
  const app=config.apps.find(a=>a.key===row.app);
  const e=evidence.components?.find(e=>e.app===row.app&&e.platform===row.platform&&e.network===row.segment);
  if(!e||e.appleId!==app?.iosAppleId||e.package!==app?.androidPackage||!e.sourceAccount||!e.evidence?.length||!Number.isFinite(e.value)||e.value<0)return row;
  if(e.network==='Google Ads'&&(e.sourceAccount!==row.sourceAccount||e.inventoryFingerprint!==fingerprint(googleData)))return row;
  if(e.value>0&&!e.currency)return row;
  return {...row,value:e.value,currency:e.currency||null,status:'EARLY',complete:e.complete===true,source:e.source,sourceAccount:e.sourceAccount,sourceTimezone:e.sourceTimezone,sourceUrl:e.sourceUrl,notes:e.notes};
 });
}
export async function collectAds(config,week){const rows=[];let data=[],mappedRows=[],countryRows=[],error=null;
 const customer=(process.env.GOOGLE_ADS_CUSTOMER_ID||keychain('viberboyz-google-ads-customer-id')||'').replaceAll('-','');
 try{const token=await googleToken();const headers={Authorization:'Bearer '+token,'developer-token':process.env.GOOGLE_ADS_DEVELOPER_TOKEN||keychain('viberboyz-google-ads-developer-token'),'Content-Type':'application/json'};const login=process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID||keychain('viberboyz-google-ads-login-customer-id');if(login)headers['login-customer-id']=login.replaceAll('-','');
 const q=`SELECT customer.currency_code, customer.time_zone, campaign.id, campaign.app_campaign_setting.app_id, campaign.app_campaign_setting.app_store, segments.date, metrics.cost_micros FROM campaign WHERE segments.date BETWEEN '${week.start}' AND '${week.end}'`;
 const chunks=await request(`https://googleads.googleapis.com/${process.env.GOOGLE_ADS_API_VERSION||'v24'}/customers/${customer}/googleAds:searchStream`,{method:'POST',headers,body:{query:q}});data=chunks.flatMap(c=>c.results||[]);
 const audit=async query=>(await request(`https://googleads.googleapis.com/${process.env.GOOGLE_ADS_API_VERSION||'v24'}/customers/${customer}/googleAds:searchStream`,{method:'POST',headers,body:{query}})).flatMap(c=>c.results||[]);
 try{const range=`segments.date BETWEEN '${week.start}' AND '${week.end}' AND metrics.cost_micros > 0`;const [ads,assets]=await Promise.all([audit(`SELECT campaign.id, ad_group_ad.ad.final_urls, ad_group_ad.ad.final_mobile_urls, metrics.cost_micros FROM ad_group_ad WHERE ${range}`),audit(`SELECT campaign.id, asset_group.final_urls, metrics.cost_micros FROM asset_group WHERE ${range}`)]);mappedRows=googleMappedRows(config,week,customer,data,ads,assets,readGoogleMapping());const geo=await audit(`SELECT customer.currency_code, customer.time_zone, campaign.id, user_location_view.country_criterion_id, metrics.cost_micros FROM user_location_view WHERE ${range}`);const ids=[...new Set(geo.map(r=>r.userLocationView.countryCriterionId))].filter(x=>/^\d+$/.test(x));if(ids.length){const geoIds=await audit('SELECT geo_target_constant.id, geo_target_constant.country_code FROM geo_target_constant WHERE geo_target_constant.id IN ('+ids.join(',')+')');countryRows=googleCountryRows(config,week,customer,data,geo,geoIds);}}catch{}
 }catch(e){error=safeError(e);}
 for(const app of config.apps){for(const platform of ['iOS','Android']){
 const matching=data.filter(r=>matchGoogleApp(r.campaign,app,platform));const currencies=new Set(matching.map(r=>r.customer?.currencyCode));const timezones=new Set(matching.map(r=>r.customer?.timeZone));
 const valid=matching.length&&currencies.size===1&&timezones.size===1&&matching.every(r=>numeric(r.metrics?.costMicros)!==null);const timezone=[...timezones][0];
 rows.push(metric(week,app,'Media Ad Spend Component',platform,{segment:'Google Ads',source:'Google Ads SearchStream / campaign.app_campaign_setting identity',sourceAccount:customer,sourceUrl:'https://ads.google.com/aw/campaigns',value:valid?matching.reduce((s,r)=>s+Number(r.metrics.costMicros)/1e6,0):null,unit:'money',currency:[...currencies][0]||null,status:valid?(timezone===week.timezone?'READY':'EARLY'):'WAITING',sourceTimezone:timezone,definition:'google_app_campaign_cost_v1',notes:error||(valid?'AMOUNT: deterministic app ID + app store cost. ':'UNKNOWN total Google spend: no matching app-campaign spend in this account (verified zero for direct app campaigns only). ' )+'Native account timezone. Additional website/Search costs are published as separate app-level components only when a reviewed account/campaign ID mapping agrees with current destination proof. Shared or unreviewed destinations are not allocated by campaign names or attributed-install proportions. Other account coverage is not proven complete. Direct app-campaign absence cannot prove total Google zero.'}));
 }
 rows.push(metric(week,app,'Media Ad Spend','All',{source:'Ad platforms / coverage reconciliation',unit:'money',notes:'Complete network coverage is not established. Verified Google/Meta/TikTok components appear separately; unknown AppLovin and Apple Ads spend and unclosed Meta account coverage block total. Partial account spend is never substituted for app total.'}));
 }
 for(const app of config.apps.filter(a=>['ozard','easyspell'].includes(a.key))){
  const blockers={Meta:'UNKNOWN with possible spend. Existing API token returns OAuth 190/465 (system-user/app business mismatch). A historical Ozard official Ads Manager readback exists only for its dated week; remaining portfolio coverage and API access are unresolved. Existing system user lacked ad-account report access; minimal performance access was added on 2026-09-15. Correct-business Ozard app ads_read token issuance now requires account-owner SMS verification; token was not issued.',TikTok:'UNKNOWN with possible spend. A dated full report and legacy Smart+ destination audit can prove zero for its exact week only. Without a matching current-week readback no zero is inferred. advertiser/info currency/timezone permission remains unavailable.',AppLovin:'UNKNOWN with possible spend. Active AppsFlyer partner mapping is not spend evidence. No existing AppLovin reporting credential found; SDK/postback key is not a reporting key. Need official advertiser campaign report for this week.','Apple Ads':"UNKNOWN with possible spend. Rechecked Sep 21 after successful sign-in: My Profile shows Kant LLC / Account Link; campaign report redirects to Link App Store Connect Account. Reporting role on the owning account is required; no reporting credential found. No amount or zero inferred."};
  for(const [network,notes]of Object.entries(blockers))rows.push(metric(week,app,'Media Ad Spend Component','All',{segment:network,source:network+' / account and campaign coverage audit',unit:'money',notes}));
 }
 rows.push(...mappedRows,...countryRows);
 try{return applyAdsReadback(rows,config,week,JSON.parse(fs.readFileSync('docs/weekly-app-growth/media-readback.local.json')),data);}catch{return rows;}
}
