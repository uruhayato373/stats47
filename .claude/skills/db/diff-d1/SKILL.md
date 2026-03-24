---
description: ローカル D1 とリモート D1 のキーベース差分を検知・同期する
argument-hint: [--execute] [--direction pull] [--table <table>]
---

ローカル D1 とリモート D1 のデータ差分をキー単位で検知し、レポート表示または同期を実行する。

大量テーブル（ranking_data, correlation_analysis 等）はキー単位で差分検知し、少量テーブルは行数比較でフル同期する。

## 使い方

### 差分レポート表示（デフォルト、変更なし）

```bash
npm run diff:d1 --workspace=packages/database
```

### push 方向で同期実行（ローカル → リモート）

```bash
npm run diff:d1 --workspace=packages/database -- --execute
```

### pull 方向で同期実行（リモート → ローカル）

```bash
npm run diff:d1 --workspace=packages/database -- --execute --direction pull
```

### 特定テーブルのみ

```bash
npm run diff:d1 --workspace=packages/database -- --table ranking_data
npm run diff:d1 --workspace=packages/database -- --table ranking_data --execute
```

## キーベース差分の対象テーブル

| テーブル | 差分キー | 説明 |
|---|---|---|
| `ranking_data` | `category_code`（= ranking_key） | ランキング単位で差分検知 |
| `ranking_items` | `ranking_key` | ランキング定義の差分 |
| `correlation_analysis` | `ranking_key_x \| ranking_key_y` | キーペア単位 |
| `ranking_ai_content` | `ranking_key \| area_type` | AI コンテンツ単位 |

## 少量テーブル（行数比較 → フル同期）

articles, affiliate_ads, categories, subcategories, data_sources, surveys, ranking_page_cards, ranking_tags, comparison_components, estat_metainfo, estat_stats_tables, area_profile_rankings

## 出力例

```
── キーベース差分 ──

ranking_data:
  共通: 1,100 keys
  ローカルのみ (2 keys):
    + new-ranking-key-1
    + new-ranking-key-2
  リモートのみ (1 key):
    - old-removed-key

── アクション (ローカル → リモート) ──

  INSERT → リモート: ranking_data × 2 keys
  DELETE ← リモート: ranking_data × 1 key
```

## 制限事項

- デフォルトはレポート表示のみ（`--execute` なしでは変更しない）
- 削除を含む同期も `--execute` で自動実行される
- 値レベルの変更（同じキー内のデータ修正）は検知しない。その場合は `/sync-remote-d1 --key <key>` を使うこと
- **スキーマ差分は検知しない**。カラム追加・CHECK 制約変更・新規テーブル追加など、テーブル構造の違いはレポートに出ない。`[SKIP]` 表示のテーブルはローカルに存在しないテーブルを意味するので見逃さないこと

## スキーマ差分の手動確認

`/diff-d1` でデータ差分を確認する際、以下も併せて確認すると安全:

```bash
# ローカルの CREATE TABLE 文を取得
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');
const tables = db.prepare(\"SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'drizzle_%' ORDER BY name\").all();
for (const t of tables) console.log(t.name + ':', t.sql.replace(/\n/g, ' '));
db.close();
"
```

リモート側のテーブル一覧は `wrangler d1 execute --remote --env production` で同様のクエリを実行し、差分を比較する。
