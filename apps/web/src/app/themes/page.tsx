
import Link from "next/link";

import { ALL_THEMES } from "@/features/theme-dashboard/server";

import { AdSenseAd, CONTENT_FOOTER } from "@/lib/google-adsense";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";


export function generateMetadata(): Metadata {
  const title = "テーマダッシュボード一覧 - 統計で見る都道府県";
  const description =
    "少子高齢化・労働・医療・観光・物価・外国人など、テーマ別に都道府県の統計データをダッシュボードで比較分析";
  return {
    title,
    description,
    alternates: { canonical: "/themes" },
    ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
  };
}

export default function ThemesPage() {
  const totalRankings = ALL_THEMES.reduce(
    (acc, t) => acc + t.rankingKeys.length,
    0,
  );

  return (
    <div className="container mx-auto px-4 py-4 text-foreground">
      {/* Hero (軽量): テーマ一覧の入口 */}
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          テーマダッシュボード
          <span className="ml-3 align-middle text-xs font-medium text-muted-foreground">
            {ALL_THEMES.length}テーマ / {totalRankings}指標
          </span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          少子高齢化・労働・医療・観光・物価など、社会課題に直結するダッシュボードでテーマ別に都道府県を比較できます。
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_THEMES.map((theme) => (
          <Link
            key={theme.themeKey}
            href={`/themes/${theme.themeKey}`}
            className="block rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50 hover:shadow-md"
          >
            <h2 className="text-base font-semibold text-foreground">
              {theme.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {theme.description}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {theme.rankingKeys.length} 指標
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <AdSenseAd format={CONTENT_FOOTER.format} slotId={CONTENT_FOOTER.slotId} />
      </div>
    </div>
  );
}
