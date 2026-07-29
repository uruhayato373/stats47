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
 * RankingDataTable と同じ `toLocaleString("ja-JP")` 系に揃える。旧 formatStatValue の
 * 億/万丸めは 56px の巨大数値があってこそ意味があったもので、表とヘッダーで別の数字が
 * 見えるほうが害が大きい。
 */
export function formatRankingValue(value: number): string {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 1 });
}
