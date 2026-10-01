import {keychain} from './core.mjs';
import {appStoreConnectToken} from '../store-downloads-to-notion.mjs';
export const AS_REPORTING={issuerId:'1814f6cc-9f8d-446e-9d85-652ec8bfe09e',issuerEnv:'ASC_REPORTING_ISSUER_ID',keyIdEnv:'ASC_REPORTING_KEY_ID',keyIdService:'kantlabs-asc-reporting-key-id',privateKeyService:'kantlabs-asc-reporting-api-key-p8-b64'};
export function reportingCredentials(account,{env=process.env,readSecret=keychain}={}){
 const slot=account.reportingAuth;if(!slot)return null;
 const issuer=env[slot.issuerEnv]||slot.issuerId;
 if(issuer!==slot.issuerId)throw Error('Reporting issuer mismatch; explicit account review required');
 const keyId=env[slot.keyIdEnv]||readSecret(slot.keyIdService),secret=readSecret(slot.privateKeyService);
 if(!keyId||!secret) return null;
 return {ascIssuerId:issuer,ascKeyId:keyId,ascApiKeyP8B64:secret};
}
export function reportingToken(account,deps){const credentials=reportingCredentials(account,deps);return credentials?appStoreConnectToken(credentials):null;}
