import "server-only";

import { reviewCadence } from "../../../../.claude/scripts/management/lib/review-cadence.mjs";
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
export interface ReviewCadenceView {
  today: string;
  currentWeek: string;
  lastCompletedWeek: string;
  currentMonth: string;
  status: CadenceStatus[];
  reviews: { weekly: ReviewCheck[]; monthly: ReviewCheck[] };
  wiring: WiringRow[];
  findings: CadenceFinding[];
  marker: string;
}

export function reviewCadenceView() {
  return wrap(() => reviewCadence(projectRoot()) as ReviewCadenceView);
}
