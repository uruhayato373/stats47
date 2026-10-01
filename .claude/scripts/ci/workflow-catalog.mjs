#!/usr/bin/env node
/**
 * workflow-catalog.mjs — 全 GitHub Actions workflow の定義と直近の実行結果を 1 ファイルにまとめる (2026-10-01)。
 *
 * 管理画面 /ops/workflows が読む (管理画面は子プロセスを起動しない契約なので、gh はここで呼ぶ)。
 * `npm run admin` の前 (preadmin) にも走るが、失敗しても管理画面の起動は止めない。
 *
 *   node .claude/scripts/ci/workflow-catalog.mjs          # .local/ci/workflow-catalog.json を書く
 *   node .claude/scripts/ci/workflow-catalog.mjs --runs 10
 *
 * 定義 (起動条件・cron・説明) は .github/workflows/*.yml、状態 (有効/無効) と実行結果は gh から取る。
 * 失敗の扱いは audit-workflow-health.mjs (日次の健全性監視) と揃え、cancelled / skipped は失敗に数えない。
 */
import { execFile } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { createRequire } from "node:module";

const run = promisify(execFile);
const require = createRequire(import.meta.url);
const yaml = require("js-yaml");

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const OUT = ".local/ci/workflow-catalog.json";
const WORKFLOW_DIR = ".github/workflows";
const CONCURRENCY = 8;

/** cron (UTC) を日本時間の読める形にする。分・時が数値のものだけ換算し、それ以外は原文 */
export function cronToJst(cron) {
  const [min, hour, dom, mon, dow] = cron.trim().split(/\s+/);
  if (!/^\d+$/.test(min) || !/^\d+$/.test(hour)) return `${cron} (UTC)`;
  let h = Number(hour) + 9;
  const nextDay = h >= 24;
  h %= 24;
  const time = `${String(h).padStart(2, "0")}:${min.padStart(2, "0")}`;
  const shift = (v, max, base) => (/^\d+$/.test(v) ? String(((Number(v) - base + 1) % max) + base) : v);
  const DOW = ["日", "月", "火", "水", "木", "金", "土"];
  const d = nextDay ? shift(dom, 31, 1) : dom;
  const w = /^[\d,]+$/.test(dow) ? dow.split(",").map((x) => (nextDay ? shift(x, 7, 0) : x)).join(",") : dow;
  if (d === "*" && w === "*") return `毎日 ${time}`;
  if (d === "*" && /^[\d,]+$/.test(w)) return `毎週${w.split(",").map((x) => DOW[Number(x) % 7]).join("・")} ${time}`;
  if (/^\d+$/.test(d) && w === "*") return `毎月 ${d} 日 ${time}${mon === "*" ? "" : ` (${mon} 月)`}`;
  return `${cron} (UTC)`;
}

/** 冒頭のコメントから説明の 1 行目を取る (name の次の行から) */
export function purposeOf(text) {
  for (const line of text.split("\n")) {
    if (/^on:|^"?on"?:/.test(line)) break;
    const m = line.match(/^#\s*(.+?)\s*$/);
    if (m && !/^-+$/.test(m[1])) return m[1];
  }
  return null;
}

/** 新しい順の実行から、直近の結果・最後の成功・連続失敗・成功率を出す */
export function summarizeRuns(runs) {
  const done = runs.filter((r) => r.status === "completed" && !["cancelled", "skipped"].includes(r.conclusion));
  let failureStreak = 0;
  for (const r of done) {
    if (r.conclusion === "success") break;
    failureStreak += 1;
  }
  const success = done.filter((r) => r.conclusion === "success");
  return {
    last: runs[0] ?? null,
    lastSuccessAt: success[0]?.createdAt ?? null,
    failureStreak,
    successRate: done.length ? success.length / done.length : null,
    inspected: runs.length,
  };
}

function definition(file) {
  const text = readFileSync(join(ROOT, WORKFLOW_DIR, file), "utf8");
  const doc = yaml.load(text);
  const on = doc.on ?? doc[true] ?? {};
  const triggers = typeof on === "string" ? [on] : Array.isArray(on) ? on : Object.keys(on);
  const crons = (on.schedule ?? []).map((s) => s.cron);
  return { file, name: doc.name ?? file, purpose: purposeOf(text), triggers, schedules: crons.map((c) => ({ cron: c, jst: cronToJst(c) })) };
}

async function gh(args) {
  const { stdout } = await run("gh", args, { cwd: ROOT, maxBuffer: 16 * 1024 * 1024 });
  return JSON.parse(stdout);
}

async function pool(items, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const runsArg = process.argv.indexOf("--runs");
  const perWorkflow = runsArg >= 0 ? Number(process.argv[runsArg + 1]) : 10;
  const files = readdirSync(join(ROOT, WORKFLOW_DIR)).filter((f) => /\.ya?ml$/.test(f)).sort();
  const states = await gh(["workflow", "list", "--all", "-L", "500", "--json", "path,state"]);
  const stateOf = new Map(states.map((s) => [s.path.replace(`${WORKFLOW_DIR}/`, ""), s.state]));
  const errors = [];
  const workflows = await pool(files, async (file) => {
    const def = definition(file);
    let runs = [];
    try {
      runs = await gh(["run", "list", "--workflow", file, "-L", String(perWorkflow), "--json", "databaseId,createdAt,conclusion,status,event,url,headBranch"]);
    } catch (error) {
      errors.push({ file, error: String(error.message).split("\n")[0] });
    }
    return { ...def, state: stateOf.get(file) ?? "unregistered", runs, ...summarizeRuns(runs) };
  });
  mkdirSync(dirname(join(ROOT, OUT)), { recursive: true });
  writeFileSync(join(ROOT, OUT), `${JSON.stringify({ generatedAt: new Date().toISOString(), perWorkflow, errors, workflows }, null, 2)}\n`);
  const failing = workflows.filter((w) => w.last?.conclusion === "failure").length;
  console.log(`workflow catalog: ${workflows.length} 本 (直近が失敗 ${failing}・取得エラー ${errors.length}) → ${OUT}`);
}
