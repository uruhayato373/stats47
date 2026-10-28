
import {
  municipalityLeafName,
  municipalityRankingDisplayTitle,
} from './municipality-names';
import type { PageMeta } from './municipality-page-meta';
import { formatMunicipalityValueText } from './municipality-value-text';

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
  /** 県内の行に東京の特別区があるか (表記を「市区町村」にするか「市町村」にするか) */
  hasSpecialWards: boolean;
  /** 県内の下側中央値 (全国版の「分布の要点」と同じ定義) */
  median: number;
  nationalMedian: number;
  nationalCount: number;
}

const NATIONAL_TOP_RANK = 100;
const TOKYO_PREFECTURE_CODE = '13000';

function lowerMedian(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)]!;
}

/**
 * 東京都の市町村には値があるのに、特別区が 1 つも無いか (MUNI-WARD-GAP-DISPLAY-01)。
 * 財政力指数・ごみの排出量などは、元の統計 (社会・人口統計体系) で区の値が「-」(データが得られないもの) になっている
 * (2026-10-28 に e-Stat で確認)。このときはページに理由を書く。東京都に 1 行も無い指標 (湖沼の面積など) は対象外。
 * 特別区のコードは `@stats47/area` の listSpecialWardCodes (公開方針の分類) を呼び元が渡す
 * (この package は client からも読まれるので、地域マスタをここで読まない)。
 */
export function lacksSpecialWards(
  values: readonly Pick<MunicipalityRankingValue, 'prefectureCode' | 'areaCode'>[],
  specialWardCodes: ReadonlySet<string>
): boolean {
  const tokyo = values.filter((row) => row.prefectureCode === TOKYO_PREFECTURE_CODE);
  return tokyo.length > 0 && !tokyo.some((row) => specialWardCodes.has(row.areaCode));
}

export interface MunicipalityAbsenceNoteOptions {
  /** 比較対象の自治体 (市町村と特別区。行政区と特別区部を除く) のコード。`@stats47/area` の公開方針から呼び元が渡す */
  comparableCodes: ReadonlySet<string>;
  specialWardCodes: ReadonlySet<string>;
  /** metric config の `absentValueReason`。値が無いことが「該当なし」を意味する指標だけが持つ */
  absentValueReason?: string;
  /** 県別ページなら県コード (5 桁)。全国版は省く */
  prefectureCode?: string;
}

/**
 * ランキングに居ない自治体の理由を 1 文で返す (無ければ null)。
 * 値が無いことが「該当なし」を意味する指標 (将来負担比率の「―」= 将来負担が無い) は、居ない自治体の数と理由を書く。
 * それ以外は、東京都の市町村に値があって特別区が無いときだけ「元の統計に区ごとの値が無い」と書く (MUNI-FUTURE-BURDEN-DASH-01)。
 */
export function municipalityAbsenceNote(
  values: readonly Pick<MunicipalityRankingValue, 'prefectureCode' | 'areaCode'>[],
  options: MunicipalityAbsenceNoteOptions
): string | null {
  const { comparableCodes, specialWardCodes, absentValueReason, prefectureCode } = options;
  if (absentValueReason) {
    const present = new Set(values.map((row) => row.areaCode));
    const inScope = [...comparableCodes].filter(
      (code) => !prefectureCode || `${code.slice(0, 2)}000` === prefectureCode
    );
    const absent = inScope.filter((code) => !present.has(code)).length;
    if (absent === 0) return null;
    const scope = prefectureCode ? '県内' : '全国';
    return `${scope}の${absent.toLocaleString('ja-JP')}自治体は、${absentValueReason}ため、このランキングに含まれていません。`;
  }
  if (prefectureCode && prefectureCode !== TOKYO_PREFECTURE_CODE) return null;
  return lacksSpecialWards(values, specialWardCodes)
    ? '東京23区（特別区）は、元の統計に区ごとの値が無いため、このランキングに含まれていません。'
    : null;
}

export function buildMunicipalityPrefectureRanking(
  values: readonly MunicipalityRankingValue[],
  prefectureCode: string,
  specialWardCodes: ReadonlySet<string>
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
    hasSpecialWards: rows.some((row) => specialWardCodes.has(row.areaCode)),
    median: lowerMedian(rows.map((row) => row.value)),
    nationalMedian: lowerMedian(values.map((row) => row.value)),
    nationalCount: values.length,
  };
}

/**
 * 県内に特別区の行があれば「市区町村」、無ければ検索語の多い「市町村」と書く。
 * 東京都でも特別区に値の無い指標 (財政力指数など) は「市町村」になる (2026-10-28 に「東京都なら市区町村」の決め方を改めた)。
 */
export function municipalityPrefectureAreaLabel(hasSpecialWards: boolean): string {
  return hasSpecialWards ? '市区町村' : '市町村';
}

function formatValue(value: number, unit: string): string {
  return formatMunicipalityValueText(value, unit);
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
  const areaLabel = municipalityPrefectureAreaLabel(ranking.hasSpecialWards);
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
  const areaLabel = municipalityPrefectureAreaLabel(ranking.hasSpecialWards);
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
