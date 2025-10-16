# EstatStatsDataService

## 概要

`EstatStatsDataService` は、e-Stat APIから統計データを取得し、アプリケーションで使いやすい形式に整形するためのサービスクラスです。

**ファイルパス**: `src/lib/estat/statsdata/EstatStatsDataService.ts`

## 主な機能

1. 統計データの取得（生データ）
2. 統計データの整形
3. フィルタリング条件の適用
4. 都道府県データの抽出
5. 利用可能な年度リストの取得
6. メタ情報のCSV形式変換

## メソッド一覧

### パブリックメソッド

| メソッド名 | 戻り値 | 説明 |
|-----------|--------|------|
| `getAndFormatStatsData()` | `Promise<FormattedEstatData>` | 統計データを取得して整形 |
| `getStatsDataRaw()` | `Promise<EstatStatsDataResponse>` | 統計データを取得（生データ） |
| `formatStatsData()` | `FormattedEstatData` | 統計データレスポンスを整形 |
| `transformToCSVFormat()` | `EstatMetaCategoryData[]` | メタデータをCSV形式に変換 |
| `getMetaInfoAsCSV()` | `Promise<EstatMetaCategoryData[]>` | メタ情報をCSV形式で取得 |
| `getAvailableYears()` | `Promise<string[]>` | 利用可能な年度一覧を取得 |
| `getPrefectureDataByYear()` | `Promise<FormattedValue[]>` | 都道府県データを年度別に取得 |

### プライベートメソッド

| メソッド名 | 戻り値 | 説明 |
|-----------|--------|------|
| `formatAreas()` | `FormattedArea[]` | 地域情報を整形 |
| `formatCategories()` | `FormattedCategory[]` | カテゴリ情報を整形 |
| `formatYears()` | `FormattedYear[]` | 年情報を整形 |
| `formatValues()` | `FormattedValue[]` | 値情報を整形 |
| `cleanString()` | `string` | 文字列をクリーンアップ |
| `parseNumericValue()` | `number \| null` | 数値をパース |
| `extractItemName()` | `string` | item_nameからcat01のコードを除去 |

## 詳細仕様

### 1. getAndFormatStatsData()

統計データを取得して整形する最も一般的なメソッドです。

#### シグネチャ

```typescript
static async getAndFormatStatsData(
  statsDataId: string,
  options: {
    categoryFilter?: string;
    yearFilter?: string;
    areaFilter?: string;
    limit?: number;
  } = {}
): Promise<FormattedEstatData>
```

#### パラメータ

- `statsDataId` (string): 統計表ID（10桁の数字）
- `options.categoryFilter` (string, optional): カテゴリコード（例: `"A1101"`）
- `options.yearFilter` (string, optional): 年度コード（例: `"2020"`）
- `options.areaFilter` (string, optional): 地域コード（例: `"13000"`）
- `options.limit` (number, optional): 取得件数の上限（デフォルト: 10000）

#### 戻り値

`FormattedEstatData` オブジェクト:

```typescript
{
  tableInfo: {
    id: string;
    title: string;
    statName: string;
    govOrg: string;
    statisticsName: string;
    totalNumber: number;
    fromNumber: number;
    toNumber: number;
  };
  areas: FormattedArea[];
  categories: FormattedCategory[];
  years: FormattedYear[];
  values: FormattedValue[];
  metadata: {
    processedAt: string;
    totalRecords: number;
    validValues: number;
    nullValues: number;
  };
}
```

#### 使用例

```typescript
// 基本的な使用
const data = await EstatStatsDataService.getAndFormatStatsData('0000010101');

// フィルタリングを使用
const filteredData = await EstatStatsDataService.getAndFormatStatsData(
  '0000010101',
  {
    categoryFilter: 'A1101',
    yearFilter: '2020',
    areaFilter: '13000',
    limit: 5000
  }
);

console.log(`取得レコード数: ${filteredData.values.length}`);
console.log(`有効な値: ${filteredData.metadata.validValues}`);
console.log(`NULL値: ${filteredData.metadata.nullValues}`);
```

