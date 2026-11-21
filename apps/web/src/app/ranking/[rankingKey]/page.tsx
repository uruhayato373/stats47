/**
 * ランキング詳細ページ（Server Component）
 *
 * URLパラメータ `rankingKey` に基づき、特定の統計ランキングデータを取得し、
 * 地図・グラフ・データテーブルなどの視覚化コンポーネントで詳細情報を表示する。
 *
 * ## 責務
 * 1. **データ取得**: R2 snapshot からランキング定義（`rankingItem`）と統計値（`rankingValues`）を取得する。
 * 2. **SEO**: 動的メタデータ（タイトル・description）と構造化データ（JSON-LD）を生成する。
 * 3. **オンデマンド ISR**: `generateStaticParams` が空配列を返し、ビルド時には 1 件も描かない。
 *    最初のリクエストでランタイムに R2 を読んで描画し、24 時間 ISR キャッシュする。
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
  RankingPageClientShell,
  getRankingPageMetadata,
  RankingPageHeadAssets,
  loadRankingPageModel,
} from "@/features/ranking/server";

/**
 * オンデマンド ISR（24時間）。
 *
 * generateStaticParams は **空配列** を返す (キー列を返さない)。
 * - キー列を返すと全 rankingKey がビルド時に prerender される。ビルド時は R2 を読めず
 *   (readRankingItemFromR2 が build 時は ok(null))、notFound が焼かれて永久固着する (2026-06-22 障害)。
 * - 関数そのものを外すと、revalidate を書いても実行時の ISR が効かず、毎リクエスト描画になる
 *   (2026-06-22〜11-21 の状態。1 描画約 1.7 秒 CPU が Workers 課金の約 38% を占めた。CF-CPU-ISR-01)。
 *   Next.js 公式: 実行時に ISR を効かせるには空配列か force-static が要る
 *   (https://nextjs.org/docs/app/api-reference/functions/generate-static-params 、2026-11-21 確認)。
 * 期限切れの再描画は open-next.config.ts の memory queue が行う。
 * 契約は apps/web/src/__tests__/render-mode-contract.test.ts が固定する。
 * 詳細: .claude/rules/nextjs-ssg-preservation.md
 */
export async function generateStaticParams(): Promise<Array<{ rankingKey: string }>> {
  return [];
}

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
        faqStructuredData={model.faqStructuredData}
      />
      <RankingPageClientShell
        rankingKey={rankingKey}
        model={model}
      />
    </>
  );
}
