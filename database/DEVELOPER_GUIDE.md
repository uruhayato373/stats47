# 開発者向けデータベースガイドライン

このドキュメントは、開発者がデータベースを安全かつ効率的に操作するためのガイドラインを提供します。

## 🚀 **クイックスタート**

### **1. 初回セットアップ**

```bash
# 1. データベースの初期化
./database/manage.sh init

# 2. 状態確認
./database/manage.sh status

# 3. バックアップ作成
./database/manage.sh backup
```

### **2. 日常的な操作**

```bash
# スキーマ変更前のバックアップ
./database/manage.sh backup

# マイグレーション適用
./database/manage.sh migrate

# データベース状態確認
./database/manage.sh status
```

## 📝 **開発ワークフロー**

### **1. 新機能開発時**

#### **Step 1: スキーマ設計**

```sql
-- 1. 新しいスキーマファイルを作成
-- database/schemas/[機能名].sql

-- 2. テーブル設計
CREATE TABLE IF NOT EXISTS new_feature (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. インデックス作成
CREATE INDEX IF NOT EXISTS idx_new_feature_name ON new_feature(name);
```

#### **Step 2: マイグレーションファイル作成**

```sql
-- database/migrations/[連番]_[説明]_[日付].sql
-- 例: 002_add_new_feature_20241219.sql

-- 新機能テーブルの追加
CREATE TABLE IF NOT EXISTS new_feature (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_new_feature_name ON new_feature(name);

-- スキーマバージョン更新
INSERT INTO schema_versions (version, description)
VALUES ('1.1.0', '新機能テーブルの追加');
```

#### **Step 3: テストとデプロイ**

```bash
# 1. テスト環境での検証
wrangler d1 execute stats47-auth-db --file=./database/migrations/002_add_new_feature_20241219.sql

# 2. 動作確認
wrangler d1 execute stats47-auth-db --command="SELECT * FROM new_feature;"

# 3. 本番環境への適用
./database/manage.sh migrate
```

### **2. 既存機能の修正時**

#### **Step 1: 影響範囲の分析**

```bash
# 1. 現在のスキーマ状態確認
./database/manage.sh status

# 2. 関連テーブルの確認
wrangler d1 execute stats47-auth-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# 3. テーブル構造の確認
wrangler d1 execute stats47-auth-db --command="PRAGMA table_info(estat_metadata);"
```

#### **Step 2: 安全な修正**

```sql
-- 1. バックアップテーブルの作成
CREATE TABLE estat_metadata_backup AS SELECT * FROM estat_metadata;

-- 2. 修正の実行
ALTER TABLE estat_metadata ADD COLUMN new_column TEXT;

-- 3. データの移行（必要に応じて）
UPDATE estat_metadata SET new_column = 'default_value' WHERE new_column IS NULL;
```

## 🔍 **データベース操作のベストプラクティス**

### **1. クエリの最適化**

#### **良い例**

```sql
-- インデックスを活用した検索
SELECT * FROM estat_metadata
WHERE stat_name LIKE '人口%'
  AND cat01 = 'A1101'
LIMIT 100;

-- 複合インデックスの活用
SELECT DISTINCT stat_name, title
FROM estat_metadata
WHERE stat_name LIKE '%統計%'
ORDER BY stat_name, title;
```

#### **避けるべき例**

```sql
-- インデックスが効かない検索
SELECT * FROM estat_metadata
WHERE LOWER(stat_name) LIKE '%人口%';

-- 大量データの全件取得
SELECT * FROM estat_metadata;
```

### **2. データ挿入・更新**

#### **バッチ処理の例**

```typescript
// 大量データの効率的な挿入
async function batchInsert(dataList: any[]) {
  const batchSize = 100;

  for (let i = 0; i < dataList.length; i += batchSize) {
    const batch = dataList.slice(i, i + batchSize);

    await db.prepare("BEGIN TRANSACTION").run();
    try {
      for (const data of batch) {
        await insertStatement.bind(data).run();
      }
      await db.prepare("COMMIT").run();
    } catch (error) {
      await db.prepare("ROLLBACK").run();
      throw error;
    }
  }
}
```

### **3. エラーハンドリング**

