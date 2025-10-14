# e-Stat API `GET_DATA_CATALOG` 完全ガイド

## 1. GET_DATA_CATALOG とは

### 概要

`GET_DATA_CATALOG`は、e-Stat で提供されている**全ての統計データファイル（Excel、PDF、CSV など）の一覧情報**を取得する API です。API で取得可能な統計表だけでなく、ダウンロード可能な全てのファイルの情報を検索できます。

### 主な用途

1. **ファイル形式での統計検索** - Excel、PDF、CSV ファイルの検索
2. **ダウンロードリンクの取得** - 統計ファイルの直接ダウンロード URL
3. **包括的な統計カタログ** - API 以外で提供される統計も含む
4. **更新情報の監視** - 新規追加・更新されたファイルの確認

### 他の API との違い

| API              | 対象           | 主な用途                   |
| ---------------- | -------------- | -------------------------- |
| GET_STATS_LIST   | API 統計表のみ | 統計表 ID の検索           |
| GET_DATA_CATALOG | 全ファイル     | Excel/PDF 等のダウンロード |

**重要**: GET_DATA_CATALOG は、API 経由でデータ取得できない統計ファイル（Excel や PDF）の情報も含まれます。

## 2. API の基本仕様

### エンドポイント

```
# XML形式
https://api.e-stat.go.jp/rest/2.1/app/getDataCatalog?<パラメータ>

# JSON形式（推奨）
https://api.e-stat.go.jp/rest/2.1/app/json/getDataCatalog?<パラメータ>
```

**注意**: データカタログ API はバージョン 2.0 で追加され、バージョン 3.0 では提供されていません。**バージョン 2.1 を使用**してください。

### HTTP メソッド

- **GET** のみ対応

### 必須パラメータ

- `appId`: アプリケーション ID（必須）

## 3. パラメータ詳細

### 3.1 基本パラメータ

| パラメータ名 | 必須 | 説明                                           | 例            |
| ------------ | ---- | ---------------------------------------------- | ------------- |
| `appId`      | ○    | アプリケーション ID                            | `YOUR_APP_ID` |
| `lang`       | -    | 言語設定<br>J: 日本語（デフォルト）<br>E: 英語 | `J`           |

### 3.2 検索条件パラメータ

| パラメータ名  | 説明                              | 例                          |
| ------------- | --------------------------------- | --------------------------- |
| `surveyYears` | 調査年月                          | `202001`<br>`202001-202312` |
| `openYears`   | 公開年月                          | `202001-202312`             |
| `statsField`  | 統計分野（2 桁）                  | `02`（人口・世帯）          |
| `statsCode`   | 政府統計コード（8 桁または 5 桁） | `00200522`（国勢調査）      |
| `searchWord`  | 検索キーワード                    | `人口`                      |
| `dataType`    | データ形式                        | `XLS`、`PDF`、`CSV`、`DB`   |
| `catalogId`   | カタログ ID                       | `000001012779`              |
| `resourceId`  | リソース ID                       | `RESOURCE001`               |
| `updatedDate` | 更新日付                          | `2024-01-01`                |

### 3.3 データ形式（dataType）

| 値    | 説明                       |
| ----- | -------------------------- |
| `XLS` | Excel 形式（.xls, .xlsx）  |
| `PDF` | PDF 形式                   |
| `CSV` | CSV 形式                   |
| `DB`  | データベース（API 統計表） |

### 3.4 ページング・取得件数制御

| パラメータ名    | デフォルト | 制限          |
| --------------- | ---------- | ------------- |
| `startPosition` | `1`        | 1 以上        |
| `limit`         | `100`      | 最大 1,000 件 |

## 4. レスポンスデータ構造

### 4.1 基本構造

```json
{
  "GET_DATA_CATALOG": {
    "RESULT": {
      "STATUS": 0,
      "ERROR_MSG": "正常に終了しました。",
      "DATE": "2024-01-15T10:30:00.000+09:00"
    },
    "PARAMETER": {
      "LANG": "J",
      "DATA_TYPE": "XLS",
      "DATA_FORMAT": "J",
      "LIMIT": 100
    },
    "DATA_CATALOG_LIST_INF": {
      "NUMBER": 452,
      "RESULT_INF": {
        "FROM_NUMBER": 1,
        "TO_NUMBER": 100,
        "NEXT_KEY": 101
      },
      "DATA_CATALOG_INF": [
        // カタログ情報の配列
      ]
    }
  }
}
```

