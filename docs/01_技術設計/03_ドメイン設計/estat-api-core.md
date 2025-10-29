---
title: e-Stat API 開始ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/estat-api
  - implementation
---

# e-Stat API 開始ガイド

## 概要

このガイドでは、e-Stat API ライブラリの基本的な使用方法から、実際のデータ取得までを段階的に説明します。

## 前提条件

### 必要な環境

- Node.js 18 以上
- TypeScript 4.5 以上
- Next.js 13 以上（App Router 対応）

### 必要な依存関係

```bash
npm install @types/node
```

## セットアップ

### 1. 環境変数の設定

`.env.local`ファイルを作成し、e-Stat API のアプリケーション ID を設定します。

```bash
# .env.local
NEXT_PUBLIC_ESTAT_APP_ID=your-actual-app-id
```

### 2. アプリケーション ID の取得

1. [e-Stat API](https://www.e-stat.go.jp/api/)にアクセス
2. ユーザー登録（無料）
3. アプリケーション登録
4. アプリケーション ID を取得

### 3. ライブラリのインポート

```typescript
import {
  EstatStatsDataService,
  EstatStatsListService,
  EstatMetaInfoService,
} from "@/infrastructure/estat";
```

## 基本的な使用方法

### 1. 統計リストの取得

利用可能な統計表を検索します。

```typescript
// 統計表を検索
const statsList = await EstatStatsListService.getAndFormatStatsList({
  searchWord: "人口",
  limit: 10,
});

console.log("検索結果:", statsList);
```

**レスポンス例**:

```typescript
{
  list: [
    {
      statsDataId: "0000010101",
      title: "人口推計",
      description: "都道府県別人口推計",
      updatedAt: "2024-01-01"
    }
  ],
  totalCount: 100,
  startPosition: 1,
  limit: 10
}
```

### 2. 統計データの取得

統計表から実際のデータを取得します。

```typescript
// 統計データを取得
const statsData = await EstatStatsDataService.getAndFormatStatsData(
  "0000010101", // 統計表ID
  {
    categoryFilter: "A1101", // 総人口
    yearFilter: "2023", // 2023年
    areaFilter: "13000", // 東京都
  }
);

console.log("取得したデータ:", statsData);
```

**レスポンス例**:

```typescript
{
  values: [
    {
      areaCode: "13000",
      areaName: "東京都",
      value: 14000000,
      unit: "人",
      categoryCode: "A1101",
      categoryName: "総人口",
      timeCode: "2023",
      timeName: "2023年"
    }
  ],
  areas: [...],
  categories: [...],
  years: [...]
}
```

### 3. メタ情報の取得

統計表の構造情報を取得します。

```typescript
// メタ情報を取得
const metaInfo = await EstatMetaInfoService.getMetaInfo("0000010101");

console.log("メタ情報:", metaInfo);
```

**レスポンス例**:

```typescript
{
  categories: [
    {
      code: "A1101",
      name: "総人口",
      level: 1
    }
  ],
  areas: [
    {
      code: "13000",
      name: "東京都",
      level: 1
    }
  ],
  years: [
    {
      code: "2023",
      name: "2023年"
    }
  ]
}
```

## 実践的な使用例

### 1. 都道府県別人口ランキングの作成

```typescript
async function createPrefecturePopulationRanking() {
  try {
    // 1. 統計データを取得
    const data = await EstatStatsDataService.getAndFormatStatsData(
      "0000010101", // 人口推計の統計表ID
      {
        categoryFilter: "A1101", // 総人口
        yearFilter: "2023", // 2023年
      }
    );

    // 2. 都道府県データのみを抽出
    const prefectureData = data.values.filter(
      (item) =>
        item.areaCode !== "00000" && // 全国データを除外
        item.areaCode.length === 5 // 都道府県コード（5桁）
    );

    // 3. 人口順でソート
    const ranking = prefectureData
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .map((item, index) => ({
        rank: index + 1,
        prefecture: item.areaName,
        population: item.value,
        unit: item.unit,
      }));

    console.log("都道府県別人口ランキング:", ranking);
    return ranking;
  } catch (error) {
    console.error("ランキング作成エラー:", error);
    throw error;
  }
}
```

### 2. 複数年度のデータ比較

```typescript
async function comparePopulationByYear() {
  try {
    const years = ["2020", "2021", "2022", "2023"];
    const results = [];

    for (const year of years) {
      const data = await EstatStatsDataService.getAndFormatStatsData(
        "0000010101",
        {
          categoryFilter: "A1101",
          yearFilter: year,
          areaFilter: "13000", // 東京都
        }
      );

      if (data.values.length > 0) {
        results.push({
          year,
          population: data.values[0].value,
          unit: data.values[0].unit,
        });
      }
    }

    console.log("東京都の人口推移:", results);
    return results;
  } catch (error) {
    console.error("年度比較エラー:", error);
    throw error;
  }
}
```

### 3. 利用可能な年度の取得

```typescript
async function getAvailableYears(statsDataId: string) {
  try {
    const years = await EstatStatsDataService.getAvailableYears(statsDataId);
    console.log("利用可能な年度:", years);
    return years;
  } catch (error) {
    console.error("年度取得エラー:", error);
    throw error;
  }
}

// 使用例
const years = await getAvailableYears("0000010101");
```

## エラーハンドリング

### 基本的なエラーハンドリング

```typescript
async function safeDataFetch(statsDataId: string) {
  try {
    const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
    return { success: true, data };
  } catch (error) {
    console.error("データ取得エラー:", error);

    // エラーの種類に応じた処理
    if (error instanceof EstatApiError) {
      return {
        success: false,
        error: "APIエラー: " + error.message,
      };
    } else if (error instanceof ValidationError) {
      return {
        success: false,
        error: "バリデーションエラー: " + error.message,
      };
    } else {
      return {
        success: false,
        error: "予期しないエラーが発生しました",
      };
    }
  }
}
```

### リトライ機能の実装

```typescript
async function fetchWithRetry(
  fetchFunction: () => Promise<any>,
  maxRetries: number = 3,
  delay: number = 1000
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFunction();
    } catch (error) {
      console.warn(`試行 ${attempt}/${maxRetries} 失敗:`, error);

      if (attempt === maxRetries) {
        throw error;
      }

      // 指数バックオフで待機
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, attempt - 1))
      );
    }
  }
}

// 使用例
const data = await fetchWithRetry(() =>
  EstatStatsDataService.getAndFormatStatsData("0000010101")
);
```

## パフォーマンス最適化

### 1. 並列処理

```typescript
async function fetchMultipleStatsData(statsDataIds: string[]) {
  try {
    // 並列で複数の統計データを取得
    const promises = statsDataIds.map((id) =>
      EstatStatsDataService.getAndFormatStatsData(id)
    );

    const results = await Promise.allSettled(promises);

    return results.map((result, index) => ({
      statsDataId: statsDataIds[index],
      success: result.status === "fulfilled",
      data: result.status === "fulfilled" ? result.value : null,
      error: result.status === "rejected" ? result.reason : null,
    }));
  } catch (error) {
    console.error("並列取得エラー:", error);
    throw error;
  }
}
```

### 2. キャッシュの活用

```typescript
class DataCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5分

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

const cache = new DataCache();

async function getCachedStatsData(statsDataId: string, options: any) {
  const cacheKey = `${statsDataId}-${JSON.stringify(options)}`;

  // キャッシュをチェック
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log("キャッシュから取得");
    return cached;
  }

  // データを取得してキャッシュに保存
  const data = await EstatStatsDataService.getAndFormatStatsData(
    statsDataId,
    options
  );
  cache.set(cacheKey, data);

  return data;
}
```

## デバッグとログ

### デバッグログの有効化

```typescript
// 環境変数でデバッグモードを制御
const DEBUG = process.env.NODE_ENV === "development";

function debugLog(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, data);
  }
}

// 使用例
async function debugDataFetch(statsDataId: string) {
  debugLog("統計データ取得開始", { statsDataId });

  try {
    const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
    debugLog("統計データ取得完了", {
      statsDataId,
      valueCount: data.values.length,
    });
    return data;
  } catch (error) {
    debugLog("統計データ取得エラー", { statsDataId, error });
    throw error;
  }
}
```

### パフォーマンス測定

```typescript
async function measurePerformance<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await operation();
    const end = performance.now();
    console.log(`${name} 実行時間: ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`${name} エラー (${(end - start).toFixed(2)}ms):`, error);
    throw error;
  }
}

