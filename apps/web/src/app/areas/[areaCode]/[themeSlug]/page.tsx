import { cache } from "react";

import { notFound } from "next/navigation";

import { fetchPrefectures } from "@stats47/area";
import { hrefFor } from "@stats47/data-configs/content/href";

import { AREA_THEMES } from "@/features/theme-dashboard/config/area-theme-slugs";
import {
  buildThemeTitle,
  themeLeadLabels,
  ThemePageLayout,
  areaThemeDescription,
  getAreaThemeHighlights,
  loadThemeData,
} from '@/features/theme-dashboard/server';

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

/**
 * オンデマンド ISR（24時間）。generateStaticParams は **空配列** を返す (キー列を返さない)。
 * 関数が無いと revalidate を書いても実行時の ISR が効かず毎リクエスト描画になり、キー列を返すと
 * ビルド時に R2 を読めず notFound が焼かれる (2026-06-22 障害)。理由の全文は ranking/[rankingKey]/page.tsx、
 * 契約は __tests__/render-mode-contract.test.ts (CF-CPU-ISR-01)。
 */
export async function generateStaticParams(): Promise<Array<{ areaCode: string; themeSlug: string }>> {
  return [];
}

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

  // 題は単位に関係なく theme-seo.ts で作る (2026-11-12 オーナー決定)。説明文はその県の主な値と順位を先頭に置く既存の文のまま
  const title = buildThemeTitle({ scope: "area", themeTitle: theme.title, labels: themeLeadLabels(theme.themeKey), areaName: pref.prefName });
  // その県の主な値と順位を先頭に置く (構造化データと同じ文。2026-10-30)
  const data = await loadAreaThemeData(theme.themeKey);
  const description = areaThemeDescription(
    pref.prefName,
    theme.description,
    data ? getAreaThemeHighlights(data, areaCode, theme.tabIndicators) : [],
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
  // テーマと県は実在するので、データが 1 件も読めないのは R2 の読み取り失敗。notFound にすると
  // ISR が「見つかりません」を保存するので投げる (CF-CPU-ISR-01)
  if (!data) throw new Error(`area theme data unavailable: ${areaCode}/${themeSlug}`);

  return (
    <ThemePageLayout
      theme={theme}
      data={data}
      areaContext={{ areaCode, areaName: pref.prefName }}
    />
  );
}
