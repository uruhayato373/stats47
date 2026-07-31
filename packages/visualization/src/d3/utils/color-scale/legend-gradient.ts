import { DEFAULT_DIVERGING_SCHEME, d3KeyOfColorScheme } from "@stats47/types";
import * as d3chromatic from "d3-scale-chromatic";

/**
 * 凡例のグラデーションを **interpolator から導出**する (2026-07-31 新設)。
 *
 * ★これが無いと凡例と地図がズレる。実際 `DivergingChoroplethMap` と
 * `TimelineChoroplethMap` の 2 ファイルが同じ 5 色の CSS リテラル
 * (`linear-gradient(to right, #b2182b, ..., #2166ac)`) を複製していた。
 * 配色を prop 化しても、凡例がリテラルのままなら**地図だけ色が変わって凡例は RdBu のまま**になる。
 *
 * 色は d3 の interpolator を等間隔サンプリングして作るので、配色を変えれば凡例も必ず追従する。
 */
/**
 * 配色名から d3 の interpolator を引く (d3 モジュール全体を渡す必要が無い版)。
 *
 * `resolveColorInterpolator` は D3Module 一式を要求するので、React コンポーネントのように
 * d3-scale-chromatic だけを import する側では使えない。カタログの d3Key を使う点は同じ。
 */
export function resolveSchemeInterpolator(
  colorScheme: string,
  fallback: string = DEFAULT_DIVERGING_SCHEME,
): (t: number) => string {
  for (const name of [colorScheme, fallback]) {
    const d3Key = d3KeyOfColorScheme(name);
    const fn = d3Key ? (d3chromatic as unknown as Record<string, unknown>)[d3Key] : undefined;
    if (typeof fn === "function") {
      const probe = (fn as (t: number) => unknown)(0.5);
      if (typeof probe === "string") return fn as (t: number) => string;
    }
  }
  return d3chromatic.interpolateRdBu;
}

export function legendGradientStops(colorScheme: string, steps = 5): string[] {
  const fn = resolveSchemeInterpolator(colorScheme);
  const n = Math.max(2, steps);
  return Array.from({ length: n }, (_, i) => fn(i / (n - 1)));
}

/**
 * CSS の `linear-gradient(...)` 文字列を作る。
 *
 * 発散配色は d3 では t=0 が「一方の端」、t=1 が「もう一方の端」。地図側で
 * domain を `[min, mid, max]` に張っているとき、凡例の左右が地図と逆になることがあるため
 * `reverse` で向きを合わせられるようにしてある。
 */
export function legendGradientCss(colorScheme: string, options?: { reverse?: boolean; steps?: number }): string {
  const stops = legendGradientStops(colorScheme, options?.steps);
  if (stops.length === 0) return "";
  const ordered = options?.reverse ? [...stops].reverse() : stops;
  return `linear-gradient(to right, ${ordered.join(", ")})`;
}
