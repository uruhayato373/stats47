import "server-only";

import { defaultRun, reviewRun } from "../../../../.claude/scripts/management/lib/review-cadence.mjs";
import { projectRoot } from "./project-root";
import { wrap } from "./state-io";

/**
 * 週次・月次レビューと計画の期限・本文の契約・申し送りの振り分け・配線 (読み取り専用)。
 * ★判定は自前で持たず `.claude/scripts/management/lib/review-cadence.mjs` を共有する。check-review-cadence.mjs・
 *   docs:check (DG084)・review-cadence-guard.yml・週次メトリクス Issue と同じ実体なので、画面と CI の判定がずれない。
 * 正本は .claude/config/review-wiring.json。
 */

export interface CadenceStatus {
  kind: "weekly-review" | "monthly-review" | "weekly-plan" | "monthly-plan";
  label: string;
  command: string;
  latest: string | null;
  expected: string | null;
  nextDue: string | null;
  missing: string[];
  ok: boolean;
}
export interface HandoffItem {
  text: string;
  routes: string[] | null;
  problem: string | null;
}
export interface ReviewCheck {
  period: string;
  path: string;
  inContract: boolean;
  missingSections: string[];
  handoff: HandoffItem[];
  routed: number;
}
export interface CadenceFinding {
  severity: "error" | "warn";
  code: string;
  file?: string;
  message: string;
  fix: string;
  items?: string[];
}
export interface WiringRow {
  cadence: string;
  label: string;
  target: string;
  problem: string | null;
}


export type Cadence = "weekly" | "monthly";
export type StepState = "done" | "partial" | "missing" | "unknown" | "skipped";
export type RunVerdict = "ok" | "partial" | "missing" | "upcoming";
export interface RunStep {
  label: string;
  does: string;
  state: StepState;
  note: string;
}
export interface ReviewRunView {
  cadence: Cadence;
  label: string;
  command: string;
  period: string;
  range: { start: string; end: string };
  isLatest: boolean;
  verdict: RunVerdict;
  nextDue: string | null;
  steps: RunStep[];
  summary: string | null;
  handoff: HandoffItem[];
  handoffSection: string;
  inContract: boolean;
  path: string;
  options: Array<{ key: string; missing: boolean }>;
  status: CadenceStatus[];
  findings: CadenceFinding[];
  wiring: WiringRow[];
  marker: string;
}

const PERIOD = { weekly: /^\d{4}-W\d{2}$/, monthly: /^\d{4}-\d{2}$/ } as const;

/** 週次・月次ページの 1 回分。run が無い・形が違うときは期限が来ている最新の回 */
export function reviewRunView(cadence: Cadence, run?: string) {
  return wrap(() => {
    const root = projectRoot();
    const period = run && PERIOD[cadence].test(run) ? run : (defaultRun(root, cadence) as string);
    return reviewRun(root, cadence, period) as ReviewRunView;
  });
}
