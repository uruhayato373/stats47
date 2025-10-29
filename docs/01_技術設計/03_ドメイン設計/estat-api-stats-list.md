---
title: e-Stat API `GET_STATS_LIST` 完全ガイド
created: 2025-10-14
updated: 2025-10-16
tags:
  - domain/estat-api
  - specifications
---

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

# stats-list サブドメイン概要

## 目的

stats-list サブドメインは、e-Stat API から利用可能な統計表の一覧を取得し、検索・フィルタリング機能を提供する責務を持ちます。ユーザーが目的の統計表を見つけやすくするための検索機能と、統計表の基本情報を管理します。

> **🔄 useSWR 最適化完了** (2025-01-18)
>
> このサブドメインは useSWR による最適化が完了しており、自動キャッシュ管理、重複リクエスト排除、エラーハンドリングの簡素化が実現されています。詳細は[useSWR 最適化実装ガイド](../implementation/useswr-optimization.md)を参照してください。

## 主要な機能

### 1. 統計表一覧の取得

- e-Stat API から統計表リストを取得
- ページネーション対応
- 基本情報の整形

### 2. 検索機能

- キーワード検索
- 政府統計名での検索
- 統計表題名での検索

### 3. フィルタリング

- 政府統計名での絞り込み
- 統計表の種類での絞り込み
- 更新日での絞り込み

### 4. ソート機能

- 更新日順ソート
- 統計表名順ソート
- 政府統計名順ソート

## アーキテクチャ

### ディレクトリ構造

```
src/infrastructure/estat-api/stats-list/
├── index.ts                    # エントリーポイント
├── fetcher.ts                  # API通信クラス
├── formatter.ts                # データ変換処理
├── cache-key.ts                # キャッシュキー生成（useSWR最適化）
├── swr-fetcher.ts              # SWR用fetcher関数（useSWR最適化）
├── types/
│   ├── index.ts
│   ├── parameters.ts           # APIパラメータ型
│   ├── formatted.ts            # 整形済みデータ型
│   └── raw-response.ts         # 生APIレスポンス型
└── __tests__/
    ├── formatter.test.ts
    └── service.test.ts
```

### useSWR 最適化による変更点

- **cache-key.ts**: 検索オプションから一意のキャッシュキーを生成
- **swr-fetcher.ts**: useSWR 用の fetcher 関数（自動キャッシュ・リトライ）
- **useStatsListSearch**: 手動状態管理から useSWR に移行（65%コード削減）

### データフロー（useSWR 最適化版）

```
検索オプション
    │
    ▼
generateStatsListCacheKey() → キャッシュキー生成
    │
    ▼
useSWR(cacheKey, statsListFetcher) → 自動キャッシュ・リトライ
    │
    ├─► EstatStatsListFetcher → 生APIレスポンス
    └─► EstatStatsListFormatter → 整形済みデータ
            │
            ├─► formatTableList() → 統計表一覧
            ├─► formatTableInf() → 統計表情報
            └─► formatTableName() → 統計表名
                    │
                    ▼
            FormattedStatsList
                    │
                    ▼
            useMemo() → フィルタ・ソート処理（クライアント側）
                    │
                    ▼
            FinalSearchResult
```

### キャッシュ戦略

- **キャッシュ期間**: 5 分間（`dedupingInterval: 300000`）
- **リトライ**: 3 回まで自動リトライ
- **重複排除**: 同じ検索条件での重複リクエストを自動排除
- **バックグラウンド更新**: ネットワーク再接続時に自動再取得

## 主要なコンポーネント

### EstatStatsListService

- 統計表リストの取得
- 検索・フィルタリング機能
- ページネーション処理

### EstatStatsListFormatter

- 生 API レスポンスの解析
- 構造化データへの変換
- 検索結果の整形

## 型定義

### 主要な型

- `EstatStatsListResponse`: 生 API レスポンス
- `FormattedStatsList`: 整形済みデータ
- `StatsListOptions`: 取得オプション
- `SearchOptions`: 検索オプション
- `PaginationOptions`: ページネーションオプション

### 検索オプション

```typescript
interface SearchOptions {
  searchWord?: string; // 検索キーワード
  searchKind?: "1" | "2" | "3"; // 検索種別
  statsField?: string; // 統計分野
  statsCode?: string; // 政府統計コード
  cycle?: string; // 周期
  surveyYears?: string; // 調査年月
  openYears?: string; // 公開年月
  statsName?: string; // 政府統計名
  statsNameId?: string; // 政府統計名ID
  startPosition?: number; // 開始位置
  limit?: number; // 取得件数
  sortField?: string; // ソート項目
  sortOrder?: "asc" | "desc"; // ソート順序
}
```

## 設定

### 環境変数

```bash
# API設定
NEXT_PUBLIC_ESTAT_API_BASE_URL=https://api.e-stat.go.jp/rest/3.0/app/json
NEXT_PUBLIC_ESTAT_APP_ID=your_app_id

# 検索設定
NEXT_PUBLIC_ESTAT_DEFAULT_LIMIT=20
NEXT_PUBLIC_ESTAT_MAX_LIMIT=100
NEXT_PUBLIC_ESTAT_DEFAULT_SORT_FIELD=UPDATED_DATE
NEXT_PUBLIC_ESTAT_DEFAULT_SORT_ORDER=desc

# タイムアウト設定
NEXT_PUBLIC_ESTAT_REQUEST_TIMEOUT_MS=30000
NEXT_PUBLIC_ESTAT_CONNECTION_TIMEOUT_MS=10000
```

