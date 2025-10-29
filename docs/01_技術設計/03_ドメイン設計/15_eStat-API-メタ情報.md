---
title: meta-info サブドメイン概要
created: 2025-01-18
updated: 2025-10-27
tags:
  - domain/estat-api
  - subdomain/meta-info
---

# meta-info サブドメイン概要

## 目的

meta-info サブドメインは、e-Stat API から取得した統計表のメタ情報（基本情報、分類情報、地域情報、時間軸情報など）を管理する責務を持ちます。

## 主要な機能

### 1. メタ情報の取得と変換

- e-Stat API からメタ情報を取得（fetchMetaInfo, fetchAndTransformMetaInfo）
- 構造化された形式への変換（parseCompleteMetaInfo）
- テーブル情報、分類、時間軸の抽出

### 2. UIコンポーネント

- メタ情報取得フォーム（EstatMetaInfoFetcher）
- メタ情報表示（EstatMetaInfoDisplay）
- サイドバーナビゲーション（EstatMetaInfoSidebar）
- 保存済みメタ情報リスト（SavedMetaInfoListItem）

### 3. データ管理

- メタ情報のダウンロード（JSON形式）
- メタ情報の保存
- R2ストレージ連携

## アーキテクチャ

### ディレクトリ構造

```
src/features/estat-api/meta-info/
├── components/                 # UIコンポーネント
│   ├── EstatMetaInfoFetcher/  # メタ情報取得フォーム
│   ├── EstatMetaInfoDisplay/  # メタ情報表示
│   │   └── tabs/              # タブコンポーネント
│   ├── EstatMetaInfoSidebar/  # サイドバー
│   ├── SavedMetaInfoListItem/ # 保存済みリスト項目
│   └── index.ts
├── hooks/                      # カスタムフック
│   ├── useMetaInfoDownload.ts # ダウンロード機能
│   ├── useMetaInfoSave.ts     # 保存機能
│   └── index.ts
├── services/                   # サービス層
│   ├── fetcher.ts             # API通信関数
│   └── formatter.ts           # データ変換関数
├── types/                      # 型定義
│   └── index.ts
├── __tests__/                  # テストファイル
└── index.ts                    # エントリーポイント
```

### データフロー

```
ユーザー入力（統計表ID）
    │
    ▼
EstatMetaInfoFetcher (UIコンポーネント)
    │
    ▼
fetchAndTransformMetaInfo() または fetchMetaInfo()
    │
    ├─► executeHttpRequest() → e-Stat API通信
    │       │
    │       ▼
    │   生APIレスポンス (EstatMetaInfoResponse)
    │
    └─► parseCompleteMetaInfo() → データ解析
            │
            ├─► extractTableInfo() → テーブル基本情報
            ├─► extractCategories() → 分類情報
            └─► extractTimeAxis() → 時間軸情報
                    │
                    ▼
            Formatted Meta Info
                    │
                    ▼
    EstatMetaInfoDisplay (表示コンポーネント)
```

## 主要なコンポーネントと関数

### UIコンポーネント

#### EstatMetaInfoFetcher
- 統計表ID入力フォーム
- メタ情報取得ボタン
- エラー表示

#### EstatMetaInfoDisplay
- タブベースの表示
  - TableInfoTab: テーブル基本情報
  - CategoriesTab: 分類情報
  - TimeAxisTab: 時間軸情報
  - AreasTab: 地域情報

#### EstatMetaInfoSidebar
- メタ情報のナビゲーション
- 保存済みメタ情報リスト

### サービス関数

#### fetchMetaInfo()
- e-Stat API からの生データ取得
- HTTP通信の実行
- エラーハンドリング

#### fetchAndTransformMetaInfo()
- データ取得と変換を一括実行
- fetchMetaInfo() + parseCompleteMetaInfo() の組み合わせ

#### parseCompleteMetaInfo()
- 生APIレスポンスの解析
- 構造化データへの変換

#### extractTableInfo(), extractCategories(), extractTimeAxis()
- 個別データの抽出関数

### カスタムフック

#### useMetaInfoDownload
- メタ情報のJSON形式ダウンロード

#### useMetaInfoSave
- メタ情報の保存機能

## 型定義

### 主要な型

- `EstatMetaInfoResponse`: 生 API レスポンス
- `TableInfo`: 統計表基本情報
- `CategoryInfo`: 分類情報
- `PrefectureInfo`: 地域情報
- `TimeAxisInfo`: 時間軸情報
- `DimensionSelectOptions`: UI 用選択肢

## 設定

### 環境変数

```bash
# バッチ処理設定
NEXT_PUBLIC_ESTAT_BATCH_SIZE=10
NEXT_PUBLIC_ESTAT_BATCH_DELAY_MS=1000

# レート制限設定
NEXT_PUBLIC_ESTAT_RATE_LIMIT_PER_MINUTE=60
NEXT_PUBLIC_ESTAT_RATE_LIMIT_PER_HOUR=1000

# タイムアウト設定
NEXT_PUBLIC_ESTAT_REQUEST_TIMEOUT_MS=30000
```

## 使用例

### UIコンポーネントの使用

#### EstatMetaInfoFetcherとEstatMetaInfoDisplayの基本使用

```typescript
import {
  EstatMetaInfoFetcher,
  EstatMetaInfoDisplay,
} from "@/features/estat-api/meta-info";
import { useState } from "react";

function MetaInfoPage() {
  const [metaInfo, setMetaInfo] = useState(null);

  const handleMetaInfoFetched = (data) => {
    setMetaInfo(data);
  };

  return (
    <div>
      <EstatMetaInfoFetcher onDataFetched={handleMetaInfoFetched} />
      {metaInfo && <EstatMetaInfoDisplay data={metaInfo} />}
    </div>
  );
}
```

### サービス関数の直接使用

#### 基本的なメタ情報取得

```typescript
import { fetchAndTransformMetaInfo } from "@/features/estat-api/meta-info";

async function getMetaInfo() {
  try {
    const metaInfo = await fetchAndTransformMetaInfo("0003411595");
    console.log("テーブル情報:", metaInfo.tableInfo);
    console.log("分類数:", metaInfo.categories.length);
  } catch (error) {
    console.error("メタ情報取得エラー:", error);
  }
}
```

