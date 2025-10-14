# estat_metainfo 重複データ問題 - 原因分析と解決策

## 概要

**問題**: D1データベースの `estat_metainfo` テーブルに、同じ `stats_data_id` と `cat01` の組み合わせが重複して登録されている。

**影響範囲**:
- データベース容量の無駄な消費
- 検索結果の重複表示
- データ整合性の問題

**最終更新**: 2025-01-13

---

## 目次

1. [根本原因](#根本原因)
2. [問題の詳細分析](#問題の詳細分析)
3. [現在のコードの問題点](#現在のコードの問題点)
4. [解決策](#解決策)
5. [実装手順](#実装手順)
6. [テスト方法](#テスト方法)
7. [予防策](#予防策)

---

## 根本原因

### 問題1: UNIQUE制約の欠如

**現在のテーブル定義** (`database/schemas/main.sql`):
```sql
CREATE TABLE IF NOT EXISTS estat_metainfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,           -- 統計表ID
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  cat01 TEXT,                            -- カテゴリコード
  item_name TEXT,
  unit TEXT,
  ranking_key TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**問題点**:
- ✅ 主キー `id` は存在（AUTOINCREMENT）
- ❌ **`(stats_data_id, cat01)` の組み合わせに対するUNIQUE制約が存在しない**

**結果**:
同じ `stats_data_id` と `cat01` の組み合わせが何度でも登録可能になっている。

### 問題2: INSERT OR REPLACE の誤用

**現在の保存ロジック** (`src/lib/estat/metainfo/EstatMetaInfoService.ts:590`):
```sql
INSERT OR REPLACE INTO estat_metainfo
(stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at)
VALUES (...)
```

**`INSERT OR REPLACE` の動作**:
1. まず、**PRIMARY KEY または UNIQUE制約**に一致するレコードを探す
2. 一致するレコードがあれば、それを削除して新しいレコードを挿入
3. 一致するレコードがなければ、新規挿入

**実際の動作**:
```
1回目の保存:
  - PRIMARY KEY (id) に一致なし → 新規挿入 (id=1)
  - stats_data_id="0000010102", cat01="B1101"

2回目の保存（同じデータ）:
  - PRIMARY KEY (id) に一致なし → 新規挿入 (id=2) ❌
  - stats_data_id="0000010102", cat01="B1101" （重複）

理由: (stats_data_id, cat01) にUNIQUE制約がないため、
      主キー (id) のみで判定され、毎回新しいidが生成される
```

### 問題の発生フロー

```
┌─────────────────────────────────────────────────────────────┐
│ ユーザー: 統計表ID "0000010102" を保存                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ EstatMetaInfoService.processAndSaveMetaInfo()               │
│ 1. e-Stat APIから取得                                        │
│ 2. transformToCSVFormat() で変換                            │
│    → 100件のカテゴリ（cat01）を抽出                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ EstatMetaInfoService.processBatch()                         │
│ INSERT OR REPLACE INTO estat_metainfo (...) VALUES (...)   │
│                                                             │
│ ✅ 1回目: 100件が新規挿入 (id: 1-100)                        │
│ ❌ 2回目: さらに100件が新規挿入 (id: 101-200) ← 重複！       │
│                                                             │
│ 理由: (stats_data_id, cat01) にUNIQUE制約がないため、       │
│       主キー (id) のみで重複判定 → 毎回新規挿入             │
└─────────────────────────────────────────────────────────────┘
```

---

## 問題の詳細分析

### 影響を受けるファイル

#### 1. データベーススキーマ
**ファイル**: `database/schemas/main.sql:20-31`
```sql
CREATE TABLE IF NOT EXISTS estat_metainfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  cat01 TEXT,              -- ← UNIQUE制約なし
  item_name TEXT,
  unit TEXT,
  ranking_key TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. データ保存ロジック
**ファイル**: `src/lib/estat/metainfo/EstatMetaInfoService.ts:557-607`
```typescript
private async processBatch(
  dataList: TransformedMetadataEntry[]
): Promise<void> {
  // ...省略...

  const query = `
    INSERT OR REPLACE INTO estat_metainfo
    (stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at)
    VALUES ${values.join(",")}
  `;

  await this.db.prepare(query).run();
}
```

**問題点**:
- `INSERT OR REPLACE` は主キーのみで重複判定
- `(stats_data_id, cat01)` の組み合わせでの重複は検出されない

### 重複データの確認方法

```sql
-- 重複データの件数を確認
SELECT
  stats_data_id,
  cat01,
  COUNT(*) as duplicate_count
FROM estat_metainfo
GROUP BY stats_data_id, cat01
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 重複の例
-- stats_data_id | cat01  | duplicate_count
-- 0000010102    | B1101  | 5
-- 0000010102    | B1102  | 5
-- 0000010103    | A1201  | 3
```

---

## 現在のコードの問題点

### 問題点まとめ

| 問題 | 原因 | 影響 |
|------|------|------|
| **UNIQUE制約の欠如** | `(stats_data_id, cat01)` にUNIQUE制約なし | 重複データの登録が可能 |
| **INSERT OR REPLACEの誤用** | 主キーのみで重複判定 | 意図しない新規挿入 |
| **インデックスの不足** | `(stats_data_id, cat01)` に複合インデックスなし | 検索パフォーマンス低下 |
| **重複チェックなし** | アプリケーションレベルでの重複チェックなし | 保存前の検証なし |

### コードの問題箇所

#### 1. スキーマ定義（main.sql）

```sql
-- ❌ 問題: UNIQUE制約がない
CREATE TABLE IF NOT EXISTS estat_metainfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  cat01 TEXT,
  -- ...
);

-- ✅ 正しい定義
CREATE TABLE IF NOT EXISTS estat_metainfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  cat01 TEXT,
  -- ...
  UNIQUE(stats_data_id, cat01)  -- ← 追加
);
```

#### 2. INSERT文（EstatMetaInfoService.ts）

```typescript
// ❌ 問題: INSERT OR REPLACE は主キーのみで判定
const query = `
  INSERT OR REPLACE INTO estat_metainfo
  (stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at)
  VALUES ${values.join(",")}
`;

// ✅ 修正案1: INSERT OR IGNORE（重複は無視）
const query = `
  INSERT OR IGNORE INTO estat_metainfo
  (stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at)
  VALUES ${values.join(",")}
`;

// ✅ 修正案2: INSERT ... ON CONFLICT DO UPDATE（UPSERTパターン）
const query = `
  INSERT INTO estat_metainfo
  (stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at)
  VALUES ${values.join(",")}
  ON CONFLICT(stats_data_id, cat01)
  DO UPDATE SET
    stat_name = excluded.stat_name,
    title = excluded.title,
    item_name = excluded.item_name,
    unit = excluded.unit,
    ranking_key = excluded.ranking_key,
    updated_at = CURRENT_TIMESTAMP
`;
```

---

## 解決策

### 解決策の概要

1. **データベースマイグレーション**: UNIQUE制約を追加
2. **重複データのクリーンアップ**: 既存の重複を削除
3. **INSERT文の修正**: `ON CONFLICT` 句を使用
4. **テスト**: 重複防止の動作確認

### フェーズ別の実装

#### フェーズ1: 重複データのバックアップ（安全策）

```bash
# ローカル環境
npx wrangler d1 export stats47 --local --output=backup-before-cleanup-$(date +%Y%m%d).sql

# 本番環境
npx wrangler d1 export stats47 --remote --output=backup-prod-before-cleanup-$(date +%Y%m%d).sql
```

#### フェーズ2: 重複データの確認と分析

```sql
-- database/scripts/check-duplicates.sql

-- 重複データの統計
SELECT
  '総レコード数' as metric,
  COUNT(*) as count
FROM estat_metainfo
UNION ALL
SELECT
  '重複グループ数' as metric,
  COUNT(*) as count
FROM (
  SELECT stats_data_id, cat01
  FROM estat_metainfo
  GROUP BY stats_data_id, cat01
  HAVING COUNT(*) > 1
)
UNION ALL
SELECT
  '重複レコード数' as metric,
  SUM(duplicate_count - 1) as count
FROM (
  SELECT
    stats_data_id,
    cat01,
    COUNT(*) as duplicate_count
  FROM estat_metainfo
  GROUP BY stats_data_id, cat01
  HAVING COUNT(*) > 1
);

-- 重複データの詳細
SELECT
  stats_data_id,
  cat01,
  COUNT(*) as count,
  GROUP_CONCAT(id) as duplicate_ids
FROM estat_metainfo
GROUP BY stats_data_id, cat01
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 20;
```

実行:
```bash
# ローカル
npx wrangler d1 execute stats47 --local --file=database/scripts/check-duplicates.sql

# 本番
npx wrangler d1 execute stats47 --remote --file=database/scripts/check-duplicates.sql
```

#### フェーズ3: 重複データのクリーンアップ

**戦略**: 各 `(stats_data_id, cat01)` グループで最新の `updated_at` を持つレコードを残し、他を削除

```sql
-- database/migrations/004_cleanup_estat_metainfo_duplicates.sql

-- ステップ1: 重複レコードを特定して削除
-- （最新のupdated_atを持つレコード以外を削除）
DELETE FROM estat_metainfo
WHERE id NOT IN (
  SELECT MIN(id)
  FROM (
    SELECT
      id,
      stats_data_id,
      cat01,
      ROW_NUMBER() OVER (
        PARTITION BY stats_data_id, cat01
        ORDER BY updated_at DESC, id DESC
      ) as rn
    FROM estat_metainfo
  ) subquery
  WHERE rn = 1
);

-- ステップ2: 削除結果の確認
SELECT
  '削除後の総レコード数' as metric,
  COUNT(*) as count
FROM estat_metainfo
UNION ALL
SELECT
  '重複グループ数（確認）' as metric,
  COUNT(*) as count
FROM (
  SELECT stats_data_id, cat01
  FROM estat_metainfo
  GROUP BY stats_data_id, cat01
  HAVING COUNT(*) > 1
);
-- 重複グループ数が0になることを確認
```

**注意**: SQLiteでは `ROW_NUMBER()` がサポートされていないため、代替案を使用：

```sql
-- SQLite対応版: database/migrations/004_cleanup_estat_metainfo_duplicates.sql

-- ステップ1: 残すべきレコードのIDを一時テーブルに保存
CREATE TEMP TABLE keep_ids AS
SELECT id
FROM estat_metainfo e1
WHERE id = (
  SELECT id
  FROM estat_metainfo e2
  WHERE e2.stats_data_id = e1.stats_data_id
    AND e2.cat01 = e1.cat01
  ORDER BY updated_at DESC, id DESC
  LIMIT 1
);

-- ステップ2: keep_idsにないレコードを削除
DELETE FROM estat_metainfo
WHERE id NOT IN (SELECT id FROM keep_ids);

-- ステップ3: 一時テーブルを削除
DROP TABLE keep_ids;

-- ステップ4: 削除後の確認
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT stats_data_id || '-' || cat01) as unique_combinations
FROM estat_metainfo;
-- total_records と unique_combinations が一致することを確認
```

実行:
```bash
# ローカル環境でテスト
npx wrangler d1 execute stats47 --local --file=database/migrations/004_cleanup_estat_metainfo_duplicates.sql

# 結果を確認してから本番実行
npx wrangler d1 execute stats47 --remote --file=database/migrations/004_cleanup_estat_metainfo_duplicates.sql
```

#### フェーズ4: UNIQUE制約の追加

```sql
-- database/migrations/005_add_unique_constraint_estat_metainfo.sql

-- SQLiteでは既存テーブルにUNIQUE制約を追加できないため、
-- テーブルを再作成する必要がある

-- ステップ1: 新しいテーブルを作成（UNIQUE制約付き）
CREATE TABLE IF NOT EXISTS estat_metainfo_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  cat01 TEXT,
  item_name TEXT,
  unit TEXT,
  ranking_key TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stats_data_id, cat01)  -- ← UNIQUE制約を追加
);

-- ステップ2: データをコピー
INSERT INTO estat_metainfo_new
  (id, stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at, created_at)
SELECT
  id, stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at, created_at
FROM estat_metainfo;

-- ステップ3: 古いテーブルを削除
DROP TABLE estat_metainfo;

-- ステップ4: 新しいテーブルをリネーム
ALTER TABLE estat_metainfo_new RENAME TO estat_metainfo;

-- ステップ5: インデックスを再作成
CREATE INDEX IF NOT EXISTS idx_stats_data_id ON estat_metainfo(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_stat_name ON estat_metainfo(stat_name);
CREATE INDEX IF NOT EXISTS idx_cat01 ON estat_metainfo(cat01);
CREATE INDEX IF NOT EXISTS idx_updated_at ON estat_metainfo(updated_at);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_ranking_key ON estat_metainfo(ranking_key);

-- ステップ6: 複合インデックス（検索高速化）
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_stats_cat
  ON estat_metainfo(stats_data_id, cat01);

-- ステップ7: 確認
SELECT
  name,
  sql
FROM sqlite_master
WHERE type = 'index'
  AND tbl_name = 'estat_metainfo';
```

実行:
```bash
# ローカル環境でテスト
npx wrangler d1 execute stats47 --local --file=database/migrations/005_add_unique_constraint_estat_metainfo.sql

# 結果を確認してから本番実行
npx wrangler d1 execute stats47 --remote --file=database/migrations/005_add_unique_constraint_estat_metainfo.sql
```

#### フェーズ5: アプリケーションコードの修正

**ファイル**: `src/lib/estat/metainfo/EstatMetaInfoService.ts`

```typescript
// 修正前（590-593行目）
const query = `
  INSERT OR REPLACE INTO estat_metainfo
  (stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at)
  VALUES ${values.join(",")}
`;

// 修正後（ON CONFLICT句を使用）
const query = `
  INSERT INTO estat_metainfo
  (stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at)
  VALUES ${values.join(",")}
  ON CONFLICT(stats_data_id, cat01)
  DO UPDATE SET
    stat_name = excluded.stat_name,
    title = excluded.title,
    item_name = excluded.item_name,
    unit = excluded.unit,
    ranking_key = excluded.ranking_key,
    updated_at = CURRENT_TIMESTAMP
`;
```

**変更点の説明**:
- `INSERT OR REPLACE` → `INSERT ... ON CONFLICT`
- `ON CONFLICT(stats_data_id, cat01)`: UNIQUE制約に違反した場合の処理
- `DO UPDATE SET`: 既存レコードを更新（新しいデータで上書き）
- `excluded.xxx`: 挿入しようとしたデータ（新しい値）

**修正ファイルの完全版**:
```typescript
// src/lib/estat/metainfo/EstatMetaInfoService.ts

private async processBatch(
  dataList: TransformedMetadataEntry[]
): Promise<void> {
  if (dataList.length === 0) return;

  const escape = (str: string | null): string => {
    if (str === null) return "NULL";
    return `'${str.replace(/'/g, "''")}'`;
  };

  const values = await Promise.all(
    dataList.map(async (data) => {
      const rankingKey = data.cat01
        ? await this.findRankingKey(data.stats_data_id, data.cat01)
        : null;

      return `(
        ${escape(data.stats_data_id)},
        ${escape(data.stat_name)},
        ${escape(data.title)},
        ${escape(data.cat01)},
        ${escape(data.item_name)},
        ${escape(data.unit)},
        ${escape(rankingKey)},
        CURRENT_TIMESTAMP
      )`;
    })
  );

  // ✅ 修正: ON CONFLICT句を使用
  const query = `
    INSERT INTO estat_metainfo
    (stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at)
    VALUES ${values.join(",")}
    ON CONFLICT(stats_data_id, cat01)
    DO UPDATE SET
      stat_name = excluded.stat_name,
      title = excluded.title,
      item_name = excluded.item_name,
      unit = excluded.unit,
      ranking_key = excluded.ranking_key,
      updated_at = CURRENT_TIMESTAMP
  `;

  console.log("🔵 Service: SQL Length:", query.length);

  try {
    await this.db.prepare(query).run();
  } catch (error) {
    console.error(
      `❌ Service: バッチ保存エラー (${dataList.length}件):`,
      error
    );
    throw error;
  }
}
```

---

## 実装手順

### 手順1: 開発環境で検証

```bash
# 1. ローカルD1のバックアップ
npx wrangler d1 export stats47 --local --output=backup-local-$(date +%Y%m%d).sql

# 2. 重複データの確認
npx wrangler d1 execute stats47 --local --file=database/scripts/check-duplicates.sql

# 3. クリーンアップ実行
npx wrangler d1 execute stats47 --local --file=database/migrations/004_cleanup_estat_metainfo_duplicates.sql

# 4. UNIQUE制約追加
npx wrangler d1 execute stats47 --local --file=database/migrations/005_add_unique_constraint_estat_metainfo.sql

# 5. コードを修正（EstatMetaInfoService.ts）

# 6. テスト実行
npm run dev
# ブラウザで /estat/metainfo にアクセス
# 統計表IDを保存して、重複が発生しないか確認
```

### 手順2: 本番環境へのデプロイ

```bash
# 1. 本番D1のバックアップ
npx wrangler d1 export stats47 --remote --output=backup-prod-$(date +%Y%m%d).sql

# 2. 重複データの確認
npx wrangler d1 execute stats47 --remote --file=database/scripts/check-duplicates.sql

# 3. クリーンアップ実行（注意！）
npx wrangler d1 execute stats47 --remote --file=database/migrations/004_cleanup_estat_metainfo_duplicates.sql

# 4. UNIQUE制約追加
npx wrangler d1 execute stats47 --remote --file=database/migrations/005_add_unique_constraint_estat_metainfo.sql

# 5. アプリケーションデプロイ
git add .
git commit -m "fix: add UNIQUE constraint to estat_metainfo and prevent duplicates"
git push origin main
# Vercel自動デプロイ

# 6. 本番環境でテスト
```

---

## テスト方法

### テストケース1: 重複防止の確認

```typescript
// tests/estat-metainfo.test.ts

describe("EstatMetaInfoService - 重複防止", () => {
  let service: EstatMetaInfoService;
  let db: D1Database;

  beforeEach(async () => {
    db = await createLocalD1Database();
    service = new EstatMetaInfoService(db);
  });

  it("同じstats_data_idとcat01を2回保存しても重複しない", async () => {
    // 1回目の保存
    await service.processAndSaveMetaInfo("0000010102");

    const firstCount = await db
      .prepare("SELECT COUNT(*) as count FROM estat_metainfo WHERE stats_data_id = '0000010102'")
      .first();

    // 2回目の保存（同じデータ）
    await service.processAndSaveMetaInfo("0000010102");

    const secondCount = await db
      .prepare("SELECT COUNT(*) as count FROM estat_metainfo WHERE stats_data_id = '0000010102'")
      .first();

    // レコード数が変わらないことを確認
    expect(secondCount.count).toBe(firstCount.count);
  });

  it("UNIQUE制約違反でエラーが発生しない", async () => {
    // 直接INSERTを試行
    await db.prepare(`
      INSERT INTO estat_metainfo
      (stats_data_id, stat_name, title, cat01, item_name, unit)
      VALUES ('TEST001', 'テスト', 'テストタイトル', 'A001', 'テスト項目', 'ha')
    `).run();

    // 同じデータを再度INSERT（ON CONFLICT句で処理される）
    const result = await db.prepare(`
      INSERT INTO estat_metainfo
      (stats_data_id, stat_name, title, cat01, item_name, unit)
      VALUES ('TEST001', 'テスト', 'テストタイトル', 'A001', 'テスト項目', 'ha')
      ON CONFLICT(stats_data_id, cat01)
      DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    `).run();

    expect(result.success).toBe(true);
  });
});
```

### テストケース2: データ更新の確認

```sql
-- 手動テスト用SQL

-- 1. テストデータ挿入
INSERT INTO estat_metainfo
(stats_data_id, stat_name, title, cat01, item_name, unit, updated_at)
VALUES ('TEST002', '旧名称', '旧タイトル', 'B001', '旧項目', 'km', '2025-01-01 00:00:00');

-- 2. 同じキーで新しいデータを挿入（ON CONFLICT句でUPDATE）
INSERT INTO estat_metainfo
(stats_data_id, stat_name, title, cat01, item_name, unit, updated_at)
VALUES ('TEST002', '新名称', '新タイトル', 'B001', '新項目', 'km', CURRENT_TIMESTAMP)
ON CONFLICT(stats_data_id, cat01)
DO UPDATE SET
  stat_name = excluded.stat_name,
  title = excluded.title,
  item_name = excluded.item_name,
  updated_at = CURRENT_TIMESTAMP;

-- 3. 結果確認（1件のみ存在し、データが更新されていることを確認）
SELECT * FROM estat_metainfo WHERE stats_data_id = 'TEST002' AND cat01 = 'B001';
-- 期待値: stat_name='新名称', title='新タイトル', item_name='新項目'
```

### テストケース3: パフォーマンステスト

```bash
# 大量データの保存テスト
time npx wrangler d1 execute stats47 --local --command="
  INSERT INTO estat_metainfo (stats_data_id, stat_name, title, cat01, item_name, unit)
  SELECT
    'PERF' || (value % 100),
    'テスト統計',
    'パフォーマンステスト',
    'P' || SUBSTR('000' || value, -3),
    'テスト項目',
    'unit'
  FROM (SELECT value FROM generate_series(1, 10000))
  ON CONFLICT(stats_data_id, cat01)
  DO UPDATE SET updated_at = CURRENT_TIMESTAMP;
"
```

---

## 予防策

### 1. データベース設計のベストプラクティス

#### 新規テーブル作成時のチェックリスト

- [ ] 主キー（PRIMARY KEY）を設定
- [ ] ビジネスロジック上の一意性を持つカラムにUNIQUE制約
- [ ] 外部キー制約（FOREIGN KEY）の設定
- [ ] NOT NULL制約の適切な使用
- [ ] インデックスの設計（検索頻度の高いカラム）

#### estat_metainfo テーブルの最終的な設計

```sql
CREATE TABLE IF NOT EXISTS estat_metainfo (
  -- 主キー
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- 必須カラム
  stats_data_id TEXT NOT NULL,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,

  -- オプショナルカラム
  cat01 TEXT,
  item_name TEXT,
  unit TEXT,
  ranking_key TEXT,

  -- タイムスタンプ
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- ビジネスロジック上の一意性制約
  UNIQUE(stats_data_id, cat01)
);

-- インデックス
CREATE INDEX idx_stats_data_id ON estat_metainfo(stats_data_id);
CREATE INDEX idx_stat_name ON estat_metainfo(stat_name);
CREATE INDEX idx_cat01 ON estat_metainfo(cat01);
CREATE INDEX idx_updated_at ON estat_metainfo(updated_at);
CREATE INDEX idx_estat_metainfo_ranking_key ON estat_metainfo(ranking_key);
CREATE INDEX idx_estat_metainfo_stats_cat ON estat_metainfo(stats_data_id, cat01);
```

### 2. コーディングガイドライン

#### INSERT文の書き方

```typescript
// ❌ 悪い例: INSERT OR REPLACE（主キーのみで判定）
db.prepare(`
  INSERT OR REPLACE INTO table_name (id, column1, column2)
  VALUES (?, ?, ?)
`);

// ✅ 良い例: ON CONFLICT句で明示的に制約を指定
db.prepare(`
  INSERT INTO table_name (column1, column2, column3)
  VALUES (?, ?, ?)
  ON CONFLICT(column1, column2)  -- ← 明示的に制約を指定
  DO UPDATE SET
    column3 = excluded.column3,
    updated_at = CURRENT_TIMESTAMP
`);

// ✅ 良い例: INSERT OR IGNORE（重複は無視）
db.prepare(`
  INSERT OR IGNORE INTO table_name (column1, column2, column3)
  VALUES (?, ?, ?)
`);
```

### 3. レビューチェックリスト

#### データベース変更のレビューポイント

- [ ] UNIQUE制約は適切か？
- [ ] INSERT/UPDATE文で `ON CONFLICT` 句を使用しているか？
- [ ] インデックスは必要十分か？
- [ ] マイグレーションスクリプトにロールバックSQLがあるか？
- [ ] テストケースは追加されているか？

#### コードレビューのチェックポイント

```typescript
// チェック1: INSERT OR REPLACE の使用
// → (stats_data_id, cat01) にUNIQUE制約がある場合のみ使用可

// チェック2: ON CONFLICT句の使用
// → UNIQUE制約に対応した処理が書かれているか

// チェック3: エラーハンドリング
// → UNIQUE制約違反時のエラーメッセージは適切か
```

### 4. 定期メンテナンス

#### 月次チェックスクリプト

```sql
-- database/scripts/monthly-check.sql

-- 1. 重複データの確認
SELECT
  '重複チェック' as check_name,
  COUNT(*) as issue_count
FROM (
  SELECT stats_data_id, cat01
  FROM estat_metainfo
  GROUP BY stats_data_id, cat01
  HAVING COUNT(*) > 1
)
UNION ALL

-- 2. NULL値のチェック
SELECT
  'NULL値チェック (stats_data_id)' as check_name,
  COUNT(*) as issue_count
FROM estat_metainfo
WHERE stats_data_id IS NULL
UNION ALL

-- 3. インデックスの確認
SELECT
  'インデックス数' as check_name,
  COUNT(*) as count
FROM sqlite_master
WHERE type = 'index' AND tbl_name = 'estat_metainfo';
```

実行:
```bash
# 毎月1日に実行
npx wrangler d1 execute stats47 --remote --file=database/scripts/monthly-check.sql
```

---

## まとめ

### 問題の根本原因

1. **UNIQUE制約の欠如**: `(stats_data_id, cat01)` にUNIQUE制約がなかった
2. **INSERT OR REPLACEの誤用**: 主キーのみで重複判定していた

### 解決策

1. **マイグレーション**: UNIQUE制約の追加
2. **クリーンアップ**: 既存の重複データを削除
3. **コード修正**: `ON CONFLICT` 句を使用したUPSERT実装

### 期待される効果

- ✅ 重複データの発生を防止
- ✅ データ整合性の向上
- ✅ 検索パフォーマンスの向上（複合インデックス）
- ✅ ストレージ容量の節約

### 今後の運用

- 定期的な重複チェック（月次）
- データベーススキーマのレビュー強化
- INSERT文のコーディングガイドライン遵守

---

## 関連ドキュメント

- [データベース環境分離実装ガイド](./database-environment-setup.md)
- [データベース完全ガイド](./database-documentation.md)
- [データベーススキーマリファクタリング計画](./database-refactoring-plan.md)

---

**作成者**: Claude Code
**最終更新**: 2025-01-13
**バージョン**: 1.0