## 使用例（useSWR 最適化版）

### 基本的な検索

```typescript
import { useStatsListSearch } from "@/hooks/estat-api/useStatsListSearch";

function StatsListComponent() {
  const { searchResult, isLoading, error, search } = useStatsListSearch();

  const handleSearch = () => {
    // キーワード検索（自動キャッシュ・リトライ）
    search({
      searchWord: "人口",
      limit: 20,
    });
  };

  if (isLoading) return <div>検索中...</div>;
  if (error) return <div>エラー: {error}</div>;

  return (
    <div>
      <button onClick={handleSearch}>検索実行</button>
      <div>検索結果件数: {searchResult?.tables.length}</div>
      <div>総件数: {searchResult?.totalCount}</div>
    </div>
  );
}
```

### フィルタ・ソート機能

```typescript
function StatsListWithFilters() {
  const { searchResult, isLoading, search, filter, sort } =
    useStatsListSearch();

  const handleFilter = () => {
    // フィルタリング（useMemoで最適化）
    filter({
      cycleFilter: ["年次"],
      organizationFilter: ["総務省"],
    });
  };

  const handleSort = () => {
    // ソート（useMemoで最適化）
    sort("surveyDate", "desc");
  };

  return (
    <div>
      <button onClick={handleFilter}>フィルタ適用</button>
      <button onClick={handleSort}>ソート実行</button>
      {/* 結果表示 */}
    </div>
  );
}
```

### キャッシュの活用

```typescript
function CachedSearch() {
  const { searchResult, isLoading, refetch } = useStatsListSearch();

  // 同じ検索条件では自動的にキャッシュから取得
  // 手動で再取得したい場合は refetch() を使用
  const handleRefresh = () => {
    refetch();
  };

  return (
    <div>
      <button onClick={handleRefresh}>データ更新</button>
      {/* 結果表示 */}
    </div>
  );
}
```

### 従来の API（下位互換性）

```typescript
import { EstatStatsListFetcher } from "@/infrastructure/estat-api/stats-list";

// 従来のAPIも引き続き使用可能
const result = await EstatStatsListFetcher.searchByKeyword("人口", {
  limit: 20,
});
```

## エラーハンドリング

### カスタムエラークラス

- `EstatStatsListFetchError`: API 取得エラー
- `EstatListFormatError`: データ変換エラー
- `EstatSearchError`: 検索エラー

### エラー処理例

```typescript
try {
  const result = await EstatStatsListService.getAndFormatStatsList({
    searchWord: "人口",
  });
  // 検索結果の処理
} catch (error) {
  if (error instanceof EstatStatsListFetchError) {
    console.error("検索エラー:", error.message);
    console.error("検索条件:", error.searchOptions);
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
npm test -- src/infrastructure/estat-api/stats-list/__tests__
```

## パフォーマンス最適化（useSWR 版）

### 1. 自動キャッシュ管理

- **キャッシュ期間**: 5 分間の自動キャッシュ
- **重複排除**: 同じ検索条件での重複リクエストを自動排除
- **メモリ効率**: useSWR による効率的なメモリ管理

### 2. クライアント側最適化

- **useMemo**: フィルタ・ソート処理を useMemo で最適化
- **条件付きレンダリング**: 不要な再レンダリングを防止
- **バッチ処理**: 複数の状態更新をバッチ処理

### 3. ネットワーク最適化

- **自動リトライ**: 3 回まで自動リトライ（指数バックオフ）
- **バックグラウンド更新**: ネットワーク再接続時の自動再取得
- **タイムアウト処理**: 適切なタイムアウト設定

### 4. コード最適化

- **コード削減**: 65%のコード削減（437 行 → 150 行）
- **保守性向上**: ビジネスロジックとデータ取得の分離
- **型安全性**: TypeScript による型安全性の確保

## 検索機能の詳細

### 検索種別

- `1`: 統計表名・調査名
- `2`: 政府統計名
- `3`: 統計表名・調査名・政府統計名

### 統計分野

- `1`: 人口・世帯
- `2`: 労働・賃金
- `3`: 農林水産業
- `4`: 鉱工業
- `5`: 商業・サービス業
- `6`: 企業・企業活動
- `7`: 物価・地価・賃金
- `8`: 国民経済計算
- `9`: 企業活動
- `10`: 家計
- `11`: 住宅・土地
- `12`: 環境・エネルギー
- `13`: 科学技術・研究開発
- `14`: 情報通信
- `15`: 運輸・観光
- `16`: 教育・文化・スポーツ・生活
- `17`: 司法・安全・環境
- `18`: 社会保障・衛生
- `19`: 国際
- `20`: その他

### 周期

- `年次`: 年次統計
- `月次`: 月次統計
- `四半期`: 四半期統計
- `日次`: 日次統計
- `その他`: その他の周期