#### 生データ取得と変換

```typescript
import {
  fetchMetaInfo,
  parseCompleteMetaInfo,
} from "@/features/estat-api/meta-info";

async function fetchAndParseMetaInfo() {
  // 1. 生データを取得
  const rawData = await fetchMetaInfo("0003411595");

  // 2. データを解析
  const parsedData = parseCompleteMetaInfo(rawData);

  return parsedData;
}
```

### カスタムフックの使用

#### useMetaInfoDownloadによるダウンロード

```typescript
import { useMetaInfoDownload } from "@/features/estat-api/meta-info";

function MetaInfoDownloadButton({ metaInfo }) {
  const { downloadMetaInfo, isDownloading } = useMetaInfoDownload();

  const handleDownload = () => {
    downloadMetaInfo(metaInfo, "meta-info.json");
  };

  return (
    <button onClick={handleDownload} disabled={isDownloading}>
      ダウンロード
    </button>
  );
}
```

## エラーハンドリング

### カスタムエラークラス

- `EstatMetaInfoFetchError`: API 取得エラー
- `EstatDataTransformError`: データ変換エラー
- `EstatBatchProcessError`: バッチ処理エラー

### エラー処理例

```typescript
import { fetchAndTransformMetaInfo } from "@/features/estat-api/meta-info";

try {
  const metaInfo = await fetchAndTransformMetaInfo("0003411595");
  // 処理続行
} catch (error) {
  if (error instanceof Error) {
    console.error("メタ情報取得エラー:", error.message);
  }
  // エラー処理
}
```

## テスト

### テストファイル

- `formatter.test.ts`: データ変換関数のテスト

### テスト実行

```bash
npm test -- src/features/estat-api/meta-info/__tests__
```

## 関連ドキュメント

- [API 仕様](02_API仕様.md) - get-meta-info API の詳細
- [サービス実装](03_サービス実装.md) - サービス関数の実装詳細
- [ユニットテスト](04_ユニットテスト.md) - テスト戦略と実装

## パフォーマンス考慮事項

### 1. レート制限

- e-Stat API の制限を考慮したリクエスト
- 適切な待機時間の設定

### 2. メモリ使用量

- 大量データの効率的な処理
- 不要なデータの早期解放

### 3. エラー回復

- 適切なエラーハンドリング
- ユーザーへのフィードバック

## 今後の拡張予定

1. **キャッシュ機能**: 取得済みメタ情報のキャッシュ
2. **差分更新**: 変更されたメタ情報のみの更新
3. **バッチ処理**: 複数統計表の一括取得
4. **メトリクス**: 処理時間や成功率の監視

# e-Stat API `GET_META_INFO` 完全ガイド

## 1. GET_META_INFO とは

### 概要

`GET_META_INFO`は、統計表の**メタ情報（分類情報、地域情報、時間軸情報など）**を取得する API です。実際のデータを取得する前に、どのような分類項目や地域が含まれているかを確認するために使用します。

### 主な用途

1. **分類項目の確認** - 統計表にどんな分類があるか（男女別、年齢別など）
2. **地域コードの取得** - 都道府県や市区町村のコードと名称の対応
3. **時間軸の確認** - 利用可能な年次や月次の情報
4. **データ構造の理解** - GET_STATS_DATA で取得する前の事前調査

### 他の API との関係

```
1. GET_STATS_LIST    → 統計表IDを検索
2. GET_META_INFO     → 統計表の構造を確認（★このAPI）
3. GET_STATS_DATA    → 実データを取得
```

## 2. API の基本仕様

### エンドポイント

```
# XML形式
https://api.e-stat.go.jp/rest/3.0/app/getMetaInfo?<パラメータ>

# JSON形式（推奨）
https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?<パラメータ>

# CSV形式
https://api.e-stat.go.jp/rest/3.0/app/getSimpleMetaInfo?<パラメータ>
```

### HTTP メソッド

- **GET** のみ対応

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

**重要**: `statsDataId`と`dataSetId`は**どちらか一方のみ**を指定。

### 3.2 オプションパラメータ

| パラメータ名        | 説明         | デフォルト | 値                         |
| ------------------- | ------------ | ---------- | -------------------------- |
| `explanationGetFlg` | 解説情報取得 | `Y`        | `Y`: 取得、`N`: 取得しない |

## 4. レスポンスデータ構造

### 4.1 基本構造

```json
{
  "GET_META_INFO": {
    "RESULT": {
      "STATUS": 0,
      "ERROR_MSG": "正常に終了しました。",
      "DATE": "2024-01-15T10:30:00.000+09:00"
    },
    "PARAMETER": {
      "LANG": "J",
      "STATS_DATA_ID": "0003412313",
      "DATA_FORMAT": "J"
    },
    "METADATA_INF": {
      "TABLE_INF": {
        // 統計表情報
      },
      "CLASS_INF": {
        // 分類情報（重要！）
      }
    }
  }
}
```

### 4.2 TABLE_INF（統計表情報）

統計表の基本情報を含みます。

| フィールド             | 説明               | 例                                       |
| ---------------------- | ------------------ | ---------------------------------------- |
| `@id`                  | 統計表 ID          | `"0003412313"`                           |
| `STAT_NAME`            | 統計調査名         | `{"@code": "00200522", "$": "国勢調査"}` |
| `GOV_ORG`              | 作成機関           | `{"@code": "00200", "$": "総務省"}`      |
| `STATISTICS_NAME`      | 統計名称           | `"令和2年国勢調査 人口等基本集計"`       |
| `TITLE`                | 統計表タイトル     | `"都道府県，男女別人口"`                 |
| `CYCLE`                | 周期               | `"5年"`、`"年次"`、`"-"`                 |
| `SURVEY_DATE`          | 調査年月           | `"202010"`                               |
| `OPEN_DATE`            | 公開日             | `"2021-11-30"`                           |
| `SMALL_AREA`           | 小地域データ有無   | `"0"`: なし、`"1"`: あり                 |
| `COLLECT_AREA`         | 集計地域区分       | `"全国"`、`"都道府県"`、`"市区町村"`     |
| `MAIN_CATEGORY`        | 主分類             | `{"@code": "02", "$": "人口・世帯"}`     |
| `SUB_CATEGORY`         | 副分類             | `{"@code": "01", "$": "人口"}`           |
| `OVERALL_TOTAL_NUMBER` | 総データ件数       | `"2350"`                                 |
| `UPDATED_DATE`         | 更新日時           | `"2023-12-01"`                           |
| `STATISTICS_NAME_SPEC` | 統計名称詳細       | 統計の階層情報                           |
| `TITLE_SPEC`           | 統計表タイトル詳細 | タイトルの階層情報                       |
| `EXPLANATION`          | 解説               | 統計の概要説明                           |

