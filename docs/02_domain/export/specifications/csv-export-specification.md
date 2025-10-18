# CSV エクスポート機能 詳細仕様書

**作成日**: 2025-10-16  
**ドメイン**: export  
**バージョン**: 1.0.0

## 目次

1. [概要](#概要)
2. [要件定義](#要件定義)
3. [アーキテクチャ設計](#アーキテクチャ設計)
4. [データフロー](#データフロー)
5. [技術仕様](#技術仕様)
6. [API 仕様](#api仕様)
7. [型定義](#型定義)
8. [実装詳細](#実装詳細)
9. [パフォーマンス要件](#パフォーマンス要件)
10. [セキュリティ考慮事項](#セキュリティ考慮事項)
11. [テスト戦略](#テスト戦略)

---

## 概要

### 目的

可視化コンポーネント（コロプレス地図、チャート、データテーブル）に表示されているデータを CSV 形式でエクスポートし、ユーザーがローカル環境で二次利用できるようにする。

### スコープ

**対象コンポーネント**:

- `ChoroplethMap` - コロプレス地図
- `PrefectureDataTableClient` - 都道府県データテーブル
- `EstatLineChart` - 折れ線グラフ
- `EstatMultiLineChart` - 複数系列折れ線グラフ
- `EstatStackedBarChart` - 積み上げ棒グラフ
- `StatisticsSummary` - 統計サマリー

**エクスポート内容**:

- 画面に表示されているデータ（フィルタ・ソート適用後）
- ヘッダー情報（列名）
- メタデータ（単位、年度等）

**対応フォーマット**:

- Phase 1: CSV（カンマ区切り）
- Phase 2 以降（将来拡張）: JSON, Excel (xlsx)

---

## 要件定義

### 機能要件

#### FR-1: クライアントサイド CSV 生成

- **優先度**: 高
- **説明**: 10,000 行未満のデータをブラウザ上で即座に CSV 変換
- **受入基準**:
  - データ変換から 0.5 秒以内にダウンロード開始
  - メモリ使用量が 100MB 以下
  - BOM 付き UTF-8 エンコーディング

#### FR-2: サーバーサイド CSV 生成

- **優先度**: 中
- **説明**: 10,000 行以上の大容量データをサーバーで処理
- **受入基準**:
  - タイムアウトなく 50,000 行まで対応
  - ストリーミング処理による省メモリ化
  - 進捗表示 UI

#### FR-3: データサイズ自動判定

- **優先度**: 高
- **説明**: データ行数に応じて処理方法を自動切替
- **受入基準**:
  - 閾値: 10,000 行
  - ユーザー操作不要で自動判定
  - 判定ロジックのオーバーヘッド < 10ms

#### FR-4: ファイル名自動生成

- **優先度**: 中
- **説明**: コンテキストに応じた意味のあるファイル名を生成
- **受入基準**:
  - フォーマット: `{データ種別}-{年度}-{タイムスタンプ}.csv`
  - 例: `prefecture-ranking-2023-20251016143025.csv`
  - 特殊文字の自動エスケープ

#### FR-5: エラーハンドリング

- **優先度**: 高
- **説明**: エクスポート失敗時の適切なフィードバック
- **受入基準**:
  - エラーメッセージのトースト表示
  - リトライ機能
  - エラーログの記録

### 非機能要件

#### NFR-1: パフォーマンス

- クライアント処理: 10,000 行を 1 秒以内
- サーバー処理: 50,000 行を 5 秒以内
- UI 応答性: ボタンクリックから 100ms 以内にローディング表示

#### NFR-2: ユーザビリティ

- ワンクリックでダウンロード開始
- Excel、Google Sheets で正常に開けること
- 日本語文字化けなし

#### NFR-3: 保守性

- コンポーネントから独立したロジック
- 型安全な実装
- 単体テストカバレッジ > 80%

---

## アーキテクチャ設計

### ドメイン構造

```
src/lib/export/                    # エクスポートドメイン（コアロジック）
  ├── csv/
  │   ├── generator.ts              # CSVフォーマット生成
  │   ├── formatter.ts              # データフォーマッティング
  │   ├── validator.ts              # データ検証
  │   └── config.ts                 # CSV設定
  ├── types.ts                      # 型定義
  └── utils.ts                      # ユーティリティ

src/hooks/export/                  # Reactフック
  ├── useCSVExport.ts               # CSV生成・ダウンロード
  └── useExportProgress.ts          # 進捗管理（大容量対応）

src/app/api/export/                # サーバーサイドAPI
  └── csv/route.ts                  # CSV生成エンドポイント

src/components/export/             # UIコンポーネント
  ├── ExportButton.tsx              # エクスポートボタン
  ├── ExportMenu.tsx                # フォーマット選択メニュー（将来）
  └── ExportProgress.tsx            # 進捗表示（大容量対応）
```

### レイヤーアーキテクチャ

```
┌─────────────────────────────────────────┐
│  UI Layer (React Components)            │
│  - ExportButton                          │
│  - PrefectureDataTableClient            │
│  - ChoroplethMap                         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Hook Layer (Custom Hooks)               │
│  - useCSVExport                          │
│  - useExportProgress                     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Logic Layer (Pure Functions)            │
│  - generateCSV                           │
│  - formatData                            │
│  - validateData                          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Browser API / Server API                │
│  - Blob API                              │
│  - Next.js API Routes                    │
└─────────────────────────────────────────┘
```

---

## データフロー

### クライアントサイド処理（< 10,000 行）

```
┌─────────────┐
│ User Click  │
│ Export BTN  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ useCSVExport Hook   │
│ - データサイズ判定   │
│ - < 10,000行        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ generateCSV()       │
│ - ヘッダー生成      │
│ - データ行変換      │
│ - CSV文字列化       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ downloadCSV()       │
│ - BOM追加           │
│ - Blob生成          │
│ - ダウンロード実行  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ ファイル保存完了    │
└─────────────────────┘
```

### サーバーサイド処理（≥ 10,000 行）

```
┌─────────────┐
│ User Click  │
│ Export BTN  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ useCSVExport Hook   │
│ - データサイズ判定   │
│ - ≥ 10,000行        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ POST /api/export/csv│
│ - データ送信        │
│ - 進捗監視開始      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Server Processing   │
│ - ストリーム処理    │
│ - CSV生成           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Response (Blob)     │
│ - ダウンロード実行  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ ファイル保存完了    │
└─────────────────────┘
```

---

## 技術仕様

### CSV フォーマット仕様

#### エンコーディング

- **文字コード**: UTF-8 with BOM
- **BOM**: `\uFEFF` (U+FEFF)
- **理由**: Excel、Google Sheets での文字化け防止

#### 区切り文字

- **フィールド区切り**: カンマ (`,`)
- **改行コード**: LF (`\n`)
- **クォート**: ダブルクォート (`"`) - フィールドにカンマ・改行含む場合

#### ヘッダー行

**都道府県ランキングデータ**:

```csv
順位,都道府県コード,都道府県名,値,単位,年度,時点コード
1,13,東京都,14094034,人,2020年,2020000000
```

**時系列データ**:

```csv
年度,時点コード,値,単位,地域名,地域コード
2020年,2020000000,14094034,人,東京都,13
```

**複数系列データ**:

```csv
年度,時点コード,男性,女性,総数,単位
2020年,2020000000,6892737,7201297,14094034,人
```

### データ型マッピング

| TypeScript 型 | CSV 出力               | 例           |
| ------------- | ---------------------- | ------------ |
| `number`      | そのまま               | `14094034`   |
| `string`      | クォート付き（必要時） | `"東京都"`   |
| `null`        | 空文字                 | ``           |
| `undefined`   | `-`                    | `-`          |
| `Date`        | ISO 8601 形式          | `2023-01-15` |

### ファイル名規則

```typescript
// 形式
{dataType}-{year}-{timestamp}.csv

// 例
prefecture-ranking-2023-20251016143025.csv
time-series-all-20251016143030.csv
multi-series-tokyo-20251016143035.csv

// 構成要素
dataType: string      // データ種別（prefecture-ranking, time-series等）
year: string         // 年度（該当する場合）
timestamp: string    // YYYYMMDDHHmmss形式
```

---

## API 仕様

### POST /api/export/csv

大容量データの CSV 生成エンドポイント

#### リクエスト

```typescript
POST /api/export/csv
Content-Type: application/json

{
  "data": FormattedValue[],
  "options": {
    "filename": string,
    "headers": string[],
    "includeMetadata": boolean
  }
}
```

#### レスポンス（成功）

```typescript
Status: 200 OK
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="prefecture-ranking-2023.csv"

// CSV content
```

#### レスポンス（エラー）

```typescript
Status: 400 Bad Request / 500 Internal Server Error
Content-Type: application/json

{
  "error": string,
  "message": string,
  "details": any
}
```

#### エラーコード

| コード             | 説明                 | 対処方法                 |
| ------------------ | -------------------- | ------------------------ |
| `INVALID_DATA`     | データ形式が不正     | データ形式を確認         |
| `DATA_TOO_LARGE`   | データサイズ上限超過 | フィルタリングして再試行 |
| `PROCESSING_ERROR` | サーバー処理エラー   | 時間をおいて再試行       |

---

## 型定義

### src/lib/export/types.ts

```typescript
/**
 * エクスポートフォーマット
 */
export type ExportFormat = "csv" | "json" | "xlsx";

/**
 * CSVエクスポートオプション
 */
export interface CSVExportOptions {
  /** ファイル名（拡張子なし） */
  filename: string;

  /** カスタムヘッダー（省略時は自動生成） */
  headers?: string[];

  /** BOM追加（デフォルト: true） */
  includeBOM?: boolean;

  /** フィールド区切り文字（デフォルト: "," ） */
  delimiter?: string;

  /** 改行コード（デフォルト: "\n" ） */
  lineBreak?: "\n" | "\r\n";

  /** メタデータ行追加（データ説明等） */
  includeMetadata?: boolean;
}

/**
 * エクスポート結果
 */
export interface ExportResult {
  /** 成功フラグ */
  success: boolean;

  /** ファイル名 */
  filename: string;

  /** ファイルサイズ（バイト） */
  fileSize: number;

  /** 行数 */
  rowCount: number;

  /** 処理時間（ミリ秒） */
  processingTime: number;

  /** エラー情報（失敗時） */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * エクスポート可能なデータ型
 */
export type ExportableData =
  | FormattedValue[]
  | TimeSeriesDataPoint[]
  | MultiSeriesDataPoint[]
  | RankingData[];

/**
 * データ変換関数の型
 */
export type DataFormatter<T = any> = (
  data: T,
  options?: CSVExportOptions
) => string[][];

/**
 * エクスポート進捗状態
 */
export interface ExportProgress {
  /** 処理中フラグ */
  isExporting: boolean;

  /** 進捗率（0-100） */
  progress: number;

  /** 現在の処理行 */
  currentRow: number;

  /** 総行数 */
  totalRows: number;

  /** ステージ */
  stage: "preparing" | "generating" | "downloading" | "complete" | "error";

  /** エラー情報 */
  error?: string;
}
```

---

## 実装詳細

### 1. CSV 生成ライブラリ (src/lib/export/csv/generator.ts)

```typescript
import { FormattedValue } from "@/lib/estat-api";
import { CSVExportOptions, ExportResult } from "../types";

const DEFAULT_OPTIONS: Required<CSVExportOptions> = {
  filename: "export",
  headers: [],
  includeBOM: true,
  delimiter: ",",
  lineBreak: "\n",
  includeMetadata: false,
};

/**
 * FormattedValueデータをCSV文字列に変換
 *
 * @param data - エクスポート対象データ
 * @param options - エクスポートオプション
 * @returns CSV文字列
 */
export function generateCSV(
  data: FormattedValue[],
  options?: Partial<CSVExportOptions>
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // データ検証
  if (!data || data.length === 0) {
    throw new Error("Export data is empty");
  }

  // ヘッダー生成
  const headers =
    opts.headers.length > 0 ? opts.headers : generateHeaders(data[0]);

  // データ行生成
  const rows = data.map((item) => formatDataRow(item, opts));

  // CSV文字列化
  const csvContent = [
    headers.join(opts.delimiter),
    ...rows.map((row) => row.join(opts.delimiter)),
  ].join(opts.lineBreak);

  return csvContent;
}

/**
 * ヘッダー自動生成
 */
function generateHeaders(sampleData: FormattedValue): string[] {
  return [
    "順位",
    "都道府県コード",
    "都道府県名",
    "値",
    "単位",
    "年度",
    "時点コード",
  ];
}

/**
 * データ行のフォーマット
 */
function formatDataRow(
  item: FormattedValue,
  options: Required<CSVExportOptions>
): string[] {
  return [
    formatField(item.rank),
    formatField(item.areaCode),
    formatField(item.areaName),
    formatField(item.value),
    formatField(item.unit),
    formatField(item.timeName),
    formatField(item.timeCode),
  ];
}

/**
 * フィールド値のフォーマット
 * - カンマ・改行を含む場合はクォート
 * - null/undefinedの処理
 */
function formatField(value: any): string {
  if (value === null || value === undefined) {
    return "-";
  }

  const strValue = String(value);

  // カンマ・改行・ダブルクォートを含む場合はクォート
  if (
    strValue.includes(",") ||
    strValue.includes("\n") ||
    strValue.includes('"')
  ) {
    // ダブルクォートをエスケープ
    const escaped = strValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return strValue;
}

/**
 * CSV文字列をBlobに変換してダウンロード
 *
 * @param csvContent - CSV文字列
 * @param filename - ファイル名（拡張子なし）
 * @returns ExportResult
 */
export function downloadCSV(
  csvContent: string,
  filename: string
): ExportResult {
  const startTime = performance.now();

  try {
    // BOM付きUTF-8エンコード
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // ダウンロード実行
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${filename}.csv`;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // メモリ解放
    setTimeout(() => URL.revokeObjectURL(url), 100);

    const processingTime = performance.now() - startTime;
    const rowCount = csvContent.split("\n").length - 1; // ヘッダー除く

    return {
      success: true,
      filename: `${filename}.csv`,
      fileSize: blob.size,
      rowCount,
      processingTime,
    };
  } catch (error) {
    const processingTime = performance.now() - startTime;

    return {
      success: false,
      filename: `${filename}.csv`,
      fileSize: 0,
      rowCount: 0,
      processingTime,
      error: {
        code: "DOWNLOAD_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
    };
  }
}

/**
 * ファイル名生成ユーティリティ
 *
 * @param dataType - データ種別
 * @param metadata - メタデータ（年度等）
 * @returns ファイル名
 */
export function generateFilename(
  dataType: string,
  metadata?: {
    year?: string;
    areaName?: string;
  }
): string {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14); // YYYYMMDDHHmmss

  const parts = [dataType];

  if (metadata?.year) {
    parts.push(metadata.year);
  }

  if (metadata?.areaName) {
    // 特殊文字を除去
    const sanitized = metadata.areaName.replace(
      /[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g,
      ""
    );
    parts.push(sanitized);
  }

  parts.push(timestamp);

  return parts.join("-");
}
```

### 2. データフォーマッター (src/lib/export/csv/formatter.ts)

```typescript
import { FormattedValue } from "@/lib/estat-api";
import { TimeSeriesDataPoint } from "@/components/d3/LineChart";

/**
 * FormattedValueデータのフォーマッター
 */
export class FormattedValueCSVFormatter {
  static getHeaders(): string[] {
    return [
      "順位",
      "都道府県コード",
      "都道府県名",
      "値",
      "単位",
      "年度",
      "時点コード",
    ];
  }

  static formatRow(item: FormattedValue): (string | number)[] {
    return [
      item.rank ?? "-",
      item.areaCode,
      item.areaName,
      item.value ?? "-",
      item.unit ?? "-",
      item.timeName ?? "-",
      item.timeCode ?? "-",
    ];
  }
}

/**
 * 時系列データのフォーマッター
 */
export class TimeSeriesCSVFormatter {
  static getHeaders(): string[] {
    return ["年度", "時点コード", "値", "単位", "地域名", "地域コード"];
  }

  static formatRow(item: TimeSeriesDataPoint): (string | number)[] {
    return [
      item.date,
      item.timeCode ?? "-",
      item.value,
      item.unit ?? "-",
      item.areaName ?? "-",
      item.areaCode ?? "-",
    ];
  }
}

/**
 * 複数系列データのフォーマッター
 */
export class MultiSeriesCSVFormatter {
  static getHeaders(keys: string[]): string[] {
    return ["年度", "時点コード", ...keys, "単位"];
  }

  static formatRow(
    item: Record<string, any>,
    keys: string[]
  ): (string | number)[] {
    return [
      item.time,
      item.timeCode ?? "-",
      ...keys.map((key) => item[key] ?? "-"),
      item.unit ?? "-",
    ];
  }
}
```

### 3. useCSVExport フック (src/hooks/export/useCSVExport.ts)

```typescript
import { useState, useCallback } from "react";
import {
  generateCSV,
  downloadCSV,
  generateFilename,
} from "@/lib/export/csv/generator";
import { FormattedValue } from "@/lib/estat-api";
import {
  CSVExportOptions,
  ExportResult,
  ExportProgress,
} from "@/lib/export/types";

const DATA_SIZE_THRESHOLD = 10000; // クライアント/サーバー切替閾値

interface UseCSVExportOptions {
  /** 自動ファイル名生成オプション */
  dataType?: string;
  metadata?: {
    year?: string;
    areaName?: string;
  };
}

/**
 * CSVエクスポート機能を提供するカスタムフック
 *
 * @param options - フックオプション
 * @returns エクスポート関数と状態
 */
export function useCSVExport(options?: UseCSVExportOptions) {
  const [progress, setProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0,
    currentRow: 0,
    totalRows: 0,
    stage: "complete",
  });

  const [lastResult, setLastResult] = useState<ExportResult | null>(null);

  /**
   * CSVエクスポート実行
   */
  const exportToCSV = useCallback(
    async (
      data: FormattedValue[],
      exportOptions?: Partial<CSVExportOptions>
    ): Promise<ExportResult> => {
      setProgress({
        isExporting: true,
        progress: 0,
        currentRow: 0,
        totalRows: data.length,
        stage: "preparing",
      });

      try {
        // ファイル名生成
        const filename =
          exportOptions?.filename ||
          generateFilename(options?.dataType || "export", options?.metadata);

        let result: ExportResult;

        // データサイズ判定
        if (data.length < DATA_SIZE_THRESHOLD) {
          // クライアントサイド処理
          result = await exportClientSide(data, { ...exportOptions, filename });
        } else {
          // サーバーサイド処理
          result = await exportServerSide(data, { ...exportOptions, filename });
        }

        setLastResult(result);

        setProgress({
          isExporting: false,
          progress: 100,
          currentRow: data.length,
          totalRows: data.length,
          stage: "complete",
        });

        return result;
      } catch (error) {
        const errorResult: ExportResult = {
          success: false,
          filename: "",
          fileSize: 0,
          rowCount: 0,
          processingTime: 0,
          error: {
            code: "EXPORT_ERROR",
            message: error instanceof Error ? error.message : "Unknown error",
            details: error,
          },
        };

        setLastResult(errorResult);

        setProgress({
          isExporting: false,
          progress: 0,
          currentRow: 0,
          totalRows: data.length,
          stage: "error",
          error: errorResult.error?.message,
        });

        return errorResult;
      }
    },
    [options]
  );

  /**
   * クライアントサイド処理
   */
  const exportClientSide = async (
    data: FormattedValue[],
    options: Partial<CSVExportOptions> & { filename: string }
  ): Promise<ExportResult> => {
    setProgress((prev) => ({ ...prev, stage: "generating" }));

    // CSV生成
    const csvContent = generateCSV(data, options);

    setProgress((prev) => ({ ...prev, stage: "downloading", progress: 50 }));

    // ダウンロード
    const result = downloadCSV(csvContent, options.filename);

    return result;
  };

  /**
   * サーバーサイド処理
   */
  const exportServerSide = async (
    data: FormattedValue[],
    options: Partial<CSVExportOptions> & { filename: string }
  ): Promise<ExportResult> => {
    setProgress((prev) => ({ ...prev, stage: "generating" }));

    const startTime = performance.now();

    // APIリクエスト
    const response = await fetch("/api/export/csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, options }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Server export failed");
    }

    setProgress((prev) => ({ ...prev, stage: "downloading", progress: 70 }));

    // Blobダウンロード
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${options.filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    const processingTime = performance.now() - startTime;

    return {
      success: true,
      filename: `${options.filename}.csv`,
      fileSize: blob.size,
      rowCount: data.length,
      processingTime,
    };
  };

  return {
    exportToCSV,
    progress,
    isExporting: progress.isExporting,
    lastResult,
  };
}
```

### 4. ExportButton コンポーネント (src/components/export/ExportButton.tsx)

````typescript
"use client";

import React from "react";
import { Download, Loader2 } from "lucide-react";
import { useCSVExport } from "@/hooks/export/useCSVExport";
import { FormattedValue } from "@/lib/estat-api";
import { CSVExportOptions } from "@/lib/export/types";

interface ExportButtonProps {
  /** エクスポート対象データ */
  data: FormattedValue[];

  /** ファイル名（拡張子なし） */
  filename?: string;

  /** データ種別（自動ファイル名生成用） */
  dataType?: string;

  /** メタデータ（自動ファイル名生成用） */
  metadata?: {
    year?: string;
    areaName?: string;
  };

  /** CSVエクスポートオプション */
  csvOptions?: Partial<CSVExportOptions>;

  /** 追加CSSクラス */
  className?: string;

  /** ボタンテキスト */
  label?: string;

  /** アイコンサイズ */
  iconSize?: number;

  /** エクスポート完了時のコールバック */
  onExportComplete?: (success: boolean) => void;
}

/**
 * CSVエクスポートボタンコンポーネント
 *
 * 使用例:
 * ```tsx
 * <ExportButton
 *   data={formattedData}
 *   dataType="prefecture-ranking"
 *   metadata={{ year: "2023" }}
 * />
 * ```
 */
export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename,
  dataType,
  metadata,
  csvOptions,
  className = "",
  label = "CSVダウンロード",
  iconSize = 16,
  onExportComplete,
}) => {
  const { exportToCSV, isExporting } = useCSVExport({ dataType, metadata });

  const handleClick = async () => {
    const result = await exportToCSV(data, { ...csvOptions, filename });

    if (onExportComplete) {
      onExportComplete(result.success);
    }

    // 成功・失敗のトースト表示（実装はプロジェクトのトーストライブラリに依存）
    if (result.success) {
      console.log(
        `✓ ${result.filename} (${result.rowCount}行) をダウンロードしました`
      );
    } else {
      console.error(`✗ エクスポート失敗: ${result.error?.message}`);
    }
  };

  const isDisabled = isExporting || !data || data.length === 0;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        flex items-center gap-2 px-3 py-1.5
        text-sm font-medium
        bg-white dark:bg-neutral-800
        border border-gray-300 dark:border-neutral-600
        rounded-md
        hover:bg-gray-50 dark:hover:bg-neutral-700
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
        ${className}
      `}
      title={isDisabled && data?.length === 0 ? "データがありません" : label}
    >
      {isExporting ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : (
        <Download size={iconSize} />
      )}
      <span>{label}</span>
      {data && data.length > 0 && (
        <span className="text-xs text-gray-500 dark:text-neutral-400">
          ({data.length}行)
        </span>
      )}
    </button>
  );
};
````

---

## パフォーマンス要件

### ベンチマーク目標

| データサイズ | 処理方法     | 目標時間 | メモリ使用量 |
| ------------ | ------------ | -------- | ------------ |
| 100 行       | クライアント | < 100ms  | < 1MB        |
| 1,000 行     | クライアント | < 300ms  | < 5MB        |
| 10,000 行    | クライアント | < 1s     | < 50MB       |
| 50,000 行    | サーバー     | < 5s     | < 200MB      |

### 最適化戦略

1. **文字列結合の最適化**

   - Array.join() を使用（+演算子より高速）
   - テンプレートリテラル避ける（大量データ時）

2. **メモリ管理**

   - ストリーミング処理（サーバーサイド）
   - 不要なオブジェクト参照の解放
   - Blob URL の即座な revoke

3. **並列処理**
   - Web Workers 活用（将来）
   - チャンク分割処理

---

## セキュリティ考慮事項

### データ検証

```typescript
/**
 * エクスポートデータの検証
 */
function validateExportData(data: any[]): void {
  // サイズ制限
  if (data.length > 100000) {
    throw new Error("Data size exceeds maximum limit (100,000 rows)");
  }

  // データ型チェック
  if (!Array.isArray(data)) {
    throw new Error("Data must be an array");
  }

  // 個人情報スキャン（オプション）
  const hasSensitiveData = data.some((item) => containsSensitiveInfo(item));

  if (hasSensitiveData) {
    console.warn("Warning: Data may contain sensitive information");
  }
}
```

### XSS 対策

- CSV インジェクション防止
- 数式開始文字のエスケープ (`=`, `+`, `-`, `@`)

```typescript
function sanitizeCSVField(value: string): string {
  // 数式開始文字をエスケープ
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }
  return value;
}
```

---

## テスト戦略

### ユニットテスト

**src/lib/export/csv/generator.test.ts**:

```typescript
describe("generateCSV", () => {
  it("should generate valid CSV from FormattedValue array", () => {
    const data: FormattedValue[] = [
      { rank: 1, areaCode: "13", areaName: "東京都", value: 1000, unit: "人" },
    ];

    const csv = generateCSV(data);

    expect(csv).toContain("順位,都道府県コード,都道府県名,値,単位");
    expect(csv).toContain("1,13,東京都,1000,人");
  });

  it("should handle empty data", () => {
    expect(() => generateCSV([])).toThrow("Export data is empty");
  });

  it("should escape special characters", () => {
    const data: FormattedValue[] = [
      { areaName: "東京都,千代田区", value: 100 },
    ];

    const csv = generateCSV(data);

    expect(csv).toContain('"東京都,千代田区"');
  });
});
```

### 統合テスト

**src/hooks/export/useCSVExport.test.tsx**:

```typescript
describe("useCSVExport", () => {
  it("should export small data on client side", async () => {
    const { result } = renderHook(() => useCSVExport());

    const data = generateMockData(100);
    const exportResult = await result.current.exportToCSV(data);

    expect(exportResult.success).toBe(true);
    expect(exportResult.rowCount).toBe(100);
  });

  it("should export large data via server", async () => {
    const { result } = renderHook(() => useCSVExport());

    const data = generateMockData(15000);
    const exportResult = await result.current.exportToCSV(data);

    expect(exportResult.success).toBe(true);
    expect(exportResult.rowCount).toBe(15000);
  });
});
```

### E2E テスト

```typescript
describe("CSV Export E2E", () => {
  it("should download CSV from prefecture ranking page", async () => {
    await page.goto("/estat-api/ranking-settings");

    // データ読み込み待機
    await page.waitForSelector('[data-testid="export-button"]');

    // ダウンロード開始
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('[data-testid="export-button"]'),
    ]);

    // ファイル検証
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/prefecture-ranking-.*\.csv/);

    const content = await download.path();
    const csvContent = fs.readFileSync(content, "utf-8");

    expect(csvContent).toContain("順位,都道府県コード,都道府県名");
  });
});
```

---

## 将来拡張

### Phase 2: 追加フォーマット対応

- **JSON**: API 連携用
- **Excel (xlsx)**: ビジネス用途
- **Parquet**: データ分析用（大容量）

### Phase 3: 高度な機能

- **選択行エクスポート**: ユーザーが行を選択
- **エクスポート履歴**: ダウンロード履歴の管理
- **バッチエクスポート**: 複数ファイル ZIP 化
- **スケジュールエクスポート**: 定期自動エクスポート

### Phase 4: パフォーマンス最適化

- **Web Workers**: バックグラウンド処理
- **ストリーミング**: 大容量データ対応
- **圧縮**: gzip 圧縮でファイルサイズ削減

---

## 変更履歴

| 日付       | バージョン | 変更内容 | 担当者 |
| ---------- | ---------- | -------- | ------ |
| 2025-10-16 | 1.0.0      | 初版作成 | -      |

---

## 関連ドキュメント

- [実装ガイド](../implementation/csv-export-implementation-guide.md)
- [コーディング規約](/docs/01_development_guide/coding_standards.md)
- [コンポーネントガイド](/docs/01_development_guide/component_guide.md)
- [テストガイド](/docs/01_development_guide/testing_guide.md)
