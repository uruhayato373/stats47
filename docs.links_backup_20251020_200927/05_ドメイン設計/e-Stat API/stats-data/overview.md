---
title: stats-data サブドメイン概要
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/estat-api
  - subdomain/stats-data
  - useswr-optimized
---

# stats-data サブドメイン概要

## 目的

stats-data サブドメインは、e-Stat API から取得した統計データを管理し、アプリケーションで利用しやすい形式に変換する責務を持ちます。可視化や分析に必要なデータの整形、フィルタリング、エクスポート機能を提供します。

> **🔄 useSWR 最適化完了** (2025-01-18)
>
> このサブドメインは useSWR による最適化が完了しており、自動キャッシュ管理、重複リクエスト排除、エラーハンドリングの簡素化が実現されています。詳細は[useSWR 最適化実装ガイド](../implementation/useswr-optimization.md)を参照してください。

## 主要な機能

### 1. 統計データの取得と整形

- e-Stat API から統計データを取得
- 構造化された形式への変換
- 地域・カテゴリ・年度情報の整形

### 2. データフィルタリング

- カテゴリ別フィルタリング
- 年度別フィルタリング
- 地域別フィルタリング
- 都道府県データの抽出

### 3. データエクスポート

- CSV 形式でのエクスポート
- 構造化されたデータの提供
- カスタムフォーマット対応

### 4. 可視化サポート

- チャート用データの生成
- ランキングデータの作成
- 時系列データの整形

## アーキテクチャ

### ディレクトリ構造

```
src/lib/estat-api/stats-data/
├── index.ts                    # エントリーポイント
├── fetcher.ts                  # API通信クラス
├── formatter.ts                # データ変換処理
├── filter.ts                   # フィルタリング処理
├── csv-converter.ts            # CSV変換処理
├── helpers.ts                  # ヘルパー関数
├── cache-key.ts                # キャッシュキー生成（useSWR最適化）
├── types.ts                    # 型定義
└── __tests__/
    ├── formatter.test.ts
    ├── filter.test.ts
    └── integration.test.ts
```

### useSWR 最適化による変更点

- **cache-key.ts**: パラメータから一意のキャッシュキーを生成
- **useEstatStatsData**: 統計データ取得を useSWR で管理（新規フック）
- **EstatAPIStatsDataPage**: 手動 fetch 処理から useSWR に移行（63%コード削減）

### データフロー

```
パラメータ
    │
    ▼
generateStatsDataCacheKey() → キャッシュキー生成
    │
    ▼
useSWR(cacheKey, statsDataFetcher) → 自動キャッシュ・リトライ
    │
    ├─► fetch() → 生APIレスポンス
    └─► EstatStatsDataFormatter → 整形済みデータ
            │
            ├─► formatAreas() → 地域情報
            ├─► formatCategories() → 分類情報
            ├─► formatYears() → 年度情報
            └─► formatValues() → 値データ
                    │
                    ▼
            FormattedStatsData
```

### キャッシュ戦略

- **キャッシュ期間**: 5 分間（`dedupingInterval: 300000`）
- **リトライ**: 3 回まで自動リトライ
- **重複排除**: 同じパラメータでの重複リクエストを自動排除
- **バックグラウンド更新**: ネットワーク再接続時に自動再取得

## 主要なコンポーネント

### EstatStatsDataService

- 統計データの取得と整形
- フィルタリング機能
- エラーハンドリング

### EstatStatsDataFormatter

- 生 API レスポンスの解析
- 構造化データへの変換
- 可視化用データの生成

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

### 基本的なデータ取得

```typescript
import { useEstatStatsData } from "@/hooks/estat-api/useEstatStatsData";

function StatsDataComponent() {
  const [params, setParams] = useState(null);
  const { data, error, isLoading, refetch } = useEstatStatsData(params);

  const handleFetchData = () => {
    // 統計データ取得（自動キャッシュ・リトライ）
    setParams({
      appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID,
      statsDataId: "0000010101",
      cdCat01: "A1101",
      cdTime: "2020",
      cdArea: "13000",
    });
  };

  if (isLoading) return <div>データ取得中...</div>;
  if (error) return <div>エラー: {error}</div>;

  return (
    <div>
      <button onClick={handleFetchData}>データ取得</button>
      <div>取得データ件数: {data?.values?.length}</div>
      <div>地域数: {data?.dimensions?.areas?.length}</div>
      <div>年度数: {data?.dimensions?.years?.length}</div>
    </div>
  );
}
```

### フィルタリング（useSWR 版）

```typescript
function StatsDataWithFilters() {
  const [params, setParams] = useState(null);
  const { data, error, isLoading } = useEstatStatsData(params);

  const handlePrefectureData = () => {
    // 都道府県データのみ取得
    setParams({
      appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID,
      statsDataId: "0000010101",
      cdCat01: "A1101",
      cdTime: "2020",
      cdArea: "prefecture", // 都道府県のみ
    });
  };

  const handleYearData = () => {
    // 特定年度のデータを取得
    setParams({
      appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID,
      statsDataId: "0000010101",
      cdCat01: "A1101",
      cdTime: "2020",
    });
  };

  return (
    <div>
      <button onClick={handlePrefectureData}>都道府県データ取得</button>
      <button onClick={handleYearData}>年度データ取得</button>
      {/* 結果表示 */}
    </div>
  );
}
```

### 利用可能な年度リスト取得

```typescript
// 利用可能な年度を取得
const availableYears = await EstatStatsDataService.getAvailableYears(
  "0000010101"
);
console.log("利用可能な年度:", availableYears);
```

### データエクスポート

```typescript
// CSV形式でエクスポート
const csvData = await EstatStatsDataService.exportToCSV("0000010101", {
  categoryFilter: "A1101",
  yearFilter: "2020",
});

// ファイルとしてダウンロード
const blob = new Blob([csvData], { type: "text/csv" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "stats_data.csv";
a.click();
```

## エラーハンドリング

### カスタムエラークラス

- `EstatStatsDataFetchError`: API 取得エラー
- `EstatDataFormatError`: データ変換エラー
- `EstatFilterError`: フィルタリングエラー

### エラー処理例

```typescript
try {
  const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
  // データ処理
} catch (error) {
  if (error instanceof EstatStatsDataFetchError) {
    console.error("データ取得エラー:", error.message);
    console.error("統計表ID:", error.statsDataId);
  }
  // エラー処理
}
```

## テスト

### テストファイル

- `formatter.test.ts`: フォーマッターのテスト
- `service.test.ts`: サービスのテスト

### テスト実行

```bash
npm test -- src/lib/estat-api/stats-data/__tests__
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

- [API 仕様](specifications/api.md) - get-stats-data API の詳細
- [サービス仕様](specifications/service.md) - サービスクラスの実装詳細
- [実装ガイド](implementation/) - 実装に関する詳細ガイド
- [テストガイド](testing/) - テスト戦略と実装

## 今後の拡張予定

1. **リアルタイム更新**: データの自動更新機能
2. **高度なフィルタリング**: 複合条件でのフィルタリング
3. **データ検証**: データ品質の自動チェック
4. **メトリクス**: 処理時間やデータ品質の監視
5. **API 最適化**: より効率的なデータ取得方法の実装