### 4.3 CLASS_INF（分類情報）- 最重要！

統計データの各次元（軸）の詳細情報を提供します。

```json
"CLASS_INF": {
  "CLASS_OBJ": [
    {
      "@id": "tab",
      "@name": "表章項目",
      "CLASS": [
        {
          "@code": "01",
          "@name": "人口",
          "@unit": "人",
          "@level": "1"
        }
      ]
    },
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
          "@unit": "人",
          "@level": "1"
        },
        {
          "@code": "003",
          "@name": "女",
          "@unit": "人",
          "@level": "1"
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
          "@level": "1",
          "@unit": "人"
        },
        {
          "@code": "01000",
          "@name": "北海道",
          "@level": "2",
          "@parentCode": "00000",
          "@unit": "人"
        },
        {
          "@code": "13000",
          "@name": "東京都",
          "@level": "2",
          "@parentCode": "00000",
          "@unit": "人"
        }
        // ... 47都道府県
      ]
    },
    {
      "@id": "time",
      "@name": "時間軸（年次）",
      "CLASS": [
        {
          "@code": "2020000000",
          "@name": "2020年",
          "@level": "1"
        },
        {
          "@code": "2015000000",
          "@name": "2015年",
          "@level": "1"
        }
      ]
    }
  ]
}
```

#### CLASS_OBJ の種類

| @id              | 名称     | 説明                             |
| ---------------- | -------- | -------------------------------- |
| `tab`            | 表章項目 | 統計表の主題（人口、世帯数など） |
| `cat01`〜`cat15` | 分類事項 | 男女別、年齢別など（最大 15 個） |
| `area`           | 地域     | 全国、都道府県、市区町村         |
| `time`           | 時間軸   | 年次、月次、日次など             |

#### CLASS の属性

| 属性          | 説明         | 例                              |
| ------------- | ------------ | ------------------------------- |
| `@code`       | 項目コード   | `"001"`, `"13000"`              |
| `@name`       | 項目名称     | `"総数"`, `"東京都"`            |
| `@unit`       | 単位         | `"人"`, `"%"`                   |
| `@level`      | 階層レベル   | `"1"`: 最上位、`"2"`: 第 2 階層 |
| `@parentCode` | 親項目コード | `"00000"` (全国)                |

## 5. TypeScript 型定義

```typescript
interface GetMetaInfoParams {
  appId: string;
  statsDataId?: string;
  dataSetId?: string;
  lang?: "J" | "E";
  explanationGetFlg?: "Y" | "N";
}

interface ClassItem {
  "@code": string;
  "@name": string;
  "@unit"?: string;
  "@level"?: string;
  "@parentCode"?: string;
}

interface ClassObj {
  "@id": string;
  "@name": string;
  CLASS: ClassItem[];
}

interface TableInfo {
  "@id": string;
  STAT_NAME: {
    "@code": string;
    $: string;
  };
  GOV_ORG: {
    "@code": string;
    $: string;
  };
  STATISTICS_NAME: string;
  TITLE: string;
  CYCLE: string;
  SURVEY_DATE: string;
  OPEN_DATE: string;
  SMALL_AREA: string;
  COLLECT_AREA: string;
  MAIN_CATEGORY: {
    "@code": string;
    $: string;
  };
  SUB_CATEGORY?: {
    "@code": string;
    $: string;
  };
  OVERALL_TOTAL_NUMBER: string;
  UPDATED_DATE: string;
  STATISTICS_NAME_SPEC?: any;
  TITLE_SPEC?: any;
  EXPLANATION?: string;
}

interface GetMetaInfoResponse {
  GET_META_INFO: {
    RESULT: {
      STATUS: number;
      ERROR_MSG: string;
      DATE: string;
    };
    PARAMETER: {
      LANG: string;
      STATS_DATA_ID?: string;
      DATASET_ID?: string;
      EXPLANATION_GET_FLG?: string;
      DATA_FORMAT: string;
    };
    METADATA_INF: {
      TABLE_INF: TableInfo;
      CLASS_INF: {
        CLASS_OBJ: ClassObj[];
      };
    };
  };
}
```

## 6. 実装例

### 6.1 基本的なメタ情報取得

```typescript
async function getMetaInfo(
  params: GetMetaInfoParams
): Promise<GetMetaInfoResponse> {
  const baseUrl = "https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo";

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

    const data: GetMetaInfoResponse = await response.json();

    if (data.GET_META_INFO.RESULT.STATUS !== 0) {
      throw new Error(data.GET_META_INFO.RESULT.ERROR_MSG);
    }

    return data;
  } catch (error) {
    console.error("メタ情報取得エラー:", error);
    throw error;
  }
}

// 使用例
const metaInfo = await getMetaInfo({
  appId: "YOUR_APP_ID",
  statsDataId: "0003412313",
});

console.log(metaInfo.GET_META_INFO.METADATA_INF.TABLE_INF);
```

### 6.2 都道府県コード・名称マップの作成

```typescript
interface PrefectureMap {
  code: string;
  name: string;
  level: number;
  parentCode?: string;
}

async function getPrefectureMap(
  statsDataId: string
): Promise<Map<string, string>> {
  const metaInfo = await getMetaInfo({
    appId: "YOUR_APP_ID",
    statsDataId,
    explanationGetFlg: "N",
  });

  const classObjs = metaInfo.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ;

  // 地域情報を取得
  const areaClass = classObjs.find((obj) => obj["@id"] === "area");

  if (!areaClass) {
    throw new Error("地域情報が見つかりません");
  }

  // 都道府県のみをフィルタリング（5桁で末尾000、全国除外）
  const prefectures = areaClass.CLASS.filter((item) => {
    const code = item["@code"];
    return code.length === 5 && code.endsWith("000") && code !== "00000"; // 全国を除外
  });

  // Mapに変換
  return new Map(prefectures.map((item) => [item["@code"], item["@name"]]));
}

// 使用例
const prefMap = await getPrefectureMap("0003412313");
console.log(prefMap.get("13000")); // "東京都"
console.log(prefMap.get("27000")); // "大阪府"
```

