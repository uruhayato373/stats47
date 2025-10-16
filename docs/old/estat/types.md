# 型定義

## 概要

`src/lib/estat/types` ディレクトリには、e-Statライブラリで使用されるすべての型定義が含まれています。型定義は以下のカテゴリに分類されます：

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
} from '@/lib/estat/types';
```

### パラメータ型のインポート

```typescript
import {
  GetStatsDataParams,
  GetMetaInfoParams,
  GetStatsListParams
} from '@/lib/estat/types';
```

### 処理済みデータ型のインポート

```typescript
import {
  ProcessedStatsData,
  StatsMetadata,
  StatsDataRecord,
  StatsStatistics
} from '@/lib/estat/types';
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

- [EstatStatsDataService](./stats-data-service.md)
- [EstatStatsListService](./stats-list-service.md)
- [EstatMetaInfoService](./metainfo-service.md)
- [使用例](./examples.md)
- [ライブラリ概要](./overview.md)
