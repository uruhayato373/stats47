# CSV エクスポート機能 実装ガイド

**作成日**: 2025-10-16  
**対象**: 開発者  
**前提知識**: React, TypeScript, Next.js

## 目次

1. [クイックスタート](#クイックスタート)
2. [段階的実装手順](#段階的実装手順)
3. [コンポーネント統合例](#コンポーネント統合例)
4. [カスタマイズ方法](#カスタマイズ方法)
5. [トラブルシューティング](#トラブルシューティング)
6. [FAQ](#faq)

---

## クイックスタート

### 最小限の実装例

```tsx
import { ExportButton } from "@/components/export/ExportButton";
import { FormattedValue } from "@/lib/estat-api";

function MyComponent() {
  const data: FormattedValue[] = [
    { rank: 1, areaCode: "13", areaName: "東京都", value: 1000, unit: "人" },
    // ...
  ];

  return (
    <div>
      <h1>都道府県ランキング</h1>
      <ExportButton data={data} dataType="prefecture-ranking" />
      {/* データ表示 */}
    </div>
  );
}
```

たったこれだけで、CSV エクスポート機能が動作します！

---

## 段階的実装手順

### Phase 1: コアライブラリ実装

#### Step 1-1: 型定義作成

**ファイル**: `src/lib/export/types.ts`

```typescript
/**
 * エクスポート型定義
 *
 * すべてのエクスポート関連機能で使用する共通型
 */

export type ExportFormat = "csv" | "json" | "xlsx";

export interface CSVExportOptions {
  filename: string;
  headers?: string[];
  includeBOM?: boolean;
  delimiter?: string;
  lineBreak?: "\n" | "\r\n";
  includeMetadata?: boolean;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  fileSize: number;
  rowCount: number;
  processingTime: number;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ExportableData =
  | FormattedValue[]
  | TimeSeriesDataPoint[]
  | MultiSeriesDataPoint[]
  | RankingData[];

export interface ExportProgress {
  isExporting: boolean;
  progress: number;
  currentRow: number;
  totalRows: number;
  stage: "preparing" | "generating" | "downloading" | "complete" | "error";
  error?: string;
}
```

#### Step 1-2: CSV 生成ライブラリ作成

**ファイル**: `src/lib/export/csv/generator.ts`

```typescript
import { FormattedValue } from "@/lib/estat-api";
import { CSVExportOptions, ExportResult } from "../types";

/**
 * FormattedValueデータをCSV文字列に変換
 */
export function generateCSV(
  data: FormattedValue[],
  options?: Partial<CSVExportOptions>
): string {
  // データ検証
  if (!data || data.length === 0) {
    throw new Error("Export data is empty");
  }

  // デフォルトオプション
  const opts = {
    delimiter: ",",
    lineBreak: "\n",
    includeBOM: true,
    ...options,
  };

  // ヘッダー生成
  const headers = opts.headers || [
    "順位",
    "都道府県コード",
    "都道府県名",
    "値",
    "単位",
    "年度",
    "時点コード",
  ];

  // データ行生成
  const rows = data.map((item) => [
    formatField(item.rank),
    formatField(item.areaCode),
    formatField(item.areaName),
    formatField(item.value),
    formatField(item.unit),
    formatField(item.timeName),
    formatField(item.timeCode),
  ]);

  // CSV文字列化
  return [
    headers.join(opts.delimiter),
    ...rows.map((row) => row.join(opts.delimiter)),
  ].join(opts.lineBreak);
}

/**
 * フィールド値のフォーマット
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
    const escaped = strValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return strValue;
}

/**
 * CSV文字列をダウンロード
 */
export function downloadCSV(
  csvContent: string,
  filename: string
): ExportResult {
  const startTime = performance.now();

  try {
    // BOM付きUTF-8エンコード（Excelで正しく開くため）
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
    const rowCount = csvContent.split("\n").length - 1;

    return {
      success: true,
      filename: `${filename}.csv`,
      fileSize: blob.size,
      rowCount,
      processingTime,
    };
  } catch (error) {
    return {
      success: false,
      filename: `${filename}.csv`,
      fileSize: 0,
      rowCount: 0,
      processingTime: performance.now() - startTime,
      error: {
        code: "DOWNLOAD_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
    };
  }
}

/**
 * ファイル名自動生成
 */
export function generateFilename(
  dataType: string,
  metadata?: { year?: string; areaName?: string }
): string {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14); // YYYYMMDDHHmmss

  const parts = [dataType];

  if (metadata?.year) parts.push(metadata.year);
  if (metadata?.areaName) {
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

#### Step 1-3: データフォーマッター作成

**ファイル**: `src/lib/export/csv/formatter.ts`

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

  static format(data: FormattedValue[]): string[][] {
    return [
      this.getHeaders(),
      ...data.map((item) => this.formatRow(item).map(String)),
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

  static format(data: TimeSeriesDataPoint[]): string[][] {
    return [
      this.getHeaders(),
      ...data.map((item) => this.formatRow(item).map(String)),
    ];
  }
}
```

### Phase 2: React フック実装

#### Step 2-1: useCSVExport フック作成

**ファイル**: `src/hooks/export/useCSVExport.ts`

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

const DATA_SIZE_THRESHOLD = 10000;

interface UseCSVExportOptions {
  dataType?: string;
  metadata?: {
    year?: string;
    areaName?: string;
  };
}

/**
 * CSVエクスポート機能を提供するカスタムフック
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
          setProgress((prev) => ({ ...prev, stage: "generating" }));
          const csvContent = generateCSV(data, exportOptions);

          setProgress((prev) => ({
            ...prev,
            stage: "downloading",
            progress: 50,
          }));
          result = downloadCSV(csvContent, filename);
        } else {
          // サーバーサイド処理
          result = await exportServerSide(data, {
            ...exportOptions,
            filename,
          });
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

  const exportServerSide = async (
    data: FormattedValue[],
    options: Partial<CSVExportOptions> & { filename: string }
  ): Promise<ExportResult> => {
    setProgress((prev) => ({ ...prev, stage: "generating" }));

    const startTime = performance.now();

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

### Phase 3: UI コンポーネント実装

#### Step 3-1: ExportButton コンポーネント作成

**ファイル**: `src/components/export/ExportButton.tsx`

```typescript
"use client";

import React from "react";
import { Download, Loader2 } from "lucide-react";
import { useCSVExport } from "@/hooks/export/useCSVExport";
import { FormattedValue } from "@/lib/estat-api";
import { CSVExportOptions } from "@/lib/export/types";

interface ExportButtonProps {
  data: FormattedValue[];
  filename?: string;
  dataType?: string;
  metadata?: {
    year?: string;
    areaName?: string;
  };
  csvOptions?: Partial<CSVExportOptions>;
  className?: string;
  label?: string;
  iconSize?: number;
  onExportComplete?: (success: boolean) => void;
}

/**
 * CSVエクスポートボタンコンポーネント
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

    // トースト通知（実装はプロジェクトに依存）
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
```

---

## コンポーネント統合例

### 例 1: PrefectureDataTableClient に統合

**ファイル**: `src/components/ranking/ui/PrefectureDataTableClient.tsx`

```tsx
import { ExportButton } from "@/components/export/ExportButton";

export const PrefectureDataTableClient: React.FC<Props> = ({ data }) => {
  // ... 既存のロジック

  return (
    <div className="bg-white rounded-lg border">
      {/* ヘッダー部分 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            都道府県別データ
          </h3>

          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">{sortedData.length}件</div>

            {/* エクスポートボタン追加 */}
            <ExportButton
              data={sortedData}
              dataType="prefecture-ranking"
              metadata={{ year: "2023" }}
            />
          </div>
        </div>
      </div>

      {/* テーブル部分 */}
      {/* ... 既存のテーブル表示 */}
    </div>
  );
};
```

### 例 2: RankingDataContainer に統合

**ファイル**: `src/components/ranking/containers/RankingDataContainer.tsx`

```tsx
import { ExportButton } from "@/components/export/ExportButton";

export const RankingDataContainer: React.FC<Props> = ({ rankingConfig }) => {
  // ... 既存のロジック

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{rankingConfig.title}</h2>

        {/* エクスポートボタン */}
        <ExportButton
          data={data}
          dataType="ranking"
          metadata={{
            year: selectedYear,
            areaName: rankingConfig.title,
          }}
        />
      </div>

      {/* 地図・統計表示 */}
      <div className="flex gap-4">
        <ChoroplethMap data={data} />
        <PrefectureDataTableClient data={data} />
      </div>
    </div>
  );
};
```

### 例 3: EstatLineChart に統合

**ファイル**: `src/components/dashboard/LineChart/EstatLineChart.tsx`

```tsx
import { ExportButton } from "@/components/export/ExportButton";

export const EstatLineChart: React.FC<Props> = ({ params, areaCode }) => {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>(
    []
  );

  // ... データ取得ロジック

  return (
    <div className="bg-white rounded-lg border p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>

        {/* エクスポートボタン */}
        <ExportButton
          data={timeSeriesData}
          dataType="time-series"
          metadata={{ areaName: areaCode }}
        />
      </div>

      {/* チャート表示 */}
      <LineChart data={timeSeriesData} />
    </div>
  );
};
```

---

## カスタマイズ方法

### カスタムヘッダーの指定

```tsx
<ExportButton
  data={data}
  csvOptions={{
    headers: ["カスタム順位", "地域", "数値", "備考"],
  }}
/>
```

### ファイル名のカスタマイズ

```tsx
<ExportButton data={data} filename="custom-export-2023" />
```

### カスタムスタイリング

```tsx
<ExportButton
  data={data}
  className="bg-blue-600 text-white hover:bg-blue-700"
  label="データをダウンロード"
  iconSize={20}
/>
```

### エクスポート完了時のコールバック

```tsx
<ExportButton
  data={data}
  onExportComplete={(success) => {
    if (success) {
      toast.success("ダウンロードが完了しました");
    } else {
      toast.error("ダウンロードに失敗しました");
    }
  }}
/>
```

---

## トラブルシューティング

### 問題 1: Excel で文字化けする

**原因**: BOM が付いていない

**解決方法**:

```typescript
// generator.ts で BOM を確実に追加
const bom = "\uFEFF";
const blob = new Blob([bom + csvContent], {
  type: "text/csv;charset=utf-8;",
});
```

### 問題 2: ダウンロードが開始されない

**原因**: データが空 or ブラウザのポップアップブロック

**解決方法**:

1. データの存在確認
2. ユーザーアクションから直接呼び出す（非同期処理後は NG）

```typescript
// ✓ OK: ユーザークリックから直接
<button onClick={() => exportToCSV(data)}>

// ✗ NG: 非同期処理後
<button onClick={async () => {
  await fetchData();
  exportToCSV(data); // ポップアップブロックされる可能性
}}>
```

### 問題 3: 大容量データでブラウザがクラッシュ

**原因**: メモリ不足

**解決方法**: サーバーサイド処理に切替（自動判定される）

```typescript
// 閾値を調整
const DATA_SIZE_THRESHOLD = 5000; // デフォルト: 10000
```

---

## FAQ

### Q1: 他のデータ型（TimeSeriesDataPoint 等）のエクスポート方法は？

**A**: カスタムフォーマッターを作成して使用します。

```typescript
import { TimeSeriesCSVFormatter } from "@/lib/export/csv/formatter";

const csvContent = TimeSeriesCSVFormatter.format(timeSeriesData);
downloadCSV(csvContent, "time-series");
```

### Q2: JSON や Excel 形式のエクスポートは可能？

**A**: Phase 2 で対応予定です。現在は CSV のみサポートしています。

### Q3: エクスポートボタンを複数配置できますか？

**A**: はい、同じページ内に複数配置可能です。それぞれ独立して動作します。

```tsx
<ExportButton data={data1} dataType="type1" />
<ExportButton data={data2} dataType="type2" />
```

### Q4: サーバーサイド API はどのように実装する？

**A**: `src/app/api/export/csv/route.ts` を作成し、Next.js API Routes で実装します。

```typescript
// src/app/api/export/csv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateCSV } from "@/lib/export/csv/generator";

export async function POST(request: NextRequest) {
  const { data, options } = await request.json();

  const csvContent = generateCSV(data, options);
  const bom = "\uFEFF";

  return new NextResponse(bom + csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${options.filename}.csv"`,
    },
  });
}
```

### Q5: エクスポート進捗を表示したい

**A**: `useCSVExport` フックの `progress` を使用します。

```tsx
const { exportToCSV, progress } = useCSVExport();

{
  progress.isExporting && (
    <div>
      <p>{progress.stage}</p>
      <progress value={progress.progress} max={100} />
    </div>
  );
}
```

---

## 次のステップ

1. **テスト作成**: ユニットテスト・統合テストを追加
2. **ドキュメント更新**: 新しいコンポーネント統合時に更新
3. **Phase 2 機能**: JSON, Excel 対応の検討

---

## 関連ドキュメント

- [CSV エクスポート機能 詳細仕様書](../specifications/csv-export-specification.md)
- [コンポーネントガイド](/docs/01_development_guide/component_guide.md)
- [テストガイド](/docs/01_development_guide/testing_guide.md)
