/**
 * 全国 (Japan) catalog 候補の分類 — `scripts/classify-japan-candidates.ts` の判定部分 (純粋関数)。
 *
 * live audit (`data/themes/charts/live-audit.json`) は 2026-10-05 から R2 観測値の監査
 * (kind / metricKey だけで params / hasNational を持たない) が主になった。旧形式の e-Stat 行だけを
 * 全国行の証拠として索引し、証拠の無い metric は `unknown-no-audit-entry` として
 * `verify-japan-candidates.ts` (実 e-Stat 取得で全国行を値レベル判定) へ渡す。
 * 旧実装は全行に `params` があると仮定して TypeError で落ちていた (JAPAN-CANDIDATE-CLASSIFY-CRASH-01)。
 */
import { requestKey } from "../source-coordinate";

export interface LiveAuditEntry {
  kind?: string;
  params?: Record<string, unknown>;
  hasNational?: boolean;
}

export type JapanCandidateClassification =
  | "official-candidate"
  | "unsupported"
  | "unknown-non-estat"
  | "unknown-no-audit-entry";

/** verify-japan-candidates.ts が実 e-Stat 取得で判定する分類 (行の存在の証拠が無いものも含める)。 */
export const VERIFY_TARGET_CLASSIFICATIONS: readonly JapanCandidateClassification[] = [
  "official-candidate",
  "unknown-no-audit-entry",
];

/** e-Stat の request (statsDataId + filters) と全国行の有無を持つ監査行だけを request key で索引する。 */
export function indexNationalEvidence(results: readonly LiveAuditEntry[]): Map<string, boolean> {
  const index = new Map<string, boolean>();
  for (const r of results) {
    const statsDataId = r.params?.statsDataId;
    if (typeof statsDataId !== "string" || typeof r.hasNational !== "boolean") continue;
    const filters: Record<string, string> = {};
    for (const [k, v] of Object.entries(r.params ?? {})) {
      if (k !== "statsDataId" && typeof v === "string") filters[k] = v;
    }
    const key = requestKey({ statsDataId, filters });
    if (!index.has(key)) index.set(key, r.hasNational);
  }
  return index;
}

export function classifyEstatRequest(
  key: string,
  index: ReadonlyMap<string, boolean>,
): { classification: JapanCandidateClassification; hasNational: boolean | null; reason: string } {
  const hasNational = index.get(key);
  if (hasNational === undefined) {
    return {
      classification: "unknown-no-audit-entry",
      hasNational: null,
      reason: "live audit に全国行の証拠が無い。verify-japan-candidates.ts の e-Stat 取得で判定する",
    };
  }
  return hasNational
    ? {
        classification: "official-candidate",
        hasNational: true,
        reason: "00000 row exists (live-audit); VALUE-LEVEL verification still required before Japan catalog adoption",
      }
    : {
        classification: "unsupported",
        hasNational: false,
        reason: "00000 row does not exist in this table (structurally unsupported)",
      };
}
