/**
 * 行政向け商品の検証 (収益化戦略 §5「行政向け商品の検証順序」の 4 段階) がどこにいるかを、
 * 聞き取り台帳 data/products/admin-stat-interviews.json だけから導く。ファイルは読まない (読むのは lib/server/strategy-gates.ts)。
 *
 * ★段階を画面用に別の JSON へ書き写さない。台帳から導けない値は「未記録」と出し、0 や段階 1 に読み替えない。
 *   台帳は段階 1 の聞き取りだけを持ち、進む・止めるの判定と段階 2 以降・有料 pilot の開始日を置く欄が無い。
 *   そのため画面が言えるのは「段階 1 の聞き取りが何件あるか」までで、段階 2 以降へは進めない。
 */

export const UNRECORDED = "未記録";

export interface AdminStatPilotProgress {
  /** 聞き取り件数 / 実験上限 (例: 0/3 件) */
  interviewCount: string;
  /** 4 段階のどこにいるか。聞き取りが 1 件も無ければ未記録 */
  stage: string;
  /** 次に進む・止めるを決める時点 */
  nextDecision: string;
  /** 有料 pilot (段階 3) の初回判断点 = 開始から 30 日。開始日を置く欄が台帳に無いので未記録 */
  paidPilotDecision: string;
  /** 台帳の欠け (読めない・欄が無い・数えなかった記録) */
  gaps: string[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isFilled = (v: unknown): boolean => typeof v === "string" && v.trim() !== "";

const unrecorded = (gap: string): AdminStatPilotProgress => ({
  interviewCount: UNRECORDED,
  stage: UNRECORDED,
  nextDecision: UNRECORDED,
  paidPilotDecision: UNRECORDED,
  gaps: [gap],
});

/**
 * @param ledger 聞き取り台帳の JSON。読めなければ null
 * @param stages 収益化戦略 §5 の検証順序の表の段階名 (上から順)
 */
export function adminStatPilotProgress(ledger: unknown, stages: string[]): AdminStatPilotProgress {
  if (!isRecord(ledger)) return unrecorded("聞き取り台帳を読めない");
  if (!Array.isArray(ledger.interviews)) return unrecorded("聞き取り台帳に interviews の配列が無い");

  const count = ledger.interviews.filter((i) => isRecord(i) && isFilled(i.interviewId) && isFilled(i.interviewedAt)).length;
  const dropped = ledger.interviews.length - count;
  const rawTarget = isRecord(ledger.gate) ? ledger.gate.targetInterviewCount : undefined;
  const target = typeof rawTarget === "number" && Number.isInteger(rawTarget) && rawTarget > 0 ? rawTarget : null;
  const reachedTarget = target !== null && count >= target;
  const firstStage = stages[0] ?? null;

  const stage =
    count === 0 || firstStage === null
      ? UNRECORDED
      : `${firstStage} (全 ${stages.length} 段階・${reachedTarget ? `聞き取りは上限に達した。進む・止めるの判定は${UNRECORDED}` : "聞き取り中"})`;
  const nextDecision =
    target === null
      ? UNRECORDED
      : reachedTarget
        ? `段階 1 の進む・止めるを決める (聞き取りは上限の ${target} 件に達した)`
        : `聞き取りが ${target} 件に達した時点で段階 1 の進む・止めるを決める (残り ${target - count} 件)`;

  return {
    interviewCount: target === null ? `${count} 件 (上限は${UNRECORDED})` : `${count}/${target} 件`,
    stage,
    nextDecision,
    paidPilotDecision: UNRECORDED,
    gaps: [
      ...(dropped ? [`ID か実施日が欠けた記録 ${dropped} 件は聞き取りに数えていない`] : []),
      ...(target === null ? ["聞き取りの上限 (gate.targetInterviewCount) が台帳に無い"] : []),
      ...(count > 0 && firstStage === null ? ["収益化戦略 §5 の検証順序の表を読めない"] : []),
    ],
  };
}
