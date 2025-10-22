---
title: Data Integration ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - 支援ドメイン
  - Data Integration
---

# Data Integration ドメイン

## 概要

Data Integration ドメインは、stats47 プロジェクトの支援ドメインの一つで、外部データソースとの統合を担当します。e-Stat、World Bank、OECD等の外部APIとの統合、データ取得・変換・正規化、APIパラメータマッピング、キャッシュ管理（R2/D1）、データ品質管理など、外部データとの連携に関するすべての機能を提供します。

### ビジネス価値

- **多様なデータソースの統合**: 複数の外部データソースから統計データを統一的に取得
- **データ品質の保証**: 取得したデータの品質を管理し、信頼性の高い分析を提供
- **パフォーマンス最適化**: キャッシュ戦略により、高速なデータアクセスを実現
- **スケーラビリティ**: 新しいデータソースの追加が容易な設計

## 責務

- 外部 API（e-Stat、World Bank、OECD 等）との統合
- データ取得・変換・正規化
- API パラメータマッピング
- キャッシュ管理（R2/D1）
- データ品質管理
- エラーハンドリングとリトライ
- レート制限管理
- データバージョン管理

## 主要エンティティ

### DataSource（データソース）

外部データソースの定義を管理するエンティティ。

**属性:**
- `id`: データソース ID
- `name`: データソース名
- `type`: データソースタイプ（API/Database/File）
- `endpoint`: エンドポイント URL
- `authentication`: 認証情報
- `rateLimit`: レート制限
- `isActive`: 有効フラグ
- `lastUpdated`: 最終更新日時

### DataAdapter（データアダプター）

データソース固有の変換ロジックを管理するエンティティ。

**属性:**
- `sourceId`: データソース ID
- `transformRules`: 変換ルール
- `mappingConfig`: マッピング設定
- `validationRules`: バリデーションルール
- `version`: アダプターバージョン

### ApiParameter（API パラメータ）

API呼び出しのパラメータを管理するエンティティ。

**属性:**
- `rankingKey`: ランキングキー
- `timeCode`: 時間コード
- `areaCode`: 地域コード
- `params`: パラメータのマップ
- `cacheKey`: キャッシュキー
- `ttl`: 有効期限

### CacheEntry（キャッシュエントリ）

キャッシュされたデータを管理するエンティティ。

**属性:**
- `key`: キャッシュキー
- `data`: キャッシュデータ
- `ttl`: 有効期限
- `lastUpdated`: 最終更新日時
- `metadata`: メタデータ（API 種別、パラメータ等）
- `size`: データサイズ
- `hitCount`: ヒット回数

### CacheStatistics（キャッシュ統計）

キャッシュの使用統計を管理するエンティティ。

**属性:**
- `totalRequests`: 総リクエスト数
- `hitCount`: ヒット数
- `missCount`: ミス数
- `hitRate`: ヒット率
- `averageResponseTime`: 平均応答時間
- `cacheSize`: キャッシュサイズ
- `lastCalculated`: 最終計算日時

## 値オブジェクト

### DataSourceType（データソースタイプ）

データソースのタイプを表現する値オブジェクト。

```typescript
export class DataSourceType {
  private constructor(private readonly value: string) {}

  static readonly API = new DataSourceType("api");
  static readonly DATABASE = new DataSourceType("database");
  static readonly FILE = new DataSourceType("file");
  static readonly ESTAT = new DataSourceType("estat");
  static readonly WORLD_BANK = new DataSourceType("world_bank");
  static readonly OECD = new DataSourceType("oecd");

  static create(value: string): Result<DataSourceType> {
    const validTypes = ["api", "database", "file", "estat", "world_bank", "oecd"];
    if (!validTypes.includes(value)) {
      return Result.fail(`Invalid data source type: ${value}`);
    }
    return Result.ok(new DataSourceType(value));
  }

  getValue(): string {
    return this.value;
  }

  isApi(): boolean {
    return this.value === "api";
  }

  isEstat(): boolean {
    return this.value === "estat";
  }
}
```

### CacheKey（キャッシュキー）

キャッシュキーを表現する値オブジェクト。

```typescript
export class CacheKey {
  private constructor(private readonly value: string) {}

  static create(
    apiType: string,
    parameters: Record<string, any>
  ): Result<CacheKey> {
    if (!apiType || apiType.trim().length === 0) {
      return Result.fail("API type cannot be empty");
    }

    const paramHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(parameters))
      .digest("hex")
      .substring(0, 12);

    const key = `${apiType}:${paramHash}`;
    return Result.ok(new CacheKey(key));
  }

  toString(): string {
    return this.value;
  }

  getApiType(): string {
    return this.value.split(":")[0];
  }

  getParameterHash(): string {
    return this.value.split(":")[1];
  }

  equals(other: CacheKey): boolean {
    return this.value === other.value;
  }
}
```

