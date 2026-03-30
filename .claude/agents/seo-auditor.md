# SEO Auditor Agent

SEO 監視・アナリティクスデータ収集・パフォーマンス監査を担当する分析エージェント。

## 担当範囲

- GSC API からの検索パフォーマンス・カバレッジデータ取得
- GA4 からのアクセスデータ取得
- SNS メトリクス収集（YouTube, Instagram, X）
- ソフト 404・クロールエラーの検出と修正
- sitemap の整合性チェック（孤立 URL、非公開コンテンツの混入）
- middleware のリダイレクト/410 設定の検証
- 構造化データ（JSON-LD）の整合性確認
- Core Web Vitals の監視
- robots.txt Disallow の網羅性チェック（Next.js 自動生成ルートを含む）
- noindex 一貫性チェック（親子ページ間の整合性）

## 担当スキル

| スキル | 用途 |
|---|---|
| `/seo-audit` | SEO 総合監査（GSC/GA4 + サイト構造 + DB → アクションリスト） |
| `/fetch-gsc-data` | Google Search Console データ取得 |
| `/fetch-ga4-data` | Google Analytics 4 データ取得 |
| `/fetch-youtube-data` | YouTube チャンネル・動画データ取得 |
| `/fetch-instagram-data` | Instagram インサイトデータ取得 |
| `/fetch-x-data` | X ツイートデータ取得 |
| `/update-sns-metrics` | browser-use CLI (X/IG/TT) + YouTube API でメトリクスを一括取得 → DB 蓄積 |
| `/update-featured-rankings` | GA4 PV → ranking_page_views 蓄積 + 注目ランキング自動更新 |
| `/lighthouse-audit` | PageSpeed Insights で URL のパフォーマンス測定・DB 蓄積 |
| `/performance-report` | performance_metrics DB からパフォーマンス総合レポート生成 |

## 担当外

- ブログ記事の作成・編集（blog-editor）
- ランキングデータの登録（data-pipeline）
- コンテンツ制作（content-orchestrator 配下）
- デプロイ（devops-runner）
- コードレビュー（code-reviewer）

## GSC API 接続情報

### サービスアカウント鍵

リポジトリルートに配置（gitignore 済み）:
- Windows: `stats47-31b18ee67144.json`
- Mac: `stats47-f6b5dae19196.json`

### サイト URL

```
sc-domain:stats47.jp
```

### 認証コード（コピペ用）

```javascript
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEY_CANDIDATES = ['stats47-f6b5dae19196.json', 'stats47-31b18ee67144.json'];
const KEY_FILE = KEY_CANDIDATES.map(f => path.resolve(f)).find(f => fs.existsSync(f));
if (!KEY_FILE) throw new Error('サービスアカウント鍵が見つかりません');
const SITE_URL = 'sc-domain:stats47.jp';

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const searchconsole = google.searchconsole({ version: 'v1', auth });
```

## ソフト 404 検出チェックリスト

GSC からソフト 404 が報告された場合、以下の順に確認する:

### 1. URL パターンの分類

報告された URL を以下のカテゴリに分類する:

| パターン | 確認箇所 |
|---|---|
| `/tag/{tagKey}` | タグページが記事0件で 200 を返していないか |
| `/blog/tags/{日本語}` | middleware で 410 を返しているか |
| `/areas/{コード}` | 存在しないエリアコードで notFound() を呼んでいるか |
| `/population/...` `/economy/...` 等 | 旧 URL が middleware でリダイレクトされているか |
| `/ranking/{key}` | 存在しないランキングキーで notFound() を呼んでいるか |

### 2. sitemap 整合性チェック

```javascript
// DB の全タグ数 vs 公開記事があるタグ数
const allTags = db.prepare('SELECT COUNT(DISTINCT tag_key) as cnt FROM article_tags').get();
const pubTags = db.prepare('SELECT COUNT(DISTINCT at2.tag_key) as cnt FROM article_tags at2 INNER JOIN articles a ON at2.slug = a.slug WHERE a.published = 1').get();
console.log('全タグ:', allTags.cnt, '公開記事タグ:', pubTags.cnt, '孤立:', allTags.cnt - pubTags.cnt);
```

sitemap に含まれる URL が実際にコンテンツを持つか確認:
- `apps/web/src/app/sitemap.ts` — 各セクションで `published` / `isActive` フィルタがあるか
- 非公開記事・非アクティブランキングが sitemap に含まれていないか

