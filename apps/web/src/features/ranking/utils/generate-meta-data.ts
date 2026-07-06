/**
 * ランキングページのメタデータ生成
 *
 * SEO対策のためのメタデータを生成。
 *
 * OG / Twitter Card:
 *   - 画像は事前生成した静的 OGP (R2 `app/ranking/<key>/ogp/ogp.png`) を参照。
 *     ランタイム next/og は Cloudflare Worker で 500 になるため使わない
 *     (正典: `.claude/rules/ogp-image-standards.md`)
 *
 * Freshness:
 *   - `article:modified_time` + `openGraph.modifiedTime` で OG/Article spec 上の更新日を表現
 *   - JSON-LD `dateModified` (generate-structured-data) と二重に出すことで Google freshness 評価強化
 */

import {
    type RankingItem,
} from "@stats47/ranking";

import type { AreaType } from "@/features/area";

import { ogpImageKeys, ogpImageUrl } from "@/lib/metadata/ogp-image";

import type { Metadata } from "next";

export function generateRankingPageMetaData({
  rankingItem,
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
  const ogImagePath = ogpImageUrl(ogpImageKeys.ranking(rankingItem.rankingKey));

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
