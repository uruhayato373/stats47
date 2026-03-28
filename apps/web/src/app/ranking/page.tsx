/**
 * ランキングトップページ
 *
 * 注目のランキングをタイルマップ付きカードで表示するページ。
 * カテゴリ導線はサイドバーに委譲。
 */

import { Metadata } from "next";

import { FeaturedRankings } from "@/features/ranking/server";

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

export default async function RankingTopPage() {
  return (
    <div className="py-4 px-4">
      <div className="max-w-6xl mx-auto mb-4">
        <h1 className="text-lg font-bold">ランキング一覧</h1>
        <p className="text-sm text-muted-foreground mt-1">
          1,800以上の統計で47都道府県を比較
        </p>
      </div>
      <FeaturedRankings limit={20} showHeader={false} />
    </div>
  );
}