### 6.3 分類項目の取得

```typescript
interface CategoryInfo {
  id: string;
  name: string;
  items: Array<{
    code: string;
    name: string;
    unit: string;
  }>;
}

async function getCategoryInfo(
  statsDataId: string,
  categoryId: string = "cat01"
): Promise<CategoryInfo | null> {
  const metaInfo = await getMetaInfo({
    appId: "YOUR_APP_ID",
    statsDataId,
  });

  const classObjs = metaInfo.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ;
  const category = classObjs.find((obj) => obj["@id"] === categoryId);

  if (!category) {
    return null;
  }

  return {
    id: category["@id"],
    name: category["@name"],
    items: category.CLASS.map((item) => ({
      code: item["@code"],
      name: item["@name"],
      unit: item["@unit"] || "",
    })),
  };
}

// 使用例: 男女別の分類を取得
const genderCategory = await getCategoryInfo("0003412313", "cat01");
console.log(genderCategory);
// {
//   id: 'cat01',
//   name: '男女別',
//   items: [
//     { code: '001', name: '総数', unit: '人' },
//     { code: '002', name: '男', unit: '人' },
//     { code: '003', name: '女', unit: '人' }
//   ]
// }
```

### 6.4 時間軸情報の取得

```typescript
interface TimeAxisInfo {
  availableYears: string[];
  minYear: string;
  maxYear: string;
}

async function getTimeAxisInfo(statsDataId: string): Promise<TimeAxisInfo> {
  const metaInfo = await getMetaInfo({
    appId: "YOUR_APP_ID",
    statsDataId,
  });

  const classObjs = metaInfo.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ;
  const timeClass = classObjs.find((obj) => obj["@id"] === "time");

  if (!timeClass) {
    throw new Error("時間軸情報が見つかりません");
  }

  const years = timeClass.CLASS.map((item) => item["@code"]).sort();

  return {
    availableYears: years,
    minYear: years[0],
    maxYear: years[years.length - 1],
  };
}

// 使用例
const timeInfo = await getTimeAxisInfo("0003412313");
console.log(timeInfo);
// {
//   availableYears: ['2015000000', '2020000000'],
//   minYear: '2015000000',
//   maxYear: '2020000000'
// }
```

### 6.5 メタ情報の完全解析

```typescript
interface ParsedMetaInfo {
  tableInfo: {
    id: string;
    name: string;
    organization: string;
    surveyDate: string;
    totalRecords: number;
  };
  dimensions: {
    categories: CategoryInfo[];
    areas: PrefectureMap[];
    timeAxis: TimeAxisInfo;
  };
}

async function parseCompleteMetaInfo(
  statsDataId: string
): Promise<ParsedMetaInfo> {
  const metaInfo = await getMetaInfo({
    appId: "YOUR_APP_ID",
    statsDataId,
  });

  const metadata = metaInfo.GET_META_INFO.METADATA_INF;
  const tableInf = metadata.TABLE_INF;
  const classObjs = metadata.CLASS_INF.CLASS_OBJ;

  // 統計表情報
  const tableInfo = {
    id: tableInf["@id"],
    name: tableInf.STATISTICS_NAME,
    organization: tableInf.GOV_ORG.$,
    surveyDate: tableInf.SURVEY_DATE,
    totalRecords: parseInt(tableInf.OVERALL_TOTAL_NUMBER),
  };

  // 分類情報
  const categories: CategoryInfo[] = [];
  for (const obj of classObjs) {
    if (obj["@id"].startsWith("cat")) {
      categories.push({
        id: obj["@id"],
        name: obj["@name"],
        items: obj.CLASS.map((item) => ({
          code: item["@code"],
          name: item["@name"],
          unit: item["@unit"] || "",
        })),
      });
    }
  }

  // 地域情報
  const areaClass = classObjs.find((obj) => obj["@id"] === "area");
  const areas: PrefectureMap[] = areaClass
    ? areaClass.CLASS.map((item) => ({
        code: item["@code"],
        name: item["@name"],
        level: parseInt(item["@level"] || "1"),
        parentCode: item["@parentCode"],
      }))
    : [];

  // 時間軸情報
  const timeClass = classObjs.find((obj) => obj["@id"] === "time");
  const years = timeClass
    ? timeClass.CLASS.map((item) => item["@code"]).sort()
    : [];

  const timeAxis: TimeAxisInfo = {
    availableYears: years,
    minYear: years[0] || "",
    maxYear: years[years.length - 1] || "",
  };

  return {
    tableInfo,
    dimensions: {
      categories,
      areas,
      timeAxis,
    },
  };
}

// 使用例
const parsed = await parseCompleteMetaInfo("0003412313");
console.log(JSON.stringify(parsed, null, 2));
```

## 7. 実践的な活用例

### 7.1 データ取得前の検証

```typescript
async function validateBeforeDataFetch(
  statsDataId: string,
  requestedAreaCode: string,
  requestedCategoryCode: string
): Promise<{ valid: boolean; message: string }> {
  const metaInfo = await getMetaInfo({
    appId: "YOUR_APP_ID",
    statsDataId,
  });

  const classObjs = metaInfo.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ;

  // 地域コードの検証
  const areaClass = classObjs.find((obj) => obj["@id"] === "area");
  const areaExists = areaClass?.CLASS.some(
    (item) => item["@code"] === requestedAreaCode
  );

  if (!areaExists) {
    return {
      valid: false,
      message: `地域コード ${requestedAreaCode} は存在しません`,
    };
  }

  // 分類コードの検証
  const cat01Class = classObjs.find((obj) => obj["@id"] === "cat01");
  const categoryExists = cat01Class?.CLASS.some(
    (item) => item["@code"] === requestedCategoryCode
  );

  if (!categoryExists) {
    return {
      valid: false,
      message: `分類コード ${requestedCategoryCode} は存在しません`,
    };
  }

  return {
    valid: true,
    message: "OK",
  };
}

// 使用例
const validation = await validateBeforeDataFetch(
  "0003412313",
  "13000", // 東京都
  "001" // 総数
);

if (validation.valid) {
  // GET_STATS_DATAでデータ取得
  const data = await getStatsData({
    appId: "YOUR_APP_ID",
    statsDataId: "0003412313",
    cdArea: "13000",
    cdCat01: "001",
  });
}
```