#### エラーハンドリング

```typescript
try {
  const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
} catch (error) {
  console.error('統計データの取得に失敗しました:', error);
}
```

### 2. getStatsDataRaw()

整形前の生データを取得します。元のAPI構造を保持したい場合に使用します。

#### シグネチャ

```typescript
static async getStatsDataRaw(
  statsDataId: string,
  options: {
    categoryFilter?: string;
    yearFilter?: string;
    areaFilter?: string;
    limit?: number;
  } = {}
): Promise<EstatStatsDataResponse>
```

#### 使用例

```typescript
const rawData = await EstatStatsDataService.getStatsDataRaw('0000010101');
console.log(rawData.GET_STATS_DATA?.STATISTICAL_DATA);
```

### 3. formatStatsData()

生のAPIレスポンスを整形します。カスタムデータ処理パイプラインを構築する場合に使用します。

#### シグネチャ

```typescript
static formatStatsData(response: EstatStatsDataResponse): FormattedEstatData
```

#### 使用例

```typescript
const rawData = await EstatStatsDataService.getStatsDataRaw('0000010101');
const formattedData = EstatStatsDataService.formatStatsData(rawData);
```

### 4. getAvailableYears()

指定した統計表とカテゴリで利用可能な年度の一覧を取得します。

#### シグネチャ

```typescript
static async getAvailableYears(
  statsDataId: string,
  categoryCode: string
): Promise<string[]>
```

#### パラメータ

- `statsDataId` (string): 統計表ID
- `categoryCode` (string): カテゴリコード

#### 戻り値

年度コードの配列（降順にソート）

#### 使用例

```typescript
const years = await EstatStatsDataService.getAvailableYears(
  '0000010101',
  'A1101'
);

console.log('利用可能な年度:', years);
// 出力例: ['2020', '2015', '2010', '2005', '2000']
```

### 5. getPrefectureDataByYear()

都道府県別のデータを年度別に取得します。全国データ（areaCode=00000）は除外されます。

#### シグネチャ

```typescript
static async getPrefectureDataByYear(
  statsDataId: string,
  categoryCode: string,
  yearCode: string,
  limit: number = 100000
): Promise<FormattedValue[]>
```

#### パラメータ

- `statsDataId` (string): 統計表ID
- `categoryCode` (string): カテゴリコード
- `yearCode` (string): 年度コード
- `limit` (number, optional): 取得件数の上限（デフォルト: 100000）

#### 戻り値

`FormattedValue[]` - 都道府県データの配列

#### 使用例

```typescript
const prefectureData = await EstatStatsDataService.getPrefectureDataByYear(
  '0000010101',
  'A1101',
  '2020'
);

// 都道府県別データを表示
prefectureData.forEach(data => {
  console.log(`${data.areaName}: ${data.value}${data.unit}`);
});

// 出力例:
// 北海道: 5248552人
// 青森県: 1238730人
// ...
```

### 6. getMetaInfoAsCSV()

メタ情報をCSV形式（配列）で取得します。

#### シグネチャ

```typescript
static async getMetaInfoAsCSV(
  statsDataId: string
): Promise<EstatMetaCategoryData[]>
```

#### 使用例

```typescript
const metadata = await EstatStatsDataService.getMetaInfoAsCSV('0000010101');

metadata.forEach(item => {
  console.log(`${item.cat01}: ${item.item_name} (${item.unit || '単位なし'})`);
});

// 出力例:
// A1101: 総人口 (人)
// A1301: 男性人口 (人)
// A1401: 女性人口 (人)
```

## データ整形の仕組み

### 1. 地域情報の整形 (formatAreas)

e-Stat APIの地域情報を構造化します。

**入力**: API の `CLASS_OBJ` で `@id === "area"` の情報
**出力**: `FormattedArea[]`

```typescript
{
  areaCode: "13000",      // 地域コード
  areaName: "東京都",      // 地域名
  level: "2",             // 階層レベル
  parentCode: "00000"     // 親地域コード（任意）
}
```

### 2. カテゴリ情報の整形 (formatCategories)

