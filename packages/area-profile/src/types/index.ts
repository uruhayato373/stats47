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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStrengthWeaknessItem(value: unknown, path: string): StrengthWeaknessItem {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  for (const field of ["indicator", "rankingKey", "year", "unit"] as const) {
    if (typeof value[field] !== "string") throw new Error(`${path}.${field} must be a string`);
  }
  for (const field of ["rank", "value"] as const) {
    if (!Number.isFinite(value[field])) throw new Error(`${path}.${field} must be finite`);
  }
  if (value.percentile !== undefined && !Number.isFinite(value.percentile)) {
    throw new Error(`${path}.percentile must be finite when present`);
  }
  return value as unknown as StrengthWeaknessItem;
}

export function parseAreaProfileData(value: unknown): AreaProfileData {
  if (!isRecord(value)) throw new Error("area profile must be an object");
  if (typeof value.areaCode !== "string" || typeof value.areaName !== "string") {
    throw new Error("area profile code and name must be strings");
  }
  if (!Array.isArray(value.strengths) || !Array.isArray(value.weaknesses)) {
    throw new Error("area profile strengths and weaknesses must be arrays");
  }
  return {
    areaCode: value.areaCode,
    areaName: value.areaName,
    strengths: value.strengths.map((item, index) =>
      parseStrengthWeaknessItem(item, `strengths[${index}]`)),
    weaknesses: value.weaknesses.map((item, index) =>
      parseStrengthWeaknessItem(item, `weaknesses[${index}]`)),
  };
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
