# e-Stat API `GET_STATS_LIST` 完全ガイド

## 1. GET_STATS_LIST とは

### 概要

`GET_STATS_LIST`は、e-Stat に登録されている統計表の一覧情報を取得する API です。この API を使用することで、どのような統計データが利用可能かを検索し、統計表 ID や統計名などのメタ情報を取得できます。

### 主な用途

1. **統計表の検索・探索** - キーワードや条件で統計表を検索
2. **統計表 ID の取得** - データ取得に必要な統計表 ID を特定
3. **統計一覧の取得** - 特定の省庁や分野の統計を一覧化
4. **メタデータの収集** - 統計の更新日や調査期間などの情報取得

## 2. API の基本仕様

### エンドポイント

```
# XML形式
https://api.e-stat.go.jp/rest/3.0/app/getStatsList?<パラメータ>

# JSON形式（推奨）
https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?<パラメータ>
```

### HTTP メソッド

- **GET**のみ対応

### 必須パラメータ

- `appId`: アプリケーション ID（ユーザー登録時に発行）

## 3. パラメータ一覧

### 3.1 基本パラメータ

| パラメータ名 | 必須 | 説明                                           | 例            |
| ------------ | ---- | ---------------------------------------------- | ------------- |
| `appId`      | ○    | アプリケーション ID                            | `YOUR_APP_ID` |
| `lang`       | -    | 言語設定<br>J: 日本語（デフォルト）<br>E: 英語 | `J`           |

### 3.2 検索条件パラメータ

| パラメータ名  | 説明           | 値の例                                          | 備考                         |
| ------------- | -------------- | ----------------------------------------------- | ---------------------------- |
| `surveyYears` | 調査年月       | `201001`<br>`201001-201212`                     | YYYYMM 形式<br>範囲指定可能  |
| `openYears`   | 公開年月       | `201001`<br>`201001-201212`                     | YYYYMM 形式<br>範囲指定可能  |
| `statsField`  | 統計分野       | `02`（人口・世帯）<br>`03`（労働・賃金）        | 2 桁コード                   |
| `statsCode`   | 政府統計コード | `00200522`（国勢調査）<br>`00450`（経済産業省） | 8 桁または 5 桁              |
| `searchWord`  | 検索キーワード | `人口`<br>`就業構造`                            | 複数指定可（スペース区切り） |
| `searchKind`  | 検索種別       | `1`（AND 検索）<br>`2`（OR 検索）               | デフォルト: `1`              |

### 3.3 フィルタリングパラメータ

| パラメータ名        | 説明             | 値                                                   |
| ------------------- | ---------------- | ---------------------------------------------------- |
| `collectArea`       | 集計地域区分     | `1`: 全国<br>`2`: 都道府県<br>`3`: 市区町村          |
| `explanationGetFlg` | 解説情報取得有無 | `Y`: 取得する<br>`N`: 取得しない（デフォルト）       |
| `statsNameList`     | 統計名リスト表示 | `Y`: 統計名のみ表示<br>`N`: 全情報表示（デフォルト） |

### 3.4 ページング・取得件数制御

| パラメータ名    | 説明         | デフォルト | 制限            |
| --------------- | ------------ | ---------- | --------------- |
| `startPosition` | 取得開始位置 | `1`        | 1 以上          |
| `limit`         | 取得件数     | `100`      | 最大 10,000 件  |
| `updatedDate`   | 更新日付     | -          | YYYY-MM-DD 形式 |

## 4. レスポンスデータ構造

### 4.1 基本構造

```json
{
  "GET_STATS_LIST": {
    "RESULT": {
      "STATUS": 0,
      "ERROR_MSG": "正常に終了しました。",
      "DATE": "2024-01-15T10:30:00.000+09:00"
    },
    "PARAMETER": {
      // リクエストパラメータのエコーバック
    },
    "DATALIST_INF": {
      // 統計表一覧情報
    }
  }
}
```

### 4.2 RESULT（処理結果情報）

| フィールド  | 説明             | 値                             |
| ----------- | ---------------- | ------------------------------ |
| `STATUS`    | ステータスコード | `0`: 正常終了<br>`100`: エラー |
| `ERROR_MSG` | エラーメッセージ | エラー内容の説明               |
| `DATE`      | 処理日時         | ISO 8601 形式                  |

