/**
 * ランキング一覧（索引ハブ）
 *
 * 全 17 カテゴリ = 全ランキングの網羅ブラウズ入口。各カテゴリの概要付きで
 * `/category/{categoryKey}` へ送客する。ヘッダー第一ナビ「ランキング」の正規の着地点で、
 * サイトの中核コンテンツ（`/ranking/{key}` = 検索流入の主力）への導線を担う。
 *
 * 経緯: 2026-05-28 に旧索引（featured の薄い複製）を `/` へ 301 統合したが、
 * 2026-06-15 にカテゴリ網羅ブラウズのハブとして再設計・再設置した（home とは役割が異なる:
 * home = 注目ランキングの editorial 抜粋 / 本ページ = 全カテゴリの網羅索引）。
 * R2 非依存の純静的ページとして SSG する（home の FeaturedRankings build-empty 問題を避ける）。
 */
import { existsSync } from "node:fs";
import path from "node:path";

import { listCategories } from "@stats47/data-configs";
import {
  Building2,
  Construction,
  Droplets,
  Factory,
  Globe,
  GraduationCap,
  Home,
  Hospital,
  MapPin,
  PieChart,
  Plane,
  ShieldCheck,
  Sprout,
  Store,
  TrendingUp,
  Users,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import { PageShell, PageHeader, Breadcrumbs } from "@/components/layout";
import { SectionHeader } from "@/components/section";
import { SurfaceLinkCard } from "@/components/surface";

import { InContentAdSlot, FooterAdSlot } from "@/features/ads";

import { HUB_INCONTENT } from "@/lib/google-adsense";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

import { KNOWN_RANKING_KEYS } from "@/config/known-ranking-keys";

import type { Metadata } from "next";

/** categories.ts の lucide アイコン名 → コンポーネント（tree-shake 可能な明示マップ）。 */
const ICON_MAP: Record<string, LucideIcon> = {
  MapPin,
  Users,
  TrendingUp,
  Sprout,
  Factory,
  Store,
  PieChart,
  Home,
  Droplets,
  Plane,
  GraduationCap,
  Building2,
  ShieldCheck,
  Hospital,
  Globe,
  Construction,
  Wifi,
};

const RANKING_COUNT = KNOWN_RANKING_KEYS.size;

export function generateMetadata(): Metadata {
  const title = "都道府県ランキング一覧｜全17カテゴリで47都道府県を比較";
  const description = `人口・経済・教育・医療・治安まで全17カテゴリ、${RANKING_COUNT.toLocaleString()}件超の統計ランキングで47都道府県を比較。気になるカテゴリからランキングを探せます。`;
  return {
    title,
    description,
    alternates: { canonical: "/ranking" },
    ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
  };
}

export default function RankingIndexPage() {
  const categories = listCategories();

  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: "ホーム", href: "/" },
          { label: "ランキング" },
        ]}
      />
      <PageHeader
        eyebrow="ランキング"
        title="都道府県ランキング一覧"
        description="気になるカテゴリを選んで、47 都道府県のランキングを見られます。"
        stats={`全 ${RANKING_COUNT.toLocaleString()} ランキング ・ 17 カテゴリ ・ 47 都道府県`}
      />

      {/* カテゴリから探す（全ランキングの網羅ブラウズ） */}
      <section className="mb-12">
        <SectionHeader
          title="カテゴリから探す"
          description="17 の分野から、見たいランキングのカテゴリを選べます。"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => {
            const Icon = ICON_MAP[c.icon] ?? TrendingUp;
            // カテゴリ装飾画像 (Gemini 生成・public/images/categories/<key>.webp)。
            // 未生成の間はアイコンカードにフォールバックする (段階導入・欠落で崩れない)。
            const hasImage = existsSync(
              path.join(process.cwd(), "public/images/categories", `${c.categoryKey}.webp`),
            );
            return (
              <SurfaceLinkCard
                key={c.categoryKey}
                href={`/category/${c.categoryKey}`}
                className="group flex flex-col overflow-hidden"
              >
                {hasImage && (
                  <div className="-mx-4 -mt-4 mb-3 aspect-[3/2] overflow-hidden border-b border-border bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/images/categories/${c.categoryKey}.webp`}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="mb-2 flex items-center gap-2.5">
                  {!hasImage && (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                  )}
                  <h3 className="text-base font-semibold group-hover:text-primary">
                    {c.categoryName}
                  </h3>
                </div>
                {c.description && (
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {c.description}
                  </p>
                )}
              </SurfaceLinkCard>
            );
          })}
        </div>
      </section>

      {/* 記事内広告（ページ 1 枠まで。slotId 未発行の間は非表示） */}
      <InContentAdSlot slot={HUB_INCONTENT} />

      {/* 他の探し方 */}
      <section className="mb-12">
        <SectionHeader title="他の探し方" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SurfaceLinkCard href="/themes">
            <h3 className="text-sm font-semibold">テーマダッシュボード</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              少子高齢化・労働・医療など主題で横断比較
            </p>
          </SurfaceLinkCard>
          <SurfaceLinkCard href="/survey">
            <h3 className="text-sm font-semibold">調査から探す</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              出典の統計調査ごとにランキングを一覧
            </p>
          </SurfaceLinkCard>
          <SurfaceLinkCard href="/areas">
            <h3 className="text-sm font-semibold">都道府県から探す</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              47 都道府県それぞれの特徴と順位
            </p>
          </SurfaceLinkCard>
        </div>
      </section>

      {/* コンテンツ末尾の全幅フッター広告 */}
      <FooterAdSlot />
    </PageShell>
  );
}
