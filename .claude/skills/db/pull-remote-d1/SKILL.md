---
description: リモート D1 のデータをローカル D1 に反映する
disable-model-invocation: true
---

リモート D1（production）のデータをテーブル単位でページネーション付き SELECT → ローカル INSERT で同期する。
`wrangler d1 export` の OOM 問題を回避するため、`wrangler d1 execute --remote --json` でページごとに取得し `better-sqlite3` でローカルに書き込む。

## DB 名の対応

| 用途 | DB 名 | 備考 |
|---|---|---|
| ローカル | `stats47_local_static` | `wrangler.toml` デフォルト設定 |
| リモート（production） | `stats47_static` | `--env production` |

## 使い方

### 比較のみ（dry-run）

```bash
npm run pull:d1 --workspace=packages/database -- --dry-run
```

リモートとローカルの全テーブルの行数を比較表示する。データ変更なし。

### 全テーブル同期

```bash
npm run pull:d1 --workspace=packages/database
```

### 特定テーブルのみ同期

```bash
npm run pull:d1 --workspace=packages/database -- --table ranking_data
npm run pull:d1 --workspace=packages/database -- --table categories
```

### バッチサイズ変更

```bash
npm run pull:d1 --workspace=packages/database -- --batch-size 1000
```

## 同期フロー

1. リモート/ローカルのテーブル一覧 + 行数を取得し比較表示
2. `--dry-run` なら比較表示で終了
3. 各テーブルについて:
   - `PRAGMA foreign_keys = OFF`
   - トランザクション開始
   - ローカルの既存データを DELETE
   - リモートからページネーション付き SELECT → ローカルに INSERT（prepared statement）
   - トランザクション COMMIT
   - 行数一致を検証
4. サマリーレポート表示

## テーブル別バッチサイズ

| テーブル | バッチサイズ | 理由 |
|---|---|---|
| `correlation_analysis` | 500 | scatter_data JSON が巨大 |
| `ranking_ai_content` | 100 | faq/insights 等の JSON が巨大 |
| その他 | 5000 | デフォルト |

`--batch-size` で全テーブル一律のバッチサイズを指定可能。

## 注意事項

- **推奨**: pull 前に `/diff-d1` で差分を確認すると安全。差分検知のみなら変更なしで実行できる
- リモート D1 への操作は wrangler CLI を使用するため、Cloudflare 認証が必要（`wrangler login`）
- 同期はローカルの既存データを DELETE してからリモートデータを INSERT するため、ローカルのみのデータは失われる
- ローカルに存在しないテーブルはスキップされる（警告表示）
- テーブル同期失敗時は ROLLBACK して次テーブルへ続行する

## ⚠ pull 前にスキーマ差分を解消すること

**pull 失敗の最大原因はスキーマ差分**。リモートで別 PC がカラム追加・CHECK 制約変更・テーブル追加していると、pull 時に以下のエラーになる:

| エラー例 | 原因 |
|---|---|
| `table X has no column named Y` | ローカルにカラムがない |
| `CHECK constraint failed` | ローカルの CHECK 制約にリモートの新しい値がない |
| `[SKIP] "X" はローカルに存在しません` | ローカルにテーブル自体がない |

### 修正手順

1. リモートの `CREATE TABLE` 文を取得して差分を特定:
   ```bash
   cd apps/web && npx wrangler d1 execute stats47_static --remote --env production \
     --json --command="SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'drizzle_%'"
   ```
2. ローカルに不足しているカラムは `ALTER TABLE ... ADD COLUMN` で追加
3. CHECK 制約の変更やテーブル再作成が必要な場合は `better-sqlite3` で直接操作（SQLite は ALTER TABLE で制約変更不可のため、テーブル再作成が必要）
4. 新規テーブルは `CREATE TABLE` をローカルに実行してから pull

### 大量テーブル（ranking_data 等）の中断と再開

企業ネットワーク等で途中切断された場合、`--offset` で再開できる:

```bash
npm run pull:d1 --workspace=packages/database -- --table ranking_data --offset 500000
```

ローカルの現在行数を確認してから `--offset` に指定する。