### 4.3 DATALIST_INF（統計表一覧）

#### メタ情報

```json
"DATALIST_INF": {
  "NUMBER": 543,           // 該当件数
  "RESULT_INF": {
    "FROM_NUMBER": 1,      // 取得開始番号
    "TO_NUMBER": 100,      // 取得終了番号
    "NEXT_KEY": 101        // 次ページの開始位置（ページング用）
  },
  "TABLE_INF": [
    // 統計表情報の配列
  ]
}
```

#### TABLE_INF（統計表情報）

| フィールド             | 説明           | 例                                               |
| ---------------------- | -------------- | ------------------------------------------------ |
| `@id`                  | 統計表 ID      | `"0003084821"`                                   |
| `STAT_NAME`            | 統計調査名     | `{"@code": "00200532", "$": "就業構造基本調査"}` |
| `GOV_ORG`              | 作成機関       | `{"@code": "00200", "$": "総務省"}`              |
| `STATISTICS_NAME`      | 統計名称       | `"平成24年就業構造基本調査 全国編"`              |
| `TITLE`                | 統計表タイトル | `{"@no": "00100", "$": "男女，就業状態..."}`     |
| `CYCLE`                | 周期・頻度     | `"年次"`、`"月次"`、`"-"`（不定期）              |
| `SURVEY_DATE`          | 調査年月       | `"201210"`                                       |
| `OPEN_DATE`            | 公開日         | `"2013-07-12"`                                   |
| `SMALL_AREA`           | 小地域有無     | `"0"`: なし、`"1"`: あり                         |
| `COLLECT_AREA`         | 集計地域区分   | `"1"`: 全国、`"2"`: 都道府県、`"3"`: 市区町村    |
| `MAIN_CATEGORY`        | 主分類         | `{"@code": "02", "$": "人口・世帯"}`             |
| `SUB_CATEGORY`         | 副分類         | `{"@code": "01", "$": "人口"}`                   |
| `OVERALL_TOTAL_NUMBER` | 総データ件数   | `"12345"`                                        |
| `UPDATED_DATE`         | 更新日時       | `"2023-12-01"`                                   |
| `STATISTICS_NAME_SPEC` | 統計名称詳細   | 統計の詳細な説明                                 |
| `DESCRIPTION`          | 解説           | 統計の概要説明（explanationGetFlg=Y の場合）     |

### 4.4 統計名リスト表示の場合（statsNameList=Y）

```json
"DATALIST_INF": {
  "NUMBER": 3,
  "LIST_INF": [
    {
      "@id": "00200531",
      "STAT_NAME": {
        "@code": "00200531",
        "$": "労働力調査"
      },
      "GOV_ORG": {
        "@code": "00200",
        "$": "総務省"
      }
    }
  ]
}
```

## 5. 統計分野コード一覧

| コード | 分野名                     |
| ------ | -------------------------- |
| `01`   | 国土・気象                 |
| `02`   | 人口・世帯                 |
| `03`   | 労働・賃金                 |
| `04`   | 事業所                     |
| `05`   | 農林水産業                 |
| `06`   | 鉱工業                     |
| `07`   | 商業・サービス業           |
| `08`   | 企業・家計・経済           |
| `09`   | 住宅・土地・建設           |
| `10`   | エネルギー・水             |
| `11`   | 運輸・観光                 |
| `12`   | 情報通信・科学技術         |
| `13`   | 教育・文化・スポーツ・生活 |
| `14`   | 行財政                     |
| `15`   | 司法・安全・環境           |
| `16`   | 社会保障・衛生             |
| `17`   | 国際                       |

## 6. 実践的な使用例

### 6.1 基本的な検索

#### 例 1: 人口に関する統計を検索

```bash
curl "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=YOUR_APP_ID&searchWord=人口&limit=10"
```

#### 例 2: 総務省の統計を検索（2020 年以降）

```bash
curl "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=YOUR_APP_ID&statsCode=00200&surveyYears=202001-"
```

#### 例 3: 都道府県別の統計のみを取得

```bash
curl "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=YOUR_APP_ID&collectArea=2&limit=50"
```

