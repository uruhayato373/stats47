---
title: データベーストラブルシューティングガイド
created: 2025-10-17
updated: 2025-10-17
tags:
  - domain/database
  - operations
  - troubleshooting
---

# データベーストラブルシューティングガイド

## 概要

stats47 プロジェクトにおけるデータベース関連の問題の診断、解決方法、予防策について説明します。

## よくある問題と解決方法

### 1. 接続エラー

#### 問題: データベースに接続できない

**症状**:

```
Error: Failed to connect to database
D1 API Error: 401 - Unauthorized
```

**原因**:

- API トークンが無効または期限切れ
- アカウント ID が間違っている
- データベース ID が間違っている

**解決方法**:

```bash
# 1. APIトークンの確認
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"

# 2. 環境変数の確認
echo "API Token: $CLOUDFLARE_API_TOKEN"
echo "Account ID: $CLOUDFLARE_ACCOUNT_ID"
echo "Database ID: $CLOUDFLARE_D1_DATABASE_ID"

# 3. データベース一覧の確認
npx wrangler d1 list
```

**予防策**:

- 定期的な API トークンの更新
- 環境変数の検証スクリプトの実行
- 接続テストの自動化

#### 問題: ローカル D1 ファイルが見つからない

**症状**:

```
Error: ENOENT: no such file or directory, open '.wrangler/state/...'
```

**解決方法**:

```bash
# 1. WranglerでローカルD1を生成
npx wrangler dev

# 2. ファイルパスを確認
find .wrangler -name "*.sqlite"

# 3. パスが異なる場合は環境変数に設定
export LOCAL_D1_PATH=".wrangler/state/v3/d1/miniflare-D1DatabaseObject/xxx.sqlite"
```

### 2. クエリエラー

#### 問題: テーブルが存在しない

**症状**:

```
Error: no such table: users
```

**解決方法**:

```bash
# 1. マイグレーションの適用
npx wrangler d1 migrations apply stats47 --local

# 2. テーブル一覧の確認
npx wrangler d1 execute stats47 --local --command ".tables"

# 3. スキーマの確認
npx wrangler d1 execute stats47 --local --command ".schema users"
```

#### 問題: 制約違反エラー

**症状**:

```
Error: UNIQUE constraint failed: users.email
```

**解決方法**:

```typescript
// 重複チェック付きの挿入
const createUserSafely = async (db: D1Database, userData: any) => {
  // まず重複チェック
  const existingUser = await db
    .prepare(
      `
    SELECT id FROM users WHERE email = ?
  `
    )
    .bind(userData.email)
    .first();

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // 挿入実行
  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, created_at, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  return await stmt.bind(userData.id, userData.name, userData.email).run();
};
```

### 3. パフォーマンス問題

#### 問題: クエリが遅い

**症状**:

- クエリ実行時間が 5 秒以上
- タイムアウトエラーが発生

**診断方法**:

```sql
-- クエリプランの確認
EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = 'user@example.com';

-- インデックスの使用状況確認
SELECT * FROM sqlite_master WHERE type = 'index' AND tbl_name = 'users';
```

**解決方法**:

```sql
-- 適切なインデックスの作成
CREATE INDEX idx_users_email ON users(email);

-- 複合インデックスの作成
CREATE INDEX idx_estat_metainfo_category_subcategory
ON estat_metainfo(category, subcategory);
```

#### 問題: メモリ不足

**症状**:

```
Error: out of memory
```

**解決方法**:

```typescript
// バッチサイズを小さくして処理
const processLargeDataset = async (db: D1Database, data: any[]) => {
  const BATCH_SIZE = 100;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);

    const stmt = db.prepare(`
      INSERT INTO large_table (id, data)
      VALUES (?, ?)
    `);

    const batchQueries = batch.map((item) => stmt.bind(item.id, item.data));
    await db.batch(batchQueries);

    // メモリ解放のための待機
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};
```

### 4. データ整合性問題

#### 問題: データの不整合

**症状**:

- 関連データが存在しない
- 外部キー制約エラー

**診断方法**:

```sql
-- 孤立レコードの検索
SELECT u.* FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- 重複データの検索
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```

**解決方法**:

```sql
-- 孤立レコードの削除
DELETE FROM users
WHERE id NOT IN (
  SELECT DISTINCT user_id FROM user_profiles
);

-- 重複データの削除
DELETE FROM users
WHERE id NOT IN (
  SELECT MIN(id) FROM users GROUP BY email
);
```

## デバッグツール

### 1. クエリログの有効化

```typescript
// クエリログの実装
const logQuery = (query: string, params: any[], duration: number) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[DB Query] ${query}`);
    console.log(`[DB Params] ${JSON.stringify(params)}`);
    console.log(`[DB Duration] ${duration}ms`);
  }
};