#### **適切なエラーハンドリング**

```typescript
try {
  const result = await db
    .prepare("SELECT * FROM estat_metadata WHERE id = ?")
    .bind(id)
    .first();

  if (!result) {
    throw new Error(`ID ${id} のデータが見つかりません`);
  }

  return result;
} catch (error) {
  console.error("データベースエラー:", error);

  if (error.message.includes("no such table")) {
    throw new Error("テーブルが存在しません。スキーマを確認してください。");
  }

  throw new Error("データベース操作に失敗しました");
}
```

## 🛠️ **トラブルシューティング**

### **1. よくある問題と解決方法**

#### **問題: テーブルが存在しない**

```bash
# 解決方法: スキーマの確認と再適用
./database/manage.sh status
./database/manage.sh init
```

#### **問題: インデックスが効かない**

```sql
-- 解決方法: クエリプランの確認
EXPLAIN QUERY PLAN
SELECT * FROM estat_metadata
WHERE stat_name LIKE '%人口%';

-- インデックスの確認
PRAGMA index_list(estat_metadata);
```

#### **問題: パフォーマンスが悪い**

```sql
-- 解決方法: クエリの最適化
-- 1. EXPLAIN QUERY PLANで分析
EXPLAIN QUERY PLAN SELECT * FROM estat_metadata WHERE stat_name LIKE '%統計%';

-- 2. 適切なインデックスの作成
CREATE INDEX IF NOT EXISTS idx_estat_metadata_stat_name_partial
ON estat_metadata(stat_name) WHERE stat_name LIKE '%統計%';
```

### **2. デバッグ手法**

#### **ログ出力の活用**

```typescript
// クエリ実行時間の計測
const startTime = Date.now();
const result = await db
  .prepare(query)
  .bind(...params)
  .all();
const endTime = Date.now();

console.log(`クエリ実行時間: ${endTime - startTime}ms`);
console.log(`取得件数: ${result.results.length}`);
```

#### **データベース状態の確認**

```bash
# テーブル一覧
wrangler d1 execute stats47-auth-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# テーブル構造
wrangler d1 execute stats47-auth-db --command="PRAGMA table_info(estat_metadata);"

# インデックス一覧
wrangler d1 execute stats47-auth-db --command="PRAGMA index_list(estat_metadata);"
```

## 📊 **パフォーマンス監視**

### **1. 監視すべき指標**

- クエリ実行時間
- データベースサイズ
- インデックス使用率
- エラー発生率

### **2. 監視クエリ**

```sql
-- テーブルサイズの確認
SELECT
  name,
  sqlite_compileoption_get('ENABLE_LOAD_EXTENSION') as size
FROM sqlite_master
WHERE type='table';

-- インデックス使用状況
SELECT
  name,
  sql
FROM sqlite_master
WHERE type='index';
```

## 🔒 **セキュリティ考慮事項**

### **1. SQL インジェクション対策**

```typescript
// 良い例: プリペアドステートメントの使用
const result = await db
  .prepare("SELECT * FROM users WHERE email = ?")
  .bind(email)
  .first();

// 悪い例: 文字列連結
const result = await db
  .prepare(`SELECT * FROM users WHERE email = '${email}'`)
  .first();
```

### **2. 権限管理**

- 必要最小限の権限のみを付与
- 定期的な権限の見直し
- アクセスログの監視

## 📚 **学習リソース**

### **1. 必須学習項目**

- [SQLite 基本構文](https://www.sqlite.org/lang.html)
- [Cloudflare D1 ドキュメント](https://developers.cloudflare.com/d1/)
- [データベース設計の基礎](https://www.sqlite.org/foreignkeys.html)

### **2. 実践的な学習**

- サンプルデータベースでの操作練習
- パフォーマンステストの実行
- エラーケースのシミュレーション

## 📞 **サポートとフィードバック**

開発中に問題が発生した場合や、改善提案がある場合は、以下に連絡してください：

- **緊急時**: チームリーダーに直接連絡
- **技術的な質問**: データベース管理者
- **改善提案**: プロジェクトメンバー全員で議論

---

**注意**: このガイドラインは継続的に改善されます。最新版は常にリポジトリで確認してください。
