---
title: データベースベストプラクティス
created: 2025-10-17
updated: 2025-10-17
tags:
  - domain/database
  - implementation
  - best-practices
---

# データベースベストプラクティス

## 概要

stats47 プロジェクトにおけるデータベース操作のベストプラクティス、セキュリティ考慮事項、パフォーマンス最適化について説明します。

## セキュリティ

### 1. SQL インジェクション対策

#### プリペアドステートメントの使用

```typescript
// ✅ 良い例: プリペアドステートメントを使用
const getUserById = async (db: D1Database, userId: string) => {
  const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
  return await stmt.bind(userId).first();
};

// ❌ 悪い例: 文字列連結でSQLを構築
const getUserByIdBad = async (db: D1Database, userId: string) => {
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  return await db.prepare(query).first();
};
```

#### 入力値の検証

```typescript
// 入力値の検証とサニタイゼーション
const validateUserId = (userId: string): boolean => {
  // UUID形式の検証
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
};

const getUserByIdSafe = async (db: D1Database, userId: string) => {
  if (!validateUserId(userId)) {
    throw new Error("Invalid user ID format");
  }

  const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
  return await stmt.bind(userId).first();
};
```

### 2. アクセス制御

#### ユーザーレベルの権限管理

```typescript
// ユーザー権限のチェック
const checkUserPermission = async (
  db: D1Database,
  userId: string,
  resource: string
): Promise<boolean> => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = ? AND p.resource = ?
  `);

  const result = await stmt.bind(userId, resource).first();
  return result.count > 0;
};

// 権限チェック付きのデータ取得
const getUsersWithPermission = async (db: D1Database, userId: string) => {
  const hasPermission = await checkUserPermission(db, userId, "users:read");

  if (!hasPermission) {
    throw new Error("Insufficient permissions");
  }

  const stmt = db.prepare("SELECT id, name, email FROM users");
  return await stmt.all();
};
```

### 3. データの暗号化

#### 機密データの暗号化

```typescript
import crypto from "crypto";

// 暗号化キーの管理
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key";
const ALGORITHM = "aes-256-gcm";

// データの暗号化
const encryptData = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
};

// データの復号化
const decryptData = (encryptedText: string): string => {
  const textParts = encryptedText.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex");
  const encryptedData = textParts.join(":");

  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

// 機密データの保存
const saveUserWithEncryptedData = async (
  db: D1Database,
  userData: {
    id: string;
    name: string;
    email: string;
    sensitiveData: string;
  }
) => {
  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, encrypted_data, created_at, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const encryptedData = encryptData(userData.sensitiveData);

  return await stmt
    .bind(userData.id, userData.name, userData.email, encryptedData)
    .run();
};
```

## パフォーマンス最適化

### 1. インデックスの最適化

#### 適切なインデックスの設計

```sql
-- 検索頻度の高いカラムにインデックスを作成
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_estat_metainfo_category ON estat_metainfo(category);
CREATE INDEX idx_estat_metainfo_subcategory ON estat_metainfo(subcategory);

-- 複合インデックスで複数条件の検索を最適化
CREATE INDEX idx_estat_metainfo_category_subcategory
ON estat_metainfo(category, subcategory);

-- カバリングインデックスでクエリを最適化
CREATE INDEX idx_estat_metainfo_list
ON estat_metainfo(category, subcategory, stats_data_id, title, updated_at);
```

#### インデックスの監視

```typescript
// インデックスの使用状況を監視
const analyzeQueryPerformance = async (db: D1Database, query: string) => {
  const stmt = db.prepare(`EXPLAIN QUERY PLAN ${query}`);
  const result = await stmt.all();

  console.log("Query Plan:", result);
  return result;
};

// 使用例
const analyzeUserQuery = async (db: D1Database) => {
  await analyzeQueryPerformance(
    db,
    `
    SELECT * FROM users 
    WHERE email = 'user@example.com'
  `
  );
};
```

### 2. クエリの最適化

#### 効率的なクエリの書き方

```typescript
// ✅ 良い例: 必要なカラムのみを選択
const getUsersBasic = async (db: D1Database) => {
  const stmt = db.prepare(`
    SELECT id, name, email, created_at 
    FROM users 
    ORDER BY created_at DESC 
    LIMIT 20
  `);

  return await stmt.all();
};

// ❌ 悪い例: 全カラムを選択
const getUsersBad = async (db: D1Database) => {
  const stmt = db.prepare(`
    SELECT * FROM users 
    ORDER BY created_at DESC 
    LIMIT 20
  `);

  return await stmt.all();
};
```

#### ページネーションの実装

```typescript
// カーソルベースのページネーション
const getUsersPaginated = async (
  db: D1Database,
  options: {
    cursor?: string;
    limit?: number;
  }
) => {
  const { cursor, limit = 20 } = options;

  let query = `
    SELECT id, name, email, created_at 
    FROM users
  `;

  const params: any[] = [];

  if (cursor) {
    query += ` WHERE created_at < ?`;
    params.push(cursor);
  }

  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit + 1); // 次のページがあるかチェックするため+1

  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all();

  const hasNextPage = result.results.length > limit;
  const users = hasNextPage ? result.results.slice(0, -1) : result.results;
  const nextCursor = hasNextPage ? users[users.length - 1].created_at : null;

  return {
    users,
    hasNextPage,
    nextCursor,
  };
};
```

### 3. 接続プールの管理

#### 接続の効率的な使用

```typescript
// 接続の再利用
class DatabaseManager {
  private static instance: DatabaseManager;
  private db: D1Database | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async getDatabase(): Promise<D1Database> {
    if (!this.db) {
      const { getDataProvider } = await import("@/lib/database");
      this.db = await getDataProvider();
    }
    return this.db;
  }