### 7.2 UI コンポーネント用の選択肢生成

```typescript
interface SelectOption {
  value: string;
  label: string;
}

async function generateSelectOptions(statsDataId: string): Promise<{
  prefectures: SelectOption[];
  categories: SelectOption[];
  years: SelectOption[];
}> {
  const metaInfo = await getMetaInfo({
    appId: "YOUR_APP_ID",
    statsDataId,
  });

  const classObjs = metaInfo.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ;

  // 都道府県の選択肢
  const areaClass = classObjs.find((obj) => obj["@id"] === "area");
  const prefectures: SelectOption[] = areaClass
    ? areaClass.CLASS.filter((item) => {
        const code = item["@code"];
        return code.length === 5 && code.endsWith("000") && code !== "00000";
      }).map((item) => ({
        value: item["@code"],
        label: item["@name"],
      }))
    : [];

  // 分類の選択肢
  const cat01Class = classObjs.find((obj) => obj["@id"] === "cat01");
  const categories: SelectOption[] = cat01Class
    ? cat01Class.CLASS.map((item) => ({
        value: item["@code"],
        label: item["@name"],
      }))
    : [];

  // 年次の選択肢
  const timeClass = classObjs.find((obj) => obj["@id"] === "time");
  const years: SelectOption[] = timeClass
    ? timeClass.CLASS.map((item) => ({
        value: item["@code"],
        label: item["@name"],
      })).sort((a, b) => b.value.localeCompare(a.value)) // 降順
    : [];

  return {
    prefectures,
    categories,
    years,
  };
}

// React コンポーネントでの使用例
function DataFilterComponent() {
  const [options, setOptions] = useState<{
    prefectures: SelectOption[];
    categories: SelectOption[];
    years: SelectOption[];
  }>({
    prefectures: [],
    categories: [],
    years: [],
  });

  useEffect(() => {
    generateSelectOptions("0003412313").then(setOptions);
  }, []);

  return (
    <div>
      <select>
        {options.prefectures.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select>
        {options.categories.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select>
        {options.years.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 7.3 データベースへのメタ情報保存

```typescript
// Cloudflare D1への保存例
async function saveMetaInfoToD1(
  db: D1Database,
  statsDataId: string
): Promise<void> {
  const metaInfo = await getMetaInfo({
    appId: "YOUR_APP_ID",
    statsDataId,
  });

  const metadata = metaInfo.GET_META_INFO.METADATA_INF;
  const classObjs = metadata.CLASS_INF.CLASS_OBJ;

  // 統計表情報を保存
  await db
    .prepare(
      `
    INSERT OR REPLACE INTO stats_tables
    (table_id, table_name, organization, survey_date, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `
    )
    .bind(
      metadata.TABLE_INF["@id"],
      metadata.TABLE_INF.STATISTICS_NAME,
      metadata.TABLE_INF.GOV_ORG.$,
      metadata.TABLE_INF.SURVEY_DATE,
      new Date().toISOString()
    )
    .run();

  // 分類情報を保存
  const classStmts = [];
  for (const classObj of classObjs) {
    for (const classItem of classObj.CLASS) {
      classStmts.push(
        db
          .prepare(
            `
          INSERT OR REPLACE INTO meta_classes
          (table_id, class_id, class_name, code, name, unit, level, parent_code)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .bind(
            metadata.TABLE_INF["@id"],
            classObj["@id"],
            classObj["@name"],
            classItem["@code"],
            classItem["@name"],
            classItem["@unit"] || null,
            classItem["@level"] || null,
            classItem["@parentCode"] || null
          )
      );
    }
  }

  await db.batch(classStmts);
}
```

## 8. メタ情報のキャッシング戦略

```typescript
class MetaInfoCache {
  private cache: Map<
    string,
    {
      data: GetMetaInfoResponse;
      timestamp: number;
    }
  > = new Map();

  private readonly TTL = 86400000; // 24時間（メタ情報は変更頻度が低い）

  async getMetaInfo(statsDataId: string): Promise<GetMetaInfoResponse> {
    const cached = this.cache.get(statsDataId);

    // キャッシュが有効な場合
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }

    // メタ情報取得
    const data = await getMetaInfo({
      appId: "YOUR_APP_ID",
      statsDataId,
    });

    // キャッシュに保存
    this.cache.set(statsDataId, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  clearCache(statsDataId?: string): void {
    if (statsDataId) {
      this.cache.delete(statsDataId);
    } else {
      this.cache.clear();
    }
  }
}

// 使用例
const cache = new MetaInfoCache();
const metaInfo = await cache.getMetaInfo("0003412313");
```

### 8.1 R2ストレージによる永続的キャッシュ

メタ情報はCloudflare R2に保存することで、サーバー再起動後も永続化できます。

#### R2キャッシュのメリット

- **永続性**: サーバー再起動後もデータが保持される
- **共有**: 複数のWorkerインスタンス間でキャッシュを共有
- **コスト効率**: 頻繁にアクセスされるメタ情報のAPI呼び出しを削減
- **高速**: R2からの読み取りはe-Stat APIより高速

#### R2保存実装

```typescript
import { EstatMetaInfoR2Repository } from "@/infrastructure/database/estat/repositories";
import { EstatMetaInfoResponse } from "@/infrastructure/estat-api";

/**
 * e-StatメタインフォメーションをR2に保存
 */
async function saveMetaInfoToR2(
  env: { METAINFO_BUCKET: R2Bucket },
  statsDataId: string,
  metaInfo: EstatMetaInfoResponse
): Promise<void> {
  const result = await EstatMetaInfoR2Repository.saveMetaInfo(
    env,
    statsDataId,
    metaInfo
  );

  console.log(`R2保存完了: ${result.key} (${result.size}バイト)`);
}
```

#### R2からの取得実装

```typescript
/**
 * R2からメタ情報を取得（キャッシュヒット時）
 * キャッシュミス時はe-Stat APIから取得
 */
async function getMetaInfoWithR2Cache(
  env: { METAINFO_BUCKET: R2Bucket },
  statsDataId: string
): Promise<EstatMetaInfoResponse> {
  // R2キャッシュを確認
  const cached = await EstatMetaInfoR2Repository.getMetaInfo(env, statsDataId);

  if (cached) {
    console.log(`R2キャッシュヒット: ${statsDataId}`);
    return cached;
  }

  // キャッシュミス: e-Stat APIから取得
  console.log(`R2キャッシュミス: ${statsDataId} - API呼び出し`);
  const metaInfo = await getMetaInfo({
    appId: "YOUR_APP_ID",
    statsDataId,
  });

  // R2に保存（次回のキャッシュヒット用）
  await EstatMetaInfoR2Repository.saveMetaInfo(env, statsDataId, metaInfo);

  return metaInfo;
}
```

#### R2キャッシュ管理

```typescript
/**
 * 保存済みメタ情報一覧の取得
 */
async function listCachedMetaInfo(
  env: { METAINFO_BUCKET: R2Bucket }
): Promise<string[]> {
  return await EstatMetaInfoR2Repository.listAllCaches(env);
}

/**
 * 特定のメタ情報キャッシュを削除
 */
async function deleteCachedMetaInfo(
  env: { METAINFO_BUCKET: R2Bucket },
  statsDataId: string
): Promise<void> {
  await EstatMetaInfoR2Repository.deleteCache(env, statsDataId);
  console.log(`キャッシュ削除完了: ${statsDataId}`);
}
```

#### R2保存データ構造

```json
{
  "version": "1.0",
  "stats_data_id": "0003412313",
  "saved_at": "2025-10-18T12:00:00Z",
  "meta_info_response": {
    "GET_META_INFO": {
      // ... 完全なe-Stat APIレスポンス
    }
  },
  "summary": {
    "table_title": "都道府県，男女別人口",
    "stat_name": "国勢調査",
    "organization": "総務省",
    "survey_date": "202010",
    "updated_date": "2023-12-01"
  }
}
```

#### R2キー設計

```
estat_metainfo/{statsDataId}/meta.json

例:
estat_metainfo/0003412313/meta.json
estat_metainfo/0003448738/meta.json
```

#### キャッシュ戦略の選択

| 方法              | 用途                         | TTL   | 永続性 |
| ----------------- | ---------------------------- | ----- | ------ |
| メモリキャッシュ  | 同一リクエスト内の再利用     | 短期  | なし   |
| R2キャッシュ      | 複数リクエスト・Worker間共有 | 長期  | あり   |
| D1データベース    | 検索・フィルタが必要な場合   | 永続  | あり   |

**推奨**: R2キャッシュとメモリキャッシュの組み合わせ

```typescript
class HybridMetaInfoCache {
  private memoryCache = new MetaInfoCache();

  async getMetaInfo(
    env: { METAINFO_BUCKET: R2Bucket },
    statsDataId: string
  ): Promise<EstatMetaInfoResponse> {
    // 1. メモリキャッシュを確認
    const memCached = this.memoryCache.cache.get(statsDataId);
    if (memCached && Date.now() - memCached.timestamp < 3600000) {
      // 1時間
      return memCached.data;
    }

    // 2. R2キャッシュを確認
    const r2Cached = await EstatMetaInfoR2Repository.getMetaInfo(env, statsDataId);
    if (r2Cached) {
      // メモリキャッシュにも保存
      this.memoryCache.cache.set(statsDataId, {
        data: r2Cached as GetMetaInfoResponse,
        timestamp: Date.now(),
      });
      return r2Cached;
    }

    // 3. e-Stat APIから取得
    const metaInfo = await getMetaInfo({
      appId: "YOUR_APP_ID",
      statsDataId,
    });

    // 両方のキャッシュに保存
    this.memoryCache.cache.set(statsDataId, {
      data: metaInfo,
      timestamp: Date.now(),
    });
    await EstatMetaInfoR2Repository.saveMetaInfo(env, statsDataId, metaInfo);

    return metaInfo;
  }
}
```

詳細な実装ガイドについては、[EstatMetainfoPage R2保存機能実装ガイド](../implementation/estat-metainfo-r2-save-implementation.md)を参照してください。

## 9. ベストプラクティス

### ✅ 推奨事項

1. **最初に必ず GET_META_INFO を呼ぶ** - データ構造を理解してから GET_STATS_DATA を実行
2. **メタ情報をキャッシュ** - 変更頻度が低いため長期キャッシュが有効
3. **地域コードマップを作成** - データ取得時の名称変換に利用
4. **分類構造を保存** - UI の選択肢生成に活用
5. **データベースに保存** - 頻繁な参照に備える

### ❌ 避けるべき事項

1. **毎回 GET_META_INFO を呼ぶ** - キャッシュを活用
2. **解説情報を常に取得** - 不要な場合

# メタ情報サービス実装

## 概要

e-Stat API から取得したメタ情報（統計表の基本情報、分類情報、地域情報、時間軸情報など）を取得・変換するサービス層の実装です。

現在のアーキテクチャは 3 つの主要コンポーネント（Fetcher/Formatter/Batch Processor）で構成されています。

## アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Fetcher       │───▶│   Formatter     │───▶│ Batch Processor │
│   (データ取得)   │    │   (データ変換)   │    │   (バッチ処理)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### ディレクトリ構造

```
src/features/estat-api/meta-info/
├── index.ts                    # エントリーポイント
├── services/
│   ├── fetcher.ts              # API取得処理
│   ├── formatter.ts            # データ変換処理
│   ├── batch-processor.ts      # バッチ処理
│   └── id-utils.ts             # ID操作ユーティリティ
├── components/                  # UIコンポーネント
├── hooks/                      # React Hooks
└── utils/                      # ユーティリティ関数
```

## 1. データ取得（Fetcher）

### 責務

- e-Stat API からメタ情報を取得
- API レスポンスの検証
- エラーハンドリング

### 実装ファイル

`src/features/estat-api/meta-info/services/fetcher.ts`

### 主要関数

#### `fetchMetaInfo(statsDataId)`

e-Stat API からメタ情報を取得します。

```typescript
import { fetchMetaInfo } from "@/features/estat-api/meta-info";

const metaInfo = await fetchMetaInfo("0000010101");
```

**パラメータ**:

- `statsDataId` (string): 統計表 ID（10 桁の数字）

**戻り値**:

- `EstatMetaInfoResponse`: e-Stat API の生レスポンス

**エラー**:

- `EstatMetaInfoFetchError`: API 取得エラー

**実装詳細**:

- `executeHttpRequest`を使用して HTTP 通信を実行
- `validateMetaInfoResponse`でレスポンスの STATUS を検証
- STATUS >= 100 の場合、エラーを throw

#### `fetchAndTransformMetaInfo(statsDataId)`

メタ情報を取得して変換（便利メソッド）

```typescript
import { fetchAndTransformMetaInfo } from "@/features/estat-api/meta-info";

const transformedData = await fetchAndTransformMetaInfo("0000010101");
// TransformedMetadataEntry[] を返す
```

**戻り値**:

- `TransformedMetadataEntry[]`: 変換されたメタデータエントリの配列

## 2. データ変換（Formatter）

### 責務

- 生のメタ情報を構造化された形式に変換
- データの正規化
- アプリケーション用の形式への変換

### 実装ファイル

`src/features/estat-api/meta-info/services/formatter.ts`

### 主要関数

#### `extractTableInfo(metaInfo)`

統計表の基本情報を抽出します。

```typescript
import { extractTableInfo } from "@/features/estat-api/meta-info";
import { fetchMetaInfo } from "@/features/estat-api/meta-info";

const metaInfo = await fetchMetaInfo("0000010101");
const tableInfo = extractTableInfo(metaInfo);

console.log(tableInfo.title); // "都道府県，男女別人口"
console.log(tableInfo.statName); // "国勢調査"
console.log(tableInfo.organization); // "総務省"
console.log(tableInfo.surveyDate); // "202010"
console.log(tableInfo.totalRecords); // 2350
```

**戻り値**: `TableInfo`

- `id`: 統計表 ID
- `statName`: 統計調査名
- `organization`: 作成機関
- `title`: 統計表タイトル
- `cycle`: 周期（"5 年"、"年次"など）
- `surveyDate`: 調査年月
- `totalRecords`: 総データ件数

#### `extractCategories(metaInfo)`

全分類項目を抽出します。

```typescript
import { extractCategories } from "@/features/estat-api/meta-info";

const categories = extractCategories(metaInfo);

// 男女別の分類を取得
const genderCategory = categories.find((c) => c.id === "cat01");
console.log(genderCategory);
// {
//   id: 'cat01',
//   name: '男女別',
//   items: [
//     { code: '001', name: '総数', unit: '人' },
//     { code: '002', name: '男', unit: '人' },
//     { code: '003', name: '女', unit: '人' }
//   ]
// }
```

**戻り値**: `CategoryInfo[]`

- `id`: 分類 ID（"cat01"〜"cat15"）
- `name`: 分類名
- `items`: 分類項目の配列

#### `extractTimeAxis(metaInfo)`

時間軸情報を抽出します。

```typescript
import { extractTimeAxis } from "@/features/estat-api/meta-info";

const timeAxis = extractTimeAxis(metaInfo);
console.log(timeAxis.availableYears); // ["2020000000", "2015000000"]
console.log(timeAxis.formattedYears); // ["2020年", "2015年"]
console.log(timeAxis.minYear); // "2015000000"
console.log(timeAxis.maxYear); // "2020000000"
```

**戻り値**: `TimeAxisInfo`

- `availableYears`: 利用可能な年次のコード配列
- `formattedYears`: フォーマットされた年次名の配列
- `minYear`: 最小年次
- `maxYear`: 最大年次

#### `parseCompleteMetaInfo(metaInfo)`

メタ情報を完全解析します。

```typescript
import { parseCompleteMetaInfo } from "@/features/estat-api/meta-info";

const parsed = parseCompleteMetaInfo(metaInfo);

console.log(parsed.tableInfo.title);
console.log(parsed.dimensions.categories.length);
console.log(parsed.dimensions.areas.length);
console.log(parsed.dimensions.timeAxis.availableYears);
```

**戻り値**: `ParsedMetaInfo`

- `tableInfo`: 統計表基本情報
- `dimensions.categories`: 分類情報
- `dimensions.areas`: 地域情報
- `dimensions.timeAxis`: 時間軸情報

## 実装例

### 1. 基本的なメタ情報取得

```typescript
import {
  fetchMetaInfo,
  extractTableInfo,
  extractCategories,
} from "@/features/estat-api/meta-info";

async function getBasicMetaInfo(statsDataId: string) {
  // メタ情報を取得
  const metaInfo = await fetchMetaInfo(statsDataId);

  // 統計表基本情報
  const tableInfo = extractTableInfo(metaInfo);
  console.log(`統計表: ${tableInfo.title}`);
  console.log(`統計調査: ${tableInfo.statName}`);

  // 分類情報
  const categories = extractCategories(metaInfo);
  console.log(`分類項目数: ${categories.length}`);

  return { tableInfo, categories };
}

const result = await getBasicMetaInfo("0000010101");
```

### 2. 都道府県マップの作成

```typescript
import { fetchMetaInfo } from "@/features/estat-api/meta-info";
import { extractTimeAxis } from "@/features/estat-api/meta-info";
import { extractCategories } from "@/features/estat-api/meta-info";

async function createPrefectureMap(statsDataId: string) {
  const metaInfo = await fetchMetaInfo(statsDataId);
  const categories = extractCategories(metaInfo);

  // 地域情報を取得（@id="area"）
  const areaCategory = categories.find((c) => c.id === "area");
  if (!areaCategory) {
    return new Map();
  }

  // 都道府県のみをフィルタリング（5桁で末尾000、全国除外）
  const prefectures = areaCategory.items.filter((item) => {
    return (
      item.code.length === 5 &&
      item.code.endsWith("000") &&
      item.code !== "00000"
    );
  });

  // Mapに変換
  return new Map(prefectures.map((item) => [item.code, item.name]));
}

const prefMap = await createPrefectureMap("0000010101");
console.log(prefMap.get("13000")); // "東京都"
console.log(prefMap.get("27000")); // "大阪府"
```

### 3. UI 選択肢の生成

```typescript
import { fetchMetaInfo } from "@/features/estat-api/meta-info";
import {
  extractCategories,
  extractTimeAxis,
} from "@/features/estat-api/meta-info";

interface SelectOption {
  value: string;
  label: string;
}

async function generateSelectOptions(statsDataId: string) {
  const metaInfo = await fetchMetaInfo(statsDataId);
  const categories = extractCategories(metaInfo);
  const timeAxis = extractTimeAxis(metaInfo);

  // 都道府県の選択肢
  const areaCategory = categories.find((c) => c.id === "area");
  const prefectures: SelectOption[] = areaCategory
    ? areaCategory.items
        .filter(
          (item) =>
            item.code.length === 5 &&
            item.code.endsWith("000") &&
            item.code !== "00000"
        )
        .map((item) => ({
          value: item.code,
          label: item.name,
        }))
    : [];

  // 分類の選択肢（例: cat01）
  const cat01Category = categories.find((c) => c.id === "cat01");
  const categoryOptions: SelectOption[] = cat01Category
    ? cat01Category.items.map((item) => ({
        value: item.code,
        label: item.name,
      }))
    : [];

  // 年次の選択肢
  const yearOptions: SelectOption[] = timeAxis.availableYears.map(
    (year, index) => ({
      value: year,
      label: timeAxis.formattedYears[index],
    })
  );

  return {
    prefectures,
    categoryOptions,
    yearOptions,
  };
}

const options = await generateSelectOptions("0000010101");
```

### 4. データ取得前の検証

```typescript
import { fetchMetaInfo } from "@/features/estat-api/meta-info";
import { extractCategories } from "@/features/estat-api/meta-info";

async function validateBeforeDataFetch(
  statsDataId: string,
  requestedAreaCode: string,
  requestedCategoryCode: string
) {
  const metaInfo = await fetchMetaInfo(statsDataId);
  const categories = extractCategories(metaInfo);

  // 地域コードの検証
  const areaCategory = categories.find((c) => c.id === "area");
  const areaExists = areaCategory?.items.some(
    (item) => item.code === requestedAreaCode
  );

  if (!areaExists) {
    return {
      valid: false,
      message: `地域コード ${requestedAreaCode} は存在しません`,
    };
  }

  // 分類コードの検証
  const cat01Category = categories.find((c) => c.id === "cat01");
  const categoryExists = cat01Category?.items.some(
    (item) => item.code === requestedCategoryCode
  );

  if (!categoryExists) {
    return {
      valid: false,
      message: `分類コード ${requestedCategoryCode} は存在しません`,
    };
  }

  return { valid: true, message: "OK" };
}

const validation = await validateBeforeDataFetch(
  "0000010101",
  "13000", // 東京都
  "001" // 総数
);

if (validation.valid) {
  // GET_STATS_DATAでデータ取得
  console.log("検証成功。データ取得を実行できます。");
}
```

## パフォーマンス最適化

### 1. バッチサイズの調整

大量処理時はバッチサイズを増やします。

```typescript
import { EstatMetaInfoBatchProcessor } from "@/features/estat-api/meta-info";

const result = await EstatMetaInfoBatchProcessor.processBulk(statsIds, {
  batchSize: 20, // バッチサイズを増やす
});
```

API 制限が厳しい場合は減らします。

```typescript
const result = await EstatMetaInfoBatchProcessor.processBulk(statsIds, {
  batchSize: 5,
  delayMs: 2000, // 2秒待機
});
```

### 2. キャッシング戦略

メタ情報は変更頻度が低いため、長期キャッシュが有効です。

```typescript
import { fetchMetaInfo } from "@/features/estat-api/meta-info";

// シンプルなメモリキャッシュ例
const cache = new Map<string, { data: any; timestamp: number }>();
const TTL = 86400000; // 24時間

async function getCachedMetaInfo(statsDataId: string) {
  const cached = cache.get(statsDataId);

  if (cached && Date.now() - cached.timestamp < TTL) {
    return cached.data;
  }

  const data = await fetchMetaInfo(statsDataId);
  cache.set(statsDataId, {
    data,
    timestamp: Date.now(),
  });

  return data;
}
```

### 3. 並列処理の制限

API レート制限を考慮して並列数を制限します。

```typescript
import { EstatMetaInfoBatchProcessor } from "@/features/estat-api/meta-info";

// 大量データの場合は、バッチサイズと待機時間を調整
const result = await EstatMetaInfoBatchProcessor.processBulk(statsIds, {
  batchSize: 10, // 適切なバッチサイズ
  delayMs: 1500, // API制限に応じた待機時間
  onProgress: (processed, total) => {
    const percentage = Math.round((processed / total) * 100);
    console.log(`進捗: ${percentage}%`);
  },
});
```

## エラーハンドリング

### カスタムエラークラス

```typescript
import { EstatMetaInfoFetchError } from "@/features/estat-api/core/errors";

try {
  const metaInfo = await fetchMetaInfo(statsDataId);
} catch (error) {
  if (error instanceof EstatMetaInfoFetchError) {
    console.error("メタ情報取得エラー:", error.message);
    console.error("統計表ID:", error.statsDataId);
  }
}
```

### エラー処理パターン

```typescript
import {
  fetchMetaInfo,
  extractTableInfo,
} from "@/features/estat-api/meta-info";

async function safeGetMetaInfo(statsDataId: string) {
  try {
    const metaInfo = await fetchMetaInfo(statsDataId);
    const tableInfo = extractTableInfo(metaInfo);
    return { success: true, data: tableInfo };
  } catch (error) {
    console.error("メタ情報取得失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

## テスト

### テストファイル

```
src/features/estat-api/meta-info/__tests__/
├── fetcher.test.ts              # フェッチャーのテスト
├── formatter.test.ts            # フォーマッターのテスト
└── batch-processor.test.ts      # バッチプロセッサーのテスト
```

### テスト実行

```bash
npm test -- src/features/estat-api/meta-info/__tests__
```

## 関連ドキュメント

- [API 仕様](API仕様.md) - GET_META_INFO 完全ガイド
- [概要](概要.md) - meta-info サブドメイン概要
- [ユニットテスト](ユニットテスト.md) - テスト戦略と実装
