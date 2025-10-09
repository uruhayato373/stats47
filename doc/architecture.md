# システムアーキテクチャ

## 概要

地域統計ダッシュボードは、Next.js 15 の App Router を使用したフルスタック Web アプリケーションです。クライアントサイドレンダリング（CSR）とサーバーサイドレンダリング（SSR）を組み合わせて、高速でユーザーフレンドリーな体験を提供します。e-Stat API との統合には、型安全性と開発体験を向上させる`@estat/`パッケージを使用しています。

## アーキテクチャ図

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   クライアント    │    │   Next.js App   │    │   e-Stat API    │
│   (ブラウザ)     │◄──►│     Router      │◄──►│   (外部API)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   React 19      │
                       │   Components    │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   @estat/       │    │   Recharts      │
                       │   Packages      │    │   (グラフ表示)   │
                       └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   TypeScript    │
                       │   Type Safety   │
                       └─────────────────┘
```

## データベースアーキテクチャ

### Cloudflare D1 データベース

#### 統合データベース設計

- **データベース名**: `stats47`
- **統合スキーマ**: `database/schemas/main.sql`
- **テーブル構成**:
  - `users`: ユーザー認証・管理
  - `estat_metainfo`: e-Stat メタデータ
  - `estat_data_history`: データ変更履歴
  - `ranking_visualizations`: 地図可視化設定管理

#### 環境別設定

- **開発・本番共通**: Cloudflare D1 のリモートインスタンス
- **バインディング**: `STATS47_DB` (wrangler.toml)

`wrangler.toml` の設定により、ローカル開発環境 (`wrangler dev`) でも、本番環境と同じリモートの D1 データベースに接続します。これにより、開発と本番の環境差異を最小限に抑えています。

#### スキーマ管理

- **統合スキーマ**: 認証、メタデータ、履歴管理を一元化
- **適用コマンド**: `npx wrangler d1 execute stats47 --remote --file=./database/schemas/main.sql`
- **簡易適用スクリプト**: `./database/manage.sh schema` を使用しても、内部的に `wrangler` コマンドが実行され、リモートデータベースにスキーマが適用されます。

### 地図可視化設定データベース設計

#### ranking_visualizations テーブル

都道府県ランキングの可視化設定を管理する専用テーブルです。

**テーブル構造**:

```sql
CREATE TABLE IF NOT EXISTS ranking_visualizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- データ識別（複合キー）
  stats_data_id TEXT NOT NULL,         -- 統計表ID
  cat01 TEXT NOT NULL,                 -- カテゴリコード（estat_metainfoのcat01と対応）

  -- 地図可視化設定
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',

  -- ランキング設定
  ranking_direction TEXT DEFAULT 'desc', -- 'asc', 'desc'

  -- 単位変換設定
  conversion_factor REAL DEFAULT 1,    -- 変換係数（元データ × 係数 = 表示値）
  decimal_places INTEGER DEFAULT 0,    -- 小数点以下桁数

  -- システム情報
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 一意制約
  UNIQUE(stats_data_id, cat01)
);
```

**インデックス**:

```sql
CREATE INDEX IF NOT EXISTS idx_ranking_viz_stats_id ON ranking_visualizations(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_ranking_viz_cat01 ON ranking_visualizations(cat01);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ranking_viz_composite ON ranking_visualizations(stats_data_id, cat01);
```

**設計方針**:

- **専用テーブル方式**: estat_metainfo と分離し、設定項目の拡張が容易
- **単位変換機能**: conversion_factor と decimal_places で柔軟な単位変換に対応
- **デフォルト値**: 設定が存在しない場合も適切なデフォルト値で動作

**単位変換例**:

1. 百万円データを億円で表示: `conversion_factor = 0.01`, `decimal_places = 1`
2. 千人データを万人で表示: `conversion_factor = 0.1`, `decimal_places = 1`
3. 比率データをパーセント表示: `conversion_factor = 100`, `decimal_places = 1`

#### ビュー: メタデータ付きランキング設定

```sql
CREATE VIEW IF NOT EXISTS v_ranking_with_metadata AS
SELECT
  rv.*,
  m.stat_name,
  m.title,
  m.unit as original_unit,
  m.item_name
FROM ranking_visualizations rv
LEFT JOIN estat_metainfo m ON rv.stats_data_id = m.stats_data_id AND rv.cat01 = m.cat01;
```

## 技術スタック詳細

### フロントエンドフレームワーク

#### Next.js 15

- **App Router**: ファイルベースのルーティング
- **Turbopack**: 高速な開発ビルド
- **TypeScript**: 型安全性の確保
- **Tailwind CSS 4**: ユーティリティファースト CSS

#### React 19

- **Hooks**: useState, useEffect, useCallback
- **Server Components**: パフォーマンス最適化
- **Concurrent Features**: 非同期レンダリング

### e-Stat API 統合

#### @estat/パッケージ

- **@estat/types**: e-Stat API の完全な型定義
- **@estat/client**: e-Stat API クライアントライブラリ
- **@estat/utils**: データ処理と変換ユーティリティ

#### 型安全性の特徴

- **完全な API 対応**: e-Stat API の全エンドポイントに対応
- **自動型推論**: TypeScript による厳密な型チェック
- **開発体験向上**: IntelliSense とエラー検出
- **保守性**: 最新の API 仕様への自動対応

### データ可視化

#### Recharts

- **LineChart**: 時系列データの表示
- **BarChart**: カテゴリ別データの表示
- **PieChart**: 比率データの表示
- **ResponsiveContainer**: レスポンシブ対応

#### D3.js

- **データ操作**: 統計データの前処理
- **カスタムチャート**: 特殊な可視化ニーズ

### 状態管理

#### React State

- **Local State**: コンポーネント固有の状態
- **Lifted State**: 親子間での状態共有
- **Context API**: グローバル状態の管理

## ディレクトリ構造

```
src/
├── app/                    # Next.js App Router。ルーティングとページの定義
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # ホームページ
│   ├── [category]/        # カテゴリページ（動的ルーティング）
│   │   └── [subcategory]/ # サブカテゴリページ
│   │       ├── page.tsx   # → dashboard にリダイレクト
│   │       ├── dashboard/ # ダッシュボードページ
│   │       │   ├── page.tsx # → dashboard/00000 にリダイレクト
│   │       │   └── [areaCode]/page.tsx # ダッシュボード（全国・都道府県）
│   │       └── ranking/page.tsx # ランキングページ
│   ├── choropleth/        # コロプレスマップ表示ページ
│   └── estat/             # e-Stat関連の各機能ページ
├── components/             # Reactコンポーネント
│   ├── choropleth/        # コロプレスマップ関連コンポーネント
│   ├── common/            # 共通UIコンポーネント (ボタン、テーブル等)
│   ├── d3/                # D3.jsを利用したチャートコンポーネント
│   ├── dashboard/         # ダッシュボード関連コンポーネント
│   ├── estat/             # e-Statデータ表示関連コンポーネント
│   ├── layout/            # ヘッダーやサイドバーなどのレイアウトコンポーネント
│   └── subcategories/     # サブカテゴリ関連コンポーネント
├── atoms/                  # Jotaiのatom定義
├── config/                 # 設定ファイル (例: カテゴリ定義)
│   └── categories.json
├── contexts/               # React Context
│   └── ThemeContext.tsx   # テーマ状態管理
├── hooks/                  # カスタムフック
├── lib/                    # ユーティリティ関数、クライアントライブラリ
├── providers/              # アプリケーション全体で利用するプロバイダー
├── services/               # 外部APIとの通信サービス
├── types/                  # TypeScriptの型定義
├── middleware.ts           # Next.jsのミドルウェア
└── worker.ts               # Cloudflare Workerのエントリーポイント
```

## e-Stat API 統合アーキテクチャ

### データフロー

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  ユーザー    │───►│ コンポーネント │───►│ @estat/     │───►│  e-Stat    │
│  インターフェース│    │             │    │ クライアント │    │    API     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐    ┌─────────────┐
                    │  型安全な    │    │  生API      │
                    │  データ処理  │    │  レスポンス  │
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
@/lib/estat/types
├── EstatMetaInfoResponse
├── EstatStatsDataResponse
├── EstatStatsListResponse
├── GetMetaInfoParams
├── GetStatsDataParams
├── GetStatsListParams
└── EstatAPIError

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
  GetMetaInfoParams,
  GetStatsDataParams,
} from "@/lib/estat/types";
import { ESTAT_API, ESTAT_ENDPOINTS, ESTAT_APP_ID } from "@/lib/constants";

export class EstatAPIClient {
  private baseUrl: string;
  private appId: string;

  constructor(appId: string = ESTAT_APP_ID) {
    this.baseUrl = ESTAT_API.BASE_URL;
    this.appId = appId;
  }

  private async request<T>(
    endpoint: string,
    params: Record<string, unknown>
  ): Promise<T> {
    // ... (リクエスト共通処理)
  }

  async getMetaInfo(
    params: Omit<GetMetaInfoParams, "appId">
  ): Promise<EstatMetaInfoResponse> {
    return this.request<EstatMetaInfoResponse>(
      ESTAT_ENDPOINTS.GET_META_INFO,
      params
    );
  }

  async getStatsData(
    params: Omit<GetStatsDataParams, "appId">
  ): Promise<EstatStatsDataResponse> {
    return this.request<EstatStatsDataResponse>(
      ESTAT_ENDPOINTS.GET_STATS_DATA,
      params
    );
  }
}

export const estatAPI = new EstatAPIClient();
```

## 認証・セキュリティ

### Cloudflare D1

- **SQLite ベース**: エッジで動作するデータベースとして、アプリケーションのデータを保存します。

### セキュリティ設計

#### API 保護

- **CORS 設定**: 適切なオリジンからのリクエストのみを許可するように設定されています。

#### データ保護

- **プリペアドステートメント**: Cloudflare D1 へのクエリは、SQL インジェクションを防ぐためにプリペアドステートメントを利用することが推奨されます。
- **入力バリデーション**: フロントエンドとバックエンドの両方で、予期せぬ入力からシステムを保護するためのバリデーションが実装されています。
- **HTTPS 通信**: 本番環境では、通信はすべて HTTPS で暗号化され、データの盗聴や改ざんを防ぎます。

## パフォーマンス・スケーラビリティ

### フロントエンド最適化

- **コード分割**: 動的インポートによる遅延読み込み
- **画像最適化**: Next.js Image コンポーネント
- **キャッシュ戦略**: 静的データの効率的な提供

### バックエンド最適化

- **Cloudflare Workers**: エッジでの高速処理
- **D1 データベース**: エッジでのデータアクセス
- **非同期処理**: 並行処理による応答時間短縮

### スケーラビリティ

- **Cloudflare Workers**: 自動的なスケーリング
- **D1 データベース**: グローバル分散
- **CDN**: 静的アセットの高速配信

## 開発・デプロイ

### 開発環境

- **TypeScript**: 型安全性と開発体験の向上
- **ESLint**: コード品質の維持
- **Tailwind CSS**: 効率的なスタイリング

### ビルド・デプロイ

- **Next.js**: 最適化されたビルド
- **Cloudflare Pages**: エッジでのデプロイ
- **環境変数**: 適切な設定管理

## 監視・ログ

### フロントエンド監視

- **Core Web Vitals**: ユーザー体験の測定
- **エラー追跡**: クラッシュレポートの収集
- **パフォーマンス測定**: 読み込み時間の監視

### バックエンド監視

- **API 応答時間**: バックエンド処理の監視
- **エラー率**: システムの健全性確認
- **リソース使用量**: メモリ・CPU 使用率の監視

## API 設計

### e-Stat API 統合

#### 基本情報

- **API 名**: e-Stat API
- **ベース URL**: `https://api.e-stat.go.jp/rest/3.0/app/json`
- **認証**: アプリケーション ID（API キー）
- **データ形式**: JSON
- **制限**: 1 日あたりのリクエスト数制限あり

#### 環境変数

```bash
# .env.local
NEXT_PUBLIC_ESTAT_APP_ID=your-actual-app-id
```

#### API エンドポイント

**統計データ取得**:

```http
GET /getStatsData?appId={appId}&statsDataId={statsDataId}&metaGetFlg=Y&cntGetFlg=N
```

**パラメータ**:

- `appId`: アプリケーション ID（必須）
- `statsDataId`: 統計データ ID（必須）
- `metaGetFlg`: メタデータ取得フラグ（Y/N）
- `cntGetFlg`: 件数取得フラグ（Y/N）

#### エラーハンドリング

**HTTP ステータスコード**:

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

#### レート制限対応

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

### 内部 API エンドポイント

#### ランキング取得 API

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

#### 可視化設定 API

```typescript
// 設定取得
GET / api / visualizations / { id } / settings;
GET / api / visualizations / templates;
GET / api / visualizations / templates / { type };

// 設定保存（管理者用）
POST / api / visualizations;
PUT / api / visualizations / { id };
DELETE / api / visualizations / { id };

// アクセス統計更新
POST / api / visualizations / { id } / view;
```

#### データ取得 API

```typescript
// ランキングデータ取得
GET /api/rankings/{id}/data?year={year}&format={format}

// 比較データ取得
GET /api/rankings/compare?ids={id1,id2,id3}&year={year}

// 時系列データ取得
GET /api/rankings/{id}/timeseries?startYear={start}&endYear={end}
```

### データ変換・処理

#### API データの正規化

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

#### 単位変換ロジック

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

### パフォーマンス最適化

#### キャッシュ戦略

- **ブラウザキャッシュ**: 静的データのキャッシュ
- **API レスポンスキャッシュ**: 短時間のデータキャッシュ
- **サンプルデータ**: オフライン時のフォールバック

#### バッチ処理

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

### API セキュリティ

#### API キーの保護

- **環境変数**: サーバーサイドでのみ使用
- **クライアントサイド**: API キーを直接露出しない
- **ローテーション**: 定期的な API キーの更新

#### 入力検証

```typescript
function validateRegionCode(code: string): boolean {
  const validCodes = [
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "23",
    "27",
    "28",
  ];
  return validCodes.includes(code);
}

function sanitizeApiResponse(data: any): any {
  // XSS対策などのサニタイゼーション
  return JSON.parse(JSON.stringify(data));
}
```

## 今後の拡張予定

### 機能拡張

- **ソーシャルログイン**: 利便性の向上
- **権限管理**: ロールベースアクセス制御
- **API 制限**: レート制限の実装
- **比較・分析機能**: 複数ランキング比較、時系列分析、相関分析
- **ユーザー体験向上**: 検索・フィルタ機能、お気に入り機能、共有機能

### 技術的拡張

- **GraphQL**: 効率的なデータ取得
- **WebSocket**: リアルタイムデータ更新
- **PWA**: オフライン対応とネイティブアプリ体験
- **新しいデータソース**: 他の統計 API、リアルタイムデータ、民間データ
- **データ形式の拡張**: CSV/Excel エクスポート、JSON-LD、GraphQL

## 更新履歴

- **2024-01-XX**: 初版作成
- **2024-01-XX**: e-Stat API 統合の追加
- **2024-01-XX**: @estat/パッケージ統合の追加
- **2024-01-XX**: 認証機能の実装
- **2024-01-XX**: アーキテクチャ図の更新
- **2025-10-01**: API 設計と地図可視化設定データベース設計を統合
