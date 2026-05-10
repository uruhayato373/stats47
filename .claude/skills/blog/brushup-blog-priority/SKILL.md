---
name: brushup-blog-priority
description: GSC ページ別データ × D1 の articles テーブルを掛け合わせてブログ改善優先度キューを生成する。Use when user says "ブログ改善優先度", "どの記事を直す", "brushup priority", "/brushup-blog-priority".
---

# /brushup-blog-priority — ブログ改善優先度キュー生成

GSC の impressions × CTR と D1 の article メタデータを掛け合わせて、改善効果が最も高い記事を特定し `brushup-queue.md` に出力する。

## データソース

| データ | 場所 |
|---|---|
| GSC ページ別週次 | `.claude/skills/analytics/gsc-improvement/reference/snapshots/<最新週>/pages.csv` |
| D1 articles テーブル | sqlite MCP（`.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe5...sqlite`） |

## 実行フロー

### Step 1: 最新 GSC ページデータ読み込み

```bash
# 最新週を特定
ls .claude/skills/analytics/gsc-improvement/reference/snapshots/ | sort | tail -1
```

`.claude/skills/analytics/gsc-improvement/reference/snapshots/<最新週>/pages.csv` を Read する。
`/blog/` を含む行のみを抽出し、slug を `https://stats47.jp/blog/` 以降の文字列として取得する。

### Step 2: D1 から記事メタデータ取得

sqlite MCP で以下をクエリ:

```sql
SELECT slug, title, published_at, updated_at
FROM articles
WHERE slug IS NOT NULL
ORDER BY updated_at ASC;
```

### Step 3: スコアリング

以下の指標でスコアを算出:

| 指標 | 計算式 | 意味 |
|---|---|---|
| CTR ギャップ | `全記事平均 CTR - ページ CTR` | 大きいほど「見つかっているが読まれない」 |
| インプレッション | `impressions` 数値そのまま | 大きいほど改善効果が広い |
| スコア | `CTR ギャップ × log10(impressions + 1)` | 両指標の積（log スケール） |

スコア降順でソートし上位 20 本を選定する。

### Step 4: brushup-queue.md 出力

`docs/20_ブログ記事企画/brushup-queue.md` に以下の形式で書き出す:

```markdown
# ブログ改善優先度キュー

生成日: YYYY-MM-DD / GSC 参照週: YYYY-Www

| 優先度 | slug | タイトル | impressions | CTR | 平均比 | スコア |
|---|---|---|---|---|---|---|
| 1 | household-income-tokyo-okinawa | ... | 1,177 | 4.4% | -1.8% | 2.31 |
...
```

## 注意

- GSC データは実測値。D1 の `articles` テーブルの `updated_at` が古い記事はボーナス +0.2 を加算
- `/brushup-blog-article <slug>` で実際の改善を実施する