### 6.2 TypeScript 実装例

```typescript
interface GetStatsListParams {
  appId: string;
  lang?: "J" | "E";
  surveyYears?: string;
  openYears?: string;
  statsField?: string;
  statsCode?: string;
  searchWord?: string;
  searchKind?: "1" | "2";
  collectArea?: "1" | "2" | "3";
  explanationGetFlg?: "Y" | "N";
  statsNameList?: "Y" | "N";
  startPosition?: number;
  limit?: number;
  updatedDate?: string;
}

interface StatsListResponse {
  GET_STATS_LIST: {
    RESULT: {
      STATUS: number;
      ERROR_MSG: string;
      DATE: string;
    };
    PARAMETER: Record<string, any>;
    DATALIST_INF: {
      NUMBER: number;
      RESULT_INF: {
        FROM_NUMBER: number;
        TO_NUMBER: number;
        NEXT_KEY?: number;
      };
      TABLE_INF: Array<{
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
        TITLE: {
          "@no": string;
          $: string;
        };
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
      }>;
    };
  };
}

async function getStatsList(
  params: GetStatsListParams
): Promise<StatsListResponse> {
  const baseUrl = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList";

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

    const data: StatsListResponse = await response.json();

    // エラーチェック
    if (data.GET_STATS_LIST.RESULT.STATUS !== 0) {
      throw new Error(data.GET_STATS_LIST.RESULT.ERROR_MSG);
    }

    return data;
  } catch (error) {
    console.error("統計表リスト取得エラー:", error);
    throw error;
  }
}

// 使用例
const result = await getStatsList({
  appId: "YOUR_APP_ID",
  searchWord: "人口",
  statsField: "02",
  limit: 100,
});

console.log(`該当件数: ${result.GET_STATS_LIST.DATALIST_INF.NUMBER}`);
result.GET_STATS_LIST.DATALIST_INF.TABLE_INF.forEach((table) => {
  console.log(`統計表ID: ${table["@id"]}`);
  console.log(`統計名: ${table.STAT_NAME.$}`);
  console.log(`タイトル: ${table.TITLE.$}`);
  console.log("---");
});
```

### 6.3 ページング処理の実装

```typescript
async function getAllStatsListWithPaging(
  params: GetStatsListParams,
  maxResults: number = 10000
): Promise<StatsListResponse["GET_STATS_LIST"]["DATALIST_INF"]["TABLE_INF"]> {
  const allTables: any[] = [];
  let startPosition = 1;
  const limit = 1000; // 1回あたりの取得件数

  while (allTables.length < maxResults) {
    const response = await getStatsList({
      ...params,
      startPosition,
      limit,
    });

    const datalist = response.GET_STATS_LIST.DATALIST_INF;
    allTables.push(...datalist.TABLE_INF);

    // 次のページがない場合は終了
    if (!datalist.RESULT_INF.NEXT_KEY || allTables.length >= datalist.NUMBER) {
      break;
    }

    startPosition = datalist.RESULT_INF.NEXT_KEY;

    // API制限を考慮した遅延
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allTables.slice(0, maxResults);
}
```

## 7. 活用シナリオ

### 7.1 統計表の検索・選択

```typescript
// シナリオ: 都道府県別人口データを探す
const populationStats = await getStatsList({
  appId: "YOUR_APP_ID",
  searchWord: "人口 都道府県",
  statsField: "02", // 人口・世帯
  collectArea: "2", // 都道府県別
  searchKind: "1", // AND検索
});

// 最新のデータを選択
const latestStat = populationStats.GET_STATS_LIST.DATALIST_INF.TABLE_INF.sort(
  (a, b) => b.SURVEY_DATE.localeCompare(a.SURVEY_DATE)
)[0];

console.log(`最新の統計表ID: ${latestStat["@id"]}`);
```

### 7.2 特定省庁の統計一覧取得

```typescript
// シナリオ: 総務省の統計を年次でまとめる
const soumuStats = await getStatsList({
  appId: "YOUR_APP_ID",
  statsCode: "00200", // 総務省コード
  limit: 1000,
});

// 年次ごとにグループ化
const statsByYear = soumuStats.GET_STATS_LIST.DATALIST_INF.TABLE_INF.reduce(
  (acc, stat) => {
    const year = stat.SURVEY_DATE.substring(0, 4);
    if (!acc[year]) acc[year] = [];
    acc[year].push(stat);
    return acc;
  },
  {} as Record<string, any[]>
);
```