### 4.2 DATA_CATALOG_INF（カタログ情報）

```json
{
  "@id": "000001012779",
  "STAT_NAME": {
    "@code": "00020111",
    "$": "民間企業の勤務条件制度等調査"
  },
  "GOV_ORG": {
    "@code": "00020",
    "$": "人事院"
  },
  "STATISTICS_NAME": "平成20年民間企業の勤務条件制度等調査",
  "TITLE": {
    "NO": "001",
    "$": "平成20年民間企業の勤務条件制度等調査_統計表_年次_2008年"
  },
  "SURVEY_DATE": "2008年",
  "OPEN_DATE": "2010-03-31",
  "SMALL_AREA": "0",
  "MAIN_CATEGORY": {
    "@code": "03",
    "$": "労働・賃金"
  },
  "SUB_CATEGORY": {
    "@code": "04",
    "$": "労働条件・労働福祉"
  },
  "OVERALL_TOTAL_NUMBER": "15",
  "UPDATED_DATE": "2014-05-16",
  "STATISTICS_NAME_SPEC": {
    "TABULATION_CATEGORY": "平成20年民間企業の勤務条件制度等調査",
    "TABULATION_SUB_CATEGORY1": "統計表"
  },
  "TITLE_SPEC": {
    "TABULATION_CATEGORY": "平成20年民間企業の勤務条件制度等調査",
    "TABULATION_SUB_CATEGORY1": "統計表",
    "TABLE_CATEGORY": "年次",
    "TABLE_NAME": "2008年"
  },
  "DATASET_LIST": {
    "DATASET_INF": [
      {
        "@id": "DATASET001",
        "DATASET_NAME": "統計表1",
        "DATASET_FORMAT": "XLS",
        "DATASET_SIZE": "152KB",
        "CYCLE": "年次",
        "SURVEY_DATE": "2008年",
        "CONTACT_POINT": "人事院 企画法制課",
        "CREATOR": "人事院",
        "PUBLISHER": "人事院",
        "LANDING_PAGE": "https://www.e-stat.go.jp/...",
        "ACCESS_URL": "https://www.e-stat.go.jp/.../download",
        "LICENSE": "クリエイティブ・コモンズの表示4.0"
      }
    ]
  }
}
```

#### 主要フィールド

| フィールド        | 説明             | 例                                       |
| ----------------- | ---------------- | ---------------------------------------- |
| `@id`             | カタログ ID      | `"000001012779"`                         |
| `STAT_NAME`       | 統計調査名       | `{"@code": "00200522", "$": "国勢調査"}` |
| `GOV_ORG`         | 作成機関         | `{"@code": "00200", "$": "総務省"}`      |
| `STATISTICS_NAME` | 統計名称         | `"令和2年国勢調査"`                      |
| `TITLE`           | タイトル         | ファイル名・表題                         |
| `SURVEY_DATE`     | 調査年月         | `"2020年"`                               |
| `OPEN_DATE`       | 公開日           | `"2021-11-30"`                           |
| `UPDATED_DATE`    | 更新日           | `"2023-12-01"`                           |
| `DATASET_LIST`    | データセット一覧 | ファイル情報の配列                       |

#### DATASET_INF の詳細

| フィールド       | 説明                         |
| ---------------- | ---------------------------- |
| `@id`            | データセット ID              |
| `DATASET_NAME`   | データセット名（ファイル名） |
| `DATASET_FORMAT` | ファイル形式（XLS/PDF/CSV）  |
| `DATASET_SIZE`   | ファイルサイズ               |
| `ACCESS_URL`     | ダウンロード URL（重要！）   |
| `LANDING_PAGE`   | 詳細ページ URL               |
| `LICENSE`        | ライセンス情報               |

## 5. TypeScript 型定義

