# @stats47/database

Drizzle ORM と Cloudflare D1 を使用した共通データベースパッケージ。

---

## 設計原則

### Single Source of Truth

**Drizzle スキーマ（TypeScript）がデータベース構造の唯一の信頼できる情報源。**

```
src/schema/*.ts  →  drizzle-kit generate  →  drizzle/*.sql  →  D1/SQLite
     ↑
  ここが正
```

### 禁止事項

| 操作 | 理由 |
|------|------|
| 本番 DB への直接 `ALTER TABLE` | スキーマとの不整合が発生 |
| 手動でのテーブル作成・削除（本番） | マイグレーション履歴と乖離 |
| 環境ごとに異なるスキーマ変更 | 再現性の喪失 |
| `drizzle-kit push` の本番使用 | マイグレーション履歴をバイパス |

---

## データ操作の原則

### 個別変更 vs 一括投入

| やりたいこと | 手段 |
|---|---|
| 数件〜数十件のレコード追加・更新 | **ローカル D1 SQLite を直接操作**（`better-sqlite3` / Node スクリプト） |
| 全テーブル初期化（新規セットアップ） | `npm run seed`（全テーブル一括投入） |

`npm run seed` は全テーブルを対象に実行されるため、個別のレコード追加・更新には使わない。

### データ同期フロー（wrangler ベース）

wrangler CLI と better-sqlite3 を使用して D1 間のデータを同期する。seed スクリプトは使わない。

```
ローカル → リモート: /sync-remote-d1 スキル
リモート → ローカル: /pull-remote-d1 スキル
```

| 方向 | スキル | 方式 |
|---|---|---|
| ローカル → リモート | `/sync-remote-d1` | wrangler export + execute |
| リモート → ローカル | `/pull-remote-d1` | wrangler export + better-sqlite3 |

詳細は各スキルの SKILL.md を参照。

### 直接操作の例

```javascript
// Node.js スクリプトで直接 INSERT
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite');

db.prepare('INSERT INTO articles (slug, title, ...) VALUES (?, ?, ...)').run('my-slug', 'My Title', ...);
db.close();
```

実際の SQLite ファイルパスは `drizzle.config.local.ts` を参照。

---

## スキーマ変更のワークフロー

### 正しい手順

1. `src/schema/*.ts` を編集
2. `npx drizzle-kit generate` でマイグレーション SQL 生成
3. ローカル D1 に適用して確認
4. CI/CD で全環境に適用

### ローカルへの適用

`drizzle-kit push` は対話プロンプトが出るため、カラム削除等の破壊的変更には使えない。以下のいずれかで対応:

- **手動マイグレーション**: `better-sqlite3` で直接 SQL を実行
- **`drizzle-kit generate`**: 対話プロンプトが出る場合は手動で migration SQL を作成

```bash
# マイグレーション生成（対話プロンプトが出る場合あり）
cd packages/database
npx drizzle-kit generate

# Drizzle Studio でデータ確認
npx drizzle-kit studio --config=drizzle.config.local.ts
```

---

## マイグレーション運用ルール

### 禁止: `drizzle/` への手動 SQL ファイル追加

`drizzle/` ディレクトリには **`drizzle-kit generate` が生成したファイルのみ** を置く。

| NG | OK |
|----|----|
| `drizzle/` に手書きの SQL を追加 | `src/schema/*.ts` を編集 → `drizzle-kit generate` |
| ジャーナル外の SQL ファイルを配置 | ローカル DB への直接適用は `better-sqlite3` で |

手動 SQL を `drizzle/` に置くと、ジャーナル（`meta/_journal.json`）との乖離が発生し、マイグレーション履歴が追跡不能になる。

### 対話プロンプトが出る場合の対処

`drizzle-kit generate` がカラム削除・リネーム時に対話プロンプトを出す場合:

