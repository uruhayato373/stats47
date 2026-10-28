import { formatReadableMagnitude } from '@stats47/data-configs/unit';

import {
  municipalityLeafName,
  municipalityRankingDisplayTitle,
} from './municipality-names';
import type { PageMeta } from './municipality-page-meta';

import type {
  MunicipalityRankingItemSnapshot,
  MunicipalityRankingValue,
  MunicipalityRankingValuesSnapshot,
} from '../types/municipality-snapshot';

/**
 * 「県名×市区町村ランキング」(MUNI-PREF-RANKING-ROUTE-01) の県内順位・要約文・title (純粋関数)。
 *
 * 本文は配信値からテンプレートで組み、LLM で書かない (1 指標 × 47 県を更新のたびに書き直さない・
 * 配信値と食い違わない)。順位の向き (大きいほど上か) は指標によって違いうるので、文は「1位・最下位」で書き、
 * 「多い・少ない」とは書かない。
 */
export interface MunicipalityPrefectureRankingRow extends MunicipalityRankingValue {
  /** 県内の順位。全国順位の同順位をそのまま引き継ぐ (1 + 全国順位が上の県内自治体の数)。 */
  prefectureRank: number;
}

export interface MunicipalityPrefectureRanking {
  prefectureCode: string;
  rows: MunicipalityPrefectureRankingRow[];
  /** 県内の下側中央値 (全国版の「分布の要点」と同じ定義) */
  median: number;
  nationalMedian: number;
  nationalCount: number;
}

const NATIONAL_TOP_RANK = 100;

function lowerMedian(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)]!;
}

export function buildMunicipalityPrefectureRanking(
  values: readonly MunicipalityRankingValue[],
  prefectureCode: string
): MunicipalityPrefectureRanking | null {
  const inPrefecture = values
    .filter((row) => row.prefectureCode === prefectureCode)
    .sort((a, b) => a.rank - b.rank || a.areaCode.localeCompare(b.areaCode));
  if (inPrefecture.length === 0) return null;
  const rows = inPrefecture.map((row) => ({
    ...row,
    prefectureRank: 1 + inPrefecture.filter((other) => other.rank < row.rank).length,
  }));
  return {
    prefectureCode,
    rows,
    median: lowerMedian(rows.map((row) => row.value)),
    nationalMedian: lowerMedian(values.map((row) => row.value)),
    nationalCount: values.length,
  };
}

/** Tokyo だけ特別区を含むので「市区町村」、他は検索語の多い「市町村」と書く。 */
export function municipalityPrefectureAreaLabel(prefectureName: string): string {
  return prefectureName === '東京都' ? '市区町村' : '市町村';
}

function formatValue(value: number, unit: string): string {
  return formatReadableMagnitude(value, unit);
}

/** 同順位の自治体をまとめて「A市など3市町村」と書く (1 件ならその名前だけ)。 */
function describeGroup(
  rows: readonly MunicipalityPrefectureRankingRow[],
  areaLabel: string
): string {
  const first = municipalityLeafName(rows[0]!.areaName);
  return rows.length === 1 ? first : `${first}など${rows.length}${areaLabel}`;
}

export function buildMunicipalityPrefectureRankingSummary(
  ranking: MunicipalityPrefectureRanking,
  options: { prefectureName: string; unit: string; metricLabel: string }
): string[] {
  const { rows } = ranking;
  const areaLabel = municipalityPrefectureAreaLabel(options.prefectureName);
  const topRows = rows.filter((row) => row.prefectureRank === 1);
  const bottomRank = rows[rows.length - 1]!.prefectureRank;
  const bottomRows = rows.filter((row) => row.prefectureRank === bottomRank);
  const sentences: string[] = [];

  const top = `1位は${describeGroup(topRows, areaLabel)}（${formatValue(topRows[0]!.value, options.unit)}）`;
  sentences.push(
    bottomRank > 1
      ? `${options.prefectureName}の${rows.length}${areaLabel}の${options.metricLabel}で、${top}、最下位は${describeGroup(bottomRows, areaLabel)}（${formatValue(bottomRows[0]!.value, options.unit)}）です。`
      : `${options.prefectureName}の${rows.length}${areaLabel}の${options.metricLabel}は、すべて同じ値（${formatValue(topRows[0]!.value, options.unit)}）です。`
  );

  const median = formatValue(ranking.median, options.unit);
  const nationalMedian = formatValue(ranking.nationalMedian, options.unit);
  const comparison =
    ranking.median === ranking.nationalMedian
      ? 'と同じです'
      : ranking.median > ranking.nationalMedian
        ? 'より高い値です'
        : 'より低い値です';
  sentences.push(
    `県内の中央値は${median}で、全国${ranking.nationalCount.toLocaleString('ja-JP')}市区町村の中央値（${nationalMedian}）${comparison}。`
  );

  const inNationalTop = rows.filter((row) => row.rank <= NATIONAL_TOP_RANK).length;
  sentences.push(
    inNationalTop > 0
      ? `全国${NATIONAL_TOP_RANK}位以内に入るのは${inNationalTop}${areaLabel}です。`
      : `全国${NATIONAL_TOP_RANK}位以内に入る${areaLabel}はありません。`
  );
  return sentences;
}

export function buildMunicipalityPrefectureRankingMeta(
  item: Pick<MunicipalityRankingItemSnapshot, 'title' | 'subtitle'>,
  values: Pick<MunicipalityRankingValuesSnapshot, 'yearName' | 'unit'>,
  ranking: MunicipalityPrefectureRanking,
  prefectureName: string
): PageMeta {
  const displayTitle = municipalityRankingDisplayTitle(item);
  const areaLabel = municipalityPrefectureAreaLabel(prefectureName);
  const heading = `${prefectureName}の${areaLabel}${displayTitle}ランキング【${values.yearName}】`;
  const leader = ranking.rows[0]!;
  const title = `${heading}｜1位 ${municipalityLeafName(leader.areaName)}（${formatValue(leader.value, values.unit)}）`;
  const leaders = ranking.rows
    .slice(0, 3)
    .map(
      (row) =>
        `${row.prefectureRank}位は${municipalityLeafName(row.areaName)}（${formatValue(row.value, values.unit)}）`
    )
    .join('、');
  const description = `${values.yearName}の${displayTitle}を${prefectureName}の${ranking.rows.length}${areaLabel}で比較。${leaders}。県内の中央値と全国の中央値、地図で県内の分布を見られます。`;
  return { title, description };
}
