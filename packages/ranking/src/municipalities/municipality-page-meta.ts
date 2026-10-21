import { formatReadableMagnitude } from '@stats47/data-configs/unit';

import {
  municipalityFullName,
  municipalityLeafName,
  municipalityRankingDisplayTitle,
  prefectureInsideLabel,
} from './municipality-names';

import type { CityDatabookSnapshot } from '../types/city-databook';
import type {
  MunicipalityRankingItemSnapshot,
  MunicipalityRankingValuesSnapshot,
} from '../types/municipality-snapshot';

/**
 * 市区町村ランキングと市区町村ページの title・説明文 (純粋関数)。
 *
 * 2026-10-21 の GSC 実測で、市区町村ページは「◯◯市 人口」で平均 10 位前後に表示されているのに
 * クリック率が 0.1% だった (サイト全体の同順位は 0.64%)。title が「精神科病院数 県内3位」のような
 * 指標を出していて、検索した人が知りたい人口の数字が無かった。市区町村ランキングの説明文も
 * 「自治体名検索と都道府県絞り込みに対応」という機能の説明だけだった。
 */
export interface PageMeta {
  title: string;
  description: string;
}

const TOP_COUNT = 3;

function formatMetricValue(value: number, unit: string): string {
  return formatReadableMagnitude(value, unit);
}

export function buildMunicipalityRankingMeta(
  item: Pick<MunicipalityRankingItemSnapshot, 'title' | 'subtitle'>,
  values: Pick<MunicipalityRankingValuesSnapshot, 'yearName' | 'unit' | 'count' | 'values'>
): PageMeta {
  const displayTitle = municipalityRankingDisplayTitle(item);
  const top = [...values.values].sort((a, b) => a.rank - b.rank).slice(0, TOP_COUNT);
  const leader = top[0];
  const title = leader
    ? `${displayTitle} 市区町村ランキング【${values.yearName}】｜1位 ${municipalityFullName(leader.areaName)}（${formatMetricValue(leader.value, values.unit)}）`
    : `${displayTitle} 市区町村ランキング【${values.yearName}】`;
  const leaders = top
    .map((row) => `${row.rank}位は${municipalityFullName(row.areaName)}（${formatMetricValue(row.value, values.unit)}）`)
    .join('、');
  const description = [
    `${values.yearName}の${displayTitle}を全国${values.count.toLocaleString('ja-JP')}市区町村で比較。`,
    leaders ? `${leaders}。` : '',
    '都道府県で絞り込み、自治体名で検索できます。',
  ].join('');
  return { title, description };
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * 市区町村ページの title・説明文。人口を先頭に置き、前回からの増減と見出しの KPI を 2 つ添える。
 * 人口の指標は見出しの先頭 (`CITY_DATABOOK_LAYOUT` の検査が保証する)。
 */
export function buildCityPageMeta(snapshot: CityDatabookSnapshot, prefectureName: string): PageMeta {
  const leaf = municipalityLeafName(snapshot.areaName);
  const fullName = municipalityFullName(snapshot.areaName);
  const metricCount = Object.keys(snapshot.metrics).length;
  const [populationKey, ...otherHeadlineKeys] = snapshot.headlineKeys;
  const population = populationKey ? snapshot.metrics[populationKey] : undefined;
  if (!population) {
    return {
      title: `${leaf}（${prefectureName}）の統計データ`,
      description: `${fullName}の統計データ。${metricCount}指標を全国の市区町村と県内の順位で比べられます。`,
    };
  }
  const inside = prefectureInsideLabel(prefectureName);
  const populationText = formatMetricValue(population.value, population.unit);
  const title = `${leaf}（${prefectureName}）の人口・統計データ｜${populationText}（${population.yearName}）・${inside}${population.prefectureRank}位`;

  const sentences = [`${fullName}の人口は${populationText}（${population.yearName}）。`];
  const previous = snapshot.previousPopulation;
  const change = previous ? percentChange(population.value, previous.value) : null;
  if (previous && change !== null) {
    const direction = change >= 0 ? '増えました' : '減りました';
    sentences.push(
      `${previous.yearName}の${formatMetricValue(previous.value, population.unit)}から${Math.abs(change).toFixed(1)}%${direction}。`
    );
  }
  const others = otherHeadlineKeys
    .map((key) => snapshot.metrics[key])
    .filter((metric): metric is NonNullable<typeof metric> => Boolean(metric))
    .slice(0, 2)
    .map((metric) => `${metric.label}${formatMetricValue(metric.value, metric.unit)}`);
  sentences.push(
    `${others.length > 0 ? `${others.join('、')}など、` : ''}人口・財政・産業の${metricCount}指標を全国${population.nationalCount.toLocaleString('ja-JP')}市区町村と${inside}の順位で比べられます。`
  );
  return { title, description: sentences.join('') };
}
