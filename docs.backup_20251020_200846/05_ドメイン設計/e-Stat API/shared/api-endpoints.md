---
title: e-Stat API エンドポイント一覧
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/estat-api
  - specifications
---

# e-Stat API エンドポイント一覧

## 概要

e-Stat API ドメインで提供される API エンドポイントの一覧と基本的な使用方法について説明します。

## 基本情報

e-Stat API の基本設定、アーキテクチャ、データフローについては [アーキテクチャ設計](01-architecture.md) を参照してください。

### 環境変数

```bash
# .env.local
NEXT_PUBLIC_ESTAT_APP_ID=your-actual-app-id
```

## e-Stat API エンドポイント

### 1. 統計リスト取得 (GET_STATS_LIST)

**エンドポイント**: `/getStatsList`

**用途**: 統計表の一覧情報を取得

**パラメータ**:

- `appId`: アプリケーション ID（必須）
- `lang`: 言語設定（J: 日本語、E: 英語）
- `surveyYears`: 調査年月
- `openYears`: 公開年月
- `statsField`: 統計分野
- `statsCode`: 政府統計コード
- `searchWord`: 検索キーワード
- `startPosition`: 開始位置
- `limit`: 取得件数

**詳細**: [get-stats-list.md](apis/get-stats-list.md)

### 2. メタ情報取得 (GET_META_INFO)

**エンドポイント**: `/getMetaInfo`

**用途**: 統計表のメタ情報（分類情報、地域情報、時間軸情報など）を取得

**パラメータ**:

- `appId`: アプリケーション ID（必須）
- `statsDataId`: 統計データ ID（必須）
- `metaGetFlg`: メタデータ取得フラグ（Y/N）
- `cntGetFlg`: 件数取得フラグ（Y/N）

**詳細**: [get-meta-info.md](apis/get-meta-info.md)

### 3. 統計データ取得 (GET_STATS_DATA)

**エンドポイント**: `/getStatsData`

**用途**: 統計表の実際のデータを取得

**パラメータ**:

- `appId`: アプリケーション ID（必須）
- `statsDataId`: 統計データ ID（必須）
- `metaGetFlg`: メタデータ取得フラグ（Y/N）
- `cntGetFlg`: 件数取得フラグ（Y/N）
- `cdCat01-15`: カテゴリコード（最大 15 種類）
- `cdArea`: 地域コード
- `cdTime`: 時間軸コード
- `startPosition`: 開始位置
- `limit`: 取得件数

**詳細**: [get-stats-data.md](apis/get-stats-data.md)

### 4. データカタログ取得 (GET_DATA_CATALOG)

**エンドポイント**: `/getDataCatalog`

**用途**: データカタログ情報を取得

**パラメータ**:

- `appId`: アプリケーション ID（必須）
- `lang`: 言語設定
- `statsField`: 統計分野
- `statsCode`: 政府統計コード

**詳細**: [get-data-catalog.md](apis/get-data-catalog.md)

## 内部 API エンドポイント

### 統計データ関連

#### 統計データ取得

```http
GET /api/stats/data
```

**パラメータ**:

- `statsDataId`: 統計データ ID（必須）
- `categoryFilter`: カテゴリフィルタ
- `yearFilter`: 年度フィルタ
- `areaFilter`: 地域フィルタ
- `limit`: 取得件数

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "values": [...],
    "areas": [...],
    "categories": [...],
    "years": [...]
  }
}
```

#### 利用可能年度取得

```http
GET /api/stats/years
```

**パラメータ**:

- `statsDataId`: 統計データ ID（必須）

**レスポンス**:

```json
{
  "success": true,
  "data": ["2020", "2021", "2022", "2023"]
}
```

#### 都道府県データ取得

```http
GET /api/stats/prefectures
```

**パラメータ**:

- `statsDataId`: 統計データ ID（必須）
- `yearFilter`: 年度フィルタ
- `categoryFilter`: カテゴリフィルタ

**レスポンス**:

```json
{
  "success": true,
  "data": [
    {
      "areaCode": "13000",
      "areaName": "東京都",
      "value": 14000000,
      "unit": "人"
    }
  ]
}
```

### 統計リスト関連

#### 統計リスト検索

```http
GET /api/stats/list
```

**パラメータ**:

- `searchWord`: 検索キーワード
- `limit`: 取得件数
- `startPosition`: 開始位置

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "list": [...],
    "totalCount": 1000,
    "startPosition": 1,
    "limit": 20
  }
}
```

### メタ情報関連

#### メタ情報取得

```http
GET /api/metainfo
```

**パラメータ**:

