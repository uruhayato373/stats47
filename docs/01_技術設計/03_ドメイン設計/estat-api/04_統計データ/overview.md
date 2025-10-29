---
title: stats-data サブドメイン概要
created: 2025-01-18
updated: 2025-10-27
tags:
  - domain/estat-api
  - subdomain/stats-data
---

# stats-data サブドメイン概要

## 目的

stats-data サブドメインは、e-Stat API から取得した統計データを管理し、アプリケーションで利用しやすい形式に変換する責務を持ちます。可視化や分析に必要なデータの整形、表示コンポーネントの提供、フォーム管理機能を提供します。

## 主要な機能

### 1. 統計データの取得と整形

- e-Stat API から統計データを取得（fetchStatsData, fetchFormattedStatsData）
- 構造化された形式への変換（formatStatsData）
- 地域・カテゴリ・年度情報の整形

### 2. UIコンポーネント

- データ取得フォーム（EstatDataFetcher）
- データ表示（EstatDataDisplay, EstatOverview）
- テーブル表示（EstatAreasTable, EstatCategoriesTable, EstatYearsTable, EstatValuesTable）
- 生データ表示（EstatRawData）

### 3. フォーム管理

- react-hook-formとzodによるバリデーション
- URLパラメータとの同期
- カスタムフック（useStatsDataForm）

### 4. 可視化サポート

- チャート用データの生成
- ランキングデータの作成
- 時系列データの整形

## アーキテクチャ

### ディレクトリ構造

```
src/features/estat-api/stats-data/
├── components/                 # UIコンポーネント
│   ├── EstatDataFetcher/      # データ取得フォーム
│   ├── EstatDataDisplay/      # データ表示コンテナ
│   ├── EstatOverview/         # 概要表示
│   ├── EstatAreasTable/       # 地域テーブル
│   ├── EstatCategoriesTable/  # 分類テーブル
│   ├── EstatYearsTable/       # 年度テーブル
│   ├── EstatValuesTable/      # 値テーブル
│   ├── EstatRawData/          # 生データ表示
│   └── index.ts
├── constants/                  # 定数定義
│   ├── categories.ts          # カテゴリ定数
│   └── index.ts
├── hooks/                      # カスタムフック
│   ├── useStatsDataForm.ts    # フォーム管理フック
│   └── index.ts
├── schemas/                    # バリデーションスキーマ
│   └── stats-data-form.schema.ts
├── services/                   # サービス層
│   ├── fetcher.ts             # API通信関数
│   └── formatter.ts           # データ変換関数
├── types/                      # 型定義
│   ├── stats-data-response.ts # レスポンス型
│   └── index.ts
├── utils/                      # ユーティリティ
│   ├── url-builder.ts         # URL構築関数
│   └── index.ts
├── __tests__/                  # テストファイル
└── index.ts                    # エントリーポイント
```

### データフロー

```
ユーザー入力（フォーム）
    │
    ▼
useStatsDataForm (react-hook-form + zod)
    │
    ├─► フォームバリデーション
    ├─► URLパラメータ同期
    └─► 送信処理
            │
            ▼
    fetchStatsData() または fetchFormattedStatsData()
            │
            ├─► executeHttpRequest() → e-Stat API通信
            │       │
            │       ▼
            │   生APIレスポンス (EstatStatsDataResponse)
            │
            └─► formatStatsData() → データ整形
                    │
                    ├─► formatAreas() → 地域情報
                    ├─► formatCategories() → 分類情報
                    ├─► formatYears() → 年度情報
                    └─► formatValues() → 値データ
                            │
                            ▼
                    FormattedEstatData
                            │
                            ▼
                    UI コンポーネント（表示）
```

## 主要なコンポーネントと関数

### UIコンポーネント

#### EstatDataFetcher
- 統計データ取得フォーム
- react-hook-formによるフォーム管理
- リアルタイムバリデーション

#### EstatDataDisplay
- 取得したデータの表示コンテナ
- タブベースの表示切り替え
- 概要、テーブル、生データの表示

#### テーブルコンポーネント
- **EstatAreasTable**: 地域情報テーブル
- **EstatCategoriesTable**: 分類情報テーブル
- **EstatYearsTable**: 年度情報テーブル
- **EstatValuesTable**: 値データテーブル

### サービス関数

#### fetchStatsData()
- e-Stat API からの生データ取得
- HTTP通信の実行
- エラーハンドリング

#### fetchFormattedStatsData()
- データ取得と整形を一括実行
- fetchStatsData() + formatStatsData() の組み合わせ

#### formatStatsData()
- 生APIレスポンスの解析
- 構造化データへの変換
- 可視化用データの生成

### カスタムフック

#### useStatsDataForm
- フォーム状態管理
- バリデーション処理
- URLパラメータ同期

## 型定義

### 主要な型

- `EstatStatsDataResponse`: 生 API レスポンス
- `FormattedStatsData`: 整形済みデータ
- `FormattedValue`: 値データ（dimensions 概念）
- `StatsDataOptions`: 取得オプション
- `FilterOptions`: フィルタリングオプション

### dimensions 概念

```typescript
interface FormattedValue {
  dimensions: {
    area: string; // 地域コード
    time: string; // 時間軸コード
    tab: string; // タブコード
    categories: {
      // 分類情報
      cat01: string;
      cat02?: string;
      // ... cat15まで
    };
  };
  value: number | null; // 値
  unit: string; // 単位
}
```

## 設定

### 環境変数

