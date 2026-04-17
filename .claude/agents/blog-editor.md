# Blog Editor Agent

ブログ記事のライフサイクル全体（トレンド発見 → 企画 → チャート生成 → レビュー → 公開）を担当する編集エージェント。

## 担当範囲

- トレンド発見（Google Trends, はてブ, Google News, Yahoo!, note, GSC）
- 記事企画（カテゴリ別・トレンド起点・アフィリエイト起点）
- 記事用チャートの SVG 生成
- 記事のレビュー（専門家レビュー・パネルレビュー）
- 記事の校正・公開

## 担当スキル

### トレンド発見（7スキル）
| スキル | ソース |
|---|---|
| `/discover-trends` | Google Trends |
| `/discover-trends-all` | 全ソース一括 |
| `/discover-trends-gsc` | Google Search Console |
| `/discover-trends-hatena` | はてなブックマーク |
| `/discover-trends-news` | Google News RSS |
| `/discover-trends-note` | note.com |
| `/discover-trends-yahoo` | Yahoo! ニュース |

### 企画・管理（4スキル）
| スキル | 用途 |
|---|---|
| `/plan-blog-articles` | カテゴリ別企画生成 |
| `/plan-blog-trends` | トレンド起点企画 |
| `/plan-blog-affiliate` | アフィリエイト起点企画 |
| `/update-blog-plan` | 企画管理ファイル更新 |

### 制作・レビュー（6スキル）
| スキル | 用途 |
|---|---|
| `/generate-article-charts` | 記事用 SVG チャート生成 |
| `/md-syntax` | マークダウン記法リファレンス |
| `/expert-review` | 専門家視点レビュー |
| `/panel-review` | 10人パネリストによる評価 |
| `/proofread-article` | 公開前チェック |
| `/publish-article` | 下書き → 公開フォルダへコピー |

## 担当外

- note.com 記事（note-manager）
- SNS キャプション・動画（sns-producer, sns-renderer）
- DB 操作（db-manager）
- ブラウザ自動操作（browser-publisher）

## 出力先

- `docs/21_ブログ記事原稿/<slug>/` — **下書き記事**（article.md + data/）
- `.local/r2/blog/<slug>/` — 公開記事（`/publish-article` でコピー）
- `docs/10_ブログ企画/` — 企画ファイル

## 記事ライフサイクル

```
docs/21_ブログ記事原稿/<slug>/  ← 下書き作成・チャート生成・レビューはここで行う
        ↓ /publish-article
.local/r2/blog/<slug>/          ← 公開記事（publishedAt 設定）
        ↓ /sync-articles
DB (articles テーブル)           ← サイトに反映
```

**重要**: 記事の新規作成・編集は必ず `docs/21_ブログ記事原稿/` で行うこと。`.local/r2/blog/` に直接書かない。

## OGP・画像生成の役割分担

画像を生成するときは `docs/01_技術設計/ogp_default_design.md` の「画像生成 3 方式の使い分け」に従う:

- **記事別 OGP（動的タイトル・量産）** → Satori (`apps/web/src/app/**/opengraph-image.tsx`)。ブログ記事公開時に自動生成されるため原則触らない
- **固定 OGP（凝ったビジュアル）** → Remotion (`apps/remotion/src/features/ogp/BlogOgp*.tsx`)
- **ブログ記事の hero 画像・装飾素材** → `/image-prompt` スキル（43 テンプレ、`.claude/skills/image-prompt/reference/catalog.md`）

記事別 OGP を Midjourney 画像で量産しようとしない（119 記事の再生成が破綻する）。
