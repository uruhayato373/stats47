---
description: 相関分析バッチを実行し、結果をリモート D1 に同期する（ローカルに correlation_analysis を残さない）
argument-hint: [--dry-run] [--limit N]
disable-model-invocation: true
---

相関分析バッチを実行し、結果をリモート D1 に同期する。
ローカル D1 の容量を節約するため、バッチ完了後にローカルの `correlation_analysis` テーブルを DROP + VACUUM する。

## 前提

- ローカル D1 に `ranking_data`, `ranking_items` が存在すること（`/pull-remote-d1` 済み）
- Cloudflare 認証済み（`wrangler login`）
- 環境変数: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_STATIC_DATABASE_ID_PRODUCTION`, `CLOUDFLARE_API_TOKEN`

## 手順

### Phase 1: ローカル correlation_analysis テーブルの準備

`correlation_analysis` テーブルがローカルに存在しない場合、空テーブルを作成する。
存在する場合はそのまま使用する。

> **注意**: CREATE TABLE の定義は `packages/database/src/schema/correlation_analysis.ts` と同期すること。スキーマ変更時は両方を更新する。

```bash
node -e "
const Database = require('better-sqlite3');
const DB_PATH = '$(pwd)/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite';
const db = new Database(DB_PATH);
const exists = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name='correlation_analysis'\").get();
if (!exists) {
  db.exec(\`
    CREATE TABLE correlation_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ranking_key_x TEXT NOT NULL,
      ranking_key_y TEXT NOT NULL,
      year_x TEXT NOT NULL,
      year_y TEXT NOT NULL,
      pearson_r REAL NOT NULL,
      partial_r_population REAL,
      partial_r_area REAL,
      partial_r_aging REAL,
      partial_r_density REAL,
      scatter_data TEXT NOT NULL,
      calculated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX correlation_analysis_ranking_keys_year_unique
      ON correlation_analysis (ranking_key_x, ranking_key_y, year_x, year_y);
    CREATE INDEX idx_correlation_rankingkeys
      ON correlation_analysis (ranking_key_x, ranking_key_y);
    CREATE INDEX idx_correlation_year_x ON correlation_analysis (year_x);
    CREATE INDEX idx_correlation_year_y ON correlation_analysis (year_y);
    CREATE INDEX idx_correlation_rankingkey_x_year
      ON correlation_analysis (ranking_key_x, year_x);
    CREATE INDEX idx_correlation_rankingkey_y_year
      ON correlation_analysis (ranking_key_y, year_y);
  \`);
  console.log('correlation_analysis テーブルを作成しました');
} else {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM correlation_analysis').get();
  console.log('correlation_analysis テーブルは既に存在します（' + count.cnt + ' 行）');
}
db.close();
"
```

### Phase 2: 相関分析バッチの実行

```bash
npm run batch --workspace=packages/correlation
```

引数がある場合:
- `--dry-run`: `npm run batch --workspace=packages/correlation -- --dry-run` で終了（Phase 3-5 はスキップ）
- `--limit N`: `npm run batch --workspace=packages/correlation -- --limit N`

完了メッセージを確認してから次のフェーズへ進む。バッチは 20-30 分かかる（約 8-9 万ペア）。

### Phase 3: リモート D1 への同期

**Phase 2 が成功した場合のみ実行する。**

1. リモートの現在行数を確認:
   ```bash
   cd apps/web && npx wrangler d1 execute stats47_static --remote --env production \
     --command "SELECT COUNT(*) as cnt FROM correlation_analysis;" --json -y
   ```

2. `/sync-remote-d1 --table correlation_analysis` を実行してローカルの結果をリモートに push する。

3. 同期後のリモート行数を確認し、ユーザーに報告する。

### Phase 4: ローカルの correlation_analysis を削除

**Phase 3 が成功した場合のみ実行する。Phase 3 が失敗した場合は絶対に実行しない（データ損失防止）。**

> **注意**: dev server（`npm run dev`）が起動中の場合、VACUUM が失敗する。先に dev server を停止すること。

```bash
node -e "
const Database = require('better-sqlite3');
const DB_PATH = '$(pwd)/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite';
const db = new Database(DB_PATH);
db.exec('DROP TABLE IF EXISTS correlation_analysis');
console.log('correlation_analysis テーブルを DROP しました');
db.exec('VACUUM');
console.log('VACUUM 完了');
db.close();
"
```

### Phase 5: 検証

リモートの行数とローカル DB のサイズを確認し、ユーザーに報告する。

```bash
cd apps/web && npx wrangler d1 execute stats47_static --remote --env production \
  --command "SELECT COUNT(*) as cnt FROM correlation_analysis;" --json -y
```

```bash
ls -lh .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite
```

報告内容:
- リモート行数
- ローカル DB サイズ（VACUUM 後、~1.8GB 想定）

## 注意

- バッチは冪等（upsert）。途中で失敗しても再実行可能
- `--dry-run` の場合は Phase 1 の存在確認 + Phase 2 のドライランのみ実行
- VACUUM は DB サイズの一時的な倍増が必要。ディスク空き容量を確認すること
- `pull-remote-d1` はデフォルトで `correlation_analysis` を除外する（`--no-exclude` で上書き可）
