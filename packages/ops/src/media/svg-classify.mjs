/**
 * ブログ SVG のカタログ分類 (共有ライブラリ・依存ゼロ)
 *
 * svg-builder の 6 カタログ (bar/scatter/map/line/stacked/findings) + table + unknown に、
 * ファイル名 + SVG 内容のヒューリスティックで機械分類する。
 *
 * 消費側:
 *  - .claude/scripts/blog/build-svg-gallery-tabbed.mjs (静的 HTML)
 *  - apps/admin/lib/server/collectors.ts             (統合メディアコンソール・Next.js)
 *
 * 正典: .claude/rules/blog-svg-chart-standards.md (§4 alias 表 / §5 標準 viewBox)
 */

/** カタログ定義 (svg-builder の関数に対応)。 */
export const CATALOGS = [
  { key: "bar-card", label: "カード型ランキング(横長)", desc: "generateBarChartSvg (columns・960×404・ブログ/X)" },
  { key: "bar-ig", label: "カード型ランキング(縦長IG)", desc: "generateBarChartSvg (portrait・1080×1350・Instagram)" },
  { key: "bar", label: "その他の棒", desc: "generateBarChartSvg (single) / 比較・grouped 棒" },
  { key: "scatter", label: "散布図", desc: "generateScatterSvg" },
  { key: "map", label: "タイルマップ", desc: "generateChoroplethSvg" },
  { key: "line", label: "折れ線", desc: "generateLineSvg" },
  { key: "stacked", label: "積み上げ棒", desc: "generateStackedBarSvg" },
  { key: "findings", label: "要点カード", desc: "generateFindingsCardSvg" },
  { key: "table", label: "テーブル", desc: "generateRankingTableSvg" },
  { key: "unknown", label: "未分類", desc: "無意味名・型判別不能" },
];

/**
 * 棒系を「カード型2列ランキング」と「その他の棒」に細分する。
 * columns レイアウト(generateBarChartSvg layout:"columns")は viewBox 幅 960 +
 * 順位バッジ <circle> を必ず持つ。960 幅でも circle 無しは grouped/comparison 棒。
 */
export function barKind(svg) {
  const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const w = m ? +m[1] : 0;
  const h = m ? +m[2] : 0;
  if (w >= 1040 && w <= 1120 && h >= 1300 && /<circle/.test(svg)) return "bar-ig";
  if (w >= 900 && w <= 1000 && /<circle/.test(svg)) return "bar-card";
  return "bar";
}

/**
 * ファイル名で判別できないタイルマップを**中身**で拾う fallback (gallery の分類用)。
 *
 * 寸法は世代で変わる (600×700 → 780×560 → 720×720。正典は §5 / `lintTileGridQuality`) ので、
 * 寸法の窓で絞らない。「47 タイル相当の rect が並び、地理パスを持たない」という
 * **タイルマップ固有の構造**で判定する。デザイン改訂のたびにここが腐るのを防ぐ。
 */
export function isTileMapLike(svg) {
  if (!/viewBox="0 0 \d/.test(svg)) return false;
  const rects = svg.match(/<rect/g)?.length ?? 0;
  return rects > 40 && !/<polyline/.test(svg) && !/<path/.test(svg);
}

/** ファイル名 + SVG 内容からカタログを判定する (§4 alias 表 + 内容ヒューリスティック)。 */
export function classify(file, svg) {
  const f = file.toLowerCase().replace(/\.svg$/, "");
  if (/-ig$/.test(f)) return "bar-ig";
  if (/^(inline-)?chart[-_]?\d+$/.test(f) || /inline-chart/.test(f)) return "unknown";
  if (/findings|要点|わかったこと/.test(f)) return "findings";
  if (/scatter|相関/.test(f)) return "scatter";
  if (/tile-?map|tile[-_]?grid|choropleth|地図|prefecture-map|-map$|-map-/.test(f) || isTileMapLike(svg))
    return "map";
  if (/timeseries|trend|推移|時系列|national-trend|line-chart|折れ線/.test(f)) return "line";
  if (/stacked|breakdown|composition|内訳|構成/.test(f)) return "stacked";
  if (/waterfall|radar|pyramid|sunburst|treemap|sankey|donut|pie|heatmap/.test(f)) return "unknown";
  if (/ranking|rankings|top5|top10|top-bottom|bottom5|rate-ranking|income-ranking|格差|gap|-bar$|-bar-|comparison|比較/.test(f))
    return barKind(svg);
  if (/<polyline/.test(svg) && /<circle/.test(svg)) return "line";
  if (svg.match(/<circle/g)?.length > 20 && /回帰|regression|dasharray="6 3"/.test(svg)) return "scatter";
  if (!/<polyline/.test(svg) && (svg.match(/<rect/g)?.length ?? 0) > 6) return barKind(svg);
  return "unknown";
}

export function inspectSvg(svg) {
  const viewBox = svg.match(/viewBox=["']([^"']+)["']/)?.[1] ?? null;
  const hasTheme = /@media\s*\(prefers-color-scheme:\s*dark\)/.test(svg);
  return { viewBox, hasTheme, hasViewBox: !!viewBox };
}
