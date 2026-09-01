import { STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY } from '@stats47/area';

import { METRICS_REGISTRY } from '../registry';

export type MunicipalityMetricAvailability =
  | {
      status: 'published';
      entityPolicyKey: string;
      comparisonModes: readonly string[];
      valuePolicy?: {
        minExclusive?: number;
        minInclusive?: number;
        maxInclusive?: number;
      };
    }
  | { status: 'candidate'; reason: string }
  | { status: 'unsupported'; reason: string }
  | { status: 'unknown'; reason: string };

export interface MunicipalityThemeCatalog {
  slug: string;
  title: string;
  metricKeys: readonly string[];
  defaultMetricKey: string;
  entityPolicyKey: string;
  status: 'active' | 'draft';
}

/**
 * 人手で品質判断した差分だけを書く。MetricConfig.entities は取得可能性であり、
 * ここに無い city metric を自動で published に昇格しない。
 */
export const MUNICIPALITY_METRIC_AVAILABILITY: Readonly<
  Record<string, MunicipalityMetricAvailability>
> = {
  'elderly-population-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
    // 双葉町は2020年国勢調査人口が0で比率を定義できない。取得値0を欠測相当として除外する。
    valuePolicy: { minExclusive: 0, maxInclusive: 100 },
  },
  // ---- 第1拡充バッチ (2026-09-01 公開・人手品質判断の根拠は各コメント) ----
  // 共通根拠: expansion-survey (2026-09-01) で machine-clean (1,913 entity・重複0・unknownCode 0)。
  // 公開R2 cities.json の最新年 top/bottom 5 を常識照合済み (特別区部9,733,276人・豊島区23,182人/km²等)。
  // 双葉町 (07546・2020国勢調査人口0) は count系=実値0を保持 / 比率系=元データが null で既に除外済み。
  'total-population': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
    // 双葉町の0人は2020国勢調査の実値 (避難指示)。除外しない。
  },
  'population-density-per-km2-inhabitable-area': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
    // 人口0の団体は密度0が定義どおり成立するため除外しない。
    // 類似キー population-density-habitable は同一値 (min/max 完全一致) の重複のため公開しない。
    valuePolicy: { minInclusive: 0 },
  },
  'young-population-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
    // 0%は「子どもが1人もいない団体」として実在しうるため包含下限。0/0 (双葉町) は元データ null。
    valuePolicy: { minInclusive: 0, maxInclusive: 100 },
  },
  'production-age-population-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
    valuePolicy: { minInclusive: 0, maxInclusive: 100 },
  },
  households: {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'moving-in-excess-rate': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
    // e-Stat #A05307 (無印=外国人含む総数) を実メタで確認済み。負値は転出超過の実値
    // (2020最小 浪江町 -14.98%) のため下限は設けない。
  },
  // ---- 第1拡充バッチここまで ----
  'fiscal-strength-index': {
    status: 'unknown',
    reason: '財政主体、東京23特別区、行政区、0と欠測の監査が完了していないため',
  },
  'culture-recreation-cost-all-households': {
    status: 'unknown',
    reason: 'WP0でcities.json artifact不在。未取得と非対応を区別できないため',
  },
  'education-cost-all-households': {
    status: 'unknown',
    reason: 'WP0でcities.json artifact不在。未取得と非対応を区別できないため',
  },
  'healthcare-cost-all-households': {
    status: 'unknown',
    reason: 'WP0でcities.json artifact不在。未取得と非対応を区別できないため',
  },
  'housing-cost-all-households': {
    status: 'unknown',
    reason: 'WP0でcities.json artifact不在。未取得と非対応を区別できないため',
  },
};

export const MUNICIPALITY_THEME_CATALOGS: Readonly<
  Record<string, MunicipalityThemeCatalog>
