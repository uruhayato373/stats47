import { satisfiesValuePolicy, type MunicipalityMetricSnapshotConfig } from './build-municipality-snapshots';
import { municipalityRankingDisplayTitle } from './municipality-names';

import type { CityDatabookTheme } from '@stats47/data-configs/geo-scope';

import type {
  CityDatabookMetric,
  CityDatabookMetricBasis,
  CityDatabookPopulationChange,
  CityDatabookSection,
  CityDatabookSnapshot,
  CityDatabookWardBreakdown,
  CityDatabookWardMetric,
} from '../types/city-databook';
import type {
  MunicipalityRankingItemSnapshot,
  MunicipalityRankingValuesSnapshot,
} from '../types/municipality-snapshot';

export interface CityDatabookEntity {
  code: string;
  name: string;
  prefectureCode: string;
}

export interface CityPopulationHistoryRow {
  areaCode: string;
  yearCode: string;
  yearName?: string | null;
  value: number | null;
}

export interface BuildCityDatabooksInput {
  /** 公開対象の市区町村 (市区町村の対象集合で publishable のもの)。 */
  entities: readonly CityDatabookEntity[];
  /** 節の順に並べた市区町村テーマ (`listCityDatabookThemes()`)。 */
  themes: readonly CityDatabookTheme[];
  headlineMetricKeys: readonly string[];
  populationMetricKey: string;
  rankings: ReadonlyMap<string, { item: MunicipalityRankingItemSnapshot; values: MunicipalityRankingValuesSnapshot }>;
  basisOf: (rankingKey: string) => CityDatabookMetricBasis;
  /** 人口の全年の値 (`app/stats/<人口>/cities.json` の行)。前回の値を求めるのに使う。 */
  populationHistory: readonly CityPopulationHistoryRow[];
  /** 政令指定都市の行政区の内訳 (buildWardBreakdowns の結果)。無ければ付けない */
  wardBreakdowns?: ReadonlyMap<string, CityDatabookWardBreakdown>;
}

export interface WardBreakdownInput {
  /** 政令指定都市のコード → その行政区 (`@stats47/area` の公開方針で kind が administrative-ward のもの) */
  wardsByCity: ReadonlyMap<string, ReadonlyArray<{ code: string; name: string }>>;
  headlineMetricKeys: readonly string[];
  rankings: BuildCityDatabooksInput['rankings'];
  /** 指標ごとの e-Stat の観測値 (`app/stats/<key>/cities.json` の行。行政区の行を含む) */
  observations: ReadonlyMap<string, readonly CityPopulationHistoryRow[]>;
  /** 市区町村カタログの値の範囲 (市区町村ランキングと同じ判定で行政区の値も選ぶ) */
  valuePolicyOf: (rankingKey: string) => MunicipalityMetricSnapshotConfig['valuePolicy'];
}

/**
 * 政令指定都市ごとに、見出しの指標の行政区の値を束ねる (WardMode `split`。MUNI-DESIGNATED-CITY-WARDS-01)。
 * 年は市全体の値 (市区町村ランキング) と同じ年に揃え、その年に値の無い行政区は載せない。
 * 市の中の順位は値の大きい順で、同じ値は同じ順位。行政区に 1 つも値が無い指標は載せない。
 * 値は市区町村ランキングと同じ値の範囲 (`valuePolicy`) で選ぶ。全区が 0 の指標は、行政区の値が集計されていない
 * (財政力指数・課税所得は e-Stat で行政区が 0 になる。2026-10-28 に横浜市 18 区で確認) ので載せない。
 */
export function buildWardBreakdowns(input: WardBreakdownInput): Map<string, CityDatabookWardBreakdown> {
  const result = new Map<string, CityDatabookWardBreakdown>();
  for (const [cityCode, wards] of input.wardsByCity) {
    const wardCodes = new Set(wards.map((ward) => ward.code));
    const metrics: Record<string, CityDatabookWardMetric> = {};
    for (const key of input.headlineMetricKeys) {
      const ranking = input.rankings.get(key);
      const rows = input.observations.get(key);
      if (!ranking || !rows) continue;
      const yearCode = ranking.values.yearCode;
      const found = rows.filter(
        (row): row is CityPopulationHistoryRow & { value: number } =>
          wardCodes.has(row.areaCode) &&
          String(row.yearCode).slice(0, 4) === yearCode &&
          typeof row.value === 'number' &&
          Number.isFinite(row.value) &&
          satisfiesValuePolicy(row.value, input.valuePolicyOf(key))
      );
      if (found.length === 0 || found.every((row) => row.value === 0)) continue;
      const sorted = [...found].sort((a, b) => b.value - a.value || a.areaCode.localeCompare(b.areaCode));
      metrics[key] = {
        rankingKey: key,
        label: municipalityRankingDisplayTitle(ranking.item),
        unit: ranking.values.unit,
        yearCode,
        yearName: ranking.values.yearName,
        values: sorted.map((row) => ({
          areaCode: row.areaCode,
          value: row.value,
          cityRank: 1 + sorted.filter((other) => other.value > row.value).length,
        })),
      };
    }
    if (Object.keys(metrics).length === 0) continue;
    result.set(cityCode, {
      wards: [...wards].sort((a, b) => a.code.localeCompare(b.code)).map((ward) => ({ areaCode: ward.code, areaName: ward.name })),
      metrics,
    });
  }
  return result;
}

