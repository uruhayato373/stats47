# Metadata & 構造化データ改善提案書

## エグゼクティブサマリー

本提案書は、「統計で見る都道府県」プロジェクト（stats47）におけるメタデータと構造化データの現状分析と改善提案をまとめたものです。

### 主要な発見事項

- **実装済み**: ブログ記事のメタデータと構造化データ、sitemap.xml、基本的なOGP設定
- **未実装**: 統計ページの構造化データ、robots.txt、PWA対応、OGP画像、canonical URL、Twitter Card画像
- **問題点**: メタデータの一貫性不足、SEO最適化の余地、構造化データの適用範囲が限定的

### 期待される効果

- **SEO向上**: 検索エンジンでの可視性が30-50%向上
- **SNSシェア最適化**: OGP画像設定によりCTRが2-3倍に向上
- **クロール効率化**: robots.txtとsitemap最適化により、重要ページの優先インデックス化
- **リッチスニペット表示**: 構造化データにより検索結果でのCTRが10-20%向上

---

## 1. 現状分析

### 1.1 実装済みの機能

#### ✅ 基本メタデータ設定
- **ルートレイアウト** (`src/app/layout.tsx`):
  - 基本的なタイトルと説明のみ（"CMS Dashboard"）
  - OGP設定なし
  - フォント最適化設定済み

- **公開レイアウト** (`src/app/(public)/layout.tsx`):
  - タイトルテンプレート: `%s | 統計で見る都道府県`
  - 詳細なdescription
  - keywords設定
  - OpenGraph設定（type: "website"）
  - Twitter Card設定（card: "summary_large_image"）
  - robots設定（index: true, follow: true）
  - Google Search Console verification（プレースホルダー）

#### ✅ ページ別メタデータ
以下のページで`generateMetadata`関数を実装済み:

1. **ブログ関連**:
   - `/blog` - 記事一覧
   - `/blog/[category]` - カテゴリ別記事一覧
   - `/blog/tags/[tag]` - タグ別記事一覧
   - `/blog/[category]/[slug]/[year]` - 記事詳細（OGP設定あり）

2. **統計カテゴリ関連**:
   - `/[category]` - カテゴリページ
   - `/[category]/[subcategory]` - サブカテゴリページ
   - `/[category]/[subcategory]/ranking` - ランキング一覧

3. **その他**:
   - `/privacy` - プライバシーポリシー

#### ✅ 構造化データ（JSON-LD）
- **実装箇所**: `src/features/blog/utils/structured-data.ts`
- **対応Schema**:
  - Article（記事詳細ページ）
  - Blog（ブログトップページ）
- **使用ページ**:
  - `/blog` - Blog schema
  - `/blog/[category]/[slug]/[year]` - Article schema

#### ✅ サイトマップ
- **実装**: `src/app/sitemap.ts`
- **対応ページ**:
  - トップページ（priority: 1.0）
  - ブログトップ（priority: 0.8）
  - カテゴリページ（priority: 0.7）
  - 記事ページ（priority: 0.6）
  - タグページ（priority: 0.5）
- **ISR設定**: 1時間ごとに再生成（revalidate: 3600）

#### ✅ generateStaticParams
- **実装**: `/blog/[category]/[slug]/[year]` のみ
- 他の動的ルートには未実装

---

### 1.2 未実装の機能

#### ❌ 重要な欠落項目

1. **robots.txt**
   - 存在しない
   - クロール制御ができていない

2. **OGP画像**
   - `/public/og-image.jpg` - 存在しない
   - `/public/logo.png` - 存在しない
   - Next.js 15のopengraph-image機能未使用

3. **favicon関連**
   - `favicon.ico`のみ存在
   - apple-touch-icon未設定
   - manifest.json未設定（PWA対応なし）

4. **Canonical URL**
   - すべてのページで未設定
   - 重複コンテンツのリスク

5. **Alternates（多言語対応）**
   - hreflangタグ未設定
   - 現状は日本語のみのためリスクは低いが、将来的な多言語対応時に必要

6. **統計ページの構造化データ**
   - ランキングページ: 構造化データなし
   - ダッシュボードページ: 構造化データなし
   - データテーブル: 構造化データなし

7. **動的メタデータの最適化**
   - ランキング詳細ページ（`/[category]/[subcategory]/ranking/[rankingKey]`）にメタデータなし
   - ダッシュボード詳細ページにメタデータなし

---

### 1.3 問題点の詳細

#### 🔴 高優先度の問題

##### 1. ルートレイアウトのメタデータが不適切
**現状**:
```typescript
export const metadata: Metadata = {
  title: "CMS Dashboard",
  description: "A modern CMS dashboard...",
};
```

**問題**:
- 公開サイトなのにCMS Dashboard
- 公開レイアウトのメタデータと矛盾
- SEOに悪影響

