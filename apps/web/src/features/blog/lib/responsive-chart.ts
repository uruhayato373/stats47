const RESPONSIVE_RANKING_SUFFIX =
  /(?:-prefecture-rankings|-top5-bottom5|-top-bottom|-rate-ranking|-income-ranking|-ranking|-rankings)\.svg$/i;

/** 積み上げ棒。svg-builder の stacked-bar が layout "mobile" で `-mobile.svg` を併せて出す (幅 640・高さは項目数次第)。 */
const RESPONSIVE_STACKED_SUFFIX = /(?:-stacked|-breakdown|-composition)\.svg$/i;

/** Maps drawn as the shared tile-map type (svg-builder alias names of a 47-prefecture map). */
const TYPE_MAP_SUFFIX = /(?:-map|-tile-grid|-tilemap)\.svg$/i;

/** 47-prefecture scatters drawn as the shared scatter type (from 2026-11-04). */
const TYPE_SCATTER_SUFFIX = /-scatter\.svg$/i;
/** 分析の区分を並べる棒の図 (npm run analysis:draft)。4:5 の 1 枚で、暗い表示の版だけを持つ */
const TYPE_BARS_SUFFIX = /-bars\.svg$/i;
/** 分析の折れ線の図。`-trend` は既存の横長の折れ線の名前なので使わない */
const TYPE_LINES_SUFFIX = /-lines\.svg$/i;

const SPECIALIZED_VARIANT = /-(?:mobile|ig|dark)\.svg$/i;

function splitPath(src: string): { path: string; suffix: string } {
  const markerIndex = src.search(/[?#]/u);
  return markerIndex === -1
    ? { path: src, suffix: "" }
    : { path: src.slice(0, markerIndex), suffix: src.slice(markerIndex) };
}

/** ランキングのカードか (画像の幅・高さの目安に使う)。 */
export function isResponsiveRankingChart(src: string): boolean {
  const { path } = splitPath(src);
  return RESPONSIVE_RANKING_SUFFIX.test(path) && !SPECIALIZED_VARIANT.test(path);
}

/**
 * ランキングと積み上げ棒の SVG だけを媒体別バリアント (`-mobile.svg`) へ切り替える。その他の図は元画像を保つ。
 * `-mobile.svg` が無い記事は呼び元 (ResponsiveArticleImage) が読み込み失敗で横長へ戻す。
 */
export function resolveMobileChartSource(src: string): string | null {
  const { path, suffix } = splitPath(src);
  if (SPECIALIZED_VARIANT.test(path)) return null;
  if (!RESPONSIVE_RANKING_SUFFIX.test(path) && !RESPONSIVE_STACKED_SUFFIX.test(path)) return null;
  return `${path.replace(/\.svg$/i, "-mobile.svg")}${suffix}`;
}

/**
 * ランキング・地図・散布図は共通の型の画像で、暗い表示用の `-dark.svg` を併せて出す (generate-article-charts.ts)。
 * サイトの暗い表示は class 方式で `<img>` の中の SVG からは見えないので、2 枚を置いて CSS で切り替える。
 * `-dark.svg` が無い図 (型にできなかった図・未再生成の記事) は呼び元が読み込み失敗で明るい版に戻す。
 */
export function resolveDarkChartSource(src: string): string | null {
  const { path, suffix } = splitPath(src);
  if (SPECIALIZED_VARIANT.test(path)) return null;
  if (!RESPONSIVE_RANKING_SUFFIX.test(path) && !TYPE_MAP_SUFFIX.test(path) && !TYPE_BARS_SUFFIX.test(path) && !TYPE_LINES_SUFFIX.test(path) && !TYPE_SCATTER_SUFFIX.test(path)) return null;
  return `${path.replace(/\.svg$/i, "-dark.svg")}${suffix}`;
}
