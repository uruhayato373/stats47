#!/usr/bin/env node
/**
 * affiliate-ops.mjs — ASP 運用の lock / health の薄い I/O CLI (doc 42 §6.5 / §11.2)
 * ---------------------------------------------------------------------------
 * 判定はすべて lib/asp-operation-core.mjs (純粋コア) に委譲し、ここはファイル I/O のみ。
 * cron (scripts/scheduled/scout-asp-weekly.sh) と将来の apply/status 系が共用する。
 *
 * 置き場: .local/affiliate-ops/ (端末固有。git を dirty にしない — doc 42 §11.2)
 *   locks/<asp>.json   … ASP profile の排他 lock (O_EXCL 相当の排他 create)
 *   health.json        … 直近 run の AffiliateAutomationHealth
 *
 * usage:
 *   node affiliate-ops.mjs lock acquire --asp a8 --operation-id <id>   # exit 0=取得 / 2=使用中
 *   node affiliate-ops.mjs lock release --asp a8 --operation-id <id>   # 自分の lock だけ削除
 *   node affiliate-ops.mjs health record --run-id <id> --started-at <iso> --steps '<json array>'
 *                                                                      # exit = ok:0 / それ以外:1
 */
import { mkdirSync, writeFileSync, readFileSync, openSync, closeSync, existsSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hostname } from "node:os";

import {
  buildLockPayload,
  canReclaimLock,
  isOwnLock,
  buildHealth,
  exitCodeForStatus,
} from "./lib/asp-operation-core.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const OPS_DIR = join(REPO_ROOT, ".local/affiliate-ops");
const LOCKS_DIR = join(OPS_DIR, "locks");
const HEALTH_PATH = join(OPS_DIR, "health.json");

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
}

function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function lockPath(asp) {
  if (!/^[a-z0-9-]+$/.test(asp)) throw new Error(`不正な asp 名: ${asp}`);
  return join(LOCKS_DIR, `${asp}.json`);
}

function lockAcquire(asp, operationId) {
  mkdirSync(LOCKS_DIR, { recursive: true, mode: 0o700 });
  const p = lockPath(asp);
  const payload = buildLockPayload({
    pid: process.pid,
    hostname: hostname(),
    startedAt: new Date().toISOString(),
    operationId,
  });
  const tryCreate = () => {
    // O_EXCL 相当の排他 create。既存なら EEXIST で throw。
    const fd = openSync(p, "wx", 0o600);
    writeFileSync(fd, JSON.stringify(payload, null, 2) + "\n");
    closeSync(fd);
  };
  try {
    tryCreate();
    console.log(`lock acquired: ${asp} (pid ${process.pid})`);
    return 0;
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }
  // 既存 lock — stale (age 超過 + PID 不在の両方) のときだけ回収する
  let existing;
  try {
    existing = JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    existing = null;
  }
  const reclaimable =
    existing &&
    canReclaimLock({ lock: existing, nowIso: new Date().toISOString(), pidAlive: pidAlive(existing.pid) });
  if (!reclaimable) {
    console.log(`lock in use: ${asp} (pid ${existing?.pid ?? "?"} / since ${existing?.startedAt ?? "?"})`);
    return 2;
  }
  rmSync(p, { force: true });
  tryCreate();
  console.log(`lock reclaimed (stale) + acquired: ${asp}`);
  return 0;
}

function lockRelease(asp, operationId) {
  const p = lockPath(asp);
  if (!existsSync(p)) return 0;
  let existing;
  try {
    existing = JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    existing = null;
  }
  // finally で消してよいのは自分の operationId の lock だけ (§6.5)
  if (existing && !isOwnLock(existing, operationId)) {
    console.error(`lock は他 operation (${existing.operationId}) の所有。削除しない`);
    return 1;
  }
  rmSync(p, { force: true });
  console.log(`lock released: ${asp}`);
  return 0;
}

function healthRecord() {
  const runId = arg("run-id");
  const startedAt = arg("started-at");
  const stepsJson = arg("steps");
  if (!runId || !startedAt || !stepsJson) {
    console.error("usage: health record --run-id <id> --started-at <iso> --steps '<json>'");
    return 1;
  }
  const steps = JSON.parse(stepsJson);
  let previousHealth = null;
  try {
    previousHealth = JSON.parse(readFileSync(HEALTH_PATH, "utf-8"));
  } catch {}
  const health = buildHealth({
    runId,
    startedAt,
    finishedAt: new Date().toISOString(),
    steps,
    previousHealth,
  });
  mkdirSync(OPS_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(HEALTH_PATH, JSON.stringify(health, null, 2) + "\n", { mode: 0o600 });
  console.log(
    `health: ${health.status} (steps: ${steps.map((s) => `${s.name}=${s.status}`).join(", ")}) → ${HEALTH_PATH}`,
  );
  if (health.lastSuccessfulRunAt) console.log(`lastSuccessfulRunAt: ${health.lastSuccessfulRunAt}`);
  return exitCodeForStatus(health.status);
}

const [cmd, sub] = process.argv.slice(2);
let code = 1;
if (cmd === "lock" && (sub === "acquire" || sub === "release")) {
  const asp = arg("asp");
  const operationId = arg("operation-id") ?? `cli-${process.pid}`;
  if (!asp) {
    console.error("--asp が必須");
    process.exit(1);
  }
  code = sub === "acquire" ? lockAcquire(asp, operationId) : lockRelease(asp, operationId);
} else if (cmd === "health" && sub === "record") {
  code = healthRecord();
} else {
  console.error("usage: affiliate-ops.mjs <lock acquire|lock release|health record> ...");
}
process.exit(code);
