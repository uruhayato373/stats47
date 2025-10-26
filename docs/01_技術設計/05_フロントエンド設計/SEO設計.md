---
title: SEO設計
created: 2025-01-20
updated: 2025-01-20
tags:
  - frontend-design
  - seo
  - metadata
---

# SEO設計

## 概要

stats47プロジェクトにおけるSEO（検索エンジン最適化）の設計方針と実装パターンを定義します。47都道府県の統計データ可視化サービスに特化したSEO戦略を提供します。

## 1. SEO目標とKPI

### 1.1 Phase 1の目標

- **SEOスコア**: 80点以上（Google Lighthouse）
- **月間PV**: 5万以上
- **ページ表示時間**: 3秒以内
- **Lighthouse Performance**: 80点以上

### 1.2 重要指標

| 指標 | 目標値 | 測定方法 |
|------|--------|----------|
| **LCP** (Largest Contentful Paint) | < 2.5秒 | Core Web Vitals |
| **FID** (First Input Delay) | < 100ms | Core Web Vitals |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Core Web Vitals |
| **SEOスコア** | > 80 | Lighthouse |

## 2. メタデータ戦略

### 2.1 ルートレイアウト（共通設定）

すべてのページに適用される基本メタデータを設定します。

```tsx
// app/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://stats47.com"),
  title: {
    template: "%s | 統計で見る都道府県",
    default: "統計で見る都道府県 - データで知る、地域の今",
  },
  description:
    "日本の47都道府県の統計データを可視化。e-Stat APIから取得した最新の政府統計を、わかりやすいグラフとランキングで表示します。",
  openGraph: {
    type: "website",
    siteName: "統計で見る都道府県",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    site: "@stats47_jp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};
```

### 2.2 動的メタデータ（ランキングページ）

**重要**: ランキングページは検索流入の主要ソースです。

```tsx
// app/ranking/[category]/[subcategory]/page.tsx
import { Metadata } from "next";
import { getRankingData } from "@/infrastructure/ranking/ranking-repository";

type Props = {
  params: { category: string; subcategory: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getRankingData(params.subcategory);
  const top = data.items[0];
  const bottom = data.items[data.items.length - 1];

  const title = `${data.metadata.name}の都道府県ランキング`;
  const description =
    `${data.metadata.name}を都道府県別に比較。${data.metadata.year}年の最新データから、` +
    `${top.areaName}が1位（${top.displayValue}）、${bottom.areaName}が47位（${bottom.displayValue}）。` +
    `e-Statの公式統計データを元にしたランキングです。`;

  const ogImageUrl = `/api/og?type=ranking&subcategory=${params.subcategory}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://stats47.com/ranking/${params.category}/${params.subcategory}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `https://stats47.com/ranking/${params.category}/${params.subcategory}`,
    },
  };
}
```

**設計のポイント**:
- **データ駆動型**: 実際のランキングデータから動的に生成
- **具体的な数値**: トップとボトムの都道府県名・値を含める
- **キーワード最適化**: 「都道府県ランキング」「比較」「統計データ」を自然に含める
- **年次情報**: 最新性を示す
- **権威性**: 「e-Stat公式統計」を明記

## 3. 構造化データ（JSON-LD）

検索エンジンにコンテンツの意味を伝え、リッチリザルト表示を促進します。

### 3.1 共通コンポーネント

```tsx
// src/components/atoms/JsonLd.tsx
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

### 3.2 ルートレイアウト（Organization + WebSite）

