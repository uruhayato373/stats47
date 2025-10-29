---
title: e-Stat API `GET_STATS_DATA` 完全ガイド
created: 2025-10-14
updated: 2025-10-16
tags:
  - domain/estat-api
  - specifications
---

# e-Stat API `GET_STATS_DATA` 完全ガイド

## 1. GET_STATS_DATA とは

### 概要

`GET_STATS_DATA`は、e-Stat に登録されている統計表の**実際のデータ**を取得する API です。`GET_STATS_LIST`で統計表 ID を取得した後、この API を使用して具体的な数値データを取得します。

### 主な用途

1. **統計データの取得** - 都道府県別人口、経済指標などの実データ
2. **データの絞り込み** - 地域、年次、分類項目での条件指定
3. **大量データの取得** - ページング機能で段階的に取得
4. **メタ情報の同時取得** - データと一緒に分類情報も取得

### GET_STATS_LIST との違い

| 機能       | GET_STATS_LIST         | GET_STATS_DATA       |
| ---------- | ---------------------- | -------------------- |
| 取得内容   | 統計表の一覧・メタ情報 | 統計表の実データ     |
| 主な用途   | 統計表を探す           | データを取得する     |
| 返却データ | 統計表 ID、タイトル等  | 数値データ、分類情報 |

## 2. API の基本仕様

### エンドポイント

```
# XML形式
https://api.e-stat.go.jp/rest/3.0/app/getStatsData?<パラメータ>

# JSON形式（推奨）
https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?<パラメータ>

# CSV形式（シンプル版）
https://api.e-stat.go.jp/rest/3.0/app/getSimpleStatsData?<パラメータ>
```

### HTTP メソッド

- **GET** または **POST**

### 必須パラメータ

- `appId`: アプリケーション ID
- `statsDataId` または `dataSetId`: いずれか一方が必須

## 3. パラメータ詳細

### 3.1 基本パラメータ

| パラメータ名  | 必須 | 説明                                           | 例            |
| ------------- | ---- | ---------------------------------------------- | ------------- |
| `appId`       | ○    | アプリケーション ID                            | `YOUR_APP_ID` |
| `lang`        | -    | 言語設定<br>J: 日本語（デフォルト）<br>E: 英語 | `J`           |
| `statsDataId` | △    | 統計表 ID（8-10 桁）                           | `0003412313`  |
| `dataSetId`   | △    | データセット ID                                | `DATASET001`  |

**重要**: `statsDataId`と`dataSetId`は**どちらか一方のみ**を指定。両方指定するとエラー。

### 3.2 データ絞り込みパラメータ（重要）

統計データは多次元構造を持っており、以下のパラメータで絞り込みます：

| パラメータ名 | 説明                   | 値の形式                 | 例            |
| ------------ | ---------------------- | ------------------------ | ------------- |
| `cdCat01`    | 分類事項 01 の絞り込み | コード（カンマ区切り可） | `#A03503`     |
| `cdCat02`    | 分類事項 02 の絞り込み | コード（カンマ区切り可） | `001,002`     |
| `cdCat03`    | 分類事項 03 の絞り込み | コード（カンマ区切り可） | `010`         |
| ...          | ...                    | ...                      | ...           |
| `cdCat15`    | 分類事項 15 の絞り込み | コード（カンマ区切り可） | `100`         |
| `cdArea`     | 地域コード             | コード（カンマ区切り可） | `13000,27000` |
| `cdTime`     | 時間軸コード           | コード（カンマ区切り可） | `2023000000`  |

#### 特殊キーワード

| キーワード     | 説明     | 使用例               |
| -------------- | -------- | -------------------- |
| `min`          | 最小値   | `cdTime=min`         |
| `max`          | 最大値   | `cdTime=max`         |
| `-` (ハイフン) | 範囲指定 | `cdArea=01000-09000` |

### 3.3 取得制御パラメータ

| パラメータ名        | 説明             | デフォルト | 備考                             |
| ------------------- | ---------------- | ---------- | -------------------------------- |
| `metaGetFlg`        | メタ情報取得有無 | `Y`        | `Y`: 取得、`N`: 取得しない       |
| `cntGetFlg`         | 件数取得フラグ   | `N`        | `Y`: 件数のみ、`N`: データも取得 |
| `explanationGetFlg` | 解説情報取得     | `Y`        | `Y`: 取得、`N`: 取得しない       |
| `annotationGetFlg`  | 注釈情報取得     | `Y`        | `Y`: 取得、`N`: 取得しない       |
| `sectionHeaderFlg`  | セクション単位   | `1`        | `1`: あり、`2`: なし             |
| `replaceSpChars`    | 特殊文字置換     | `0`        | `0`: なし、`1`〜`3`: 各種置換    |

### 3.4 ページング・取得件数制御

| パラメータ名    | 説明         | デフォルト | 制限            |
| --------------- | ------------ | ---------- | --------------- |
| `startPosition` | 取得開始位置 | `1`        | 1 以上          |
| `limit`         | 取得件数     | `10,000`   | 最大 100,000 件 |

## 4. レスポンスデータ構造

### 4.1 基本構造

```json
{
  "GET_STATS_DATA": {
    "RESULT": {
      "STATUS": 0,
      "ERROR_MSG": "正常に終了しました。",
      "DATE": "2024-01-15T10:30:00.000+09:00"
    },
    "PARAMETER": {
      // リクエストパラメータのエコーバック
    },
    "STATISTICAL_DATA": {
      // 実際の統計データ
    }
  }
}
```

### 4.2 STATISTICAL_DATA（統計データ本体）

#### 構造概要

```json
"STATISTICAL_DATA": {
  "RESULT_INF": {
    "TOTAL_NUMBER": 1392,
    "FROM_NUMBER": 1,
    "TO_NUMBER": 100,
    "NEXT_KEY": 101
  },
  "TABLE_INF": {
    // 統計表情報
  },
  "CLASS_INF": {
    // 分類情報（メタデータ）
  },
  "DATA_INF": {
    // 実際の数値データ
  }
}
```

### 4.3 TABLE_INF（統計表情報）

| フィールド        | 説明           | 例                                       |
| ----------------- | -------------- | ---------------------------------------- |
| `@id`             | 統計表 ID      | `"0003412313"`                           |
| `STAT_NAME`       | 統計調査名     | `{"@code": "00200522", "$": "国勢調査"}` |
| `GOV_ORG`         | 作成機関       | `{"@code": "00200", "$": "総務省"}`      |
| `STATISTICS_NAME` | 統計名称       | `"令和2年国勢調査 人口等基本集計"`       |
| `TITLE`           | 統計表タイトル | 都道府県別人口と人口増減率               |
| `CYCLE`           | 周期           | `"5年"`                                  |
| `SURVEY_DATE`     | 調査年月       | `"202010"`                               |