1. ローカル D1 には `better-sqlite3` で直接 ALTER TABLE を実行
2. `drizzle-kit generate` を実行してマイグレーション SQL を生成
3. 生成された SQL をリモート D1 に `wrangler d1 execute` で適用

**`drizzle/` に手書き SQL を作成してはならない。**

### 定期リセット: `/reset-migrations` スキル

マイグレーションファイルが **10 本を超えた** 場合、`/reset-migrations` スキルで 1 本に統合する。
蓄積されたマイグレーションは CREATE/DROP の混在やファイル数の肥大化を招く。

リセット条件:
- マイグレーション SQL が 10 本以上
- ジャーナルとファイルの不整合が発生した場合

---

## ディレクトリ構成

```
packages/database/
├── src/
│   ├── schema/              # Drizzle スキーマ定義（★ Single Source of Truth）
│   │   ├── index.ts         # 全スキーマのエクスポート
│   │   ├── categories.ts    # カテゴリ・サブカテゴリ
│   │   ├── ranking_items.ts # ランキング関連
│   │   ├── articles.ts      # ブログ記事
│   │   └── ...
│   ├── core/                # D1 接続・クエリ実行
│   ├── adapters/            # 環境別アダプター
│   ├── utils/               # ユーティリティ
│   ├── types/               # 型定義
│   ├── index.ts             # クライアント安全なエクスポート
│   └── server.ts            # サーバー専用エクスポート
├── scripts/                 # シード・抽出・同期スクリプト
├── drizzle/                 # マイグレーション SQL
├── drizzle.config.ts        # Drizzle 設定（リモート D1）
└── drizzle.config.local.ts  # Drizzle 設定（ローカル SQLite）
```

---

## 使用方法

### インポート

```typescript
// クライアント安全（型定義のみ）
import type { Category, Subcategory } from "@stats47/database";

// サーバー専用（DB 接続、スキーマ）
import { getDrizzle, categories, subcategories } from "@stats47/database/server";

// Zod バリデーション
import { insertRankingItemSchema } from "@stats47/database/server";
```

### クエリ

```typescript
import { getDrizzle, categories } from "@stats47/database/server";
import { eq } from "drizzle-orm";

const db = getDrizzle();
const allCategories = await db.select().from(categories);

await db.insert(categories).values({
  categoryKey: "economy",
  categoryName: "経済",
});

await db
  .update(categories)
  .set({ categoryName: "経済・金融" })
  .where(eq(categories.categoryKey, "economy"));
```

---

## 環境別データベース

| 環境 | D1 Database Name | 接続方法 | 備考 |
|------|-----------------|---------|------|
| Local | `stats47_local_static` | better-sqlite3 | 開発用。自由に破壊・再構築可能 |
| Staging | `stats47_static` | Cloudflare API | **Production と共有** |
| Production | `stats47_static` | Cloudflare API | 本番データ |

> [!WARNING]
> Staging と Production は **同じ Static DB** を参照。どちらの環境で同期しても本番データが更新される。

---

## トラブルシューティング

### マイグレーション生成が失敗する

```bash
# スキーマの構文エラーを確認
npx tsc --noEmit

# drizzle meta のスナップショット整合性を確認
# prevId が自分自身を指していないか等
cat drizzle/meta/*_snapshot.json | grep prevId
```

### ローカル D1 が空 / テーブルが存在しない

`/pull-remote-d1` スキルでリモート D1 からローカルにデータを反映する。

### スキーマと DB の不整合

ローカル開発時はマイグレーション SQL を手動適用:

```javascript
const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('<path-to-sqlite>');
const sql = fs.readFileSync('drizzle/0007_xxx.sql', 'utf8');
sql.split('--> statement-breakpoint').forEach(stmt => {
  if (stmt.trim()) db.exec(stmt.trim());
});
db.close();
```

---

## 関連ドキュメント

- **テーブル定義リファレンス**: [SCHEMA.md](./SCHEMA.md)
- **シードスクリプト**: [scripts/README.md](./scripts/README.md) — seed スクリプトの仕様
