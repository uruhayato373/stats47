---
title: e-Stat API サブドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - stats47
  - domain
  - data-integration
  - estat-api
  - subdomain
---

# e-Stat API サブドメイン

## 概要

e-Stat API サブドメインは、政府統計の総合窓口（e-Stat）の API との統合を担当するサブドメインです。統計データの取得、メタ情報の管理、API 制限への対応を提供します。

## 役割と責務

### 主要な役割

1. **統計データの取得**

   - 統計データ（getStatsData）の取得
   - メタ情報（getMetaInfo）の取得
   - 統計リスト（getStatsList）の取得

2. **API 制限管理**

   - レート制限の監視
   - リクエスト制限への対応
   - バックオフ戦略の実装

3. **データ変換・正規化**

   - e-Stat API レスポンスの内部形式への変換
   - データ品質の確保
   - エラーハンドリング

4. **キャッシュ戦略**
   - API レスポンスのキャッシュ管理
   - TTL 設定の最適化
   - キャッシュ無効化の実装

## 主要な機能

### 1. 統計データ取得（getStatsData）

```typescript
// 使用例
const parameters = {
  statsDataId: "0000010101",
  cdCat01: "A1101",
  cdArea: "00000",
  cdTime: "2023000000",
};

const statsData = await estatApiService.getStatsData(parameters);
```

**主要パラメータ**:

- `statsDataId`: 統計データ ID
- `cdCat01`: カテゴリコード
- `cdArea`: 地域コード（00000=全国）
- `cdTime`: 時間コード

**レスポンス例**:

```json
{
  "GET_STATS_DATA": {
    "STATISTICAL_DATA": {
      "DATA_INF": {
        "VALUE": [
          {
            "@cat01": "A1101",
            "@area": "00000",
            "@time": "2023000000",
            "$": "125416877"
          }
        ]
      }
    }
  }
}
```

### 2. メタ情報取得（getMetaInfo）

```typescript
// 使用例
const parameters = {
  statsDataId: "0000010101",
};

const metaInfo = await estatApiService.getMetaInfo(parameters);
```

**主要パラメータ**:

- `statsDataId`: 統計データ ID

**レスポンス例**:

```json
{
  "GET_META_INFO": {
    "METADATA_INF": {
      "TABLE_INF": {
        "@id": "0000010101",
        "STAT_NAME": "人口推計",
        "GOV_ORG": "総務省",
        "STATISTICS_NAME": "人口推計"
      }
    }
  }
}
```

### 3. 統計リスト取得（getStatsList）

```typescript
// 使用例
const parameters = {
  cdCat01: "A1101",
  surveyYears: "2023",
};

const statsList = await estatApiService.getStatsList(parameters);
```

**主要パラメータ**:

- `cdCat01`: カテゴリコード
- `surveyYears`: 調査年

## キャッシュ戦略

### TTL 設定

| API 種別         | TTL     | 理由                       |
| ---------------- | ------- | -------------------------- |
| **getMetaInfo**  | 7 日    | メタ情報は変更頻度が低い   |
| **getStatsData** | 24 時間 | 統計データは日次更新       |
| **getStatsList** | 7 日    | 統計リストは変更頻度が低い |

### キャッシュキー生成

```typescript
// キャッシュキーの生成例
const cacheKey = `estat:${apiType}:${hash(parameters)}`;

// 例:
// "estat:getStatsData:abc123def456"
// "estat:getMetaInfo:def789ghi012"
```

### キャッシュ無効化

```typescript
// パターン別無効化
await cacheService.invalidateByPattern("estat:getStatsData:*");

// API種別別無効化
await cacheService.invalidateByApiType(ApiType.GET_STATS_DATA);

// 期限切れ無効化
await cacheService.invalidateExpired();
```

## API 制限への対応

### レート制限

- **制限**: 1 日 1000 リクエスト
- **監視**: リクエスト履歴を D1 で管理
- **対応**: 制限到達時の自動待機

### リトライ戦略

```typescript
// 指数バックオフによるリトライ
const maxRetries = 3;
const baseDelay = 1000; // 1秒

for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    return await callEstatApi();
  } catch (error) {
    if (attempt === maxRetries) throw error;

    const delay = baseDelay * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
```

### エラーハンドリング

```typescript
// エラー種別の判定
switch (error.status) {
  case 429:
    // レート制限エラー
    await waitForRateLimit();
    break;
  case 400:
    // パラメータエラー
    throw new InvalidParameterError(error.message);
  case 404:
    // データ不存在エラー
    throw new DataNotFoundError(error.message);
  case 500:
    // サーバーエラー
    throw new ServerError(error.message);
  default:
    throw new UnknownError(error.message);
}
```

## 実装アーキテクチャ

### ディレクトリ構造

```
src/domain/data-integration/estat-api/
├── adapters/
│   ├── EstatRankingAdapter.ts
│   ├── EstatMetaInfoAdapter.ts
│   └── EstatStatsDataAdapter.ts
├── entities/
│   ├── EstatMetaInfo.ts
│   ├── EstatStatsData.ts
│   └── EstatStatsList.ts
├── value-objects/
│   ├── StatsDataId.ts
│   ├── ApiParameter.ts
│   └── EstatResponse.ts
├── services/
│   ├── MetaInfoService.ts
│   ├── StatsDataService.ts
│   ├── StatsListService.ts
│   └── ApiParamsService.ts
└── repositories/
    └── EstatRepository.ts
```