## 関連ドキュメント

- [API 仕様](04_ドメイン設計/e-Stat%20API/02_統計表リスト/api.md) - get-stats-list API の詳細
- [サービス仕様](04_ドメイン設計/e-Stat%20API/02_統計表リスト/service.md) - サービスクラスの実装詳細
- [実装ガイド](implementation/) - 実装に関する詳細ガイド
- [テストガイド](testing/) - テスト戦略と実装

## 今後の拡張予定

1. **高度な検索**: 複合条件での検索機能
2. **検索履歴**: ユーザーの検索履歴管理（簡素化済み）
3. **お気に入り**: 統計表のお気に入り機能（実装済み）
4. **レコメンデーション**: 関連統計表の推薦機能
5. **検索分析**: 検索パターンの分析と最適化
6. **リアルタイム更新**: WebSocket によるリアルタイムデータ更新
7. **オフライン対応**: Service Worker によるオフラインキャッシュ

## useSWR 最適化の効果

### パフォーマンス改善

- **レスポンス時間**: キャッシュによる高速化
- **ネットワーク使用量**: 重複リクエストの削減
- **メモリ使用量**: 効率的なキャッシュ管理

### 開発体験向上

- **コード量**: 65%削減による保守性向上
- **エラーハンドリング**: 統一されたエラー処理
- **デバッグ**: 詳細なログ出力とエラー情報

### ユーザー体験向上

- **ローディング時間**: キャッシュによる即座の表示
- **エラー回復**: 自動リトライによる安定性
- **データ鮮度**: バックグラウンド更新による最新データ

# EstatStatsListService

## 概要

`EstatStatsListService` は、e-Stat APIから統計データリスト（統計表の一覧）を取得し、整形するためのサービスクラスです。

**ファイルパス**: `src/infrastructure/estat/statslist/EstatStatsListService.ts`

## 主な機能

1. 統計データリストの取得（生データ）
2. 統計データリストの整形
3. 検索とフィルタリング
4. ページネーション

## メソッド一覧

### パブリックメソッド

| メソッド名 | 戻り値 | 説明 |
|-----------|--------|------|
| `getAndFormatStatsList()` | `Promise<FormattedStatListItem[]>` | 統計データリストを取得して整形 |
| `getStatsListRaw()` | `Promise<EstatStatsListResponse>` | 統計データリストを取得（生データ） |
| `formatStatsList()` | `FormattedStatListItem[]` | 統計データリストレスポンスを整形 |

### プライベートメソッド

| メソッド名 | 戻り値 | 説明 |
|-----------|--------|------|
| `cleanString()` | `string` | 文字列をクリーンアップ |

## 詳細仕様

### 1. getAndFormatStatsList()

統計データリストを取得して整形する最も一般的なメソッドです。

#### シグネチャ

```typescript
static async getAndFormatStatsList(
  options: {
    searchWord?: string;
    searchKind?: "1" | "2" | "3";
    startPosition?: number;
    limit?: number;
  } = {}
): Promise<FormattedStatListItem[]>
```

#### パラメータ

- `options.searchWord` (string, optional): 検索キーワード
- `options.searchKind` ("1" | "2" | "3", optional): 検索種別
  - `"1"`: 政府統計名で検索（デフォルト）
  - `"2"`: 統計表題で検索
  - `"3"`: 項目名で検索
- `options.startPosition` (number, optional): データ開始位置（デフォルト: 1）
- `options.limit` (number, optional): 取得件数（デフォルト: 20）

#### 戻り値

`FormattedStatListItem[]` - 統計データリスト項目の配列

```typescript
{
  id: string;              // 統計表ID
  statName: string;        // 政府統計名
  title: string;           // 統計表題名
  govOrg: string;          // 作成機関名
  statisticsName: string;  // 提供統計名
  surveyDate: string;      // 調査年月
  updatedDate: string;     // 更新日
  description?: string;    // 説明（任意）
}
```

#### 使用例

```typescript
// 基本的な使用（デフォルト設定）
const list = await EstatStatsListService.getAndFormatStatsList();

console.log(`取得件数: ${list.length}`);
list.forEach(item => {
  console.log(`${item.id}: ${item.title}`);
});
```

```typescript
// キーワード検索
const searchResults = await EstatStatsListService.getAndFormatStatsList({
  searchWord: '人口',
  searchKind: '1',  // 政府統計名で検索
  limit: 50
});

searchResults.forEach(item => {
  console.log(`統計名: ${item.statName}`);
  console.log(`表題: ${item.title}`);
  console.log(`更新日: ${item.updatedDate}`);
  console.log('---');
});
```

```typescript
// ページネーション
const page2 = await EstatStatsListService.getAndFormatStatsList({
  startPosition: 21,  // 21件目から取得
  limit: 20           // 20件取得
});
```

### 2. getStatsListRaw()

整形前の生データを取得します。

#### シグネチャ

```typescript
static async getStatsListRaw(
  options: {
    searchWord?: string;
    searchKind?: "1" | "2" | "3";
    startPosition?: number;
    limit?: number;
  } = {}
): Promise<EstatStatsListResponse>
```

