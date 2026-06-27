#!/usr/bin/env node
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const defaultConfigPath = path.join(repoRoot, "config", "store-review-apps.json");

const args = parseArgs(process.argv.slice(2));
const configPath = path.resolve(repoRoot, args.config || defaultConfigPath);
const config = JSON.parse(readFileSync(configPath, "utf8"));
const defaults = config.defaults || {};
const keychainPrefix = process.env.APP_FACTORY_KEYCHAIN_PREFIX || defaults.keychainPrefix || "viberboyz";
const runStartedAt = new Date();

function parseArgs(argv) {
  const parsed = {
    apply: false,
    dryRun: true,
    apps: null,
    platforms: ["android", "ios"],
    maxResults: 50,
    sinceDays: 14,
    config: null,
    outputDir: path.join(repoRoot, "reports", "store-reviews"),
    json: false,
    updateExisting: false,
    includeBacklog: false,
    slackWebhookEnv: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--reply" || arg === "--apply") {
      parsed.apply = true;
      parsed.dryRun = false;
    } else if (arg === "--dry-run") {
      parsed.apply = false;
      parsed.dryRun = true;
    } else if (arg === "--apps") {
      parsed.apps = readList(argv[++index]);
    } else if (arg.startsWith("--apps=")) {
      parsed.apps = readList(arg.slice("--apps=".length));
    } else if (arg === "--platforms") {
      parsed.platforms = readList(argv[++index]);
    } else if (arg.startsWith("--platforms=")) {
      parsed.platforms = readList(arg.slice("--platforms=".length));
    } else if (arg === "--max-results") {
      parsed.maxResults = Number(argv[++index]);
    } else if (arg.startsWith("--max-results=")) {
      parsed.maxResults = Number(arg.slice("--max-results=".length));
    } else if (arg === "--since-days") {
      parsed.sinceDays = Number(argv[++index]);
    } else if (arg.startsWith("--since-days=")) {
      parsed.sinceDays = Number(arg.slice("--since-days=".length));
    } else if (arg === "--include-backlog") {
      parsed.sinceDays = null;
      parsed.includeBacklog = true;
    } else if (arg === "--config") {
      parsed.config = argv[++index];
    } else if (arg.startsWith("--config=")) {
      parsed.config = arg.slice("--config=".length);
    } else if (arg === "--output-dir") {
      parsed.outputDir = path.resolve(repoRoot, argv[++index]);
    } else if (arg.startsWith("--output-dir=")) {
      parsed.outputDir = path.resolve(repoRoot, arg.slice("--output-dir=".length));
    } else if (arg === "--json") {
      parsed.json = true;
    } else if (arg === "--update-existing") {
      parsed.updateExisting = true;
    } else if (arg === "--slack-webhook-env") {
      parsed.slackWebhookEnv = argv[++index];
    } else if (arg.startsWith("--slack-webhook-env=")) {
      parsed.slackWebhookEnv = arg.slice("--slack-webhook-env=".length);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(parsed.maxResults) || parsed.maxResults < 1 || parsed.maxResults > 200) {
    throw new Error("--max-results must be between 1 and 200");
  }

  return parsed;
}

function readList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function printHelp() {
  console.log(`Usage:
  node scripts/store-review-ops.mjs [--dry-run]
  node scripts/store-review-ops.mjs --reply

Options:
  --apps tercih-sihirbazi,ozard   Limit apps by config id
  --platforms android,ios         Limit platforms
  --since-days 14                 Only consider reviews created/updated in the last N days
  --include-backlog               Include every unanswered review returned by the stores
  --max-results 50                Reviews per app/platform, max 200
  --update-existing               Update existing replies too
  --output-dir reports/store-reviews
  --slack-webhook-env NAME        Post Slack-ready summary through a webhook URL env var
  --json                          Print JSON report to stdout
`);
}

