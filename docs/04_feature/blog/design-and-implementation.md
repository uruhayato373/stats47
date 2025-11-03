# MDXブログ機能 設計・実装方針

## 概要

`contents/` ディレクトリ内のMDXファイルから統計記事を表示するブログ機能の設計と実装方針。

## 現状分析

### 既存プロジェクト構成

```
stats47/
├── contents/
│   └── prefecture-rank/
│       └── [slug]/
│           └── [year].mdx    # 例: total-population/2023.mdx
├── src/
│   ├── app/                  # Next.js 15 App Router
│   │   ├── (public)/
│   │   ├── (stats)/
│   │   │   └── [category]/
│   │   ├── admin/
│   │   └── api/
│   ├── features/             # ドメイン駆動設計
│   │   ├── area/
│   │   ├── auth/
│   │   ├── category/
│   │   ├── estat-api/
│   │   ├── ranking/
│   │   └── visualization/
│   └── components/           # Atomic Design
│       ├── atoms/
│       ├── molecules/
│       └── organisms/
```

### 技術スタック

- **フレームワーク**: Next.js 15.5.2 (App Router)
- **言語**: TypeScript 5.9.3
- **データベース**: Cloudflare D1 (SQLite)
- **ストレージ**: Cloudflare R2
- **UI**: shadcn/ui, Tailwind CSS 4
- **状態管理**: Zustand, SWR
- **バリデーション**: Zod 4

### MDXファイル構造

```mdx
---
title: "都道府県別総人口ランキング（2023年度）"
description: "2023年度の最新データに基づく..."
category: "population"
tags: ["総人口", "人口動態", "東京一極集中"]
date: "2025-08-10"
statsDataId: "total-population-2023"
chartSettings: { colorScheme: "blue", type: "sequential" }
---

本文コンテンツ...

<PrefectureRankingMap />
<PrefectureRankingHighlights />
```

**Frontmatter項目**:
- `title`: 記事タイトル
- `description`: 概要（SEO対策）
- `category`: カテゴリキー（既存のcategoryテーブルと連携）
- `tags`: タグ配列
- `date`: 公開日
- `statsDataId`: 統計データID（ranking_itemsと連携）
- `chartSettings`: グラフ表示設定

**カスタムコンポーネント**:
- `<PrefectureRankingMap />`: 都道府県マップ
- `<PrefectureRankingHighlights />`: ハイライト表示
- `<PrefectureRankingRegion />`: 地域別分析
- `<PrefectureStatisticsCard />`: 統計カード
- `<PrefectureRankingTable />`: ランキングテーブル

---

## 設計方針

### 1. アーキテクチャ

#### Feature-Sliced Design (FSD)

既存のドメイン駆動設計に合わせ、`src/features/blog/` 配下に新規ドメインを作成。

```
src/features/blog/
├── types/
│   └── article.types.ts          # 記事型定義
├── repositories/
│   └── article-repository.ts     # MDXファイル読み込み（Server-only）
├── services/
│   └── article-service.ts        # ビジネスロジック
├── components/
│   ├── ArticleList.tsx           # 記事一覧
│   ├── ArticleCard.tsx           # 記事カード
│   ├── ArticleDetail.tsx         # 記事詳細
│   └── MDXContent.tsx            # MDXレンダリング
├── actions/
│   └── getArticles.ts            # Server Actions
└── utils/
    ├── mdx-parser.ts             # MDXパーサー
    └── frontmatter-parser.ts     # Frontmatterパーサー
```

#### レイヤー構造

1. **Repository層** (`repositories/`)
   - 責務: ファイルシステムアクセス、MDX読み込み
   - 純粋関数、Server-only
   - エラーハンドリング

2. **Service層** (`services/`)
   - 責務: ビジネスロジック、データ変換
   - Repository層を呼び出し
   - キャッシュ戦略