### 4.4 CLASS_INF（分類情報）

データの各軸（次元）の情報を保持します。

```json
"CLASS_INF": {
  "CLASS_OBJ": [
    {
      "@id": "cat01",
      "@name": "男女別",
      "CLASS": [
        {
          "@code": "001",
          "@name": "総数",
          "@unit": "人",
          "@level": "1"
        },
        {
          "@code": "002",
          "@name": "男",
          "@unit": "人"
        },
        {
          "@code": "003",
          "@name": "女",
          "@unit": "人"
        }
      ]
    },
    {
      "@id": "area",
      "@name": "地域",
      "CLASS": [
        {
          "@code": "00000",
          "@name": "全国",
          "@level": "1"
        },
        {
          "@code": "01000",
          "@name": "北海道",
          "@level": "2"
        }
        // ... 都道府県が続く
      ]
    },
    {
      "@id": "time",
      "@name": "時間軸（年次）",
      "CLASS": [
        {
          "@code": "2020000000",
          "@name": "2020年"
        }
      ]
    }
  ]
}
```

#### CLASS_OBJ の主要属性

| 属性    | 説明                            |
| ------- | ------------------------------- |
| `@id`   | 分類 ID（cat01, area, time 等） |
| `@name` | 分類名称                        |
| `CLASS` | 分類項目の配列                  |

#### CLASS の主要属性

| 属性          | 説明         |
| ------------- | ------------ |
| `@code`       | 項目コード   |
| `@name`       | 項目名称     |
| `@unit`       | 単位         |
| `@level`      | 階層レベル   |
| `@parentCode` | 親項目コード |

### 4.5 DATA_INF（数値データ）

実際の統計値を保持します。

```json
"DATA_INF": {
  "NOTE": [
    // 注釈情報（annotationGetFlg=Yの場合）
  ],
  "VALUE": [
    {
      "@cat01": "001",
      "@area": "00000",
      "@time": "2020000000",
      "@unit": "人",
      "@annotation": "",
      "$": "126146099"
    },
    {
      "@cat01": "001",
      "@area": "01000",
      "@time": "2020000000",
      "@unit": "人",
      "$": "5224614"
    }
    // ... データが続く
  ]
}
```

#### VALUE の属性

| 属性                    | 説明             |
| ----------------------- | ---------------- |
| `@cat01`, `@cat02`, ... | 分類事項のコード |
| `@area`                 | 地域コード       |
| `@time`                 | 時間軸コード     |
| `@unit`                 | 単位             |
| `@annotation`           | 注釈記号         |
| `$`                     | **実際の数値**   |

## 5. 実装例

### 5.1 基本的なデータ取得

#### TypeScript 型定義

```typescript
interface GetStatsDataParams {
  appId: string;
  statsDataId: string;
  lang?: "J" | "E";

  // 絞り込み条件
  cdCat01?: string;
  cdCat02?: string;
  cdCat03?: string;
  cdArea?: string;
  cdTime?: string;

  // 取得制御
  metaGetFlg?: "Y" | "N";
  cntGetFlg?: "Y" | "N";
  explanationGetFlg?: "Y" | "N";
  annotationGetFlg?: "Y" | "N";
  sectionHeaderFlg?: "1" | "2";

  // ページング
  startPosition?: number;
  limit?: number;
}

interface ClassObj {
  "@id": string;
  "@name": string;
  CLASS: Array<{
    "@code": string;
    "@name": string;
    "@unit"?: string;
    "@level"?: string;
    "@parentCode"?: string;
  }>;
}

interface DataValue {
  "@cat01"?: string;
  "@cat02"?: string;
  "@cat03"?: string;
  "@area"?: string;
  "@time"?: string;
  "@unit": string;
  "@annotation"?: string;
  $: string; // 数値（文字列形式）
}

interface GetStatsDataResponse {
  GET_STATS_DATA: {
    RESULT: {
      STATUS: number;
      ERROR_MSG: string;
      DATE: string;
    };
    PARAMETER: Record<string, any>;
    STATISTICAL_DATA: {
      RESULT_INF: {
        TOTAL_NUMBER: number;
        FROM_NUMBER: number;
        TO_NUMBER: number;
        NEXT_KEY?: number;
      };
      TABLE_INF: {
        "@id": string;
        STAT_NAME: { "@code": string; $: string };
        GOV_ORG: { "@code": string; $: string };
        STATISTICS_NAME: string;
        TITLE: string;
        CYCLE: string;
        SURVEY_DATE: string;
      };
      CLASS_INF: {
        CLASS_OBJ: ClassObj[];
      };
      DATA_INF: {
        NOTE?: any[];
        VALUE: DataValue[];
      };
    };
  };
}
```

#### データ取得関数

```typescript
async function getStatsData(
  params: GetStatsDataParams
): Promise<GetStatsDataResponse> {
  const baseUrl = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData";

  // パラメータをURLエンコード
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  const url = `${baseUrl}?${queryParams.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GetStatsDataResponse = await response.json();

    // エラーチェック
    if (data.GET_STATS_DATA.RESULT.STATUS !== 0) {
      throw new Error(data.GET_STATS_DATA.RESULT.ERROR_MSG);
    }

    return data;
  } catch (error) {
    console.error("統計データ取得エラー:", error);
    throw error;
  }
}
```

### 5.2 都道府県別人口データの取得

```typescript
// 例: 令和2年国勢調査の都道府県別人口
const populationData = await getStatsData({
  appId: "YOUR_APP_ID",
  statsDataId: "0003412313",
  cdCat01: "001", // 総数
  cdArea: "01000,13000,27000", // 北海道、東京、大阪
  metaGetFlg: "Y",
});

// データの抽出
const values = populationData.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE;

// 都道府県名とコードのマップを作成
const areaClass =
  populationData.GET_STATS_DATA.STATISTICAL_DATA.CLASS_INF.CLASS_OBJ.find(
    (obj) => obj["@id"] === "area"
  );

const areaMap = new Map(areaClass.CLASS.map((c) => [c["@code"], c["@name"]]));

// データを整形
const prefecturePopulation = values.map((v) => ({
  prefectureCode: v["@area"],
  prefectureName: areaMap.get(v["@area"]) || "",
  population: parseInt(v.$),
  unit: v["@unit"],
}));

