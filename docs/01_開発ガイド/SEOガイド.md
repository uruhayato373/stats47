---
title: stats47 SEO最適化ガイド
created: 2025-10-14
updated: 2025-10-20
tags:
  - development-guide
  - seo
  - stats47
---

# stats47 SEO最適化ガイド

## 概要

「統計で見る都道府県（stats47）」における、SEO（検索エンジン最適化）の実装ガイドです。

本ドキュメントは、**stats47プロジェクト固有のSEO戦略と実装方法**を記載しています。Next.js 15の一般的な使い方ではなく、47都道府県の統計データ可視化サービスに特化した実装例を提供します。

### Phase 1のSEO目標

- **SEOスコア**: 80点以上（Google Lighthouse）
- **月間PV**: 5万以上
- **ページ表示時間**: 3秒以内
- **Lighthouse Performance**: 80点以上

詳細は [Phase 1実装計画](../00_プロジェクト管理/03_実装計画/Phase1.md) を参照。

---

## 1. メタデータ戦略

### 1.1 ルートレイアウト（共通設定）

すべてのページに適用される基本メタデータを設定します。

```tsx
// app/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://stats47.com'),
  title: {
    template: '%s | 統計で見る都道府県',
    default: '統計で見る都道府県 - データで知る、地域の今',
  },
  description:
    '日本の47都道府県の統計データを可視化。e-Stat APIから取得した最新の政府統計を、わかりやすいグラフとランキングで表示します。地域の現状や特徴をデータから理解できます。',
  openGraph: {
    type: 'website',
    siteName: '統計で見る都道府県',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@stats47_jp', // 実際のアカウント名に変更
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};
```

### 1.2 トップページ

```tsx
// app/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '統計で見る都道府県 - データで知る、地域の今',
  description:
    '日本の47都道府県の統計データを可視化。人口、経済、教育、医療など、e-Stat APIから取得した政府統計を、わかりやすいグラフとランキングで表示します。',
  openGraph: {
    title: '統計で見る都道府県',
    description: 'データで知る、地域の今',
    url: 'https://stats47.com',
    images: [
      {
        url: 'https://stats47.com/og-home.jpg',
        width: 1200,
        height: 630,
        alt: '統計で見る都道府県 - トップページ',
      },
    ],
  },
};
```

### 1.3 ランキングページ（動的メタデータ）

**最重要**: ランキングページは検索流入の主要ソースです。

```tsx
// app/ranking/[category]/[subcategory]/page.tsx
import { Metadata } from 'next';
import { getRankingData } from '@/lib/ranking/ranking-repository';

type Props = {
  params: { category: string; subcategory: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // ランキングデータを取得
  const data = await getRankingData(params.subcategory);

  // トップとボトムの都道府県を取得
  const top = data.items[0]; // 1位
  const bottom = data.items[data.items.length - 1]; // 47位

  const title = `${data.metadata.name}の都道府県ランキング`;
  const description =
    `${data.metadata.name}を都道府県別に比較。${data.metadata.year}年の最新データから、` +
    `${top.areaName}が1位（${top.displayValue}）、${bottom.areaName}が47位（${bottom.displayValue}）。` +
    `e-Statの公式統計データを元にしたランキングです。`;

  // 動的OGP画像のURL
  const ogImageUrl = `/api/og?type=ranking&subcategory=${params.subcategory}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://stats47.com/ranking/${params.category}/${params.subcategory}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    // canonical URL（重複コンテンツ回避）
    alternates: {
      canonical: `https://stats47.com/ranking/${params.category}/${params.subcategory}`,
    },
  };
}
```

**ポイント**:
- **データ駆動型**: 実際のランキングデータから動的に生成
- **具体的な数値**: トップとボトムの都道府県名・値を含める
- **キーワード最適化**: 「都道府県ランキング」「比較」「統計データ」を自然に含める
- **年次情報**: 最新性を示す
- **権威性**: 「e-Stat公式統計」を明記

### 1.4 カテゴリページ

```tsx
// app/ranking/[category]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const categoryData = await getCategoryData(params.category);

  const title = `${categoryData.name}の統計ランキング`;
  const description =
    `${categoryData.name}に関する都道府県統計ランキング一覧。` +
    `${categoryData.subcategories.map(s => s.name).slice(0, 5).join('、')}など、` +
    `${categoryData.subcategories.length}種類の指標を比較できます。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://stats47.com/ranking/${params.category}`,
    },
  };
}
```

### 1.5 ダッシュボードページ

```tsx
// app/dashboard/page.tsx
export const metadata: Metadata = {
  title: '都道府県統計ダッシュボード',
  description:
    '日本の47都道府県の統計データを一覧表示。人口、経済、教育、医療など、様々な指標をグラフとランキングで可視化します。',
  openGraph: {
    title: '都道府県統計ダッシュボード',
    description: '47都道府県の統計データを一目で比較',
    url: 'https://stats47.com/dashboard',
  },
};
```

---

## 2. 構造化データ（JSON-LD）

検索エンジンにコンテンツの意味を伝え、リッチリザルト表示を促進します。

### 2.1 共通コンポーネント

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

### 2.2 ルートレイアウト（Organization + WebSite）

```tsx
// app/layout.tsx
import JsonLd from '@/components/atoms/JsonLd';