// 使用例
const data = await measurePerformance("統計データ取得", () =>
  EstatStatsDataService.getAndFormatStatsData("0000010101")
);
```

## 次のステップ

- [API 統合ガイド](api-integration.md)
- [データ取得実装](data-fetching.md)
- [エラーハンドリング](error-handling.md)
- [ベストプラクティス](best-practices%201.md)
- [使用例](examples.md)

## トラブルシューティング

### よくある問題

#### 1. API キーエラー

**症状**: `401 Unauthorized` エラー

**解決方法**:

- 環境変数 `NEXT_PUBLIC_ESTAT_APP_ID` が正しく設定されているか確認
- API キーが有効か確認
- アプリケーション登録が完了しているか確認

#### 2. データが見つからない

**症状**: 空のレスポンスまたは `404 Not Found`

**解決方法**:

- 統計表 ID が正しいか確認
- フィルタ条件が適切か確認
- 年度や地域コードが存在するか確認

#### 3. レート制限エラー

**症状**: `429 Too Many Requests` エラー

**解決方法**:

- リクエスト頻度を下げる
- キャッシュを活用する
- バッチ処理でまとめて取得する

### サポート

問題が解決しない場合は、以下を確認してください：

1. [API 仕様](apis/)でパラメータを確認
2. [エラーハンドリングガイド](error-handling.md)でエラー処理を確認
3. [ベストプラクティス](best-practices%201.md)で推奨事項を確認

# 型定義

## 概要

`src/infrastructure/estat/types` ディレクトリには、e-Statライブラリで使用されるすべての型定義が含まれています。型定義は以下のカテゴリに分類されます：

1. **APIパラメータ型**: API呼び出し時のパラメータ
2. **生APIレスポンス型**: e-Stat APIから返される生のレスポンス
3. **整形済みデータ型**: アプリケーションで使用しやすい形式に整形されたデータ
4. **処理済みデータ型**: 統計処理が施されたデータ
5. **メタ情報型**: メタデータ関連の型
6. **エラー型**: エラー情報

## APIパラメータ型

### GetStatsDataParams

統計データ取得APIのパラメータ。

**ファイル**: `types/parameters.ts`

```typescript
interface GetStatsDataParams {
  // 必須パラメータ
  appId: string;                       // アプリケーションID
  statsDataId: string;                 // 統計表ID