### 主要コンポーネント

#### 1. EstatApiService

```typescript
export class EstatApiService {
  constructor(
    private readonly repository: EstatRepository,
    private readonly cacheService: EstatCacheService,
    private readonly rateLimitService: RateLimitService
  ) {}

  async getStatsData(parameters: Record<string, any>): Promise<EstatStatsData> {
    // レート制限チェック
    await this.rateLimitService.checkAndWait();

    // キャッシュ確認
    const cached = await this.cacheService.getCachedResponse(
      ApiType.GET_STATS_DATA,
      parameters
    );

    if (cached) {
      return cached;
    }

    // API呼び出し
    const response = await this.repository.getStatsData(parameters);

    // キャッシュ保存
    await this.cacheService.saveResponse(
      ApiType.GET_STATS_DATA,
      parameters,
      response
    );

    return response;
  }
}
```

#### 2. RateLimitService

```typescript
export class RateLimitService {
  constructor(private readonly d1Client: D1Database) {}

  async checkAndWait(): Promise<void> {
    const status = await this.getRateLimitStatus();

    if (status.remaining <= 0) {
      const waitTime = status.resetTime.getTime() - Date.now();
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  async recordRequest(): Promise<void> {
    await this.d1Client
      .prepare(
        `
        INSERT INTO api_requests (timestamp, api_type)
        VALUES (?, ?)
      `
      )
      .bind(new Date().toISOString(), "estat")
      .run();
  }

  private async getRateLimitStatus(): Promise<RateLimitStatus> {
    const today = new Date().toISOString().split("T")[0];
    const result = await this.d1Client
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM api_requests
        WHERE DATE(timestamp) = ? AND api_type = 'estat'
      `
      )
      .bind(today)
      .first();

    const used = result?.count || 0;
    const remaining = Math.max(0, 1000 - used);
    const resetTime = new Date();
    resetTime.setHours(24, 0, 0, 0); // 翌日0時

    return {
      remaining,
      resetTime,
      limit: 1000,
    };
  }
}
```

## データベーススキーマ

### API リクエスト履歴テーブル

```sql
CREATE TABLE api_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME NOT NULL,
  api_type TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  parameters TEXT,
  response_status INTEGER,
  response_time_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_requests_timestamp ON api_requests(timestamp);
CREATE INDEX idx_api_requests_api_type ON api_requests(api_type);
CREATE INDEX idx_api_requests_date ON api_requests(DATE(timestamp));
```

### キャッシュメタデータテーブル

```sql
CREATE TABLE cache_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT UNIQUE NOT NULL,
  api_type TEXT NOT NULL,
  parameters TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cache_metadata_key ON cache_metadata(cache_key);
CREATE INDEX idx_cache_metadata_api_type ON cache_metadata(api_type);
CREATE INDEX idx_cache_metadata_expires ON cache_metadata(expires_at);
```

## 監視とログ

### メトリクス

- **API 呼び出し回数**: 日次、週次、月次
- **レスポンス時間**: 平均、最大、最小
- **エラー率**: 4xx、5xx エラーの割合
- **キャッシュヒット率**: キャッシュの効果測定

### ログ出力

```typescript
// リクエストログ
console.log({
  timestamp: new Date().toISOString(),
  apiType: "getStatsData",
  parameters: { statsDataId: "0000010101" },
  responseTime: 1500,
  status: "success",
});

// エラーログ
console.error({
  timestamp: new Date().toISOString(),
  apiType: "getStatsData",
  parameters: { statsDataId: "0000010101" },
  error: error.message,
  stack: error.stack,
});
```

## テスト戦略

### 単体テスト

```typescript
describe("EstatApiService", () => {
  it("should get stats data from cache", async () => {
    const mockCache = jest.mocked(cacheService);
    mockCache.getCachedResponse.mockResolvedValue(mockStatsData);

    const result = await estatApiService.getStatsData(parameters);

    expect(result).toEqual(mockStatsData);
    expect(mockCache.getCachedResponse).toHaveBeenCalledWith(
      ApiType.GET_STATS_DATA,
      parameters
    );
  });
});
```

### 統合テスト

```typescript
describe("EstatApi Integration", () => {
  it("should handle rate limit correctly", async () => {
    // レート制限のモック
    const mockRateLimit = jest.mocked(rateLimitService);
    mockRateLimit.checkAndWait.mockResolvedValue();

    // API呼び出し
    await estatApiService.getStatsData(parameters);

    expect(mockRateLimit.checkAndWait).toHaveBeenCalled();
  });
});
```

### モックテスト

```typescript
// e-Stat APIのモック
const mockEstatApi = {
  getStatsData: jest.fn().mockResolvedValue(mockResponse),
  getMetaInfo: jest.fn().mockResolvedValue(mockMetaInfo),
  getStatsList: jest.fn().mockResolvedValue(mockStatsList),
};
```

## 関連ドキュメント

- [DataIntegration ドメイン概要](../01_概要.md)
- [エンティティ定義](../02_モデル/エンティティ.md)
- [ドメインサービス定義](../03_サービス/ドメインサービス.md)
- [リポジトリ定義](../04_インフラ/リポジトリ.md)
- [システムアーキテクチャ](../../../01_技術設計/01_システム概要/01_システムアーキテクチャ.md)

---

**更新履歴**:

- 2025-01-20: 初版作成
