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
