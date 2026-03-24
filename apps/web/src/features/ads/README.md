# Affiliate Ads Domain

アフィリエイト広告の配信管理ドメイン。

## 概要

**完全DB管理方式**。`affiliate_ads` テーブルでテキスト広告・バナー広告を一元管理する。
カテゴリマッピング（`CATEGORY_AFFILIATE_MAP` / `TAG_AFFILIATE_MAP`）とテーマカラー（`AFFILIATE_THEME`）は定数として維持。

## ディレクトリ構成

```
features/ads/
├── actions/
│   └── fetch-affiliate-ad.ts     # Server Action（Client Componentから呼び出す）
├── components/
│   ├── AffiliateAdSlot.tsx        # テキスト広告スロット（DB → AdSense フォールバック）
│   ├── AdSenseAdWrapper.tsx       # AdSense 広告ラッパー
│   ├── FurusatoNozeiCard.tsx      # ふるさと納税専用カード
│   └── tracked-affiliate-link.tsx # GA4クリック計測付きリンク（use client）
├── constants/
│   ├── affiliate-category.ts      # カテゴリマッピング・テーマ・型定義
│   ├── furusato-nozei.ts          # ふるさと納税リンク定数
│   └── related-books.ts           # カテゴリ別関連書籍定数
├── repositories/
│   └── affiliate-ad-repository.ts # DB操作（Server Only）
├── services/
│   └── resolve-affiliate-ad.ts    # DB専用の広告解決ロジック
├── types/
│   └── index.ts                   # 型定義
├── index.ts                       # パブリックAPI（Client-safe）
├── server.ts                      # サーバー専用エクスポート
└── README.md
```

## 広告解決フロー

### テキスト広告（ランキングサイドバー）

```
categoryKey
  └─ resolveAffiliateAd()
       └─ DB: affiliate_ads テーブル（ad_type='text'、アクティブ・期間内・優先度順）
       └─ 該当なし → null（AdSense フォールバックは AffiliateAdSlot が処理）
```

### バナー広告（ブログ記事）

```
tags[]
  └─ resolveAffiliateBanners()
       └─ TAG_AFFILIATE_MAP → CATEGORY_AFFILIATE_MAP 逆引き → categoryKey
       └─ DB: affiliate_ads テーブル（ad_type='banner'、優先度順、最大2件）
```

## カテゴリマッピング

### subcategoryKey ベース（ランキングサイドバー）

`CATEGORY_AFFILIATE_MAP` で categoryKey → AffiliateCategory に変換：

| AffiliateCategory | 商材例 | categoryKey 例 |
|---|---|---|
| `labor` | リクルートエージェント | `laborwage` |
| `housing` | 引越し侍 | `construction`, `landweather` |
| `population` | Pairs | `population` |
| `economy` | SBI証券 | `economy` |
| `health` | chocoZAP | `socialsecurity` |
| `energy` | クリクラ | `energy` |
| `tourism` | カーセンサー | `tourism` |
| `furusato` | さとふる | `administrativefinancial` |

### タグベース（ブログ記事）

`TAG_AFFILIATE_MAP` で記事タグ（日本語）→ AffiliateCategory に完全一致変換。
ブログ記事末尾の `ArticleAffiliateBanner` と `ArticleRelatedBooks` で使用。

## GA4 クリック計測

全アフィリエイトリンクは `TrackedAffiliateLink`（`"use client"`）でラップ。
クリック時に GA4 カスタムイベント `affiliate_click` を送信する。

| パラメータ | 説明 | 例 |
|---|---|---|
| `affiliate_category` | AffiliateCategory | `"furusato"` |
| `event_label` | リンクタイトル | `"ふるさと納税を探す"` |
| `link_position` | 配置位置 | `"sidebar"`, `"article-bottom"`, `"related-books"` |

計測関数: `apps/web/src/lib/analytics/events.ts` の `trackAffiliateClick()`

## データベーススキーマ

テーブル名: `affiliate_ads`

| カラム名 | 型 | 説明 |
|---|---|---|
| id | TEXT | 主キー（例: `labor-recruit-agent-banner`） |
| title | TEXT | 広告タイトル |
| html_content | TEXT | リンクURL |
| area_code | TEXT | 地域コード（NULL=全地域） |
| subcategory_key | TEXT | カテゴリキー |
| location_code | TEXT | 配置場所（`sidebar-bottom`, `article-banner` 等） |
| is_active | INTEGER | アクティブフラグ |
| priority | INTEGER | 優先度（高いほど優先） |
| ad_type | TEXT | 広告種別（`text` / `banner`） |
| image_url | TEXT | バナー画像URL（banner のみ） |
| tracking_pixel_url | TEXT | インプレッション計測ピクセルURL（banner のみ） |
| width | INTEGER | バナー幅（banner のみ） |
| height | INTEGER | バナー高さ（banner のみ） |
| start_date | TEXT | 配信開始日（YYYY-MM-DD、NULL=制限なし） |
| end_date | TEXT | 配信終了日（YYYY-MM-DD、NULL=制限なし） |

## 広告の追加・更新

ローカル D1 SQLite を直接操作し、`/sync-remote-d1` でリモートに反映する。

### バナー広告の追加例

```sql
INSERT INTO affiliate_ads (id, title, html_content, subcategory_key, location_code, is_active, priority, ad_type, image_url, tracking_pixel_url, width, height)
VALUES ('economy-new-banner', '新サービス', 'https://px.a8.net/...', 'economy', 'article-banner', 1, 10, 'banner', 'https://www25.a8.net/...', 'https://www18.a8.net/...', 300, 250);
```

### テキスト広告の追加例

```sql
INSERT INTO affiliate_ads (id, title, html_content, subcategory_key, location_code, is_active, priority, ad_type)
VALUES ('labor-recruit-text', 'リクルートエージェント', 'https://px.a8.net/...', 'laborwage', 'sidebar-bottom', 1, 10, 'text');
```

## 注意事項

- アフィリエイトリンクには必ず `rel="noopener noreferrer sponsored"` を付与
- `index.ts` はClient-safeなエクスポートのみ（Server Onlyは `server.ts` から）
- Google AdSenseは `@/lib/google-adsense` に分離済み