export default function RootLayout({ children }) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '統計で見る都道府県',
    url: 'https://stats47.com',
    logo: 'https://stats47.com/logo.png',
    sameAs: [
      'https://twitter.com/stats47_jp',
      // 他のSNSアカウント
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '統計で見る都道府県',
    url: 'https://stats47.com',
    description: '日本の47都道府県の統計データ可視化サービス',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://stats47.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
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

### 2.3 ランキングページ（Dataset + BreadcrumbList）

**Dataset スキーマ**: 統計データセットとして認識されることで、Google Dataset Searchに表示される可能性があります。

```tsx
// app/ranking/[category]/[subcategory]/page.tsx
export default async function RankingPage({ params }: Props) {
  const data = await getRankingData(params.subcategory);
  const categoryData = await getCategoryData(params.category);

  // Dataset スキーマ
  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${data.metadata.name}の都道府県ランキング`,
    description: `日本の47都道府県における${data.metadata.name}のランキングデータ（${data.metadata.year}年）`,
    url: `https://stats47.com/ranking/${params.category}/${params.subcategory}`,
    creator: {
      '@type': 'Organization',
      name: '統計で見る都道府県',
    },
    spatialCoverage: {
      '@type': 'Place',
      name: '日本',
      geo: {
        '@type': 'GeoShape',
        addressCountry: 'JP',
      },
    },
    temporalCoverage: data.metadata.year,
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'application/json',
      contentUrl: `https://stats47.com/api/ranking/${params.subcategory}`,
    },
    variableMeasured: data.metadata.name,
    includedInDataCatalog: {
      '@type': 'DataCatalog',
      name: 'e-Stat（政府統計の総合窓口）',
      url: 'https://www.e-stat.go.jp/',
    },
  };

  // BreadcrumbList スキーマ
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'トップ',
        item: 'https://stats47.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryData.name,
        item: `https://stats47.com/ranking/${params.category}`,
      },
      {
        '@type': 'ListItem',
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

**ポイント**:
- **Dataset スキーマ**: Google Dataset Searchでの発見可能性を向上
- **spatialCoverage**: 地理的範囲（日本全国）を明示
- **temporalCoverage**: 時間的範囲（年次）を明示
- **includedInDataCatalog**: データソース（e-Stat）を明示して権威性を示す
- **BreadcrumbList**: パンくずリストをリッチリザルトで表示

### 2.4 ダッシュボードページ（WebApplication）

```tsx
// app/dashboard/page.tsx
const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '都道府県統計ダッシュボード',
  url: 'https://stats47.com/dashboard',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'JPY',
  },
  featureList: [
    '47都道府県の統計データ可視化',
    'インタラクティブなグラフ表示',
    'ランキング比較',
  ],
};
```

---

## 3. サイトマップ生成

### 3.1 基本実装

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { getAllCategories, getAllSubcategories } from '@/lib/category/category-service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://stats47.com';

  // 静的ページ
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // カテゴリページ
  const categories = await getAllCategories();
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}/ranking/${category.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // ランキングページ（サブカテゴリ）
  const subcategories = await getAllSubcategories();
  const rankingPages = subcategories.map((subcategory) => ({
    url: `${baseUrl}/ranking/${subcategory.categoryId}/${subcategory.id}`,
    lastModified: new Date(subcategory.updatedAt || new Date()),
    changeFrequency: 'daily' as const, // e-Statデータは毎日更新される可能性
    priority: 0.9, // 最重要コンテンツ
  }));

  return [...staticPages, ...categoryPages, ...rankingPages];
}
```

**ポイント**:
- **ランキングページの優先度**: 0.9（検索流入の主要ソース）
- **更新頻度**: 'daily'（e-Statデータの更新を反映）
- **動的生成**: データベースから実際のカテゴリ・サブカテゴリを取得

### 3.2 推定ページ数

Phase 1時点での想定：
- トップページ: 1
- カテゴリページ: 10-15
- ランキングページ: 100-200（主要指標）
- その他: 5-10
- **合計: 116-226ページ**

### 3.3 大規模化対応（Phase 2以降）

ページ数が500を超える場合は、サイトマップを分割します。

```typescript
// app/sitemap-index.ts
import { MetadataRoute } from 'next';

