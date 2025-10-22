---
title: e-Stat API データベース仕様
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/database
  - domain/estat-api
  - specifications
---

# e-Stat API データベース仕様

## 概要

e-Stat API ドメインで使用されるデータベース（Cloudflare D1）の仕様について説明します。メタ情報の永続化、データアクセスパターン、エラーハンドリングについて詳述します。

## データベース構成

### Cloudflare D1 Database

```typescript
// データベース設定
Cloudflare D1 Database
├── テーブル: estat_metainfo
├── 用途: メタ情報の永続化
└── 特徴: サーバーレスSQL
```

### estat_metainfo テーブル

e-Stat API から取得したメタ情報を永続化するためのテーブルです。

```sql
-- estat_metainfo テーブル構造（推定）
CREATE TABLE estat_metainfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  stat_name TEXT,
  title TEXT,
  cat01 TEXT,
  item_name TEXT,
  unit TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_estat_metainfo_stats_data_id ON estat_metainfo(stats_data_id);
CREATE INDEX idx_estat_metainfo_cat01 ON estat_metainfo(cat01);
```

## データアクセスパターン

### Repository Pattern

データアクセスの抽象化を提供します。

```typescript
interface MetadataRepository {
  save(metadata: Metadata[]): Promise<void>;
  findByStatsId(statsDataId: string): Promise<Metadata[]>;
  search(query: SearchQuery): Promise<Metadata[]>;
}

class D1MetadataRepository implements MetadataRepository {
  constructor(private db: D1Database) {}

  async save(metadata: Metadata[]): Promise<void> {
    // D1Database実装
    const stmt = this.db.prepare(`
      INSERT INTO estat_metainfo 
      (stats_data_id, stat_name, title, cat01, item_name, unit)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of metadata) {
      await stmt
        .bind(
          item.statsDataId,
          item.statName,
          item.title,
          item.cat01,
          item.itemName,
          item.unit
        )
        .run();
    }
  }

  async findByStatsId(statsDataId: string): Promise<Metadata[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM estat_metainfo 
      WHERE stats_data_id = ?
      ORDER BY cat01, item_name
    `);

    const result = await stmt.bind(statsDataId).all();
    return result.results as Metadata[];
  }

  async search(query: SearchQuery): Promise<Metadata[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM estat_metainfo 
      WHERE stats_data_id LIKE ? 
      OR stat_name LIKE ? 
      OR title LIKE ?
      ORDER BY stats_data_id, cat01
    `);

    const searchParam = `%${query.term}%`;
    const result = await stmt.bind(searchParam, searchParam, searchParam).all();
    return result.results as Metadata[];
  }
}
```

### EstatMetaInfoService のデータベース操作

```typescript
class EstatMetaInfoService {
  constructor(private db: D1Database) {}

  // パブリックメソッド
  async processAndSaveMetaInfo(statsDataId: string): Promise<ProcessResult> {
    // 1. e-Stat APIからメタ情報を取得
    const rawMetaInfo = await this.fetchMetaInfoFromAPI(statsDataId);

    // 2. CSV形式に変換
    const csvData = await this.transformToCSVFormat(rawMetaInfo);

    // 3. データベースに保存
    await this.saveTransformedData(csvData, statsDataId);

    return { success: true, processedCount: csvData.length };
  }

  async getSavedMetadataByStatsId(
    statsDataId: string
  ): Promise<SavedMetadata[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM estat_metainfo 
      WHERE stats_data_id = ?
      ORDER BY cat01, item_name
    `);

    const result = await stmt.bind(statsDataId).all();
    return result.results as SavedMetadata[];
  }

  async searchMetadata(query: SearchQuery): Promise<SearchResult[]> {
    const stmt = this.db.prepare(`
      SELECT DISTINCT stats_data_id, stat_name, title, COUNT(*) as item_count
      FROM estat_metainfo 
      WHERE stats_data_id LIKE ? 
      OR stat_name LIKE ? 
      OR title LIKE ?
      GROUP BY stats_data_id, stat_name, title
      ORDER BY stats_data_id
    `);

    const searchParam = `%${query.term}%`;
    const result = await stmt.bind(searchParam, searchParam, searchParam).all();
    return result.results as SearchResult[];
  }

  async getMetadataSummary(statsDataId: string): Promise<MetadataSummary> {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT cat01) as categories_count,
        MIN(created_at) as first_created,
        MAX(updated_at) as last_updated
      FROM estat_metainfo 
      WHERE stats_data_id = ?
    `);

