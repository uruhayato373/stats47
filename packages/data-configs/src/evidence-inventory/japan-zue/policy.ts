import type {
  EvidenceContentRole,
  EvidenceGeoScope,
  EvidencePrimarySource,
  JapanZueCandidate,
  JapanZueEvidenceItem,
} from "../types";

export const JAPAN_ZUE_POLICY_VERSION = 1;
export const JAPAN_ZUE_REVIEWED_AT = "2026-08-29";
export const GOVERNMENT_TERMS_URL = "https://www.digital.go.jp/resources/open_data";

interface SourcePolicy {
  pattern: RegExp;
  organization: string;
  url: string;
  termsUrl?: string;
  rights: EvidencePrimarySource["rights"];
}

/**
 * 所管機関と公式 landing URL の authored policy。
 * 個別 dataset URL が metric lineage から得られる場合はそちらを優先する。
 */
export const JAPAN_ZUE_SOURCE_POLICIES: readonly SourcePolicy[] = [
  { pattern: /総務省統計局|統計局/, organization: "総務省統計局", url: "https://www.stat.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /総務省|消防庁/, organization: "総務省", url: "https://www.soumu.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /国土地理院/, organization: "国土地理院", url: "https://www.gsi.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /気象庁/, organization: "気象庁", url: "https://www.jma.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /海上保安庁/, organization: "海上保安庁", url: "https://www.kaiho.mlit.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /国土交通省|観光庁/, organization: "国土交通省", url: "https://www.mlit.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /農林水産省|林野庁|水産庁/, organization: "農林水産省", url: "https://www.maff.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /経済産業省|資源エネルギー庁|特許庁/, organization: "経済産業省", url: "https://www.meti.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /厚生労働省/, organization: "厚生労働省", url: "https://www.mhlw.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /文部科学省|文化庁/, organization: "文部科学省", url: "https://www.mext.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /内閣府|内閣官房/, organization: "内閣府", url: "https://www.cao.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /財務省|国税庁/, organization: "財務省", url: "https://www.mof.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /環境省/, organization: "環境省", url: "https://www.env.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /法務省|出入国在留管理庁/, organization: "法務省", url: "https://www.moj.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /警察庁/, organization: "警察庁", url: "https://www.npa.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /こども家庭庁/, organization: "こども家庭庁", url: "https://www.cfa.go.jp/", termsUrl: GOVERNMENT_TERMS_URL, rights: "allowed" },
  { pattern: /国立社会保障・人口問題研究所/, organization: "国立社会保障・人口問題研究所", url: "https://www.ipss.go.jp/", rights: "needs-review" },
  { pattern: /日本銀行/, organization: "日本銀行", url: "https://www.boj.or.jp/", rights: "needs-review" },
  { pattern: /OECD|国際連合|UNCTAD|WHO|ILO|FAO|世界銀行|IMF/, organization: "国際機関", url: "https://www.un.org/", rights: "needs-review" },
] as const;

export interface MetricLineage {
  key: string;
  title: string;
  category: string;
  sourceName: string;
  sourceUrl?: string;
  datasetId?: string;
  surveyIds: string[];
  themeSlugs: string[];
  unit: string;
  geoScopes: EvidenceGeoScope[];
  dataYears: string[];
  isActive: boolean;
}

export interface JapanZueManualOverride {
  resolution: JapanZueEvidenceItem["resolution"];
  resolutionReason: string;
  metricKeys?: string[];
  primarySource?: EvidencePrimarySource;
  primarySources?: EvidencePrimarySource[];
  contentRoles?: EvidenceContentRole[];
  units?: string[];
  geoScopes?: EvidenceGeoScope[];
}

/** WP4 pilot を含む、人手で意味を確認した例外だけを置く。 */
export const JAPAN_ZUE_MANUAL_OVERRIDES: Readonly<Record<string, JapanZueManualOverride>> = {
  "japan-zue-2025-26-p054-table02": {
    resolution: "reuse-existing-metric",
    resolutionReason: "人口動態統計の都道府県別合計特殊出生率として一次資料と既存指標を照合",
    metricKeys: ["total-fertility-rate"],
    units: ["人"],
    geoScopes: ["prefecture-set"],
    primarySources: [officialSource("厚生労働省", "人口動態統計", "https://www.mhlw.go.jp/toukei/list/81-1.html", ["2023"])],
  },
  "japan-zue-2025-26-p071-figure01": {
    resolution: "combined-analysis",
    resolutionReason: "労働力調査の完全失業率と職業安定業務統計の有効求人倍率を別系列として一次資料へ接続",
    metricKeys: ["unemployment-rate", "active-job-opening-ratio"],
    units: ["%", "倍"],
    geoScopes: ["japan"],
    primarySources: [
      officialSource("総務省統計局", "労働力調査", "https://www.stat.go.jp/data/roudou/", ["1972"]),
      officialSource("厚生労働省", "一般職業紹介状況", "https://www.mhlw.go.jp/toukei/list/114-1.html", ["1972"]),
    ],
  },
  "japan-zue-2025-26-p077-table01": {
    resolution: "reuse-existing-metric",
    resolutionReason: "厚生労働省の地域別最低賃金全国一覧と既存指標を照合",
    metricKeys: ["minimum-wage-by-region"],
    units: ["円"],
    geoScopes: ["prefecture-set"],
    primarySources: [officialSource("厚生労働省", "地域別最低賃金の全国一覧", "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/", ["2024"])],
  },
  "japan-zue-2025-26-p131-figure02": {
    resolution: "combined-analysis",
    resolutionReason: "生産農業所得統計の農業産出額を地域構成の分析材料として一次資料へ接続",
    metricKeys: ["agricultural-output"],
    units: ["億円"],
    geoScopes: ["prefecture-set"],
    primarySources: [officialSource("農林水産省", "生産農業所得統計", "https://www.maff.go.jp/j/tokei/kouhyou/nougyou_sansyutu/", ["2023"])],
  },
  "japan-zue-2025-26-p393-table02": {
    resolution: "combined-analysis",
    resolutionReason: "宿泊旅行統計調査の延べ宿泊者数と客室稼働率を別系列として一次資料へ接続",
    metricKeys: ["total-overnight-guests", "room-utilization-rate"],
    units: ["人泊", "%"],
    geoScopes: ["prefecture-set"],
    primarySources: [officialSource("観光庁", "宿泊旅行統計調査", "https://www.mlit.go.jp/kankocho/tokei_hakusyo/shukuhakutokei.html", ["2024"])],
  },
  "japan-zue-2025-26-p436-table02": {
    resolution: "new-metric",
    resolutionReason: "文部科学省の2025年度調査PDFを再取得・47都道府県検算できる新規指標として採択",
    metricKeys: ["students-requiring-japanese-instruction"],
    units: ["人"],
    geoScopes: ["prefecture-set"],
    primarySources: [officialSource("文部科学省", "日本語指導が必要な児童生徒の受入状況等に関する調査 令和7年度", "https://www.mext.go.jp/content/20260525-mxt_kyokoku-000049811_03.pdf", ["2025"])],
  },
  "japan-zue-2025-26-p457-table01": {
    resolution: "combined-analysis",
    resolutionReason: "被保護者調査の実数と世帯千対を別指標として一次資料へ接続",
    metricKeys: ["households-on-public-assistance", "households-on-public-assistance-per-1000"],
    units: ["世帯"],
    geoScopes: ["prefecture-set"],
    primarySources: [officialSource("厚生労働省", "被保護者調査", "https://www.mhlw.go.jp/toukei/list/74-16.html", ["2023"])],
  },
  "japan-zue-2025-26-p458-table02": {
    resolution: "combined-analysis",
    resolutionReason: "人口動態統計の乳児死亡数と出生千対を別指標として一次資料へ接続",
    metricKeys: ["infant-deaths", "infant-mortality-rate-per-1000-births"],
    units: ["人"],
    geoScopes: ["prefecture-set"],
    primarySources: [officialSource("厚生労働省", "人口動態統計", "https://www.mhlw.go.jp/toukei/list/81-1.html", ["2023"])],
  },
  "japan-zue-2025-26-p460-figure01": {
    resolution: "reuse-existing-metric",
    resolutionReason: "医療施設調査の人口10万人当たり一般病院病床数として一次資料と既存指標を照合",
    metricKeys: ["general-hospital-bed-count-per-100k"],
    units: ["床"],
    geoScopes: ["prefecture-set"],
    primarySources: [officialSource("厚生労働省", "医療施設調査", "https://www.mhlw.go.jp/toukei/list/79-1.html", ["2023"])],
  },
  "japan-zue-2025-26-p467-table01": {
    resolution: "combined-analysis",
    resolutionReason: "都道府県別生命表の男女・年齢別平均余命を別系列として一次資料へ接続",
    metricKeys: ["average-life-expectancy-male", "average-life-expectancy-female-20", "average-life-expectancy-female-65"],
    units: ["年"],
    geoScopes: ["prefecture-set"],
    primarySources: [officialSource("厚生労働省", "都道府県別生命表", "https://www.mhlw.go.jp/toukei/list/6-17.html", ["2020"])],
  },
};

function officialSource(
  organization: string,
  publicationOrDataset: string,
  url: string,
  dataYears: string[],
): EvidencePrimarySource {
  return {
    organization,
    publicationOrDataset,
    url,
    termsUrl: GOVERNMENT_TERMS_URL,
    dataYears,
    checkedAt: JAPAN_ZUE_REVIEWED_AT,
    rights: "allowed",
  };
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

export function resolveSourcePolicy(organizations: readonly string[]): SourcePolicy | undefined {
  return JAPAN_ZUE_SOURCE_POLICIES.find((policy) =>
    organizations.some((organization) => policy.pattern.test(organization)),
  );
}

function rolesFor(
  resolution: JapanZueEvidenceItem["resolution"],
  geoScopes: readonly EvidenceGeoScope[],
): EvidenceContentRole[] {
  if (resolution === "reuse-existing-metric" || resolution === "new-metric") {
    const roles: EvidenceContentRole[] = ["survey", "theme", "blog", "youtube", "instagram", "x"];
    if (geoScopes.includes("prefecture-set")) roles.unshift("ranking", "area");
    return roles;
  }
  if (resolution === "combined-analysis") return ["theme", "blog", "youtube", "instagram", "x"];
  if (resolution === "context-only") return ["blog", "note", "youtube"];
  return [];
}

function primaryFromMetric(metric: MetricLineage): EvidencePrimarySource {
  const official = resolveSourcePolicy([metric.sourceName]);
  const sourceUrl = metric.sourceUrl ?? official?.url ?? "https://www.e-stat.go.jp/";
  const officialUrl = /^https:\/\/[^/]*(?:\.go\.jp|e-stat\.go\.jp)(?:\/|$)/.test(sourceUrl);
  return {
    organization: official?.organization ?? metric.sourceName,
    publicationOrDataset: metric.sourceName,
    ...(metric.datasetId ? { datasetId: metric.datasetId } : {}),
    url: sourceUrl,
    ...(official?.termsUrl ? { termsUrl: official.termsUrl } : {}),
    dataYears: [...metric.dataYears],
    checkedAt: JAPAN_ZUE_REVIEWED_AT,
    rights: official?.rights ?? (officialUrl ? "allowed" : "needs-review"),
  };
}

export function resolveJapanZueCandidate(
  candidate: JapanZueCandidate,
  metrics: Readonly<Record<string, MetricLineage>>,
): JapanZueEvidenceItem {
  const override = JAPAN_ZUE_MANUAL_OVERRIDES[candidate.id];
  const matchedMetrics = unique(
    override?.metricKeys ??
      candidate.metricCandidates
        .filter(({ score }) => score === 1)
        .map(({ key }) => key)
        .filter((key) => metrics[key]?.isActive),
  );
  const primaryMetric = matchedMetrics.map((key) => metrics[key]).find(Boolean);
  const sourcePolicy = resolveSourcePolicy(candidate.primarySourceOrganizations);
  const publication = candidate.publicationHints[0] ?? `${sourcePolicy?.organization ?? "一次資料"}公表資料`;

  let resolution: JapanZueEvidenceItem["resolution"];
  let resolutionReason: string;
  let primarySource: EvidencePrimarySource | undefined;

  if (override) {
    resolution = override.resolution;
    resolutionReason = override.resolutionReason;
    primarySource = override.primarySource ?? (primaryMetric ? primaryFromMetric(primaryMetric) : undefined);
  } else if (primaryMetric) {
    resolution = "reuse-existing-metric";
    resolutionReason = "既存MetricConfigとの高信頼一致を確認";
    primarySource = primaryFromMetric(primaryMetric);
  } else if (sourcePolicy?.rights === "allowed") {
    resolution = "primary-source-unavailable";
    resolutionReason = "所管機関候補までは特定したが、個別dataset・表・単位・地理粒度が未照合のためfail-closedで保留";
    primarySource = {
      organization: sourcePolicy.organization,
      publicationOrDataset: publication,
      url: sourcePolicy.url,
      ...(sourcePolicy.termsUrl ? { termsUrl: sourcePolicy.termsUrl } : {}),
      dataYears: [...candidate.dataYears],
      checkedAt: JAPAN_ZUE_REVIEWED_AT,
      rights: sourcePolicy.rights,
    };
  } else if (sourcePolicy) {
    resolution = "rights-hold";
    resolutionReason = "一次資料候補は特定できたが、個別利用条件の確認が必要";
    primarySource = {
      organization: sourcePolicy.organization,
      publicationOrDataset: publication,
      url: sourcePolicy.url,
      dataYears: [...candidate.dataYears],
      checkedAt: JAPAN_ZUE_REVIEWED_AT,
      rights: sourcePolicy.rights,
    };
  } else {
    resolution = "primary-source-unavailable";
    resolutionReason = "一次資料を一意に特定できないためfail-closedで保留";
  }

  const metricLineages = matchedMetrics.map((key) => metrics[key]).filter(Boolean);
  const metricPrimarySources = metricLineages.map(primaryFromMetric);
  const primarySources = uniquePrimarySources(
    override?.primarySources ?? [
      ...(primarySource ? [primarySource] : []),
      ...metricPrimarySources,
    ],
  );
  const contractGeoScopes = override?.geoScopes ?? unique(metricLineages.flatMap(({ geoScopes }) => geoScopes));
  const contractUnits = override?.units ?? unique(metricLineages.map(({ unit }) => unit));
  const mapping = {
    ...(matchedMetrics.length ? { metricKeys: matchedMetrics } : {}),
    ...(metricLineages.flatMap(({ surveyIds }) => surveyIds).length
      ? { surveyIds: unique(metricLineages.flatMap(({ surveyIds }) => surveyIds)) }
      : {}),
    ...(primaryMetric ? { categoryKey: primaryMetric.category } : {}),
    ...(metricLineages.flatMap(({ themeSlugs }) => themeSlugs).length
      ? { themeSlugs: unique(metricLineages.flatMap(({ themeSlugs }) => themeSlugs)) }
      : {}),
    geoScopes: contractGeoScopes.length ? contractGeoScopes : [...candidate.geoScopes],
    contentRoles: override?.contentRoles ?? rolesFor(resolution, contractGeoScopes),
  };

  return {
    id: candidate.id,
    source: candidate.source,
    topicHint: candidate.topicHint,
    sourceFingerprint: candidate.sourceFingerprint,
    resolution,
    resolutionReason,
    ...(primarySource ? { primarySource } : {}),
    primarySources,
    dataContract: {
      units: contractUnits,
      geoScopes: contractGeoScopes,
      dataYears: unique(primarySources.flatMap(({ dataYears }) => dataYears)),
    },
    mapping,
    review: {
      method: override ? "manual-override" : "deterministic-policy",
      reviewedAt: JAPAN_ZUE_REVIEWED_AT,
      policyVersion: JAPAN_ZUE_POLICY_VERSION,
    },
  };
}

function uniquePrimarySources(sources: readonly EvidencePrimarySource[]): EvidencePrimarySource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = `${source.url}\0${source.datasetId ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
