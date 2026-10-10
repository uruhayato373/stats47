#!/usr/bin/env node
/**
 * 依存の脆弱性ゲート (high / critical)。`npm audit --audit-level=high` の代わりに Security Scan が呼ぶ。
 *
 * 上流に修正版が無い dev 依存の advisory だけを、理由と期限付きの例外として通す
 * (正本 .claude/config/dependency-audit-exceptions.json。2026-10-10 オーナー判断・DEPS-BRACES-GATE-01 の (b))。
 * 例外が無いままだと全 PR と main への push でゲートが赤のままになり、新しい high を見落とすため。
 *
 * 守ること:
 *   - runtime 依存 (`npm audit --omit=dev`) に現れる advisory は例外にしない。例外の advisory が runtime に出たら失敗する
 *   - 期限を過ぎた例外は失敗する (再評価を強制する)
 *   - 例外の advisory から派生した行 (micromatch → fast-glob → … のように via が依存名だけの行) は、
 *     元の advisory がすべて例外のときだけ通す
 * runtime 全体のゲート (`npm audit --omit=dev --audit-level=low`) は別の step のまま変えない。
 *
 * 使い方: node .claude/scripts/lib/check-dependency-audit.mjs [--all audit.json --runtime audit-runtime.json] [--today YYYY-MM-DD]
 *   引数が無ければ npm audit を 2 回 (全体・--omit=dev) 実行する。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const EXCEPTIONS_PATH = ".claude/config/dependency-audit-exceptions.json";
const BLOCKING = new Set(["high", "critical"]);
const GHSA = /GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/i;

/** 脆弱性の行から、元になっている advisory (GHSA) を依存名の連鎖をたどって集める */
function advisoriesOf(name, vulnerabilities, seen = new Set()) {
  if (seen.has(name)) return new Set();
  seen.add(name);
  const out = new Set();
  for (const via of vulnerabilities[name]?.via ?? []) {
    if (typeof via === "string") {
      for (const id of advisoriesOf(via, vulnerabilities, seen)) out.add(id);
    } else {
      out.add(String(via.url ?? "").match(GHSA)?.[0]?.toUpperCase() ?? `source:${via.source}`);
    }
  }
  return out;
}

/**
 * @param {{all: object, runtime: object, exceptions: Array<{id:string, scope:string, reason:string, expiresAt:string}>, today: string}} input
 *   all / runtime は `npm audit --json` と `npm audit --omit=dev --json` の結果
 * @returns {{blocking: string[], excepted: string[], errors: string[]}}
 */
export function evaluateAudit({ all, runtime, exceptions, today }) {
  const errors = [];
  const valid = new Map();
  for (const e of exceptions) {
    const id = String(e.id ?? "").toUpperCase();
    if (!GHSA.test(id) || e.scope !== "dev" || !e.reason || !/^\d{4}-\d{2}-\d{2}$/.test(e.expiresAt ?? "")) {
      errors.push(`例外 ${e.id ?? "(id なし)"} は GHSA の id・scope "dev"・reason・expiresAt (YYYY-MM-DD) が必要`);
      continue;
    }
    if (e.expiresAt < today) {
      errors.push(`例外 ${id} は期限 ${e.expiresAt} を過ぎた。上流の修正版を確かめて外すか、理由を書き直して期限を延ばす`);
      continue;
    }
    valid.set(id, e);
  }

  const runtimeVulns = runtime?.vulnerabilities ?? {};
  const runtimeIds = new Set(Object.keys(runtimeVulns).flatMap((name) => [...advisoriesOf(name, runtimeVulns)]));
  for (const id of valid.keys()) {
    if (runtimeIds.has(id)) errors.push(`例外 ${id} が runtime 依存にも現れた。runtime の脆弱性は例外にしない`);
  }

  const vulnerabilities = all?.vulnerabilities ?? {};
  const blocking = [];
  const excepted = [];
  for (const [name, v] of Object.entries(vulnerabilities)) {
    if (!BLOCKING.has(v.severity)) continue;
    const ids = [...advisoriesOf(name, vulnerabilities)];
    const covered = ids.length > 0 && ids.every((id) => valid.has(id) && !runtimeIds.has(id));
    (covered ? excepted : blocking).push(`${name} (${v.severity}: ${ids.join(", ") || "advisory 不明"})`);
  }
  return { blocking, excepted, errors };
}

function npmAudit(args) {
  try {
    return JSON.parse(execFileSync("npm", ["audit", "--json", ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  } catch (error) {
    // npm audit は脆弱性があると exit 1 で JSON を stdout に出す
    if (error.stdout) return JSON.parse(error.stdout);
    throw error;
  }
}

function main() {
  const args = process.argv.slice(2);
  const value = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
  const all = value("--all") ? JSON.parse(readFileSync(value("--all"), "utf8")) : npmAudit([]);
  const runtime = value("--runtime") ? JSON.parse(readFileSync(value("--runtime"), "utf8")) : npmAudit(["--omit=dev"]);
  const exceptions = JSON.parse(readFileSync(join(ROOT, EXCEPTIONS_PATH), "utf8")).exceptions ?? [];
  const today = value("--today") ?? new Date().toISOString().slice(0, 10);

  const { blocking, excepted, errors } = evaluateAudit({ all, runtime, exceptions, today });
  for (const line of excepted) console.log(`例外で通過 (dev のみ・期限付き): ${line}`);
  for (const line of errors) console.error(`✗ ${line}`);
  for (const line of blocking) console.error(`✗ high/critical: ${line}`);
  if (errors.length || blocking.length) {
    console.error(`依存の脆弱性ゲート: 失敗 (high/critical ${blocking.length} 件・例外の不備 ${errors.length} 件)。例外の正本 ${EXCEPTIONS_PATH}`);
    process.exitCode = 1;
  } else {
    console.log(`依存の脆弱性ゲート: 通過 (high/critical 0 件・例外で通過 ${excepted.length} 件)`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