- `statsDataId`: 統計データ ID（必須）

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "categories": [...],
    "areas": [...],
    "years": [...]
  }
}
```

#### メタ情報保存

```http
POST /api/metainfo/save
```

**リクエストボディ**:

```json
{
  "statsDataId": "0000010101"
}
```

**レスポンス**:

```json
{
  "success": true,
  "message": "メタ情報を保存しました",
  "savedCount": 150
}
```

#### メタ情報検索

```http
GET /api/metainfo/search
```

**パラメータ**:

- `query`: 検索クエリ
- `statsDataId`: 統計データ ID（オプション）

**レスポンス**:

```json
{
  "success": true,
  "data": [
    {
      "statsDataId": "0000010101",
      "statName": "人口推計",
      "title": "都道府県別人口",
      "cat01": "A1101",
      "itemName": "総人口",
      "unit": "人"
    }
  ]
}
```

### ランキングデータ関連

#### ランキングデータ取得

```http
GET /api/rankings/data
```

**パラメータ**:

- `rankingKey`: ランキングキー（必須）
- `timeCode`: 時間コード（必須）
- `level`: 地域レベル（prefecture/municipality）
- `parentCode`: 親地域コード（オプション）

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "rankingKey": "population-total",
    "timeCode": "2023",
    "level": "prefecture",
    "values": [...],
    "metadata": {...}
  }
}
```

## エラーハンドリング

### HTTP ステータスコード

- `200`: 成功
- `400`: リクエストエラー
- `401`: 認証エラー
- `403`: アクセス拒否
- `404`: データが見つからない
- `429`: レート制限
- `500`: サーバーエラー

### エラーレスポンス形式

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATS_DATA_ID",
    "message": "統計データIDが無効です",
    "details": {
      "statsDataId": "invalid-id",
      "expectedFormat": "10桁の数字"
    }
  }
}
```

### エラーコード一覧

| コード                    | 説明                 |
| ------------------------- | -------------------- |
| `INVALID_STATS_DATA_ID`   | 統計データ ID が無効 |
| `INVALID_AREA_CODE`       | 地域コードが無効     |
| `INVALID_CATEGORY_CODE`   | カテゴリコードが無効 |
| `API_RATE_LIMIT_EXCEEDED` | API レート制限超過   |
| `API_CONNECTION_ERROR`    | API 接続エラー       |
| `DATA_NOT_FOUND`          | データが見つからない |
| `DATABASE_ERROR`          | データベースエラー   |
| `VALIDATION_ERROR`        | バリデーションエラー |

## レート制限

### e-Stat API 制限

- **1 日あたり**: 1,000 回
- **1 時間あたり**: 100 回（推奨）
- **同時接続**: 5 接続まで

### 内部 API 制限

- **統計データ取得**: 1 分あたり 60 回
- **メタ情報取得**: 1 分あたり 30 回
- **ランキングデータ取得**: 1 分あたり 120 回

### レート制限エラー

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "レート制限に達しました",
    "details": {
      "limit": 1000,
      "remaining": 0,
      "resetTime": "2024-01-02T00:00:00Z"
    }
  }
}
```

## 認証・認可

### API キー認証

すべての API リクエストには有効な API キーが必要です。

```http
Authorization: Bearer your-api-key
```

または

```http
X-API-Key: your-api-key
```

### 環境変数設定

```bash
# 開発環境
NEXT_PUBLIC_ESTAT_APP_ID=your-dev-app-id

# 本番環境
ESTAT_APP_ID=your-prod-app-id
```

## レスポンス形式

### 成功レスポンス

```json
{
  "success": true,
  "data": {
    // 実際のデータ
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0"
  }
}
```

### ページネーション対応

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "totalCount": 1000,
      "startPosition": 1,
      "limit": 20,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

## 使用例

### 基本的な統計データ取得

```typescript
// 統計データを取得
const response = await fetch(
  "/api/stats/data?statsDataId=0000010101&categoryFilter=A1101&yearFilter=2023"
);
const data = await response.json();

if (data.success) {
  console.log("取得したデータ:", data.data.values);
} else {
  console.error("エラー:", data.error.message);
}
```

### メタ情報の保存

```typescript
// メタ情報を保存
const response = await fetch("/api/metainfo/save", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    statsDataId: "0000010101",
  }),
});

const result = await response.json();
console.log("保存件数:", result.savedCount);
```

### ランキングデータの取得

```typescript
// ランキングデータを取得
const response = await fetch(
  "/api/rankings/data?rankingKey=population-total&timeCode=2023&level=prefecture"
);
const data = await response.json();

if (data.success) {
  console.log("ランキングデータ:", data.data.values);
}
```

## 関連ドキュメント

- [アーキテクチャ設計](01-architecture.md) - システム全体の設計とデータフロー
- [型システム](02-type-system.md) - 型定義の詳細
- [API 仕様詳細](apis/) - 各エンドポイントの詳細仕様
- [サービス仕様](services/) - サービスクラスの実装詳細
- [実装ガイド](../implementation/) - 開発ガイドライン
- [テスト戦略](../testing/) - テスト方針と実装