  // 絞り込み条件（階層）
  lvTab?: string;                      // 表章項目の階層レベル
  lvCat01?: string;                    // 分類01の階層レベル
  lvCat02?: string;                    // 分類02の階層レベル
  // ... (cat03-15)
  lvArea?: string;                     // 地域の階層レベル
  lvTime?: string;                     // 時間軸の階層レベル

  // 絞り込み条件（コード）
  cdTab?: string;                      // 表章項目コード（カンマ区切り）
  cdCat01?: string;                    // 分類01コード（カンマ区切り）
  cdCat02?: string;                    // 分類02コード（カンマ区切り）
  // ... (cat03-15)
  cdArea?: string;                     // 地域コード（カンマ区切り）
  cdTime?: string;                     // 時間軸コード（カンマ区切り）

  // 絞り込み条件（From-To）
  cdTimeFrom?: string;                 // 時間軸From
  cdTimeTo?: string;                   // 時間軸To

  // データ取得位置
  startPosition?: number;              // データ開始位置（デフォルト:1）
  limit?: number;                      // データ取得件数（デフォルト:100000）

  // 出力オプション
  lang?: 'J' | 'E';                   // 言語（デフォルト:J）
  metaGetFlg?: 'Y' | 'N';             // メタ情報取得（デフォルト:Y）
  cntGetFlg?: 'Y' | 'N';              // 件数取得（デフォルト:N）
  explanationGetFlg?: 'Y' | 'N';      // 解説情報取得（デフォルト:N）
  annotationGetFlg?: 'Y' | 'N';       // 注釈情報取得（デフォルト:N）
  replaceSpChars?: '0' | '1' | '2';   // 特殊文字置換（0:置換しない、1:NULL、2:0）
  sectionHeaderFlg?: '1' | '2';       // セクションヘッダ（1:有り、2:無し）
}
```

#### 使用例

```typescript
const params: GetStatsDataParams = {
  appId: 'YOUR_APP_ID',
  statsDataId: '0000010101',
  cdCat01: 'A1101',
  cdTime: '2020',
  cdArea: '13000',
  limit: 1000,
  metaGetFlg: 'Y'
};
```

### GetMetaInfoParams

メタ情報取得APIのパラメータ。

```typescript
interface GetMetaInfoParams {
  appId: string;                       // アプリケーションID
  statsDataId: string;                 // 統計表ID
  lang?: 'J' | 'E';                   // 言語（デフォルト:J）
}
```

### GetStatsListParams

統計リスト取得APIのパラメータ。

```typescript
interface GetStatsListParams {
  appId: string;                       // アプリケーションID

  // 検索条件
  searchKind?: '1' | '2' | '3';       // 検索種別（1:政府統計名、2:統計表題、3:項目名）
  surveyYears?: string;                // 調査年月（YYYY、YYYYMM、YYYY-YYYY）
  openYears?: string;                  // 公開年月（YYYY、YYYYMM、YYYY-YYYY）
  updatedDate?: string;                // 更新日付（YYYY-MM-DD、YYYY-MM-DD-YYYY-MM-DD）
  statsCode?: string;                  // 政府統計コード
  searchWord?: string;                 // キーワード
  statsName?: string;                  // 政府統計名
  govOrg?: string;                     // 作成機関
  statsNameList?: string;              // 提供統計名
  title?: string;                      // 統計表題
  explanation?: string;                // 統計表の説明
  field?: string;                      // 分野
  layout?: string;                     // 統計大分類
  toukei?: string;                     // 統計小分類

  // ページング
  startPosition?: number;              // データ開始位置（デフォルト:1）
  limit?: number;                      // データ取得件数（デフォルト:100）

  // 出力オプション
  lang?: 'J' | 'E';                   // 言語（デフォルト:J）
  replaceSpChars?: '0' | '1' | '2';   // 特殊文字置換
}
```

## 整形済みデータ型

### FormattedEstatData

整形された統計データの全体構造。

**ファイル**: `types/formatted.ts`

```typescript
interface FormattedEstatData {
  tableInfo: {
    id: string;                        // 統計表ID
    title: string;                     // 統計表題名
    statName: string;                  // 政府統計名
    govOrg: string;                    // 作成機関名
    statisticsName: string;            // 提供統計名
    totalNumber: number;               // 総データ件数
    fromNumber: number;                // 開始番号
    toNumber: number;                  // 終了番号
  };
  areas: FormattedArea[];              // 地域情報
  categories: FormattedCategory[];     // カテゴリ情報
  years: FormattedYear[];              // 年情報
  values: FormattedValue[];            // 値情報
  metadata: {
    processedAt: string;               // 処理日時
    totalRecords: number;              // 総レコード数
    validValues: number;               // 有効な値の数
    nullValues: number;                // NULL値の数
  };
}
```

#### 使用例

```typescript
const data: FormattedEstatData =
  await EstatStatsDataService.getAndFormatStatsData('0000010101');