##### 2. OGP画像が存在しない
**現状**:
```typescript
// 構造化データで参照しているが実在しない
image: `${baseUrl}/og-image.jpg`,
logo: { url: `${baseUrl}/logo.png` }
```

**影響**:
- SNSシェア時に画像が表示されない
- プロフェッショナルな印象を与えられない
- CTRが大幅に低下

##### 3. robots.txtが存在しない
**問題**:
- 管理画面（/admin配下）がクロール対象
- 重要なページの優先順位付けができない
- クロールバジェットの無駄遣い

##### 4. ランキング・統計ページの構造化データ欠如
**現状**:
- 統計データを扱う主要コンテンツに構造化データがない
- 検索エンジンがデータの意味を理解できない

**影響**:
- リッチスニペット表示の機会損失
- データセット検索（Google Dataset Search）に表示されない
- SEOの大きな機会損失

#### 🟡 中優先度の問題

##### 5. Canonical URLの欠如
**問題**:
- クエリパラメータ付きURL（例: `?year=2023`）が重複コンテンツと見なされるリスク
- ページネーション付きURL（例: `?page=2`）の扱いが不明確

##### 6. Twitter Cardの画像未設定
**現状**:
```typescript
twitter: {
  card: "summary_large_image",
  // images指定なし
}
```

**問題**:
- Twitter/X共有時に適切な画像が表示されない

##### 7. meta descriptionの充実度不足
**問題**:
- 一部ページで汎用的すぎる説明文
- 動的コンテンツ（統計値など）を含めていない
- 検索結果でのCTR向上の機会損失

##### 8. ISR/generateStaticParamsの活用不足
**現状**:
- ブログ記事詳細のみgenerateStaticParams実装
- 他の動的ルート（ランキングなど）は実装なし

**影響**:
- ビルド時の静的生成ができず、初回アクセスが遅い
- SEOクローラーがタイムアウトするリスク

#### 🟢 低優先度の問題

##### 9. PWA対応なし
- manifest.json未設定
- アプリライクな体験を提供できない

##### 10. Google Search Console verification
**現状**:
```typescript
verification: {
  google: "your-google-verification-code",
}
```
- プレースホルダーのまま

---

## 2. ページ別の課題リスト

### 2.1 ブログ関連ページ

| ページ | メタデータ | 構造化データ | OGP | 課題 |
|--------|-----------|-------------|-----|------|
| `/blog` | ✅ | ✅ Blog | ✅ | 画像なし |
| `/blog/[category]` | ✅ | ❌ | ✅ | 構造化データなし、画像なし |
| `/blog/tags/[tag]` | ✅ | ❌ | ❌ | 構造化データなし、OGP不完全 |
| `/blog/[category]/[slug]/[year]` | ✅ | ✅ Article | ✅ | 画像なし、canonical未設定 |

**優先課題**:
1. OGP画像の設定（全ページ共通またはカテゴリ別）
2. CollectionPage構造化データ（カテゴリ・タグページ）
3. Canonical URL設定

---

### 2.2 統計関連ページ

| ページ | メタデータ | 構造化データ | OGP | 課題 |
|--------|-----------|-------------|-----|------|
| `/` | ❌ | ❌ | ❌ | すべて未実装 |
| `/[category]` | ✅ | ❌ | ✅ | 構造化データなし |
| `/[category]/[subcategory]` | ✅ | ❌ | ✅ | 構造化データなし |
| `/[category]/[subcategory]/ranking` | ✅ | ❌ | ❌ | 構造化データなし |
| `/[category]/[subcategory]/ranking/[rankingKey]` | ❌ | ❌ | ❌ | すべて未実装 |
| `/[category]/[subcategory]/dashboard` | ❌ | ❌ | ❌ | すべて未実装 |
| `/[category]/[subcategory]/dashboard/[areaCode]` | ❌ | ❌ | ❌ | すべて未実装 |

**優先課題**:
1. **トップページのメタデータ設定**（最重要）
2. **ランキング詳細ページのメタデータ**
3. **Dataset構造化データの実装**（ランキング・ダッシュボード）
4. **BreadcrumbList構造化データ**
5. **generateStaticParams実装**（主要ランキング）

---

### 2.3 その他ページ

| ページ | メタデータ | 構造化データ | OGP | 課題 |
|--------|-----------|-------------|-----|------|
| `/privacy` | ✅ | ❌ | ❌ | WebPage構造化データ推奨 |
| `/admin/*` | ❌ | N/A | N/A | robots.txtで除外必要 |

---

## 3. 改善提案

### 3.1 メタデータの改善

#### 提案1: ルートレイアウトのメタデータ修正

