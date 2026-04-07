---
name: sync-remote-d1
description: ローカル D1 のデータをリモート D1（production）へ同期する。Use when user says "D1同期", "リモート反映", "sync-remote-d1". --key オプションで差分同期対応.
argument-hint: [--key <ranking-key>] [--table <table> --where <条件>]
disable-model-invocation: true
---

ローカル D1 のデータをリモート D1（production）へ同期する。
`wrangler d1 export/execute` を使用し、seed スクリプトは使わない。

> **⚠ 複数 PC で作業している場合**: push 前に必ず `/pull-remote-d1` でローカルを最新化すること。他の PC で更新されたテーブルを古いデータで上書きしてしまうリスクがある。CLAUDE.md の「テーブルオーナーシップ」も参照。

> **💡 推奨**: push 前に `/diff-d1` で差分を確認すると安全。差分検知のみなら変更なしで実行できる。

すべてのコマンドは `apps/web/` ディレクトリで実行する。

## Tier B テーブル（リモートのみ管理 — sync 対象外）

以下のテーブルはパイプラインがリモート D1 に直接書き込む。
ローカルは**空テーブルのみ**存在。このスキルで push しないこと。

| テーブル | 投入スキル |
|---|---|
| `component_data` | `/populate-component-data` |
| `ranking_data` | `/populate-all-rankings` |
| `ranking_ai_content` | `/generate-ai-content` |
| `correlation_analysis` | `/run-correlation-batch` |

フル同期（引数なし）の Step 2 でこれらのテーブルの件数差分が出ても、**リモートの DELETE は行わない**こと。

## 同期モード

| モード | 引数 | 動作 | 用途 |
|---|---|---|---|
| フル同期 | なし | テーブル単位で DELETE + 全件 INSERT | スキーマ変更後・大規模データ入替 |
| キー差分 | `--key <ranking-key>` | 指定キーの ranking_items + ranking_data のみ INSERT | `/register-ranking` 後の反映 |
| テーブル差分 | `--table <table> --where <条件>` | 指定テーブルの条件一致行のみ INSERT | 任意テーブルの部分同期 |

**差分同期は新規追加行のみを INSERT する。** リモートに既存データがある場合は DELETE + INSERT（行単位）を行う。フル同期と比べて大幅に高速。

## DB 名の対応

| 用途 | DB 名 | 備考 |
|---|---|---|
| ローカル | `stats47_local_static` | `wrangler.toml` デフォルト設定 |
| リモート（production） | `stats47_static` | `--env production` |

ローカル操作時は `stats47_local_static`、リモート操作時は `stats47_static` を使うこと。

## 手順

### 0. リモート D1 バックアップ（フル同期時のみ）

**フル同期**（DELETE + 全件 INSERT）の場合のみ、事前にバックアップする。差分同期（`--key` / `--table --where`）は新規行の追加のみでデータを壊すリスクが低いため、バックアップは不要。

```bash
npm run backup:d1 --workspace=packages/database -- --env production
```

- SQL ダンプが R2 の `backups/production/d1_static_<timestamp>.sql` に保存される
- Static DB のみバックアップする場合は `--db static` を追加
- バックアップ完了をユーザーに報告してから次のステップへ進む

### 1. マイグレーション確認（スキーマ同期）

データ投入前にローカル・リモート両方のスキーマが最新か確認する。スキーマ不一致のまま投入すると制約エラーで失敗する。

1. **リモート**:
   ```bash
   npx wrangler d1 migrations apply stats47_static --remote --env production
   ```
2. **ローカル**:
   ```bash
   npx wrangler d1 migrations apply stats47_local_static --local --persist-to ../../.local/d1
   ```
   - ローカル DB にマイグレーション追跡テーブルがない場合、`table already exists` エラーになる。その場合は未適用のマイグレーション SQL を特定し、`sqlite3` で直接適用する
3. 未適用マイグレーションがあった場合はユーザーに報告し、適用の承認を得る
4. マイグレーションが不要（両方最新）なら次のステップへ進む

### 2. 差分テーブルの特定

リモートとローカルの各テーブルの件数を比較し、変更があるテーブルを特定する。

1. ローカルの件数を取得:
   ```bash
   npx wrangler d1 execute stats47_local_static --local --persist-to ../../.local/d1 \
     --command "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'drizzle_%';" --json
   ```
   各テーブルの `SELECT COUNT(*) FROM <table>` を実行

2. リモートの件数を取得:
   ```bash
   npx wrangler d1 execute stats47_static --remote --env production \
     --command "SELECT COUNT(*) as count FROM <table>;" --json -y
   ```

