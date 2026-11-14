import { STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY } from '@stats47/area';

import { METRICS_REGISTRY } from '../registry';
import {
  MUNICIPALITY_METRIC_AVAILABILITY,
  MUNICIPALITY_THEME_CATALOGS,
  collectPublishedMunicipalityRankingKeys,
  type MunicipalityMetricAvailability,
} from './municipality-known-keys';

export {
  KNOWN_MUNICIPALITY_RANKING_KEYS,
  KNOWN_MUNICIPALITY_THEME_SLUGS,
  MUNICIPALITY_METRIC_AVAILABILITY,
  MUNICIPALITY_THEME_CATALOGS,
  buildKnownMunicipalityThemeSlugs,
} from './municipality-known-keys';
export type { MunicipalityMetricAvailability, MunicipalityThemeCatalog } from './municipality-known-keys';

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
  const keys = collectPublishedMunicipalityRankingKeys(decisions);
  for (const metricKey of keys) {
    const metric = METRICS_REGISTRY[metricKey];
    if (!metric?.isActive || !metric.entities.includes('city')) {
      throw new Error(
        `published municipality metric must be active and support city: ${metricKey}`
      );
    }
  }
  return keys;
}

// 公開済みの指標が registry で active かつ city 対応であることを読み込み時に確かめる (Edge 向けの軽い一覧は registry を読まないため、照合はここで行う)
buildKnownMunicipalityRankingKeys();

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
