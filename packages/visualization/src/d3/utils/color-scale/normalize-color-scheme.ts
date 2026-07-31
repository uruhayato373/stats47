import {
  DEFAULT_SEQUENTIAL_SCHEME,
  normalizeColorScheme as normalizeFromCatalog,
} from "@stats47/types";

import type { D3ColorScheme } from "../../types";

/**
 * カラースキーム名を正規化する関数
 * 略称（例: "RdPu"）を正式名（例: "interpolateRdPu"）に変換します
 *
 * 語彙の判定は `@stats47/types` の COLOR_SCHEME_CATALOG に委譲する
 * (2026-07-31 に SSOT 化)。ここは**描画側**なので未知の値でも throw せず、
 * warn して既定色にフォールバックする。生成側で止めたい場合は
 * `assertKnownColorScheme` を使う。
 *
 * ★旧実装は `startsWith("interpolate")` で素通ししていたため、
 * `interpolateNope` のような存在しない名前もそのまま返り、
 * d3 解決で null になって黙って既定色に落ちていた。カタログ照合はこれを塞ぐ。
 *
 * @example
 * normalizeColorScheme("RdPu") // "interpolateRdPu"
 * normalizeColorScheme("interpolateRdPu") // "interpolateRdPu"
 * normalizeColorScheme("Blues") // "interpolateBlues"
 */
export function normalizeColorScheme(scheme: string): D3ColorScheme {
  const canonical = normalizeFromCatalog(scheme);
  if (canonical) return canonical;

  console.warn(`不明なカラースキーム: ${scheme}。デフォルトの interpolateBlues を使用します。`);
  return DEFAULT_SEQUENTIAL_SCHEME;
}
