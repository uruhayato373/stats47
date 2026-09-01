import type { MunicipalityEntityPolicy } from '@stats47/area';

import { binMunicipalityValues } from './bin-municipality-values';

import type {
  MunicipalityRankingItemSnapshot,
  MunicipalityRankingValue,
  MunicipalityRankingValuesSnapshot,
} from '../types/municipality-snapshot';

const PLACEHOLDER_UNITS: ReadonlySet<string> = new Set([
  '-',
  '\u2010', // ‐
  '\u2212', // −
  '\u2015', // ―
  '\u2014', // —
]);

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
  /** title 衝突時の表示用限定子 (呼び出し側が衝突判定してから渡す) */
  subtitle?: string | null;
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
  // e-Stat 由来の行 unit を優先するが、placeholder ダッシュ (財政力指数などの無次元指標で
  // e-Stat が「‐」を返す) は unit ではないので config の unit へ倒す
  // (metric-config-standards が config 側の「‐」を lint error で禁じているため config が信頼できる)。
  const rowUnit = firstLatestRow?.unit?.trim() ?? '';
  const unit =
    rowUnit && !PLACEHOLDER_UNITS.has(rowUnit) ? rowUnit : metric.unit;
  const excludedEntityCount = entityPolicy.entities.filter(
    (entity) => entity.disposition !== 'publishable'
  ).length;

  return {
    item: {
      schemaVersion: 1,
      generatedAt,
      rankingKey: metric.key,
      title: metric.title,
      ...(metric.subtitle ? { subtitle: metric.subtitle } : {}),
      description:
        metric.description ?? `${metric.title}を市区町村別に比較します。`,
      unit,
      latestYear: { yearCode: latestYearCode, yearName },
      entityPolicyKey: entityPolicy.key,
      entityCount: publishable.size,
      valueCount: values.length,
      excludedEntityCount,
      source: { name: metric.source.displayName, url: metric.source.url },
      // テーマ一覧カードのミニチャート用。20 ビン + 裾の underflow/overflow 畳み
      // (ランキングページのヒストグラムと同じ純関数)。countInPref は item に持たない。
      distribution: (
        binMunicipalityValues(values, { binCount: 20 })?.bins ?? []
      ).map((bin) => ({
        x0: bin.x0,
        x1: bin.x1,
        count: bin.count,
        isOverflow: bin.isOverflow,
        isUnderflow: bin.isUnderflow,
      })),
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