function readKeychain(name, required = true) {
  const service = `${keychainPrefix}-${name}`;
  const result = spawnSync("security", [
    "find-generic-password",
    "-a",
    process.env.USER || "",
    "-s",
    service,
    "-w",
  ], { encoding: "utf8" });

  if (result.status !== 0) {
    if (!required) return null;
    throw new Error(`Missing Keychain item: ${service}`);
  }

  return result.stdout.trim();
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function readGoogleServiceAccount() {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (raw) return JSON.parse(raw);
  const envB64 = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64;
  const b64 = envB64 || readKeychain(defaults.googlePlayServiceAccountKeychainName || "google-play-service-account-json-b64");
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

async function googleAccessToken() {
  const serviceAccount = readGoogleServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));
  const unsigned = `${header}.${claim}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(serviceAccount.private_key).toString("base64url");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error_description || payload.error || "Google OAuth failed");
  return payload.access_token;
}

function createAscToken() {
  const asc = defaults.appStoreConnect || {};
  const keyId = readKeychain(asc.keyIdName || "asc-key-id");
  const issuerId = readKeychain(asc.issuerIdName || "asc-issuer-id");
  const p8B64 = readKeychain(asc.p8KeyName || "asc-api-key-p8-b64");
  const key = Buffer.from(p8B64, "base64").toString("utf8").trim();
  const now = Math.floor(Date.now() / 1000);
  const signingInput = [
    base64Url(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" })),
    base64Url(JSON.stringify({
      iss: issuerId,
      iat: now - 60,
      exp: now + 1200,
      aud: "appstoreconnect-v1",
    })),
  ].join(".");
  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key,
    dsaEncoding: "ieee-p1363",
  }).toString("base64url");

  return `${signingInput}.${signature}`;
}

async function apiJson(method, url, { token, body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const details = payload?.errors?.map((error) => error.detail || error.title).join("; ")
      || payload?.error?.message
      || JSON.stringify(payload);
    throw new Error(`${method} ${url} failed (${response.status}): ${details}`);
  }
  return payload;
}

function timeFromGoogle(timestamp) {
  if (!timestamp?.seconds) return null;
  const seconds = Number(timestamp.seconds);
  const nanos = Number(timestamp.nanos || 0);
  return new Date(seconds * 1000 + Math.floor(nanos / 1e6)).toISOString();
}

function latestAndroidUserComment(review) {
  return [...(review.comments || [])].reverse().find((comment) => comment.userComment)?.userComment || null;
}

function latestAndroidDeveloperComment(review) {
  return [...(review.comments || [])].reverse().find((comment) => comment.developerComment)?.developerComment || null;
}

function googleEpochMs(timestamp) {
  if (!timestamp?.seconds) return 0;
  return Number(timestamp.seconds) * 1000 + Math.floor(Number(timestamp.nanos || 0) / 1e6);
}

function appleUrl(route) {
  return `https://api.appstoreconnect.apple.com${route}`;
}