export default function sitemapIndex(): MetadataRoute.SitemapIndex {
  return [
    {
      url: 'https://stats47.com/sitemap-pages.xml',
      lastModified: new Date(),
    },
    {
      url: 'https://stats47.com/sitemap-ranking.xml',
      lastModified: new Date(),
    },
  ];
}
```

---

## 4. robots.txt設定

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://stats47.com';

  // 開発環境では完全にインデックスを防止
  if (process.env.NODE_ENV !== 'production') {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  // 本番環境
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // APIルート禁止
          '/admin/',         // 管理画面禁止（将来用）
          '/*?*',            // クエリパラメータ付きURL禁止（重複コンテンツ回避）
          '/search*',        // 検索結果ページ禁止
          '/draft/',         // 下書きページ禁止
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
        crawlDelay: 1, // 1秒間隔でクロール
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

**ポイント**:
- **環境別設定**: 開発環境では完全にインデックス防止
- **クエリパラメータ禁止**: `/*?*` で重複コンテンツを回避
- **クロール制限**: Googlebotに1秒間隔を指定（サーバー負荷軽減）

---

## 5. 動的OGP画像生成

ランキングページ用の動的OGP画像をAPIルートで生成します。

### 5.1 OGP画像API

```tsx
// app/api/og/route.tsx
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getRankingData } from '@/lib/ranking/ranking-repository';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subcategory = searchParams.get('subcategory');

  if (!subcategory) {
    return new Response('Missing subcategory', { status: 400 });
  }

  // ランキングデータを取得
  const data = await getRankingData(subcategory);
  const top3 = data.items.slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 'bold', marginBottom: 40 }}>
          {data.metadata.name}
        </div>
        <div style={{ fontSize: 48, marginBottom: 60 }}>
          都道府県ランキング
        </div>

        {/* トップ3表示 */}
        {top3.map((item, index) => (
          <div
            key={item.areaCode}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 20,
              fontSize: 36,
            }}
          >
            <span style={{ fontWeight: 'bold', marginRight: 20 }}>
              {index + 1}位
            </span>
            <span style={{ marginRight: 20 }}>{item.areaName}</span>
            <span style={{ fontWeight: 'bold' }}>{item.displayValue}</span>
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

**ポイント**:
- **Edge Runtime**: 高速生成
- **動的データ**: 実際のランキングデータを反映
- **トップ3表示**: ユーザーの興味を引く
- **ブランディング**: ロゴ・サイト名を含める

### 5.2 使用例

```tsx
// メタデータで使用
const ogImageUrl = `/api/og?subcategory=${params.subcategory}`;

export const metadata = {
  openGraph: {
    images: [{ url: ogImageUrl, width: 1200, height: 630 }],
  },
};
```

---

## 6. パフォーマンス最適化

SEOスコアはパフォーマンスに大きく影響されます。

### 6.1 Core Web Vitals 目標

| 指標 | 目標値 | Phase 1基準 |
|------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5秒 | < 3秒 |
| FID (First Input Delay) | < 100ms | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.1 |

### 6.2 実装方針

1. **SSG/ISR活用**
   ```tsx
   // ランキングページはISRで24時間キャッシュ
   export const revalidate = 86400; // 24時間
   ```

2. **画像最適化**
   ```tsx
   // Next.js Imageコンポーネント使用
   import Image from 'next/image';

   <Image
     src="/chart.png"
     alt="ランキンググラフ"
     width={800}
     height={400}
     loading="lazy"
   />
   ```

3. **フォント最適化**
   ```tsx
   // app/layout.tsx
   import { Noto_Sans_JP } from 'next/font/google';

   const notoSansJP = Noto_Sans_JP({
     subsets: ['latin'],
     display: 'swap',
   });
   ```

詳細は [パフォーマンス最適化ガイド](./パフォーマンス最適化.md) を参照。

---

## 7. SEO検証チェックリスト

実装後、以下の項目を確認してください。

### 7.1 メタデータ確認

- [ ] すべてのページにtitle・descriptionが設定されている
- [ ] タイトルは60文字以内
- [ ] 説明文は120-160文字
- [ ] OGP画像が1200×630pxで設定されている
- [ ] canonical URLが設定されている

### 7.2 構造化データ確認

- [ ] Google Rich Results Testでエラーがない
- [ ] Dataset スキーマがランキングページに設定されている
- [ ] BreadcrumbList が正しく表示される

**検証ツール**:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)

