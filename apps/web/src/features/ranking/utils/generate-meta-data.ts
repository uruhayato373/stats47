/**
 * ランキングページのメタデータ生成
 *
 * SEO対策のためのメタデータを生成。
 *
 * OG / Twitter Card:
 *   - 画像は ranking 別に動的生成される `/ranking/[rankingKey]/opengraph-image` を参照
 *   - `metadataBase` (root-metadata) により相対 URL → 絶対 URL に展開される
 *
 * Freshness:
 *   - `article:modified_time` + `openGraph.modifiedTime` で OG/Article spec 上の更新日を表現
 *   - JSON-LD `dateModified` (generate-structured-data) と二重に出すことで Google freshness 評価強化
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
  const path = `/ranking/${rankingItem.rankingKey}`;
  const ogImagePath = `${path}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: path,
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(rankingItem.updatedAt && {
        modifiedTime: rankingItem.updatedAt,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImagePath],
    },
    alternates: {
      canonical: path,
    },
    ...(rankingItem.updatedAt && {
      other: {
        "article:modified_time": rankingItem.updatedAt,
      },
    }),
  };
}
