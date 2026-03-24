各 SNS プラットフォーム API からパフォーマンス指標を取得し、Markdown ファイルに記録する。

## 引数

```
/update-sns-metrics [--platform x|instagram|youtube|all] [--period last7d|last28d]
```

- `--platform`（任意）: 取得対象プラットフォーム（デフォルト: `all`）
- `--period`（任意）: 取得期間（デフォルト: `last28d`）

## 前提

- 各プラットフォームの API 認証情報が `.env.local` に設定済み
- `docs/11_SNS投稿管理/posts/` に投稿 Markdown が存在し、`posted` ステータスの投稿が対象

## 手順

### 1. 投稿済みコンテンツの特定

`docs/11_SNS投稿管理/posts/` 配下の Markdown ファイルを読み込み、各プラットフォームで `posted` ステータスの contentKey と投稿 URL を抽出する。

### 2. API からメトリクス取得

プラットフォーム別に API を呼び出す。取得方法は各 analytics スキルに準拠:

| Platform | スキル参照 | 主要メトリクス |
|---|---|---|
| X | `/fetch-x-data` | impressions, likes, comments(reply), shares(RT), saves(bookmark), quotes |
| Instagram | `/fetch-instagram-data` | impressions, reach, likes, comments, shares, saves, views(plays) |
| YouTube | `/fetch-youtube-data` | views, likes, comments |

各スキルの認証・API 呼び出しコードをインラインで実行する（スキル自体は呼び出さない）。

### 3. Markdown に記録

取得した指標を `docs/11_SNS投稿管理/metrics/` 配下に記録する。

#### ファイル構成

```
docs/11_SNS投稿管理/metrics/
  YYYY-Www.md          # 週次メトリクスサマリー
```

#### 週次サマリー (`YYYY-Www.md`)

```markdown
---
week: "YYYY-Www"
fetchedAt: "YYYY-MM-DD"
---

# SNS メトリクス YYYY-Www

## サマリー

| Platform | impressions | likes | comments | shares | followers |
|---|---|---|---|---|---|
| X | N | N | N | N | N |
| Instagram | N | N | N | N | N |
| YouTube | N | N | N | N | N |

## 投稿別

### X

| contentKey | impressions | likes | RT | replies | bookmarks |
|---|---|---|---|---|---|
| ... | N | N | N | N | N |

### Instagram

| contentKey | impressions | reach | likes | comments | shares | saves |
|---|---|---|---|---|---|---|
| ... | N | N | N | N | N | N |

### YouTube

| contentKey | views | likes | comments |
|---|---|---|---|
| ... | N | N | N |
```

### 4. 投稿 Markdown の更新

各投稿の Markdown ファイル（`docs/11_SNS投稿管理/posts/` 配下）の frontmatter に最新メトリクスを追記する:

```yaml
metrics:
  x:
    impressions: N
    likes: N
    updatedAt: "YYYY-MM-DD"
  instagram:
    impressions: N
    likes: N
    updatedAt: "YYYY-MM-DD"
```

### 5. 結果報告

| 項目 | 内容 |
|---|---|
| 取得件数 | プラットフォーム別の投稿数 |
| 記録先 | 週次サマリーファイルパス |
| エラー | API エラー・スキップした投稿（あれば） |

## 注意事項

- X Basic プランは過去7日間のツイートのみ取得可能。それ以前の投稿は指標更新不可
- Instagram トークンは60日で失効。エラーが出たら `/fetch-instagram-data` の手順でトークン再取得
- YouTube は公開メトリクスのみ（Analytics API は利用不可）
- API レート制限に注意（X: 1,500 req/15min、IG: 200 calls/hour、YT: 10,000 units/day）

## 参照

- `.claude/skills/analytics/fetch-x-data/SKILL.md` — X API 詳細
- `.claude/skills/analytics/fetch-instagram-data/SKILL.md` — Instagram API 詳細
- `.claude/skills/analytics/fetch-youtube-data/SKILL.md` — YouTube API 詳細
- `docs/11_SNS投稿管理/README.md` — SNS 投稿管理の全体設計