async function listAndroidReviews(app, token) {
  const android = app.platforms?.android;
  if (!android?.packageName) return [];

  const url = new URL(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${android.packageName}/reviews`);
  url.searchParams.set("maxResults", String(args.maxResults));
  if (android.translationLanguage) url.searchParams.set("translationLanguage", android.translationLanguage);

  const payload = await apiJson("GET", url, { token });
  return (payload.reviews || []).map((review) => {
    const user = latestAndroidUserComment(review);
    const developer = latestAndroidDeveloperComment(review);
    const userEditedMs = googleEpochMs(user?.lastModified);
    const developerEditedMs = googleEpochMs(developer?.lastModified);
    const body = user?.originalText || user?.text || "";
    return {
      appId: app.id,
      appName: app.displayName,
      platform: "android",
      packageName: android.packageName,
      reviewId: review.reviewId,
      rating: user?.starRating ?? null,
      title: null,
      body: cleanReviewText(body),
      translatedBody: user?.text && user?.originalText && user.text !== user.originalText ? cleanReviewText(user.text) : null,
      reviewer: review.authorName || null,
      locale: user?.reviewerLanguage || null,
      territory: null,
      reviewDate: timeFromGoogle(user?.lastModified),
      hasDeveloperReply: Boolean(developer),
      developerReply: developer?.text || null,
      developerReplyState: developer ? "PUBLISHED" : null,
      developerReplyDate: timeFromGoogle(developer?.lastModified),
      needsReply: Boolean(user) && (!developer || userEditedMs > developerEditedMs || args.updateExisting),
      raw: review,
    };
  });
}

async function listIosReviews(app, token) {
  const ios = app.platforms?.ios;
  if (!ios?.appStoreConnectId) return [];

  const fields = "rating,title,body,reviewerNickname,territory,createdDate,response";
  const responseFields = "responseBody,lastModifiedDate,state,review";
  const route = `/v1/apps/${ios.appStoreConnectId}/customerReviews?limit=${args.maxResults}&include=response&sort=-createdDate&fields[customerReviews]=${fields}&fields[customerReviewResponses]=${responseFields}`;
  const payload = await apiJson("GET", appleUrl(route), { token });
  const includedById = new Map((payload.included || []).map((item) => [item.id, item]));

  return (payload.data || []).map((review) => {
    const responseId = review.relationships?.response?.data?.id || null;
    const response = responseId ? includedById.get(responseId) : null;
    return {
      appId: app.id,
      appName: app.displayName,
      platform: "ios",
      appStoreConnectId: ios.appStoreConnectId,
      bundleId: ios.bundleId || null,
      reviewId: review.id,
      rating: review.attributes?.rating ?? null,
      title: cleanReviewText(review.attributes?.title || ""),
      body: cleanReviewText(review.attributes?.body || ""),
      translatedBody: null,
      reviewer: review.attributes?.reviewerNickname || null,
      locale: null,
      territory: review.attributes?.territory || null,
      reviewDate: review.attributes?.createdDate || null,
      hasDeveloperReply: Boolean(response),
      developerReply: response?.attributes?.responseBody || null,
      developerReplyState: response?.attributes?.state || null,
      developerReplyDate: response?.attributes?.lastModifiedDate || null,
      needsReply: !response || args.updateExisting,
      raw: review,
    };
  });
}

function cleanReviewText(value) {
  return String(value || "").replace(/^\s+|\s+$/g, "").replace(/\s+/g, " ");
}

function isRecentEnough(review) {
  if (!args.sinceDays) return true;
  if (!review.reviewDate) return false;
  const cutoff = Date.now() - args.sinceDays * 24 * 60 * 60 * 1000;
  return new Date(review.reviewDate).getTime() >= cutoff;
}

function detectLanguage(review) {
  const text = `${review.title || ""} ${review.body || ""}`;
  if (review.locale?.toLowerCase().startsWith("tr")) return "tr";
  if (review.territory === "TUR") return "tr";
  if (/[çğıöşüİı]/i.test(text)) return "tr";
  const trSignals = ["merhaba", "uygulama", "çalışmıyor", "para", "ücret", "sınav", "yks", "tyt", "ayt", "abonelik"];
  const lower = text.toLocaleLowerCase("tr-TR");
  return trSignals.some((signal) => lower.includes(signal)) ? "tr" : "en";
}

function classifyReview(review) {
  const text = `${review.title || ""} ${review.body || ""}`.toLocaleLowerCase("tr-TR");
  const includes = (...terms) => terms.some((term) => text.includes(term));
  const matches = (...patterns) => patterns.some((pattern) => pattern.test(text));

  if (includes("hesabımı sil", "hesabimi sil", "verilerim", "silinmesini", "delete account", "delete my account", "data deletion")) return "data_delete";
  if (includes("premium ald", "premium aldim", "satın aldım", "satin aldim", "ödeme bile yaptım", "odeme bile yaptim", "para verdim", "boşuna mı para", "bosuna mi para", "plan hala", "geri yükle", "geri yukle", "restore purchase", "purchase did not", "premium olmama rağmen", "premium olmama ragmen", "pro kullanmama rağmen", "pro kullanmama ragmen", "iade", "refund")) return "purchase_issue";
  if (includes("giriş", "giris", "login", "hesap", "account", "şifre", "sifre", "password", "e mail", "e-mail", "email", "gmail", "kayıt", "kayit", "kod gelmedi")) return "account";
  if (includes("can hakk", "can süresi", "can suresi", "canlar", "can olayı", "can olayi")) return "feature_request";
  if (
    includes("yanlış", "yanlis", "gerçeklikten uzak", "hatalı", "hatali", "çözüm yanlış", "cozum yanlis", "doğru çözümlemiyor", "dogru cozumlemiyor", "soruyu doğru", "soruyu dogru", "yanlış çıkıyor", "yanlis cikiyor", "matematik çözümleri", "matematik cozumleri", "yapay zeka", "wrong answer", "incorrect")
    || matches(/\bai\b/, /\baı\b/)
  ) return "ai_quality";
  if (
    includes("açılm", "acilm", "donuyor", "dondu", "kasıyor", "kasiyor", "crash", "freeze", "bug", "hata", "error", "aror", "arror", "bozuk", "sıralama", "siralam", "hesapla", "ana menüye", "ana menuye", "atıyor", "atiyor", "takılı", "takili", "takili", "ilerlemiyor", "giremiyorum", "seçim yapılamıyor", "secim yapilamiyor", "seçemiyorum", "secemiyorum", "şıklar sadece", "siklar sadece", "cevap yok", "not çıkarmıyor", "not cikarmiyor", "not çıkartmıyor", "not cikartmiyor", "hata olduğunu söylüyor", "hata oldugunu soyluyor", "klavyesi bozuk", "yüklenmiyor", "yuklenmiyor")
    || matches(/\bçalışm(ıyor|iyor|adi|adı|adi|adi|az|az)\b/, /\bcalism(iyor|adi|az)\b/, /\bnot work/, /\bdoesn'?t work/)
  ) return "app_issue";
  if (includes("gelmeli", "gelsin", "ekleyin", "eklemelisiniz", "istiyoruz", "öneri", "oneri", "bekliyoruz", "feature request", "keşke", "keske", "lütfen geliştir", "lutfen gelistir", "geliştirilsin", "gelistirilsin", "daha fazla", "daha çok", "daha cok", "1 saat", "bir saat", "süresiz", "suresiz", "ayarlayın", "ayarlayin", "ünite atlama", "unite atlama", "dönemlere", "donemlere", "biyoloji", "geometri", "organik kimya", "lgs", "görüntülü çalışma", "goruntulu calisma", "ödül sistemi", "odul sistemi", "reklam koy", "reklam izley")) return "feature_request";
  if (includes("para", "para ödemek", "para odemek", "abonelik", "ücretli", "ucretli", "ücreti", "ucreti", "ücretlendirme", "ucretlendirme", "pahalı", "pahali", "fiyat", "makul", "subscription", "trial", "satın", "satin", "kilit", "haftalık", "haftalik", "premium versiyonu", "premium vesaire") || matches(/\btl\b/, /\d+\s*tl\b/)) return "pricing";
  if (includes("virüs", "virus", "güvenlik", "zararlı", "security", "malware")) return "safety";
  if (review.rating >= 4 && includes("teşekkür", "tesekkur", "güzel", "guzel", "iyi", "great", "thanks", "love", "efsane", "harika", "beğend", "begend", "memnun", "kaliteli", "mükemmel", "mukemmel", "kazandır", "kazandir", "faydal", "başarılı", "basarili", "tavsiye", "yardımcı", "yardimci", "öğretici", "ogretici", "mantıklı", "mantikli", "pratik")) return "positive";
  return "generic";
}

function buildReply(app, review) {
  const lang = detectLanguage(review);
  const category = classifyReview(review);
  const email = app.supportEmail || defaults.supportEmail || "bilgi@kantakademi.com";
  const isTr = lang === "tr";
  const freeTier = isTr ? app.freeTierDescriptionTr : app.freeTierDescriptionEn;
  const paidTier = isTr ? app.paidTierDescriptionTr : app.paidTierDescriptionEn;
  const recentFix = isTr ? app.recentFixTr : app.recentFixEn;
  const storeName = review.platform === "ios" ? "App Store" : "Play Store";

  let reply;
  if (isTr) {
    if (category === "positive") {
      reply = `Merhaba, güzel geri bildiriminiz için teşekkür ederiz. Uygulamayı geliştirmeye devam ediyoruz; öneriniz olursa ${email} üzerinden bize yazabilirsiniz.`;
    } else if (category === "app_issue") {
      const fix = recentFix || "Uygulamayı güncel sürüme aldıktan sonra tekrar deneyebilir misiniz?";
      reply = `Merhaba, yaşadığınız sorun için üzgünüz. ${fix} ${storeName}'dan uygulamayı güncellemeniz yeterli. Sorun sürerse ${email}'a yazabilirsiniz.`;
    } else if (category === "pricing") {
      reply = `Merhaba, geri bildiriminiz için teşekkür ederiz. ${freeTier || "Uygulamanın bazı akışları ücretsiz kullanılabilir."} ${paidTier || "Premium özellikler ek erişim sağlar."} Yanlış işlem olduğunu düşünüyorsanız ${email}'a yazabilirsiniz.`;
    } else if (category === "purchase_issue") {
      reply = `Merhaba, ödeme/erişim sorununu hızlıca kontrol edebiliriz. Lütfen uygulamayı güncelleyip satın alımı geri yüklemeyi deneyin; iade veya dekont detayı için ${email}'a yazabilirsiniz.`;
    } else if (category === "feature_request") {
      reply = `Merhaba, öneriniz için teşekkür ederiz. Bu isteği ürün notlarımıza ekliyoruz; yeni içerik ve özellikleri güncellemelerle kademeli olarak yayınlıyoruz.`;
    } else if (category === "data_delete") {
      reply = `Merhaba, hesap ve veri silme talebinizi işleme almak için bize kayıtlı e-posta adresinizle ${email} üzerinden ulaşabilirsiniz. Ekibimiz talebinizi hızlıca kontrol edecektir.`;
    } else if (category === "ai_quality") {
      reply = `Merhaba, geri bildiriminiz için teşekkür ederiz. Hatalı gördüğünüz soru, çözüm veya yanıt örneklerini incelemek isteriz; ekran görüntüsüyle ${email}'a yazabilirsiniz.`;
    } else if (category === "safety") {
      reply = `Merhaba, güvenlik endişeniz için üzgünüz. Uygulama resmi ${storeName} dağıtımı üzerinden çalışır ve zararlı içerik içermez. Sorun sürerse ${email}'a yazabilirsiniz.`;
    } else if (category === "account") {
      reply = `Merhaba, hesap/giriş sorununu hızlıca inceleyebiliriz. Uygulamayı güncelledikten sonra sorun devam ederse kayıtlı e-posta ve cihaz bilgisiyle ${email}'a yazabilirsiniz.`;
    } else if (review.rating >= 4) {
      reply = `Merhaba, geri bildiriminiz için teşekkür ederiz. Uygulamayı geliştirmeye devam ediyoruz; öneriniz olursa ${email} üzerinden bize yazabilirsiniz.`;
    } else {
      reply = `Merhaba, geri bildiriminiz için teşekkür ederiz. Deneyiminizi iyileştirmek isteriz; detay paylaşırsanız ${email} üzerinden hızlıca inceleyebiliriz.`;
    }
  } else if (category === "positive") {
    reply = `Hi, thanks for the kind feedback. We keep improving the app; if you have any suggestions, you can reach us at ${email}.`;
  } else if (category === "app_issue") {
    const fix = recentFix || "Please update the app to the latest version and try again.";
    reply = `Hi, sorry about the issue. ${fix} Updating from the ${storeName} should be enough. If it continues, please contact us at ${email}.`;
  } else if (category === "pricing") {
    reply = `Hi, thanks for the feedback. ${freeTier || "Some core flows are available for free."} ${paidTier || "Premium features are optional."} If something looks wrong, please contact us at ${email}.`;
  } else if (category === "purchase_issue") {
    reply = `Hi, we can review the payment/access issue quickly. Please update the app and try restoring purchases; for refund or receipt details, contact ${email}.`;
  } else if (category === "feature_request") {
    reply = "Hi, thanks for the suggestion. We are adding this to our product notes and will keep releasing new content and features through updates.";
  } else if (category === "data_delete") {
    reply = `Hi, to process your account and data deletion request, please contact us from your registered email address at ${email}. Our team will review it quickly.`;
  } else if (category === "ai_quality") {
    reply = `Hi, thanks for the feedback. We would like to review the question, solution, or answer examples that looked incorrect; please send screenshots to ${email}.`;
  } else if (category === "safety") {
    reply = `Hi, sorry for the concern. The app is distributed through the official ${storeName} and does not contain harmful content. If the issue continues, contact us at ${email}.`;
  } else if (category === "account") {
    reply = `Hi, we can review the account/login issue quickly. Please update the app first; if it continues, send your device details to ${email}.`;
  } else if (review.rating >= 4) {
    reply = `Hi, thanks for the feedback. We keep improving the app; if you have suggestions, you can reach us at ${email}.`;
  } else {
    reply = `Hi, thanks for the feedback. We would like to improve your experience; please send more details to ${email} and we will review it.`;
  }

  const limit = review.platform === "android" ? 350 : 1000;
  return {
    category,
    language: lang,
    text: fitReply(reply, limit),
  };
}