/** 全国順位の順に並んだ値から、県ごとの順位を数える。同じ全国順位 (同じ値) は同じ県内順位にする。 */
function prefectureRanks(values: MunicipalityRankingValuesSnapshot['values']): Map<string, { rank: number; count: number }> {
  const byPrefecture = new Map<string, MunicipalityRankingValuesSnapshot['values']>();
  for (const row of values) {
    const list = byPrefecture.get(row.prefectureCode) ?? [];
    list.push(row);
    byPrefecture.set(row.prefectureCode, list);
  }
  const result = new Map<string, { rank: number; count: number }>();
  for (const rows of byPrefecture.values()) {
    const ordered = [...rows].sort((a, b) => a.rank - b.rank || a.areaCode.localeCompare(b.areaCode));
    let previousNationalRank = -1;
    let previousRank = 0;
    ordered.forEach((row, index) => {
      const rank = row.rank === previousNationalRank ? previousRank : index + 1;
      previousNationalRank = row.rank;
      previousRank = rank;
      result.set(row.areaCode, { rank, count: ordered.length });
    });
  }
  return result;
}

function previousPopulationOf(
  history: readonly CityPopulationHistoryRow[],
  latestYearCode: string
): Map<string, CityDatabookPopulationChange> {
  const result = new Map<string, CityDatabookPopulationChange>();
  for (const row of history) {
    if (row.value === null || !Number.isFinite(row.value) || row.yearCode >= latestYearCode) continue;
    const current = result.get(row.areaCode);
    if (current && current.yearCode >= row.yearCode) continue;
    result.set(row.areaCode, {
      value: row.value,
      yearCode: row.yearCode,
      yearName: row.yearName ?? `${row.yearCode}年`,
    });
  }
  return result;
}

/**
 * 市区町村ランキングの配信値を市区町村ごとに束ねて、市区町村ページのデータブックを作る (純粋関数)。
 *
 * - 値・全国順位・単位・年はランキングの配信値をそのまま写す (ページと順位が食い違わない)
 * - 県内順位は全国順位の順に県ごとに数える
 * - 節は市区町村テーマの順。先に出た節で載せた指標は重ねず、指標が 0 件の節は出さない
 * - 見出しは値のある指標だけ。人口が無い市区町村は作らない (title が人口を使うため)
 */
export function buildCityDatabooks(input: BuildCityDatabooksInput): Map<string, CityDatabookSnapshot> {
  const metricsByCity = new Map<string, Record<string, CityDatabookMetric>>();
  for (const [rankingKey, { item, values }] of input.rankings) {
    const ranks = prefectureRanks(values.values);
    const label = municipalityRankingDisplayTitle(item);
    const basis = input.basisOf(rankingKey);
    for (const row of values.values) {
      const prefecture = ranks.get(row.areaCode);
      if (!prefecture) continue;
      const metrics = metricsByCity.get(row.areaCode) ?? {};
      metrics[rankingKey] = {
        rankingKey,
        label,
        value: row.value,
        unit: values.unit,
        yearCode: values.yearCode,
        yearName: values.yearName,
        nationalRank: row.rank,
        nationalCount: values.count,
        prefectureRank: prefecture.rank,
        prefectureCount: prefecture.count,
        basis,
      };
      metricsByCity.set(row.areaCode, metrics);
    }
  }

  const population = input.rankings.get(input.populationMetricKey);
  const previousPopulation = population
    ? previousPopulationOf(input.populationHistory, population.values.yearCode)
    : new Map<string, CityDatabookPopulationChange>();

  const result = new Map<string, CityDatabookSnapshot>();
  for (const entity of input.entities) {
    const metrics = metricsByCity.get(entity.code);
    if (!metrics || !metrics[input.populationMetricKey]) continue;
    const placed = new Set<string>();
    const sections: CityDatabookSection[] = [];
    for (const theme of input.themes) {
      const metricKeys = theme.metricKeys.filter((key) => metrics[key] && !placed.has(key));
      metricKeys.forEach((key) => placed.add(key));
      if (metricKeys.length > 0) sections.push({ themeSlug: theme.slug, title: theme.title, metricKeys });
    }
    result.set(entity.code, {
      schemaVersion: 1,
      areaCode: entity.code,
      areaName: entity.name,
      prefectureCode: entity.prefectureCode,
      headlineKeys: input.headlineMetricKeys.filter((key) => metrics[key]),
      previousPopulation: previousPopulation.get(entity.code) ?? null,
      sections,
      metrics: Object.fromEntries(
        Object.entries(metrics).filter(([key]) => placed.has(key) || input.headlineMetricKeys.includes(key))
      ),
      ...(input.wardBreakdowns?.get(entity.code) ? { wardBreakdown: input.wardBreakdowns.get(entity.code)! } : {}),
    });
  }
  return result;
}
