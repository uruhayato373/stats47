
import Link from "next/link";

import {
  HeroShell,
  KpiGrid,
  KpiTile,
  RightRailWidgets,
} from "@/features/redesign";
import { ALL_THEMES } from "@/features/theme-dashboard/server";

import { AdSenseAd, CONTENT_FOOTER } from "@/lib/google-adsense";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";


export function generateMetadata(): Metadata {
  const title = "テーマダッシュボード一覧";
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
      {/* Hero (D 暗色) — マスタープラン § 5.3 準拠 */}
      <HeroShell variant="dark" className="mb-6">
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[1fr,360px] md:p-8">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">
              ディスカバリー
            </p>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              テーマダッシュボード
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
              テーマ別に複数の指標を横断して都道府県を比較できます。少子高齢化・労働・医療・観光・物価など、社会課題に直結するダッシュボードを {ALL_THEMES.length} 種類。
            </p>
          </div>
          <div>
            <KpiGrid columns={2}>
              <KpiTile
                label="テーマ数"
                value={String(ALL_THEMES.length)}
                unit="件"
                variant="dark"
              />
              <KpiTile
                label="指標合計"
                value={String(totalRankings)}
                unit="件"
                variant="dark"
              />
              <KpiTile
                label="エリア"
                value="47"
                unit="都道府県"
                variant="dark"
              />
              <KpiTile
                label="可視化"
                value="地図 + グラフ"
                variant="dark"
              />
            </KpiGrid>
          </div>
        </div>
      </HeroShell>

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8 xl:items-start">
        <main className="min-w-0">
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
        </main>

        {/* 右サイドバー: xl+ で関連 widget + 広告。テーマ依存しない汎用配置 */}
        <aside className="mt-8 xl:mt-0 xl:block">
          <RightRailWidgets />
        </aside>
      </div>
    </div>
  );
}
