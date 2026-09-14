---
name: mark-sns-posted
description: 投稿済み SNS コンテンツを posts.json に記録しメディアファイルを削除する。Use when user says "投稿済みにする", "mark posted", "SNS投稿完了". テキスト/JSON はリモート R2 に保持.
disable-model-invocation: true
primary_agent: sns-metrics-sync
co_agents: [instagram-strategist, x-strategist]
---

手動投稿後に `sns-posts-store.cjs` 経由で `.claude/state/sns/posts.json` に記録し、メディアファイルを削除する。
記録と同時に `.claude/state/sns/post-log.md` が自動再生成される（視覚確認用）。

> **SQLite / D1 は使わない。** SSOT は `posts.json` のみ (完全DBレス doc12)。

## 引数

```
/mark-sns-posted <contentKey> [--content-type ranking|compare|correlation] [--platforms x,instagram,...] [--url <postUrl>]
```

- `contentKey`（必須）: ランキングキーまたは比較スラッグ（例: `active-job-opening-ratio`）
- `--content-type`（任意）: `ranking`（デフォルト）、`compare`、`correlation`
- `--platforms`（任意）: 投稿済みプラットフォームをカンマ区切りで指定。省略時はディレクトリ構成から自動判定
- `--url`（任意）: 投稿 URL

## X 予約キューの posted 昇格 (post-x-batch 連携)

`/post-x-batch` → `publish-x --from-queue` で予約した X 投稿は `status=scheduled` になる
(X 側が予約時刻に自動投稿する)。**予約時刻を過ぎた scheduled を posted へ昇格**するには:

```bash
node .claude/scripts/sns/promote-scheduled-x.cjs --dry-run   # 昇格対象を確認
node .claude/scripts/sns/promote-scheduled-x.cjs --apply     # scheduled→posted (posted_at=予約日)
```

- X の実投稿 URL (`post_url`) が確認済みの行だけ昇格する。時刻超過だけの行は `HOLD` として保留する。
- 週次運用では先に X 側で実投稿 URL を照合・記録し、その後に実行する。

## 手順

### 1. 対象ディレクトリの確認

contentType に応じたディレクトリを確認する:
- ranking: `.local/r2/sns/ranking/<contentKey>/`
- compare: `.local/r2/sns/compare/<contentKey>/`
- correlation: `.local/r2/sns/correlation/<contentKey>/`

### 2. プラットフォームの特定

`--platforms` が指定されていればそれを使用。未指定の場合はディレクトリ構成から判定:

| ディレクトリ | platform 値 |
|---|---|
| `x/` | `x` |
| `instagram/` | `instagram` |
| `tiktok/` | `tiktok` |
| `note/` | `note` |

### 3. posts.json に記録

`sns-posts-store.cjs` の `insert()` または `updateById()` で記録する。
記録後 `post-log.md` が自動再生成されるので、内容を目視確認すること。

```js
const store = require('.claude/scripts/lib/sns-posts-store.cjs');
const now = new Date().toISOString();

// 既存レコードがなければ新規 INSERT
store.insert({
  platform: '<platform>',       // 'x' | 'instagram' | 'tiktok' | 'note'
  domain: '<contentType>',      // 'ranking' | 'compare' | 'correlation'
  content_key: '<contentKey>',
  caption: '<caption.txt の内容>',  // あれば
  post_url: '<postUrl>',            // --url があれば
  status: 'posted',
  posted_at: now,
});
```

caption は各プラットフォームの `caption.txt` から読み込む:
```
.local/r2/sns/<contentType>/<contentKey>/<platform>/caption.txt
```

### 4. リモート R2 からメディアファイルのみ削除

テキスト・JSON は保持。削除対象: `.mp4`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.webm`

```bash
npx tsx packages/r2-storage/src/scripts/delete-r2-prefix.ts sns/<contentType>/<contentKey>/ --dry-run
npx tsx packages/r2-storage/src/scripts/delete-r2-prefix.ts sns/<contentType>/<contentKey>/ --ext mp4,png,jpg,jpeg,webp,gif,webm
```

### 5. ローカルからメディアファイルのみ削除

```bash
find .local/r2/sns/<contentType>/<contentKey> -type f \
  \( -name "*.mp4" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \
     -o -name "*.webp" -o -name "*.gif" -o -name "*.webm" \) -delete
find .local/r2/sns/<contentType>/<contentKey> -type d -empty -delete
```

### 6. post-log.md で視覚確認

記録後、`.claude/state/sns/post-log.md` の先頭行に今投稿した内容が追加されているか確認する。

```bash
head -20 .claude/state/sns/post-log.md
```

### 7. 結果報告

| 項目 | 内容 |
|---|---|
| posts.json 記録 | 追加したプラットフォーム・content_key・posted_at |
| post-log.md | 先頭行に反映されているか確認結果 |
| リモート R2 | 削除したメディアファイル数 |
| ローカル | 削除したメディアファイル数 |

## 複数 contentKey の一括処理

スペース区切りで複数指定された場合、各 contentKey に対して手順 1〜6 を順に実行する。

## 参照

- SSOT: `.claude/state/sns/posts.json`
- 視覚確認: `.claude/state/sns/post-log.md`（自動生成）
- ストア: `.claude/scripts/lib/sns-posts-store.cjs`
- R2 削除: `packages/r2-storage/src/scripts/delete-r2-prefix.ts`