// 使用例
const executeQueryWithLogging = async (
  db: D1Database,
  query: string,
  params: any[]
) => {
  const startTime = Date.now();

  try {
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).all();

    const duration = Date.now() - startTime;
    logQuery(query, params, duration);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[DB Error] ${query} (${duration}ms):`, error);
    throw error;
  }
};
```

### 2. パフォーマンス監視

```typescript
// パフォーマンス監視の実装
class DatabaseMonitor {
  private static queries: Array<{
    query: string;
    duration: number;
    timestamp: number;
  }> = [];

  static logQuery(query: string, duration: number) {
    this.queries.push({
      query,
      duration,
      timestamp: Date.now(),
    });

    // 古いログの削除（1時間以上前）
    const oneHourAgo = Date.now() - 3600000;
    this.queries = this.queries.filter((q) => q.timestamp > oneHourAgo);
  }

  static getSlowQueries(threshold: number = 1000) {
    return this.queries.filter((q) => q.duration > threshold);
  }

  static getAverageDuration() {
    if (this.queries.length === 0) return 0;

    const totalDuration = this.queries.reduce((sum, q) => sum + q.duration, 0);
    return totalDuration / this.queries.length;
  }

  static getQueryStats() {
    const slowQueries = this.getSlowQueries();
    const averageDuration = this.getAverageDuration();

    return {
      totalQueries: this.queries.length,
      slowQueries: slowQueries.length,
      averageDuration: Math.round(averageDuration),
      slowestQuery: slowQueries.sort((a, b) => b.duration - a.duration)[0],
    };
  }
}
```

### 3. ヘルスチェック

```typescript
// データベースヘルスチェック
const checkDatabaseHealth = async (
  db: D1Database
): Promise<{
  isHealthy: boolean;
  issues: string[];
  metrics: any;
}> => {
  const issues: string[] = [];
  const metrics: any = {};

  try {
    // 基本的な接続テスト
    const startTime = Date.now();
    await db.prepare("SELECT 1 as test").first();
    const responseTime = Date.now() - startTime;

    metrics.responseTime = responseTime;

    if (responseTime > 5000) {
      issues.push(`Slow response time: ${responseTime}ms`);
    }

    // テーブル存在確認
    const tables = ["users", "estat_metainfo", "ranking_items"];
    for (const table of tables) {
      try {
        await db.prepare(`SELECT COUNT(*) FROM ${table}`).first();
      } catch (error) {
        issues.push(`Table ${table} is missing or inaccessible`);
      }
    }

    // データ整合性チェック
    try {
      const userCount = await db
        .prepare("SELECT COUNT(*) as count FROM users")
        .first();
      metrics.userCount = userCount.count;

      if (userCount.count === 0) {
        issues.push("No users found in database");
      }
    } catch (error) {
      issues.push("Failed to count users");
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      metrics,
    };
  } catch (error) {
    return {
      isHealthy: false,
      issues: [`Database connection failed: ${error}`],
      metrics: {},
    };
  }
};
```

## 予防策

### 1. 定期的なメンテナンス

```bash
#!/bin/bash
# database/scripts/maintenance.sh

echo "Starting database maintenance..."

# 1. データベースの最適化
npx wrangler d1 execute stats47 --local --command "VACUUM;"

# 2. インデックスの再構築
npx wrangler d1 execute stats47 --local --command "REINDEX;"

# 3. 統計情報の更新
npx wrangler d1 execute stats47 --local --command "ANALYZE;"

# 4. 古いログの削除
npx wrangler d1 execute stats47 --local --command "
DELETE FROM logs WHERE created_at < datetime('now', '-30 days');
"

echo "Maintenance completed"
```

### 2. 自動監視

```typescript
// 自動監視の実装
const startDatabaseMonitoring = (db: D1Database) => {
  setInterval(async () => {
    const health = await checkDatabaseHealth(db);

    if (!health.isHealthy) {
      console.error("Database health check failed:", health.issues);

      // アラートの送信
      await sendAlert({
        type: "database_health",
        issues: health.issues,
        metrics: health.metrics,
      });
    }

    // パフォーマンス統計の記録
    const stats = DatabaseMonitor.getQueryStats();
    if (stats.slowQueries > 0) {
      console.warn("Slow queries detected:", stats);
    }
  }, 60000); // 1分ごとにチェック
};
```

### 3. バックアップの自動化

```bash
#!/bin/bash
# database/scripts/auto-backup.sh

# 毎日午前2時にバックアップを実行
# crontab -e で以下を追加:
# 0 2 * * * /path/to/project/database/scripts/auto-backup.sh

BACKUP_DIR="database/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# バックアップの作成
npx wrangler d1 execute stats47 --local --command '.dump' > "$BACKUP_DIR/auto_backup_$DATE.sql"

# 古いバックアップの削除（7日以上前）
find "$BACKUP_DIR" -name "auto_backup_*.sql" -mtime +7 -delete

echo "Auto backup completed: $BACKUP_DIR/auto_backup_$DATE.sql"
```

## 緊急時の対応

### 1. データベースの停止

```bash
# 緊急時のデータベース停止
npx wrangler d1 execute stats47 --env production --command "
-- 読み取り専用モードに設定
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
"
```

### 2. 緊急復旧

```bash
#!/bin/bash
# database/scripts/emergency-recovery.sh

echo "Starting emergency recovery..."

# 1. 最新のバックアップを特定
LATEST_BACKUP=$(ls -t database/backups/production_backup_*.sql | head -n1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "ERROR: No backup files found"
  exit 1
fi

# 2. 緊急復旧用の新しいデータベースを作成
npx wrangler d1 create stats47-emergency

# 3. バックアップを復元
npx wrangler d1 execute stats47-emergency --file="$LATEST_BACKUP"

# 4. アプリケーションの設定を更新
echo "Emergency database created: stats47-emergency"
echo "Update your environment variables to use the emergency database"
```

## 関連ドキュメント

- [データベース設計](../specifications/database-design.md)
- [開発環境セットアップ](../implementation/development-setup.md)
- [バックアップ・リストアガイド](./backup-restore.md)
- [ベストプラクティス](../implementation/best-practices.md)