3. **ローカルに存在しないテーブルの取り扱い**: リモートに存在するがローカルにないテーブル（例: `correlation_analysis` が DROP 済みの場合）はフル同期の対象外とする。件数比較に `[SKIP: ローカルなし]` と表示し、**リモートの DELETE は行わない**。ローカルにないテーブルを誤ってリモートから消さないこと
4. 件数が異なるテーブルをリストアップしてユーザーに報告
5. ユーザーに同期対象のテーブルを確認（全テーブル or 差分のみ）

### 3. データ同期（フル同期モード）

引数なし、またはフル同期が必要な場合に使用。

1. 対象テーブルをローカルからエクスポート（後述の「ローカル export の注意点」を参照）
2. リモートの対象テーブルを事前にクリア:
   ```bash
   npx wrangler d1 execute stats47_static --remote --env production \
     --command "DELETE FROM <table_name>;" -y
   ```
3. エクスポートした SQL をリモートに投入:
   ```bash
   npx wrangler d1 execute stats47_static --remote --env production \
     --file /tmp/d1-sync-<table>.sql -y
   ```
4. 投入後の件数を確認し、ローカルと一致するか検証
5. 一時ファイルを削除: `rm /tmp/d1-sync-*.sql`
6. 結果を報告（各テーブルの投入件数・ローカルとの一致確認）

### 3a. データ同期（差分同期モード: `--key`）

`--key <ranking-key>` が指定された場合、該当キーの行だけを同期する。フル同期と比べて大幅に高速。

#### 手順

1. **リモートに既存データがあるか確認**:
   ```bash
   npx wrangler d1 execute stats47_static --remote --env production \
     --command "SELECT COUNT(*) as c FROM ranking_items WHERE ranking_key = '<key>';" --json -y
   npx wrangler d1 execute stats47_static --remote --env production \
     --command "SELECT COUNT(*) as c FROM ranking_data WHERE category_code = '<key>';" --json -y
   ```

2. **既存データがある場合は先に削除**（新規の場合はスキップ）:
   ```bash
   npx wrangler d1 execute stats47_static --remote --env production \
     --command "DELETE FROM ranking_data WHERE category_code = '<key>';" -y
   npx wrangler d1 execute stats47_static --remote --env production \
     --command "DELETE FROM ranking_items WHERE ranking_key = '<key>';" -y
   ```

3. **ローカルから該当行のみエクスポート**:
   ```javascript
   node -e "
   const Database = require('better-sqlite3');
   const fs = require('fs');
   const DB_PATH = '<ローカル DB パス>';
   const db = new Database(DB_PATH);
   const KEY = '<ranking-key>';

   // リモートの MAX(id) を引数で受け取るか、事前に取得しておく
   const REMOTE_MAX_ID = <取得した値>;
   let nextId = REMOTE_MAX_ID + 1;

   const lines = ['PRAGMA foreign_keys=OFF;'];

   // ranking_items
   const item = db.prepare('SELECT * FROM ranking_items WHERE ranking_key = ?').get(KEY);
   if (item) {
     const cols = Object.keys(item);
     const vals = cols.map(c => item[c] === null ? 'NULL' : \"'\" + String(item[c]).replace(/'/g, \"''\") + \"'\");
     lines.push('INSERT INTO ranking_items (' + cols.join(', ') + ') VALUES (' + vals.join(', ') + ');');
   }

   // ranking_data（ID をリモート MAX + 1 からリナンバリング）
   const rows = db.prepare('SELECT * FROM ranking_data WHERE category_code = ?').all(KEY);
   if (rows.length > 0) {
     const dataCols = Object.keys(rows[0]);
     for (const row of rows) {
       row.id = nextId++;
       const vals = dataCols.map(c => row[c] === null ? 'NULL' : \"'\" + String(row[c]).replace(/'/g, \"''\") + \"'\");
       lines.push('INSERT INTO ranking_data (' + dataCols.join(', ') + ') VALUES (' + vals.join(', ') + ');');
     }
   }

   fs.writeFileSync('apps/web/d1-sync-key.sql', lines.join('\\n'));
   console.log('ranking_items: ' + (item ? 1 : 0) + ', ranking_data: ' + rows.length);
   db.close();
   "
   ```

4. **チャンク分割してリモートに投入**（500行/チャンク）:
   - 行数が少ない場合（< 500）はチャンク分割不要
   - 行数が多い場合はファイルを分割して順次実行

5. **検証**:
   ```bash
   npx wrangler d1 execute stats47_static --remote --env production \
     --command "SELECT COUNT(*) as c FROM ranking_data WHERE category_code = '<key>';" --json -y
   ```

6. **一時ファイル削除**: `rm apps/web/d1-sync-key*.sql`

