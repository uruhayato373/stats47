# コンテンツ構造定義

## 概要

ブログドメインにおけるコンテンツの構造と管理方法を定義します。MDXファイルの配置、命名規則、ディレクトリ構造を標準化します。

## ディレクトリ構造

```
contents/
└── blog/
    ├── 2024/
    │   ├── 01-population-analysis.mdx
    │   ├── 02-gdp-trends.mdx
    │   └── 03-choropleth-guide.mdx
    ├── 2025/
    │   ├── 01-prefecture-ranking.mdx
    │   └── 02-data-visualization.mdx
    └── draft/
        └── work-in-progress.mdx
```

### ディレクトリ命名規則

- **年度ディレクトリ**: `YYYY`形式（例: `2024`, `2025`）
- **下書きディレクトリ**: `draft`（公開されない記事）
- **シリーズディレクトリ**: `series-{name}`（連載記事用）

## ファイル命名規則

### 基本形式

```
{順序}-{スラッグ}.mdx
```

### 例

```
01-population-analysis.mdx
02-gdp-trends.mdx
03-choropleth-guide.mdx
```

### 命名ガイドライン

1. **順序番号**: 2桁のゼロパディング（01, 02, 03...）
2. **スラッグ**: ハイフン区切りの小文字
3. **拡張子**: `.mdx`固定
4. **文字制限**: ファイル名は50文字以内

## フロントマター仕様

### 必須フィールド

```yaml
---
title: "記事タイトル"                    # 必須: 記事のタイトル
slug: "article-slug"                    # 必須: URLスラッグ
date: "2025-01-15"                      # 必須: 公開日（ISO 8601形式）
description: "記事の説明文"              # 必須: メタディスクリプション
author: "著者名"                        # 必須: 著者名
---
```

### カテゴリ・タグ

```yaml
---
category: "population"                  # 必須: カテゴリ（単一）
tags:                                   # 必須: タグ（複数）
  - 人口統計
  - ランキング
  - 都道府県
---
```

### 可視化設定

```yaml
---
chartSettings:
  colorScheme: "blue"                   # カラースキーム
  type: "sequential"                    # シーケンシャル/ダイバージング
  useMinValueForScale: true             # 最小値でのスケール使用
  centerType: "zero"                    # 中心値のタイプ
---
```

### SEO設定

```yaml
---
seo:
  ogImage: "/images/og/article-slug.png"  # OGP画像
  ogType: "article"                       # OGPタイプ
  keywords:                               # キーワード
    - 人口
    - 統計
    - データ分析
  canonical: "https://stats47.com/blog/article-slug"  # 正規URL
---
```

### オプションフィールド

```yaml
---
draft: false                            # 下書きフラグ（デフォルト: false）
featured: true                          # 注目記事フラグ（デフォルト: false）
series: "都道府県分析シリーズ"          # シリーズ名
seriesOrder: 1                          # シリーズ内順序
relatedArticles:                        # 関連記事スラッグ
  - prefecture-gdp-analysis
  - population-trends-2024
readingTime: 5                          # 読了時間（分）
lastModified: "2025-01-20"              # 最終更新日
---
```

## コンテンツ構造

### MDXファイル構造

```mdx
---
# フロントマター（上記仕様に従う）
---

# 記事タイトル

## 概要

記事の概要を簡潔に説明します。

## セクション1

詳細な内容...

<ChoroplethMap 
  dataKey="population"
  year="2024"
  colorScheme="blue"
/>

## セクション2

<Alert type="info">
重要な注意事項を記載します。
</Alert>

## まとめ

<Callout type="summary">
記事の結論をまとめます。
</Callout>

<LinkCard
  title="関連記事"
  url="/blog/related-article"
  description="関連記事の説明"
/>
```

### 見出し構造

```markdown
# H1: 記事タイトル（1つのみ）
## H2: 主要セクション
### H3: サブセクション
#### H4: 詳細セクション（必要に応じて）
```

## カテゴリ体系

### 主要カテゴリ

| カテゴリ | 説明 | 例 |
|---------|------|-----|
| `population` | 人口統計 | 人口ランキング、人口推移 |
| `economy` | 経済統計 | GDP、所得、産業 |
| `society` | 社会統計 | 教育、医療、福祉 |
| `environment` | 環境統計 | 環境指標、エネルギー |
| `tutorial` | チュートリアル | 可視化方法、データ分析 |
| `news` | ニュース | 統計発表、政策動向 |