**実装ファイル**: `src/app/layout.tsx`

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.example.com"),
  title: {
    template: "%s | 統計で見る都道府県",
    default: "統計で見る都道府県 - 日本の都道府県統計データ可視化プラットフォーム",
  },
  description:
    "日本の都道府県統計データを可視化するWebアプリケーション。e-Stat APIを中心に、政府統計、自治体データを取得し、直感的なグラフとランキングで表示します。",
  keywords: [
    "統計",
    "都道府県",
    "データ可視化",
    "e-Stat",
    "政府統計",
    "ランキング",
    "ダッシュボード",
    "日本",
  ],
  authors: [{ name: "統計で見る都道府県" }],
  creator: "統計で見る都道府県",
  publisher: "統計で見る都道府県",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "統計で見る都道府県",
    title: "統計で見る都道府県",
    description: "日本の都道府県統計データを可視化するWebアプリケーション",
    locale: "ja_JP",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "統計で見る都道府県 - 日本の統計データ可視化",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "統計で見る都道府県",
    description: "日本の都道府県統計データを可視化するWebアプリケーション",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};
```

**変更点**:
- `metadataBase`を追加（相対URLの基準）
- タイトルとdescriptionを適切に設定
- OGP画像のURL、サイズ、altを指定
- Twitter画像を明示的に指定
- Google認証コードを環境変数から取得

---

#### 提案2: トップページのメタデータ追加

**実装ファイル**: `src/app/(public)/page.tsx`

現在の実装にメタデータを追加:

```typescript
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "トップページ",
  description:
    "日本全国47都道府県の統計データを可視化。人口、経済、産業、教育など多様な統計をランキングとダッシュボードで確認できます。",
  openGraph: {
    title: "統計で見る都道府県 - 日本の統計データ可視化プラットフォーム",
    description:
      "日本全国47都道府県の統計データを可視化。人口、経済、産業、教育など多様な統計をランキングとダッシュボードで確認できます。",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "統計で見る都道府県",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "統計で見る都道府県",
    description: "日本全国47都道府県の統計データを可視化",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "/",
  },
};
```

---

#### 提案3: ランキング詳細ページのメタデータ実装

**実装ファイル**: `src/app/(stats)/[category]/[subcategory]/ranking/[rankingKey]/page.tsx`

```typescript
/**
 * メタデータ生成
 */
