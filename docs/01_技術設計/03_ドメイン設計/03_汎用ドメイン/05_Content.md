# Content ドメイン

## 概要

Content ドメインは、stats47 プロジェクトの汎用ドメインの一つで、MDX/Markdown ベースのコンテンツ管理システムを担当します。ブログ記事、ドキュメントなどの汎用的なコンテンツ管理と、React コンポーネントの埋め込みに対応します。

## ドメインの責務

- **MDX/Markdown 処理**: ファイルの読み込み、解析、変換
- **フロントマター管理**: メタデータ、SEO 設定の管理
- **コンポーネントマッピング**: React コンポーネントの MDX への注入
- **コンテンツレンダリング**: 静的 HTML 生成、動的レンダリング
- **検索機能**: コンテンツの全文検索（FlexSearch）

## 汎用ドメインとしての特徴

- **データ取得なし**: コアドメインのデータを直接取得しない
- **コンポーネント中立**: どんな React コンポーネントでも表示可能
- **技術的関心事**: MDX 処理、構文解析、レンダリングエンジン
- **再利用性**: stats47 以外のプロジェクトでも利用可能

## ディレクトリ構造

```
src/lib/content/
├── model/
│   ├── Content.ts           # コンテンツエンティティ
│   ├── Frontmatter.ts       # フロントマター VO
│   ├── ContentType.ts       # コンテンツタイプ VO
│   └── Slug.ts              # スラッグ VO
├── service/
│   ├── ContentService.ts    # コンテンツ管理サービス
│   ├── MdxService.ts        # MDX 処理サービス
│   └── SearchService.ts     # 検索サービス
└── repository/
    └── ContentRepository.ts # ファイルシステムアクセス
```

## 主要エンティティ

### Content

コンテンツの集約ルートエンティティ

**プロパティ**:

- `id`: コンテンツ ID
- `slug`: URL 用スラッグ
- `title`: タイトル
- `content`: MDX コンテンツ本体
- `frontmatter`: メタデータ
- `publishedAt`: 公開日時
- `updatedAt`: 更新日時

**ビジネスメソッド**:

- `isPublished()`: 公開済みかチェック
- `getExcerpt(length?: number)`: 要約文を取得
- `getReadingTime()`: 読了時間を計算

### Frontmatter（値オブジェクト）

フロントマター情報を表す値オブジェクト

**プロパティ**:

- `title`: タイトル
- `description`: 説明
- `tags`: タグリスト
- `category`: カテゴリ
- `ogImage`: OGP 画像
- `seoSettings`: SEO 設定

**メソッド**:

- `getMetaDescription()`: メタディスクリプションを取得
- `getOgTags()`: OGP タグを生成
- `hasTag(tag: string)`: 指定タグの存在チェック

### ContentType（値オブジェクト）

コンテンツタイプを表す値オブジェクト

**値**:

- `blog`: ブログ記事
- `documentation`: ドキュメント
- `page`: 静的ページ

**メソッド**:

- `getDisplayName()`: 表示名を取得
- `getDefaultTemplate()`: デフォルトテンプレートを取得

### Slug（値オブジェクト）

URL 用スラッグを表す値オブジェクト

**制約**:

- 英数字、ハイフン、アンダースコアのみ
- 3-50 文字
- 重複不可

**メソッド**:

- `toString()`: 文字列表現
- `equals(other: Slug)`: 等価性チェック

## 主要サービス

### ContentService

コンテンツ管理のメインサービス

**責務**:

- コンテンツの取得・一覧・検索
- MDX レンダリングの管理
- コンテンツのライフサイクル管理

**主要メソッド**:

- `getContent(slug: string): Promise<Content>`
- `listContents(filter?: ContentFilter): Promise<Content[]>`
- `searchContents(query: string): Promise<Content[]>`
- `renderMdx(content: string, components?: ComponentMap): Promise<string>`

### MdxService

MDX 処理を担当するサービス

**責務**:

- MDX ファイルの解析と変換
- フロントマターの抽出
- コンポーネントのコンパイル

**主要メソッド**:

- `parseMdx(source: string): Promise<MdxResult>`
- `extractFrontmatter(source: string): Frontmatter`
- `compileComponents(components: ComponentMap): CompiledComponents`

### SearchService

コンテンツ検索を担当するサービス

**責務**:

- 全文検索インデックスの管理
- 検索クエリの処理
- 検索結果のランキング

