// These are evidence gates for further research, never success probabilities.
export const COMMERCIAL_DIMENSIONS = {
  demand: { label: "Talep", types: ["market_size", "growth_signal", "keyword_demand", "payment_signal"], metrics: ["downloads", "active_users", "search_volume", "buyers", "paid_conversions"], next: "Hedef işle eşleşen güncel indirme, aktif kullanım, gerçek arama hacmi veya ödeme talebini ölç." },
  monetization: { label: "Ödeme", types: ["revenue_signal", "payment_signal"], metrics: ["revenue", "buyers", "paid_conversions"], next: "Yakın çözümlerin dönemli gelir/alıcı verisini veya gerçek ödeme testini bul; liste fiyatını satış sayma." },
  competition: { label: "Rekabet ve fark", types: ["competitor_gap"], next: "En güçlü ücretli ve ücretsiz ikamede önerilen işi karşılaştır; farkı doğrudan gözlem veya kaynakla göster." },
  distribution: { label: "Kullanıcıya ulaşma", types: ["acquisition_signal"], metrics: ["qualified_visits", "activated_users", "buyers"], next: "Tek bir erişim yolunda hedef kitleye ulaşmayı ölç; topluluk üye sayısını edinim kanıtı sayma." },
  repeat_use: { label: "Tekrar kullanım", types: ["usage_signal"], metrics: ["repeat_users", "repeat_rate"], next: "Ürünün doğal kullanım döngüsünde tekrar ihtiyacını ve geri dönüşü ölç; tek seferlik üründe tekrar satın almayı ayrıca incele." },
  economics: { label: "Maliyet ve ekonomi", types: ["unit_economics"], metrics: ["contribution_margin"], next: "Fiyat, mağaza payı, içerik/servis maliyeti ve edinim maliyetini aynı senaryoda hesapla; varsayımları ayrı yaz." },
};

const CORE = ["demand", "monetization", "competition", "distribution"];
const text = (value) => typeof value === "string" && value.trim().length > 0;

function eligibleSignal(item, dimension, at) {
  const rule = COMMERCIAL_DIMENSIONS[dimension];
  const context = item.commercial;
  if (!rule.types.includes(item.type) || context?.dimension !== dimension) return false;
  if (context.relevance !== "direct" || !text(context.scope_fit)) return false;
  if (!["observed", "estimate"].includes(context.basis)) return false;
  if (!(text(item.source_url) || text(item.source_path)) || !text(item.summary)) return false;
  const observed = Date.parse(item.observed_at);
  if (!Number.isFinite(observed) || observed > at.getTime()) return false;
  // Requiring a review date prevents unbounded old sources from becoming a gate.
  if (!item.expires_at || !Number.isFinite(Date.parse(item.expires_at)) || Date.parse(item.expires_at) < at.getTime()) return false;
  if (!text(context.country) || !text(context.platform) || !text(context.population)) return false;
  const start = Date.parse(context.period_start);
  const end = Date.parse(context.period_end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || end > observed) return false;
  if (!rule.metrics) return context.basis === "observed";
  if (!rule.metrics.includes(item.metric) || typeof item.value !== "number" || !Number.isFinite(item.value) || !text(item.unit)) return false;
  if (["revenue", "contribution_margin"].includes(item.metric) && !/^[A-Z]{3}$/.test(context.currency || "")) return false;
  return true;
}

export function assessCommercialEvidence(candidate, allEvidence, at = new Date()) {
  const evidence = allEvidence.filter((item) => !item.expires_at || Date.parse(item.expires_at) >= at.getTime());
  const dimensions = {};
  for (const [key, rule] of Object.entries(COMMERCIAL_DIMENSIONS)) {
    const matching = evidence.filter((item) => eligibleSignal(item, key, at));
    const supporting = matching.filter((item) => (item.direction || "supports") === "supports" && (!rule.metrics || item.value > 0));
    const opposing = matching.filter((item) => item.direction === "contradicts" || (rule.metrics && item.value <= 0));
    // Keep the pre-existing strong competitor contradiction gate, including legacy evidence.
    if (key === "competition") {
      for (const item of evidence.filter((row) => row.type === "competitor_gap" && row.direction === "contradicts" && row.confidence >= 0.7)) {
        if (!opposing.some((row) => row.id === item.id)) opposing.push(item);
      }
    }
    const status = opposing.length ? "conflicting" : supporting.length ? "supported" : "unknown";
    dimensions[key] = {
      label: rule.label,
      status,
      supporting_evidence_ids: supporting.map((item) => item.id),
      opposing_evidence_ids: opposing.map((item) => item.id),
      next_check: status === "supported" ? null : (candidate.commercial_case?.[key]?.next_check || rule.next),
    };
  }
  const missing = CORE.filter((key) => dimensions[key].status !== "supported");
  const ready = missing.length === 0;
  return {
    version: 1,
    status: ready ? "market_signals_present" : "insufficient_evidence",
    label: ready ? "Ön pazar sinyalleri var; ürün ve kârlılık doğrulanmadı" : "Ticari karşılık henüz gösterilemedi",
    preliminary_gate_passed: ready,
    required_dimensions: CORE,
    missing_dimensions: missing,
    dimensions,
    meaning: "Kaynaklı ön pazar değerlendirmesi; ticari başarı olasılığı, ürün doğrulaması veya üretim izni değildir.",
  };
}

export function renderCommercialSummary(assessment) {
  if (!assessment) return "Ticari değerlendirme yenilenmeli; eski puan ticari kanıt değildir.";
  const states = { supported: "kaynaklı sinyal", conflicting: "karşı kanıt var", unknown: "bilinmiyor" };
  return `${assessment.label}. ${Object.values(assessment.dimensions).map((row) => `${row.label}: ${states[row.status]}`).join("; ")}.`;
}