console.log(`統計表: ${data.tableInfo.title}`);
console.log(`地域数: ${data.areas.length}`);
console.log(`カテゴリ数: ${data.categories.length}`);
console.log(`データ件数: ${data.values.length}`);
```

### FormattedArea

整形された地域情報。

```typescript
interface FormattedArea {
  areaCode: string;                    // 地域コード
  areaName: string;                    // 地域名
  level: string;                       // 階層レベル
  parentCode?: string;                 // 親地域コード
}
```

#### 使用例

```typescript
const tokyo: FormattedArea = {
  areaCode: '13000',
  areaName: '東京都',
  level: '2',
  parentCode: '00000'
};
```

### FormattedCategory

整形されたカテゴリ情報。

```typescript
interface FormattedCategory {
  categoryCode: string;                // カテゴリコード
  categoryName: string;                // カテゴリ名
  displayName: string;                 // 表示名（クリーンアップ済み）
  unit: string | null;                 // 単位
}
```

#### 使用例

```typescript
const population: FormattedCategory = {
  categoryCode: 'A1101',
  categoryName: '総人口',
  displayName: '総人口',
  unit: '人'
};
```

### FormattedYear

整形された年情報。

```typescript
interface FormattedYear {
  timeCode: string;                    // 時間軸コード
  timeName: string;                    // 時間軸名
}
```

### FormattedValue

整形された値情報。

```typescript
interface FormattedValue {
  value: number;                       // 数値
  unit: string | null;                 // 単位
  areaCode: string;                    // 地域コード
  areaName: string;                    // 地域名
  categoryCode: string;                // カテゴリコード
  categoryName: string;                // カテゴリ名
  timeCode: string;                    // 時間軸コード
  timeName: string;                    // 時間軸名
  rank?: number;                       // ランク（任意）
}
```

#### 使用例

```typescript
const tokyoPopulation: FormattedValue = {
  value: 13921000,
  unit: '人',
  areaCode: '13000',
  areaName: '東京都',
  categoryCode: 'A1101',
  categoryName: '総人口',
  timeCode: '2020',
  timeName: '2020年'
};
```

### FormattedStatListItem

統計データリストの項目。

```typescript
interface FormattedStatListItem {
  id: string;                          // 統計表ID
  statName: string;                    // 政府統計名
  title: string;                       // 統計表題名
  govOrg: string;                      // 作成機関名
  statisticsName: string;              // 提供統計名
  surveyDate: string;                  // 調査年月
  updatedDate: string;                 // 更新日
  description?: string;                // 説明（任意）
}
```

## メタ情報型

### EstatMetaCategoryData

CSV形式に変換されたメタデータ。

**ファイル**: `types/formatted.ts`

```typescript
interface EstatMetaCategoryData {
  stats_data_id: string;               // 統計表ID
  stat_name: string;                   // 政府統計名
  title: string;                       // 統計表題名
  cat01: string;                       // カテゴリコード
  item_name: string | null;            // 項目名
  unit: string | null;                 // 単位
}
```

#### 使用例

```typescript
const metadata: EstatMetaCategoryData = {
  stats_data_id: '0000010101',
  stat_name: '国勢調査',
  title: '人口等基本集計',
  cat01: 'A1101',
  item_name: '総人口',
  unit: '人'
};
```

### TransformedMetadataEntry

変換されたメタデータエントリ（内部使用）。

**ファイル**: `types/metainfo.ts`

```typescript
interface TransformedMetadataEntry {
  stats_data_id: string;
  stat_name: string;
  title: string;
  cat01: string;
  item_name: string | null;
  unit: string | null;
}
```

### MetadataSummary

メタデータサマリー情報。

```typescript
interface MetadataSummary {
  totalEntries: number;                // 総エントリ数
  uniqueStats: number;                 // ユニークな統計表数
  categories: Array<{                  // カテゴリ別件数
    code: string;
    name: string;
    count: number;
  }>;
  lastUpdated: string | null;          // 最終更新日時
}
```

#### 使用例

```typescript
const summary: MetadataSummary = {
  totalEntries: 15000,
  uniqueStats: 350,
  categories: [
    { code: 'A1101', name: '総人口', count: 1200 },
    { code: 'A1301', name: '男性人口', count: 1100 },
    // ...
  ],
  lastUpdated: '2024-01-15T10:30:00Z'
};
```

### MetadataSearchResult

メタデータ検索結果。

```typescript
interface MetadataSearchResult {
  entries: EstatMetaCategoryData[];    // 検索結果
  totalCount: number;                  // 総件数
  searchQuery: string;                 // 検索クエリ
  executedAt: string;                  // 実行日時
}
```

## 処理済みデータ型

### ProcessedStatsData

整形済み統計データ（汎用）。

**ファイル**: `types/processed.ts`

```typescript
interface ProcessedStatsData {
  metadata: StatsMetadata;             // メタデータ
  dimensions: StatsDimensions;         // 次元情報
  data: StatsDataRecord[];             // データレコード
  statistics?: StatsStatistics;        // 統計情報
  notes?: string[];                    // 注釈
}
```

### StatsMetadata

統計メタデータ。

```typescript
interface StatsMetadata {
  // 基本情報
  statsDataId: string;                 // 統計表ID
  title: string;                       // 統計表題名
  statName: string;                    // 政府統計名
  govOrg: string;                      // 作成機関名
  govOrgCode?: string;                 // 作成機関コード

