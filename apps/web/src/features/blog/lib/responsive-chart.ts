const RESPONSIVE_RANKING_SUFFIX =
  /(?:-prefecture-rankings|-top5-bottom5|-top-bottom|-rate-ranking|-income-ranking|-ranking|-rankings)\.svg$/i;

/** 積み上げ棒。svg-builder の stacked-bar が layout "mobile" で `-mobile.svg` を併せて出す (幅 640・高さは項目数次第)。 */
const RESPONSIVE_STACKED_SUFFIX = /(?:-stacked|-breakdown|-composition)\.svg$/i;

const SPECIALIZED_VARIANT = /-(?:mobile|ig)\.svg$/i;

function splitPath(src: string): { path: string; suffix: string } {
  const markerIndex = src.search(/[?#]/u);
  return markerIndex === -1
    ? { path: src, suffix: "" }
    : { path: src.slice(0, markerIndex), suffix: src.slice(markerIndex) };
}

/** 横長ランキングのカード (スマホ版は 2:3 の縦長) か。表示枠の縦横比を決めるのに使う。 */
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
