import type { MunicipalityEntityPolicy } from '@stats47/area';

import type {
  MunicipalityRankingItemSnapshot,
  MunicipalityRankingValue,
  MunicipalityRankingValuesSnapshot,
} from '../types/municipality-snapshot';

export interface MunicipalityStatsRow {
  areaCode: string;
  areaName: string;
  yearCode: string;
  yearName?: string | null;
  value: number | null;
  unit?: string | null;
}

export interface MunicipalityMetricSnapshotConfig {
  key: string;
  title: string;
  description?: string | null;
  unit: string;
  source: { displayName: string; url: string };
  valuePolicy?: {
    minExclusive?: number;
    minInclusive?: number;
    maxInclusive?: number;
  };
}

interface BuildMunicipalitySnapshotsInput {
  metric: MunicipalityMetricSnapshotConfig;
  rows: readonly MunicipalityStatsRow[];
  entityPolicy: MunicipalityEntityPolicy;
  generatedAt: string;
}

function satisfiesValuePolicy(
  value: number,
  policy: MunicipalityMetricSnapshotConfig['valuePolicy']
): boolean {
  if (!policy) return true;
  if (policy.minExclusive !== undefined && value <= policy.minExclusive)
    return false;
  if (policy.minInclusive !== undefined && value < policy.minInclusive)
    return false;
  if (policy.maxInclusive !== undefined && value > policy.maxInclusive)
    return false;
  return true;
}

export function buildMunicipalityRankingSnapshots({
  metric,
  rows,
  entityPolicy,
  generatedAt,
}: BuildMunicipalitySnapshotsInput): {
  item: MunicipalityRankingItemSnapshot;
  values: MunicipalityRankingValuesSnapshot;
} {
  const publishable = new Map(
    entityPolicy.entities
      .filter((entity) => entity.disposition === 'publishable')
      .map((entity) => [entity.code, entity])
  );
  if (publishable.size === 0) {
    throw new Error('municipality entity policy has no publishable entities');
  }

  const eligibleRows = rows.filter((row) => publishable.has(row.areaCode));
  const yearCodes = [...new Set(eligibleRows.map((row) => row.yearCode))].sort(
    (a, b) => Number(b.slice(0, 4)) - Number(a.slice(0, 4))
  );
  const latestYearCode = yearCodes[0];
  if (!latestYearCode)
    throw new Error(`municipality rows are empty: ${metric.key}`);

  const latestRows = eligibleRows.filter(
    (row) => row.yearCode === latestYearCode
  );
  const seen = new Set<string>();
  for (const row of latestRows) {
    if (seen.has(row.areaCode)) {
      throw new Error(
        `duplicate municipality observation: ${metric.key}/${latestYearCode}/${row.areaCode}`
      );
    }
    seen.add(row.areaCode);
  }

  const ranked = latestRows
    .filter(
      (row): row is MunicipalityStatsRow & { value: number } =>
        row.value !== null &&
        Number.isFinite(row.value) &&
        satisfiesValuePolicy(row.value, metric.valuePolicy)
    )
    .sort((a, b) => b.value - a.value || a.areaCode.localeCompare(b.areaCode));

  let previousValue: number | null = null;
  let previousRank = 0;
  const values: MunicipalityRankingValue[] = ranked.map((row, index) => {
    const entity = publishable.get(row.areaCode);
    if (!entity)
      throw new Error(`publishable entity disappeared: ${row.areaCode}`);
    const rank = previousValue === row.value ? previousRank : index + 1;
    previousValue = row.value;
    previousRank = rank;
    return {
      areaCode: row.areaCode,
      areaName: entity.name,
      prefectureCode: entity.prefectureCode,
      value: row.value,
      rank,
    };
  });

  if (values.length === 0) {
    throw new Error(
      `latest municipality partition has no numeric values: ${metric.key}`
    );
  }

  const firstLatestRow = latestRows[0];
  const yearName = firstLatestRow?.yearName ?? latestYearCode;
  const unit = firstLatestRow?.unit || metric.unit;
  const excludedEntityCount = entityPolicy.entities.filter(
    (entity) => entity.disposition !== 'publishable'
  ).length;

  return {
    item: {
      schemaVersion: 1,
      generatedAt,
      rankingKey: metric.key,
      title: metric.title,
      description:
        metric.description ?? `${metric.title}を市区町村別に比較します。`,
      unit,
      latestYear: { yearCode: latestYearCode, yearName },
      entityPolicyKey: entityPolicy.key,
      entityCount: publishable.size,
      valueCount: values.length,
      excludedEntityCount,
      source: { name: metric.source.displayName, url: metric.source.url },
    },
    values: {
      schemaVersion: 1,
      generatedAt,
      rankingKey: metric.key,
      yearCode: latestYearCode,
      yearName,
      unit,
      count: values.length,
      values,
    },
  };
}
