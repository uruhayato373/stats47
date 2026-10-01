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