```bash
# API設定
NEXT_PUBLIC_ESTAT_API_BASE_URL=https://api.e-stat.go.jp/rest/3.0/app/json
NEXT_PUBLIC_ESTAT_APP_ID=your_app_id

# タイムアウト設定
NEXT_PUBLIC_ESTAT_REQUEST_TIMEOUT_MS=30000
NEXT_PUBLIC_ESTAT_CONNECTION_TIMEOUT_MS=10000

# フィルタリング設定
NEXT_PUBLIC_ESTAT_DEFAULT_LIMIT=1000
NEXT_PUBLIC_ESTAT_MAX_LIMIT=10000
```

## 使用例

### UIコンポーネントの使用

#### EstatDataFetcherとEstatDataDisplayの基本使用

```typescript
import { EstatDataFetcher, EstatDataDisplay } from "@/features/estat-api/stats-data";
import { useState } from "react";

function StatsDataPage() {
  const [data, setData] = useState(null);

  const handleDataFetched = (fetchedData) => {
    setData(fetchedData);
  };

  return (
    <div>
      <EstatDataFetcher onDataFetched={handleDataFetched} />
      {data && <EstatDataDisplay data={data} />}
    </div>
  );
}
```

### サービス関数の直接使用

#### 基本的なデータ取得

```typescript
import { fetchFormattedStatsData } from "@/features/estat-api/stats-data";

async function getStatsData() {
  try {
    const data = await fetchFormattedStatsData({
      statsDataId: "0003411595",
      cdCat01: "A1101",
      cdTime: "2020",
      cdArea: "13000", // 東京都
    });

    console.log("取得データ件数:", data.values.length);
    console.log("地域数:", data.dimensions.areas.length);
    console.log("年度数:", data.dimensions.years.length);
  } catch (error) {
    console.error("データ取得エラー:", error);
  }
}
```

#### 生データ取得と整形

```typescript
import { fetchStatsData, formatStatsData } from "@/features/estat-api/stats-data";

async function fetchAndFormatData() {
  // 1. 生データを取得
  const rawData = await fetchStatsData({
    statsDataId: "0003411595",
    cdCat01: "A1101",
  });

  // 2. データを整形
  const formattedData = formatStatsData(rawData);

  return formattedData;
}
```

### カスタムフックの使用

#### useStatsDataFormによるフォーム管理

```typescript
import { useStatsDataForm } from "@/features/estat-api/stats-data";

function StatsDataFormComponent() {
  const { form, isSubmitting, onSubmit } = useStatsDataForm({
    onSuccess: (data) => {
      console.log("データ取得成功:", data);
    },
    onError: (error) => {
      console.error("エラー:", error);
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("statsDataId")} placeholder="統計表ID" />
      <input {...form.register("cdCat01")} placeholder="分類コード" />
      <button type="submit" disabled={isSubmitting}>
        データ取得
      </button>
    </form>
  );
}
```

## エラーハンドリング

### カスタムエラークラス

- `EstatStatsDataFetchError`: API 取得エラー
- `EstatDataFormatError`: データ変換エラー
- `EstatFilterError`: フィルタリングエラー

### エラー処理例

```typescript
import { fetchFormattedStatsData } from "@/features/estat-api/stats-data";

try {
  const data = await fetchFormattedStatsData({
    statsDataId: "0003411595",
    cdCat01: "A1101",
  });
  // データ処理
} catch (error) {
  if (error instanceof Error) {
    console.error("データ取得エラー:", error.message);
  }
  // エラー処理
}
```

## テスト

### テストファイル

- `formatter.test.ts`: データ整形関数のテスト

### テスト実行

```bash
npm test -- src/features/estat-api/stats-data/__tests__
```

## パフォーマンス考慮事項

### 1. データサイズ制御

- 適切なフィルタリングの活用
- ページネーションの実装

### 2. キャッシュ戦略

- 同じ条件での重複取得を避ける
- メモリキャッシュの実装

### 3. 並列処理

- 複数統計表の並列取得
- 非同期処理の最適化

## 可視化サポート

### チャート用データ生成

```typescript
// 時系列チャート用データ
const timeSeriesData = data.values
  .filter((v) => v.dimensions.area === "13000")
  .map((v) => ({
    year: v.dimensions.time,
    value: v.value,
  }));

// ランキング用データ
const rankingData = data.values
  .filter((v) => v.dimensions.time === "2020")
  .sort((a, b) => (b.value || 0) - (a.value || 0))
  .slice(0, 10);
```

### 地域別データ

```typescript
// 都道府県別データ
const prefectureData = data.values
  .filter(
    (v) => v.dimensions.area.length === 5 && v.dimensions.area.endsWith("000")
  )
  .map((v) => ({
    prefecture: v.dimensions.area,
    value: v.value,
  }));
```

## 関連ドキュメント

- [API 仕様](04_ドメイン設計/e-Stat%20API/04_統計データ/specifications/api.md) - get-stats-data API の詳細
- [サービス仕様](04_ドメイン設計/e-Stat%20API/04_統計データ/specifications/service.md) - サービスクラスの実装詳細
- [実装ガイド](implementation/) - 実装に関する詳細ガイド
- [テストガイド](testing/) - テスト戦略と実装

## 今後の拡張予定

1. **リアルタイム更新**: データの自動更新機能
2. **高度なフィルタリング**: 複合条件でのフィルタリング
3. **データ検証**: データ品質の自動チェック
4. **メトリクス**: 処理時間やデータ品質の監視
5. **API 最適化**: より効率的なデータ取得方法の実装