```typescript
interface GetDataCatalogParams {
  appId: string;
  lang?: "J" | "E";
  surveyYears?: string;
  openYears?: string;
  statsField?: string;
  statsCode?: string;
  searchWord?: string;
  dataType?: "XLS" | "PDF" | "CSV" | "DB";
  catalogId?: string;
  resourceId?: string;
  updatedDate?: string;
  startPosition?: number;
  limit?: number;
}

interface DatasetInfo {
  "@id": string;
  DATASET_NAME: string;
  DATASET_FORMAT: string;
  DATASET_SIZE: string;
  CYCLE: string;
  SURVEY_DATE: string;
  CONTACT_POINT?: string;
  CREATOR: string;
  PUBLISHER: string;
  LANDING_PAGE: string;
  ACCESS_URL: string;
  LICENSE: string;
}

interface CatalogInfo {
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
    NO?: string;
    $: string;
  };
  SURVEY_DATE: string;
  OPEN_DATE: string;
  SMALL_AREA: string;
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
  DATASET_LIST?: {
    DATASET_INF: DatasetInfo[];
  };
}

interface GetDataCatalogResponse {
  GET_DATA_CATALOG: {
    RESULT: {
      STATUS: number;
      ERROR_MSG: string;
      DATE: string;
    };
    PARAMETER: Record<string, any>;
    DATA_CATALOG_LIST_INF: {
      NUMBER: number;
      RESULT_INF: {
        FROM_NUMBER: number;
        TO_NUMBER: number;
        NEXT_KEY?: number;
      };
      DATA_CATALOG_INF: CatalogInfo[];
    };
  };
}
```

## 6. 実装例

### 6.1 基本的なカタログ取得

```typescript
async function getDataCatalog(
  params: GetDataCatalogParams
): Promise<GetDataCatalogResponse> {
  const baseUrl = "https://api.e-stat.go.jp/rest/2.1/app/json/getDataCatalog";

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

    const data: GetDataCatalogResponse = await response.json();

    if (data.GET_DATA_CATALOG.RESULT.STATUS !== 0) {
      throw new Error(data.GET_DATA_CATALOG.RESULT.ERROR_MSG);
    }

    return data;
  } catch (error) {
    console.error("データカタログ取得エラー:", error);
    throw error;
  }
}

// 使用例: Excelファイルを検索
const excelFiles = await getDataCatalog({
  appId: "YOUR_APP_ID",
  dataType: "XLS",
  searchWord: "国勢調査",
  limit: 100,
});
```

### 6.2 Excel ファイルの一覧取得

```typescript
interface ExcelFileInfo {
  catalogId: string;
  statisticsName: string;
  title: string;
  fileName: string;
  fileSize: string;
  downloadUrl: string;
  surveyDate: string;
  updatedDate: string;
}

async function getExcelFiles(
  searchWord?: string,
  statsCode?: string
): Promise<ExcelFileInfo[]> {
  const response = await getDataCatalog({
    appId: "YOUR_APP_ID",
    dataType: "XLS",
    searchWord,
    statsCode,
    limit: 1000,
  });

  const catalogs =
    response.GET_DATA_CATALOG.DATA_CATALOG_LIST_INF.DATA_CATALOG_INF;
  const excelFiles: ExcelFileInfo[] = [];

  for (const catalog of catalogs) {
    if (!catalog.DATASET_LIST) continue;

    for (const dataset of catalog.DATASET_LIST.DATASET_INF) {
      if (
        dataset.DATASET_FORMAT === "XLS" ||
        dataset.DATASET_FORMAT === "XLSX"
      ) {
        excelFiles.push({
          catalogId: catalog["@id"],
          statisticsName: catalog.STATISTICS_NAME,
          title: catalog.TITLE.$,
          fileName: dataset.DATASET_NAME,
          fileSize: dataset.DATASET_SIZE,
          downloadUrl: dataset.ACCESS_URL,
          surveyDate: catalog.SURVEY_DATE,
          updatedDate: catalog.UPDATED_DATE,
        });
      }
    }
  }

  return excelFiles;
}

// 使用例
const files = await getExcelFiles("人口", "00200522");
console.log(files);
```

### 6.3 更新されたファイルの検索

```typescript
async function getUpdatedFiles(
  since: string, // YYYY-MM-DD
  dataType?: "XLS" | "PDF" | "CSV"
): Promise<CatalogInfo[]> {
  const response = await getDataCatalog({
    appId: "YOUR_APP_ID",
    updatedDate: since,
    dataType,
    limit: 1000,
  });

  return response.GET_DATA_CATALOG.DATA_CATALOG_LIST_INF.DATA_CATALOG_INF;
}

// 使用例: 2024年1月以降に更新されたExcelファイル
const updated = await getUpdatedFiles("2024-01-01", "XLS");
console.log(`${updated.length}件の更新ファイル`);
```

