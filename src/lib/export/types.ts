/**
 * エクスポート型定義
 *
 * すべてのエクスポート関連機能で使用する共通型
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

// 型の再エクスポート（循環参照回避）
import type { TimeSeriesDataPoint } from "@/components/organisms/visualization/D3LineChart";

import type { FormattedValue } from "@/lib/estat-api";

// MultiSeriesDataPoint と RankingData の型定義（必要に応じて追加）
export interface MultiSeriesDataPoint {
  time: string;
  timeCode?: string;
  [key: string]: string | number | undefined;
}

export interface RankingData {
  rank?: number;
  areaCode: string;
  areaName: string;
  value?: number;
  unit?: string;
  timeName?: string;
  timeCode?: string;
}
