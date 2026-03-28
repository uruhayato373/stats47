/**
 * ランキングデータの構造化データ（JSON-LD）ユーティリティ
 *
 * SEO対策のための構造化データを生成
 */


import { getRankingTitle, type RankingItem, type RankingValue } from "@stats47/ranking";

import { getRequiredBaseUrl } from "@/lib/env";

import { buildRankingSummary } from "./build-ranking-summary";

/**
 * ランキングページのdescriptionを生成（JSON-LD 用）
 */
function buildDescription({
  itemName,
  sourceName,
  rankingValues,
  selectedYear,
  unit,
}: {
  itemName: string;
  sourceName: string;
  rankingValues: RankingValue[];
  selectedYear: string | undefined;
  unit: string;
}): string {
  const fallback = `日本の都道府県別${itemName}のランキングデータ。${sourceName}から取得した政府統計データを基に、47都道府県の${itemName}をランキング形式で表示しています。${selectedYear ? `${selectedYear}年度のデータを使用しています。` : ""}`;

  const summary = buildRankingSummary(rankingValues, unit);
  if (!summary) return fallback;

  if (selectedYear) {
    return `${itemName}の${selectedYear}年度の都道府県別ランキング。1位は${summary.top1Name}${summary.top1ValueText ? `（${summary.top1ValueText}）` : ""}。${summary.top3Names ? `上位3位は${summary.top3Names}です。` : ""}${sourceName}から取得した政府統計データを基に、全国データを除いた47都道府県の${itemName}をランキング形式で表示しています。`;
  }

  return `${itemName}の都道府県別ランキング。${summary.top1Name}が1位${summary.top1ValueText ? `（${summary.top1ValueText}）` : ""}。${sourceName}から取得した政府統計データを基に、47都道府県の${itemName}を比較できます。年度別の推移も確認できます。`;
}

/**
 * ランキングページのパンくずリスト構造化データ（BreadcrumbList）を生成
 *
 * Google 検索結果にパンくずナビゲーションを表示するための JSON-LD を返す。
 * 構造: ホーム > ランキング > {ランキング名}
 */
export function generateRankingBreadcrumbStructuredData({
  rankingItem,
}: {
  rankingItem: RankingItem;
}): object {
  const baseUrl = getRequiredBaseUrl();
  const itemName = getRankingTitle(rankingItem);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "ホーム",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "ランキング",
        item: `${baseUrl}/ranking`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: itemName,
      },
    ],
  };
}

/**
 * ランキングデータの構造化データを生成（Dataset）
 *
 * Google Dataset Searchでの表示を目的とする
 *
 * @param itemDetail - ランキングアイテム詳細
 * @param rankingData - ランキングデータ
 * @param year - 年度
 * @returns JSON-LD形式の構造化データ
 */
/**
 * ランキングトップページの ItemList 構造化データを生成
 *
 * Google 検索結果にランキング一覧を表示するための JSON-LD を返す。
 */
export function generateRankingTopPageStructuredData({
  featuredItems,
}: {
  featuredItems: { rankingKey: string; title: string }[];
}): object {
  const baseUrl = getRequiredBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "注目・おすすめのランキング一覧",
    url: `${baseUrl}/ranking`,
    itemListElement: featuredItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: `${baseUrl}/ranking/${item.rankingKey}`,
    })),
  };
}

export function generateRankingPageStructuredData({
  rankingItem,
  rankingValues,
  selectedYear,
}: {
  rankingItem: RankingItem;
  rankingValues: RankingValue[];
  selectedYear: string | undefined;
}): object {
  const baseUrl = getRequiredBaseUrl();
  const itemName = getRankingTitle(rankingItem);
  const unit = rankingItem.unit || "";
  const sourceName = rankingItem.source?.name || "e-Stat";

  const url = `${baseUrl}/ranking/${rankingItem.rankingKey}`;

  // descriptionを50文字以上に改善し、ランキングデータの具体的な情報を含める
  const description = buildDescription({
    itemName,
    sourceName,
    rankingValues,
    selectedYear,
    unit,
  });

  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: selectedYear ? `${itemName} ${selectedYear}年度` : itemName,
    description,
    url,
    keywords: [
      "統計",
      "都道府県",
      "ランキング",
      itemName,
      selectedYear || "",
    ].filter(Boolean),
    creator: {
      "@type": "Organization",
      name: "統計で見る都道府県",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "統計で見る都道府県",
      url: baseUrl,
    },
    license: {
      "@type": "CreativeWork",
      "@id": "https://www.stat.go.jp/info/riyou.html",
      url: "https://www.stat.go.jp/info/riyou.html",
      name: "政府統計の利用規約",
      description: "総務省統計局が定める政府統計の利用規約",
    },
    ...(rankingItem?.source && {
      isBasedOn: {
        "@type": "Dataset",
        name: rankingItem.source.name,
        url: rankingItem.source.url ,
        description: `${rankingItem.source.name || "e-Stat"}が提供する政府統計データセット。${rankingItem.source.name || "e-Stat"}は、日本の政府統計を統合的に提供するポータルサイトです。`,
      },
    }),
    ...(selectedYear && {
      temporalCoverage: `${selectedYear}`,
    }),
    spatialCoverage: {
      "@type": "Place",
      name: "日本",
      geo: {
        "@type": "GeoShape",
        name: "日本全国47都道府県",
      },
    },
    ...(unit && {
      variableMeasured: {
        "@type": "PropertyValue",
        name: itemName,
        unitText: unit,
      },
    }),
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "text/html",
        contentUrl: url,
      },
    ],
  };
}
