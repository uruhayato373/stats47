/**
 * ランキング詳細ページ（Server Component）
 *
 * URLパラメータ `rankingKey` に基づき、特定の統計ランキングデータを取得し、
 * 地図・グラフ・データテーブルなどの視覚化コンポーネントで詳細情報を表示する。
 *
 * ## 責務
 * 1. **データ取得**: R2 snapshot からランキング定義（`rankingItem`）と統計値（`rankingValues`）を取得する。
 * 2. **SEO**: 動的メタデータ（タイトル・description）と構造化データ（JSON-LD）を生成する。
 * 3. **オンデマンド ISR**: `generateStaticParams` を持たず `ƒ`（オンデマンド）で描画し、
 *    ランタイムに R2 を読んで 24時間 ISR キャッシュする（build 時 R2 不可で notFound 固着を回避）。
 *    年度切替はクライアント側で Server Action を呼び出し、ページ遷移なしで更新する。
 *
 * ## Composition Pattern
 * このページは Server Component と Client Component を組み合わせた
 * **Composition Pattern** を採用している。
 *
 * - `RankingMapChart` / `RankingItemsSidebar` は **Server Component**（内部で非同期データ取得を行う）。
 *   Client Component 内では Server Component を直接 import できないため、
 *   **本ページ（Server Component）でレンダリングし `ReactNode` props として注入する**。
 *
 * - `RankingHighlights` / `RankingBarChart` 等は **Client Component** であるため、
 *   `RankingKeyPageClient` 内で直接 import・レンダリングしている。
 *
 * @see {@link RankingKeyPageClient} レイアウトおよびインタラクティブUI
 * @see {@link RankingMapChart} 都道府県地図（Server Component → Suspense → Client Component）
 * @see {@link RankingItemsSidebar} 関連ランキング一覧サイドバー（Server Component）
 */

import { notFound } from "next/navigation";

import {
  RankingPageBreadcrumbs,
  RankingPageClientShell,
  getRankingPageMetadata,
  RankingPageHeadAssets,
  loadRankingPageModel,
} from "@/features/ranking/server";

/**
 * オンデマンド ISR（24時間）。
 *
 * generateStaticParams は付けない。付けると全 rankingKey が `●` SSG 化され、
 * ビルド時に R2 (`app/ranking/<key>/item.json`) を読めず（readRankingItemFromR2 が
 * build 時は ok(null) を返す）notFound として prerender される。この OpenNext 構成では
 * ISR 再生成が効かず「ランキングが見つかりません」が永久固着する（2026-06-22 障害）。
 * generateStaticParams なし = `ƒ`（オンデマンド）でランタイムに R2 を読んで描画し、
 * 初回描画結果を ISR キャッシュする（category / areas/[areaCode]/[themeSlug] と同方式）。
 * 詳細: .claude/rules/nextjs-ssg-preservation.md
 */
export const revalidate = 86400;

/** ページコンポーネントの Props 型 */
interface PageProps {
  /** URL パスパラメータ（例: `/ranking/population` → `{ rankingKey: "population" }`） */
  params: Promise<{ rankingKey: string }>;
}

/**
 * SEO 用メタデータを動的に生成する
 *
 * ランキング項目が見つからない場合はフォールバックのメタデータを返す。
 */
export async function generateMetadata({
  params,
}: PageProps) {
  const { rankingKey } = await params;
  return getRankingPageMetadata(rankingKey);
}

/**
 * ランキング詳細ページ（Server Component）
 *
 * データ取得 → 構造化データ生成 → Client Component へデータ配布を行う。
 */
export default async function RankingKeyPage({
  params,
}: PageProps) {
  const { rankingKey } = await params;
  const model = await loadRankingPageModel(rankingKey);

  if (!model) {
    notFound();
  }

  return (
    <>
      <RankingPageHeadAssets
        structuredData={model.structuredData}
        breadcrumbStructuredData={model.breadcrumbStructuredData}
        faqStructuredData={model.faqStructuredData}
        initialTileUrls={model.initialTileUrls}
      />
      <RankingPageBreadcrumbs
        rankingName={model.rankingName}
        category={model.breadcrumbCategory}
      />
      <RankingPageClientShell
        rankingKey={rankingKey}
        model={model}
      />
    </>
  );
}
