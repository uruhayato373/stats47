# API設計ドキュメント

## 概要

stats47プロジェクトのAPI設計について説明します。e-Stat API連携、内部APIエンドポイント、データ変換・処理、パフォーマンス最適化、セキュリティについて詳述します。

## e-Stat API統合

### 基本情報

- **API 名**: e-Stat API
- **ベース URL**: `https://api.e-stat.go.jp/rest/3.0/app/json`
- **認証**: アプリケーション ID（API キー）
- **データ形式**: JSON
- **制限**: 1 日あたりのリクエスト数制限あり

### 環境変数

```bash
# .env.local
NEXT_PUBLIC_ESTAT_APP_ID=your-actual-app-id
```

### API エンドポイント

#### 統計データ取得

```http
GET /getStatsData?appId={appId}&statsDataId={statsDataId}&metaGetFlg=Y&cntGetFlg=N
```

**パラメータ**:

- `appId`: アプリケーション ID（必須）
- `statsDataId`: 統計データ ID（必須）
- `metaGetFlg`: メタデータ取得フラグ（Y/N）
- `cntGetFlg`: 件数取得フラグ（Y/N）

### エラーハンドリング

#### HTTP ステータスコード

- `200`: 成功
- `400`: リクエストエラー
- `401`: 認証エラー
- `403`: アクセス拒否
- `404`: データが見つからない
- `429`: レート制限
- `500`: サーバーエラー

#### データ取得フロー

```typescript
try {
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return processApiData(data);
} catch (error) {
  console.error("API呼び出しエラー:", error);

  // フォールバックデータを使用
  return getFallbackData();
}
```

### レート制限対応

```typescript
class RateLimiter {
  private requests: number = 0;
  private resetTime: number = Date.now() + 24 * 60 * 60 * 1000; // 24時間

  async checkLimit(): Promise<boolean> {
    if (Date.now() > this.resetTime) {
      this.requests = 0;
      this.resetTime = Date.now() + 24 * 60 * 60 * 1000;
    }

    if (this.requests >= 1000) {
      // 1日1000回制限
      return false;
    }

    this.requests++;
    return true;
  }
}
```

## 内部APIエンドポイント

### ランキング取得API

```typescript
// カテゴリ一覧取得
GET /api/rankings/categories
GET /api/rankings/categories/{mainCategory}

// ランキング一覧取得
GET /api/rankings?category={category}&limit={limit}&offset={offset}
GET /api/rankings/featured
GET /api/rankings/popular

// 特定ランキング取得
GET /api/rankings/{id}
GET /api/rankings/{id}/data

// 検索
GET /api/rankings/search?q={query}&category={category}&dataType={type}
```

### 可視化設定API

```typescript
// 設定取得
GET /api/visualizations/{id}/settings
GET /api/visualizations/templates
GET /api/visualizations/templates/{type}

// 設定保存（管理者用）
POST /api/visualizations
PUT /api/visualizations/{id}
DELETE /api/visualizations/{id}

// アクセス統計更新
POST /api/visualizations/{id}/view
```

### データ取得API

```typescript
// ランキングデータ取得
GET /api/rankings/{id}/data?year={year}&format={format}

// 比較データ取得
GET /api/rankings/compare?ids={id1,id2,id3}&year={year}

// 時系列データ取得
GET /api/rankings/{id}/timeseries?startYear={start}&endYear={end}
```

## データ変換・処理

### API データの正規化

```typescript
function processApiData(apiResponse: any): NormalizedData {
  const { DATA, TABLE_INF } = apiResponse.GET_STATS_DATA.STATISTICAL_DATA;

  return {
    population: extractPopulationData(DATA.VALUE),
    gdp: extractGdpData(DATA.VALUE),
    unemployment: extractUnemploymentData(DATA.VALUE),
    demographics: extractDemographicsData(DATA.VALUE),
    metadata: {
      source: "e-Stat API",
      lastUpdated: new Date().toISOString(),
      tableInfo: TABLE_INF,
    },
  };
}
```

### 単位変換ロジック

```typescript
interface RankingSettings {
  mapColorScheme: string;
  mapDivergingMidpoint: string;
  rankingDirection: "asc" | "desc";
  conversionFactor: number;
  decimalPlaces: number;
}

function convertAndFormatValue(
  rawValue: number,
  conversionFactor: number,
  decimalPlaces: number
): number {
  const convertedValue = rawValue * conversionFactor;
  return Number(convertedValue.toFixed(decimalPlaces));
}

// 使用例
const settings: RankingSettings = {
  mapColorScheme: "interpolateBlues",
  mapDivergingMidpoint: "zero",
  rankingDirection: "desc",
  conversionFactor: 0.01, // 百万円 → 億円
  decimalPlaces: 1,
};

const rawGdp = 5420000; // 5,420,000百万円
const displayValue = convertAndFormatValue(
  rawGdp,
  settings.conversionFactor,
  settings.decimalPlaces
);
console.log(displayValue); // 54200.0（億円）
```

## パフォーマンス最適化

### キャッシュ戦略

- **ブラウザキャッシュ**: 静的データのキャッシュ
- **API レスポンスキャッシュ**: 短時間のデータキャッシュ
- **サンプルデータ**: オフライン時のフォールバック

### バッチ処理