3. **Actions層** (`actions/`)
   - 責務: Server Actions、クライアントとの橋渡し
   - "use server" directive
   - Next.js caching (revalidateTag)

4. **Components層** (`components/`)
   - 責務: UI表示、ユーザーインタラクション
   - Server Components / Client Components の使い分け

### 2. MDX処理技術選定

#### 推奨: `next-mdx-remote` (RSC対応)

**理由**:
- Server Components対応（最新版）
- Frontmatterパース機能
- カスタムコンポーネント注入
- 柔軟なプラグイン対応

**代替案**: `@next/mdx`
- シンプルだが柔軟性低い
- ファイルベースルーティング前提

#### 必要なパッケージ

```json
{
  "dependencies": {
    "next-mdx-remote": "^5.0.0",      // MDX処理（RSC対応）
    "gray-matter": "^4.0.3",          // Frontmatterパース
    "remark-gfm": "^4.0.0",           // GitHub Flavored Markdown
    "rehype-highlight": "^7.0.0",      // シンタックスハイライト
    "rehype-slug": "^6.0.0",          // 見出しID生成
    "rehype-autolink-headings": "^7.1.0"  // 見出しリンク
  }
}
```

### 3. URL設計

#### ルーティング構造

```
/blog                           # 記事一覧ページ
/blog/[category]                # カテゴリ別一覧
/blog/[category]/[slug]         # 記事詳細（年度なし）
/blog/[category]/[slug]/[year]  # 記事詳細（年度あり）
/blog/tags/[tag]                # タグ別一覧
```

**例**:
- `/blog` → 全記事一覧
- `/blog/population` → 人口カテゴリ記事一覧
- `/blog/population/total-population/2023` → 2023年総人口記事
- `/blog/tags/東京一極集中` → タグ別一覧

#### App Router実装

```
src/app/(public)/blog/
├── page.tsx                    # 記事一覧
├── [category]/
│   ├── page.tsx                # カテゴリ別一覧
│   └── [slug]/
│       ├── page.tsx            # 最新年度記事（リダイレクト）
│       └── [year]/
│           └── page.tsx        # 年度別記事詳細
└── tags/
    └── [tag]/
        └── page.tsx            # タグ別一覧
```

### 4. データフロー

#### 記事読み込みフロー

```
1. クライアント → /blog/population/total-population/2023 アクセス

2. Server Component (page.tsx)
   ↓
3. Server Action (getArticle)
   ↓
4. Service Layer (getArticleBySlug)
   ↓
5. Repository Layer (readMDXFile)
   ↓ fs.readFile
6. contents/prefecture-rank/total-population/2023.mdx
   ↓
7. Frontmatter + MDX Content
   ↓
8. MDXContent Component (next-mdx-remote)
   ↓
9. レンダリング → クライアント
```

#### キャッシング戦略

**Next.js 15 Data Cache**:
- `generateStaticParams()`: ビルド時に全記事の静的生成
- `revalidatePath()`: 記事更新時の再生成
- ISR (Incremental Static Regeneration): 必要に応じて

**R2 Storage連携** (Phase 3):
- ビルド済みMDX HTMLをR2に保存
- 本番環境でのパフォーマンス向上

### 5. 型定義

```typescript
// src/features/blog/types/article.types.ts

/**
 * 記事のFrontmatterメタデータ
 */
export interface ArticleFrontmatter {
  title: string;
  description: string;
  category: string;
  tags: string[];
  date: string;
  statsDataId?: string;
  chartSettings?: {
    colorScheme?: string;
    type?: "sequential" | "diverging" | "categorical";
    useMinValueForScale?: boolean;
    centerType?: "mean" | "median";
    regionValues?: "sum" | "average";
  };
}

/**
 * 記事データ
 */
export interface Article {
  slug: string;          // ファイル名から生成（例: total-population）
  year?: string;         // 年度（例: 2023）
  frontmatter: ArticleFrontmatter;
  content: string;       // MDXコンテンツ
  excerpt?: string;      // 抜粋（最初の160文字）
  readingTime?: number;  // 読了時間（分）
}

/**
 * 記事一覧のフィルタ条件
 */
export interface ArticleFilter {
  category?: string;
  tags?: string[];
  year?: string;
  limit?: number;
  offset?: number;
}

/**
 * 記事一覧のソート順
 */
export type ArticleSortOrder = "date-desc" | "date-asc" | "title-asc";

/**
 * 記事一覧のレスポンス
 */
export interface ArticleListResponse {
  articles: Article[];
  total: number;
  hasMore: boolean;
}
```

