import { PageShell, PageHeader, Breadcrumbs } from "@/components/layout";
import { RightRailWidgets } from "@/components/rail";
import { SurfaceLinkCard } from "@/components/surface";

import { listJapanCatalogThemes } from "@stats47/data-configs/geo-scope";

import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

/**
 * `/japan` ハブ (GEO-SCOPE-SEPARATION-01 WP4)。
 *
 * ★このページは「日本」を主語にする唯一の面。`/themes/*` (47都道府県比較) とは
 * 別のデータ契約 (`app/japan/<metric>/series.json`、公式全国値のみ) を持つ。
 * `/themes` のようなランキング件数・47県要約は出さない (複製しない、doc 43 §7 WP4 step 3)。
 */
export function generateMetadata(): Metadata {
  const title = "日本の統計 | 都道府県ではなく全国の推移";
  const description =
    "都道府県比較ではなく、日本全国の公式統計値がどう推移してきたかをテーマ別に確認できます。";
  return {
    title,
    description,
    alternates: { canonical: "/japan" },
    ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
  };
}

export default function JapanHubPage() {
  const themes = listJapanCatalogThemes();

  return (
    <PageShell rightRail={<RightRailWidgets />}>
      <Breadcrumbs items={[{ label: "ホーム", href: "/" }, { label: "日本" }]} />
      <PageHeader
        eyebrow="日本"
        title="日本の統計"
        description="都道府県同士を比べるのではなく、日本全国の公式統計値が時間とともにどう変化してきたかをテーマ別に見られます。"
        stats={`${themes.length} テーマ`}
      />

      {themes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          現在公開しているテーマはありません。
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <SurfaceLinkCard
              key={theme.themeSlug}
              href={`/japan/${theme.themeSlug}`}
              className="block"
            >
              <h3 className="text-base font-semibold text-foreground">
                {theme.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {theme.description}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {theme.metrics.length} 指標
              </p>
            </SurfaceLinkCard>
          ))}
        </div>
      )}
    </PageShell>
  );
}
