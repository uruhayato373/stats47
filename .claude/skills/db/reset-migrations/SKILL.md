---
name: reset-migrations
description: Drizzle マイグレーションファイルを1本にリセットする。Use when user says "マイグレーションリセット", "reset-migrations", "マイグレーション整理". 10本超 or 不整合時に実行.
disable-model-invocation: true
---

Drizzle マイグレーションが蓄積した際に、現在の Drizzle スキーマから1本のマイグレーションで再構築する。

## 実行条件

- マイグレーション SQL が 10 本以上、またはジャーナルとファイルの不整合が発生した場合
- リモート D1 のスキーマが Drizzle スキーマと一致していること（不一致の場合は先にスキーマを修正）

## 手順

### Phase 1: 現状確認とバックアップ

1. マイグレーションファイル数を確認:
```bash
ls packages/database/drizzle/*.sql | wc -l
```

2. リモート D1 の `d1_migrations` テーブル内容を記録:
```bash
cd apps/web && npx wrangler d1 execute stats47_static --remote --env production \
  --command "SELECT * FROM d1_migrations ORDER BY id;"
```

3. リモート D1 のテーブル一覧を記録（後で比較に使用）:
```bash
cd apps/web && npx wrangler d1 execute stats47_static --remote --env production \
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'd1_%' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name;"
```

### Phase 1.5: スキーマ完全性チェック（必須ゲート）

**このチェックをパスしなければ Phase 2 に進んではならない。スキーマファイルが欠落したままマイグレーションをリセットすると、テーブルが永久に消失する（note_articles 消失事故の教訓）。**

1. リモート D1 のテーブル一覧（Phase 1 Step 3 の結果）と Drizzle スキーマのテーブル名を比較する:

```bash
cd packages/database && node -e "
const fs = require('fs');
const path = require('path');

// index.ts の export 行からスキーマファイルを抽出
const indexContent = fs.readFileSync('src/schema/index.ts', 'utf8');
const exportPaths = [...indexContent.matchAll(/export \* from ['\"]\.\/(.+?)['\"]/g)].map(m => m[1]);

// 各スキーマファイルから sqliteTable() のテーブル名を抽出
const schemaTableNames = new Set();
for (const relPath of exportPaths) {
  const filePath = path.join('src/schema', relPath + '.ts');
  if (!fs.existsSync(filePath)) {
    console.error('BLOCKER: Schema file missing:', filePath);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = [...content.matchAll(/sqliteTable\(\s*['\"](.+?)['\"]/g)];
  matches.forEach(m => schemaTableNames.add(m[1]));
}
console.log('Schema tables:', [...schemaTableNames].sort().join(', '));
console.log('Count:', schemaTableNames.size);
"
```

2. Phase 1 Step 3 で取得したリモートテーブル一覧と照合する:

| チェック | 結果 | アクション |
|---|---|---|
| リモートにあるがスキーマにないテーブル | **BLOCKER** | スキーマファイルが欠落。復元してから再実行 |
| スキーマにあるがリモートにないテーブル | 警告 | 新規テーブル追加予定なら OK。確認して続行 |
| 完全一致 | OK | Phase 2 に進む |

**BLOCKER の場合の復元手順:**
```bash
# 削除されたスキーマファイルを特定
git log --diff-filter=D -- packages/database/src/schema/

# 内容を復元
git show <commit>^:packages/database/src/schema/<file>.ts > packages/database/src/schema/<file>.ts

# index.ts に export を追加
# 再度 Phase 1.5 を実行して完全一致を確認
```

### Phase 2: 旧マイグレーション全削除

```bash
rm packages/database/drizzle/*.sql
rm packages/database/drizzle/meta/0*_snapshot.json
```

`_journal.json` を空にリセット:
```json
{"version": "7", "dialect": "sqlite", "entries": []}
```

### Phase 3: 新マイグレーション生成

```bash
cd packages/database && npx drizzle-kit generate
```

確認事項:
- ファイルが **1 本だけ** 生成されること
- テーブル数がリモート D1 と一致すること（Phase 1 で記録した数と比較）

生成されたファイル名を `$MIGRATION_NAME` として記憶する（例: `0000_faulty_warbird`）。

### Phase 4: DDL 比較検証

生成された SQL のテーブル定義をリモート D1 の実テーブル構造と比較する。

ローカル D1 の DDL を取得して比較:
```javascript
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite');
const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'd1_%' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name").all();
tables.forEach(t => console.log(t.name, ':', t.sql));
db.close();
```

SQLite ファイルのハッシュは `packages/database/drizzle.config.ts` を参照。

**注意**: カラム順序の違いは許容（ALTER TABLE で追加されたカラムは末尾に配置されるため）。テーブル名・カラム名・型・制約が一致していれば OK。

### Phase 5: `d1_migrations` テーブル更新

**ローカル D1:**
```javascript
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite');
db.exec('DELETE FROM d1_migrations');
db.exec("INSERT INTO d1_migrations (name, applied_at) VALUES ('$MIGRATION_NAME.sql', datetime('now'))");
console.log(db.prepare('SELECT * FROM d1_migrations').all());
db.close();
```

**リモート D1:**
```bash
cd apps/web && npx wrangler d1 execute stats47_static --remote --env production \
  --command "DELETE FROM d1_migrations; INSERT INTO d1_migrations (name) VALUES ('$MIGRATION_NAME.sql');"
```

リモート D1 の更新を検証:
```bash
cd apps/web && npx wrangler d1 execute stats47_static --remote --env production \
  --command "SELECT * FROM d1_migrations;"
```

### Phase 6: 適用テスト

```bash
cd apps/web && npx wrangler d1 migrations apply stats47_local_static --local
```

**期待結果**: `✅ No migrations to apply!`

2回目の実行で `table already exists` が出た場合は、wrangler の別インスタンス（`.wrangler/state/`）に初回適用されただけなので問題ない。2回目で `No migrations to apply` になれば OK。

### Phase 7: 型チェック

```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```

## エラー時の対処

| エラー | 対処 |
|--------|------|
| `drizzle-kit generate` が複数ファイル生成 | ジャーナルが空でない。Phase 2 を再確認 |
| テーブル数が不一致 | `src/schema/index.ts` のエクスポート漏れを確認 |
| Phase 1.5 で BLOCKER | スキーマファイルが欠落。`git log --diff-filter=D` で復元してから再実行 |
| リモート D1 接続エラー | ネットワーク・プロキシを確認してリトライ |
| `wrangler d1 migrations apply` が適用しようとする | Phase 5 の `d1_migrations` INSERT が漏れている |

## 過去のインシデント

- **note_articles テーブル消失（2026-03）**: `note_content.ts` が削除された状態で `/reset-migrations` を実行し、`drizzle-kit generate` が `note_articles` と `downloadable_assets` テーブルを含まないマイグレーションを生成。Phase 1.5 はこの再発を防止するために追加された。

## 参照

- `packages/database/README.md` — マイグレーション運用ルール
- `packages/database/drizzle.config.ts` — Drizzle 設定・SQLite パス
