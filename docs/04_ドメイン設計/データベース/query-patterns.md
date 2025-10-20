---
title: データベースクエリパターン集
created: 2025-10-17
updated: 2025-10-17
tags:
  - domain/database
  - implementation
  - query-patterns
---

# データベースクエリパターン集

## 概要

stats47 プロジェクトでよく使用されるデータベースクエリパターン、パフォーマンス最適化のテクニック、N+1 問題の回避方法について説明します。

## 基本的なクエリパターン

### 1. ユーザー関連クエリ

#### ユーザー情報の取得

```typescript
// 単一ユーザーの取得
const getUserById = async (db: D1Database, userId: string) => {
  const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
  return await stmt.bind(userId).first();
};

// メールアドレスでユーザー検索
const getUserByEmail = async (db: D1Database, email: string) => {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  return await stmt.bind(email).first();
};

// ユーザー一覧の取得（ページネーション）
const getUsers = async (
  db: D1Database,
  options: {
    limit?: number;
    offset?: number;
    search?: string;
  }
) => {
  const { limit = 20, offset = 0, search } = options;

  let query = "SELECT * FROM users";
  const params: any[] = [];

  if (search) {
    query += " WHERE name LIKE ? OR email LIKE ?";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const stmt = db.prepare(query);
  return await stmt.bind(...params).all();
};
```

#### ユーザーの作成・更新

```typescript
// ユーザーの作成
const createUser = async (
  db: D1Database,
  userData: {
    id: string;
    name: string;
    email: string;
    image?: string;
  }
) => {
  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, image, created_at, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  return await stmt
    .bind(userData.id, userData.name, userData.email, userData.image || null)
    .run();
};

// ユーザー情報の更新
const updateUser = async (
  db: D1Database,
  userId: string,
  updates: {
    name?: string;
    email?: string;
    image?: string;
  }
) => {
  const fields = [];
  const values = [];

  if (updates.name) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.email) {
    fields.push("email = ?");
    values.push(updates.email);
  }
  if (updates.image !== undefined) {
    fields.push("image = ?");
    values.push(updates.image);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(userId);

  const stmt = db.prepare(`
    UPDATE users 
    SET ${fields.join(", ")} 
    WHERE id = ?
  `);

  return await stmt.bind(...values).run();
};
```

### 2. e-Stat メタデータ関連クエリ

#### メタデータの検索

```typescript
// カテゴリ別メタデータ取得
const getMetainfoByCategory = async (
  db: D1Database,
  category: string,
  options: {
    limit?: number;
    offset?: number;
  }
) => {
  const { limit = 50, offset = 0 } = options;

  const stmt = db.prepare(`
    SELECT * FROM estat_metainfo_unique
    WHERE category = ?
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `);

  return await stmt.bind(category, limit, offset).all();
};

// サブカテゴリ別メタデータ取得
const getMetainfoBySubcategory = async (
  db: D1Database,
  subcategory: string
) => {
  const stmt = db.prepare(`
    SELECT * FROM estat_metainfo_unique
    WHERE subcategory = ?
    ORDER BY updated_at DESC
  `);

  return await stmt.bind(subcategory).all();
};

// メタデータの検索（タイトル・説明）
const searchMetainfo = async (
  db: D1Database,
  searchTerm: string,
  options: {
    limit?: number;
    offset?: number;
  }
) => {
  const { limit = 20, offset = 0 } = options;

  const stmt = db.prepare(`
    SELECT * FROM estat_metainfo_unique
    WHERE title LIKE ? OR description LIKE ?
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `);

  return await stmt
    .bind(`%${searchTerm}%`, `%${searchTerm}%`, limit, offset)
    .all();
};
```

#### メタデータの管理

```typescript
// メタデータの保存
const saveMetainfo = async (
  db: D1Database,
  metainfo: {
    stats_data_id: string;
    title: string;
    description?: string;
    category?: string;
    subcategory?: string;
    source?: string;
    last_updated?: string;
  }
) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO estat_metainfo (
      stats_data_id, title, description, category, subcategory, 
      source, last_updated, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  return await stmt
    .bind(
      metainfo.stats_data_id,
      metainfo.title,
      metainfo.description || null,
      metainfo.category || null,
      metainfo.subcategory || null,
      metainfo.source || null,
      metainfo.last_updated || null
    )
    .run();
};

// 重複メタデータの削除
const cleanupDuplicateMetainfo = async (db: D1Database) => {
  const stmt = db.prepare(`
    DELETE FROM estat_metainfo
    WHERE id NOT IN (
      SELECT MIN(id) 
      FROM estat_metainfo 
      GROUP BY stats_data_id, title
    )
  `);

  return await stmt.run();
};
```

