import { municipalityRankingDisplayTitle } from './municipality-names';

import type { CityDatabookTheme } from '@stats47/data-configs/geo-scope';

import type {
  CityDatabookMetric,
  CityDatabookMetricBasis,
  CityDatabookPopulationChange,
  CityDatabookSection,
  CityDatabookSnapshot,
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
    });
  }
  return result;
}