> = {
  'aging-society': {
    slug: 'aging-society',
    title: '市区町村の高齢化',
    metricKeys: ['elderly-population-ratio'],
    defaultMetricKey: 'elderly-population-ratio',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  population: {
    slug: 'population',
    title: '市区町村の人口',
    metricKeys: [
      'total-population',
      'population-density-per-km2-inhabitable-area',
      'young-population-ratio',
      'production-age-population-ratio',
      'households',
      'moving-in-excess-rate',
    ],
    defaultMetricKey: 'total-population',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'local-finance': {
    slug: 'local-finance',
    title: '市区町村の地方財政',
    metricKeys: [
      'fiscal-strength-index',
      'current-balance-ratio-city',
      'real-public-debt-service-ratio-city',
      'future-burden-ratio-city',
      'real-balance-ratio-city',
      'per-taxpayer-taxable-income',
    ],
    defaultMetricKey: 'fiscal-strength-index',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'draft',
  },
};

export function getMunicipalityMetricAvailability(
  metricKey: string
): MunicipalityMetricAvailability {
  const metric = METRICS_REGISTRY[metricKey];
  if (!metric)
    return { status: 'unsupported', reason: 'MetricConfigが存在しないため' };
  if (!metric.entities.includes('city')) {
    return {
      status: 'unsupported',
      reason: 'MetricConfigがcityを取得対象に持たないため',
    };
  }
  return (
    MUNICIPALITY_METRIC_AVAILABILITY[metricKey] ?? {
      status: 'unknown',
      reason: '市区町村でのentity・年度・値分布・出典の公開監査が未完了のため',
    }
  );
}

export function listMunicipalityMetricAvailability(): Array<{
  metricKey: string;
  availability: MunicipalityMetricAvailability;
}> {
  return Object.values(METRICS_REGISTRY)
    .filter((metric) => metric.isActive && metric.entities.includes('city'))
    .map((metric) => ({
      metricKey: metric.key,
      availability: getMunicipalityMetricAvailability(metric.key),
    }));
}

export function buildKnownMunicipalityRankingKeys(
  decisions: Readonly<
    Record<string, MunicipalityMetricAvailability>
  > = MUNICIPALITY_METRIC_AVAILABILITY
): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const [metricKey, availability] of Object.entries(decisions)) {
    if (availability.status !== 'published') continue;
    const metric = METRICS_REGISTRY[metricKey];
    if (!metric?.isActive || !metric.entities.includes('city')) {
      throw new Error(
        `published municipality metric must be active and support city: ${metricKey}`
      );
    }
    keys.add(metricKey);
  }
  return keys;
}

export function buildKnownMunicipalityThemeSlugs(
  themes: Readonly<
    Record<string, MunicipalityThemeCatalog>
  > = MUNICIPALITY_THEME_CATALOGS,
  knownRankingKeys: ReadonlySet<string> = buildKnownMunicipalityRankingKeys()
): ReadonlySet<string> {
  const slugs = new Set<string>();
  for (const [key, theme] of Object.entries(themes)) {
    if (theme.status !== 'active') continue;
    if (theme.slug !== key) {
      throw new Error(
        `municipality theme key/slug mismatch: ${key}/${theme.slug}`
      );
    }
    if (
      theme.metricKeys.some((metricKey) => !knownRankingKeys.has(metricKey))
    ) {
      throw new Error(
        `active municipality theme has unpublished metric: ${key}`
      );
    }
    slugs.add(theme.slug);
  }
  return slugs;
}

export const KNOWN_MUNICIPALITY_RANKING_KEYS =
  buildKnownMunicipalityRankingKeys();
export const KNOWN_MUNICIPALITY_THEME_SLUGS =
  buildKnownMunicipalityThemeSlugs();

export function validateMunicipalityCatalogs(): string[] {
  const errors: string[] = [];
  for (const metricKey of Object.keys(MUNICIPALITY_METRIC_AVAILABILITY)) {
    const metric = METRICS_REGISTRY[metricKey];
    if (!metric)
      errors.push(`[availability-key] ${metricKey}: MetricConfig不在`);
    else if (!metric.isActive)
      errors.push(`[availability-inactive] ${metricKey}`);
    else if (!metric.entities.includes('city')) {
      errors.push(`[availability-entity] ${metricKey}: city非対応`);
    }
  }

  for (const [metricKey, availability] of Object.entries(
    MUNICIPALITY_METRIC_AVAILABILITY
  )) {
    if (availability.status !== 'published' || !availability.valuePolicy)
      continue;
    const { minExclusive, minInclusive, maxInclusive } =
      availability.valuePolicy;
    if (minExclusive !== undefined && minInclusive !== undefined) {
      errors.push(`[value-policy-min] ${metricKey}: 下限は一方だけ指定する`);
    }
    const lower = minExclusive ?? minInclusive;
    if (
      lower !== undefined &&
      maxInclusive !== undefined &&
      lower >= maxInclusive
    ) {
      errors.push(`[value-policy-range] ${metricKey}: 下限が上限以上`);
    }
  }

  for (const [key, theme] of Object.entries(MUNICIPALITY_THEME_CATALOGS)) {
    if (theme.slug !== key) errors.push(`[theme-slug] ${key}/${theme.slug}`);
    if (!theme.metricKeys.includes(theme.defaultMetricKey)) {
      errors.push(`[theme-default] ${key}: defaultMetricKeyがmetrics外`);
    }
    if (new Set(theme.metricKeys).size !== theme.metricKeys.length) {
      errors.push(`[theme-duplicate] ${key}: metric重複`);
    }
    if (theme.entityPolicyKey !== STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY) {
      errors.push(`[theme-policy] ${key}: 未知のentity policy`);
    }
    for (const metricKey of theme.metricKeys) {
      const metric = METRICS_REGISTRY[metricKey];
      if (!metric?.isActive || !metric.entities.includes('city')) {
        errors.push(
          `[theme-metric] ${key}/${metricKey}: active city metricではない`
        );
      }
    }
  }
  return errors;
}
