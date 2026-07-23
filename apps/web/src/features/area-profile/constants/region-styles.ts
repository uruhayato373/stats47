/**
 * 地方区分の表示スタイル（categorical・色以外にも地方名/legend を併用する前提）。
 *
 * 地方は順序を持たないため連続色は使わない（旧実装の `interpolateSpectral` を廃止）。
 * light/dark 双方で区別できる低彩度のカテゴリ色を Tailwind の名前付きクラスで定義する。
 * 生の hex/rgba は使わない（デザインシステム: no-raw-hex）。
 *
 * データ SSOT は `@stats47/area` の `REGIONS`。ここは regionCode → 表示クラスの写像のみで、
 * 都道府県配列や地方構成を複製しない。
 */

export interface RegionStyle {
  /** タイル地図の県タイル（塗り + 文字 + hover、light/dark 対応） */
  tile: string;
  /** legend / 一覧見出しのスウォッチ（小さな塗り四角） */
  swatch: string;
}

/** 未知の regionCode 用フォールバック（中立グレー） */
export const FALLBACK_REGION_STYLE: RegionStyle = {
  tile: "bg-muted text-foreground hover:bg-muted/80 dark:hover:bg-muted/60",
  swatch: "bg-muted-foreground",
};

/**
 * regionCode → 表示スタイル。REGIONS の 7 区分に対応。
 * Tailwind JIT が拾えるよう完全なクラス文字列を静的に列挙する（動的組み立て禁止）。
 */
export const REGION_STYLES: Record<string, RegionStyle> = {
  hokkaido_tohoku: {
    tile: "bg-sky-100 text-sky-900 hover:bg-sky-200 dark:bg-sky-900/40 dark:text-sky-100 dark:hover:bg-sky-900/60",
    swatch: "bg-sky-500 dark:bg-sky-400",
  },
  kanto: {
    tile: "bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:hover:bg-emerald-900/60",
    swatch: "bg-emerald-500 dark:bg-emerald-400",
  },
  chubu: {
    tile: "bg-indigo-100 text-indigo-900 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-100 dark:hover:bg-indigo-900/60",
    swatch: "bg-indigo-500 dark:bg-indigo-400",
  },
  kinki: {
    tile: "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/60",
    swatch: "bg-amber-500 dark:bg-amber-400",
  },
  chugoku: {
    tile: "bg-rose-100 text-rose-900 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-100 dark:hover:bg-rose-900/60",
    swatch: "bg-rose-500 dark:bg-rose-400",
  },
  shikoku: {
    tile: "bg-cyan-100 text-cyan-900 hover:bg-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-100 dark:hover:bg-cyan-900/60",
    swatch: "bg-cyan-500 dark:bg-cyan-400",
  },
  kyushu: {
    tile: "bg-violet-100 text-violet-900 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-100 dark:hover:bg-violet-900/60",
    swatch: "bg-violet-500 dark:bg-violet-400",
  },
};

export function regionStyle(regionCode: string): RegionStyle {
  return REGION_STYLES[regionCode] ?? FALLBACK_REGION_STYLE;
}