    const result = await stmt.bind(statsDataId).first();
    return result as MetadataSummary;
  }

  // プライベートメソッド
  private async transformToCSVFormat(
    rawMetaInfo: RawMetaInfo
  ): Promise<CSVFormatData[]> {
    // e-Stat APIのレスポンスをCSV形式に変換
    const csvData: CSVFormatData[] = [];

    if (rawMetaInfo.GET_META_INFO?.METADATA_INF?.CLASS_INF) {
      for (const classInfo of rawMetaInfo.GET_META_INFO.METADATA_INF
        .CLASS_INF) {
        csvData.push({
          statsDataId:
            rawMetaInfo.GET_META_INFO.METADATA_INF.STATISTICS_NAME
              ?.STATISTICS_NAME || "",
          statName:
            rawMetaInfo.GET_META_INFO.METADATA_INF.STATISTICS_NAME
              ?.STATISTICS_NAME || "",
          title:
            rawMetaInfo.GET_META_INFO.METADATA_INF.STATISTICS_NAME?.TITLE || "",
          cat01: classInfo.CLASS_OBJ?.[0]?.CLASS || "",
          itemName: classInfo.CLASS_OBJ?.[0]?.CLASS_NAME || "",
          unit: classInfo.CLASS_OBJ?.[0]?.UNIT || "",
        });
      }
    }

    return csvData;
  }

  private async saveTransformedData(
    data: CSVFormatData[],
    statsDataId: string
  ): Promise<void> {
    // バッチ処理でデータを保存
    const batchSize = 100;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await this.processBatch(batch, statsDataId);
    }
  }

  private async processBatch(
    batch: CSVFormatData[],
    statsDataId: string
  ): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO estat_metainfo 
      (stats_data_id, stat_name, title, cat01, item_name, unit, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    for (const item of batch) {
      await stmt
        .bind(
          item.statsDataId,
          item.statName,
          item.title,
          item.cat01,
          item.itemName,
          item.unit
        )
        .run();
    }
  }

  private async findRankingKey(
    statsDataId: string,
    cat01: string
  ): Promise<string | null> {
    const stmt = this.db.prepare(`
      SELECT ranking_key FROM estat_ranking_config 
      WHERE stats_data_id = ? AND cat01 = ?
      LIMIT 1
    `);

    const result = await stmt.bind(statsDataId, cat01).first();
    return result?.ranking_key || null;
  }
}
```

## エラーハンドリング

### データベースエラーの定義

```typescript
enum DatabaseErrorType {
  CONNECTION_FAILED = "connection_failed",
  QUERY_FAILED = "query_failed",
  CONSTRAINT_VIOLATION = "constraint_violation",
  TIMEOUT = "timeout",
  PERMISSION_DENIED = "permission_denied",
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
```

### エラーハンドリングの実装

```typescript
class DatabaseErrorHandler {
  static handleDatabaseError(error: unknown, context: string): ApiError {
    if (error instanceof DatabaseError) {
      return {
        level: ErrorLevel.CRITICAL,
        code: "DATABASE_ERROR",
        message: "Database operation failed",
        details: {
          context,
          errorType: error.type,
          originalError: error.originalError?.message,
        },
        timestamp: new Date(),
      };
    }

    // SQLite固有のエラー
    if (error instanceof Error && error.message.includes("SQLITE")) {
      return {
        level: ErrorLevel.CRITICAL,
        code: "SQLITE_ERROR",
        message: "SQLite operation failed",
        details: { context, sqliteError: error.message },
        timestamp: new Date(),
      };
    }

    return {
      level: ErrorLevel.CRITICAL,
      code: "UNKNOWN_DATABASE_ERROR",
      message: "An unexpected database error occurred",
      details: { context, error: String(error) },
      timestamp: new Date(),
    };
  }
}
```

## パフォーマンス最適化

### 1. インデックス戦略

```sql
-- 主要なクエリパターンに基づくインデックス
CREATE INDEX idx_estat_metainfo_stats_data_id ON estat_metainfo(stats_data_id);
CREATE INDEX idx_estat_metainfo_cat01 ON estat_metainfo(cat01);
CREATE INDEX idx_estat_metainfo_search ON estat_metainfo(stats_data_id, stat_name, title);
CREATE INDEX idx_estat_metainfo_updated ON estat_metainfo(updated_at);
```

### 2. バッチ処理

```typescript
class BatchProcessor {
  static async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 100
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(batch.map(processor));

      results.push(
        ...batchResults
          .filter(
            (result): result is PromiseFulfilledResult<R> =>
              result.status === "fulfilled"
          )
          .map((result) => result.value)
      );
    }

    return results;
  }
}
```

### 3. 接続プール管理

```typescript
class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private connections: Map<string, D1Database> = new Map();

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  getConnection(databaseId: string): D1Database {
    if (!this.connections.has(databaseId)) {
      // 実際の接続作成ロジック
      const connection = this.createConnection(databaseId);
      this.connections.set(databaseId, connection);
    }
    return this.connections.get(databaseId)!;
  }

  private createConnection(databaseId: string): D1Database {
    // Cloudflare D1の接続作成
    return {} as D1Database; // 実際の実装
  }
}
```

## 監視・ログ戦略

### 1. クエリパフォーマンス監視

```typescript
class QueryPerformanceMonitor {
  static async executeWithMonitoring<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      console.log(`Query ${queryName} completed in ${duration}ms`);

      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Query ${queryName} failed after ${duration}ms:`, error);
      throw error;
    }
  }
}
```

### 2. データベースメトリクス

```typescript
interface DatabaseMetrics {
  totalQueries: number;
  averageQueryTime: number;
  errorRate: number;
  connectionPoolSize: number;
  lastUpdated: Date;
}

class DatabaseMetricsCollector {
  private metrics: DatabaseMetrics = {
    totalQueries: 0,
    averageQueryTime: 0,
    errorRate: 0,
    connectionPoolSize: 0,
    lastUpdated: new Date(),
  };

  recordQuery(duration: number, success: boolean): void {
    this.metrics.totalQueries++;
    this.metrics.averageQueryTime =
      (this.metrics.averageQueryTime + duration) / 2;

    if (!success) {
      this.metrics.errorRate =
        (this.metrics.errorRate * (this.metrics.totalQueries - 1) + 1) /
        this.metrics.totalQueries;
    }

    this.metrics.lastUpdated = new Date();
  }

  getMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }
}
```

## 関連ドキュメント

- [e-Stat API アーキテクチャ設計](../estat-api/architecture.md)
- [データベース設計書](../database/specifications/database-design.md)
- [スキーマリファレンス](../database/specifications/schema-reference.md)
- [マイグレーションガイド](../database/specifications/migration-guide.md)

---

**最終更新**: 2025 年 1 月 18 日  
**バージョン**: 1.0.0  
**作成者**: Stats47 開発チーム
