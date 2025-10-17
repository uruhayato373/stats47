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
