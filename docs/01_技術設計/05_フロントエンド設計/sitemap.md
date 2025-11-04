# サイトマップ生成

## 概要

Next.js 15のApp Router機能を使用して、サイトの全ページをリストアップする`sitemap.xml`を自動生成します。

## 配置

**ファイル**: `src/app/sitemap.ts`

Next.jsの規約により、`app`ディレクトリ直下に配置することで、`/sitemap.xml`として自動的にアクセス可能になります。

## 生成戦略

### ISR（Incremental Static Regeneration）

```typescript
export const revalidate = 86400; // 24時間（秒単位）
```

**動作**:
- **ビルド時**: 初回のサイトマップを生成
- **再検証**: 24時間ごとに自動的に再生成
- **メリット**: パフォーマンスを維持しつつ、最新のコンテンツを反映
- **更新頻度の考慮**: 記事ページは`monthly`、カテゴリ・タグページは`weekly`の更新頻度のため、24時間ごとの再検証で十分

## 含まれるページ

### 1. 静的ページ

| URL | Priority | Change Frequency |
|-----|----------|------------------|
| `/` (トップページ) | 1.0 | daily |
| `/blog` (ブログ一覧) | 0.8 | daily |

### 2. カテゴリページ

- **データソース**: Cloudflare D1データベース
- **関数**: `listCategories()` (`src/features/category/repositories/category-repository.ts:41`)
- **URL形式**: `/blog/{categoryKey}`
- **Priority**: 0.7
- **Change Frequency**: weekly

**例**:
```
/blog/population
/blog/economy
/blog/education
```

### 3. 記事ページ

- **データソース**: MDXファイル（ファイルシステム）
- **関数**: `getAllArticlesAction()` (`src/features/blog/actions/getArticles.ts:70`)
- **URL形式**:
  - 年度付き: `/blog/{category}/{slug}/{time}`
  - 年度なし: `/blog/{category}/{slug}`
- **Priority**: 0.6
- **Change Frequency**: monthly

**例**:
```
/blog/population/total-population/2023
/blog/economy/gdp-ranking
```

### 4. タグページ

- **データソース**: 記事のfrontmatterから抽出
- **URL形式**: `/blog/tags/{tag}`
- **Priority**: 0.5
- **Change Frequency**: weekly

**例**:
```
/blog/tags/人口統計
/blog/tags/経済指標
```

## 実装の詳細

### データ取得フロー

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.example.com";

  // 1. 静的ページを定義
  const staticPages = [...];

  // 2. D1データベースからカテゴリを取得
  const categories = await listCategories();
  const categoryPages = categories.map(...);

  // 3. MDXファイルから記事を取得
  const articles = await getAllArticlesAction();
  const articlePages = articles.map(...);

  // 4. 記事からユニークなタグを抽出
  const uniqueTags = new Set<string>();
  articles.forEach((article) => {
    article.frontmatter.tags?.forEach((tag) => uniqueTags.add(tag));
  });
  const tagPages = Array.from(uniqueTags).map(...);

  // 5. 統合して返却
  return [...staticPages, ...categoryPages, ...articlePages, ...tagPages];
}
```

### ベースURL設定

環境変数 `NEXT_PUBLIC_BASE_URL` を設定してください：

```bash
# .env.local
NEXT_PUBLIC_BASE_URL=https://stats47.example.com
```

## アクセス方法

サイトマップは以下のURLでアクセス可能です：

```
https://your-domain.com/sitemap.xml
```

開発環境:
```
http://localhost:3000/sitemap.xml
```

## SEO設定

### Priority（優先度）

- `1.0`: トップページ（最高）
- `0.8`: ブログ一覧
- `0.7`: カテゴリページ
- `0.6`: 記事ページ
- `0.5`: タグページ

### Change Frequency（更新頻度）

- `daily`: トップページ、ブログ一覧（頻繁に更新）
- `weekly`: カテゴリページ、タグページ（定期的に更新）
- `monthly`: 記事ページ（比較的安定）

## 今後の改善案

### 1. lastModified の追加

現在、記事ページには`lastModified`が設定されていません。以下の改善を検討：

**提案**: 記事のfrontmatterに公開日・更新日を追加

```typescript
// src/features/blog/types/article.types.ts
export interface ArticleFrontmatter {
  title: string;
  description?: string;
  tags: string[];
  publishedAt?: string;  // 追加
  updatedAt?: string;    // 追加
}
```

**サイトマップでの利用**:
```typescript
const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
  url: `${baseUrl}${path}`,
  lastModified: article.frontmatter.updatedAt || article.frontmatter.publishedAt,
  changeFrequency: "monthly",
  priority: 0.6,
}));
```

### 2. 動的ページの対応

将来的に以下のようなページが追加された場合、サイトマップに含める必要があります：

- ランキングページ（`/ranking/...`）
- 統計データ可視化ページ（`/(stats)/...`）

### 3. 画像サイトマップ

記事内の画像をGoogleにインデックスさせるため、画像サイトマップの追加を検討：

```typescript
// 例: src/app/sitemap-images.xml.ts
```

## トラブルシューティング

### サイトマップが更新されない

**原因**: ISRのrevalidate期間が経過していない

**解決策**:
1. ビルドし直す: `npm run build`
2. または24時間（86400秒）待つ

### 404エラーが発生する

**原因**: ファイルの配置場所が間違っている

**確認**:
- ファイルが `src/app/sitemap.ts` に配置されているか
- Route Group（`(public)`など）内に配置されていないか

### カテゴリが表示されない

**原因**: D1データベースに接続できていない

**確認**:
1. データベース接続設定を確認
2. `listCategories()`が正常に動作するか確認

```typescript
// デバッグ用
const categories = await listCategories();
console.log('Categories:', categories);
```

## 関連ドキュメント

- [Next.js Sitemap Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [ブログ機能の設計と実装](./design-and-implementation.md)
- [カテゴリ設計](/docs/01_技術設計/03_ドメイン設計/)

## 参考資料

- [Google Search Central - サイトマップについて](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Next.js ISR Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
