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