---

## 実装方針

### Phase 1: 基本MDX処理とレンダリング（優先度: 高）

#### タスク

1. **パッケージインストール**
   ```bash
   npm install next-mdx-remote gray-matter remark-gfm rehype-highlight rehype-slug rehype-autolink-headings
   ```

2. **Repository層実装**
   - `readMDXFile(slug, year)`: MDXファイル読み込み
   - `listMDXFiles(category?)`: MDXファイル一覧取得
   - Frontmatterパース
   - エラーハンドリング（ファイル存在チェック）

3. **Service層実装**
   - `getArticleBySlug(category, slug, year)`: 記事取得
   - `listArticles(filter)`: 記事一覧取得
   - 抜粋生成（最初の160文字）
   - 読了時間計算（300語/分）

4. **MDXContent Component**
   - `next-mdx-remote` の `MDXRemote` 使用
   - カスタムコンポーネントのマッピング
   - スタイリング（Tailwind Typography）

5. **カスタムコンポーネント実装**
   - `<PrefectureRankingMap />`: 既存の地図コンポーネント流用
   - `<PrefectureRankingTable />`: 既存のテーブル流用
   - その他: 新規実装

#### 成果物

- `src/features/blog/repositories/article-repository.ts`
- `src/features/blog/services/article-service.ts`
- `src/features/blog/components/MDXContent.tsx`
- `src/features/blog/components/mdx-components/` (カスタムコンポーネント)

#### テスト

```typescript
// src/features/blog/repositories/__tests__/article-repository.test.ts
describe("readMDXFile", () => {
  it("should read MDX file and parse frontmatter", async () => {
    const article = await readMDXFile("total-population", "2023");
    expect(article.frontmatter.title).toBeDefined();
    expect(article.content).toBeDefined();
  });

  it("should throw error for non-existent file", async () => {
    await expect(readMDXFile("non-existent", "2023")).rejects.toThrow();
  });
});
```

### Phase 2: 一覧・詳細ページ実装（優先度: 高）

#### タスク

1. **記事詳細ページ**
   - `/blog/[category]/[slug]/[year]/page.tsx`
   - Server Component
   - `generateStaticParams()` で静的生成
   - メタデータ生成（SEO対策）
   - OGP画像生成（Next.js Image Generation API）

2. **記事一覧ページ**
   - `/blog/page.tsx`
   - カード形式表示
   - ページネーション（10件/ページ）
   - ソート機能（日付降順・昇順・タイトル）

3. **カテゴリ別一覧ページ**
   - `/blog/[category]/page.tsx`
   - 既存のcategoryテーブルと連携
   - カテゴリアイコン表示

4. **UI コンポーネント**
   - `ArticleCard`: 記事カード（サムネイル、タイトル、抜粋、タグ）
   - `ArticleList`: 記事一覧
   - `Pagination`: ページネーション
   - `CategoryBadge`: カテゴリバッジ
   - `TagList`: タグ一覧

#### 成果物

- `src/app/(public)/blog/page.tsx`
- `src/app/(public)/blog/[category]/page.tsx`
- `src/app/(public)/blog/[category]/[slug]/[year]/page.tsx`
- `src/features/blog/components/ArticleCard.tsx`
- `src/features/blog/components/ArticleList.tsx`
- `src/features/blog/components/Pagination.tsx`

