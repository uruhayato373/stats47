import { ALL_THEMES } from "./all-themes";

import type { ThemeConfig } from "../types";

/**
 * 都道府県ページ `/areas/{prefCode}/{themeSlug}` に出さない Type B（インフラ・
 * ネットワーク系）テーマのキー。都道府県単位で集計できないため area ルートは
 * これらを受理せず、middleware は 410 Gone を返す。
 *
 * AREA_THEME_SLUGS を middleware / sitemap / 県別ページで共有する。
 * 実在する全テーマから Type B を除き、新テーマの県別リンクが 410 になる差異を防ぐ。
 */
const AREA_EXCLUDED_THEME_KEYS: ReadonlySet<string> = new Set([
  "ports",
  "railway",
  "roads",
]);

/** 県別表示の許可集合。未登録のキーも除外する。 */
export const AREA_THEME_SLUGS: ReadonlySet<string> = new Set(
  ALL_THEMES.map((theme) => theme.themeKey).filter((key) => !AREA_EXCLUDED_THEME_KEYS.has(key)),
);

/**
 * `/areas/{prefCode}/{themeSlug}` で有効（410 にならず 200 で描画される）な
 * Type A テーマか判定する。都道府県文脈を維持したテーマ切替リンクの生成に使う。
 */
export function isAreaTheme(themeKey: string): boolean {
  return AREA_THEME_SLUGS.has(themeKey);
}

/** 都道府県ページで扱う Type A テーマ一覧（ALL_THEMES を SSOT に導出）。 */
export const AREA_THEMES: ThemeConfig[] = ALL_THEMES.filter((t) =>
  isAreaTheme(t.themeKey),
);
