import { ALL_THEMES } from "./all-themes";

import type { ThemeConfig } from "../types";

/**
 * 都道府県ページ `/areas/{prefCode}/{themeSlug}` に出さない Type B（インフラ・
 * ネットワーク系）テーマのキー。都道府県単位で集計できないため area ルートは
 * これらを受理せず、middleware は 410 Gone を返す。
 *
 * ⚠️ この除外集合は以下と表裏一体で一致させること（ALL_THEMES − ここ = Type A）:
 *   - `apps/web/src/middleware.ts` の `TYPE_A_THEME_SLUGS`（通過許可リスト）
 *   - `apps/web/src/app/sitemap.ts` の `TYPE_B_THEMES`
 * ドリフト検知は `__tests__/area-theme-slugs.test.ts` の期待キー一覧で担保する。
 */
const AREA_EXCLUDED_THEME_KEYS: ReadonlySet<string> = new Set([
  "ports",
  "railway",
  "roads",
]);

/**
 * `/areas/{prefCode}/{themeSlug}` で有効（410 にならず 200 で描画される）な
 * Type A テーマか判定する。都道府県文脈を維持したテーマ切替リンクの生成に使う。
 */
export function isAreaTheme(themeKey: string): boolean {
  return !AREA_EXCLUDED_THEME_KEYS.has(themeKey);
}

/** 都道府県ページで扱う Type A テーマ一覧（ALL_THEMES を SSOT に導出）。 */
export const AREA_THEMES: ThemeConfig[] = ALL_THEMES.filter((t) =>
  isAreaTheme(t.themeKey),
);