### TTL（有効期限）

キャッシュの有効期限を表現する値オブジェクト。

```typescript
export class TTL {
  private constructor(private readonly seconds: number) {}

  static create(seconds: number): Result<TTL> {
    if (seconds <= 0) {
      return Result.fail("TTL must be positive");
    }
    if (seconds > 365 * 24 * 60 * 60) { // 1年
      return Result.fail("TTL cannot exceed 1 year");
    }
    return Result.ok(new TTL(seconds));
  }

  static readonly ONE_HOUR = new TTL(60 * 60);
  static readonly ONE_DAY = new TTL(24 * 60 * 60);
  static readonly ONE_WEEK = new TTL(7 * 24 * 60 * 60);
  static readonly ONE_MONTH = new TTL(30 * 24 * 60 * 60);

  getSeconds(): number {
    return this.seconds;
  }

  getMinutes(): number {
    return Math.floor(this.seconds / 60);
  }

  getHours(): number {
    return Math.floor(this.seconds / (60 * 60));
  }

  getDays(): number {
    return Math.floor(this.seconds / (24 * 60 * 60));
  }

  isExpired(createdAt: Date): boolean {
    const now = new Date();
    const expirationTime = new Date(createdAt.getTime() + this.seconds * 1000);
    return now > expirationTime;
  }
}
```

## ドメインサービス

### EstatCacheService

e-Stat APIのキャッシュ管理を実装するドメインサービス。