### 3. ランキング関連クエリ

#### ランキング設定の取得

```typescript
// ランキング項目の取得
const getRankingItems = async (db: D1Database, rankingKey: string) => {
  const stmt = db.prepare(`
    SELECT * FROM ranking_items
    WHERE ranking_key = ? AND is_active = 1
    ORDER BY sort_order ASC
  `);

  return await stmt.bind(rankingKey).all();
};

// ランキング可視化設定の取得
const getRankingVisualization = async (db: D1Database, rankingKey: string) => {
  const stmt = db.prepare(`
    SELECT * FROM ranking_visualizations
    WHERE ranking_key = ? AND is_active = 1
  `);

  return await stmt.bind(rankingKey).first();
};

// 全ランキング設定の取得
const getAllRankingConfigs = async (db: D1Database) => {
  const stmt = db.prepare(`
    SELECT 
      rv.ranking_key,
      rv.visualization_type,
      rv.config,
      COUNT(ri.id) as item_count
    FROM ranking_visualizations rv
    LEFT JOIN ranking_items ri ON rv.ranking_key = ri.ranking_key AND ri.is_active = 1
    WHERE rv.is_active = 1
    GROUP BY rv.ranking_key, rv.visualization_type, rv.config
    ORDER BY rv.ranking_key
  `);

  return await stmt.all();
};
```

## パフォーマンス最適化

### 1. インデックスの活用

#### 複合インデックスの使用

```sql
-- カテゴリとサブカテゴリでの検索用インデックス
CREATE INDEX idx_estat_metainfo_category_subcategory
ON estat_metainfo(category, subcategory);

-- ランキングキーとアクティブフラグでの検索用インデックス
CREATE INDEX idx_ranking_items_key_active
ON ranking_items(ranking_key, is_active);
```

#### カバリングインデックスの活用

```sql
-- よく使用されるカラムのみを含むインデックス
CREATE INDEX idx_estat_metainfo_list
ON estat_metainfo(category, subcategory, stats_data_id, title, updated_at);
```

### 2. クエリの最適化

#### LIMIT 句の活用

```typescript
// ✅ 良い例: ページネーションでLIMITを使用
const getUsersPaginated = async (
  db: D1Database,
  page: number,
  pageSize: number
) => {
  const offset = (page - 1) * pageSize;
  const stmt = db.prepare(`
    SELECT * FROM users 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `);

  return await stmt.bind(pageSize, offset).all();
};

// ❌ 悪い例: 全データを取得してからフィルタリング
const getUsersBad = async (db: D1Database) => {
  const result = await db.prepare("SELECT * FROM users").all();
  return result.results.slice(0, 20); // メモリ効率が悪い
};
```

#### 適切な WHERE 句の使用

```typescript
// ✅ 良い例: インデックス付きカラムでの絞り込み
const getUsersByCategory = async (db: D1Database, category: string) => {
  const stmt = db.prepare(`
    SELECT * FROM estat_metainfo_unique
    WHERE category = ?
    ORDER BY updated_at DESC
  `);

  return await stmt.bind(category).all();
};

// ❌ 悪い例: 関数を使用した絞り込み（インデックスが効かない）
const getUsersBad = async (db: D1Database, category: string) => {
  const stmt = db.prepare(`
    SELECT * FROM estat_metainfo_unique
    WHERE LOWER(category) = LOWER(?)
    ORDER BY updated_at DESC
  `);

  return await stmt.bind(category).all();
};
```

### 3. バッチ処理

#### 一括挿入

```typescript
// 複数レコードの一括挿入
const batchInsertUsers = async (
  db: D1Database,
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>
) => {
  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, created_at, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  // バッチ処理でトランザクションを使用
  const batch = db.batch(
    users.map((user) => stmt.bind(user.id, user.name, user.email))
  );

  return await batch;
};
```

#### 一括更新

```typescript
// 複数レコードの一括更新
const batchUpdateUsers = async (
  db: D1Database,
  updates: Array<{
    id: string;
    name: string;
  }>
) => {
  const stmt = db.prepare(`
    UPDATE users 
    SET name = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);

  const batch = db.batch(
    updates.map((update) => stmt.bind(update.name, update.id))
  );

  return await batch;
};
```

## N+1 問題の回避

### 1. JOIN を使用した一括取得

```typescript
// ❌ 悪い例: N+1問題が発生
const getUsersWithPostsBad = async (db: D1Database) => {
  const users = await db.prepare("SELECT * FROM users").all();

  // 各ユーザーに対して個別にクエリを実行（N+1問題）
  const usersWithPosts = await Promise.all(
    users.results.map(async (user) => {
      const posts = await db
        .prepare(
          `
        SELECT * FROM posts WHERE user_id = ?
      `
        )
        .bind(user.id)
        .all();

      return { ...user, posts: posts.results };
    })
  );

  return usersWithPosts;
};