  async close(): Promise<void> {
    this.db = null;
  }
}

// 使用例
const dbManager = DatabaseManager.getInstance();
const db = await dbManager.getDatabase();
```

## エラーハンドリング

### 1. データベースエラーの分類

```typescript
// データベースエラーの分類
enum DatabaseErrorType {
  CONNECTION_ERROR = "CONNECTION_ERROR",
  QUERY_ERROR = "QUERY_ERROR",
  CONSTRAINT_ERROR = "CONSTRAINT_ERROR",
  PERMISSION_ERROR = "PERMISSION_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

class DatabaseError extends Error {
  constructor(
    public type: DatabaseErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

// エラーの分類とハンドリング
const handleDatabaseError = (error: any): DatabaseError => {
  if (error.message.includes("UNIQUE constraint failed")) {
    return new DatabaseError(
      DatabaseErrorType.CONSTRAINT_ERROR,
      "Duplicate entry found",
      error
    );
  }

  if (error.message.includes("no such table")) {
    return new DatabaseError(
      DatabaseErrorType.QUERY_ERROR,
      "Table does not exist",
      error
    );
  }

  if (error.message.includes("permission denied")) {
    return new DatabaseError(
      DatabaseErrorType.PERMISSION_ERROR,
      "Insufficient permissions",
      error
    );
  }

  return new DatabaseError(
    DatabaseErrorType.UNKNOWN_ERROR,
    "Unknown database error",
    error
  );
};
```

### 2. リトライ機能

```typescript
// 指数バックオフ付きリトライ
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.warn(`Operation failed, retrying in ${delay}ms...`, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};

// 使用例
const createUserWithRetry = async (db: D1Database, userData: any) => {
  return await retryWithBackoff(async () => {
    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    return await stmt.bind(userData.id, userData.name, userData.email).run();
  });
};
```

## 監視とログ

### 1. クエリパフォーマンスの監視

```typescript
// クエリ実行時間の測定
const measureQueryTime = async <T>(
  queryName: string,
  operation: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    console.log(`Query ${queryName} completed in ${duration}ms`);

    // パフォーマンスログの記録
    if (duration > 1000) {
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Query ${queryName} failed after ${duration}ms:`, error);
    throw error;
  }
};

// 使用例
const getUsersWithMonitoring = async (db: D1Database) => {
  return await measureQueryTime("getUsers", async () => {
    const stmt = db.prepare("SELECT * FROM users");
    return await stmt.all();
  });
};
```

### 2. データベースヘルスチェック

```typescript
// データベースのヘルスチェック
const checkDatabaseHealth = async (
  db: D1Database
): Promise<{
  isHealthy: boolean;
  responseTime: number;
  error?: string;
}> => {
  const startTime = Date.now();

  try {
    // 簡単なクエリでデータベースの応答性をチェック
    const stmt = db.prepare("SELECT 1 as health_check");
    await stmt.first();

    const responseTime = Date.now() - startTime;

    return {
      isHealthy: true,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      isHealthy: false,
      responseTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// 定期的なヘルスチェック
const startHealthCheck = (db: D1Database, intervalMs: number = 60000) => {
  setInterval(async () => {
    const health = await checkDatabaseHealth(db);

    if (!health.isHealthy) {
      console.error("Database health check failed:", health);
      // アラートの送信など
    } else if (health.responseTime > 5000) {
      console.warn(
        "Database response time is slow:",
        health.responseTime + "ms"
      );
    }
  }, intervalMs);
};
```

## データ整合性

### 1. トランザクションの適切な使用

```typescript
// 複数テーブル間の整合性を保つトランザクション
const createUserWithProfile = async (
  db: D1Database,
  userData: {
    id: string;
    name: string;
    email: string;
    profile: {
      bio: string;
      website: string;
    };
  }
) => {
  const userStmt = db.prepare(`
    INSERT INTO users (id, name, email, created_at, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const profileStmt = db.prepare(`
    INSERT INTO user_profiles (user_id, bio, website, created_at, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  try {
    const batch = db.batch([
      userStmt.bind(userData.id, userData.name, userData.email),
      profileStmt.bind(
        userData.id,
        userData.profile.bio,
        userData.profile.website
      ),
    ]);

    const results = await batch;

    // 結果の検証
    if (results.some((result) => !result.success)) {
      throw new Error("Transaction failed");
    }

    return results;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
};
```

### 2. データ検証

```typescript
// データの整合性チェック
const validateUserData = (
  userData: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!userData.id || typeof userData.id !== "string") {
    errors.push("User ID is required and must be a string");
  }

  if (
    !userData.name ||
    typeof userData.name !== "string" ||
    userData.name.trim().length === 0
  ) {
    errors.push("User name is required and must be a non-empty string");
  }

  if (
    !userData.email ||
    typeof userData.email !== "string" ||
    !userData.email.includes("@")
  ) {
    errors.push("Valid email address is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// 検証付きのデータ保存
const createUserWithValidation = async (db: D1Database, userData: any) => {
  const validation = validateUserData(userData);

  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
  }

  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, created_at, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  return await stmt
    .bind(userData.id, userData.name.trim(), userData.email.toLowerCase())
    .run();
};
```

## 関連ドキュメント

- [データベース設計](database-design.md)
- [スキーマリファレンス](schema-reference.md)
- [マイグレーションガイド](migration-guide.md)
- [開発環境セットアップ](development-setup.md)
- [クエリパターン集](query-patterns.md)