#### 使用例

```typescript
const rawList = await EstatStatsListService.getStatsListRaw({
  searchWord: '人口',
  limit: 10
});

console.log(rawList.GET_STATS_LIST?.DATALIST_INF);
```

### 3. formatStatsList()

生のAPIレスポンスを整形します。

#### シグネチャ

```typescript
static formatStatsList(
  response: EstatStatsListResponse
): FormattedStatListItem[]
```

#### 使用例

```typescript
const rawList = await EstatStatsListService.getStatsListRaw();
const formattedList = EstatStatsListService.formatStatsList(rawList);
```

## データ整形の仕組み

### レスポンスのパース

APIレスポンスから必要な情報を抽出し、統一された形式に変換します。

**入力**: `EstatStatsListResponse`

```typescript
{
  GET_STATS_LIST: {
    DATALIST_INF: {
      LIST_INF: {
        TABLE_INF: [
          {
            "@id": "0000010101",
            STAT_NAME: { $: "国勢調査" },
            TITLE: { $: "人口等基本集計" },
            GOV_ORG: { $: "総務省" },
            STATISTICS_NAME: "人口・世帯数",
            SURVEY_DATE: "2020",
            UPDATED_DATE: "2021-11-30"
          },
          // ...
        ]
      }
    }
  }
}
```

**出力**: `FormattedStatListItem[]`

```typescript
[
  {
    id: "0000010101",
    statName: "国勢調査",
    title: "人口等基本集計",
    govOrg: "総務省",
    statisticsName: "人口・世帯数",
    surveyDate: "2020",
    updatedDate: "2021-11-30"
  },
  // ...
]
```

### 配列の正規化

APIレスポンスは、1件の場合はオブジェクト、複数件の場合は配列として返されるため、常に配列として扱えるように正規化します。

```typescript
const tableArray = Array.isArray(tables) ? tables : [tables];
```

### 文字列のクリーンアップ

取得した文字列データは `trim()` で前後の空白を削除し、`cleanString()` で整形します。

## 検索機能の詳細

### searchKind パラメータ

検索対象を指定します。

| 値 | 検索対象 | 説明 |
|----|---------|------|
| `"1"` | 政府統計名 | 統計の名称（例: 国勢調査、労働力調査） |
| `"2"` | 統計表題 | 個別の統計表のタイトル |
| `"3"` | 項目名 | 統計項目の名称 |

#### 使用例

```typescript
// 政府統計名で検索
const byStatName = await EstatStatsListService.getAndFormatStatsList({
  searchWord: '国勢調査',
  searchKind: '1'
});

// 統計表題で検索
const byTitle = await EstatStatsListService.getAndFormatStatsList({
  searchWord: '人口等基本集計',
  searchKind: '2'
});

// 項目名で検索
const byItem = await EstatStatsListService.getAndFormatStatsList({
  searchWord: '総人口',
  searchKind: '3'
});
```

## ページネーション

大量のデータを分割して取得するためのページネーション機能を提供します。

### 基本的な使い方

```typescript
const limit = 20;
const totalPages = 5;

for (let page = 1; page <= totalPages; page++) {
  const startPosition = (page - 1) * limit + 1;

  const list = await EstatStatsListService.getAndFormatStatsList({
    startPosition,
    limit
  });

  console.log(`Page ${page}:`, list.length, '件');

  // データ処理
  processData(list);
}
```

### ヘルパー関数の実装例

```typescript
async function fetchAllPages(
  searchWord: string,
  maxPages: number = 10
): Promise<FormattedStatListItem[]> {
  const allResults: FormattedStatListItem[] = [];
  const limit = 100;

  for (let page = 0; page < maxPages; page++) {
    const startPosition = page * limit + 1;

    const results = await EstatStatsListService.getAndFormatStatsList({
      searchWord,
      startPosition,
      limit
    });

    if (results.length === 0) {
      break; // データがなくなったら終了
    }

    allResults.push(...results);
  }

  return allResults;
}

// 使用例
const allStats = await fetchAllPages('人口');
console.log(`総件数: ${allStats.length}`);
```

## 実用的な使用例

### 1. 最新の統計表を取得

```typescript
const recentStats = await EstatStatsListService.getAndFormatStatsList({
  limit: 10
});

// 更新日でソート
recentStats.sort((a, b) =>
  new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime()
);

console.log('最新の統計表:');
recentStats.forEach(stat => {
  console.log(`${stat.title} (更新: ${stat.updatedDate})`);
});
```

### 2. 特定の省庁の統計を検索

```typescript
const allStats = await EstatStatsListService.getAndFormatStatsList({
  limit: 100
});

// 総務省の統計のみをフィルタ
const somuStats = allStats.filter(stat =>
  stat.govOrg.includes('総務省')
);

console.log(`総務省の統計: ${somuStats.length}件`);
```

### 3. 統計表IDのリストを作成

```typescript
const stats = await EstatStatsListService.getAndFormatStatsList({
  searchWord: '人口',
  limit: 50
});

// 統計表IDのみを抽出
const statsIds = stats.map(stat => stat.id);

console.log('統計表ID一覧:', statsIds);

// 各統計表のデータを取得
for (const id of statsIds) {
  const data = await EstatStatsDataService.getAndFormatStatsData(id);
  // データ処理...
}
```

