/**
 * D3カラースケール関数を動的解決
 *
 * D3オブジェクトから interpolate* プロパティを動的に参照する。
 * 手動マッピングを排除し、D3ColorScheme 型に定義された全スキームを自動的にサポートする。
 */

import { DEFAULT_SEQUENTIAL_SCHEME, d3KeyOfColorScheme } from "@stats47/types";

import type { D3Module } from "../../types";

/**
 * D3オブジェクトからカラースキーム補間関数を取得
 *
 * @param d3 - D3モジュール
 * @param colorScheme - カラースキーム名（例: "interpolateYlOrRd"）
 * @param fallback - フォールバックのスキーム名（デフォルト: "interpolateBlues"）
 * @returns 補間関数 (t: number) => string
 */
export function resolveColorInterpolator(
  d3: D3Module,
  colorScheme: string,
  fallback: string = DEFAULT_SEQUENTIAL_SCHEME,
): (t: number) => string {
  // canonical と d3 の実名がずれるもの (interpolateCubehelix → interpolateCubehelixDefault) は
  // カタログの d3Key が吸収する。消費者ごとの override マップを持たない (2026-07-31)。
  const d3Key = d3KeyOfColorScheme(colorScheme) ?? colorScheme;
  const fn = (d3 as Record<string, unknown>)[d3Key];
  if (typeof fn === "function") {
    // 関数が (t) => string ではなくファクトリの可能性を検証
    const test = (fn as (t: number) => unknown)(0.5);
    if (typeof test === "string") {
      return fn as (t: number) => string;
    }
  }
  return (d3 as Record<string, unknown>)[fallback] as (t: number) => string;
}
