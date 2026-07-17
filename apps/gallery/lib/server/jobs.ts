import "server-only";

import { spawn } from "node:child_process";

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

/**
 * ジョブを起動する。実行中ジョブがあれば { error } (呼び元は 409)。
 * kind==="publish-x" かつ exit 0 で gallery-state の lastPublishXSuccess を更新する。
 */
export function startJob(
  kind: string,
  cmd: string,
  args: string[],
): { id: number } | { error: string } {
  const reg = registry();
  if (reg.runningId !== null && reg.jobs.get(reg.runningId)?.status === "running") {
    return { error: `別のジョブ (#${reg.runningId}) が実行中。完了を待ってください` };
  }
  const id = reg.seq++;
  const job: Job = {
    id,
    kind,
    cmd: `${cmd} ${args.join(" ")}`,
    status: "running",
    log: [],
    startedAt: new Date().toISOString(),
  };
  reg.jobs.set(id, job);
  reg.runningId = id;

  const child = spawn(cmd, args, { cwd: projectRoot(), env: { ...process.env } });
  const append = (buf: Buffer | string) => {
    for (const line of String(buf).split("\n")) if (line.trim()) job.log.push(line);
    if (job.log.length > MAX_LOG_LINES) job.log.splice(0, job.log.length - MAX_LOG_LINES);
  };
  child.stdout.on("data", append);
  child.stderr.on("data", append);
  child.on("close", (code) => {
    job.status = code === 0 ? "success" : "failed";
    job.exitCode = code;
    job.endedAt = new Date().toISOString();
    if (reg.runningId === id) reg.runningId = null;
    if (job.kind === "publish-x" && code === 0) {
      saveGalleryState({ lastPublishXSuccess: job.endedAt });
    }
  });
  child.on("error", (err) => {
    job.status = "failed";
    job.log.push(`spawn error: ${err.message}`);
    job.endedAt = new Date().toISOString();
    if (reg.runningId === id) reg.runningId = null;
  });
  return { id };
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
