// Run locally by the account owner. Never prints or places key material in argv.
import Foundation
import Security
let args = Array(CommandLine.arguments.dropFirst())
func value(_ flag: String) -> String? { guard let i=args.firstIndex(of:flag), i+1<args.count else{return nil};return args[i+1] }
func fail(_ message:String) -> Never { fputs(message+"\n",stderr);exit(1) }
guard let keyId=value("--key-id"), keyId.range(of:"^[A-Z0-9]{10}$",options:.regularExpression) != nil,
      let file=value("--p8") else {fail("Usage: swift scripts/install-apple-reporting-key.swift --key-id KEY_ID --p8 /absolute/path/AuthKey_KEY_ID.p8")}
guard let bytes=FileManager.default.contents(atPath:file),let pem=String(data:bytes,encoding:.utf8),pem.contains("-----BEGIN PRIVATE KEY-----"),pem.contains("-----END PRIVATE KEY-----") else {fail("Cannot read a valid .p8 private-key file")}
let items:[(String,Data)]=[("kantlabs-asc-reporting-api-key-p8-b64",Data(bytes.base64EncodedString().utf8)),("kantlabs-asc-reporting-key-id",Data(keyId.utf8))]
for (service,_) in items {
 let query:[String:Any]=[kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:service,kSecMatchLimit as String:kSecMatchLimitOne]
 let status=SecItemCopyMatching(query as CFDictionary,nil)
 if status != errSecItemNotFound {fail("Reporting Keychain item already exists or cannot be inspected: \(service). No credential overwritten.")}
}
var created=[String]()
for (service,data) in items {
 let query:[String:Any]=[kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:service,kSecAttrAccount as String:NSUserName(),kSecValueData as String:data]
 let status=SecItemAdd(query as CFDictionary,nil)
 if status != errSecSuccess {
  for name in created {SecItemDelete([kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:name,kSecAttrAccount as String:NSUserName()] as CFDictionary)}
  fail("Keychain install failed (OSStatus \(status)); new entries rolled back.")
 }
 created.append(service)
}
print("Reporting key installed in Keychain (base64). Existing App Manager key unchanged. Key ID: \(keyId)")
