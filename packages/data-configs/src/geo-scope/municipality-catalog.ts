import { STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY } from '@stats47/area';

import availabilityData from '../../../../data/municipalities/catalog/metric-availability.json';
import themesData from '../../../../data/municipalities/catalog/themes.json';
import { METRICS_REGISTRY } from '../registry';
import {
  SSDS_EXPANSION_NEW_THEMES,
  SSDS_EXPANSION_POSITIVE_ONLY_KEYS,
  SSDS_EXPANSION_THEME_METRICS,
} from './municipality-ssds-expansion';
import {
  MUNICIPALITY_HOUSING_SURVEY_CANDIDATE_REASON,
  MUNICIPALITY_HOUSING_SURVEY_KEYS,
  MUNICIPALITY_HOUSING_SURVEY_STATUS,
  MUNICIPALITY_HOUSING_SURVEY_THEME,
} from './municipality-housing-survey-expansion';

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
 * 記録の正本は台帳 `municipalities.metric-availability` (data/municipalities/catalog/metric-availability.json + Schema)。
 * 社会・人口統計体系と住宅・土地統計調査の拡充分は、それぞれの台帳の記録からここで導いて後ろへ足す。
 */
export const MUNICIPALITY_METRIC_AVAILABILITY: Readonly<
  Record<string, MunicipalityMetricAvailability>
> = {
  ...(availabilityData.metrics as Record<string, MunicipalityMetricAvailability>),
  ...ssdsExpansionAvailability(),
  ...housingSurveyAvailability(),
};

function housingSurveyAvailability(): Record<string, MunicipalityMetricAvailability> {
  return Object.fromEntries(
    MUNICIPALITY_HOUSING_SURVEY_KEYS.map((metricKey) => [
      metricKey,
      MUNICIPALITY_HOUSING_SURVEY_STATUS === 'published'
        ? ({
            status: 'published',
            entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
            comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
            // 推計値の丸めで 100% をわずかに超える地域を除く
            valuePolicy: { minInclusive: 0, maxInclusive: 100 },
          } satisfies MunicipalityMetricAvailability)
        : ({ status: 'candidate', reason: MUNICIPALITY_HOUSING_SURVEY_CANDIDATE_REASON } satisfies MunicipalityMetricAvailability),
    ])
  );
}

function ssdsExpansionAvailability(): Record<string, MunicipalityMetricAvailability> {
  const positiveOnly = new Set(SSDS_EXPANSION_POSITIVE_ONLY_KEYS);
  return Object.fromEntries(
    Object.values(SSDS_EXPANSION_THEME_METRICS)
      .flat()
      .map((metricKey) => [
        metricKey,
        {
          status: 'published',
          entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
          comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
          // 0 の割合が 50% 以上 (施設・区域が無い自治体の 0) は 0 を除いて順位を付ける
          ...(positiveOnly.has(metricKey) ? { valuePolicy: { minExclusive: 0 } } : {}),
        } satisfies MunicipalityMetricAvailability,
      ])
  );
}

/** 手書きの市区町村テーマ (台帳 `municipalities.themes`)。slug はキーから戻す。 */
const BASE_MUNICIPALITY_THEME_CATALOGS: Readonly<
  Record<string, MunicipalityThemeCatalog>
> = Object.fromEntries(
  Object.entries(themesData.themes).map(([slug, theme]) => [
    slug,
    { slug, ...theme } as MunicipalityThemeCatalog,
  ])
);


/** 既存テーマに社会・人口統計体系の拡充分 (municipality-ssds-expansion.ts) を足し、新設テーマを加えたもの。 */
export const MUNICIPALITY_THEME_CATALOGS: Readonly<
  Record<string, MunicipalityThemeCatalog>
> = withSsdsExpansionThemes(BASE_MUNICIPALITY_THEME_CATALOGS);

function withSsdsExpansionThemes(
  base: Readonly<Record<string, MunicipalityThemeCatalog>>
): Record<string, MunicipalityThemeCatalog> {
  const themes: Record<string, MunicipalityThemeCatalog> = {
    ...base,
    [MUNICIPALITY_HOUSING_SURVEY_THEME.slug]: {
      ...MUNICIPALITY_HOUSING_SURVEY_THEME,
      metricKeys: MUNICIPALITY_HOUSING_SURVEY_KEYS,
      entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
      status: MUNICIPALITY_HOUSING_SURVEY_STATUS === 'published' ? 'active' : 'draft',
    },
  };
  for (const [slug, { title, defaultMetricKey }] of Object.entries(SSDS_EXPANSION_NEW_THEMES)) {
    if (themes[slug]) throw new Error(`SSDS expansion theme already exists: ${slug}`);
    themes[slug] = {
      slug,
      title,
      metricKeys: [],
      defaultMetricKey,
      entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
      status: 'active',
    };
  }
  for (const [slug, metricKeys] of Object.entries(SSDS_EXPANSION_THEME_METRICS)) {
    const theme = themes[slug];
    if (!theme) throw new Error(`SSDS expansion references unknown municipality theme: ${slug}`);
    themes[slug] = { ...theme, metricKeys: [...theme.metricKeys, ...metricKeys] };
  }
  // 拡充で新設されるテーマにも手書きの指標を末尾へ足す (台帳 municipalities.themes の appendedMetrics)
  for (const [slug, metricKeys] of Object.entries(themesData.appendedMetrics)) {
    const theme = themes[slug];
    if (!theme) throw new Error(`appendedMetrics references unknown municipality theme: ${slug}`);
    themes[slug] = { ...theme, metricKeys: [...theme.metricKeys, ...metricKeys] };
  }
  return themes;
}

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