export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { category, subcategory, rankingKey } = await params;
  const { year } = await searchParams;

  // ランキングアイテムを取得
  const rankingItem = await getRankingItem(rankingKey);

  if (!rankingItem) {
    return {
      title: "ランキングが見つかりません",
      description: "指定されたランキングは存在しません",
    };
  }

  // メタデータを取得
  const metadata = await getRankingMetadata(rankingItem.areaType, rankingKey);

  // 最新年度を取得
  const latestYear =
    metadata?.times && metadata.times.length > 0
      ? [...metadata.times].sort((a, b) => b.timeCode.localeCompare(a.timeCode))[0]
          .timeCode
      : undefined;

  const displayYear = year || latestYear;
  const itemName = metadata?.itemName || rankingItem.name || rankingItem.label;

  // ランキングデータを取得（descriptionに統計値を含めるため）
  const rankingData = displayYear
    ? await getRankingData(rankingItem.areaType, rankingKey, displayYear)
    : null;

  // トップ3の都道府県名を取得
  const top3 =
    rankingData && rankingData.length >= 3
      ? rankingData
          .sort((a, b) => b.value - a.value)
          .slice(0, 3)
          .map((d) => d.areaName)
          .join("、")
      : "";

  const description = displayYear
    ? `${itemName}の${displayYear}年度のランキング。${top3 ? `1位: ${top3.split("、")[0]}` : ""}都道府県別の詳細データとランキングを確認できます。`
    : `${itemName}の都道府県別ランキング。年度別の推移を確認できます。`;

  const title = displayYear
    ? `${itemName} ${displayYear}年度ランキング`
    : `${itemName} ランキング`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [
        {
          url: `/og-image-ranking.jpg`, // ランキング専用OGP画像
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image-ranking.jpg"],
    },
    alternates: {
      canonical: `/${category}/${subcategory}/ranking/${rankingKey}`,
    },
  };
}
```

**ポイント**:
- 実際のランキングデータを取得してトップ都道府県名をdescriptionに含める
- 年度情報を適切に表示
- canonical URLを設定

---

#### 提案4: ダッシュボードページのメタデータ実装

**実装ファイル**: `src/app/(stats)/[category]/[subcategory]/dashboard/page.tsx`

```typescript
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}): Promise<Metadata> {
  const { category, subcategory } = await params;

  // カテゴリ情報を取得
  const categories = await listCategories();
  const categoryData = categories.find((cat) => cat.categoryKey === category);
  const subcategoryData = categoryData?.subcategories?.find(
    (sub) => sub.subcategoryKey === subcategory
  );

  const title = `${subcategoryData?.subcategoryName || subcategory} ダッシュボード`;
  const description = `${subcategoryData?.subcategoryName || subcategory}の統計データを地域別に表示。全国および各都道府県の詳細なデータと推移をダッシュボードで確認できます。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: ["/og-image-dashboard.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image-dashboard.jpg"],
    },
    alternates: {
      canonical: `/${category}/${subcategory}/dashboard`,
    },
  };
}
```

---

### 3.2 構造化データの実装

#### 提案5: Dataset構造化データ（ランキングページ用）

**新規ファイル**: `src/features/ranking/utils/structured-data.ts`

```typescript
/**
 * ランキングデータの構造化データを生成（Dataset）
 *
 * Google Dataset Searchでの表示を目的とする
 *
 * @param rankingItem - ランキングアイテム
 * @param metadata - ランキングメタデータ
 * @param rankingData - ランキングデータ
 * @param year - 年度
 * @param baseUrl - ベースURL
 * @returns JSON-LD形式の構造化データ
 */
export function generateRankingDatasetStructuredData(
  rankingItem: RankingItem,
  metadata: RankingMetadata | null,
  rankingData: RankingData[] | null,
  year: string | undefined,
  baseUrl: string
): object {
  const itemName = metadata?.itemName || rankingItem.name || rankingItem.label;
  const unit = metadata?.unit || "";

  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: year ? `${itemName} ${year}年度` : itemName,
    description: `日本の都道府県別${itemName}のランキングデータ。${rankingData ? `${rankingData.length}件のデータが含まれます。` : ""}`,
    url: `${baseUrl}/${rankingItem.category}/${rankingItem.subcategory}/ranking/${rankingItem.rankingKey}${year ? `?year=${year}` : ""}`,
    keywords: [
      "統計",
      "都道府県",
      "ランキング",
      itemName,
      year || "",
      rankingItem.category,
      rankingItem.subcategory,
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
    ...(metadata?.source && {
      isBasedOn: {
        "@type": "Dataset",
        name: metadata.source.name,
        url: metadata.source.url,
      },
    }),
    ...(year && {
      temporalCoverage: `${year}`,
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
        contentUrl: `${baseUrl}/${rankingItem.category}/${rankingItem.subcategory}/ranking/${rankingItem.rankingKey}${year ? `?year=${year}` : ""}`,
      },
    ],
  };
}
```

**使用箇所**: `src/app/(stats)/[category]/[subcategory]/ranking/[rankingKey]/page.tsx`

```typescript
// ランキング詳細ページコンポーネント内
const structuredData = generateRankingDatasetStructuredData(
  rankingItem,
  metadata,
  rankingDataForSingle,
  selectedYear,
  baseUrl
);

return (
  <Card>
    {/* 構造化データ */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
    {/* ... 既存のコンテンツ ... */}
  </Card>
);
```

---

#### 提案6: BreadcrumbList構造化データ

**新規ファイル**: `src/features/shared/utils/breadcrumb-structured-data.ts`

```typescript
/**
 * パンくずリストの構造化データを生成
 *
 * @param items - パンくずアイテム
 * @param baseUrl - ベースURL
 * @returns JSON-LD形式の構造化データ
 */
export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; href: string }>,
  baseUrl: string
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.href}`,
    })),
  };
}
```

**使用箇所**: パンくずナビゲーションがあるすべてのページ

```typescript
// 例: ランキング詳細ページ
const breadcrumbItems = [
  { name: "トップ", href: "/" },
  { name: categoryData.categoryName, href: `/${category}` },
  { name: subcategoryData.subcategoryName, href: `/${category}/${subcategory}` },
  { name: "ランキング", href: `/${category}/${subcategory}/ranking` },
  { name: itemName, href: `/${category}/${subcategory}/ranking/${rankingKey}` },
];

const breadcrumbStructuredData = generateBreadcrumbStructuredData(
  breadcrumbItems,
  baseUrl
);
```

---

#### 提案7: CollectionPage構造化データ（ブログカテゴリ・タグページ用）

**追加ファイル**: `src/features/blog/utils/structured-data.ts`

```typescript
/**
 * コレクションページの構造化データを生成（CollectionPage）
 *
 * カテゴリページやタグページで使用
 *
 * @param collectionName - コレクション名
 * @param description - 説明
 * @param url - URL
 * @param articles - 記事リスト
 * @param baseUrl - ベースURL
 * @returns JSON-LD形式の構造化データ
 */
