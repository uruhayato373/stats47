---
name: mark-sns-posted
description: 投稿済み SNS コンテンツの DB ステータスを posted に更新しメディアファイルを削除する。Use when user says "投稿済みにする", "mark posted", "SNS投稿完了". テキスト/JSON はリモート R2 に保持.
disable-model-invocation: true
---

投稿済み SNS コンテンツを DB に記録し、メディアファイルを削除する。テキスト/JSON はリモート R2 に保持する。

## 概要

手動で各 SNS プラットフォームに投稿した後、`sns_posts` テーブルのステータスを `posted` に更新し、メディアファイル（動画・画像）をローカル・リモート R2 から削除する。**テキスト・JSON ファイルはリモート R2 に保持する**（再生成コスト回避のため）。

## 引数

```
/mark-sns-posted <contentKey> [--content-type ranking|compare|correlation] [--platforms x,instagram,...] [--url <postUrl>]
```

- `contentKey`（必須）: ランキングキーまたは比較スラッグ（例: `active-job-opening-ratio`, `tokyo-vs-osaka`）
- `--content-type`（任意）: `ranking`（デフォルト）、`compare`、`correlation`
- `--platforms`（任意）: 投稿済みプラットフォームをカンマ区切りで指定。省略時はディレクトリ構成から自動判定
- `--url`（任意）: 投稿 URL（プラットフォーム1つの場合）

## 手順

### 1. 対象ディレクトリの確認

contentType に応じたディレクトリを確認する:
- ranking: `.local/r2/sns/ranking/<contentKey>/`
- compare: `.local/r2/sns/compare/<contentKey>/`
- correlation: `.local/r2/sns/correlation/<contentKey>/`

ディレクトリが存在しない場合は、リモート R2 のみに残っている可能性がある。リモートのファイル一覧を `listFromR2WithSize` または dry-run で確認する。

### 2. プラットフォームの特定

`--platforms` が指定されていればそれを使用。未指定の場合はディレクトリ構成から判定:

| ディレクトリ | platform 値 |
|---|---|
| `x/` | `x` |
| `youtube/` | `youtube`（通常動画） |
| `youtube-short/` | `youtube`（ショート動画） |
| `note/` | `note` |

### 3. DB ステータス更新

ローカル D1 に `better-sqlite3` で接続し、`sns_posts` テーブルを更新する。

DB パス: `.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite`

各プラットフォームに対して以下を実行:

```sql
UPDATE sns_posts
SET status = 'posted', posted_at = '<YYYY-MM-DD>', post_url = '<postUrl>'
WHERE platform = '<platform>'
  AND content_key = '<contentKey>'
  AND domain = '<contentType>'
  AND post_type = 'original';
```

- `posted_at` は当日（ISO 8601 日付）
- `post_url` は `--url` が指定されている場合のみ設定
- 該当行が存在しない場合は WARNING を出力（先に `/post-sns-captions` 等でレコードが作成されている前提）

### caption の保存

各プラットフォームの `caption.txt` が存在すれば、その内容を `sns_posts.caption` に保存する。メトリクス収集時のマッチング精度に直結するため、必ず実行すること。

```bash
# 各プラットフォームの caption.txt パス
CAPTION_FILE=".local/r2/sns/<contentType>/<contentKey>/<platform>/caption.txt"
# youtube-short の場合
CAPTION_FILE=".local/r2/sns/<contentType>/<contentKey>/youtube-short/shorts.txt"
```

caption.txt が存在する場合:

```sql
UPDATE sns_posts
SET caption = '<caption.txt の内容>'
WHERE platform = '<platform>'
  AND content_key = '<contentKey>'
  AND domain = '<contentType>'
  AND post_type = 'original'
  AND (caption IS NULL OR caption = '');
```

**注意**: 既に caption が設定済みの場合は上書きしない（`caption IS NULL OR caption = ''` 条件）。

### 4. リモート R2 からメディアファイルのみ削除

**重要**: テキスト・JSON ファイルはリモート R2 に保持する。削除対象はメディアファイル（動画・画像）のみ。

削除対象の拡張子: `.mp4`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.webm`
保持するファイル: `.json`, `.txt`, `.md` 等のテキストファイル

```bash
# まずファイル一覧を確認（dry-run）
npx tsx packages/r2-storage/src/scripts/delete-r2-prefix.ts sns/<contentType>/<contentKey>/ --dry-run

# メディアファイルのみ個別削除（拡張子でフィルタ）
npx tsx packages/r2-storage/src/scripts/delete-r2-prefix.ts sns/<contentType>/<contentKey>/ --ext mp4,png,jpg,jpeg,webp,gif,webm
```

`--ext` オプションが未対応の場合は、ファイル一覧を取得してメディアファイルのみを個別に `wrangler r2 object delete` で削除する:

```bash
# 個別削除の例
wrangler r2 object delete stats47-sns sns/ranking/<contentKey>/instagram/stills/carousel_01.png
wrangler r2 object delete stats47-sns sns/ranking/<contentKey>/youtube/normal.mp4
```

### 5. ローカルからメディアファイルのみ削除

テキスト・JSON はローカルにも残す（`/pull-r2` で復元可能だが、ローカルにもあると便利）。

```bash
# メディアファイルのみ削除
find .local/r2/sns/<contentType>/<contentKey> -type f \( -name "*.mp4" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" -o -name "*.gif" -o -name "*.webm" \) -delete

# 空ディレクトリを削除
find .local/r2/sns/<contentType>/<contentKey> -type d -empty -delete
```

### 6. 結果報告

以下をユーザーに報告する:

| 項目 | 内容 |
|---|---|
| DB 更新 | 更新したプラットフォーム数と一覧 |
| リモート R2 | 削除したメディアファイル数 / 保持したテキストファイル数 |
| ローカル | 削除したメディアファイル数 / 保持したテキストファイル数 |

## 複数 contentKey の一括処理

スペース区切りで複数指定された場合、各 contentKey に対して手順 1〜5 を順に実行する。

```
/mark-sns-posted key1 key2 key3
```

## 参照

- `packages/database/src/schema/sns_posts.ts` — sns_posts テーブル定義
- `packages/r2-storage/src/scripts/delete-r2-prefix.ts` — R2 削除スクリプト
