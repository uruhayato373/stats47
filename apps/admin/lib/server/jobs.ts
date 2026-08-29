import "server-only";

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { projectRoot } from "./project-root";
import { saveGalleryState } from "./gallery-state";

/**
 * ジョブ管理 (spawn・同時実行 1)。旧 server.mjs の jobs / startJob を忠実移植。
 *
 * ★ globalThis singleton: Next.js dev の HMR / 複数 route module インスタンスで
 * ジョブレジストリが二重化しないよう globalThis に固定する。spawn は shell を経由せず
 * cmd + args[] で起動 (任意コマンド注入を防ぐ。ogp 再生成の sh -c は呼び元 actions.ts が
 * 検証後にのみ組み立てる)。
 */
export interface Job {
  id: number;
  kind: string;
  cmd: string;
  status: "running" | "success" | "failed";
  log: string[];
  startedAt: string;
  endedAt?: string;
  exitCode?: number | null;
}

interface JobRegistry {
  jobs: Map<number, Job>;
  seq: number;
  runningId: number | null;
}

const g = globalThis as unknown as { __galleryJobs?: JobRegistry };
function registry(): JobRegistry {
  if (!g.__galleryJobs) {
    g.__galleryJobs = { jobs: new Map(), seq: 1, runningId: null };
  }
  return g.__galleryJobs;
}

const MAX_LOG_LINES = 500;

export interface JobStep {
  cmd: "npx";
  args: string[];
  requiredFile?: string;
}

function beginJob(
  kind: string,
  command: string,
): { reg: JobRegistry; job: Job } | { error: string } {
  const reg = registry();
  if (reg.runningId !== null && reg.jobs.get(reg.runningId)?.status === "running") {
    return { error: `別のジョブ (#${reg.runningId}) が実行中。完了を待ってください` };
  }
  const id = reg.seq++;
  const job: Job = {
    id,
    kind,
    cmd: command,
    status: "running",
    log: [],
    startedAt: new Date().toISOString(),
  };
  reg.jobs.set(id, job);
  reg.runningId = id;
  return { reg, job };
}

function appendLog(job: Job, value: Buffer | string): void {
  for (const line of String(value).split("\n")) if (line.trim()) job.log.push(line);
  if (job.log.length > MAX_LOG_LINES) job.log.splice(0, job.log.length - MAX_LOG_LINES);
}

function finishJob(reg: JobRegistry, job: Job, code: number): void {
  job.status = code === 0 ? "success" : "failed";
  job.exitCode = code;
  job.endedAt = new Date().toISOString();
  if (reg.runningId === job.id) reg.runningId = null;
  if (job.kind === "publish-x" && code === 0) {
    saveGalleryState({ lastPublishXSuccess: job.endedAt });
  }
}

function spawnStep(
  reg: JobRegistry,
  job: Job,
  step: JobStep,
  onSuccess: () => void,
): void {
  if (step.cmd !== "npx") {
    appendLog(job, `unsupported executable: ${step.cmd}`);
    finishJob(reg, job, 1);
    return;
  }
  if (step.requiredFile && !existsSync(resolve(projectRoot(), step.requiredFile))) {
    appendLog(job, `required file missing: ${step.requiredFile}`);
    finishJob(reg, job, 1);
    return;
  }
  const child = spawn("npx", step.args, {
    // `npm run admin` は workspace cwd=apps/admin で起動する。環境変数由来の
    // STATS47_PROJECT_ROOT をプロセス実行へ渡さず、固定階層からrepo rootへ戻る。
    cwd: resolve(process.cwd(), "../.."),
    env: { ...process.env },
  });
  child.stdout.on("data", (value) => appendLog(job, value));
  child.stderr.on("data", (value) => appendLog(job, value));
  child.on("close", (code) => {
    if (code === 0) onSuccess();
    else finishJob(reg, job, code ?? 1);
  });
  child.on("error", (err) => {
    appendLog(job, `spawn error: ${err.message}`);
    finishJob(reg, job, 1);
  });
}

/**
 * ジョブを起動する。実行中ジョブがあれば { error } (呼び元は 409)。
 * kind==="publish-x" かつ exit 0 で gallery-state の lastPublishXSuccess を更新する。
 */
export function startJob(
  kind: string,
  cmd: "npx",
  args: string[],
): { id: number } | { error: string } {
  if (cmd !== "npx") return { error: `unsupported executable: ${cmd}` };
  const started = beginJob(kind, `${cmd} ${args.join(" ")}`);
  if ("error" in started) return started;
  const { reg, job } = started;
  spawnStep(reg, job, { cmd, args }, () => finishJob(reg, job, 0));
  return { id: job.id };
}

/** shellを経由せず、固定された複数コマンドを同じジョブとして直列実行する。 */
export function startJobSteps(
  kind: string,
  steps: JobStep[],
): { id: number } | { error: string } {
  if (steps.length === 0) return { error: "実行stepがありません" };
  const command = steps.map(({ cmd, args }) => `${cmd} ${args.join(" ")}`).join(" && ");
  const started = beginJob(kind, command);
  if ("error" in started) return started;
  const { reg, job } = started;
  const run = (index: number): void => {
    const step = steps[index];
    if (!step) {
      finishJob(reg, job, 0);
      return;
    }
    spawnStep(reg, job, step, () => run(index + 1));
  };
  run(0);
  return { id: job.id };
}

/** 全ジョブの一覧 (log は末尾 3 行だけ)。旧 GET /api/jobs 相当。 */
export function listJobs(): Array<{
  id: number;
  kind: string;
  status: string;
  exitCode: number | null;
  startedAt: string;
  endedAt: string | null;
  tail: string[];
}> {
  return [...registry().jobs.values()].map((j) => ({
    id: j.id,
    kind: j.kind,
    status: j.status,
    exitCode: j.exitCode ?? null,
    startedAt: j.startedAt,
    endedAt: j.endedAt ?? null,
    tail: j.log.slice(-3),
  }));
}

/** id で 1 件取得 (全 log 付き)。無ければ null。 */
export function getJob(id: number): Job | null {
  return registry().jobs.get(id) ?? null;
}
