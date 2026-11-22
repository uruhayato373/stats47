import { COLOR_SCHEME_CATALOG } from "@stats47/types";

import type { ColorScheme, ColorSchemeType } from "../types";

/**
 * 配色の語彙は `@stats47/types` の COLOR_SCHEME_CATALOG が SSOT (2026-07-31)。
 * このファイルは UI (セレクタ) 向けの形へ**導出**するだけで、値・ラベルを持たない。
 *
 * 以前はここが 3 本ある語彙実装の 1 つで、短縮名 alias (大小 2 通りを手書き) と
 * 正式名の対応が別々に管理されていた。カタログ側で双方向変換を持つので不要になった。
 */
const byType = (type: ColorSchemeType): ColorScheme[] =>
  COLOR_SCHEME_CATALOG.filter((e) => e.type === type).map((e) => ({
    value: e.canonical,
    label: e.label,
    type: e.type,
  }));

/** Sequential（順序）カラースキーム — 値の大小を連続的に表現する */
export const SEQUENTIAL_COLOR_SCHEMES: ColorScheme[] = byType("sequential");

/** Diverging（発散）カラースキーム — 中央値を基準に両方向へ変化する */
export const DIVERGING_COLOR_SCHEMES: ColorScheme[] = byType("diverging");

/** Categorical（カテゴリ）カラースキーム — ランキング可視化では未使用 (将来拡張用) */
export const CATEGORICAL_COLOR_SCHEMES: ColorScheme[] = byType("categorical");

/**
 * カラースキーム値からタイプを取得
 */
export function getColorSchemeType(schemeValue: string): ColorSchemeType {
  const scheme = ALL_COLOR_SCHEMES.find(s => s.value === schemeValue);
  return scheme?.type ?? 'sequential';
}

export const ALL_COLOR_SCHEMES: ColorScheme[] = [
  ...SEQUENTIAL_COLOR_SCHEMES,
  ...DIVERGING_COLOR_SCHEMES,
  ...CATEGORICAL_COLOR_SCHEMES,
];