```typescript
export class EstatCacheService {
  private readonly r2Client: R2Client;
  private readonly d1Client: D1Client;

  constructor(r2Client: R2Client, d1Client: D1Client) {
    this.r2Client = r2Client;
    this.d1Client = d1Client;
  }

  async getCachedResponse(
    apiType: "getMetaInfo" | "getStatsData" | "getStatsList",
    parameters: Record<string, any>
  ): Promise<any> {
    const cacheKeyResult = CacheKey.create(apiType, parameters);
    if (!cacheKeyResult.isSuccess()) {
      throw new Error(cacheKeyResult.getError());
    }

    const cacheKey = cacheKeyResult.getValue();

    // R2からキャッシュを確認
    const cached = await this.r2Client.get(cacheKey.toString());
    if (cached) {
      // ヒット統計を更新
      await this.updateHitStats(cacheKey);
      return JSON.parse(cached);
    }

    // e-Stat APIを呼び出し
    const response = await this.callEstatApi(apiType, parameters);

    // R2にキャッシュ保存
    const ttl = this.getTtlForApiType(apiType);
    await this.r2Client.put(cacheKey.toString(), JSON.stringify(response), {
      metadata: {
        ttl: ttl.getSeconds().toString(),
        createdAt: new Date().toISOString(),
        apiType,
        parameters: JSON.stringify(parameters),
        size: JSON.stringify(response).length,
      },
    });

    // D1にメタデータ保存
    await this.saveCacheMetadata(cacheKey, apiType, parameters);

    return response;
  }

  private getTtlForApiType(apiType: string): TTL {
    const ttlMap = {
      getMetaInfo: TTL.ONE_WEEK,
      getStatsData: TTL.ONE_DAY,
      getStatsList: TTL.ONE_WEEK,
    };
    return ttlMap[apiType as keyof typeof ttlMap] || TTL.ONE_DAY;
  }

  private async updateHitStats(cacheKey: CacheKey): Promise<void> {
    await this.d1Client
      .prepare(
        `
        UPDATE cache_metadata 
        SET hit_count = hit_count + 1, last_hit = datetime('now')
        WHERE cache_key = ?
      `
      )
      .bind(cacheKey.toString())
      .run();
  }

  private async saveCacheMetadata(
    cacheKey: CacheKey,
    apiType: string,
    parameters: Record<string, any>
  ): Promise<void> {
    const ttl = this.getTtlForApiType(apiType);
    const expiresAt = new Date(Date.now() + ttl.getSeconds() * 1000);

    await this.d1Client
      .prepare(
        `
        INSERT INTO cache_metadata 
        (cache_key, api_type, parameters, ttl, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `
      )
      .bind(
        cacheKey.toString(),
        apiType,
        JSON.stringify(parameters),
        ttl.getSeconds(),
        expiresAt.toISOString()
      )
      .run();
  }
}
```

### CacheInvalidationService

キャッシュの無効化を管理するドメインサービス。

```typescript
export class CacheInvalidationService {
  constructor(
    private readonly r2Client: R2Client,
    private readonly d1Client: D1Client
  ) {}

  async invalidateByPattern(pattern: string): Promise<void> {
    // R2のキー一覧を取得
    const keys = await this.r2Client.list({ prefix: pattern });

    // バッチで削除
    const deletePromises = keys.objects.map((obj) =>
      this.r2Client.delete(obj.key)
    );

    await Promise.all(deletePromises);

    // D1のメタデータも削除
    await this.d1Client
      .prepare("DELETE FROM cache_metadata WHERE cache_key LIKE ?")
      .bind(`${pattern}%`)
      .run();
  }

  async invalidateByApiType(apiType: string): Promise<void> {
    await this.invalidateByPattern(`estat:${apiType}:`);
  }

  async invalidateExpired(): Promise<void> {
    const expiredKeys = await this.d1Client
      .prepare(
        `
        SELECT cache_key FROM cache_metadata 
        WHERE expires_at < datetime('now')
      `
      )
      .all();

    for (const row of expiredKeys.results) {
      await this.r2Client.delete(row.cache_key);
    }

    // メタデータも削除
    await this.d1Client
      .prepare('DELETE FROM cache_metadata WHERE expires_at < datetime("now")')
      .run();
  }

  async invalidateByParameters(apiType: string, parameters: Record<string, any>): Promise<void> {
    const cacheKeyResult = CacheKey.create(apiType, parameters);
    if (!cacheKeyResult.isSuccess()) {
      throw new Error(cacheKeyResult.getError());
    }

    const cacheKey = cacheKeyResult.getValue();
    await this.r2Client.delete(cacheKey.toString());
    
    await this.d1Client
      .prepare("DELETE FROM cache_metadata WHERE cache_key = ?")
      .bind(cacheKey.toString())
      .run();
  }
}
```

### DataQualityService

データ品質の管理を実装するドメインサービス。

```typescript
export class DataQualityService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly validationService: ValidationService
  ) {}

  async validateData(data: any, schema: DataSchema): Promise<DataQualityReport> {
    const validationResult = await this.validationService.validate(data, schema);
    
    const qualityScore = this.calculateQualityScore(validationResult);
    const issues = this.identifyIssues(validationResult);
    const recommendations = this.generateRecommendations(issues);

    return DataQualityReport.create({
      score: qualityScore,
      issues,
      recommendations,
      validatedAt: new Date(),
    }).getValue();
  }

  private calculateQualityScore(validationResult: ValidationResult): number {
    const totalChecks = validationResult.getTotalChecks();
    const passedChecks = validationResult.getPassedChecks();
    
    if (totalChecks === 0) {
      return 100;
    }
    
    return Math.round((passedChecks / totalChecks) * 100);
  }

  private identifyIssues(validationResult: ValidationResult): DataIssue[] {
    const issues: DataIssue[] = [];
    
    validationResult.getErrors().forEach(error => {
      issues.push(DataIssue.create({
        type: error.getType(),
        severity: error.getSeverity(),
        message: error.getMessage(),
        field: error.getField(),
      }).getValue());
    });

    return issues;
  }

  private generateRecommendations(issues: DataIssue[]): string[] {
    const recommendations: string[] = [];
    
    issues.forEach(issue => {
      switch (issue.getType()) {
        case "missing_data":
          recommendations.push("Consider implementing data validation at the source");
          break;
        case "invalid_format":
          recommendations.push("Update data transformation rules");
          break;
        case "outlier":
          recommendations.push("Review data collection methodology");
          break;
      }
    });

    return recommendations;
  }
}
```

## リポジトリ

### CacheRepository

キャッシュデータの永続化を抽象化するリポジトリインターフェース。

```typescript
export interface CacheRepository {
  get(key: CacheKey): Promise<any | null>;
  set(key: CacheKey, data: any, ttl: TTL): Promise<void>;
  delete(key: CacheKey): Promise<void>;
  exists(key: CacheKey): Promise<boolean>;
  getStats(): Promise<CacheStatistics>;
  invalidatePattern(pattern: string): Promise<void>;
  cleanup(): Promise<void>;
}
```

### DataSourceRepository

データソース情報の永続化を抽象化するリポジトリインターフェース。

```typescript
export interface DataSourceRepository {
  findById(id: string): Promise<DataSource | null>;
  findAll(): Promise<DataSource[]>;
  findActive(): Promise<DataSource[]>;
  findByType(type: DataSourceType): Promise<DataSource[]>;
  save(dataSource: DataSource): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
```

## ディレクトリ構造

```
src/lib/data-integration/
├── estat-api/
│   ├── adapters/
│   │   ├── EstatRankingAdapter.ts
│   │   └── EstatMetaInfoAdapter.ts
│   ├── entities/
│   │   ├── EstatMetaInfo.ts
│   │   ├── EstatStatsData.ts
│   │   └── EstatStatsList.ts
│   ├── value-objects/
│   │   ├── StatsDataId.ts
│   │   └── ApiParameter.ts
│   ├── services/
│   │   ├── MetaInfoService.ts
│   │   ├── StatsDataService.ts
│   │   ├── StatsListService.ts
│   │   ├── ApiParamsService.ts
│   │   ├── EstatCacheService.ts
│   │   ├── GeoshapeCacheService.ts
│   │   ├── CacheInvalidationService.ts
│   │   └── CacheStatsService.ts
│   └── repositories/
│       └── EstatRepository.ts
├── world-bank/
│   └── adapters/
├── oecd/
│   └── adapters/
├── cache/
│   ├── entities/
│   │   ├── CacheEntry.ts
│   │   └── CacheStatistics.ts
│   ├── value-objects/
│   │   ├── CacheKey.ts
│   │   └── TTL.ts
│   ├── services/
│   │   ├── R2CacheService.ts
│   │   └── D1CacheService.ts
│   └── repositories/
│       └── CacheRepository.ts
├── quality/
│   ├── entities/
│   │   ├── DataQualityReport.ts
│   │   └── DataIssue.ts
│   ├── services/
│   │   ├── DataQualityService.ts
│   │   └── ValidationService.ts
│   └── specifications/
│       └── QualitySpecification.ts
└── adapters/
    ├── DataSourceAdapter.ts
    └── ApiClient.ts
```

## DDDパターン実装例

### エンティティ実装例

```typescript
// src/lib/data-integration/cache/entities/CacheEntry.ts
export class CacheEntry {
  private constructor(
    private readonly key: CacheKey,
    private readonly data: any,
    private readonly ttl: TTL,
    private readonly createdAt: Date,
    private readonly metadata: Map<string, any>,
    private hitCount: number
  ) {}

  static create(props: {
    key: CacheKey;
    data: any;
    ttl: TTL;
    metadata?: Map<string, any>;
  }): Result<CacheEntry> {
    if (!props.data) {
      return Result.fail("Cache data cannot be null");
    }

    return Result.ok(
      new CacheEntry(
        props.key,
        props.data,
        props.ttl,
        new Date(),
        props.metadata || new Map(),
        0
      )
    );
  }

  isExpired(): boolean {
    return this.ttl.isExpired(this.createdAt);
  }

  incrementHitCount(): void {
    this.hitCount++;
  }

  getKey(): CacheKey {
    return this.key;
  }

  getData(): any {
    return this.data;
  }

  getTTL(): TTL {
    return this.ttl;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getHitCount(): number {
    return this.hitCount;
  }

  getMetadata(): ReadonlyMap<string, any> {
    return this.metadata;
  }

  getSize(): number {
    return JSON.stringify(this.data).length;
  }
}
```

### アダプター実装例

```typescript
// src/lib/data-integration/estat-api/adapters/EstatRankingAdapter.ts
export class EstatRankingAdapter implements DataSourceAdapter {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly cacheService: EstatCacheService
  ) {}

  async fetchData(parameters: ApiParameter): Promise<Result<any>> {
    try {
      // キャッシュから取得を試行
      const cached = await this.cacheService.getCachedResponse(
        "getStatsData",
        parameters.toRecord()
      );
      
      if (cached) {
        return Result.ok(cached);
      }

      // APIから取得
      const response = await this.apiClient.get("/api/estat/getStatsData", {
        params: parameters.toRecord(),
      });

      // データ変換
      const transformedData = this.transformResponse(response.data);
      
      return Result.ok(transformedData);
    } catch (error) {
      return Result.fail(`Failed to fetch e-Stat data: ${error.message}`);
    }
  }

  private transformResponse(data: any): any {
    // e-Stat APIのレスポンスを内部形式に変換
    return {
      statistics: data.STATISTICS_DATA,
      metadata: data.METADATA,
      timestamp: new Date().toISOString(),
    };
  }

  async validateParameters(parameters: ApiParameter): Promise<Result<void>> {
    if (!parameters.getRankingKey()) {
      return Result.fail("Ranking key is required");
    }
    if (!parameters.getTimeCode()) {
      return Result.fail("Time code is required");
    }
    return Result.ok();
  }
}
```

## ベストプラクティス

### 1. キャッシュ戦略

- API種別に応じた適切なTTL設定
- キャッシュ無効化の自動化
- キャッシュ統計の監視

### 2. エラーハンドリング

- リトライロジックの実装
- レート制限の適切な処理
- フォールバック戦略の準備

### 3. データ品質管理

- 入力データのバリデーション
- 異常値の検出と処理
- データ品質レポートの生成

### 4. パフォーマンス最適化

- 並列データ取得の活用
- バッチ処理の最適化
- メモリ使用量の監視

## 関連ドメイン

- **Ranking ドメイン**: 取得したデータの分析
- **Area Management ドメイン**: 地域データの管理

---

**更新履歴**:

- 2025-01-20: 初版作成