#### ID リナンバリングが必要な理由

ranking_data の `id` カラムに UNIQUE 制約がある。ローカルとリモートで自動採番の ID が異なるため、リモートの `MAX(id) + 1` から連番を振り直す必要がある。

```bash
# リモートの MAX(id) を取得
npx wrangler d1 execute stats47_static --remote --env production \
  --command "SELECT MAX(id) as max_id FROM ranking_data;" --json -y
```

### 3b. データ同期（差分同期モード: `--table --where`）

任意テーブルの部分同期。ranking_data 以外のテーブルでも使える。

1. **エクスポート条件**: `--table <table_name> --where <SQL条件>` で指定
   - 例: `--table blog_articles --where "slug = 'my-article'"`
2. **手順は 3a と同じ**（ただし ranking 固有の処理は不要）
3. **ID 競合がある場合**: リモートの MAX(id) を取得してリナンバリング

## D1 REST API（推奨）

`/diff-d1 --execute` の push 処理は D1 REST API を直接呼ぶ方式に移行済み。wrangler CLI の毎回のプロセス起動オーバーヘッドを排除し、5並列で送信する。

| 方式 | 速度 | 用途 |
|---|---|---|
| D1 REST API（5並列） | ~130,000行/分 | `--execute` による push/fullsync |
| wrangler CLI | ~2,000行/分 | クエリ（diff レポート生成）のみ使用 |

実装: `packages/database/scripts/d1-rest-api.ts`

必要な環境変数: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_STATIC_DATABASE_ID_PRODUCTION`, `CLOUDFLARE_API_TOKEN`

## D1 リモートの制約・ハマりポイント

### PRAGMA defer_foreign_keys=TRUE は効かない

D1 リモートでは `PRAGMA defer_foreign_keys=TRUE` が無視される。FK 制約のあるテーブルへの INSERT が失敗する場合は `PRAGMA foreign_keys=OFF;` をファイル先頭に記述する。

### チャンク分割

REST API でも1リクエストあたりのサイズ制限がある。目安：
- **500 行/チャンク**（ranking_data, ranking_items, area_profile_rankings 等）
- 大きな JSON カラム（scatter_data 等）があっても 500 行で問題なし

### JSON/テキスト値に改行が含まれる場合

改行を含む値をそのまま INSERT 文に書くと、行ベースのチャンク分割で INSERT 文が途中で切れて壊れる。対処法：

```javascript
// 改行を char(10) 連結に変換して1行の INSERT にする
if (s.includes('\n')) {
  const parts = s.split('\n');
  return parts.map(p => "'" + p + "'").join(' || char(10) || ');
}
```

### UNION ALL の項数制限

D1 リモートでは UNION ALL の項が多いと "too many terms in compound SELECT" エラーになる。テーブル件数の一括取得は個別クエリで行う。

## ローカル export の注意点

### `wrangler d1 export --local` は使えない

`wrangler d1 export --local` は `.wrangler/state/v3/d1/` を参照する。
しかし本プロジェクトのローカル D1 は `persist_to` で `.local/d1/` に配置されている。
`export` コマンドには `--persist-to` オプションがないため、**空ファイルが生成される**。

### 正しいエクスポート方法: better-sqlite3 で INSERT SQL を生成

```javascript
// Node.js ワンライナーで実行（リポジトリルートから）
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');

const TABLE = '<table_name>';
const rows = db.prepare('SELECT * FROM ' + TABLE).all();
const cols = Object.keys(rows[0] || {});

const lines = ['PRAGMA foreign_keys=OFF;'];
for (const row of rows) {
  const vals = cols.map(c => row[c] === null ? 'NULL' : \"'\" + String(row[c]).replace(/'/g, \"''\") + \"'\");
  lines.push('INSERT INTO ' + TABLE + ' (' + cols.join(', ') + ') VALUES (' + vals.join(', ') + ');');
}

fs.writeFileSync('/tmp/d1-sync-' + TABLE + '.sql', lines.join('\n'));
console.log('Generated ' + rows.length + ' INSERT statements → /tmp/d1-sync-' + TABLE + '.sql');
db.close();
"
```

複数テーブルを同期する場合は TABLE を変えて繰り返す。

SQLite ファイルパスは `packages/database/drizzle.config.local.ts` の `dbCredentials.url` を参照。

## 注意

- すべてのコマンドは `apps/web/` ディレクトリで実行する（`wrangler.toml` の DB バインディング定義がここにある）
- リモート D1 への操作は wrangler CLI を使用するため、Cloudflare 認証が必要
- 大きなテーブルはチャンク分割が必要（上記「D1 リモートの制約・ハマりポイント」を参照）
