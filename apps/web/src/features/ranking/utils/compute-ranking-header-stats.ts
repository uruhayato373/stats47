import { formatValueWithPrecision } from "@stats47/utils";

import type { RankingValue } from "@stats47/ranking";

/** ヘッダーに出す 1 件分 (上位 3 件 / 最下位) */
export interface RankingHeaderEntry {
  areaCode: string;
  areaName: string;
  rank: number;
  value: number;
}

export interface RankingHeaderStats {
  /** 上位 3 件 (rank 昇順)。欠損値の県は含まない */
  top3: RankingHeaderEntry[];
  /** 最下位 1 件。全県欠損なら null */
  last: RankingHeaderEntry | null;
  /** 都道府県の単純平均。母数 0 なら null */
  average: number | null;
  /** 平均の母数 */
  count: number;
}

/** 全国行。ランキングの母数に含めない */
const NATIONAL_AREA_CODE = "00000";

const TOP_COUNT = 3;

/**
 * ヘッダー表示に必要な統計だけを ranking values から求める。
 *
 * 旧 RankingHeroCard がコンポーネント内にインラインで持っていた集計を切り出したもの。
 * 格差倍率 (1位÷最下位) は UI から廃止したのでここでは算出しない
 * (JSON-LD / FAQ 側の格差は generate-structured-data.ts が独立に持つ)。
 */
export function computeRankingHeaderStats(
  values: RankingValue[],
): RankingHeaderStats {
  const entries: RankingHeaderEntry[] = [];
  for (const v of values) {
    if (v.areaCode === NATIONAL_AREA_CODE) continue;
    if (typeof v.value !== "number" || !Number.isFinite(v.value)) continue;
    entries.push({
      areaCode: v.areaCode,
      areaName: v.areaName,
      rank: v.rank,
      value: v.value,
    });
  }

  if (entries.length === 0) {
    return { top3: [], last: null, average: null, count: 0 };
  }

  const byRank = [...entries].sort((a, b) => a.rank - b.rank);
  const sum = entries.reduce((acc, e) => acc + e.value, 0);

  return {
    top3: byRank.slice(0, TOP_COUNT),
    last: byRank[byRank.length - 1],
    average: sum / entries.length,
    count: entries.length,
  };
}

/**
 * ヘッダーの数値表記。
 *
 * ## 桁数はデータセット単位で揃える (2026-07-31)
 *
 * 旧実装は `maximumFractionDigits: 1` の決め打ちで、**RankingDataTable の
 * `toLocaleString("ja-JP")` (上限なし) と食い違っていた** — 60.42 が表では「60.42」、
 * ヘッダーでは「60.4」と表示されていた (コメントは「揃えた」と書いてあったが揃っていない)。
 *
 * 桁数は 1 つの値では決まらずデータセット全体で決まる。呼び元が
 * `getMaxDecimalPlaces(values)` で 1 度解決し、表・ヘッダー・チャートへ同じ値を渡す。
 * これは `@stats47/utils` の確立した組で、Remotion / visualization / svg-builder も使う。
 *
 * @param precision 小数桁。省略時は 1 (旧挙動。**新規の呼び出しでは必ず渡す**)
 */
export function formatRankingValue(value: number, precision = 1): string {
  return formatValueWithPrecision(value, precision);
}

/**
 * 表示に使う小数桁を 47 県の観測値から決める。
 *
 * 実体は `@stats47/utils` (svg-builder のチャートと同じ実装)。桁揃えを共通化する
 * 作業なので、ここに別実装を置かない。
 */
export { resolveValuePrecision as resolveRankingPrecision } from "@stats47/utils";