### 6.4 ファイルのダウンロード

```typescript
async function downloadFile(
  accessUrl: string,
  fileName: string
): Promise<void> {
  try {
    const response = await fetch(accessUrl);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();

    // ブラウザでダウンロード
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("ダウンロードエラー:", error);
    throw error;
  }
}

// 使用例
const files = await getExcelFiles("国勢調査");
if (files.length > 0) {
  await downloadFile(files[0].downloadUrl, files[0].fileName);
}
```

### 6.5 ページング処理

```typescript
async function getAllCatalogs(
  params: GetDataCatalogParams,
  maxResults: number = 10000
): Promise<CatalogInfo[]> {
  const allCatalogs: CatalogInfo[] = [];
  let startPosition = 1;
  const limit = 1000; // 最大取得件数

  while (allCatalogs.length < maxResults) {
    const response = await getDataCatalog({
      ...params,
      startPosition,
      limit,
    });

    const catalog = response.GET_DATA_CATALOG.DATA_CATALOG_LIST_INF;
    allCatalogs.push(...catalog.DATA_CATALOG_INF);

    // 次のページがない場合は終了
    if (!catalog.RESULT_INF.NEXT_KEY || allCatalogs.length >= catalog.NUMBER) {
      break;
    }

    startPosition = catalog.RESULT_INF.NEXT_KEY;

    // API制限を考慮
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return allCatalogs.slice(0, maxResults);
}
```

## 7. 実践的な活用例

### 7.1 統計ファイル検索システム

```typescript
class DataCatalogManager {
  constructor(private appId: string) {}

  /**
   * ファイル形式別の検索
   */
  async searchByFileType(
    fileType: "XLS" | "PDF" | "CSV",
    searchWord?: string
  ): Promise<ExcelFileInfo[]> {
    const response = await getDataCatalog({
      appId: this.appId,
      dataType: fileType,
      searchWord,
      limit: 1000,
    });

    return this.extractFileInfo(response);
  }

  /**
   * 統計分野別の検索
   */
  async searchByField(
    statsField: string,
    dataType?: string
  ): Promise<ExcelFileInfo[]> {
    const response = await getDataCatalog({
      appId: this.appId,
      statsField,
      dataType,
      limit: 1000,
    });

    return this.extractFileInfo(response);
  }

  /**
   * 最新ファイルの取得
   */
  async getLatestFiles(
    days: number = 30,
    dataType?: string
  ): Promise<ExcelFileInfo[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];

    const response = await getDataCatalog({
      appId: this.appId,
      updatedDate: sinceStr,
      dataType,
      limit: 1000,
    });

    return this.extractFileInfo(response);
  }

  /**
   * ファイル情報の抽出
   */
  private extractFileInfo(response: GetDataCatalogResponse): ExcelFileInfo[] {
    const catalogs =
      response.GET_DATA_CATALOG.DATA_CATALOG_LIST_INF.DATA_CATALOG_INF;
    const files: ExcelFileInfo[] = [];

    for (const catalog of catalogs) {
      if (!catalog.DATASET_LIST) continue;

      for (const dataset of catalog.DATASET_LIST.DATASET_INF) {
        files.push({
          catalogId: catalog["@id"],
          statisticsName: catalog.STATISTICS_NAME,
          title: catalog.TITLE.$,
          fileName: dataset.DATASET_NAME,
          fileSize: dataset.DATASET_SIZE,
          downloadUrl: dataset.ACCESS_URL,
          surveyDate: catalog.SURVEY_DATE,
          updatedDate: catalog.UPDATED_DATE,
        });
      }
    }

    return files;
  }
}

// 使用例
const manager = new DataCatalogManager("YOUR_APP_ID");

// 人口分野のExcelファイル
const populationFiles = await manager.searchByField("02", "XLS");

// 最近30日間の更新ファイル
const recentFiles = await manager.getLatestFiles(30);
```

### 7.2 ファイルダウンロードシステム

