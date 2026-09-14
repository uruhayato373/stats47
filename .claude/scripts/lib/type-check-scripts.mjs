#!/usr/bin/env node
/**
 * scripts 系 tsconfig の型検査をまとめて回す (npm run type-check:scripts の実体)。
 *
 *   node .claude/scripts/lib/type-check-scripts.mjs <tsconfig.json> [<tsconfig.json> ...]
 *
 * 2026-09-14 まで 9 本の `tsc --noEmit -p` を `&&` で直列に回していて、会社 Windows PC の pre-commit で
 * 141 秒かかっていた。ここでは
 *   - 並列実行 (既定 3 本。`TSC_CONCURRENCY` で変更。RAM 3GiB 未満の警告閾値を超えない範囲)
 *   - `--incremental` + `.local/tsbuildinfo/<name>.tsbuildinfo` (gitignore 済み `.local/`) で 2 回目以降は
 *     変更ファイルだけを検査する。CI (fresh checkout) では単に並列になる
 * 対象の一覧は package.json の `type-check:scripts` に引数として並べたまま置く
 * (`scripts-type-check-coverage.test.cjs` がその文字列に tsconfig パスが含まれることを要求するため)。
 * 判定は各 tsc の exit code の論理和。失敗した tsc の出力だけをそのまま表示する。
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const BUILDINFO_DIR = path.join(ROOT, ".local", "tsbuildinfo");
const TSC = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");

const configs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
// --verbose: 各 tsconfig の所要時間を出す (律速の特定用)
if (configs.length === 0) {
  console.error("usage: node .claude/scripts/lib/type-check-scripts.mjs <tsconfig.json> [...]");
  process.exit(2);
}
const concurrency = Math.max(1, Number(process.env.TSC_CONCURRENCY) || Math.min(3, os.cpus().length));
fs.mkdirSync(BUILDINFO_DIR, { recursive: true });

function runOne(config) {
  const slug = config.replace(/[\\/]/g, "__").replace(/\.json$/, "");
  const args = [
    TSC,
    "--noEmit",
    "--skipLibCheck",
    "--incremental",
    "--tsBuildInfoFile",
    path.join(BUILDINFO_DIR, `${slug}.tsbuildinfo`),
    "-p",
    config,
  ];
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, args, {
      cwd: ROOT,
      env: { ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS || "--max-old-space-size=4096" },
      windowsHide: true,
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => resolve({ config, code: code ?? 1, out, ms: Date.now() - started }));
    child.on("error", (error) => resolve({ config, code: 1, out: String(error), ms: Date.now() - started }));
  });
}

async function main() {
  const queue = [...configs];
  const results = [];
  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length) results.push(await runOne(queue.shift()));
    }),
  );
  if (process.argv.includes("--verbose"))
    for (const r of [...results].sort((a, b) => b.ms - a.ms)) console.log(`  ${(r.ms / 1000).toFixed(1).padStart(6)}s ${r.code === 0 ? "ok " : "NG "} ${r.config}`);
  const failed = results.filter((r) => r.code !== 0);
  for (const r of failed) {
    console.error(`✗ ${r.config} (${(r.ms / 1000).toFixed(1)}s)`);
    console.error(r.out.trimEnd());
  }
  const total = Math.max(...results.map((r) => r.ms));
  console.log(
    `${failed.length ? "✗" : "✓"} type-check:scripts — ${results.length - failed.length}/${results.length} ok, ` +
      `wall ${(total / 1000).toFixed(1)}s, concurrency ${concurrency}, incremental cache ${path.relative(ROOT, BUILDINFO_DIR)}`,
  );
  process.exit(failed.length ? 1 : 0);
}

main();
