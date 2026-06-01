import { notFound } from "next/navigation";

import { fetchPrefectures } from "@stats47/area";

import { ALL_THEMES } from "@/features/theme-dashboard/config/all-themes";
import {
  ThemePageLayout,
  loadThemeData,
} from "@/features/theme-dashboard/server";

import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

/** インフラ・ネットワーク系テーマ (Type B) は都道府県ページに出さない */
const TYPE_B_THEMES = new Set(["ports", "railway", "roads", "local-finance-city"]);

/** Type A テーマ（都道府県単位で集計できるもの）*/
const TYPE_A_THEMES = ALL_THEMES.filter((t) => !TYPE_B_THEMES.has(t.themeKey));

interface PageProps {
  params: Promise<{ areaCode: string; themeSlug: string }>;
}

// 836ページ (47×18) をビルド時に全プリレンダリングすると CI が R2 大量アクセスで
// タイムアウトするため ISR (オンデマンド生成+キャッシュ) を採用。
// 初回アクセス時に SSR → Cloudflare エッジキャッシュに保存。
export const dynamic = "force-dynamic";
export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { areaCode, themeSlug } = await params;
  const theme = TYPE_A_THEMES.find((t) => t.themeKey === themeSlug);
  const prefectures = fetchPrefectures();
  const pref = prefectures.find((p) => p.prefCode === areaCode);
  if (!theme || !pref) return {};

  const title = `${pref.prefName}の${theme.title} | stats47`;
  const description = `${pref.prefName}における${theme.description}全国47都道府県との比較で${pref.prefName}の位置づけを確認できます。`;

  return {
    title,
    description,
    alternates: { canonical: `/areas/${areaCode}/${themeSlug}` },
    ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
  };
}

export default async function AreaThemePage({ params }: PageProps) {
  const { areaCode, themeSlug } = await params;
  const theme = TYPE_A_THEMES.find((t) => t.themeKey === themeSlug);
  const prefectures = fetchPrefectures();
  const pref = prefectures.find((p) => p.prefCode === areaCode);

  if (!theme || !pref) notFound();

  const data = await loadThemeData(theme);
  if (!data) notFound();

  return (
    <ThemePageLayout
      theme={theme}
      data={data}
      areaContext={{ areaCode, areaName: pref.prefName }}
    />
  );
}
