import "server-only";

import fs from "node:fs";
import path from "node:path";

import { projectRoot } from "./project-root";
import { wrap } from "./state-io";

/**
 * GitHub Actions workflow の一覧 (読み取り専用)。
 * gh は管理画面から呼ばない (子プロセスを起動しない契約)。`.claude/scripts/ci/workflow-catalog.mjs`
 * (`npm run ci:workflows`・`npm run admin` の前にも実行) が書いた .local/ci/workflow-catalog.json を読む。
 */

export interface WorkflowRun {
  databaseId: number;
  createdAt: string;
  conclusion: string | null;
  status: string;
  event: string;
  url: string;
  headBranch: string;
}
export interface WorkflowEntry {
  file: string;
  name: string;
  purpose: string | null;
  triggers: string[];
  schedules: Array<{ cron: string; jst: string }>;
  state: string;
  runs: WorkflowRun[];
  last: WorkflowRun | null;
  lastSuccessAt: string | null;
  failureStreak: number;
  successRate: number | null;
  inspected: number;
}
export interface WorkflowCatalog {
  generatedAt: string;
  perWorkflow: number;
  errors: Array<{ file: string; error: string }>;
  workflows: WorkflowEntry[];
}

export const WORKFLOW_CATALOG = ".local/ci/workflow-catalog.json";

export function workflowCatalog() {
  return wrap((): WorkflowCatalog | null => {
    const file = path.join(projectRoot(), WORKFLOW_CATALOG);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8")) as WorkflowCatalog;
  });
}

/** 定期実行の頻度。cron (UTC) の日が数値なら毎月、曜日が数値なら毎週、どちらも * なら毎日 */
export type Cadence = "daily" | "weekly" | "monthly" | "none";
export function cadenceOf(w: Pick<WorkflowEntry, "schedules">): Cadence {
  const cron = w.schedules[0]?.cron;
  if (!cron) return "none";
  const [, , dom, , dow] = cron.trim().split(/\s+/);
  if (dom !== "*") return "monthly";
  if (dow !== "*") return "weekly";
  return "daily";
}

/** 日本時間で次に動く順に並べるためのキー (月の日・曜日・時・分)。日本時間は UTC+9 なので日付をまたぐ分を足す */
export function scheduleSortKey(w: Pick<WorkflowEntry, "schedules">): number {
  const cron = w.schedules[0]?.cron;
  if (!cron) return Number.MAX_SAFE_INTEGER;
  const [min, hour, dom, , dow] = cron.trim().split(/\s+/);
  const minutes = Number(hour) * 60 + Number(min) + 9 * 60;
  const nextDay = minutes >= 24 * 60 ? 1 : 0;
  const day = dom !== "*" ? Number(dom) + nextDay : dow !== "*" ? ((Number(dow.split(",")[0]) + nextDay) % 7 || 7) : 0;
  return day * 24 * 60 + (minutes % (24 * 60));
}
