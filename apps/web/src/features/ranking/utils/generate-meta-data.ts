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

  const title = rankingItem.seoTitle ?? rankingItem.title;
  const description = rankingItem.seoDescription ?? "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `/ranking/${rankingItem.rankingKey}`,
    },
  };
}