// ✅ 良い例: JOINを使用して一括取得
const getUsersWithPosts = async (db: D1Database) => {
  const stmt = db.prepare(`
    SELECT 
      u.id,
      u.name,
      u.email,
      p.id as post_id,
      p.title as post_title,
      p.content as post_content
    FROM users u
    LEFT JOIN posts p ON u.id = p.user_id
    ORDER BY u.id, p.created_at DESC
  `);

  const result = await stmt.all();

  // 結果をグループ化
  const usersMap = new Map();

  result.results.forEach((row) => {
    if (!usersMap.has(row.id)) {
      usersMap.set(row.id, {
        id: row.id,
        name: row.name,
        email: row.email,
        posts: [],
      });
    }

    if (row.post_id) {
      usersMap.get(row.id).posts.push({
        id: row.post_id,
        title: row.post_title,
        content: row.post_content,
      });
    }
  });

  return Array.from(usersMap.values());
};
```

### 2. サブクエリを使用した一括取得

```typescript
// ユーザーとその投稿数を一括取得
const getUsersWithPostCount = async (db: D1Database) => {
  const stmt = db.prepare(`
    SELECT 
      u.*,
      COALESCE(p.post_count, 0) as post_count
    FROM users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) as post_count
      FROM posts
      GROUP BY user_id
    ) p ON u.id = p.user_id
    ORDER BY u.created_at DESC
  `);

  return await stmt.all();
};
```

## トランザクション管理

### 1. 基本的なトランザクション

```typescript
// トランザクションを使用した複数操作
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

  const batch = db.batch([
    userStmt.bind(userData.id, userData.name, userData.email),
    profileStmt.bind(
      userData.id,
      userData.profile.bio,
      userData.profile.website
    ),
  ]);

  return await batch;
};
```

### 2. 条件付きトランザクション

```typescript
// 条件に基づくトランザクション
const updateUserConditionally = async (
  db: D1Database,
  userId: string,
  updates: {
    name?: string;
    email?: string;
  }
) => {
  // まず現在のユーザー情報を取得
  const currentUser = await db
    .prepare(
      `
    SELECT * FROM users WHERE id = ?
  `
    )
    .bind(userId)
    .first();

  if (!currentUser) {
    throw new Error("User not found");
  }

  // 更新が必要な場合のみトランザクションを実行
  const fields = [];
  const values = [];

  if (updates.name && updates.name !== currentUser.name) {
    fields.push("name = ?");
    values.push(updates.name);
  }

  if (updates.email && updates.email !== currentUser.email) {
    fields.push("email = ?");
    values.push(updates.email);
  }

  if (fields.length === 0) {
    return { success: true, message: "No changes needed" };
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(userId);

  const stmt = db.prepare(`
    UPDATE users 
    SET ${fields.join(", ")} 
    WHERE id = ?
  `);

  return await stmt.bind(...values).run();
};
```

## エラーハンドリング

### 1. 基本的なエラーハンドリング

```typescript
// データベース操作のエラーハンドリング
const safeDatabaseOperation = async <T>(
  operation: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    console.error("Database operation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// 使用例
const getUserSafely = async (db: D1Database, userId: string) => {
  return await safeDatabaseOperation(async () => {
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    const user = await stmt.bind(userId).first();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  });
};
```

### 2. リトライ機能付きクエリ

```typescript
// リトライ機能付きのデータベース操作
const retryDatabaseOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        console.warn(
          `Database operation failed, retrying in ${delay}ms...`,
          error
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // 指数バックオフ
      }
    }
  }

  throw lastError!;
};

// 使用例
const createUserWithRetry = async (db: D1Database, userData: any) => {
  return await retryDatabaseOperation(async () => {
    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    return await stmt.bind(userData.id, userData.name, userData.email).run();
  });
};
```

## 関連ドキュメント

- [データベース設計](database-design.md)
- [スキーマリファレンス](schema-reference.md)
- [開発環境セットアップ](development-setup.md)
- [ベストプラクティス](04_ドメイン設計/データベース/best-practices.md)