  // 時期情報
  surveyDate?: string;                 // 調査年月
  openDate?: string;                   // 公開日
  updatedDate?: string;                // 更新日
  cycle?: string;                      // 提供周期

  // 分類情報
  mainCategory?: string;               // 分野（大分類）
  mainCategoryCode?: string;           // 分野コード（大分類）
  subCategory?: string;                // 分野（小分類）
  subCategoryCode?: string;            // 分野コード（小分類）

  // 地域情報
  collectArea?: string;                // 集計地域区分
  smallArea?: '0' | '1' | '2';        // 小地域属性

  // データ情報
  totalRecords: number;                // 総データ件数
  responseRecords?: number;            // 取得データ件数

  // システム情報
  lastFetched: string;                 // 取得日時
  source: 'e-stat';                    // データソース
}
```

### StatsDimensions

次元情報。

```typescript
interface StatsDimensions {
  [dimensionId: string]: DimensionInfo;
}
```

### DimensionInfo

次元詳細。

```typescript
interface DimensionInfo {
  id: string;                          // 次元ID (tab, cat01-15, area, time)
  name: string;                        // 次元名
  required: boolean;                   // 必須フラグ
  position?: number;                   // 表示位置
  items: DimensionItem[];              // 次元項目リスト
}
```

### DimensionItem

次元項目。

```typescript
interface DimensionItem {
  code: string;                        // 項目コード
  name: string;                        // 項目名
  level: string;                       // 階層レベル
  unit?: string;                       // 単位
  parentCode?: string;                 // 親コード
  explanation?: string;                // 説明
}
```

### StatsDataRecord

データレコード。

```typescript
interface StatsDataRecord {
  // 値
  value: number | null;                // 数値（nullは欠損値）
  rawValue: string;                    // 元の値（特殊文字含む）

  // 次元情報（コードと名称）
  tab?: { code: string; name: string; };
  cat01?: { code: string; name: string; };
  cat02?: { code: string; name: string; };
  // ... (cat03-15)
  area?: { code: string; name: string; };
  time?: { code: string; name: string; };

  // 追加情報
  unit?: string;                       // 単位
  annotation?: string;                 // 注釈記号
}
```

### StatsStatistics

統計情報（基本統計量）。

```typescript
interface StatsStatistics {
  // 基本統計量
  count: number;                       // データ件数
  validCount: number;                  // 有効データ件数
  missingCount: number;                // 欠損データ件数

  // 代表値
  min: number;                         // 最小値
  max: number;                         // 最大値
  sum: number;                         // 合計
  mean: number;                        // 平均
  median: number;                      // 中央値
  mode?: number;                       // 最頻値

  // ばらつき
  range: number;                       // 範囲
  variance: number;                    // 分散
  stdDev: number;                      // 標準偏差
  cv?: number;                        // 変動係数

  // 分位数
  quartiles: {
    q1: number;                        // 第1四分位数
    q2: number;                        // 第2四分位数（中央値）
    q3: number;                        // 第3四分位数
    iqr: number;                       // 四分位範囲
  };

  // 外れ値
  outliers?: {
    lower: number[];                   // 下側外れ値
    upper: number[];                   // 上側外れ値
  };
}
```

## 生APIレスポンス型

生APIレスポンス型は `types/raw-response.ts`, `types/meta-response.ts`, `types/list-response.ts` などに定義されています。これらはe-Stat APIの実際のレスポンス構造を表現しています。

通常、これらの型は直接使用せず、整形済みデータ型を使用することを推奨します。

## 型のインポート

### 基本的なインポート

```typescript
import {
  FormattedEstatData,
  FormattedValue,
  FormattedArea,
  FormattedCategory,
  FormattedYear,
  FormattedStatListItem,
  EstatMetaCategoryData,
  MetadataSummary,
  MetadataSearchResult
} from '@/infrastructure/estat/types';
```

### パラメータ型のインポート

```typescript
import {
  GetStatsDataParams,
  GetMetaInfoParams,
  GetStatsListParams
} from '@/infrastructure/estat/types';
```

### 処理済みデータ型のインポート

```typescript
import {
  ProcessedStatsData,
  StatsMetadata,
  StatsDataRecord,
  StatsStatistics
} from '@/infrastructure/estat/types';
```

## 型ガード

型の安全性を確保するためのヘルパー関数の例。

```typescript
// FormattedValue が有効な値を持つかチェック
function hasValidValue(value: FormattedValue): boolean {
  return value.value !== null && !isNaN(value.value);
}

// FormattedArea が都道府県かチェック
function isPrefecture(area: FormattedArea): boolean {
  return area.level === '2' && area.areaCode !== '00000';
}

