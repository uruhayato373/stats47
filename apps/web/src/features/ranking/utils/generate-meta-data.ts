/**
 * ランキングページのメタデータ生成
 *
 * SEO対策のためのメタデータを生成
 */

import {
    type RankingItem,
} from "@stats47/ranking";

import type { AreaType } from "@/features/area";

import type { Metadata } from "next";

export function generateRankingPageMetaData({
  rankingItem,
  selectedYear,
  areaType,
}: {
  rankingItem: RankingItem;
  selectedYear?: string;
  areaType: AreaType;
}): Metadata {
  if (!rankingItem) {
    return {
      title: "ランキングが見つかりません",
      description: "指定されたランキングは存在しません",
    };
  }

  const latestYear = rankingItem.latestYear?.yearCode;
  const availableYears = rankingItem.availableYears || [];
  const displayYear = selectedYear ?? availableYears[0]?.yearCode ?? latestYear ?? "2024";

  const title = rankingItem.seoTitle ?? rankingItem.title;
  const description = rankingItem.seoDescription ?? "";

  // R2ストレージのOGP画像URLを構築
  // 形式: {R2_PUBLIC_URL}/ranking/{areaType}/{rankingKey}/{yearCode}/ogp/ogp.png
  const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";
  const imageUrl = `${R2_PUBLIC_URL}/ranking/${areaType}/${rankingItem.rankingKey}/${displayYear}/ogp/ogp.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `/ranking/${rankingItem.rankingKey}`,
    },
  };
}
