import { COLOR_SCHEME_ALIASES } from "../../constants/color-schemes";
import type { D3ColorScheme } from "../../types";

/**
 * カラースキーム名を正規化する関数
 * 略称（例: "RdPu"）を正式名（例: "interpolateRdPu"）に変換します
 *
 * @param scheme - カラースキーム名（略称または正式名）
 * @returns 正式なD3カラースキーム名
 *
 * @example
 * normalizeColorScheme("RdPu") // "interpolateRdPu"
 * normalizeColorScheme("interpolateRdPu") // "interpolateRdPu"
 * normalizeColorScheme("Blues") // "interpolateBlues"
 */
export function normalizeColorScheme(scheme: string): D3ColorScheme {
  // すでに正式名の場合はそのまま返す
  if (scheme.startsWith("interpolate")) {
    return scheme as D3ColorScheme;
  }

  // 略称からの変換を試みる
  const normalized = COLOR_SCHEME_ALIASES[scheme];
  if (normalized) {
    return normalized;
  }

  // どちらでもない場合は、デフォルトを返す
  console.warn(`不明なカラースキーム: ${scheme}。デフォルトの interpolateBlues を使用します。`);
  return "interpolateBlues";
}
