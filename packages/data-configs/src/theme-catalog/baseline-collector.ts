/**
 * ThemeCatalog ベースライン計測 (CROSS-PAGE-DATA-SSOT-01 WP0)
 *
 * ★目的: 「生の estatParams を持つ chart 数」「生の色値の箇所数」「型付き参照
 *   (relatedRankingKeys) を持つ chart 数」等を、**catalog の実行時オブジェクトから
 *   決定的に再計測**する pure core。backlog の実測ベースラインが古びていないかを
 *   fixture テストで固定し、WP1 以降の移行で件数が単調減少することを機械監査する土台にする。
 *
 * この module は「今どれだけ生パラメータ/生色が残っているか」を測るだけで、
 * 「あるべき依存集合」の列挙 (WP4 の exhaustive collector) とは責務が別。
 * deep-walk なので componentType の型に依存せず、移行途中の混在状態でも安定して測れる。
 *
 * 規約: `.claude/rules/theme-catalog-standards.md` / backlog `CROSS-PAGE-DATA-SSOT-01`
 */
import { COLOR_ARRAY_KEYS, COLOR_SCALAR_KEYS, COLOR_VALUE_RE } from "./chart-color-role";
import type { CatalogChart, CatalogComponentType, ThemeCatalog } from "./types";
import { CATALOG_COMPONENT_TYPES } from "./types";

// ★色キー / 生色判定の正典は chart-color-role.ts (baseline collector / resolver / validator が共有)。
//   単純な deep-walk だと e-Stat コード (`cdCat01: "#A01601"` など) が hex 構文に一致して
//   誤検出されるため、色の計測は色キー文脈でのみ行う (真の色は色キー配下のみ)。

/** 生の e-Stat パラメータを示すオブジェクトキー (deep-walk で検出)。 */
const ESTAT_PARAM_KEYS = new Set(["statsDataId", "estatParams"]);

// ★注意 (2026-08-13 実測で確定): 社会・人口統計体系テーブル (statsDataId 000001020x) の
//   cat01 コードは `#A0160102` / `#D0210101` / `#F01201` のように **`#` 前置が e-Stat の実コード**。
//   本番キャッシュで STATUS 0・単一カテゴリに正しくフィルタされ distinct な値が返ることを
//   3 テーブルで確認済み (foreign-residents 中国 1393.4 / 韓国 565.3 / 総数 3441.0 等)。
//   → これらは欠陥ではない。R2 移行時に `#` を strip してはならない (charts が壊れる)。
//   deep-walk の色検出はこの `#`-code を hex と誤検出しないよう、色キー文脈でのみ数える。

export interface CatalogBaseline {
  /** テーマ数 */
  themes: number;
  /** chart 総数 */
  charts: number;
  /** componentType ごとの chart 数 (全 union キーを 0 埋めで持つ) */
  chartsByType: Record<CatalogComponentType, number>;
  /** componentProps に生 estatParams / statsDataId を持つ chart 数 */
  chartsWithRawEstatParams: number;
  /** componentProps 内の statsDataId 出現総数 (= 生 e-Stat request 数の下限) */
  rawEstatRequests: number;
  /** relatedRankingKeys を 1 つ以上持つ chart 数 (型付き参照が済んでいる chart) */
  chartsWithRelatedRankingKeys: number;
  /** componentProps 内の生色値の箇所数 (色キー文脈のみ) */
  rawColorPlaces: number;
  /** 生色値の distinct 集合 (ソート済み) */
  distinctColors: string[];
}

interface WalkAcc {
  colors: string[];
  estatRequests: number;
  hasEstatParam: boolean;
}

/** 色キー文脈で捕まえた色文字列だけを push する。 */
function pushColorsFrom(key: string, value: unknown, acc: WalkAcc): void {
  if (COLOR_SCALAR_KEYS.has(key) && typeof value === "string" && COLOR_VALUE_RE.test(value)) {
    acc.colors.push(value);
  } else if (COLOR_ARRAY_KEYS.has(key) && Array.isArray(value)) {
    for (const v of value) {
      if (typeof v === "string" && COLOR_VALUE_RE.test(v)) acc.colors.push(v);
    }
  }
}

/** 任意の値を deep-walk し、色 (キー文脈) と statsDataId 出現を数える。 */
function walk(value: unknown, acc: WalkAcc): void {
  if (typeof value === "string") return;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, acc);
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (ESTAT_PARAM_KEYS.has(k)) {
        acc.hasEstatParam = true;
        // statsDataId 1 つ = 1 request。estatParams は配列で下の walk が個々の statsDataId を数える。
        if (k === "statsDataId" && typeof v === "string") acc.estatRequests += 1;
      }
      pushColorsFrom(k, v, acc);
      walk(v, acc);
    }
  }
}

/** 1 chart の生パラメータ/生色を計測する。 */
export function measureChart(chart: CatalogChart): {
  hasRawEstatParams: boolean;
  estatRequests: number;
  hasRelatedRankingKeys: boolean;
  colors: string[];
} {
  const acc: WalkAcc = { colors: [], estatRequests: 0, hasEstatParam: false };
  walk(chart.componentProps, acc);
  return {
    hasRawEstatParams: acc.hasEstatParam,
    estatRequests: acc.estatRequests,
    hasRelatedRankingKeys:
      Array.isArray(chart.relatedRankingKeys) && chart.relatedRankingKeys.length > 0,
    colors: acc.colors,
  };
}

/** 全カタログのベースラインを決定的に集計する (pure)。 */
export function collectCatalogBaseline(catalogs: ThemeCatalog[]): CatalogBaseline {
  const chartsByType = Object.fromEntries(
    CATALOG_COMPONENT_TYPES.map((t) => [t, 0]),
  ) as Record<CatalogComponentType, number>;

  let charts = 0;
  let chartsWithRawEstatParams = 0;
  let rawEstatRequests = 0;
  let chartsWithRelatedRankingKeys = 0;
  const allColors: string[] = [];

  for (const catalog of catalogs) {
    for (const chart of catalog.charts) {
      charts += 1;
      chartsByType[chart.componentType] += 1;
      const m = measureChart(chart);
      if (m.hasRawEstatParams) chartsWithRawEstatParams += 1;
      rawEstatRequests += m.estatRequests;
      if (m.hasRelatedRankingKeys) chartsWithRelatedRankingKeys += 1;
      allColors.push(...m.colors);
    }
  }

  return {
    themes: catalogs.length,
    charts,
    chartsByType,
    chartsWithRawEstatParams,
    rawEstatRequests,
    chartsWithRelatedRankingKeys,
    rawColorPlaces: allColors.length,
    distinctColors: [...new Set(allColors)].sort(),
  };
}