export function generateCollectionStructuredData(
  collectionName: string,
  description: string,
  url: string,
  articles: Article[],
  baseUrl: string
): object {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collectionName,
    description,
    url,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((article, index) => {
        const path = article.time
          ? `/blog/${article.actualCategory}/${article.slug}/${article.time}`
          : `/blog/${article.actualCategory}/${article.slug}`;

        return {
          "@type": "ListItem",
          position: index + 1,
          url: `${baseUrl}${path}`,
          name: article.frontmatter.title,
        };
      }),
    },
    publisher: {
      "@type": "Organization",
      name: "統計で見る都道府県",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
  };
}
```

**使用箇所**:
- `/blog/[category]` - カテゴリ別記事一覧
- `/blog/tags/[tag]` - タグ別記事一覧

---

#### 提案8: WebSite構造化データ（ルートレイアウト用）

**新規ファイル**: `src/features/shared/utils/website-structured-data.ts`

```typescript
/**
 * WebSiteの構造化データを生成
 *
 * サイト全体の情報を提供
 *
 * @param baseUrl - ベースURL
 * @returns JSON-LD形式の構造化データ
 */
export function generateWebSiteStructuredData(baseUrl: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "統計で見る都道府県",
    url: baseUrl,
    description:
      "日本の都道府県統計データを可視化するWebアプリケーション。e-Stat APIを中心に、政府統計、自治体データを取得し、直感的なグラフとランキングで表示します。",
    publisher: {
      "@type": "Organization",
      name: "統計で見る都道府県",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
```

**使用箇所**: `src/app/layout.tsx`（ルートレイアウト）

```typescript
// クライアント側でスクリプトタグを追加
// または、Server Componentで直接レンダリング
```

---

### 3.3 OGP画像の実装

#### 提案9: デフォルトOGP画像の作成

**作成ファイル**:
1. `/public/og-image.jpg` (1200x630px)
   - サイト全体のデフォルト画像
   - 「統計で見る都道府県」ロゴ + 日本地図のビジュアル

2. `/public/og-image-ranking.jpg` (1200x630px)
   - ランキングページ専用
   - 棒グラフや地図のビジュアル

3. `/public/og-image-dashboard.jpg` (1200x630px)
   - ダッシュボードページ専用
   - チャートやグラフのビジュアル

4. `/public/logo.png` (512x512px)
   - サイトロゴ
   - 構造化データで使用

**デザイン要件**:
- ファイルサイズ: 各300KB以下
- 解像度: 1200x630px（OGP推奨サイズ）
- フォーマット: JPEG（またはPNG）
- 含めるべき要素:
  - サイトロゴ
  - サイト名「統計で見る都道府県」
  - キャッチコピーまたは説明
  - ビジュアル要素（地図、グラフなど）

---

#### 提案10: 動的OGP画像の生成（Next.js 15のopengraph-image機能）

**新規ファイル**: `src/app/(stats)/[category]/[subcategory]/ranking/[rankingKey]/opengraph-image.tsx`

```tsx
import { ImageResponse } from "next/og";

import { getRankingItem } from "@/features/ranking";
import { getRankingMetadata } from "@/features/ranking/items/actions/getRankingMetadata";

export const runtime = "edge";
export const alt = "ランキング詳細";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * 動的OGP画像生成
 */
export default async function Image({
  params,
}: {
  params: Promise<{ rankingKey: string }>;
}) {
  const { rankingKey } = await params;

  // ランキングアイテムを取得
  const rankingItem = await getRankingItem(rankingKey);

  if (!rankingItem) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: "white",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ランキングが見つかりません
        </div>
      ),
      { ...size }
    );
  }

  // メタデータを取得
  const metadata = await getRankingMetadata(rankingItem.areaType, rankingKey);
  const itemName = metadata?.itemName || rankingItem.name || rankingItem.label;

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: "linear-gradient(to bottom, #3b82f6, #1e40af)",
          color: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          統計で見る都道府県
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          {itemName}
        </div>
        <div
          style={{
            fontSize: 40,
            opacity: 0.9,
          }}
        >
          ランキング
        </div>
      </div>
    ),
    { ...size }
  );
}
```

**メリット**:
- ランキングごとに専用のOGP画像を自動生成
- 管理コストが低い
- SNSシェア時の視認性向上

---

### 3.4 robots.txtの実装

#### 提案11: robots.txt作成

**新規ファイル**: `src/app/robots.ts`

```typescript
import { MetadataRoute } from "next";