統計のカテゴリ情報を構造化します。

**入力**: API の `CLASS_OBJ` で `@id` が `"cat*"` の情報
**出力**: `FormattedCategory[]`

```typescript
{
  categoryCode: "A1101",   // カテゴリコード
  categoryName: "総人口",   // カテゴリ名
  displayName: "総人口",    // 表示名（クリーンアップ済み）
  unit: "人"               // 単位
}
```

### 3. 年情報の整形 (formatYears)

時間軸情報を構造化します。

**入力**: API の `CLASS_OBJ` で `@id === "time"` の情報
**出力**: `FormattedYear[]`

```typescript
{
  timeCode: "2020",        // 時間軸コード
  timeName: "2020年"       // 時間軸名
}
```

### 4. 値情報の整形 (formatValues)

実際のデータ値を構造化します。

**入力**: API の `DATA_INF.VALUE` 配列
**出力**: `FormattedValue[]`

```typescript
{
  value: 13921000,         // 数値（NULLの場合は0）
  unit: "人",              // 単位
  areaCode: "13000",       // 地域コード
  areaName: "東京都",       // 地域名
  categoryCode: "A1101",   // カテゴリコード
  categoryName: "総人口",   // カテゴリ名
  timeCode: "2020",        // 時間軸コード
  timeName: "2020年"       // 時間軸名
}
```

## 特殊文字と NULL 値の処理

### parseNumericValue()

数値のパース時に特殊文字を適切に処理します。

**NULL として扱われる値**:
- 空文字列
- `"-"` （データなし）
- `"…"` （調査未実施）
- `"***"` （秘匿値）

**数値変換**:
1. カンマと空白を除去
2. `parseFloat()` で変換
3. 変換失敗時は `null` を返す

```typescript
parseNumericValue("1,234,567")  // => 1234567
parseNumericValue("-")           // => null
parseNumericValue("…")           // => null
parseNumericValue("***")         // => null
```

## cleanString()

文字列のクリーンアップを行います。

**処理内容**:
1. 連続する空白を1つに統一
2. 全角スペースを半角スペースに変換
3. 前後の空白を削除

```typescript
cleanString("東京　　都  ")  // => "東京 都"
cleanString("人　口")        // => "人 口"
```

## パフォーマンスに関する注意事項

### 1. limit パラメータの使用

大量のデータを取得する際は、`limit` パラメータで取得件数を制限してください。

```typescript
// 良い例: limitを指定
const data = await EstatStatsDataService.getAndFormatStatsData(
  statsDataId,
  { limit: 5000 }
);

// 注意: limitを指定しないと最大10000件取得される
```

### 2. フィルタリングの活用

必要なデータのみを取得するため、フィルタリングを活用してください。

```typescript
// 良い例: フィルタリングで絞り込み
const data = await EstatStatsDataService.getAndFormatStatsData(
  statsDataId,
  {
    categoryFilter: 'A1101',
    yearFilter: '2020',
    areaFilter: '13000'
  }
);
```

### 3. メモリ使用量

大量のデータを扱う場合、メモリ使用量に注意してください。

```typescript
// 大量データの場合は段階的に処理
const years = await EstatStatsDataService.getAvailableYears(
  statsDataId,
  categoryCode
);

for (const year of years) {
  const data = await EstatStatsDataService.getPrefectureDataByYear(
    statsDataId,
    categoryCode,
    year
  );
  // データを処理
  await processData(data);
}
```

## エラーハンドリング

すべてのメソッドは、エラー発生時に詳細な情報をログに出力し、わかりやすいエラーメッセージを含む例外をスローします。

```typescript
try {
  const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
} catch (error) {
  if (error instanceof Error) {
    console.error('エラーメッセージ:', error.message);
    console.error('スタックトレース:', error.stack);
  }
}
```

## 関連ドキュメント

- [型定義: FormattedEstatData](types.md#formattedestatdata)
- [型定義: FormattedValue](types.md#formattedvalue)
- [使用例](examples.md#estatstatsdataservice)
- [ライブラリ概要](02_domain/estat-api/specifications/overview.md)
