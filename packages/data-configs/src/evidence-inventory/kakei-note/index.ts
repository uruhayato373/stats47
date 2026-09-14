import type { KakeiExpenseEvidenceInventory } from "../types";

import expenseEvidenceJson from "./expense-evidence.json";

export const KAKEI_EXPENSE_EVIDENCE_VERSION = expenseEvidenceJson.version;

/**
 * note 家計シリーズ (a-kakei-<pref>) の「費目→根拠指標」authored SSOT。
 * build-kakei-note-evidence-data.mjs が読み、十大費目の突出 (dominant) を
 * 裏付け指標の都道府県順位と対応付けて evidence-data.json を生成する。
 */
export const KAKEI_EXPENSE_EVIDENCE =
  expenseEvidenceJson as unknown as KakeiExpenseEvidenceInventory;