console.log(prefecturePopulation);
// [
//   { prefectureCode: '01000', prefectureName: '北海道', population: 5224614, unit: '人' },
//   { prefectureCode: '13000', prefectureName: '東京都', population: 14047594, unit: '人' },
//   { prefectureCode: '27000', prefectureName: '大阪府', population: 8837685, unit: '人' }
// ]
```

### 5.3 全都道府県データの一括取得

```typescript
async function getAllPrefecturesData(
  statsDataId: string,
  categoryCode: string
): Promise<PrefectureData[]> {
  // 全都道府県を指定（01000〜47000）
  const prefCodes = Array.from(
    { length: 47 },
    (_, i) => `${String(i + 1).padStart(2, "0")}000`
  ).join(",");

  const response = await getStatsData({
    appId: "YOUR_APP_ID",
    statsDataId,
    cdCat01: categoryCode,
    cdArea: prefCodes,
    metaGetFlg: "Y",
  });

  // データ変換処理
  return transformToPrefectureData(response);
}

interface PrefectureData {
  code: string;
  name: string;
  value: number;
  unit: string;
}

function transformToPrefectureData(
  response: GetStatsDataResponse
): PrefectureData[] {
  const data = response.GET_STATS_DATA.STATISTICAL_DATA;

  // 地域名マップ作成
  const areaClass = data.CLASS_INF.CLASS_OBJ.find(
    (obj) => obj["@id"] === "area"
  );
  const areaMap = new Map(areaClass.CLASS.map((c) => [c["@code"], c["@name"]]));

  // データ変換
  return data.DATA_INF.VALUE.map((v) => ({
    code: v["@area"],
    name: areaMap.get(v["@area"]) || "",
    value: parseFloat(v.$),
    unit: v["@unit"],
  }));
}
```

### 5.4 時系列データの取得

```typescript
async function getTimeSeriesData(
  statsDataId: string,
  areaCode: string,
  categoryCode: string
): Promise<TimeSeriesData[]> {
  const response = await getStatsData({
    appId: "YOUR_APP_ID",
    statsDataId,
    cdCat01: categoryCode,
    cdArea: areaCode,
    cdTime: "min-max", // 全期間
    metaGetFlg: "Y",
  });

  const data = response.GET_STATS_DATA.STATISTICAL_DATA;

  // 時間軸マップ作成
  const timeClass = data.CLASS_INF.CLASS_OBJ.find(
    (obj) => obj["@id"] === "time"
  );
  const timeMap = new Map(timeClass.CLASS.map((c) => [c["@code"], c["@name"]]));

  return data.DATA_INF.VALUE.map((v) => ({
    time: v["@time"],
    timeName: timeMap.get(v["@time"]) || "",
    value: parseFloat(v.$),
    unit: v["@unit"],
  })).sort((a, b) => a.time.localeCompare(b.time));
}

