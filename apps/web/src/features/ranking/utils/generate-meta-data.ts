/**
 * ランキングページのメタデータ生成
 *
 * SEO対策のためのメタデータを生成
 */

import type { AreaType } from "@/features/area";
import {
    type RankingItem,
    type RankingValue,
    getRankingTitle,
} from "@stats47/ranking";
import type { Metadata } from "next";

import { buildRankingSummary } from "./build-ranking-summary";

/**
 * meta description を動的に構築する
 *
 * ランキングデータがある場合は具体値（1位・上位3位・平均値）を含め、
 * ない場合はフォールバックのテンプレートを使用する。
 *
 * 文字数目安: 120〜160文字（Google の表示上限）
 */
function buildMetaDescription({
  itemName,
  unit,
  rankingValues,
  selectedYear,
}: {
  itemName: string;
  unit: string;
  rankingValues: RankingValue[];
  selectedYear?: string;
}): string {
  const summary = buildRankingSummary(rankingValues, unit);

  if (!summary) {
    return selectedYear
      ? `${itemName}の${selectedYear}年度都道府県別ランキング。地図やグラフで47都道府県を比較できます。`
      : `${itemName}の都道府県別ランキング。地図やグラフで分かりやすく表示し、年度別の推移も確認できます。`;
  }

  const yearPrefix = selectedYear ? `${selectedYear}年度` : "";
  const parts = [
    `${itemName}の${yearPrefix}都道府県別ランキング`,
    `1位は${summary.top1Name}${summary.top1ValueText ? `（${summary.top1ValueText}）` : ""}`,
    summary.top3Names ? `上位は${summary.top3Names}` : "",
    summary.avgText,
    "地図やグラフで47都道府県を比較できます",
  ].filter(Boolean);

  return `${parts.join("。")}。`;
}

export function generateRankingPageMetaData({
  rankingItem,
  rankingValues = [],
  selectedYear,
  areaType,
}: {
  rankingItem: RankingItem;
  rankingValues?: RankingValue[];
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
  const itemName = getRankingTitle(rankingItem);
  const unit = rankingItem.unit || "";

  const title = `${itemName} ランキング`;

  const description = buildMetaDescription({
    itemName,
    unit,
    rankingValues,
    selectedYear,
  });

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
