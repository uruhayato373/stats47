/**
 * ランキングデータの構造化データ（JSON-LD）ユーティリティ
 *
 * SEO対策のための構造化データを生成
 */


import { filterOutNationalArea, getRankingTitle, type RankingItem, type RankingValue } from "@stats47/ranking";

import { getRequiredBaseUrl } from "@/lib/env";
import { buildPersonAsAuthor } from "@/lib/structured-data/person";
import { buildPublisherOrganization } from "@/lib/structured-data/scripts";

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
 * 構造:
 * - category 指定なし: ホーム > ランキング > {ランキング名}
 * - category 指定あり: ホーム > ランキング > {カテゴリ名} > {ランキング名}
 *
 * category 階層を含めることで topical relationships を Google に伝え、
 * 同カテゴリ内ランキングへの内部リンク評価を強める。
 */
export function generateRankingBreadcrumbStructuredData({
  rankingItem,
  category,
}: {
  rankingItem: RankingItem;
  category?: { key: string; name: string } | null;
}): object {
  const baseUrl = getRequiredBaseUrl();
  const itemName = getRankingTitle(rankingItem);

  const items: object[] = [
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
  ];

  if (category) {
    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name: category.name,
      item: `${baseUrl}/category/${category.key}`,
    });
  }

  items.push({
    "@type": "ListItem",
    position: items.length + 1,
    name: itemName,
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
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

/**
 * ランキングページ用 FAQPage 構造化データを生成する。
 *
 * Google の PAA (People Also Ask) / FAQ リッチリザルトを狙い、疑問形クエリへの CTR を上げる。
 * データから 4 つの Q&A を動的に生成する:
 *   1. 1位の都道府県
 *   2. 最下位の都道府県
 *   3. 全国平均
 *   4. 格差（最高÷最低倍率）
 */
export function generateRankingFAQStructuredData({
  rankingItem,
  rankingValues,
  selectedYear,
}: {
  rankingItem: RankingItem;
  rankingValues: RankingValue[];
  selectedYear: string | undefined;
}): object | null {
  const prefValues = filterOutNationalArea(rankingValues).filter(
    (v) => v.value != null,
  );
  if (prefValues.length === 0) return null;

  const itemName = getRankingTitle(rankingItem);
  const unit = rankingItem.unit || "";
  const yearSuffix = selectedYear ? `（${selectedYear}年度）` : "";

  const sorted = [...prefValues].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  const avg =
    prefValues.reduce((s, v) => s + (v.value ?? 0), 0) / prefValues.length;
  const avgText = `${Math.round(avg * 10) / 10}${unit}`;

  const ratio =
    top.value && bottom.value && bottom.value !== 0
      ? (top.value / bottom.value).toFixed(1)
      : null;

  const faqs: { q: string; a: string }[] = [
    {
      q: `都道府県別${itemName}ランキングで1位はどこですか？`,
      a: `${yearSuffix ? selectedYear + "年度の" : ""}${itemName}ランキング1位は${top.areaName}です。${top.value != null ? `値は${top.value}${unit}` : ""}${yearSuffix}。`,
    },
    {
      q: `${itemName}が最も低い（少ない）都道府県はどこですか？`,
      a: `${bottom.areaName}が最下位です。${bottom.value != null ? `値は${bottom.value}${unit}` : ""}${yearSuffix}。1位の${top.areaName}と比べると${ratio ? `約${ratio}倍の差があります。` : "大きな差があります。"}`,
    },
    {
      q: `${itemName}の全国平均はいくつですか？`,
      a: `${yearSuffix ? selectedYear + "年度の" : ""}全国平均は約${avgText}です。最多は${top.areaName}（${top.value}${unit}）、最少は${bottom.areaName}（${bottom.value}${unit}）です。`,
    },
    {
      q: `${itemName}の都道府県格差はどのくらいですか？`,
      a: `最も多い${top.areaName}（${top.value}${unit}）と最も少ない${bottom.areaName}（${bottom.value}${unit}）の差は${ratio ? `約${ratio}倍` : "大きい"}です${yearSuffix}。`,
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  };
}

/**
 * temporalCoverage 文字列を生成する。
 *
 * - selectedYear が単独 → そのまま返す
 * - availableYears に複数年あり → ISO 8601 期間表記 "YYYY/YYYY" を返す (Schema.org 推奨)
 * - 何も無い → undefined
 */
function buildTemporalCoverage(
  selectedYear: string | undefined,
  availableYears: { yearCode: string; yearName: string }[] | null | undefined,
): string | undefined {
  if (availableYears && availableYears.length >= 2) {
    const years = availableYears
      .map((y) => y.yearCode?.slice(0, 4))
      .filter((y): y is string => /^\d{4}$/.test(y ?? ""))
      .sort();
    if (years.length >= 2) {
      const earliest = years[0];
      const latest = years[years.length - 1];
      if (earliest !== latest) return `${earliest}/${latest}`;
    }
  }
  if (selectedYear) {
    return selectedYear.slice(0, 4);
  }
  return undefined;
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

  const temporalCoverage = buildTemporalCoverage(
    selectedYear,
    rankingItem.availableYears,
  );

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
      rankingItem.categoryKey,
      selectedYear || "",
    ].filter(Boolean),
    // creator は統計を整理・公開した運営者 (Person)
    creator: buildPersonAsAuthor(baseUrl),
    // publisher は組織主体 (logo + sameAs 付き)
    publisher: buildPublisherOrganization(baseUrl),
    // 更新日時 (Google freshness シグナル)
    ...(rankingItem.updatedAt && {
      dateModified: rankingItem.updatedAt,
    }),
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
      // E-E-A-T: 一次データの出典を明示
      citation: {
        "@type": "CreativeWork",
        name: rankingItem.source.name,
        url: rankingItem.source.url,
      },
    }),
    ...(temporalCoverage && { temporalCoverage }),
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
    // Google Dataset Search はデータカタログへの所属を強いシグナルとして扱う。
    // 一次配信元 (e-Stat 政府統計総合窓口) を DataCatalog として明示する。
    includedInDataCatalog: {
      "@type": "DataCatalog",
      name: "e-Stat 政府統計の総合窓口",
      url: "https://www.e-stat.go.jp/",
    },
    // 無償アクセス可能 (Dataset Search 推奨プロパティ)
    isAccessibleForFree: true,
    // 正規 URL を identifier に据え、Dataset Search の重複排除を助ける
    identifier: url,
    // distribution: 機械可読な CSV / JSON を優先列挙する。Google Dataset Search は
    // DataDownload (CSV/JSON 等) を HTML ページより重視する。既存のオンザフライ生成 API
    // (/api/ranking/[key]/download) を contentUrl に指定。baseUrl + rankingKey から直接組む。
    distribution: [
      {
        "@type": "DataDownload",
        name: `${itemName} (CSV)`,
        encodingFormat: "text/csv",
        contentUrl: `${baseUrl}/api/ranking/${rankingItem.rankingKey}/download?format=csv`,
      },
      {
        "@type": "DataDownload",
        name: `${itemName} (JSON)`,
        encodingFormat: "application/json",
        contentUrl: `${baseUrl}/api/ranking/${rankingItem.rankingKey}/download?format=json`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/html",
        contentUrl: url,
      },
    ],
  };
}