function fitReply(reply, limit) {
  if (reply.length <= limit) return reply;
  const shortened = reply.slice(0, limit - 1).replace(/\s+\S*$/, "").trim();
  return `${shortened}.`;
}

async function replyAndroid(review, replyText, token) {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${review.packageName}/reviews/${encodeURIComponent(review.reviewId)}:reply`;
  const payload = await apiJson("POST", url, { token, body: { replyText } });
  return {
    state: "sent",
    result: payload.result || null,
  };
}

async function replyIos(review, replyText, token) {
  const body = {
    data: {
      type: "customerReviewResponses",
      attributes: { responseBody: replyText },
      relationships: {
        review: { data: { type: "customerReviews", id: review.reviewId } },
      },
    },
  };
  const payload = await apiJson("POST", appleUrl("/v1/customerReviewResponses"), { token, body });
  return {
    state: payload.data?.attributes?.state || "sent",
    responseId: payload.data?.id || null,
    lastModifiedDate: payload.data?.attributes?.lastModifiedDate || null,
  };
}

function readRepoState(app) {
  if (!app.repoPath) return null;
  const appRepoPath = path.resolve(repoRoot, app.repoPath);
  if (!existsSync(appRepoPath)) {
    return { path: appRepoPath, exists: false };
  }

  const packagePath = path.join(appRepoPath, "package.json");
  const appJsonPath = path.join(appRepoPath, "app.json");
  const state = {
    path: appRepoPath,
    exists: true,
    packageName: null,
    packageVersion: null,
    expoVersion: null,
    androidVersionCode: null,
    iosBuildNumber: null,
    git: null,
  };

  if (existsSync(packagePath)) {
    const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
    state.packageName = pkg.name || null;
    state.packageVersion = pkg.version || null;
  }

  if (existsSync(appJsonPath)) {
    const appJson = JSON.parse(readFileSync(appJsonPath, "utf8"));
    const expo = appJson.expo || appJson;
    state.expoVersion = expo.version || null;
    state.androidVersionCode = expo.android?.versionCode ?? null;
    state.iosBuildNumber = expo.ios?.buildNumber ?? null;
  }

  const branch = runGit(appRepoPath, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const commit = runGit(appRepoPath, ["rev-parse", "--short", "HEAD"]);
  const status = runGit(appRepoPath, ["status", "--short"]);
  if (branch.ok || commit.ok) {
    state.git = {
      branch: branch.ok ? branch.stdout : null,
      commit: commit.ok ? commit.stdout : null,
      dirtyFiles: status.ok && status.stdout ? status.stdout.split("\n").filter(Boolean).length : 0,
    };
  }

  return state;
}

function runGit(cwd, argsForGit) {
  const result = spawnSync("git", ["-C", cwd, ...argsForGit], { encoding: "utf8" });
  return {
    ok: result.status === 0,
    stdout: result.stdout.trim(),
  };
}

function summarizeApp(app, reviews, candidates, sent) {
  const appReviews = reviews.filter((review) => review.appId === app.id);
  const appCandidates = candidates.filter((item) => item.review.appId === app.id);
  const appSent = sent.filter((item) => item.review.appId === app.id && item.status === "sent");
  const byPlatform = {};
  for (const platform of ["android", "ios"]) {
    const platformReviews = appReviews.filter((review) => review.platform === platform);
    byPlatform[platform] = {
      reviews: platformReviews.length,
      needsReply: appCandidates.filter((item) => item.review.platform === platform).length,
      sent: appSent.filter((item) => item.review.platform === platform).length,
      errors: sent.filter((item) => item.review.appId === app.id && item.review.platform === platform && item.status === "error").length,
    };
  }
  return {
    appId: app.id,
    displayName: app.displayName,
    reviews: appReviews.length,
    needsReply: appCandidates.length,
    sent: appSent.length,
    byPlatform,
  };
}

function buildMarkdownReport(report) {
  const lines = [];
  lines.push(`# Store Review Ops`);
  lines.push("");
  lines.push(`Run: ${report.run.startedAt}`);
  lines.push(`Mode: ${report.run.mode}`);
  lines.push("");
  lines.push(`## Summary`);
  lines.push("");
  lines.push(`- Reviews scanned: ${report.totals.reviews}`);
  lines.push(`- Reply candidates: ${report.totals.replyCandidates}`);
  lines.push(`- Replies sent: ${report.totals.sent}`);
  lines.push(`- Skipped by window: ${report.totals.skippedByWindow || 0}`);
  lines.push(`- Errors: ${report.totals.errors}`);
  lines.push("");
  lines.push(`## Apps`);
  lines.push("");
  for (const app of report.apps) {
    lines.push(`### ${app.displayName}`);
    lines.push(`- Reviews: ${app.reviews}`);
    lines.push(`- Needs reply: ${app.needsReply}`);
    lines.push(`- Sent: ${app.sent}`);
    lines.push(`- Android: ${app.byPlatform.android.reviews} scanned, ${app.byPlatform.android.needsReply} candidates, ${app.byPlatform.android.sent} sent`);
    lines.push(`- iOS: ${app.byPlatform.ios.reviews} scanned, ${app.byPlatform.ios.needsReply} candidates, ${app.byPlatform.ios.sent} sent`);
    lines.push("");
  }
  if (report.replyCandidates.length) {
    lines.push(`## Reply Drafts`);
    lines.push("");
    for (const item of report.replyCandidates) {
      lines.push(`### ${item.review.appName} / ${item.review.platform} / ${item.review.rating || "?"} star`);
      lines.push(`Review: ${reviewTextForReport(item.review)}`);
      lines.push(`Category: ${item.reply.category}`);
      lines.push(`Reply: ${item.reply.text}`);
      const result = report.results.find((candidate) => candidate.review.reviewId === item.review.reviewId && candidate.review.platform === item.review.platform);
      if (result) lines.push(`Result: ${result.status}${result.detail ? ` (${result.detail})` : ""}`);
      lines.push("");
    }
  }
  if (report.errors.length) {
    lines.push(`## Errors`);
    lines.push("");
    for (const error of report.errors) {
      lines.push(`- ${error.appId}/${error.platform}: ${error.message}`);
    }
    lines.push("");
  }
  return `${lines.join("\n").trim()}\n`;
}