interface TimeSeriesData {
  time: string;
  timeName: string;
  value: number;
  unit: string;
}
```

### 5.5 ページング処理の実装

```typescript
async function getAllDataWithPaging(
  params: GetStatsDataParams
): Promise<DataValue[]> {
  const allData: DataValue[] = [];
  let startPosition = 1;
  const limit = 100000; // 最大件数

  while (true) {
    const response = await getStatsData({
      ...params,
      startPosition,
      limit,
      metaGetFlg: startPosition === 1 ? "Y" : "N", // 最初だけメタ情報取得
    });

    const data = response.GET_STATS_DATA.STATISTICAL_DATA;
    allData.push(...data.DATA_INF.VALUE);

    // 次のページがない場合は終了
    if (
      !data.RESULT_INF.NEXT_KEY ||
      data.RESULT_INF.TO_NUMBER >= data.RESULT_INF.TOTAL_NUMBER
    ) {
      break;
    }

    startPosition = data.RESULT_INF.NEXT_KEY;

    // API制限を考慮した遅延
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return allData;
}
```

## 6. 実践的な活用例

### 6.1 都道府県ランキングの作成

```typescript
async function createPrefectureRanking(
  statsDataId: string,
  indicatorCode: string
): Promise<RankingData[]> {
  // 全都道府県データを取得
  const prefData = await getAllPrefecturesData(statsDataId, indicatorCode);

  // ランキング作成
  const ranked = prefData
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  return ranked;
}

interface RankingData extends PrefectureData {
  rank: number;
}

// 使用例: 人口ランキング
const populationRanking = await createPrefectureRanking("0003412313", "001");

console.log(populationRanking.slice(0, 5));
// [
//   { rank: 1, code: '13000', name: '東京都', value: 14047594, unit: '人' },
//   { rank: 2, code: '14000', name: '神奈川県', value: 9237337, unit: '人' },
//   ...
// ]
```

### 6.2 複数指標の同時取得

```typescript
async function getMultipleIndicators(
  statsDataId: string,
  areaCodes: string[],
  categoryCodes: string[]
): Promise<MultiIndicatorData[]> {
  const results: MultiIndicatorData[] = [];

  for (const areaCode of areaCodes) {
    const indicators: Record<string, number> = {};

    for (const catCode of categoryCodes) {
      const response = await getStatsData({
        appId: "YOUR_APP_ID",
        statsDataId,
        cdArea: areaCode,
        cdCat01: catCode,
        metaGetFlg: "N",
      });

      const value = response.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE[0];
      indicators[catCode] = parseFloat(value.$);

      // API制限対策
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    results.push({
      areaCode,
      indicators,
    });
  }

  return results;
}

interface MultiIndicatorData {
  areaCode: string;
  indicators: Record<string, number>;
}
```

### 6.3 データのキャッシング戦略

```typescript
class StatsDataCache {
  private cache: Map<
    string,
    {
      data: GetStatsDataResponse;
      timestamp: number;
    }
  > = new Map();

  private readonly TTL = 3600000; // 1時間

  async getData(params: GetStatsDataParams): Promise<GetStatsDataResponse> {
    const cacheKey = this.generateCacheKey(params);
    const cached = this.cache.get(cacheKey);

    // キャッシュが有効な場合
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }

    // データ取得
    const data = await getStatsData(params);

    // キャッシュに保存
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  private generateCacheKey(params: GetStatsDataParams): string {
    return JSON.stringify(params);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// 使用例
const cache = new StatsDataCache();
const data = await cache.getData({
  appId: "YOUR_APP_ID",
  statsDataId: "0003412313",
  cdCat01: "001",
});
```

## 7. エラーハンドリングとベストプラクティス

### 7.1 主なエラーと対処法

| STATUS | ERROR_MSG                        | 原因                   | 対処法       |
| ------ | -------------------------------- | ---------------------- | ------------ |
| `100`  | `"statsDataIdが不正です"`        | 統計表 ID が存在しない | ID を確認    |
| `100`  | `"パラメータが不正です"`         | パラメータの形式エラー | 仕様書を確認 |
| `100`  | `"データが存在しません"`         | 絞り込み条件に該当なし | 条件を緩和   |
| `100`  | `"アプリケーションIDが不正です"` | appId が無効           | ID を確認    |

### 7.2 リトライ機構の実装

```typescript
async function getStatsDataWithRetry(
  params: GetStatsDataParams,
  maxRetries: number = 3
): Promise<GetStatsDataResponse> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await getStatsData(params);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // 指数バックオフ
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries exceeded");
}
```

### 7.3 レート制限への対応

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private readonly delay = 200; // 200ms間隔

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        await new Promise((resolve) => setTimeout(resolve, this.delay));
      }
    }

    this.processing = false;
  }
}

// 使用例
const limiter = new RateLimiter();

const results = await Promise.all(
  prefectureCodes.map((code) =>
    limiter.execute(() =>
      getStatsData({
        appId: "YOUR_APP_ID",
        statsDataId: "0003412313",
        cdArea: code,
      })
    )
  )
);
```

## 8. パフォーマンス最適化

### 8.1 必要なデータのみ取得

```typescript
// ❌ 悪い例: すべてのデータを取得
const allData = await getStatsData({
  appId: "YOUR_APP_ID",
  statsDataId: "0003412313",
  // 絞り込みなし
});

// ✅ 良い例: 必要な地域・分類のみ
const targetData = await getStatsData({
  appId: "YOUR_APP_ID",
  statsDataId: "0003412313",
  cdArea: "13000,27000", // 東京と大阪のみ
  cdCat01: "001", // 総数のみ
  metaGetFlg: "N", // メタ情報不要な場合
  annotationGetFlg: "N", // 注釈不要な場合
});
```

### 8.2 並列処理の活用

```typescript
async function getMultiplePrefecturesParallel(
  statsDataId: string,
  prefectureCodes: string[],
  categoryCode: string
): Promise<PrefectureData[]> {
  // 並列で複数のリクエスト
  const promises = prefectureCodes.map((code) =>
    limiter.execute(() =>
      getStatsData({
        appId: "YOUR_APP_ID",
        statsDataId,
        cdArea: code,
        cdCat01: categoryCode,
        metaGetFlg: "N",
      })
    )
  );

  const responses = await Promise.all(promises);

  // データ変換
  return responses.map((res, idx) => {
    const value = res.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE[0];
    return {
      code: prefectureCodes[idx],
      name: "", // 別途取得が必要
      value: parseFloat(value.$),
      unit: value["@unit"],
    };
  });
}
```

## 9. データ構造の理解と変換

### 9.1 多次元データの扱い方

e-Stat の統計データは多次元（複数軸）構造を持っています。

```typescript
// 例: 3次元データ（性別 × 都道府県 × 年次）
interface MultiDimensionalData {
  gender: string; // 男/女/総数
  prefecture: string; // 都道府県
  year: string; // 年次
  value: number;
}

function parseMultiDimensionalData(
  response: GetStatsDataResponse
): MultiDimensionalData[] {
  const data = response.GET_STATS_DATA.STATISTICAL_DATA;

  // 各軸の名称マップを作成
  const genderMap = createClassMap(data.CLASS_INF.CLASS_OBJ, "cat01");
  const prefMap = createClassMap(data.CLASS_INF.CLASS_OBJ, "area");
  const yearMap = createClassMap(data.CLASS_INF.CLASS_OBJ, "time");

  return data.DATA_INF.VALUE.map((v) => ({
    gender: genderMap.get(v["@cat01"]) || "",
    prefecture: prefMap.get(v["@area"]) || "",
    year: yearMap.get(v["@time"]) || "",
    value: parseFloat(v.$),
  }));
}

function createClassMap(
  classObjs: ClassObj[],
  id: string
): Map<string, string> {
  const obj = classObjs.find((o) => o["@id"] === id);
  if (!obj) return new Map();

  return new Map(obj.CLASS.map((c) => [c["@code"], c["@name"]]));
}
```

### 9.2 階層構造データの処理

```typescript
// 例: 地域階層（全国 → 都道府県 → 市区町村）
interface HierarchicalData {
  code: string;
  name: string;
  level: number;
  parentCode?: string;
  value: number;
  children?: HierarchicalData[];
}

function buildHierarchy(response: GetStatsDataResponse): HierarchicalData[] {
  const data = response.GET_STATS_DATA.STATISTICAL_DATA;
  const areaClass = data.CLASS_INF.CLASS_OBJ.find(
    (obj) => obj["@id"] === "area"
  );

  if (!areaClass) return [];

  // データを階層構造に変換
  const nodeMap = new Map<string, HierarchicalData>();

  data.DATA_INF.VALUE.forEach((v) => {
    const classInfo = areaClass.CLASS.find((c) => c["@code"] === v["@area"]);
    if (!classInfo) return;

    const node: HierarchicalData = {
      code: v["@area"],
      name: classInfo["@name"],
      level: parseInt(classInfo["@level"] || "1"),
      parentCode: classInfo["@parentCode"],
      value: parseFloat(v.$),
    };

    nodeMap.set(node.code, node);
  });

  // 親子関係を構築
  const rootNodes: HierarchicalData[] = [];

  nodeMap.forEach((node) => {
    if (node.parentCode) {
      const parent = nodeMap.get(node.parentCode);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}
```

### 9.3 データのピボット処理

```typescript
// 縦持ちデータを横持ちに変換
interface PivotedData {
  [key: string]: any;
}

function pivotData(
  data: MultiDimensionalData[],
  rowKey: keyof MultiDimensionalData,
  columnKey: keyof MultiDimensionalData,
  valueKey: keyof MultiDimensionalData
): PivotedData[] {
  const pivoted = new Map<string, PivotedData>();

  data.forEach((item) => {
    const row = String(item[rowKey]);
    const col = String(item[columnKey]);
    const val = item[valueKey];

    if (!pivoted.has(row)) {
      pivoted.set(row, { [rowKey]: row });
    }

    const rowData = pivoted.get(row)!;
    rowData[col] = val;
  });

  return Array.from(pivoted.values());
}

// 使用例
const multiData: MultiDimensionalData[] = [
  { gender: "総数", prefecture: "北海道", year: "2020", value: 5224614 },
  { gender: "男", prefecture: "北海道", year: "2020", value: 2523265 },
  { gender: "女", prefecture: "北海道", year: "2020", value: 2701349 },
  // ...
];

const pivoted = pivotData(multiData, "prefecture", "gender", "value");
// [
//   { prefecture: '北海道', '総数': 5224614, '男': 2523265, '女': 2701349 },
//   ...
// ]
```

## 10. 実践シナリオ：都道府県ダッシュボード用データ取得

### 10.1 完全な実装例

```typescript
interface DashboardData {
  prefectures: PrefectureInfo[];
  indicators: IndicatorData[];
  rankings: RankingResult[];
  timeSeries: TimeSeriesResult[];
}

interface PrefectureInfo {
  code: string;
  name: string;
  region: string;
}

interface IndicatorData {
  indicatorId: string;
  indicatorName: string;
  unit: string;
  data: Array<{
    prefectureCode: string;
    value: number;
  }>;
}

interface RankingResult {
  indicatorId: string;
  rankings: Array<{
    rank: number;
    prefectureCode: string;
    prefectureName: string;
    value: number;
  }>;
}

interface TimeSeriesResult {
  indicatorId: string;
  prefectureCode: string;
  data: Array<{
    year: number;
    value: number;
  }>;
}

class DashboardDataFetcher {
  private cache = new StatsDataCache();
  private limiter = new RateLimiter();

  constructor(private appId: string) {}

  async fetchDashboardData(
    statsDataIds: string[],
    prefectureCodes: string[]
  ): Promise<DashboardData> {
    // 並列で複数の統計表データを取得
    const indicatorsPromises = statsDataIds.map((id) =>
      this.fetchIndicatorData(id, prefectureCodes)
    );

    const indicators = await Promise.all(indicatorsPromises);

    // ランキング作成
    const rankings = indicators.map((ind) => this.createRanking(ind));

    // 時系列データ取得（特定の都道府県のみ）
    const timeSeriesPromises = statsDataIds.map(
      (id) => this.fetchTimeSeries(id, "13000") // 東京都
    );

    const timeSeries = await Promise.all(timeSeriesPromises);

    // 都道府県情報
    const prefectures = await this.fetchPrefectureInfo(prefectureCodes);

    return {
      prefectures,
      indicators,
      rankings,
      timeSeries,
    };
  }

  private async fetchIndicatorData(
    statsDataId: string,
    prefectureCodes: string[]
  ): Promise<IndicatorData> {
    const response = await this.limiter.execute(() =>
      this.cache.getData({
        appId: this.appId,
        statsDataId,
        cdArea: prefectureCodes.join(","),
        cdCat01: "001", // 総数
        metaGetFlg: "Y",
      })
    );

    const data = response.GET_STATS_DATA.STATISTICAL_DATA;

    // 指標情報取得
    const cat01Class = data.CLASS_INF.CLASS_OBJ.find(
      (obj) => obj["@id"] === "cat01"
    );
    const indicatorName = cat01Class?.CLASS[0]["@name"] || "";
    const unit = cat01Class?.CLASS[0]["@unit"] || "";

    return {
      indicatorId: statsDataId,
      indicatorName,
      unit,
      data: data.DATA_INF.VALUE.map((v) => ({
        prefectureCode: v["@area"],
        value: parseFloat(v.$),
      })),
    };
  }

  private createRanking(indicator: IndicatorData): RankingResult {
    const sorted = [...indicator.data].sort((a, b) => b.value - a.value);

    return {
      indicatorId: indicator.indicatorId,
      rankings: sorted.map((item, index) => ({
        rank: index + 1,
        prefectureCode: item.prefectureCode,
        prefectureName: "", // 別途マッピング必要
        value: item.value,
      })),
    };
  }

  private async fetchTimeSeries(
    statsDataId: string,
    prefectureCode: string
  ): Promise<TimeSeriesResult> {
    const response = await this.limiter.execute(() =>
      this.cache.getData({
        appId: this.appId,
        statsDataId,
        cdArea: prefectureCode,
        cdTime: "min-max",
        metaGetFlg: "Y",
      })
    );

    const data = response.GET_STATS_DATA.STATISTICAL_DATA;

    // 時間軸マップ
    const timeClass = data.CLASS_INF.CLASS_OBJ.find(
      (obj) => obj["@id"] === "time"
    );

    return {
      indicatorId: statsDataId,
      prefectureCode,
      data: data.DATA_INF.VALUE.map((v) => ({
        year: parseInt(v["@time"].substring(0, 4)),
        value: parseFloat(v.$),
      })).sort((a, b) => a.year - b.year),
    };
  }

  private async fetchPrefectureInfo(
    codes: string[]
  ): Promise<PrefectureInfo[]> {
    // 都道府県情報は静的データから取得
    // または別のAPIで取得
    return codes.map((code) => ({
      code,
      name: this.getPrefectureName(code),
      region: this.getRegion(code),
    }));
  }

  private getPrefectureName(code: string): string {
    // 都道府県コードから名称を取得
    const prefMap: Record<string, string> = {
      "01000": "北海道",
      "13000": "東京都",
      "27000": "大阪府",
      // ... 他の都道府県
    };
    return prefMap[code] || "";
  }

  private getRegion(code: string): string {
    // 都道府県コードから地方を判定
    const num = parseInt(code.substring(0, 2));
    if (num === 1) return "北海道";
    if (num >= 2 && num <= 7) return "東北";
    if (num >= 8 && num <= 14) return "関東";
    if (num >= 15 && num <= 23) return "中部";
    if (num >= 24 && num <= 30) return "近畿";
    if (num >= 31 && num <= 35) return "中国";
    if (num >= 36 && num <= 39) return "四国";
    return "九州・沖縄";
  }
}

// 使用例
const fetcher = new DashboardDataFetcher("YOUR_APP_ID");

const dashboardData = await fetcher.fetchDashboardData(
  ["0003412313", "0003412314"], // 統計表ID
  ["01000", "13000", "27000", "40000"] // 都道府県コード
);

console.log(dashboardData);
```

### 10.2 データベースへの保存

```typescript
// Cloudflare D1への保存例
async function saveToD1(
  db: D1Database,
  indicator: IndicatorData
): Promise<void> {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO prefecture_indicators 
    (indicator_id, prefecture_code, value, unit, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const batch = indicator.data.map((item) =>
    stmt.bind(
      indicator.indicatorId,
      item.prefectureCode,
      item.value,
      indicator.unit,
      new Date().toISOString()
    )
  );

  await db.batch(batch);
}
```

## 11. よくある使用パターンまとめ

### パターン 1: 最新の都道府県別データ取得

```typescript
const latestData = await getStatsData({
  appId: "YOUR_APP_ID",
  statsDataId: "STATS_ID",
  cdTime: "max", // 最新年次
  cdCat01: "001", // 総数
  metaGetFlg: "Y",
});
```

### パターン 2: 特定都道府県の時系列データ

```typescript
const timeSeriesData = await getStatsData({
  appId: "YOUR_APP_ID",
  statsDataId: "STATS_ID",
  cdArea: "13000", // 東京都
  cdTime: "min-max", // 全期間
  metaGetFlg: "Y",
});
```

### パターン 3: 複数分類の同時取得

```typescript
const multiCategoryData = await getStatsData({
  appId: "YOUR_APP_ID",
  statsDataId: "STATS_ID",
  cdCat01: "001,002,003", // 総数、男、女
  cdArea: "13000",
  metaGetFlg: "Y",
});
```

### パターン 4: データ件数の確認

```typescript
const countOnly = await getStatsData({
  appId: "YOUR_APP_ID",
  statsDataId: "STATS_ID",
  cntGetFlg: "Y", // 件数のみ取得
});

const totalCount =
  countOnly.GET_STATS_DATA.STATISTICAL_DATA.RESULT_INF.TOTAL_NUMBER;
```

## 12. トラブルシューティング

### 問題 1: データが取得できない

**症状**: `STATUS: 100`, `"データが存在しません"`

**原因と対処**:

1. 統計表 ID が間違っている → GET_STATS_LIST で確認
2. 絞り込み条件が厳しすぎる → 条件を緩和
3. 指定した分類コードが存在しない → GET_META_INFO で確認

### 問題 2: レスポンスが遅い

**原因と対処**:

1. データ量が多すぎる → 絞り込み条件を追加
2. メタ情報を毎回取得している → `metaGetFlg='N'`に設定
3. ページングが必要 → `limit`を調整

### 問題 3: メモリ不足

**原因と対処**:

1. 一度に大量のデータを取得 → ページング処理を実装
2. キャッシュが肥大化 → 定期的にクリア
3. データ変換処理が非効率 → ストリーミング処理を検討

# EstatStatsDataService

## 概要

`EstatStatsDataService` は、e-Stat APIから統計データを取得し、アプリケーションで使いやすい形式に整形するためのサービスクラスです。

**ファイルパス**: `src/infrastructure/estat/statsdata/EstatStatsDataService.ts`

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

## 13. ベストプラクティス総まとめ

### ✅ 推奨事項

1. **JSON 形式を使用** - パースが容易
2. **必要なデータのみ取得** - 絞り込み条件を活用
3. **キャッシングを実装** - 同じデータの再取得を避ける
4. **レート制限対策** - リクエスト間隔を設定
5. **エラーハンドリング** - リトライ機構を実装
6. **ページング処理** - 大量データに対応
7. **メタ情報の再利用** - 初回のみ取得してキャッシュ

### ❌ 避けるべき事項

1. **無制限のデータ取得** - limit を適切に設定
2. **連続的な大量リクエスト** - レート制限に注意
3. **毎回メタ情報取得** - 必要時のみ取得
4. **エラー無視** - STATUS 確認を怠らない
5. **同期処理のみ** - 並列処理を活用

## 14. まとめ

### GET_STATS_DATA の重要ポイント

1. **実データ取得の中核 API** - 統計表の数値を取得
2. **多次元データ構造** - 複数軸（分類、地域、時間）を理解
3. **柔軟な絞り込み** - 必要なデータのみ効率的に取得
4. **メタ情報との組み合わせ** - データの意味を正確に理解

### 典型的なワークフロー

```
1. GET_STATS_LIST → 統計表IDを検索
2. GET_META_INFO → メタ情報を取得（任意）
3. GET_STATS_DATA → 実データを取得
4. データ変換・整形
5. データベース保存またはUIに表示
```

### Next.js アプリでの実装イメージ

```typescript
// pages/api/prefectures/[indicator].ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { indicator } = req.query;

  const fetcher = new DashboardDataFetcher(process.env.ESTAT_APP_ID!);
  const data = await fetcher.fetchIndicatorData(
    indicator as string,
    ALL_PREFECTURE_CODES
  );

  res.status(200).json(data);
}
```

このガイドを活用して、都道府県ランキングアプリの実装を進めてください！

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
# stats-data 単体テストガイド

## 概要

stats-data サブドメインの単体テストの実装方法について説明します。EstatStatsDataService と EstatStatsDataFormatter のテスト方法を詳述します。

## テスト環境のセットアップ

### 1. 必要な依存関係

```bash
npm install --save-dev vitest @vitest/ui
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev msw
```

### 2. Vitest 設定

`vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/config/test.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 3. テストセットアップ

`src/config/test.setup.ts`

```typescript
// 環境変数の設定
process.env.NEXT_PUBLIC_ESTAT_APP_ID = "test-app-id";

// コンソールログの抑制（テスト時）
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (args[0]?.includes?.("Warning:")) {
    return;
  }
  originalConsoleError(...args);
};
```

## EstatStatsDataService のテスト

### 1. 基本テスト

`src/infrastructure/estat-api/stats-data/__tests__/service.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstatStatsDataService } from "../service";
import { EstatStatsDataFetchError } from "../../errors";

// モック
vi.mock("../../config", () => ({
  ESTAT_API_CONFIG: {
    baseUrl: "https://api.e-stat.go.jp/rest/3.0/app/json",
    appId: "test-app-id",
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
}));

describe("EstatStatsDataService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAndFormatStatsData", () => {
    it("正常に統計データを取得・整形できる", async () => {
      const mockResponse = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          STATISTICAL_DATA: {
            DATA_INF: {
              VALUE: [
                {
                  "@area": "13000",
                  "@cat01": "A1101",
                  "@time": "2023",
                  $: "14000000",
                },
              ],
            },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  "@id": "area",
                  "@name": "地域",
                  CLASS: [
                    {
                      "@code": "13000",
                      "@name": "東京都",
                    },
                  ],
                },
                {
                  "@id": "cat01",
                  "@name": "分類",
                  CLASS: [
                    {
                      "@code": "A1101",
                      "@name": "総人口",
                    },
                  ],
                },
                {
                  "@id": "time",
                  "@name": "時間",
                  CLASS: [
                    {
                      "@code": "2023",
                      "@name": "2023年",
                    },
                  ],
                },
              ],
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await EstatStatsDataService.getAndFormatStatsData(
        "0000010101"
      );

      expect(result).toHaveProperty("values");
      expect(result).toHaveProperty("areas");
      expect(result).toHaveProperty("categories");
      expect(result).toHaveProperty("years");
      expect(result.values).toHaveLength(1);
      expect(result.values[0]).toMatchObject({
        areaCode: "13000",
        areaName: "東京都",
        value: 14000000,
        categoryCode: "A1101",
        categoryName: "総人口",
        timeCode: "2023",
        timeName: "2023年",
      });
    });

    it("フィルタリングオプションが正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          STATISTICAL_DATA: {
            DATA_INF: { VALUE: [] },
            CLASS_INF: { CLASS_OBJ: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsDataService.getAndFormatStatsData("0000010101", {
        categoryFilter: "A1101",
        yearFilter: "2023",
        areaFilter: "13000",
        limit: 100,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=test-app-id&statsDataId=0000010101&metaGetFlg=Y&cntGetFlg=N&cdCat01=A1101&cdTime=2023&cdArea=13000&limit=100"
      );
    });

    it("APIエラー時に適切なエラーを投げる", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      });

      await expect(
        EstatStatsDataService.getAndFormatStatsData("0000010101")
      ).rejects.toThrow(EstatStatsDataFetchError);
    });

    it("無効な統計表IDでエラーを投げる", async () => {
      await expect(
        EstatStatsDataService.getAndFormatStatsData("invalid-id")
      ).rejects.toThrow();
    });
  });

  describe("getAvailableYears", () => {
    it("利用可能な年度を正しく取得できる", async () => {
      const mockResponse = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          STATISTICAL_DATA: {
            DATA_INF: { VALUE: [] },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  "@id": "time",
                  "@name": "時間",
                  CLASS: [
                    { "@code": "2020", "@name": "2020年" },
                    { "@code": "2021", "@name": "2021年" },
                    { "@code": "2022", "@name": "2022年" },
                    { "@code": "2023", "@name": "2023年" },
                  ],
                },
              ],
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const years = await EstatStatsDataService.getAvailableYears("0000010101");

      expect(years).toEqual(["2020", "2021", "2022", "2023"]);
    });
  });

  describe("getPrefectureData", () => {
    it("都道府県データを正しく取得できる", async () => {
      const mockResponse = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          STATISTICAL_DATA: {
            DATA_INF: {
              VALUE: [
                {
                  "@area": "01000",
                  "@cat01": "A1101",
                  "@time": "2023",
                  $: "5200000",
                },
                {
                  "@area": "13000",
                  "@cat01": "A1101",
                  "@time": "2023",
                  $: "14000000",
                },
              ],
            },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  "@id": "area",
                  "@name": "地域",
                  CLASS: [
                    { "@code": "01000", "@name": "北海道" },
                    { "@code": "13000", "@name": "東京都" },
                  ],
                },
              ],
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const prefectureData = await EstatStatsDataService.getPrefectureData(
        "0000010101",
        { yearFilter: "2023" }
      );

      expect(prefectureData).toHaveLength(2);
      expect(prefectureData[0]).toMatchObject({
        areaCode: "01000",
        areaName: "北海道",
        value: 5200000,
      });
    });
  });
});
```

## EstatStatsDataFormatter のテスト

### 1. 基本テスト

`src/infrastructure/estat-api/stats-data/__tests__/formatter.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { EstatStatsDataFormatter } from "../formatter";
import { EstatStatsDataResponse } from "../../types/stats-data";

