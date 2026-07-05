
import { PageShell, PageHeader, Breadcrumbs } from "@/components/layout";
import { RightRailWidgets } from "@/components/rail";
import { SurfaceLinkCard } from "@/components/surface";

import { InContentAdSlot, FooterAdSlot } from "@/features/ads";
import { ALL_THEMES } from "@/features/theme-dashboard/server";

import { HUB_INCONTENT } from "@/lib/google-adsense";
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
    <PageShell rightRail={<RightRailWidgets />}>
      <Breadcrumbs
        items={[
          { label: "ホーム", href: "/" },
          { label: "テーマ" },
        ]}
      />
      <PageHeader
        eyebrow="ディスカバリー"
        title="テーマダッシュボード"
        description={`テーマ別に複数の指標を横断して都道府県を比較できます。少子高齢化・労働・医療・観光・物価など、社会課題に直結するダッシュボードを ${ALL_THEMES.length} 種類。`}
        stats={`全 ${ALL_THEMES.length} テーマ ・ 指標 ${totalRankings} 件 ・ 47 都道府県`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_THEMES.map((theme) => (
          <SurfaceLinkCard
            key={theme.themeKey}
            href={`/themes/${theme.themeKey}`}
            className="block"
          >
            <h3 className="text-base font-semibold text-foreground">
              {theme.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {theme.description}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {theme.rankingKeys.length} 指標
            </p>
          </SurfaceLinkCard>
        ))}
      </div>

      {/* 記事内広告（一覧グリッド後。slotId 未発行の間は非表示） */}
      <InContentAdSlot slot={HUB_INCONTENT} />

      {/* コンテンツ末尾の全幅フッター広告 */}
      <FooterAdSlot />
    </PageShell>
  );
}
