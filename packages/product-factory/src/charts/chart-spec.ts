/**
 * チャート仕様ビルダー (ライブラリ非依存)。Dataset → 決定的なチャート設定オブジェクト。
 * 実際の PPTX/XLSX/SVG への描画は Phase 3 の generators が本仕様を消費する。
 * 3D・切断軸・過剰色数・円グラフ乱用は採用しない (棒 / 散布 / コロプレスの選定に限定)。
 */
import type { Dataset, PrefectureDatum } from "../data/dataset";
import { paletteById } from "../design/palettes";
import { BRAND } from "../design/tokens";

export interface RankedItem {
  readonly code5: string;
  readonly value: number;
  readonly rank: number;
}

/** null (欠損・秘匿・非該当) を除外して順位付けする。同値は入力順で安定。 */
export function rankItems(ds: Dataset, order: "desc" | "asc" = "desc"): RankedItem[] {
  const present = ds.values.filter((d): d is PrefectureDatum & { value: number } => d.value !== null);
  const sorted = [...present].sort((a, b) => (order === "desc" ? b.value - a.value : a.value - b.value));
  return sorted.map((d, i) => ({ code5: d.code5, value: d.value, rank: i + 1 }));
}

export interface RankingBarSpec {
  readonly title: string;
  readonly unit: string;
  readonly top: readonly RankedItem[];
  readonly bottom: readonly RankedItem[];
}

/** 上位 N + 下位 N の棒グラフ仕様 (ブログ標準の上位5+下位5 と同型)。 */
export function rankingBarSpec(ds: Dataset, opts: { topN?: number; bottomN?: number } = {}): RankingBarSpec {
  const topN = opts.topN ?? 5;
  const bottomN = opts.bottomN ?? 5;
  const ranked = rankItems(ds, "desc");
  return {
    title: `${ds.indicator} (${ds.year})`,
    unit: ds.unit,
    top: ranked.slice(0, topN),
    bottom: ranked.slice(Math.max(0, ranked.length - bottomN)),
  };
}

export interface ChoroplethBin {
  readonly code5: string;
  readonly value: number | null;
  /** 0..(classes-1)。value=null は null。 */
  readonly classIndex: number | null;
  readonly color: string;
}

export interface ChoroplethSpec {
  readonly paletteId: string;
  readonly breaks: readonly number[];
  readonly bins: readonly ChoroplethBin[];
}

/** コロプレスの分位分類 (欠損は no-data 色)。 */
export function classifyChoropleth(
  ds: Dataset,
  opts: { paletteId?: string; classes?: number } = {},
): ChoroplethSpec {
  const paletteId = opts.paletteId ?? "blues-sequential";
  const palette = paletteById(paletteId);
  const classes = Math.max(1, Math.min(opts.classes ?? 5, palette.colors.length));

  const vals = ds.values
    .map((d) => d.value)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);

  const breaks: number[] = [];
  if (vals.length > 0) {
    for (let i = 1; i < classes; i += 1) {
      const idx = Math.min(vals.length - 1, Math.floor((i / classes) * vals.length));
      breaks.push(vals[idx]);
    }
  }

  const colorFor = (classIndex: number): string => {
    if (classes <= 1) return palette.colors[palette.colors.length - 1];
    const paletteIdx = Math.round((classIndex / (classes - 1)) * (palette.colors.length - 1));
    return palette.colors[paletteIdx];
  };

  const bins: ChoroplethBin[] = ds.values.map((d) => {
    if (d.value === null) return { code5: d.code5, value: null, classIndex: null, color: BRAND.mapNoData };
    let idx = 0;
    while (idx < breaks.length && d.value >= breaks[idx]) idx += 1;
    return { code5: d.code5, value: d.value, classIndex: idx, color: colorFor(idx) };
  });

  return { paletteId, breaks, bins };
}