describe("EstatStatsDataFormatter", () => {
  describe("formatStatsData", () => {
    it("統計データを正しく整形できる", () => {
      const mockResponse: EstatStatsDataResponse = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          STATISTICAL_DATA: {
            DATA_INF: {
              VALUE: [
                {
                  "@area": "13000",
                  "@cat01": "A1101",
                  "@time": "2023",
                  $: "14000000",
                },
              ],
            },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  "@id": "area",
                  "@name": "地域",
                  CLASS: [
                    {
                      "@code": "13000",
                      "@name": "東京都",
                    },
                  ],
                },
                {
                  "@id": "cat01",
                  "@name": "分類",
                  CLASS: [
                    {
                      "@code": "A1101",
                      "@name": "総人口",
                    },
                  ],
                },
                {
                  "@id": "time",
                  "@name": "時間",
                  CLASS: [
                    {
                      "@code": "2023",
                      "@name": "2023年",
                    },
                  ],
                },
              ],
            },
          },
        },
      };

      const result = EstatStatsDataFormatter.formatStatsData(mockResponse);

      expect(result).toHaveProperty("values");
      expect(result).toHaveProperty("areas");
      expect(result).toHaveProperty("categories");
      expect(result).toHaveProperty("years");
      expect(result.values).toHaveLength(1);
      expect(result.values[0]).toMatchObject({
        areaCode: "13000",
        areaName: "東京都",
        value: 14000000,
        categoryCode: "A1101",
        categoryName: "総人口",
        timeCode: "2023",
        timeName: "2023年",
      });
    });

    it("空のデータを正しく処理できる", () => {
      const mockResponse: EstatStatsDataResponse = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          STATISTICAL_DATA: {
            DATA_INF: { VALUE: [] },
            CLASS_INF: { CLASS_OBJ: [] },
          },
        },
      };

      const result = EstatStatsDataFormatter.formatStatsData(mockResponse);

      expect(result.values).toEqual([]);
      expect(result.areas).toEqual([]);
      expect(result.categories).toEqual([]);
      expect(result.years).toEqual([]);
    });

    it("NULL値を正しく処理できる", () => {
      const mockResponse: EstatStatsDataResponse = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          STATISTICAL_DATA: {
            DATA_INF: {
              VALUE: [
                {
                  "@area": "13000",
                  "@cat01": "A1101",
                  "@time": "2023",
                  $: null,
                },
              ],
            },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  "@id": "area",
                  "@name": "地域",
                  CLASS: [
                    {
                      "@code": "13000",
                      "@name": "東京都",
                    },
                  ],
                },
                {
                  "@id": "cat01",
                  "@name": "分類",
                  CLASS: [
                    {
                      "@code": "A1101",
                      "@name": "総人口",
                    },
                  ],
                },
                {
                  "@id": "time",
                  "@name": "時間",
                  CLASS: [
                    {
                      "@code": "2023",
                      "@name": "2023年",
                    },
                  ],
                },
              ],
            },
          },
        },
      };

      const result = EstatStatsDataFormatter.formatStatsData(mockResponse);

      expect(result.values[0].value).toBeNull();
    });
  });

  describe("formatAreas", () => {
    it("地域データを正しく整形できる", () => {
      const rawAreas = [
        {
          "@id": "area",
          "@name": "地域",
          CLASS: [
            {
              "@code": "13000",
              "@name": "東京都",
              "@level": "1",
            },
            {
              "@code": "27000",
              "@name": "大阪府",
              "@level": "1",
            },
          ],
        },
      ];

      const result = EstatStatsDataFormatter.formatAreas(rawAreas);

      expect(result).toEqual([
        { code: "13000", name: "東京都", level: 1 },
        { code: "27000", name: "大阪府", level: 1 },
      ]);
    });

    it("空のデータを正しく処理できる", () => {
      const result = EstatStatsDataFormatter.formatAreas([]);
      expect(result).toEqual([]);
    });
  });

  describe("formatCategories", () => {
    it("分類データを正しく整形できる", () => {
      const rawCategories = [
        {
          "@id": "cat01",
          "@name": "分類",
          CLASS: [
            {
              "@code": "A1101",
              "@name": "総人口",
              "@level": "1",
            },
            {
              "@code": "A1102",
              "@name": "男性人口",
              "@level": "1",
            },
          ],
        },
      ];

      const result = EstatStatsDataFormatter.formatCategories(rawCategories);

      expect(result).toEqual([
        { code: "A1101", name: "総人口", level: 1 },
        { code: "A1102", name: "男性人口", level: 1 },
      ]);
    });
  });

  describe("formatYears", () => {
    it("年度データを正しく整形できる", () => {
      const rawYears = [
        {
          "@id": "time",
          "@name": "時間",
          CLASS: [
            {
              "@code": "2020",
              "@name": "2020年",
            },
            {
              "@code": "2021",
              "@name": "2021年",
            },
          ],
        },
      ];

      const result = EstatStatsDataFormatter.formatYears(rawYears);

      expect(result).toEqual([
        { code: "2020", name: "2020年" },
        { code: "2021", name: "2021年" },
      ]);
    });
  });

  describe("formatValues", () => {
    it("値データを正しく整形できる", () => {
      const rawValues = [
        {
          "@area": "13000",
          "@cat01": "A1101",
          "@time": "2023",
          $: "14000000",
        },
      ];

      const areas = [{ code: "13000", name: "東京都", level: 1 }];
      const categories = [{ code: "A1101", name: "総人口", level: 1 }];
      const years = [{ code: "2023", name: "2023年" }];

      const result = EstatStatsDataFormatter.formatValues(
        rawValues,
        areas,
        categories,
        years
      );

      expect(result).toEqual([
        {
          areaCode: "13000",
          areaName: "東京都",
          value: 14000000,
          unit: null,
          categoryCode: "A1101",
          categoryName: "総人口",
          timeCode: "2023",
          timeName: "2023年",
        },
      ]);
    });

    it("NULL値を正しく処理できる", () => {
      const rawValues = [
        {
          "@area": "13000",
          "@cat01": "A1101",
          "@time": "2023",
          $: null,
        },
      ];

      const areas = [{ code: "13000", name: "東京都", level: 1 }];
      const categories = [{ code: "A1101", name: "総人口", level: 1 }];
      const years = [{ code: "2023", name: "2023年" }];

      const result = EstatStatsDataFormatter.formatValues(
        rawValues,
        areas,
        categories,
        years
      );

      expect(result[0].value).toBeNull();
    });
  });
});
```

## フィルタリング機能のテスト

### 1. フィルタリングテスト

`src/infrastructure/estat-api/stats-data/__tests__/filtering.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { EstatStatsDataService } from "../service";