### カテゴリ追加手順

1. カテゴリ定義を`src/config/categories.json`に追加
2. アイコンとカラーを設定
3. ドキュメントを更新

## タグ体系

### 基本タグ

- **データタイプ**: `人口`, `GDP`, `所得`, `教育`
- **地域レベル**: `都道府県`, `市区町村`, `全国`
- **分析手法**: `ランキング`, `時系列`, `相関分析`
- **可視化**: `地図`, `グラフ`, `テーブル`

### タグ管理

```typescript
// src/config/tags.json
{
  "population": {
    "name": "人口",
    "color": "blue",
    "description": "人口に関する統計データ"
  },
  "ranking": {
    "name": "ランキング",
    "color": "green",
    "description": "ランキング形式の分析"
  }
}
```

## 画像管理

### 画像配置

```
public/
└── images/
    ├── blog/
    │   ├── 2024/
    │   │   ├── 01-population-analysis/
    │   │   │   ├── hero.jpg
    │   │   │   └── chart-1.png
    │   │   └── 02-gdp-trends/
    │   └── 2025/
    └── og/
        └── article-slug.png
```

### 画像命名規則

- **ヒーロー画像**: `hero.jpg`
- **チャート画像**: `chart-{番号}.png`
- **OGP画像**: `{slug}.png`

### 画像最適化

```typescript
// 画像最適化設定
const imageConfig = {
  formats: ['webp', 'avif', 'jpeg'],
  sizes: [640, 750, 828, 1080, 1200, 1920],
  quality: 80,
};
```

## メタデータ管理

### 記事インデックス

```typescript
// src/data/blog-index.json
{
  "articles": [
    {
      "slug": "population-analysis-2024",
      "title": "都道府県別人口分析2024",
      "date": "2024-12-15",
      "category": "population",
      "tags": ["人口", "ランキング", "都道府県"],
      "featured": true,
      "readingTime": 5
    }
  ]
}
```

### 検索インデックス

```typescript
// FlexSearch用インデックス
const searchIndex = {
  title: "都道府県別人口分析2024",
  content: "記事の全文テキスト",
  tags: ["人口", "ランキング", "都道府県"],
  category: "population"
};
```

## バリデーション

### フロントマター検証

```typescript
const frontmatterSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  date: z.string().datetime(),
  description: z.string().min(1).max(200),
  author: z.string().min(1),
  category: z.enum(['population', 'economy', 'society', 'environment', 'tutorial', 'news']),
  tags: z.array(z.string()).min(1).max(10),
  draft: z.boolean().optional(),
  featured: z.boolean().optional(),
});
```

### コンテンツ検証

```typescript
const validateContent = (content: string) => {
  // 見出し構造の検証
  const headings = content.match(/^#{1,4}\s+.+$/gm);
  if (!headings || headings.length === 0) {
    throw new Error('記事には少なくとも1つの見出しが必要です');
  }
  
  // 画像alt属性の検証
  const images = content.match(/!\[.*?\]\(.*?\)/g);
  images?.forEach(img => {
    if (!img.includes('alt=')) {
      console.warn('画像にalt属性が設定されていません');
    }
  });
};
```

## 移行・バックアップ

### 記事の移行

```bash
# 既存記事のMDX化
npm run migrate:articles

# 画像の最適化
npm run optimize:images

# メタデータの更新
npm run update:metadata
```

### バックアップ戦略

```typescript
// 記事のバックアップ
const backupArticle = async (slug: string) => {
  const article = await getArticle(slug);
  const backup = {
    ...article,
    backedUpAt: new Date().toISOString(),
    version: '1.0'
  };
  
  await saveBackup(backup);
};
```

## 品質管理

### 記事チェックリスト

- [ ] フロントマターが仕様に準拠している
- [ ] 見出し構造が適切である
- [ ] 画像にalt属性が設定されている
- [ ] リンクが有効である
- [ ] 可視化コンポーネントが正しく動作する
- [ ] SEO設定が適切である

### 自動チェック

```typescript
// 記事の自動検証
const validateArticle = async (slug: string) => {
  const article = await getArticle(slug);
  
  // フロントマター検証
  const frontmatterResult = frontmatterSchema.safeParse(article.frontmatter);
  if (!frontmatterResult.success) {
    throw new Error('フロントマターが無効です');
  }
  
  // コンテンツ検証
  validateContent(article.content);
  
  // リンク検証
  await validateLinks(article.content);
};
```