**主要メソッド**:

- `buildIndex(contents: Content[]): Promise<void>`
- `search(query: string, options?: SearchOptions): Promise<SearchResult[]>`
- `updateIndex(content: Content): Promise<void>`

## データフローパターン（疎結合設計）

### ✅ 推奨: Feature 層でデータ取得

```typescript
// app/blog/[slug]/page.tsx
export default async function BlogPost({ params }) {
  // 1. コアドメインからデータ取得
  const rankingData = await rankingService.getData("A1101");

  // 2. Content ドメインからコンテンツ取得
  const post = await contentService.getContent(params.slug);

  // 3. データを注入してレンダリング
  return (
    <MdxRenderer
      content={post.content}
      components={{
        RankingChart: (props) => <RankingChart {...props} data={rankingData} />,
      }}
    />
  );
}
```

### ❌ 非推奨: Content ドメイン内でデータ取得

```typescript
// Content ドメインが他ドメインに依存してしまう
export function MdxRenderer({ content }) {
  const data = await rankingService.getData(); // ← これは避ける
  return <MDX components={{ RankingChart: () => <Chart data={data} /> }} />;
}
```

## 技術スタック

- **MDX 処理**: next-mdx-remote, gray-matter
- **変換**: rehype, remark
- **検索**: FlexSearch
- **キャッシュ**: Cloudflare R2（オプション）

## 関連ドメイン

### Feature 層（App Router）

- **関係**: データ取得とコンポーネント注入
- **連携**: Content ドメインにレンダリング用データを渡す

### Analytics/Visualization（コアドメイン）

- **関係**: コンポーネント提供のみ（データ連携なし）
- **連携**: 可視化コンポーネントを MDX に埋め込み可能

### Search（支援ドメイン）

- **関係**: コンテンツ検索機能の提供
- **連携**: 検索インデックスの管理と検索結果の提供

## 設計原則

### 単一責任

- **コンテンツのレンダリングのみに集中**
- データ取得やビジネスロジックは他のドメインに委譲

### 疎結合

- **他ドメインに依存しない**
- インターフェースを通じた最小限の連携のみ

### 汎用性

- **プロジェクト固有のロジックを含まない**
- どんな React コンポーネントでも表示可能

### テスタビリティ

- **モックデータで容易にテスト可能**
- 外部依存のない純粋な関数として設計

## 実装例

### Content エンティティの実装

```typescript
export class Content {
  constructor(
    private readonly id: ContentId,
    private readonly slug: Slug,
    private readonly title: string,
    private readonly content: string,
    private readonly frontmatter: Frontmatter,
    private readonly publishedAt: Date,
    private readonly updatedAt: Date
  ) {}

  isPublished(): boolean {
    return this.publishedAt <= new Date();
  }

  getExcerpt(length: number = 150): string {
    const plainText = this.content.replace(/[#*`]/g, "");
    return plainText.length > length
      ? plainText.substring(0, length) + "..."
      : plainText;
  }

  getReadingTime(): number {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
}
```

### MdxService の実装

```typescript
export class MdxService {
  async parseMdx(source: string): Promise<MdxResult> {
    const { content, data } = matter(source);
    const frontmatter = Frontmatter.create(data);

    return {
      content,
      frontmatter,
      compiledSource: await this.compileMdx(content),
    };
  }

  private async compileMdx(content: string): Promise<string> {
    return await serialize(content, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeHighlight],
      },
    });
  }
}
```

## 将来の拡張性

### 機能拡張

- **多言語対応**: i18n 機能の追加
- **バージョン管理**: コンテンツの履歴管理
- **コメント機能**: ユーザーコメントの統合
- **シリーズ機能**: 連載記事の管理

### 技術的拡張

- **リアルタイム編集**: 協調編集機能
- **AI 支援**: 記事生成支援機能
- **パフォーマンス最適化**: より高速なレンダリング
- **アクセシビリティ**: WCAG 準拠の強化

## 関連ドキュメント

- [DDD ドメイン分類](../01_システム概要/04_DDDドメイン分類.md) - 汎用ドメインの詳細説明
- [システムアーキテクチャ](../01_システム概要/01_システムアーキテクチャ.md) - 全体アーキテクチャ
- [プロジェクト構造](../01_システム概要/02_プロジェクト構造.md) - ディレクトリ構造