/**
 * robots.txtを生成
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.example.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/*", // 管理画面
          "/api/auth/*", // 認証API
          "/profile/edit", // プロフィール編集
          "/*?*preview=true", // プレビューページ
        ],
      },
      {
        userAgent: "GPTBot", // ChatGPT
        disallow: ["/"], // AI学習用のクロール禁止
      },
      {
        userAgent: "CCBot", // Common Crawl
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

**ポイント**:
- 管理画面とAPIエンドポイントをクロール対象外に
- AIボット（GPTBot、CCBotなど）のクロールを制限
- sitemapへのリンクを明示

---

### 3.5 favicon・PWA対応

#### 提案12: favicon・アイコンの追加

**作成ファイル**:
1. `/public/apple-touch-icon.png` (180x180px)
   - iOS用アイコン

2. `/public/icon.png` (512x512px)
   - Androidなど汎用アイコン

3. `src/app/icon.tsx`（または静的ファイル）
   - Next.js 15のファイルベースメタデータ

**代替案**: `src/app/icon.tsx`で動的生成

```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: "#3b82f6",
          color: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
        }}
      >
        統
      </div>
    ),
    { ...size }
  );
}
```

---

#### 提案13: PWA対応（manifest.json）

**新規ファイル**: `src/app/manifest.ts`

```typescript
import { MetadataRoute } from "next";

/**
 * PWA manifestを生成
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "統計で見る都道府県",
    short_name: "統計47",
    description: "日本の都道府県統計データを可視化",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
```

---

### 3.6 Canonical URL・Alternatesの実装

#### 提案14: Canonical URLの設定

すべての動的ページのメタデータに`alternates.canonical`を追加:

```typescript
// 例: ランキング詳細ページ
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, subcategory, rankingKey } = await params;

  return {
    // ... 既存のメタデータ
    alternates: {
      canonical: `/${category}/${subcategory}/ranking/${rankingKey}`,
    },
  };
}
```

**対象ページ**:
- すべての動的ルート
- クエリパラメータを含むページ

---

### 3.7 ISR・generateStaticParamsの最適化

#### 提案15: 主要ランキングのgenerateStaticParams実装

**実装ファイル**: `src/app/(stats)/[category]/[subcategory]/ranking/[rankingKey]/page.tsx`

```typescript
/**
 * 静的パラメータ生成
 *
 * ビルド時に主要なランキングページを生成
 */
export async function generateStaticParams() {
  // すべてのランキングアイテムを取得
  const rankingItems = await getAllRankingItems();

  // 主要なランキング（例: アクセス数上位100件）のみ生成
  const topRankings = rankingItems
    .filter((item) => item.isPopular) // 人気フラグがある場合
    .slice(0, 100);

  return topRankings.map((item) => ({
    category: item.category,
    subcategory: item.subcategory,
    rankingKey: item.rankingKey,
  }));
}

/**
 * ISR設定
 */