#### メタデータ生成例

```typescript
// src/app/(public)/blog/[category]/[slug]/[year]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const article = await getArticleBySlug(
    params.category,
    params.slug,
    params.year
  );

  return {
    title: article.frontmatter.title,
    description: article.frontmatter.description,
    openGraph: {
      title: article.frontmatter.title,
      description: article.frontmatter.description,
      type: "article",
      publishedTime: article.frontmatter.date,
      tags: article.frontmatter.tags,
    },
  };
}
```

### Phase 3: フィルタリング・検索機能（優先度: 中）

#### タスク

1. **タグフィルタリング**
   - `/blog/tags/[tag]/page.tsx`
   - タグ別記事一覧
   - タグクラウド表示

2. **全文検索**
   - Search UI（shadcn/ui Input + Command）
   - クライアントサイド検索（小規模データセット）
   - 将来的にはD1 FTS (Full-Text Search) 検討

3. **年度フィルタ**
   - 年度別記事一覧
   - 年度選択UI（ドロップダウン）

4. **複合フィルタ**
   - カテゴリ + タグ + 年度の組み合わせ
   - URL Query Parameters (`?category=population&tag=東京一極集中`)

#### 成果物

- `src/app/(public)/blog/tags/[tag]/page.tsx`
- `src/features/blog/components/SearchBox.tsx`
- `src/features/blog/components/FilterPanel.tsx`
- `src/features/blog/utils/search.ts`

### Phase 4: パフォーマンス最適化（優先度: 低）

#### タスク

1. **ビルド時最適化**
   - MDX HTMLをR2にキャッシュ
   - 画像最適化（Next.js Image）
   - フォント最適化（next/font）

2. **ランタイム最適化**
   - Code Splitting（Dynamic Import）
   - Lazy Loading（React.lazy）
   - Prefetching（Next.js Link）

3. **SEO最適化**
   - Sitemap生成 (`sitemap.xml`)
   - RSS Feed生成 (`rss.xml`)
   - 構造化データ（JSON-LD）

4. **アクセシビリティ**
   - ARIA属性
   - キーボードナビゲーション
   - スクリーンリーダー対応

#### 成果物

- `src/app/(public)/sitemap.ts`
- `src/app/(public)/rss.xml/route.ts`
- R2キャッシング実装

---

## セキュリティ考慮事項

### 1. XSS対策

- MDXコンテンツは`next-mdx-remote`がサニタイズ
- カスタムコンポーネントでのHTML直接挿入を禁止
- `dangerouslySetInnerHTML` は使用しない

### 2. パストラバーサル対策

```typescript
// ❌ 悪い例
const filePath = path.join(contentsDir, userInput);

// ✅ 良い例
const slug = userInput.replace(/[^a-z0-9-]/g, "");
const filePath = path.join(contentsDir, slug);
```

### 3. DoS対策

- MDXファイルサイズ制限（1MB以下）
- ファイル数制限（1,000件以下）
- レート制限（将来的にCloudflare Rate Limitingで実装）

---

## テスト戦略

### 1. Unit Tests (Vitest)

**優先度: 高**

```typescript
// Repository層
describe("article-repository", () => {
  test("readMDXFile: 正常系");
  test("readMDXFile: ファイル存在しない");
  test("listMDXFiles: カテゴリフィルタ");
});

// Service層
describe("article-service", () => {
  test("getArticleBySlug: 正常系");
  test("listArticles: フィルタリング");
  test("generateExcerpt: 160文字切り捨て");
});

// Utils
describe("frontmatter-parser", () => {
  test("parseFrontmatter: 全フィールド");
  test("parseFrontmatter: 必須フィールドのみ");
});
```

**カバレッジ目標**:
- Repository層: 90%
- Service層: 85%
- Utils: 95%

### 2. Integration Tests

**優先度: 中**