function reviewTextForReport(review) {
  if (review.title && review.body) return `${review.title}: ${review.body}`;
  return review.body || review.title || "(no text)";
}

function buildSlackMessage(report) {
  const lines = [];
  lines.push(`**Store review ops** (${report.run.mode})`);
  lines.push(`Scanned ${report.totals.reviews} reviews, ${report.totals.replyCandidates} need reply, ${report.totals.sent} sent, ${report.totals.skippedByWindow || 0} skipped by window, ${report.totals.errors} errors.`);
  for (const app of report.apps) {
    if (app.needsReply || app.sent || app.byPlatform.android.errors || app.byPlatform.ios.errors) {
      lines.push(`- **${app.displayName}**: ${app.needsReply} candidates, ${app.sent} sent`);
    }
  }
  if (report.replyCandidates.length && report.run.mode === "dry-run") {
    lines.push("");
    lines.push("**Top drafts**");
    for (const item of report.replyCandidates.slice(0, 6)) {
      lines.push(`- ${item.review.appName}/${item.review.platform}: ${item.reply.text}`);
    }
  }
  if (report.errors.length) {
    lines.push("");
    lines.push("**Errors**");
    for (const error of report.errors.slice(0, 6)) {
      lines.push(`- ${error.appId}/${error.platform}: ${error.message}`);
    }
  }
  return `${lines.join("\n").trim()}\n`;
}