### 4. 統計情報のサマリー作成

```typescript
const stats = await EstatStatsListService.getAndFormatStatsList({
  limit: 200
});

// 作成機関別の集計
const orgCounts = stats.reduce((acc, stat) => {
  acc[stat.govOrg] = (acc[stat.govOrg] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('作成機関別統計表数:');
Object.entries(orgCounts)
  .sort(([, a], [, b]) => b - a)
  .forEach(([org, count]) => {
    console.log(`${org}: ${count}件`);
  });
```

### 5. 調査年別の統計数

```typescript
const stats = await EstatStatsListService.getAndFormatStatsList({
  limit: 200
});

// 調査年別の集計
const yearCounts = stats.reduce((acc, stat) => {
  const year = stat.surveyDate.substring(0, 4); // YYYYを抽出
  acc[year] = (acc[year] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('調査年別統計表数:');
Object.entries(yearCounts)
  .sort(([a], [b]) => b.localeCompare(a))
  .forEach(([year, count]) => {
    console.log(`${year}年: ${count}件`);
  });
```

## エラーハンドリング

メソッドは、エラー発生時に詳細な情報をログに出力し、わかりやすいエラーメッセージを含む例外をスローします。

```typescript
try {
  const list = await EstatStatsListService.getAndFormatStatsList({
    searchWord: '人口'
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('統計リストの取得に失敗:', error.message);
  }
}
```

## パフォーマンスに関する注意事項

### 1. limit の適切な設定

一度に大量のデータを取得すると処理時間が長くなります。適切な `limit` 値を設定してください。

```typescript
// 推奨: 適切な件数を指定
const list = await EstatStatsListService.getAndFormatStatsList({
  limit: 50
});
```

### 2. 検索条件の活用

無駄なデータ取得を避けるため、検索条件を活用してください。

```typescript
// 良い例: 検索条件で絞り込み
const list = await EstatStatsListService.getAndFormatStatsList({
  searchWord: '国勢調査',
  searchKind: '1'
});

// 悪い例: すべて取得してから絞り込み
const all = await EstatStatsListService.getAndFormatStatsList({
  limit: 1000
});
const filtered = all.filter(item => item.statName.includes('国勢調査'));
```

## API制限に関する注意

e-Stat APIには利用制限があります。連続して多数のリクエストを送信する場合は、適切な間隔を空けてください。

```typescript
async function fetchWithDelay(
  requests: Array<{ searchWord: string }>,
  delayMs: number = 1000
): Promise<FormattedStatListItem[][]> {
  const results: FormattedStatListItem[][] = [];

  for (const req of requests) {
    const data = await EstatStatsListService.getAndFormatStatsList(req);
    results.push(data);

    // 次のリクエストまで待機
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return results;
}
```

## 関連ドキュメント

