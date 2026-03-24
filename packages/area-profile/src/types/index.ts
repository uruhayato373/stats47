/** 強み・弱みの項目詳細 */
export interface StrengthWeaknessItem {
  indicator: string;
  rankingKey: string;
  year: string;
  rank: number;
  value: number;
  unit: string;
  percentile?: number;
}

/** 地域プロファイル全体データ */
export interface AreaProfileData {
  areaCode: string;
  areaName: string;
  strengths: StrengthWeaknessItem[];
  weaknesses: StrengthWeaknessItem[];
}

/** 都道府県別の集計サマリ */
export interface AreaProfileSummary {
  areaCode: string;
  areaName: string;
  strengthCount: number;
  weaknessCount: number;
}

/** バッチログエントリ */
export interface BatchLog {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

/** バッチ進捗情報 */
export interface AreaProfileBatchProgress {
  total: number;
  completed: number;
  skipped: number;
  failed: number;
  isRunning: boolean;
  isAborted: boolean;
  isComplete: boolean;
  logs: BatchLog[];
  result?: {
    success: boolean;
    message?: string;
    error?: string;
  };
}
