# Blog Feature

ブログ記事の管理・表示機能。MD/MDX ハイブリッド運用で、D3.js インタラクティブチャートの埋め込みに対応。

## 設計方針

- **MDX-first**: デフォルトフォーマットは MDX。インタラクティブチャートが不要な記事は MD も可
- **Progressive Enhancement**: MD 記事は PNG 画像で情報伝達。MDX 記事は D3.js チャートに昇格
- **フォールバック**: MDX レンダリング失敗時は MD にフォールバック
- **分析コンテンツ**: 複数データを横断した分析・コラム記事を中心に展開（単一ランキング解説は `ranking_ai_content` が担当）

## コンテンツ管理

記事は `.local/r2/blog/` に配置し、`r2:upload` / `r2:download` で R2 と同期する。

```
.local/r2/blog/{slug}/
├── article.mdx       # 記事本体
├── data.json         # 記事固有データ（オプション）
└── images/           # 記事画像
```

### 分類

記事の分類には `tags` フィールド（カンマ区切り）を使用する。旧 `topic` / `article_type` カラムは廃止。

### データ準備

- ランキングデータ: `.local/r2/ranking/prefecture/{key}/{year}/data.json` を参照
- 時系列・複合データ: `@stats47/estat-api` を使って個別スクリプトで生成

## ディレクトリ構成

```
features/blog/
├── components/
│   ├── article-renderer.tsx            # MD/MDX 振り分け
│   ├── md-content.tsx                  # MD レンダラー（AdSense 自動挿入含む）
│   ├── mdx-content.tsx                 # MDX レンダラー
│   ├── mdx-components.ts              # MDX コンポーネントマッピング
│   ├── AffiliateItem.tsx               # インライン アフィリエイトカード UI
│   ├── article-affiliate-sections.tsx  # 記事末尾 関連サービス（タグ自動配置）
│   ├── article-related-books.tsx       # 記事末尾 関連書籍（タグ自動配置）
│   └── charts/                         # D3.js チャートラッパー
├── repositories/
│   └── article-repository.ts   # DB からの記事メタデータ取得
├── services/
│   ├── article-service.ts      # R2/FS からのコンテンツ取得
│   └── mdx-renderer.ts
├── types/
│   ├── article.types.ts        # Article, ArticleFrontmatter (imports from @stats47/types)
│   └── chart-config.types.ts
└── utils/
    └── chart-data-loader.ts    # チャートデータの読み込み
```

## ルーティング

```
/blog                          # 記事一覧（published_at DESC）
/blog/{slug}                   # 記事詳細
```

## DB テーブル: `articles`

```sql
articles (
  slug          TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  tags          TEXT,                    -- カンマ区切り
  file_path     TEXT NOT NULL,
  format        TEXT DEFAULT 'mdx',
  has_charts    INTEGER DEFAULT 0,
  published     INTEGER DEFAULT 0,      -- デフォルト非公開
  published_at  TEXT,                   -- 公開日時
  og_image_type TEXT,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT DEFAULT CURRENT_TIMESTAMP
)
```

## アフィリエイト

### インライン（Frontmatter 方式）

Frontmatter + `:::affiliate` ショートコード方式。

```yaml
affiliate:
  name: "商品名"
  url: "https://..."
  imageUrl: "https://..."
  price: "2,500円"
  description: "紹介文"
```

本文中に `:::affiliate` を配置すると `AffiliateItem` コンポーネントに変換される。AdSense は最初の H2 見出し前に自動挿入。

### 自動配置（タグベース）

記事末尾に 2 つのセクションが自動表示される（`blog/[slug]/page.tsx`）:

1. **バナー広告**（`ArticleAffiliateBanner`）— 記事タグ → `TAG_AFFILIATE_MAP` → DB `affiliate_ads`（ad_type='banner'）で最大 2 件
2. **関連書籍**（`ArticleRelatedBooks`）— 記事タグ → `TAG_AFFILIATE_MAP` → `CATEGORY_BOOKS` で最大 2 冊

マッピング定数は `@/features/ads/constants/` に集約。マッチしない場合は非表示。
全リンクは `TrackedAffiliateLink` で GA4 クリック計測対応。

## 技術スタック

- `next-mdx-remote` — R2 からの動的 MDX 読み込み
- `remark-gfm`, `remark-directive` — Markdown 拡張
- `@stats47/visualization` — D3.js チャート