- [型定義: FormattedStatListItem](types.md#formattedstatlistitem)
- [EstatStatsDataService](stats-data-service.md)
- [使用例](examples.md#estatstatslistservice)
- [ライブラリ概要](02_domain/estat-api/specifications/overview.md)

# stats-list 単体テストガイド

## 概要

stats-list サブドメインの単体テストの実装方法について説明します。EstatStatsListService と EstatStatsListFormatter のテスト方法を詳述します。

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

## EstatStatsListService のテスト

### 1. 基本テスト

`src/infrastructure/estat-api/stats-list/__tests__/service.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstatStatsListService } from "../service";
import { EstatStatsListFetchError } from "../../errors";

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

describe("EstatStatsListService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStatsList", () => {
    it("正常に統計一覧を取得できる", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 2,
            RESULT: {
              INF: [
                {
                  "@id": "0000010101",
                  STAT_NAME: "人口推計",
                  TITLE: "都道府県別人口",
                  CYCLE: "年次",
                  SURVEY_DATE: "2023年",
                  GOV_ORG: "総務省",
                  STATISTICS_NAME: "人口推計",
                  TITLE_SPEC: "都道府県別人口",
                  CYCLE_SPEC: "年次",
                  SURVEY_DATE_SPEC: "2023年",
                  GOV_ORG_SPEC: "総務省",
                  COLLECT_AREA: "全国",
                  MAIN_CATEGORY: "人口・世帯",
                  SUB_CATEGORY: "人口",
                  OVERALL_TOTAL_NUMBER: 1,
                  UPDATED_DATE: "2024-01-01",
                },
                {
                  "@id": "0000010102",
                  STAT_NAME: "人口推計",
                  TITLE: "市区町村別人口",
                  CYCLE: "年次",
                  SURVEY_DATE: "2023年",
                  GOV_ORG: "総務省",
                  STATISTICS_NAME: "人口推計",
                  TITLE_SPEC: "市区町村別人口",
                  CYCLE_SPEC: "年次",
                  SURVEY_DATE_SPEC: "2023年",
                  GOV_ORG_SPEC: "総務省",
                  COLLECT_AREA: "全国",
                  MAIN_CATEGORY: "人口・世帯",
                  SUB_CATEGORY: "人口",
                  OVERALL_TOTAL_NUMBER: 1,
                  UPDATED_DATE: "2024-01-01",
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

      const result = await EstatStatsListService.getStatsList();

      expect(result).toHaveProperty("statsList");
      expect(result).toHaveProperty("totalCount");
      expect(result.statsList).toHaveLength(2);
      expect(result.statsList[0]).toMatchObject({
        id: "0000010101",
        statName: "人口推計",
        title: "都道府県別人口",
        cycle: "年次",
        surveyDate: "2023年",
        govOrg: "総務省",
        collectArea: "全国",
        mainCategory: "人口・世帯",
        subCategory: "人口",
        updatedDate: "2024-01-01",
      });
    });

    it("検索オプションが正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 0,
            RESULT: { INF: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsListService.getStatsList({
        searchWord: "人口",
        surveyYears: "2023",
        openYears: "2023",
        statsField: "人口・世帯",
        statsField2: "人口",
        govOrg: "総務省",
        cycle: "年次",
        dataType: "統計データ",
        format: "JSON",
        lang: "J",
        startPosition: 1,
        limit: 100,
        sortField: "UPDATED_DATE",
        sortKind: "DESC",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=test-app-id&searchWord=人口&surveyYears=2023&openYears=2023&statsField=人口・世帯&statsField2=人口&govOrg=総務省&cycle=年次&dataType=統計データ&format=JSON&lang=J&startPosition=1&limit=100&sortField=UPDATED_DATE&sortKind=DESC"
      );
    });

    it("APIエラー時に適切なエラーを投げる", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      });

      await expect(EstatStatsListService.getStatsList()).rejects.toThrow(
        EstatStatsListFetchError
      );
    });

    it("ネットワークエラー時に適切なエラーを投げる", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));

      await expect(EstatStatsListService.getStatsList()).rejects.toThrow(
        EstatStatsListFetchError
      );
    });
  });

  describe("searchStatsList", () => {
    it("検索語で統計一覧を検索できる", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 1,
            RESULT: {
              INF: [
                {
                  "@id": "0000010101",
                  STAT_NAME: "人口推計",
                  TITLE: "都道府県別人口",
                  CYCLE: "年次",
                  SURVEY_DATE: "2023年",
                  GOV_ORG: "総務省",
                  STATISTICS_NAME: "人口推計",
                  TITLE_SPEC: "都道府県別人口",
                  CYCLE_SPEC: "年次",
                  SURVEY_DATE_SPEC: "2023年",
                  GOV_ORG_SPEC: "総務省",
                  COLLECT_AREA: "全国",
                  MAIN_CATEGORY: "人口・世帯",
                  SUB_CATEGORY: "人口",
                  OVERALL_TOTAL_NUMBER: 1,
                  UPDATED_DATE: "2024-01-01",
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

      const result = await EstatStatsListService.searchStatsList("人口");

      expect(result.statsList).toHaveLength(1);
      expect(result.statsList[0].title).toContain("人口");
    });
  });

  describe("getStatsListByCategory", () => {
    it("カテゴリで統計一覧を取得できる", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 1,
            RESULT: {
              INF: [
                {
                  "@id": "0000010101",
                  STAT_NAME: "人口推計",
                  TITLE: "都道府県別人口",
                  CYCLE: "年次",
                  SURVEY_DATE: "2023年",
                  GOV_ORG: "総務省",
                  STATISTICS_NAME: "人口推計",
                  TITLE_SPEC: "都道府県別人口",
                  CYCLE_SPEC: "年次",
                  SURVEY_DATE_SPEC: "2023年",
                  GOV_ORG_SPEC: "総務省",
                  COLLECT_AREA: "全国",
                  MAIN_CATEGORY: "人口・世帯",
                  SUB_CATEGORY: "人口",
                  OVERALL_TOTAL_NUMBER: 1,
                  UPDATED_DATE: "2024-01-01",
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

      const result = await EstatStatsListService.getStatsListByCategory(
        "人口・世帯"
      );

      expect(result.statsList).toHaveLength(1);
      expect(result.statsList[0].mainCategory).toBe("人口・世帯");
    });
  });
});
```

## EstatStatsListFormatter のテスト

### 1. 基本テスト

`src/infrastructure/estat-api/stats-list/__tests__/formatter.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { EstatStatsListFormatter } from "../formatter";
import { EstatStatsListResponse } from "../../types/stats-list";

describe("EstatStatsListFormatter", () => {
  describe("formatStatsList", () => {
    it("統計一覧を正しく整形できる", () => {
      const mockResponse: EstatStatsListResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 2,
            RESULT: {
              INF: [
                {
                  "@id": "0000010101",
                  STAT_NAME: "人口推計",
                  TITLE: "都道府県別人口",
                  CYCLE: "年次",
                  SURVEY_DATE: "2023年",
                  GOV_ORG: "総務省",
                  STATISTICS_NAME: "人口推計",
                  TITLE_SPEC: "都道府県別人口",
                  CYCLE_SPEC: "年次",
                  SURVEY_DATE_SPEC: "2023年",
                  GOV_ORG_SPEC: "総務省",
                  COLLECT_AREA: "全国",
                  MAIN_CATEGORY: "人口・世帯",
                  SUB_CATEGORY: "人口",
                  OVERALL_TOTAL_NUMBER: 1,
                  UPDATED_DATE: "2024-01-01",
                },
                {
                  "@id": "0000010102",
                  STAT_NAME: "人口推計",
                  TITLE: "市区町村別人口",
                  CYCLE: "年次",
                  SURVEY_DATE: "2023年",
                  GOV_ORG: "総務省",
                  STATISTICS_NAME: "人口推計",
                  TITLE_SPEC: "市区町村別人口",
                  CYCLE_SPEC: "年次",
                  SURVEY_DATE_SPEC: "2023年",
                  GOV_ORG_SPEC: "総務省",
                  COLLECT_AREA: "全国",
                  MAIN_CATEGORY: "人口・世帯",
                  SUB_CATEGORY: "人口",
                  OVERALL_TOTAL_NUMBER: 1,
                  UPDATED_DATE: "2024-01-01",
                },
              ],
            },
          },
        },
      };

      const result = EstatStatsListFormatter.formatStatsList(mockResponse);

      expect(result).toHaveProperty("statsList");
      expect(result).toHaveProperty("totalCount");
      expect(result.statsList).toHaveLength(2);
      expect(result.statsList[0]).toMatchObject({
        id: "0000010101",
        statName: "人口推計",
        title: "都道府県別人口",
        cycle: "年次",
        surveyDate: "2023年",
        govOrg: "総務省",
        collectArea: "全国",
        mainCategory: "人口・世帯",
        subCategory: "人口",
        updatedDate: "2024-01-01",
      });
    });

    it("空のデータを正しく処理できる", () => {
      const mockResponse: EstatStatsListResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 0,
            RESULT: { INF: [] },
          },
        },
      };

      const result = EstatStatsListFormatter.formatStatsList(mockResponse);

      expect(result.statsList).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe("formatStatsItem", () => {
    it("統計項目を正しく整形できる", () => {
      const rawItem = {
        "@id": "0000010101",
        STAT_NAME: "人口推計",
        TITLE: "都道府県別人口",
        CYCLE: "年次",
        SURVEY_DATE: "2023年",
        GOV_ORG: "総務省",
        STATISTICS_NAME: "人口推計",
        TITLE_SPEC: "都道府県別人口",
        CYCLE_SPEC: "年次",
        SURVEY_DATE_SPEC: "2023年",
        GOV_ORG_SPEC: "総務省",
        COLLECT_AREA: "全国",
        MAIN_CATEGORY: "人口・世帯",
        SUB_CATEGORY: "人口",
        OVERALL_TOTAL_NUMBER: 1,
        UPDATED_DATE: "2024-01-01",
      };

      const result = EstatStatsListFormatter.formatStatsItem(rawItem);

      expect(result).toMatchObject({
        id: "0000010101",
        statName: "人口推計",
        title: "都道府県別人口",
        cycle: "年次",
        surveyDate: "2023年",
        govOrg: "総務省",
        collectArea: "全国",
        mainCategory: "人口・世帯",
        subCategory: "人口",
        updatedDate: "2024-01-01",
      });
    });

    it("NULL値を正しく処理できる", () => {
      const rawItem = {
        "@id": "0000010101",
        STAT_NAME: "人口推計",
        TITLE: null,
        CYCLE: "年次",
        SURVEY_DATE: "2023年",
        GOV_ORG: "総務省",
        STATISTICS_NAME: "人口推計",
        TITLE_SPEC: null,
        CYCLE_SPEC: "年次",
        SURVEY_DATE_SPEC: "2023年",
        GOV_ORG_SPEC: "総務省",
        COLLECT_AREA: "全国",
        MAIN_CATEGORY: "人口・世帯",
        SUB_CATEGORY: "人口",
        OVERALL_TOTAL_NUMBER: 1,
        UPDATED_DATE: "2024-01-01",
      };

      const result = EstatStatsListFormatter.formatStatsItem(rawItem);

      expect(result.title).toBeNull();
    });
  });

  describe("filterByCategory", () => {
    it("カテゴリで正しくフィルタリングできる", () => {
      const statsList = [
        {
          id: "0000010101",
          statName: "人口推計",
          title: "都道府県別人口",
          cycle: "年次",
          surveyDate: "2023年",
          govOrg: "総務省",
          collectArea: "全国",
          mainCategory: "人口・世帯",
          subCategory: "人口",
          updatedDate: "2024-01-01",
        },
        {
          id: "0000010102",
          statName: "経済統計",
          title: "GDP統計",
          cycle: "年次",
          surveyDate: "2023年",
          govOrg: "内閣府",
          collectArea: "全国",
          mainCategory: "経済",
          subCategory: "GDP",
          updatedDate: "2024-01-01",
        },
      ];

      const result = EstatStatsListFormatter.filterByCategory(
        statsList,
        "人口・世帯"
      );

      expect(result).toHaveLength(1);
      expect(result[0].mainCategory).toBe("人口・世帯");
    });
  });

  describe("sortByDate", () => {
    it("日付で正しくソートできる", () => {
      const statsList = [
        {
          id: "0000010101",
          statName: "人口推計",
          title: "都道府県別人口",
          cycle: "年次",
          surveyDate: "2023年",
          govOrg: "総務省",
          collectArea: "全国",
          mainCategory: "人口・世帯",
          subCategory: "人口",
          updatedDate: "2024-01-01",
        },
        {
          id: "0000010102",
          statName: "経済統計",
          title: "GDP統計",
          cycle: "年次",
          surveyDate: "2023年",
          govOrg: "内閣府",
          collectArea: "全国",
          mainCategory: "経済",
          subCategory: "GDP",
          updatedDate: "2024-01-02",
        },
      ];

      const result = EstatStatsListFormatter.sortByDate(statsList, "DESC");

      expect(result[0].updatedDate).toBe("2024-01-02");
      expect(result[1].updatedDate).toBe("2024-01-01");
    });
  });
});
```

## 検索機能のテスト

### 1. 検索テスト

`src/infrastructure/estat-api/stats-list/__tests__/search.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { EstatStatsListService } from "../service";

describe("Stats List Search", () => {
  describe("searchWord", () => {
    it("検索語が正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 0,
            RESULT: { INF: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsListService.getStatsList({
        searchWord: "人口",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("searchWord=人口")
      );
    });
  });

  describe("surveyYears", () => {
    it("調査年が正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 0,
            RESULT: { INF: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsListService.getStatsList({
        surveyYears: "2023",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("surveyYears=2023")
      );
    });
  });

  describe("statsField", () => {
    it("統計分野が正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 0,
            RESULT: { INF: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsListService.getStatsList({
        statsField: "人口・世帯",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("statsField=人口・世帯")
      );
    });
  });

  describe("govOrg", () => {
    it("政府機関が正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 0,
            RESULT: { INF: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsListService.getStatsList({
        govOrg: "総務省",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("govOrg=総務省")
      );
    });
  });

  describe("pagination", () => {
    it("ページネーションが正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 0,
            RESULT: { INF: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsListService.getStatsList({
        startPosition: 21,
        limit: 20,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("startPosition=21&limit=20")
      );
    });
  });
});
```

## テストデータの管理

### 1. テストデータファクトリ

`src/infrastructure/estat-api/stats-list/__tests__/fixtures/index.ts`

```typescript
export const mockEstatStatsListResponse = {
  GET_STATS_LIST: {
    RESULT: {
      STATUS: 0,
      ERROR_MSG: null,
      DATE: "2024-01-01T00:00:00+09:00",
    },
    DATALIST_INF: {
      NUMBER: 2,
      RESULT: {
        INF: [
          {
            "@id": "0000010101",
            STAT_NAME: "人口推計",
            TITLE: "都道府県別人口",
            CYCLE: "年次",
            SURVEY_DATE: "2023年",
            GOV_ORG: "総務省",
            STATISTICS_NAME: "人口推計",
            TITLE_SPEC: "都道府県別人口",
            CYCLE_SPEC: "年次",
            SURVEY_DATE_SPEC: "2023年",
            GOV_ORG_SPEC: "総務省",
            COLLECT_AREA: "全国",
            MAIN_CATEGORY: "人口・世帯",
            SUB_CATEGORY: "人口",
            OVERALL_TOTAL_NUMBER: 1,
            UPDATED_DATE: "2024-01-01",
          },
          {
            "@id": "0000010102",
            STAT_NAME: "人口推計",
            TITLE: "市区町村別人口",
            CYCLE: "年次",
            SURVEY_DATE: "2023年",
            GOV_ORG: "総務省",
            STATISTICS_NAME: "人口推計",
            TITLE_SPEC: "市区町村別人口",
            CYCLE_SPEC: "年次",
            SURVEY_DATE_SPEC: "2023年",
            GOV_ORG_SPEC: "総務省",
            COLLECT_AREA: "全国",
            MAIN_CATEGORY: "人口・世帯",
            SUB_CATEGORY: "人口",
            OVERALL_TOTAL_NUMBER: 1,
            UPDATED_DATE: "2024-01-01",
          },
        ],
      },
    },
  },
};

export const mockFormattedStatsList = {
  statsList: [
    {
      id: "0000010101",
      statName: "人口推計",
      title: "都道府県別人口",
      cycle: "年次",
      surveyDate: "2023年",
      govOrg: "総務省",
      collectArea: "全国",
      mainCategory: "人口・世帯",
      subCategory: "人口",
      updatedDate: "2024-01-01",
    },
    {
      id: "0000010102",
      statName: "人口推計",
      title: "市区町村別人口",
      cycle: "年次",
      surveyDate: "2023年",
      govOrg: "総務省",
      collectArea: "全国",
      mainCategory: "人口・世帯",
      subCategory: "人口",
      updatedDate: "2024-01-01",
    },
  ],
  totalCount: 2,
};
```

## テスト実行

### 1. テストコマンド

```bash
# 全テスト実行
npm test

# 特定のファイルのテスト
npm test stats-list

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
- [stats-list 概要](04_ドメイン設計/e-Stat%20API/02_統計表リスト/overview.md)
- [stats-list 実装ガイド](../implementation/)