async function maybePostSlack(message) {
  if (!args.slackWebhookEnv) return null;
  const webhookUrl = process.env[args.slackWebhookEnv];
  if (!webhookUrl) {
    return { status: "skipped", reason: `Missing env var ${args.slackWebhookEnv}` };
  }
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });
  const text = await response.text();
  return {
    status: response.ok ? "sent" : "error",
    httpStatus: response.status,
    body: text,
  };
}

async function main() {
  const selectedApps = (config.apps || []).filter((app) => !args.apps || args.apps.includes(app.id));
  if (!selectedApps.length) throw new Error("No apps selected");

  const platformSet = new Set(args.platforms);
  const repoStates = Object.fromEntries(selectedApps.map((app) => [app.id, readRepoState(app)]));
  const errors = [];
  const reviews = [];
  let googleToken = null;
  let ascToken = null;

  if (platformSet.has("android")) {
    googleToken = await googleAccessToken();
  }
  if (platformSet.has("ios")) {
    ascToken = createAscToken();
  }

  for (const app of selectedApps) {
    if (platformSet.has("android")) {
      try {
        reviews.push(...await listAndroidReviews(app, googleToken));
      } catch (error) {
        errors.push({ appId: app.id, platform: "android", message: error.message });
      }
    }
    if (platformSet.has("ios")) {
      try {
        reviews.push(...await listIosReviews(app, ascToken));
      } catch (error) {
        errors.push({ appId: app.id, platform: "ios", message: error.message });
      }
    }
  }

  const candidateReviews = reviews
    .filter(isRecentEnough)
    .filter((review) => review.needsReply);
  const skippedByWindow = reviews
    .filter((review) => review.needsReply)
    .filter((review) => !isRecentEnough(review));

  const replyCandidates = candidateReviews.map((review) => {
    const app = selectedApps.find((candidate) => candidate.id === review.appId);
    return { review: publicReview(review), reply: buildReply(app, review) };
  });

  const results = [];
  for (const item of replyCandidates) {
    const review = item.review;
    try {
      if (args.dryRun) {
        results.push({ ...item, status: "dry-run", detail: "not sent" });
      } else if (review.platform === "android") {
        const response = await replyAndroid(review, item.reply.text, googleToken);
        results.push({ ...item, status: "sent", detail: response.state, response });
      } else if (review.platform === "ios") {
        const response = await replyIos(review, item.reply.text, ascToken);
        results.push({ ...item, status: "sent", detail: response.state, response });
      }
    } catch (error) {
      results.push({ ...item, status: "error", detail: error.message });
      errors.push({ appId: review.appId, platform: review.platform, reviewId: review.reviewId, message: error.message });
    }
  }

  const report = {
    run: {
      startedAt: runStartedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      mode: args.dryRun ? "dry-run" : "reply",
      configPath,
      selectedApps: selectedApps.map((app) => app.id),
      selectedPlatforms: args.platforms,
      sinceDays: args.sinceDays,
      includeBacklog: args.includeBacklog,
      slackChannel: config.slack || null,
    },
    totals: {
      reviews: reviews.length,
      replyCandidates: replyCandidates.length,
      sent: results.filter((result) => result.status === "sent").length,
      skippedByWindow: skippedByWindow.length,
      errors: errors.length,
    },
    repoStates,
    apps: selectedApps.map((app) => summarizeApp(app, reviews, replyCandidates, results)),
    reviews: reviews.map(publicReview),
    replyCandidates,
    results,
    errors,
  };

  mkdirSync(args.outputDir, { recursive: true });
  const stamp = runStartedAt.toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(args.outputDir, `${stamp}.json`);
  const mdPath = path.join(args.outputDir, `${stamp}.md`);
  const slackPath = path.join(args.outputDir, `${stamp}.slack.md`);
  const md = buildMarkdownReport(report);
  const slackMessage = buildSlackMessage(report);
  report.outputs = { jsonPath, mdPath, slackPath };
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(mdPath, md);
  writeFileSync(slackPath, slackMessage);
  report.slackPost = await maybePostSlack(slackMessage);
  if (report.slackPost) {
    writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  }

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(md);
    console.log(`JSON report: ${jsonPath}`);
    console.log(`Slack message: ${slackPath}`);
  }
}

function publicReview(review) {
  const { raw, ...publicFields } = review;
  return publicFields;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