describe("Stats Data Filtering", () => {
  describe("categoryFilter", () => {
    it("分類フィルタが正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          STATISTICAL_DATA: {
            DATA_INF: { VALUE: [] },
            CLASS_INF: { CLASS_OBJ: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsDataService.getAndFormatStatsData("0000010101", {
        categoryFilter: "A1101",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("cdCat01=A1101")
      );
    });
  });

  describe("yearFilter", () => {
    it("年度フィルタが正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          STATISTICAL_DATA: {
            DATA_INF: { VALUE: [] },
            CLASS_INF: { CLASS_OBJ: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsDataService.getAndFormatStatsData("0000010101", {
        yearFilter: "2023",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("cdTime=2023")
      );
    });
  });

  describe("areaFilter", () => {
    it("地域フィルタが正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          STATISTICAL_DATA: {
            DATA_INF: { VALUE: [] },
            CLASS_INF: { CLASS_OBJ: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsDataService.getAndFormatStatsData("0000010101", {
        areaFilter: "13000",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("cdArea=13000")
      );
    });
  });

  describe("limit", () => {
    it("制限数が正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          STATISTICAL_DATA: {
            DATA_INF: { VALUE: [] },
            CLASS_INF: { CLASS_OBJ: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsDataService.getAndFormatStatsData("0000010101", {
        limit: 100,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=100")
      );
    });
  });
});
```

## テストデータの管理

### 1. テストデータファクトリ

`src/infrastructure/estat-api/stats-data/__tests__/fixtures/index.ts`

```typescript
export const mockEstatStatsDataResponse = {
  GET_STATS_DATA: {
    RESULT: {
      STATUS: 0,
      ERROR_MSG: null,
      DATE: "2024-01-01T00:00:00+09:00",
    },
    STATISTICAL_DATA: {
      DATA_INF: {
        VALUE: [
          {
            "@area": "13000",
            "@cat01": "A1101",
            "@time": "2023",
            $: "14000000",
          },
          {
            "@area": "27000",
            "@cat01": "A1101",
            "@time": "2023",
            $: "8800000",
          },
        ],
      },
      CLASS_INF: {
        CLASS_OBJ: [
          {
            "@id": "area",
            "@name": "地域",
            CLASS: [
              {
                "@code": "13000",
                "@name": "東京都",
                "@level": "1",
              },
              {
                "@code": "27000",
                "@name": "大阪府",
                "@level": "1",
              },
            ],
          },
          {
            "@id": "cat01",
            "@name": "分類",
            CLASS: [
              {
                "@code": "A1101",
                "@name": "総人口",
                "@level": "1",
              },
            ],
          },
          {
            "@id": "time",
            "@name": "時間",
            CLASS: [
              {
                "@code": "2023",
                "@name": "2023年",
              },
            ],
          },
        ],
      },
    },
  },
};

export const mockFormattedStatsData = {
  values: [
    {
      areaCode: "13000",
      areaName: "東京都",
      value: 14000000,
      unit: null,
      categoryCode: "A1101",
      categoryName: "総人口",
      timeCode: "2023",
      timeName: "2023年",
    },
    {
      areaCode: "27000",
      areaName: "大阪府",
      value: 8800000,
      unit: null,
      categoryCode: "A1101",
      categoryName: "総人口",
      timeCode: "2023",
      timeName: "2023年",
    },
  ],
  areas: [
    { code: "13000", name: "東京都", level: 1 },
    { code: "27000", name: "大阪府", level: 1 },
  ],
  categories: [{ code: "A1101", name: "総人口", level: 1 }],
  years: [{ code: "2023", name: "2023年" }],
};
```

## テスト実行

### 1. テストコマンド

```bash
# 全テスト実行
npm test

# 特定のファイルのテスト
npm test stats-data

# カバレッジ付きテスト
npm run test:coverage

# ウォッチモード
npm run test:watch
```

### 2. テスト結果の確認

```bash
# カバレッジレポートの確認
npm run test:coverage

# テスト結果の詳細表示
npm test -- --reporter=verbose
```

## 関連ドキュメント

- [テスト戦略](testing-strategy.md)
- [統合テスト](integration-testing.md)
- [モック作成ガイド](mocking-guide.md)
- [テストデータ管理](test-data.md)
- [stats-data 概要](04_ドメイン設計/e-Stat%20API/04_統計データ/overview.md)
- [stats-data 実装ガイド](../implementation/)


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
