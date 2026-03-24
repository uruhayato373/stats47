/**
 * ランキングトップページ
 *
 * すべてのカテゴリのランキングをカテゴリごとのカードで表示するページです。
 * データ取得・変換ロジックは ranking-top-page-loader.ts に集約。
 */

import { Metadata } from "next";

import { RankingTopPageClient, generateRankingTopPageStructuredData } from "@/features/ranking";
import { loadRankingTopPageData, type RankingTopPageData } from "@/features/ranking/server";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const title = "ランキング一覧 - 統計で見る都道府県";
  const description = "47都道府県を様々な指標で比較分析できるランキング一覧ページ";
  return {
    title,
    description,
    alternates: {
      canonical: "/ranking",
    },
    ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
  };
}

/** CI ビルド時など DB 利用不可時のフォールバック */
const EMPTY_DATA: RankingTopPageData = {
  featuredItems: [],
  categories: [],
};

export default async function RankingTopPage() {
  let data: RankingTopPageData;
  try {
    data = await loadRankingTopPageData();
  } catch {
    // CI ビルド時など D1 が利用できない場合は空データで SSG し、ISR で再生成
    data = EMPTY_DATA;
  }

  const structuredData = generateRankingTopPageStructuredData({ featuredItems: data.featuredItems });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <RankingTopPageClient
        featuredItems={data.featuredItems}
        categories={data.categories}
      />
    </>
  );
}
