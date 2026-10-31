import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { hrefFor } from "@stats47/data-configs/content/href";

import { ALL_THEMES } from "@/features/theme-dashboard/config/all-themes";
import { isAreaTheme } from "@/features/theme-dashboard/config/area-theme-slugs";
import { themeHref } from "@/features/theme-dashboard/config/theme-href";
import {
  THEME_PREFECTURE_COOKIE_NAME,
  ThemePageLayout,
  loadThemeData,
  resolveInitialThemePrefecture,
  resolveThemePrefectureCode,
} from "@/features/theme-dashboard/server";

import { generateOGMetadata } from "@/lib/metadata/og-generator";
import { ogpImageUrl, ogpImageKeys } from "@/lib/metadata/ogp-image";

import type { Metadata } from "next";

/**
 * テーマダッシュボード動的ルート (2026-05-28 移行)
 *
 * 旧: 17 個の静的 `app/themes/<key>/page.tsx` ハードコード
 * 新: 1 個の動的 `[themeSlug]/page.tsx` で全テーマを生成
 *
 * 例外: `themes/local-finance/page.tsx`
 * は都道府県/市区町村切替 UI を持つため static のまま維持。
 * Next.js のルート優先順位 (static > dynamic) で正しく解決される。
 *
 * Plan: /root/.claude/plans/ok-validated-stroustrup.md Phase 3
 */

/**
 * force-dynamic（毎リクエスト Cloudflare Workers ランタイムで描画）。
 * SSG/ISR にすると build 時に R2 から指標データを読めず loadThemeData が null →
 * 「データの取得に失敗しました」が prerender に焼かれ、ISR 無効のため回復しない
 * （home ページと同型の SSG-R2-empty バグ。memory: feedback_home_pure_ssg_r2_empty）。
 * 実行時は Worker から R2 を読めるためデータが揃う。
 */
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ themeSlug: string }>;
  searchParams: Promise<{ pref?: string | string[] }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { themeSlug } = await params;
  const theme = ALL_THEMES.find((t) => t.themeKey === themeSlug);
  if (!theme) return {};

  // 題名に今の地域を入れる (2026-10-31 IA-REGION-THEME-01)。このページは全国の値を見せる (県を覚えていれば県のページへ移る)
  const title = `全国の${theme.title}`;
  return {
    title,
    description: theme.description,
    keywords: theme.keywords,
    alternates: { canonical: themeHref(theme.themeKey) },
    ...generateOGMetadata({
      title,
      description: theme.description,
      imageUrl: ogpImageUrl(ogpImageKeys.theme(theme.themeKey)),
    }),
  };
}

export default async function ThemeDynamicPage({ params, searchParams }: PageProps) {
  const [{ themeSlug }, query, cookieStore] = await Promise.all([
    params,
    searchParams,
    cookies(),
  ]);
  const theme = ALL_THEMES.find((t) => t.themeKey === themeSlug);
  if (!theme) {
    notFound();
  }

  // テーマのページは 1 つの地域 (全国・県・市区町村) の値を見せる (2026-10-31 オーナー決定。47 都道府県の比較はランキング)。
  // 地域は覚えている県 (Cookie) から決める。県ごとのページ (/areas/県/テーマ) を持つテーマは、覚えている県があればその県の
  // ページへ移る。覚えていなければ、このページは全国の値を見せる。県ごとのページを持たないテーマ (港湾・鉄道・道路) は
  // 従来どおり URL と Cookie の県をこのページで選んだ状態にする。
  const rememberedPrefecture = resolveThemePrefectureCode(cookieStore.get(THEME_PREFECTURE_COOKIE_NAME)?.value);
  if (isAreaTheme(theme.themeKey) && rememberedPrefecture) {
    redirect(hrefFor('area-theme', { areaCode: rememberedPrefecture.areaCode, themeSlug: theme.themeKey }));
  }
  const data = await loadThemeData(theme);
  if (!data) {
    throw new Error(`theme data unavailable: ${theme.themeKey}`);
  }
  const initialPrefecture = isAreaTheme(theme.themeKey)
    ? null
    : resolveInitialThemePrefecture({
        urlPreference: query.pref,
        cookiePreference: cookieStore.get(THEME_PREFECTURE_COOKIE_NAME)?.value,
      });
  // PageShell は ThemePageLayout が持つ (左レール = ThemeSideNav を
  // ThemePrefectureProvider の内側に置く必要があるため)。ここで重ねない。
  return (
    <ThemePageLayout
      theme={theme}
      data={data}
      initialPrefecture={initialPrefecture}
    />
  );
}