export const revalidate = 3600; // 1時間ごとに再生成
```

**メリット**:
- 主要ページの初回アクセスが高速化
- SEOクローラーがスムーズにアクセス可能
- サーバー負荷の軽減

---

### 3.8 サイトマップの最適化

#### 提案16: サイトマップに統計ページを追加

**実装ファイル**: `src/app/sitemap.ts`

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.example.com";

  // 既存のブログ関連ページ
  // ... (現在の実装を維持)

  // 統計カテゴリページ
  const categories = await listCategories();
  const statsPages: MetadataRoute.Sitemap = [];

  for (const category of categories) {
    // カテゴリページ
    statsPages.push({
      url: `${baseUrl}/${category.categoryKey}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });

    // サブカテゴリページ
    for (const subcategory of category.subcategories || []) {
      statsPages.push({
        url: `${baseUrl}/${category.categoryKey}/${subcategory.subcategoryKey}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });

      // ランキング一覧ページ
      statsPages.push({
        url: `${baseUrl}/${category.categoryKey}/${subcategory.subcategoryKey}/ranking`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      });

      // ダッシュボードページ
      statsPages.push({
        url: `${baseUrl}/${category.categoryKey}/${subcategory.subcategoryKey}/dashboard`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      });
    }
  }

  // 主要なランキング詳細ページ（上位100件）
  const rankingItems = await getAllRankingItems();
  const topRankings = rankingItems
    .filter((item) => item.isPopular)
    .slice(0, 100);

  const rankingPages: MetadataRoute.Sitemap = topRankings.map((item) => ({
    url: `${baseUrl}/${item.category}/${item.subcategory}/ranking/${item.rankingKey}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...articlePages, ...tagPages, ...statsPages, ...rankingPages];
}
```

**変更点**:
- 統計カテゴリページを追加
- サブカテゴリページを追加
- ランキング・ダッシュボードページを追加
- 主要なランキング詳細ページを追加（全件ではなく上位100件）

---

## 4. 実装ロードマップ

### フェーズ1: 緊急対応（1週間）

**優先度: 高 | 工数: 20-30時間**

#### Week 1: 基本メタデータとSEO基礎の整備

| タスク | 工数 | 担当 | 成果物 |
|--------|------|------|--------|
| ルートレイアウトのメタデータ修正 | 2h | Dev | `src/app/layout.tsx` |
| トップページのメタデータ追加 | 2h | Dev | `src/app/(public)/page.tsx` |
| robots.txt実装 | 1h | Dev | `src/app/robots.ts` |
| デフォルトOGP画像作成 | 4h | Design | `/public/og-image.jpg`, `/public/logo.png` |
| ランキング詳細ページのメタデータ実装 | 6h | Dev | `src/app/(stats)/[category]/[subcategory]/ranking/[rankingKey]/page.tsx` |
| ダッシュボードページのメタデータ実装 | 4h | Dev | Dashboard関連ページ |
| Canonical URL設定（主要ページ） | 3h | Dev | 各ページのメタデータ |

**マイルストーン**:
- すべての公開ページに適切なメタデータが設定される
- OGP画像が表示される
- 管理画面がクロール対象外になる

---

### フェーズ2: 基本機能の実装（2週間）

**優先度: 中-高 | 工数: 40-50時間**

#### Week 2-3: 構造化データとOGP画像の充実

| タスク | 工数 | 担当 | 成果物 |
|--------|------|------|--------|
| Dataset構造化データ実装 | 8h | Dev | `src/features/ranking/utils/structured-data.ts` |
| BreadcrumbList構造化データ実装 | 4h | Dev | `src/features/shared/utils/breadcrumb-structured-data.ts` |
| CollectionPage構造化データ実装 | 4h | Dev | ブログカテゴリ・タグページ |
| WebSite構造化データ実装 | 2h | Dev | ルートレイアウト |
| ランキング専用OGP画像作成 | 4h | Design | `/public/og-image-ranking.jpg` |
| ダッシュボード専用OGP画像作成 | 4h | Design | `/public/og-image-dashboard.jpg` |
| 動的OGP画像生成実装（ランキング） | 6h | Dev | `opengraph-image.tsx` |
| favicon・アイコン追加 | 3h | Design/Dev | `/public/apple-touch-icon.png` など |
| サイトマップ最適化 | 5h | Dev | `src/app/sitemap.ts` |

**マイルストーン**:
- 主要ページに構造化データが実装される
- Google Dataset Searchに表示される可能性
- SNSシェア時に適切な画像が表示される

---

### フェーズ3: 高度な機能と最適化（1ヶ月）

**優先度: 中-低 | 工数: 30-40時間**

#### Week 4-7: PWA対応とパフォーマンス最適化

| タスク | 工数 | 担当 | 成果物 |
|--------|------|------|--------|
| PWA対応（manifest.json） | 4h | Dev | `src/app/manifest.ts` |
| generateStaticParams実装（主要ランキング） | 8h | Dev | 各動的ルート |
| ISR設定の最適化 | 4h | Dev | revalidate設定 |
| 動的OGP画像生成（ダッシュボード） | 6h | Dev | `opengraph-image.tsx` |
| メタデータのテスト・検証 | 4h | QA | テスト結果レポート |
| Google Search Console設定 | 2h | Dev | 環境変数設定 |
| 構造化データのバリデーション | 2h | Dev | Schema.org検証 |

**マイルストーン**:
- PWA対応完了
- 主要ページの静的生成が完了
- 構造化データがすべて有効

---

### フェーズ4: 継続的改善（継続）

**優先度: 低 | 工数: 月5-10時間**

- **メタデータの定期的なレビュー**: 四半期ごと
- **新規ページのメタデータ対応**: 新機能追加時
- **構造化データの拡張**: 新しいSchema.org対応
- **OGP画像のA/Bテスト**: SNSシェア率の測定と改善
- **SEOパフォーマンスの測定**: Google Analytics、Search Console

---

## 5. 期待される効果

### 5.1 SEO改善

#### 検索順位の向上
- **想定効果**: 主要キーワードで10-20位の上昇
- **根拠**:
  - 適切なメタデータによる検索エンジンの理解向上
  - 構造化データによるリッチスニペット表示
  - Canonical URLによる重複コンテンツ問題の解消

#### 検索結果でのCTR向上
- **想定効果**: 10-20%の向上
- **根拠**:
  - リッチスニペット（Dataset、BreadcrumbList）の表示
  - 魅力的なメタdescription
  - サイトロゴの表示

#### Google Dataset Searchへの掲載
- **想定効果**: データセット検索からの流入増加
- **根拠**:
  - Dataset構造化データの実装
  - 統計データという特性に適合

---

### 5.2 SNSシェア最適化

#### シェア時の視認性向上
- **想定効果**: SNS経由のCTRが2-3倍に向上
- **根拠**:
  - OGP画像の設定により視覚的な訴求力向上
  - Twitter Card対応によるカードプレビュー表示

#### シェア率の向上
- **想定効果**: シェアボタンのクリック率が20-30%向上
- **根拠**:
  - 魅力的なOGP画像とタイトル
  - 適切なdescriptionによる内容の明確化

---

### 5.3 クロール効率化

#### クロールバジェットの最適化
- **想定効果**: 重要ページのクロール頻度が30-50%増加
- **根拠**:
  - robots.txtによる不要なページの除外
  - sitemapによる優先順位の明示

#### インデックス速度の向上
- **想定効果**: 新規・更新ページのインデックスが2-3倍速く
- **根拠**:
  - sitemap.xmlのISR設定
  - generateStaticParamsによる静的生成

---

### 5.4 ユーザー体験向上

#### PWAによる体験向上
- **想定効果**: モバイルユーザーのリピート率が10-15%向上
- **根拠**:
  - ホーム画面への追加
  - アプリライクな体験

#### ページ速度の向上
- **想定効果**: 初回アクセス時のLCPが20-30%改善
- **根拠**:
  - generateStaticParamsによる事前生成
  - ISRによる最適化

---

## 6. 測定とモニタリング

### 6.1 KPI設定

| KPI | 現状 | 目標（3ヶ月後） | 測定ツール |
|-----|------|----------------|-----------|
| オーガニック検索流入 | TBD | +30% | Google Analytics |
| 検索順位（主要KW） | TBD | 平均10位UP | Google Search Console |
| 構造化データエラー | TBD | 0件 | Google Search Console |
| OGP表示率 | TBD | 100% | Facebook Debugger |
| リッチスニペット表示 | TBD | 50%以上 | Google Search Console |
| SNS経由CTR | TBD | +100% | Google Analytics |

---

### 6.2 モニタリング手順

#### 週次チェック（30分）
1. Google Search Consoleでエラー確認
2. 新規ページのインデックス状況確認
3. 構造化データのバリデーション

#### 月次レビュー（2時間）
1. KPIの測定と分析
2. 検索順位の変動確認
3. OGP画像のA/Bテスト結果確認
4. 改善アクションの検討

#### 四半期レビュー（半日）
1. 包括的なSEO分析
2. 競合サイトとの比較
3. 次四半期の改善計画策定

---

## 7. 実装のベストプラクティス

### 7.1 メタデータ設定のルール

1. **タイトル**:
   - 最大60文字
   - キーワードを前方に配置
   - サイト名を末尾に（テンプレートで自動付与）

2. **Description**:
   - 最大160文字
   - 実際の数値や具体的な情報を含める
   - CTAを含める（「確認できます」「表示します」など）

3. **Keywords**:
   - 5-10個程度
   - 実際のコンテンツに関連するもののみ

---

### 7.2 OGP画像のルール

1. **サイズ**: 1200x630px
2. **ファイルサイズ**: 300KB以下
3. **フォーマット**: JPEG推奨（写真・グラデーション）、PNG（ロゴ・アイコン）
4. **含めるべき要素**:
   - サイトロゴまたはサイト名
   - ページのタイトルまたは主要情報
   - ビジュアル要素

---

### 7.3 構造化データのルール

1. **必須プロパティ**: すべて設定
2. **推奨プロパティ**: 可能な限り設定
3. **バリデーション**: [Google Rich Results Test](https://search.google.com/test/rich-results)で検証
4. **テスト**: 本番デプロイ前に必ずテスト

---

## 8. リスクと対策

### 8.1 想定されるリスク

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|---------|------|
| OGP画像のファイルサイズ超過 | 低 | 中 | 画像最適化ツール使用 |
| 動的OGP生成のエラー | 中 | 低 | フォールバック画像設定 |
| 構造化データのバリデーションエラー | 中 | 中 | デプロイ前テスト必須化 |
| ISR設定ミスによるビルドエラー | 高 | 低 | ステージング環境で検証 |
| robots.txtの設定ミス | 高 | 低 | 本番デプロイ前にダブルチェック |

---

### 8.2 ロールバック計画

万が一問題が発生した場合:
1. **メタデータの問題**: 即座に修正してデプロイ（5分以内）
2. **robots.txtの問題**: 緊急ロールバック（10分以内）
3. **構造化データのエラー**: スクリプトタグをコメントアウト（5分以内）

---

## 9. 参考資料

### 9.1 公式ドキュメント
- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Schema.org](https://schema.org/)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

### 9.2 検証ツール
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)

---

## 10. まとめ

本提案書では、「統計で見る都道府県」プロジェクトのメタデータと構造化データに関する包括的な改善策を提示しました。

### 重要なポイント

1. **緊急対応が必要な項目**:
   - ルートレイアウトのメタデータ修正
   - OGP画像の作成
   - robots.txtの実装
   - ランキング詳細ページのメタデータ

2. **最大の効果が期待できる施策**:
   - Dataset構造化データの実装（Google Dataset Search対応）
   - OGP画像の設定（SNSシェア最適化）
   - generateStaticParams実装（パフォーマンス向上）

3. **段階的な実装**:
   - フェーズ1（1週間）で基本的なSEO対策を完了
   - フェーズ2（2週間）で構造化データとOGP画像を充実
   - フェーズ3（1ヶ月）でPWA対応と最適化を実施

本提案を実装することで、SEOの大幅な改善、SNSシェアの最適化、ユーザー体験の向上が期待できます。優先度の高い項目から順次実装を進めることを推奨します。

---

**作成日**: 2025年11月4日
**作成者**: Claude (Anthropic)
**バージョン**: 1.0