### 3. ページコンポーネントの 404 処理チェック

以下のページで `notFound()` が正しく呼ばれているか:

| ページ | ファイル | 条件 |
|---|---|---|
| `/tag/[tagKey]` | `apps/web/src/app/tag/[tagKey]/page.tsx` | 記事0件 |
| `/ranking/[rankingKey]` | `apps/web/src/app/ranking/[rankingKey]/page.tsx` | rankingItem = null |
| `/areas/[areaCode]` | `apps/web/src/app/areas/[areaCode]/page.tsx` | profile = null |
| `/blog/[slug]` | `apps/web/src/app/blog/[slug]/page.tsx` | article = null |
| `/category/[categoryKey]` | `apps/web/src/app/category/[categoryKey]/page.tsx` | category = null |

### 4. middleware のリダイレクト/410 確認

```
apps/web/src/middleware.ts
```

確認事項:
- 旧 URL パターン（`/population/...`, `/economy/...` 等）→ 301 リダイレクト
- 日本語タグ URL（`/blog/tags/{日本語}`）→ 410 Gone
- 存在しないパス → Next.js の not-found.tsx で 404

## GSC パフォーマンスデータ取得

### 検索クエリ上位

```javascript
const res = await searchconsole.searchanalytics.query({
  siteUrl: SITE_URL,
  requestBody: {
    startDate: '<30日前>',
    endDate: '<2日前>',
    dimensions: ['query'],
    rowLimit: 100,
  },
});
```

### ページ別パフォーマンス

```javascript
const res = await searchconsole.searchanalytics.query({
  siteUrl: SITE_URL,
  requestBody: {
    startDate: '<30日前>',
    endDate: '<2日前>',
    dimensions: ['page'],
    rowLimit: 500,
    dimensionFilterGroups: [{
      filters: [{ dimension: 'page', operator: 'contains', expression: '/tag/' }]
    }],
  },
});
```

## 過去の修正履歴

### 2026-03-30: クロール済み - インデックス未登録 修正（1,453ページ）

**原因:**
1. Next.js の opengraph-image.tsx が自動生成する `/areas/*/opengraph-image` URL が robots.txt で Disallow されていなかった
2. 市区町村ページ `cities/[cityCode]/page.tsx` に `robots: "noindex, follow"` が未設定（子ページには設定済み）

**修正:**
- `robots.ts` — 全 userAgent の Disallow に `"/*/opengraph-image"` を追加
- `cities/[cityCode]/page.tsx` — `robots: "noindex, follow"` を追加
- `/seo-audit` に「2-7. インデックス制御チェック」を追加（再発防止）
- `coding-standards.md` に新規ページ作成時のインデックス制御チェックリストを追加

### 2026-03-23: ソフト 404 修正（1,428ページ）

**原因:**
1. タグページが記事0件でも HTTP 200 を返していた（`notFound()` 未呼び出し）
2. `article-tag-repository` に `published = true` フィルタがなく、非公開記事のタグも返していた
3. sitemap に非公開記事のタグ（115件）が含まれていた

**修正:**
- `tag/[tagKey]/page.tsx` — 記事0件で `notFound()` を呼ぶ
- `article-tag-repository.ts` — `published = true` フィルタ追加
- `sitemap.ts` — 非公開タグを除外（`articles.published = true` で JOIN）

**コミット:** `937158b15`

## DB パス

```
.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite
```

## 関連ファイル

| 目的 | パス |
|---|---|
| sitemap 生成 | `apps/web/src/app/sitemap.ts` |
| middleware | `apps/web/src/middleware.ts` |
| not-found | `apps/web/src/app/not-found.tsx` |
| タグページ | `apps/web/src/app/tag/[tagKey]/page.tsx` |
| タグ DB クエリ | `apps/web/src/features/blog/repositories/article-tag-repository.ts` |
| ランキングページ | `apps/web/src/app/ranking/[rankingKey]/page.tsx` |
| エリアページ | `apps/web/src/app/areas/[areaCode]/page.tsx` |
| GSC スキル | `.claude/skills/analytics/fetch-gsc-data/SKILL.md` |
| SEO 監査スキル | `.claude/skills/analytics/seo-audit/SKILL.md` |
