import { cache } from "react";

import { notFound } from "next/navigation";

import { fetchPrefectures } from "@stats47/area";
import { hrefFor } from "@stats47/data-configs/content/href";

import { AREA_THEMES } from "@/features/theme-dashboard/config/area-theme-slugs";
import {
  ThemePageLayout,
  areaThemeDescription,
  getAreaThemeHighlights,
  loadThemeData,
} from "@/features/theme-dashboard/server";

import { generateOGMetadata } from "@/lib/metadata/og-generator";
import { formatOgpTitle } from "@/lib/metadata/site-title";

import { DEFAULT_OGP_IMAGE_PATH } from "@/config/site";

import type { Metadata } from "next";

/**
 * Type A テーマ（都道府県単位で集計できるもの）。インフラ・ネットワーク系 (Type B:
 * ports/railway/roads) は都道府県ページに出さない。
 * SSOT は theme-dashboard/config/area-theme-slugs.ts（ThemeSwitcher と共有）。
 */
const TYPE_A_THEMES = AREA_THEMES;

interface PageProps {
  params: Promise<{ areaCode: string; themeSlug: string }>;
}

// 836ページ (47×18) をビルド時に全プリレンダリングすると CI が R2 大量アクセスで
// タイムアウトするため、generateStaticParams を持たず ISR (オンデマンド生成+キャッシュ) を採用。
// force-dynamic は付けない (毎リクエスト full render になりキャッシュが効かないため)。
// 初回アクセス時にレンダリング → R2 incremental cache / エッジに 24h 保存。
export const revalidate = 86400;

/** 説明文 (generateMetadata) と本文で同じテーマのデータを 1 回だけ読む (React の cache はリクエストごと) */
const loadAreaThemeData = cache(async (themeKey: string) => {
  const theme = TYPE_A_THEMES.find((t) => t.themeKey === themeKey);
  return theme ? loadThemeData(theme) : null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { areaCode, themeSlug } = await params;
  const theme = TYPE_A_THEMES.find((t) => t.themeKey === themeSlug);
  const prefectures = fetchPrefectures();
  const pref = prefectures.find((p) => p.prefCode === areaCode);
  if (!theme || !pref) return {};

  const title = `${pref.prefName}の${theme.title}`;
  // その県の主な値と順位を先頭に置く (構造化データと同じ文。2026-10-30)
  const data = await loadAreaThemeData(theme.themeKey);
  const description = areaThemeDescription(
    pref.prefName,
    theme.description,
    data ? getAreaThemeHighlights(data, areaCode) : [],
  );

  return {
    title,
    description,
    alternates: { canonical: hrefFor("area-theme", { areaCode, themeSlug }) },
    ...generateOGMetadata({ title: formatOgpTitle(title), description, imageUrl: DEFAULT_OGP_IMAGE_PATH }),
  };
}

export default async function AreaThemePage({ params }: PageProps) {
  const { areaCode, themeSlug } = await params;
  const theme = TYPE_A_THEMES.find((t) => t.themeKey === themeSlug);
  const prefectures = fetchPrefectures();
  const pref = prefectures.find((p) => p.prefCode === areaCode);

  if (!theme || !pref) notFound();

  const data = await loadAreaThemeData(theme.themeKey);
  if (!data) notFound();

  return (
    <ThemePageLayout
      theme={theme}
      data={data}
      areaContext={{ areaCode, areaName: pref.prefName }}
    />
  );
}