```typescript
async function batchFetchData(regionCodes: string[]): Promise<RegionData[]> {
  const batchSize = 5; // 同時リクエスト数制限
  const results: RegionData[] = [];

  for (let i = 0; i < regionCodes.length; i += batchSize) {
    const batch = regionCodes.slice(i, i + batchSize);
    const batchPromises = batch.map((code) => fetchRegionData(code));

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // レート制限を考慮した待機
    if (i + batchSize < regionCodes.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

## APIセキュリティ

### API キーの保護

- **環境変数**: サーバーサイドでのみ使用
- **クライアントサイド**: API キーを直接露出しない
- **ローテーション**: 定期的な API キーの更新

### 入力検証

```typescript
function validateRegionCode(code: string): boolean {
  const validCodes = [
    "11", "12", "13", "14", "15", "16", "17", "23", "27", "28",
  ];
  return validCodes.includes(code);
}

function sanitizeApiResponse(data: any): any {
  // XSS対策などのサニタイゼーション
  return JSON.parse(JSON.stringify(data));
}
```

## e-Stat API 統合アーキテクチャ

### データフロー

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  ユーザー    │───►│ コンポーネント │───►│ estat-api   │───►│  e-Stat    │
│  インターフェース│    │             │    │ クライアント │    │    API     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐    ┌─────────────┐
                    │  サービス層  │    │  生API      │
                    │  (lib/estat) │    │  レスポンス  │
                    └─────────────┘    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  可視化     │
                    │  コンポーネント │
                    └─────────────┘
```

### 型定義の階層

```
src/lib/estat/types/
├── catalog-response.ts
├── errors.ts (EstatAPIError, APIResponseError)
├── formatted.ts
├── list-response.ts (EstatStatsListResponse)
├── meta-response.ts (EstatMetaInfoResponse)
├── metainfo.ts
├── parameters.ts (GetMetaInfoParams, GetStatsDataParams, GetStatsListParams)
├── processed.ts
├── raw-response.ts (EstatStatsDataResponse)
└── index.ts

src/types/
├── choropleth.ts
├── index.ts
├── prefecture.ts
├── subcategory.ts
└── topojson.ts
```

### API クライアントの実装

API クライアントは `src/services/estat-api.ts` に実装されています。

```typescript
// src/services/estat-api.ts
import {
  EstatMetaInfoResponse,
  EstatStatsDataResponse,
  EstatStatsListResponse,
  GetMetaInfoParams,
  GetStatsDataParams,
  GetStatsListParams,
  EstatAPIError,
  APIResponseError,
} from "@/lib/estat/types";
import { ESTAT_API, ESTAT_ENDPOINTS, ESTAT_APP_ID } from "@/lib/constants";

/**
 * e-STAT APIクライアント
 */
export class EstatAPIClient {
  private baseUrl: string;
  private appId: string;

  constructor(appId: string = ESTAT_APP_ID) {
    this.baseUrl = ESTAT_API.BASE_URL;
    this.appId = appId;
  }

  /**
   * APIリクエストの共通処理
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, unknown>
  ): Promise<T> {
    try {
      const searchParams = new URLSearchParams({
        appId: this.appId,
        lang: ESTAT_API.DEFAULT_LANG,
        dataFormat: ESTAT_API.DATA_FORMAT,
        ...params,
      });

      const url = `${this.baseUrl}${endpoint}?${searchParams.toString()}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25秒でタイムアウト

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIResponseError(
          `HTTP error! status: ${response.status}`,
          response.status
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof APIResponseError) {
        throw error;
      }
      throw new EstatAPIError(`API request failed: ${error}`);
    }
  }

  /**
   * メタ情報取得
   */
  async getMetaInfo(
    params: Omit<GetMetaInfoParams, "appId">
  ): Promise<EstatMetaInfoResponse> {
    return this.request<EstatMetaInfoResponse>(
      ESTAT_ENDPOINTS.GET_META_INFO,
      params
    );
  }

  /**
   * 統計データ取得
   */
  async getStatsData(
    params: Omit<GetStatsDataParams, "appId">
  ): Promise<EstatStatsDataResponse> {
    return this.request<EstatStatsDataResponse>(
      ESTAT_ENDPOINTS.GET_STATS_DATA,
      params
    );
  }

  /**
   * 統計リスト取得
   */
  async getStatsList(
    params: Omit<GetStatsListParams, "appId">
  ): Promise<EstatStatsListResponse> {
    return this.request<EstatStatsListResponse>(
      ESTAT_ENDPOINTS.GET_STATS_LIST,
      params
    );
  }
}

export const estatAPI = new EstatAPIClient();
```

## 関連ドキュメント

### システム設計
- [システムアーキテクチャ](../01_概要/02_アーキテクチャ.md) - システム全体の設計
- [データベース設計](./データベース設計.md) - データベーススキーマの詳細

### 開発ガイド
- [コーディング規約](../02_開発/01_コーディング規約.md) - 開発標準
- [コンポーネントガイド](../02_開発/02_コンポーネントガイド.md) - コンポーネント設計

### 要件定義
- [機能要件定義](../03_要件定義/02_機能要件.md) - 実装する機能の詳細
- [非機能要件定義](../03_要件定義/03_非機能要件.md) - パフォーマンス、セキュリティ要件

---

**作成日**: 2024年10月14日  
**最終更新日**: 2024年10月14日  
**バージョン**: 1.0