```tsx
// app/layout.tsx
import JsonLd from "@/components/atoms/JsonLd";

export default function RootLayout({ children }) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "統計で見る都道府県",
    url: "https://stats47.com",
    logo: "https://stats47.com/logo.png",
    sameAs: ["https://twitter.com/stats47_jp"],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "統計で見る都道府県",
    url: "https://stats47.com",
    description: "日本の47都道府県の統計データ可視化サービス",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://stats47.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="ja">
      <head>
        <JsonLd data={[organizationSchema, websiteSchema]} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 3.3 ランキングページ（Dataset + BreadcrumbList）

```tsx
// app/ranking/[category]/[subcategory]/page.tsx
export default async function RankingPage({ params }: Props) {
  const data = await getRankingData(params.subcategory);
  const categoryData = await getCategoryData(params.category);

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${data.metadata.name}の都道府県ランキング`,
    description: `日本の47都道府県における${data.metadata.name}のランキングデータ（${data.metadata.year}年）`,
    url: `https://stats47.com/ranking/${params.category}/${params.subcategory}`,
    creator: {
      "@type": "Organization",
      name: "統計で見る都道府県",
    },
    spatialCoverage: {
      "@type": "Place",
      name: "日本",
      geo: {
        "@type": "GeoShape",
        addressCountry: "JP",
      },
    },
    temporalCoverage: data.metadata.year,
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `https://stats47.com/api/ranking/${params.subcategory}`,
    },
    variableMeasured: data.metadata.name,
    includedInDataCatalog: {
      "@type": "DataCatalog",
      name: "e-Stat（政府統計の総合窓口）",
      url: "https://www.e-stat.go.jp/",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "トップ",
        item: "https://stats47.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryData.name,
        item: `https://stats47.com/ranking/${params.category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: data.metadata.name,
        item: `https://stats47.com/ranking/${params.category}/${params.subcategory}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[datasetSchema, breadcrumbSchema]} />
      {/* ページコンテンツ */}
    </>
  );
}
```

**設計のポイント**:
- **Datasetスキーマ**: Google Dataset Searchでの発見可能性を向上
- **spatialCoverage**: 地理的範囲（日本全国）を明示
- **temporalCoverage**: 時間的範囲（年次）を明示
- **includedInDataCatalog**: データソース（e-Stat）を明示して権威性を示す
- **BreadcrumbList**: パンくずリストをリッチリザルトで表示

## 4. サイトマップ生成

### 4.1 基本実装

```typescript
// app/sitemap.ts
import { MetadataRoute } from "next";
import {
  getAllCategories,
  getAllSubcategories,
} from "@/infrastructure/category/category-service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://stats47.com";

  // 静的ページ
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
  ];

  // カテゴリページ
  const categories = await getAllCategories();
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}/ranking/${category.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // ランキングページ（サブカテゴリ）
  const subcategories = await getAllSubcategories();
  const rankingPages = subcategories.map((subcategory) => ({
    url: `${baseUrl}/ranking/${subcategory.categoryId}/${subcategory.id}`,
    lastModified: new Date(subcategory.updatedAt || new Date()),
    changeFrequency: "daily" as const,
    priority: 0.9, // 最重要コンテンツ
  }));

  return [...staticPages, ...categoryPages, ...rankingPages];
}
```

**設計のポイント**:
- **ランキングページの優先度**: 0.9（検索流入の主要ソース）
- **更新頻度**: 'daily'（e-Statデータの更新を反映）
- **動的生成**: データベースから実際のカテゴリ・サブカテゴリを取得

### 4.2 推定ページ数

Phase 1時点での想定：
- トップページ: 1
- カテゴリページ: 10-15
- ランキングページ: 100-200（主要指標）
- その他: 5-10
- **合計: 116-226ページ**

## 5. robots.txt設定

```typescript
// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.com";

  // 開発環境では完全にインデックスを防止
  if (process.env.NODE_ENV !== "production") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  // 本番環境
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/*?*", // クエリパラメータ付きURL禁止（重複コンテンツ回避）
          "/search*",
          "/draft/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/admin/"],
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

**設計のポイント**:
- **環境別設定**: 開発環境では完全にインデックス防止
- **クエリパラメータ禁止**: `/*?*`で重複コンテンツを回避
- **クロール制限**: Googlebotに1秒間隔を指定（サーバー負荷軽減）

## 6. 動的OGP画像生成

### 6.1 OGP画像API

```tsx
// app/api/og/route.tsx
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getRankingData } from "@/infrastructure/ranking/ranking-repository";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subcategory = searchParams.get("subcategory");

  if (!subcategory) {
    return new Response("Missing subcategory", { status: 400 });
  }

  const data = await getRankingData(subcategory);
  const top3 = data.items.slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          padding: "40px",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: "bold", marginBottom: 40 }}>
          {data.metadata.name}
        </div>
        <div style={{ fontSize: 48, marginBottom: 60 }}>都道府県ランキング</div>

        {top3.map((item, index) => (
          <div
            key={item.areaCode}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 20,
              fontSize: 36,
            }}
          >
            <span style={{ fontWeight: "bold", marginRight: 20 }}>
              {index + 1}位
            </span>
            <span style={{ marginRight: 20 }}>{item.areaName}</span>
            <span style={{ fontWeight: "bold" }}>{item.displayValue}</span>
          </div>
        ))}

        <div style={{ fontSize: 32, marginTop: 60, opacity: 0.8 }}>
          {data.metadata.year}年 | 統計で見る都道府県
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

**設計のポイント**:
- **Edge Runtime**: 高速生成
- **動的データ**: 実際のランキングデータを反映
- **トップ3表示**: ユーザーの興味を引く
- **ブランディング**: ロゴ・サイト名を含める

## 7. ターゲットキーワード戦略

### 7.1 Phase 1で狙うべき検索クエリ

- `[指標名] 都道府県 ランキング`
- `都道府県 [指標名] 比較`
- `[都道府県名] [指標名]`

**例**:
- `人口 都道府県 ランキング`
- `都道府県 人口 比較`
- `東京都 人口`

### 7.2 ロングテールキーワード

- `47都道府県 [指標名] 一覧`
- `[指標名] 日本 都道府県別`
- `[指標名] ランキング 最新`

## 8. 検証チェックリスト

### 8.1 メタデータ確認

- [ ] すべてのページにtitle・descriptionが設定されている
- [ ] タイトルは60文字以内
- [ ] 説明文は120-160文字
- [ ] OGP画像が1200×630pxで設定されている
- [ ] canonical URLが設定されている

### 8.2 構造化データ確認

- [ ] Google Rich Results Testでエラーがない
- [ ] Datasetスキーマがランキングページに設定されている
- [ ] BreadcrumbListが正しく表示される

**検証ツール**:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)

### 8.3 サイトマップ確認

- [ ] `/sitemap.xml`にアクセスできる
- [ ] すべての主要ページが含まれている
- [ ] Google Search Consoleにサイトマップを登録済み

### 8.4 パフォーマンス確認

- [ ] Lighthouse SEOスコアが80点以上
- [ ] Lighthouse Performanceスコアが80点以上
- [ ] LCPが3秒以内

## 9. 関連ドキュメント

- [システムアーキテクチャ](../01_システム概要/システムアーキテクチャ.md) - レンダリング戦略の詳細
- [パフォーマンス設計](../06_設計パターン/パフォーマンス設計.md) - Core Web Vitals最適化
- [レンダリング戦略](./レンダリング戦略.md) - SSR/ISR/CSRの使い分け
- [コンポーネント設計](./コンポーネント設計.md) - メタデータコンポーネント

---

**作成日**: 2025年1月20日  
**最終更新日**: 2025年1月20日  
**バージョン**: 1.0

