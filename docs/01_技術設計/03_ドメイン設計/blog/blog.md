---
title: Blog（ブログ）ドメイン完全ガイド
created: 2025-10-26
updated: 2025-01-26
status: published
tags:
  - stats47
  - domain/blog
  - complete-guide
author: 開発チーム
version: 3.0.0
---

# Blog（ブログ）ドメイン完全ガイド

## 目次

1. [概要・責任](#概要責任)
2. [MDX アーキテクチャ](#mdx-アーキテクチャ)
3. [コンテンツ構造](#コンテンツ構造)
4. [フロントマタースキーマ](#フロントマタースキーマ)
5. [コンポーネント統合](#コンポーネント統合)
6. [SEO 戦略](#seo-戦略)
7. [エンゲージメント機能](#エンゲージメント機能)
8. [コメントシステム](#コメントシステム)
9. [トラブルシューティング](#トラブルシューティング)

---

# 概要・責任

## ドメインの責任

ブログ（Blog）ドメインは、Stats47 プロジェクトにおける MDX ベースのブログ機能を管理します。統計データの可視化を含むコンテンツを提供し、データドリブンな分析記事を公開します。

### 主な責任

1. **MDX コンテンツ管理**: Markdown + JSX の組み合わせで記事作成
2. **可視化コンポーネント統合**: D3.js/Recharts のチャートを統合
3. **データ連携**: 統計データ API との連携
4. **SEO・パフォーマンス**: 静的生成、構造化データ、キャッシュ戦略
5. **エンゲージメント機能**: コメント、関連記事、いいねなど

### 主要機能

1. **MDX コンテンツ管理**

   - MDX ファイルでの記事作成
   - フロントマターによるメタデータ管理
   - コンポーネント埋め込み

2. **可視化コンポーネント**

   - D3.js コンポーネント（コロプレス地図、棒グラフ）
   - Recharts コンポーネント（インタラクティブなチャート）
   - カスタムコンポーネント（Alert、Callout）

3. **データ連携**
   - 統計データの統合（R2 ハイブリッド）
   - ランキングデータの表示
   - 時系列データの可視化

## 技術スタック

- **MDX 処理**: `next-mdx-remote`, `gray-matter`
- **変換プラグイン**: `rehype`, `remark`
- **シンタックスハイライト**: `shiki`
- **可視化**: `D3.js`, `Recharts`
- **SEO**: `next-seo`, 構造化データ

---

# MDX アーキテクチャ

## 技術スタック

### コアライブラリ

1. **next-mdx-remote**

   - MDX ファイルのリモートレンダリング
   - サーバーサイドでの MDX 処理
   - カスタムコンポーネントのマッピング

2. **gray-matter**

   - フロントマターの解析
   - YAML 形式のメタデータ抽出
   - コンテンツとメタデータの分離

3. **rehype/remark**

   - MDX 変換プラグイン
   - シンタックスハイライト
   - リンクの最適化

4. **shiki**
   - コードブロックのシンタックスハイライト
   - テーマ対応（ライト/ダークモード）
   - 多言語対応

## レンダリングフロー

```
MDXファイル
    ↓
gray-matter解析
    ↓
フロントマター抽出 + コンテンツ抽出
    ↓
next-mdx-remote処理
    ↓
MDX→React変換
    ↓
コンポーネントマッピング
    ↓
Reactコンポーネント
    ↓
レンダリング
```

## 実装例

```typescript
// src/app/blog/[slug]/page.tsx
import { serialize } from "next-mdx-remote/serialize";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote";
import fs from "fs";
import path from "path";

export async function generateStaticParams() {
  const files = fs.readdirSync(path.join(process.cwd(), "contents/blog"));
  return files.map((file) => ({
    slug: file.replace(/\.mdx?$/, ""),
  }));
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const filePath = path.join(process.cwd(), `contents/blog/${params.slug}.mdx`);
  const source = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(source);

  const mdxSource = await serialize(content, {
    parseFrontmatter: true,
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
  });

  return (
    <article>
      <h1>{data.title}</h1>
      <MDXRemote {...mdxSource} />
    </article>
  );
}
```

---

# コンテンツ構造

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

## ディレクトリ命名規則

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

## フロントマター形式

```yaml
---
title: "都道府県別人口ランキング2024"
slug: "01-population-analysis"
date: "2024-12-01"
author: "統計チーム"
category: "population"
tags: ["人口", "ランキング", "都道府県"]
excerpt: "2024年の都道府県別人口ランキングを可視化"
seo:
  description: "日本47都道府県の人口統計データを可視化したランキング"
  keywords: ["人口ランキング", "都道府県", "統計データ"]
---
```

---

# フロントマタースキーマ

## 基本スキーマ

```typescript
// src/types/blog.ts
import { z } from "zod";

const CategorySchema = z.enum([
  "population", // 人口統計
  "economy", // 経済統計
  "society", // 社会統計
  "environment", // 環境統計
  "tutorial", // チュートリアル
  "news", // ニュース
]);

const PostFrontmatterSchema = z.object({
  title: z.string(),
  slug: z.string(),
  date: z.string(),
  author: z.string(),
  category: CategorySchema,
  tags: z.array(z.string()).max(10),
  excerpt: z.string().max(200),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  seo: z
    .object({
      description: z.string().max(160),
      keywords: z.array(z.string()),
      ogImage: z.string().url().optional(),
    })
    .optional(),
});
```

## 型定義

```typescript
export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;
export type Category = z.infer<typeof CategorySchema>;
```

## 必須フィールド

| フィールド | 型         | 説明                  |
| ---------- | ---------- | --------------------- |
| `title`    | `string`   | 記事タイトル          |
| `slug`     | `string`   | URL スラッグ          |
| `date`     | `string`   | 公開日                |
| `author`   | `string`   | 著者名                |
| `category` | `Category` | カテゴリ              |
| `excerpt`  | `string`   | 抜粋文（最大 200 字） |

## オプションフィールド

| フィールド   | 型         | 説明            |
| ------------ | ---------- | --------------- |
| `tags`       | `string[]` | タグ（最大 10） |
| `published`  | `boolean`  | 公開状態        |
| `featured`   | `boolean`  | 注目記事        |
| `seo`        | `object`   | SEO 設定        |
| `coverImage` | `string`   | カバー画像      |

---

# コンポーネント統合

## コンポーネント分類

### 1. 基本 HTML コンポーネント

```typescript
// src/components/blog/MDXComponents.tsx
export const mdxComponents: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold mt-8 mb-4">{children}</h1>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-gray-700 dark:text-gray-300">{children}</p>
  ),
  code: ({ children }) => (
    <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
      {children}
    </code>
  ),
};
```

### 2. カスタム MDX コンポーネント

```typescript
// src/components/blog/mdx/Alert.tsx
export function Alert({ variant, children }: AlertProps) {
  return (
    <div className={`p-4 rounded-lg ${variant === "info" ? "bg-blue-50" : ""}`}>
      {children}
    </div>
  );
}
```

### 3. 可視化コンポーネント

```typescript
// D3.js コロプレス地図
<ChoroplethMap
  data={populationData}
  colorScheme="blue"
  height={600}
/>

// Recharts チャート
<LineChart data={timeSeriesData}>
  <Line dataKey="value" stroke="#8884d8" />
</LineChart>
```

## コンポーネントマッピング

```typescript
export const mdxComponents = {
  // HTMLタグ
  h1,
  h2,
  h3,
  h4,
  p,
  a,
  ul,
  ol,
  li,
  code,
  pre,

  // カスタムコンポーネント
  Alert,
  Callout,
  LinkCard,
  CodeBlock,

  // 可視化コンポーネント
  ChoroplethMap,
  BarChart,
  LineChart,
  PrefectureRankingMap,
};
```

---

# SEO 戦略

## SEO 目標

1. **検索順位向上**: 統計・データ分析関連キーワードで上位表示
2. **オーガニックトラフィック増加**: 月間 PV 50%向上
3. **ユーザーエンゲージメント向上**: 滞在時間・直帰率改善
4. **ブランド認知度向上**: 統計データ分析の専門サイトとしての地位確立

## ターゲットキーワード

### プライマリキーワード

- 都道府県別ランキング
- 人口統計
- データ可視化
- 統計分析
- 地域格差

### セカンダリキーワード

- 都道府県別 GDP
- 人口推移
- コロプレス地図
- 統計データ
- データ分析手法

## 技術的 SEO

### メタデータ最適化

```typescript
// タイトルタグ
<title>{post.title} | Stats47</title>

// メタディスクリプション
<meta name="description" content={post.excerpt} />

// OG タグ
<meta property="og:title" content={post.title} />
<meta property="og:description" content={post.excerpt} />
<meta property="og:image" content={post.ogImage} />
<meta property="og:type" content="article" />
```

### 構造化データ

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "都道府県別人口ランキング2024",
  "author": {
    "@type": "Organization",
    "name": "Stats47"
  },
  "datePublished": "2024-12-01",
  "description": "47都道府県の人口統計データを可視化"
}
```

---

# エンゲージメント機能

## 関連記事表示

### タグ/カテゴリベースの関連記事

```typescript
export function getRelatedPosts(currentPost: Post, allPosts: Post[]): Post[] {
  return allPosts
    .filter((post) => {
      // 同じカテゴリまたはタグが一致する記事
      const categoryMatch = post.category === currentPost.category;
      const tagMatch = post.tags.some((tag) => currentPost.tags.includes(tag));

      return post.slug !== currentPost.slug && (categoryMatch || tagMatch);
    })
    .slice(0, 3);
}
```

### 関連記事コンポーネント

```typescript
export function RelatedPosts({ currentPost }: RelatedPostsProps) {
  const allPosts = getAllPosts();
  const relatedPosts = getRelatedPosts(currentPost, allPosts);

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-4">関連記事</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {relatedPosts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
```

## 人気記事表示

```typescript
export function getPopularPosts(allPosts: Post[]): Post[] {
  return allPosts
    .filter((post) => post.viewCount)
    .sort((a, b) => b.viewCount! - a.viewCount!)
    .slice(0, 5);
}
```

---

# コメントシステム

## Disqus 実装

```typescript
// components/comments/DisqusComments.tsx
import { DiscussionEmbed } from "disqus-react";

export function DisqusComments({
  postId,
  postTitle,
  postUrl,
}: DisqusCommentsProps) {
  const disqusConfig = {
    url: postUrl,
    identifier: postId,
    title: postTitle,
  };

  return (
    <div className="mt-10">
      <DiscussionEmbed shortname="stats47" config={disqusConfig} />
    </div>
  );
}
```

## Giscus 実装（GitHub Discussions）

```typescript
export function GiscusComments({ term }: GiscusCommentsProps) {
  return (
    <div
      className="giscus mt-10"
      dangerouslySetInnerHTML={{
        __html: `
          <script
            src="https://giscus.app/client.js"
            data-repo="your-org/stats47"
            data-repo-id="YOUR_REPO_ID"
            data-category="Announcements"
            data-category-id="YOUR_CATEGORY_ID"
            data-mapping="pathname"
            data-term="${term}"
            data-reactions-enabled="1"
            data-emit-metadata="0"
            data-input-position="bottom"
            data-theme="preferred_color_scheme"
            data-lang="ja"
            crossorigin="anonymous"
            async
          >
          </script>
        `,
      }}
    />
  );
}
```

---

# トラブルシューティング

## よくある問題

### 1. MDX がレンダリングされない

**原因**: コンポーネントマッピングの設定ミス

**解決策**:

```typescript
// 正しいコンポーネントマッピング
<MDXRemote {...mdxSource} components={mdxComponents} />
```

### 2. シンタックスハイライトが適用されない

**原因**: `rehype` プラグインの設定ミス

**解決策**:

```typescript
const mdxSource = await serialize(content, {
  mdxOptions: {
    rehypePlugins: [
      [rehypeHighlight, { languages: ["typescript", "javascript"] }],
    ],
  },
});
```

### 3. 画像が表示されない

**原因**: 画像パスの設定ミス

**解決策**:

```typescript
export function Image({ src, alt }: ImageProps) {
  return <img src={`/images${src}`} alt={alt} />;
}
```

### 4. フロントマターが読み込めない

**原因**: `gray-matter` の設定ミス

**解決策**:

```typescript
const { content, data } = matter(source, {
  engines: {
    yaml: (s) => yaml.safeLoad(s, { schema: yaml.FAILSAFE_SCHEMA }),
  },
});
```

## パフォーマンス最適化

### 1. 静的生成の活用

```typescript
export async function generateStaticParams() {
  const files = fs.readdirSync(path.join(process.cwd(), "contents/blog"));

  return files.map((file) => ({
    slug: file.replace(/\.mdx?$/, ""),
  }));
}
```

### 2. 画像最適化

```typescript
import Image from "next/image";

<Image
  src="/images/cover.jpg"
  alt="Cover Image"
  width={800}
  height={400}
  priority
/>;
```

## 参考資料

- [next-mdx-remote Documentation](https://github.com/hashicorp/next-mdx-remote)
- [MDX Documentation](https://mdxjs.com/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
