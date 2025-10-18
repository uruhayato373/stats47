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