### 7.3 更新された統計の監視

```typescript
// シナリオ: 特定統計の更新をチェック
async function checkForUpdates(
  lastCheckedDate: string,
  statsCode: string
): Promise<any[]> {
  const response = await getStatsList({
    appId: "YOUR_APP_ID",
    statsCode,
    updatedDate: lastCheckedDate,
  });

  return response.GET_STATS_LIST.DATALIST_INF.TABLE_INF.filter(
    (stat) => stat.UPDATED_DATE > lastCheckedDate
  );
}

const newStats = await checkForUpdates("2024-01-01", "00200522");
console.log(`新しく更新された統計: ${newStats.length}件`);
```

## 8. よくある使用パターン

### パターン 1: 統計表 ID の取得（データ取得の前準備）

```typescript
// 1. まずGET_STATS_LISTで統計表を検索
const searchResult = await getStatsList({
  appId: "YOUR_APP_ID",
  searchWord: "国勢調査 人口",
  limit: 10,
});

// 2. 取得した統計表IDを使ってGET_STATS_DATAでデータ取得
const tableId = searchResult.GET_STATS_LIST.DATALIST_INF.TABLE_INF[0]["@id"];
// → 次のステップでGET_STATS_DATAを呼び出す
```

### パターン 2: メタデータ収集

```typescript
// 統計表のメタ情報を収集してデータベースに保存
const allStats = await getAllStatsListWithPaging({
  appId: "YOUR_APP_ID",
  statsField: "02", // 人口分野のみ
});

// データベースに保存（例）
await db.stats.insertMany(
  allStats.map((stat) => ({
    tableId: stat["@id"],
    statName: stat.STAT_NAME.$,
    govOrg: stat.GOV_ORG.$,
    title: stat.TITLE.$,
    surveyDate: stat.SURVEY_DATE,
    updatedDate: stat.UPDATED_DATE,
  }))
);
```

## 9. エラーハンドリング

### 主なエラーコードと対処法

| STATUS | ERROR_MSG                        | 原因                   | 対処法                           |
| ------ | -------------------------------- | ---------------------- | -------------------------------- |
| `100`  | `"アプリケーションIDが不正です"` | appId が無効           | 正しいアプリケーション ID を使用 |
| `100`  | `"該当するデータが存在しません"` | 検索条件に該当なし     | 検索条件を緩和                   |
| `100`  | `"パラメータが不正です"`         | パラメータの形式エラー | パラメータを確認                 |

### エラーハンドリング実装例

```typescript
async function getStatsListWithRetry(
  params: GetStatsListParams,
  maxRetries: number = 3
): Promise<StatsListResponse> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await getStatsList(params);
      return result;
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // 指数バックオフで再試行
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  throw new Error("Max retries exceeded");
}
```

## 10. ベストプラクティス

### ✅ 推奨事項

1. **JSON 形式を使用** - XML よりパースが容易
2. **ページングを実装** - 大量データ取得時は必須
3. **キャッシングを活用** - 同じクエリの結果をキャッシュ
4. **API 制限を考慮** - リクエスト間に適度な遅延を入れる
5. **エラーハンドリング** - リトライ機構を実装

### ❌ 避けるべき事項

1. **大量の連続リクエスト** - サーバー負荷を考慮
2. **limit 指定なし** - デフォルト 100 件、必要に応じて調整
3. **エラー無視** - STATUS 確認を怠らない

## 11. まとめ

`GET_STATS_LIST`は、e-Stat API の中で最も基本的で重要な API です。

### 主な活用方法

1. **統計表の探索** - キーワードや分野から統計を検索
2. **統計表 ID の取得** - データ取得に必要な ID を特定
3. **メタデータ管理** - 統計表の一覧や更新情報を管理

### 次のステップ

- `GET_META_INFO`: 統計表の詳細なメタ情報を取得
- `GET_STATS_DATA`: 実際の統計データを取得

この API をマスターすることで、e-Stat の膨大な統計データを効率的に活用できるようになります。