// 使用例
const validValues = data.values.filter(hasValidValue);
const prefectures = data.areas.filter(isPrefecture);
```

## 関連ドキュメント

- [EstatStatsDataService](stats-data-service.md)
- [EstatStatsListService](stats-list-service.md)
- [EstatMetaInfoService](metainfo-service.md)
- [使用例](examples.md)
- [ライブラリ概要](02_domain/estat-api/specifications/overview.md)

# API 統合ガイド

## 概要

このドキュメントでは、e-Stat API の統合方法について包括的に説明します。エンドポイントの仕様、Next.js 統合、データ取得パターン、パフォーマンス最適化まで、API 利用に必要なすべての情報を網羅しています。

## 目次

1. [e-Stat API エンドポイント](#e-stat-apiエンドポイント)
2. [Next.js API Routes での統合](#nextjs-api-routes-での統合)
3. [クライアントサイドでの使用](#クライアントサイドでの使用)
4. [データ取得パターン](#データ取得パターン)
5. [認証とセキュリティ](#認証とセキュリティ)
6. [パフォーマンス最適化](#パフォーマンス最適化)
7. [エラーハンドリング](#エラーハンドリング)

---

# 第 1 章: e-Stat API エンドポイント

## 基本情報

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

### 2. メタ情報取得 (GET_META_INFO)

**エンドポイント**: `/getMetaInfo`

**用途**: 統計表のメタ情報（分類情報、地域情報、時間軸情報など）を取得

**パラメータ**:

- `appId`: アプリケーション ID（必須）
- `statsDataId`: 統計データ ID（必須）
- `metaGetFlg`: メタデータ取得フラグ（Y/N）
- `cntGetFlg`: 件数取得フラグ（Y/N）

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

## レート制限

### e-Stat API 制限

- **1 日あたり**: 1,000 回
- **1 時間あたり**: 100 回（推奨）
- **同時接続**: 5 接続まで

### 内部 API 制限

- **統計データ取得**: 1 分あたり 60 回
- **メタ情報取得**: 1 分あたり 30 回
- **ランキングデータ取得**: 1 分あたり 120 回

---

# 第 2 章: Next.js API Routes での統合

## 1. 統計データ取得 API

`src/app/api/stats/data/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { EstatStatsDataFetcher } from "@/features/estat-api/stats-data";
import { z } from "zod";

// リクエストスキーマ
const GetStatsDataSchema = z.object({
  statsDataId: z
    .string()
    .regex(/^\d{10}$/, "統計表IDは10桁の数字である必要があります"),
  categoryFilter: z.string().optional(),
  yearFilter: z.string().optional(),
  areaFilter: z.string().optional(),
  limit: z.number().min(1).max(10000).optional().default(10000),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // パラメータの検証
    const params = GetStatsDataSchema.parse({
      statsDataId: searchParams.get("statsDataId"),
      categoryFilter: searchParams.get("categoryFilter"),
      yearFilter: searchParams.get("yearFilter"),
      areaFilter: searchParams.get("areaFilter"),
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
    });

    // 統計データを取得（Fetcherを使用）
    const data = await EstatStatsDataFetcher.fetchAndFormat(
      params.statsDataId,
      {
        categoryFilter: params.categoryFilter,
        yearFilter: params.yearFilter,
        areaFilter: params.areaFilter,
        limit: params.limit,
      }
    );

    return NextResponse.json({
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        statsDataId: params.statsDataId,
      },
    });
  } catch (error) {
    console.error("統計データ取得エラー:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "パラメータが無効です",
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "サーバー内部エラーが発生しました",
        },
      },
      { status: 500 }
    );
  }
}
```

## 2. 統計リスト検索 API

`src/app/api/stats/list/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { EstatStatsListFetcher } from "@/features/estat-api/stats-list";
import { z } from "zod";

const GetStatsListSchema = z.object({
  searchWord: z.string().min(1).max(100),
  limit: z.number().min(1).max(100).optional().default(20),
  startPosition: z.number().min(1).optional().default(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = GetStatsListSchema.parse({
      searchWord: searchParams.get("searchWord"),
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      startPosition: searchParams.get("startPosition")
        ? parseInt(searchParams.get("startPosition")!)
        : undefined,
    });

    // 統計リストを取得（Fetcherを使用）
    const result = await EstatStatsListFetcher.searchByKeyword(
      params.searchWord,
      { limit: params.limit, startPosition: params.startPosition }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("統計リスト取得エラー:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "サーバー内部エラーが発生しました",
        },
      },
      { status: 500 }
    );
  }
}
```

---

# 第 3 章: クライアントサイドでの使用

## 1. カスタムフックの作成

`src/hooks/useStatsData.ts`

```typescript
import { useState, useEffect } from "react";

interface UseStatsDataOptions {
  statsDataId: string;
  categoryFilter?: string;
  yearFilter?: string;
  areaFilter?: string;
  limit?: number;
  enabled?: boolean;
}

