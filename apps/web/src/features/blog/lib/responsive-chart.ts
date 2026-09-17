const RESPONSIVE_RANKING_SUFFIX =
  /(?:-prefecture-rankings|-top5-bottom5|-top-bottom|-rate-ranking|-income-ranking|-ranking|-rankings)\.svg$/i;

/** 横長ランキング SVG だけを媒体別バリアントへ切り替える。その他の図は元画像を保つ。 */
export function resolveMobileChartSource(src: string): string | null {
  const markerIndex = src.search(/[?#]/u);
  const path = markerIndex === -1 ? src : src.slice(0, markerIndex);
  const suffix = markerIndex === -1 ? "" : src.slice(markerIndex);
  if (!RESPONSIVE_RANKING_SUFFIX.test(path) || /-(?:mobile|ig)\.svg$/i.test(path)) {
    return null;
  }
  return `${path.replace(/\.svg$/i, "-mobile.svg")}${suffix}`;
}