```typescript
// Page Rendering
describe("ArticleDetailPage", () => {
  test("記事詳細が正しく表示される");
  test("カスタムコンポーネントが動作する");
  test("存在しない記事は404");
});

// Server Actions
describe("getArticles", () => {
  test("記事一覧を取得できる");
  test("フィルタリングが動作する");
});
```

### 3. E2E Tests (Playwright)

**優先度: 低**

```typescript
test("記事一覧から詳細へ遷移", async ({ page }) => {
  await page.goto("/blog");
  await page.click("text=総人口ランキング");
  await expect(page).toHaveURL(/\/blog\/population\/total-population\/2023/);
});
```

---

## マイグレーション計画

### 既存データとの連携

#### 1. `categories` テーブル

MDXの`category`フィールドと既存の`categories.category_key`を連携。

```sql
SELECT * FROM categories WHERE category_key = 'population';
```

#### 2. `ranking_items` テーブル

MDXの`statsDataId`と既存の`ranking_items.ranking_key`を連携。

```typescript
const statsData = await getRankingItem(
  article.frontmatter.statsDataId,
  "prefecture"
);
```

#### 3. カスタムコンポーネントでのデータ取得

```tsx
// components/mdx-components/PrefectureRankingMap.tsx
"use client";

export function PrefectureRankingMap() {
  const { statsDataId } = useArticleContext(); // Context経由でstatsDataId取得
  const { data } = useSWR(`/api/ranking/${statsDataId}`, fetcher);

  return <MapComponent data={data} />;
}
```

---

## 運用・保守

### 1. 記事追加フロー

```bash
# 1. MDXファイル作成
contents/prefecture-rank/new-article/2024.mdx

# 2. Frontmatter記入
---
title: "新しい記事"
category: "population"
tags: ["タグ1"]
date: "2025-11-03"
---

# 3. ローカル確認
npm run dev

# 4. Git commit & push
git add contents/
git commit -m "Add new article"
git push

# 5. 自動デプロイ (Cloudflare Pages)
```

### 2. 記事更新フロー

```typescript
// Server Action: revalidateArticle
"use server";

export async function revalidateArticle(slug: string) {
  revalidatePath(`/blog/${slug}`);
}
```

### 3. エラー監視

- Cloudflare Pages Analytics
- Sentry（エラートラッキング）
- ログ収集（Cloudflare Workers Logs）

---

## パフォーマンス目標

### Core Web Vitals

| 指標 | 目標値 |
|------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |

### その他指標

- Time to First Byte (TTFB): < 600ms
- First Contentful Paint (FCP): < 1.8s
- Total Blocking Time (TBT): < 300ms

---

## 今後の拡張性

### Phase 5: 管理画面（将来的）

- `/admin/blog` でMDXファイル管理
- WYSIWYG エディタ（Tiptap, Lexical）
- プレビュー機能
- バージョン管理（Git連携）

### Phase 6: ユーザーインタラクション

- コメント機能（Disqus, Giscus）
- いいね・ブックマーク機能
- SNSシェアボタン
- 関連記事レコメンド

### Phase 7: 多言語対応

- i18n（next-intl）
- MDXファイルの多言語化 (`/contents/en/`, `/contents/ja/`)
- 自動翻訳（DeepL API）

---

## まとめ

本設計書は、Next.js 15 App Router + MDX を活用した統計記事ブログ機能の実装方針を示しました。

**実装の優先順位**:
1. **Phase 1**: MDX処理とレンダリング（2週間）
2. **Phase 2**: 一覧・詳細ページ（2週間）
3. **Phase 3**: フィルタリング・検索（1週間）
4. **Phase 4**: パフォーマンス最適化（継続的）

**キーポイント**:
- 既存のドメイン駆動設計パターンに準拠
- Server Components を最大限活用
- セキュリティとパフォーマンスを重視
- テスト駆動開発（TDD）

この設計に従って実装を進めることで、保守性・拡張性の高いブログ機能を構築できます。