### 7.3 サイトマップ確認

- [ ] `/sitemap.xml` にアクセスできる
- [ ] すべての主要ページが含まれている
- [ ] Google Search Consoleにサイトマップを登録済み

### 7.4 robots.txt確認

- [ ] `/robots.txt` にアクセスできる
- [ ] 開発環境で `Disallow: /` が設定されている
- [ ] 本番環境で適切なルールが設定されている

### 7.5 パフォーマンス確認

- [ ] Lighthouse SEOスコアが80点以上
- [ ] Lighthouse Performanceスコアが80点以上
- [ ] LCPが3秒以内

**検証方法**:
```bash
# Lighthouse CI
npm run lighthouse

# または Chrome DevToolsで手動検証
# DevTools > Lighthouse > Generate report
```

---

## 8. Google Search Console設定

### 8.1 初期設定

1. [Google Search Console](https://search.google.com/search-console) にアクセス
2. プロパティを追加: `https://stats47.com`
3. 所有権確認（DNSまたはHTMLファイル）
4. サイトマップを送信: `https://stats47.com/sitemap.xml`

### 8.2 モニタリング指標

- **検索パフォーマンス**: クリック数、表示回数、CTR、平均掲載順位
- **カバレッジ**: インデックス登録済みページ数、エラー
- **Core Web Vitals**: LCP、FID、CLS

### 8.3 重要クエリの監視

Phase 1で狙うべき検索クエリ：
- `[指標名] 都道府県 ランキング`
- `都道府県 [指標名] 比較`
- `[都道府県名] [指標名]`

例：
- `人口 都道府県 ランキング`
- `都道府県 人口 比較`
- `東京都 人口`

---

## 9. 関連ドキュメント

### プロジェクト管理
- [Phase 1実装計画](../00_プロジェクト管理/03_実装計画/Phase1.md) - SEOタスクの詳細スケジュール
- [機能要件](../00_プロジェクト管理/02_要件定義/機能要件.md) - SEO関連の機能要件

### 開発ガイド
- [パフォーマンス最適化ガイド](./パフォーマンス最適化.md) - Core Web Vitals最適化
- [コーディング規約](./コーディング規約.md) - メタデータの命名規則

### ドメイン設計
- [ランキングドメイン](../05_ドメイン設計/ランキング/README.md) - ランキングデータ構造
- [カテゴリ管理ドメイン](../05_ドメイン設計/カテゴリ管理/README.md) - カテゴリ・サブカテゴリ管理

---

## 10. トラブルシューティング

### 10.1 よくある問題

#### Q1: サイトマップが生成されない

**原因**: `app/sitemap.ts` の非同期処理でエラーが発生している

**解決策**:
```bash
# ビルドログを確認
npm run build

# サイトマップにアクセスして確認
curl http://localhost:3000/sitemap.xml
```

#### Q2: OGP画像が表示されない

**原因**: 画像URLが相対パスになっている、または画像生成APIがエラー

**解決策**:
```tsx
// 絶対URLを使用
const ogImageUrl = `https://stats47.com/api/og?subcategory=${params.subcategory}`;

// または metadataBase を設定
export const metadata = {
  metadataBase: new URL('https://stats47.com'),
};
```

**検証**:
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)

#### Q3: Lighthouse SEOスコアが低い

**よくある原因**:
- [ ] `<title>` が設定されていない
- [ ] `<meta name="description">` が設定されていない
- [ ] 画像に `alt` 属性がない
- [ ] リンクに説明的なテキストがない
- [ ] `<html lang="ja">` が設定されていない

---

**作成日**: 2024年10月14日
**最終更新日**: 2025年10月20日
**バージョン**: 2.0