```typescript
interface DownloadTask {
  id: string;
  fileName: string;
  url: string;
  status: "pending" | "downloading" | "completed" | "failed";
  progress: number;
}

class FileDownloader {
  private tasks: Map<string, DownloadTask> = new Map();

  async addDownload(
    catalogId: string,
    fileName: string,
    url: string
  ): Promise<string> {
    const taskId = `${catalogId}-${Date.now()}`;

    this.tasks.set(taskId, {
      id: taskId,
      fileName,
      url,
      status: "pending",
      progress: 0,
    });

    this.startDownload(taskId);
    return taskId;
  }

  private async startDownload(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      task.status = "downloading";

      const response = await fetch(task.url);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();

      // ファイル保存（ブラウザ）
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = task.fileName;
      a.click();
      window.URL.revokeObjectURL(url);

      task.status = "completed";
      task.progress = 100;
    } catch (error) {
      task.status = "failed";
      console.error("Download error:", error);
    }
  }

  getTaskStatus(taskId: string): DownloadTask | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): DownloadTask[] {
    return Array.from(this.tasks.values());
  }
}
```

## 8. Next.js での実装例

### 8.1 API Route

```typescript
// app/api/data-catalog/route.ts
import { NextRequest, NextResponse } from "next/server";

const manager = new DataCatalogManager(process.env.ESTAT_APP_ID!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "XLS" | "PDF" | "CSV" | null;
    const search = searchParams.get("search");
    const field = searchParams.get("field");
    const days = searchParams.get("days");

    if (days) {
      const files = await manager.getLatestFiles(
        parseInt(days),
        type || undefined
      );
      return NextResponse.json(files);
    }

    if (field) {
      const files = await manager.searchByField(field, type || undefined);
      return NextResponse.json(files);
    }

    if (type) {
      const files = await manager.searchByFileType(type, search || undefined);
      return NextResponse.json(files);
    }

    return NextResponse.json(
      { error: "パラメータが不正です" },
      { status: 400 }
    );
  } catch (error) {
    console.error("データカタログ取得エラー:", error);
    return NextResponse.json(
      { error: "データカタログの取得に失敗しました" },
      { status: 500 }
    );
  }
}
```

### 8.2 React コンポーネント

```typescript
// components/FileCatalog.tsx
"use client";

import { useState, useEffect } from "react";

export function FileCatalog() {
  const [files, setFiles] = useState<ExcelFileInfo[]>([]);
  const [fileType, setFileType] = useState<"XLS" | "PDF" | "CSV">("XLS");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: fileType,
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/data-catalog?${params}`);
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error("検索エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <select
          value={fileType}
          onChange={(e) => setFileType(e.target.value as any)}
          className="px-4 py-2 border rounded"
        >
          <option value="XLS">Excel</option>
          <option value="PDF">PDF</option>
          <option value="CSV">CSV</option>
        </select>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="検索キーワード"
          className="flex-1 px-4 py-2 border rounded"
        />

        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? "検索中..." : "検索"}
        </button>
      </div>

      <div className="space-y-2">
        {files.map((file, index) => (
          <div key={index} className="p-4 border rounded hover:bg-gray-50">
            <h3 className="font-semibold">{file.title}</h3>
            <p className="text-sm text-gray-600">{file.statisticsName}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {file.fileSize} | {file.surveyDate}
              </span>
              <a
                href={file.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                ダウンロード
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 9. ベストプラクティス

### ✅ 推奨事項

1. **ファイル形式を明示** - dataType を指定して絞り込み
2. **ページング処理** - 大量データは分割取得
3. **更新監視** - updatedDate で新規ファイルをチェック
4. **ダウンロード URL 保存** - ACCESS_URL をキャッシュ
5. **エラーハンドリング** - ダウンロード失敗に備える

### ❌ 避けるべき事項

1. **無制限の取得** - limit 指定を怠らない
2. **頻繁なリクエスト** - キャッシング活用
3. **バージョン 3.0 の使用** - バージョン 2.1 を使用

## 10. まとめ

### GET_DATA_CATALOG の特徴

1. **全ファイル対応** - API 以外の Excel/PDF も検索可能
2. **ダウンロードリンク** - 直接ダウンロード URL を取得
3. **更新監視** - 新規・更新ファイルの追跡
4. **包括的カタログ** - e-Stat 全体のインデックス

### 主な用途

- **Excel 統計表のダウンロード**
- **PDF 報告書の検索**
- **統計ファイルの一覧化**
- **更新情報の監視**

### 注意点

- **バージョン 2.1 を使用**（3.0 では提供なし）
- API 統計表とファイルの両方が混在
- ダウンロードには別途 HTTP リクエストが必要

この API を活用して、e-Stat の全統計ファイルを効率的に管理しましょう！