interface UseStatsDataResult {
  data: any | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStatsData(options: UseStatsDataOptions): UseStatsDataResult {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!options.enabled) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        statsDataId: options.statsDataId,
        ...(options.categoryFilter && {
          categoryFilter: options.categoryFilter,
        }),
        ...(options.yearFilter && { yearFilter: options.yearFilter }),
        ...(options.areaFilter && { areaFilter: options.areaFilter }),
        ...(options.limit && { limit: options.limit.toString() }),
      });

      const response = await fetch(`/api/stats/data?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    options.statsDataId,
    options.categoryFilter,
    options.yearFilter,
    options.areaFilter,
    options.limit,
    options.enabled,
  ]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
```

## 2. React コンポーネントでの使用

`src/components/StatsDataDisplay.tsx`

```typescript
"use client";

import { useStatsData } from "@/hooks/useStatsData";
import { useState } from "react";

interface StatsDataDisplayProps {
  statsDataId: string;
}

export function StatsDataDisplay({ statsDataId }: StatsDataDisplayProps) {
  const [filters, setFilters] = useState({
    categoryFilter: "",
    yearFilter: "",
    areaFilter: "",
  });

  const { data, loading, error, refetch } = useStatsData({
    statsDataId,
    ...filters,
    enabled: true,
  });

  if (loading) {
    return <div>データを読み込み中...</div>;
  }

  if (error) {
    return (
      <div>
        <p>エラー: {error}</p>
        <button onClick={refetch}>再試行</button>
      </div>
    );
  }

  if (!data) {
    return <div>データがありません</div>;
  }

  return (
    <div>
      <h3>統計データ ({data.values.length}件)</h3>
      <table>
        <thead>
          <tr>
            <th>地域</th>
            <th>カテゴリ</th>
            <th>年度</th>
            <th>値</th>
            <th>単位</th>
          </tr>
        </thead>
        <tbody>
          {data.values.map((item: any, index: number) => (
            <tr key={index}>
              <td>{item.areaName}</td>
              <td>{item.categoryName}</td>
              <td>{item.timeName}</td>
              <td>{item.value?.toLocaleString()}</td>
              <td>{item.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

# 第 4 章: データ取得パターン

## 基本的なデータ取得パターン

### 1. 単一統計表の取得

```typescript
import { EstatStatsDataFetcher } from "@/features/estat-api/stats-data";

async function fetchSingleStatsData(statsDataId: string) {
  try {
    const data = await EstatStatsDataFetcher.fetchAndFormat(statsDataId);

    console.log("取得したデータ:", {
      valueCount: data.values.length,
      areaCount: data.areas.length,
      categoryCount: data.categories.length,
      yearCount: data.years.length,
    });

    return data;
  } catch (error) {
    console.error("データ取得エラー:", error);
    throw error;
  }
}
```

### 2. フィルタリング付きデータ取得

```typescript
import { EstatStatsDataFetcher } from "@/features/estat-api/stats-data";
import type { FetchOptions } from "@/features/estat-api/stats-data/types";

async function fetchFilteredData(statsDataId: string, options: FetchOptions) {
  const data = await EstatStatsDataFetcher.fetchAndFormat(statsDataId, {
    categoryFilter: options.categoryFilter,
    yearFilter: options.yearFilter,
    areaFilter: options.areaFilter,
    limit: options.limit || 10000,
  });

  return data;
}
```

// 使用例
const populationData = await fetchFilteredData("0000010101", {
categoryFilter: "A1101", // 総人口
yearFilter: "2023", // 2023 年
limit: 1000,
});

````

## 高度なデータ取得パターン

### 1. 複数年度のデータ取得

```typescript
import { EstatStatsDataFetcher } from "@/features/estat-api/stats-data";
import type { FetchOptions } from "@/features/estat-api/stats-data/types";

async function fetchMultiYearData(
  statsDataId: string,
  years: string[],
  options: FetchOptions = {}
) {
  const results = await Promise.allSettled(
    years.map(async (year) => {
      const data = await EstatStatsDataFetcher.fetchAndFormat(statsDataId, {
        ...options,
        yearFilter: year,
      });

      return {
        year,
        data,
        success: true,
      };
    })
  );

  return results.map((result, index) => ({
    year: years[index],
    success: result.status === "fulfilled",
    data: result.status === "fulfilled" ? result.value.data : null,
    error: result.status === "rejected" ? result.reason : null,
  }));
}
````

### 2. バッチ処理でのデータ取得

```typescript
import { EstatStatsDataFetcher } from "@/features/estat-api/stats-data";

interface BatchFetchOptions {
  statsDataIds: string[];
  concurrency?: number;
  delayMs?: number;
}

async function batchFetchData(options: BatchFetchOptions) {
  const { statsDataIds, concurrency = 3, delayMs = 1000 } = options;
  const results = [];

  // チャンクに分割
  for (let i = 0; i < statsDataIds.length; i += concurrency) {
    const chunk = statsDataIds.slice(i, i + concurrency);

    // 並列処理
    const chunkResults = await Promise.allSettled(
      chunk.map(async (statsDataId) => {
        const data = await EstatStatsDataFetcher.fetchAndFormat(statsDataId);
        return { statsDataId, data };
      })
    );

    results.push(...chunkResults);

    // レート制限対応のため待機
    if (i + concurrency < statsDataIds.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results.map((result, index) => ({
    statsDataId: statsDataIds[index],
    success: result.status === "fulfilled",
    data: result.status === "fulfilled" ? result.value.data : null,
    error: result.status === "rejected" ? result.reason : null,
  }));
}
```

---

# 第 5 章: 認証とセキュリティ

## 1. API キーの管理

`src/infrastructure/auth/api-key.ts`

```typescript
export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private apiKey: string | null = null;

  private constructor() {}

  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  getApiKey(): string {
    if (!this.apiKey) {
      this.apiKey = process.env.NEXT_PUBLIC_ESTAT_APP_ID;

      if (!this.apiKey) {
        throw new Error("ESTAT_APP_ID is not configured");
      }
    }

    return this.apiKey;
  }

  validateApiKey(apiKey: string): boolean {
    return /^[a-zA-Z0-9]{32}$/.test(apiKey);
  }
}
```

## 2. レート制限の実装

`src/infrastructure/rate-limit.ts`

```typescript
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> =
    new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now();
    const current = this.requests.get(identifier);

    if (!current || now > current.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (current.count >= this.config.maxRequests) {
      return false;
    }

    current.count++;
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const current = this.requests.get(identifier);
    if (!current) return this.config.maxRequests;

    const now = Date.now();
    if (now > current.resetTime) return this.config.maxRequests;

    return Math.max(0, this.config.maxRequests - current.count);
  }
}

// グローバルレート制限インスタンス
export const rateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1分
  maxRequests: 60, // 1分間に60リクエスト
});
```

---

# 第 6 章: パフォーマンス最適化

## 1. キャッシュを活用したデータ取得

```typescript
class CachedDataFetcher {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5分

  async fetchWithCache(statsDataId: string, options: DataFetchOptions = {}) {
    const cacheKey = this.generateCacheKey(statsDataId, options);

    // キャッシュをチェック
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log("キャッシュから取得:", cacheKey);
      return cached.data;
    }

    // データを取得
    console.log("APIから取得:", cacheKey);
    const data = await EstatStatsDataService.getAndFormatStatsData(
      statsDataId,
      options
    );

    // キャッシュに保存
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  private generateCacheKey(
    statsDataId: string,
    options: DataFetchOptions
  ): string {
    return `${statsDataId}-${JSON.stringify(options)}`;
  }

  clearCache() {
    this.cache.clear();
  }
}
```

## 2. 並列処理の最適化

```typescript
class ParallelDataFetcher {
  private concurrency: number;
  private delayMs: number;

  constructor(concurrency = 3, delayMs = 1000) {
    this.concurrency = concurrency;
    this.delayMs = delayMs;
  }

  async fetchMultiple(
    requests: Array<{ statsDataId: string; options?: DataFetchOptions }>
  ) {
    const results = [];

    for (let i = 0; i < requests.length; i += this.concurrency) {
      const chunk = requests.slice(i, i + this.concurrency);

      const chunkResults = await Promise.allSettled(
        chunk.map(async ({ statsDataId, options }) => {
          const data = await EstatStatsDataService.getAndFormatStatsData(
            statsDataId,
            options
          );
          return { statsDataId, data };
        })
      );

      results.push(...chunkResults);

      // レート制限対応
      if (i + this.concurrency < requests.length) {
        await this.delay(this.delayMs);
      }
    }

    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

---

# 第 7 章: エラーハンドリング

## 1. リトライ機能付きデータ取得

```typescript
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

async function fetchWithRetry(
  statsDataId: string,
  options: DataFetchOptions = {},
  retryOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  }
) {
  let lastError: Error;

  for (let attempt = 1; attempt <= retryOptions.maxRetries; attempt++) {
    try {
      const data = await EstatStatsDataService.getAndFormatStatsData(
        statsDataId,
        options
      );

      console.log(
        `データ取得成功 (試行 ${attempt}/${retryOptions.maxRetries})`
      );
      return data;
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `データ取得失敗 (試行 ${attempt}/${retryOptions.maxRetries}):`,
        error
      );

      if (attempt === retryOptions.maxRetries) {
        break;
      }

      // 指数バックオフで待機
      const delay = Math.min(
        retryOptions.baseDelay *
          Math.pow(retryOptions.backoffMultiplier, attempt - 1),
        retryOptions.maxDelay
      );

      console.log(`${delay}ms待機後に再試行...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(
    `データ取得に失敗しました (${retryOptions.maxRetries}回試行): ${lastError.message}`
  );
}
```

## 2. フォールバック機能

```typescript
interface FallbackOptions {
  primaryStatsDataId: string;
  fallbackStatsDataId: string;
  options: DataFetchOptions;
}

async function fetchWithFallback(fallbackOptions: FallbackOptions) {
  const { primaryStatsDataId, fallbackStatsDataId, options } = fallbackOptions;

  try {
    console.log("プライマリデータソースから取得中...");
    const data = await EstatStatsDataService.getAndFormatStatsData(
      primaryStatsDataId,
      options
    );

    return {
      data,
      source: "primary",
      statsDataId: primaryStatsDataId,
    };
  } catch (error) {
    console.warn("プライマリデータソースでエラー:", error);

    try {
      console.log("フォールバックデータソースから取得中...");
      const data = await EstatStatsDataService.getAndFormatStatsData(
        fallbackStatsDataId,
        options
      );

      return {
        data,
        source: "fallback",
        statsDataId: fallbackStatsDataId,
        originalError: error,
      };
    } catch (fallbackError) {
      console.error("フォールバックデータソースでもエラー:", fallbackError);
      throw new Error(
        `データ取得に失敗しました。プライマリ: ${error.message}, フォールバック: ${fallbackError.message}`
      );
    }
  }
}
```

## 関連ドキュメント

- [開始ガイド](estat-api-core.md)
- [型システム](02_型システム.md)
- [エラーハンドリング](05_エラーハンドリング.md)
- [ベストプラクティス](06_ベストプラクティス.md)
- [使用例](08_使用例.md)
