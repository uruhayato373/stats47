import data from "../../../../../data/source-inventory/japan-zue/policy.json";
import type {
  EvidenceContentRole,
  EvidenceGeoScope,
  EvidencePrimarySource,
  JapanZueCandidate,
  JapanZueEvidenceItem,
} from "../types";

/**
 * 日本国勢図会の解決方針の読み込み口。記録の正本は台帳 `source-inventory.japan-zue-policy`
 * (data/source-inventory/japan-zue/policy.json + Schema。版・確認日・規約の URL・所管機関の方針・人が決めた解決)。
 * 所管機関の名前に当てる正規表現と解決の関数はコードに置き、台帳の organization で結ぶ。
 */
export const JAPAN_ZUE_POLICY_VERSION = data.policyVersion;
export const JAPAN_ZUE_REVIEWED_AT = data.reviewedAt;
export const GOVERNMENT_TERMS_URL = data.governmentTermsUrl;

interface SourcePolicy {
  pattern: RegExp;
  organization: string;
  url: string;
  termsUrl?: string;
  rights: EvidencePrimarySource["rights"];
}

/** 所管機関 (台帳の sourcePolicies[].organization) → 出典の機関名に当てる正規表現 */
const SOURCE_POLICY_PATTERNS: Readonly<Record<string, RegExp>> = {
  総務省統計局: /総務省統計局|統計局/,
  総務省: /総務省|消防庁/,
  国土地理院: /国土地理院/,
  気象庁: /気象庁/,
  海上保安庁: /海上保安庁/,
  国土交通省: /国土交通省|観光庁/,
  農林水産省: /農林水産省|林野庁|水産庁/,
  経済産業省: /経済産業省|資源エネルギー庁|特許庁/,
  厚生労働省: /厚生労働省/,
  文部科学省: /文部科学省|文化庁/,
  内閣府: /内閣府|内閣官房/,
  財務省: /財務省|国税庁/,
  環境省: /環境省/,
  法務省: /法務省|出入国在留管理庁/,
  警察庁: /警察庁/,
  こども家庭庁: /こども家庭庁/,
  "国立社会保障・人口問題研究所": /国立社会保障・人口問題研究所/,
  日本銀行: /日本銀行/,
  国際機関: /OECD|国際連合|UNCTAD|WHO|ILO|FAO|世界銀行|IMF/,
};

/**
 * 所管機関と公式 landing URL の authored policy (台帳の並びが照合の優先順)。
 * 個別 dataset URL が metric lineage から得られる場合はそちらを優先する。
 */
export const JAPAN_ZUE_SOURCE_POLICIES: readonly SourcePolicy[] = (
  data.sourcePolicies as readonly Omit<SourcePolicy, "pattern">[]
).map((policy) => {
  const pattern = SOURCE_POLICY_PATTERNS[policy.organization];
  if (!pattern) {
    throw new Error(`japan-zue の所管機関に正規表現がありません: ${policy.organization}`);
  }
  return { pattern, ...policy };
});

for (const organization of Object.keys(SOURCE_POLICY_PATTERNS)) {
  if (!data.sourcePolicies.some((policy) => policy.organization === organization)) {
    throw new Error(`japan-zue の正規表現に対応する所管機関が台帳にありません: ${organization}`);
  }
}

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

/** WP4 pilot を含む、人手で意味を確認した例外だけを置く (台帳の manualOverrides)。 */
export const JAPAN_ZUE_MANUAL_OVERRIDES =
  data.manualOverrides as Readonly<Record<string, JapanZueManualOverride>>;

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
