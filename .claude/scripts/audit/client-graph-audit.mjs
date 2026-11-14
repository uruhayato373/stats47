#!/usr/bin/env node
/**
 * client-graph-audit — 全 "use client" ファイルから重い依存 (全指標 registry・全テーマ定義・GIS 原典処理) への
 * 値の import の経路を数え、baseline からの増加で落とす。
 *
 * ★なぜ要るか: 2026-10-21 に barrel 経由で全指標 registry がブラウザ向けに入り、ランキング詳細の初回コンパイルが
 *   171 秒かかった (DEV-HEAVY-CLIENT-GRAPH-01)。境界テストは列挙した入口しか見ないので、新しい入口や部品から
 *   同じ経路ができても気づけない。ここでは追跡されている全 "use client" ファイルを対象にする。
 *
 * 対象: apps/web/src と packages 配下の各 src の追跡ファイル (テスト・stories 除く)。import は apps/web の tsconfig で解決する。
 * baseline: .claude/config/client-graph-baseline.json (既存の経路を持つファイル。縮小専用)。
 *   - baseline に無いファイルが重い依存に届けば失敗 (exit 1)
 *   - baseline にあるのに届かなくなったファイルは警告 (--write-baseline で縮める)
 *   - baseline が空でないのに 1 件も検出できなければ失敗 (経路をたどれていない疑い)
 *
 * 使い方:
 *   node .claude/scripts/audit/client-graph-audit.mjs                   # 検査 (週次: quality-suite-weekly.yml)
 *   node .claude/scripts/audit/client-graph-audit.mjs --write-baseline  # baseline を縮める (足すことはしない)
 *   node .claude/scripts/audit/client-graph-audit.mjs --json out.json   # 検出した経路を全件 JSON で出す
 *
 * --root <dir> で検査対象のリポジトリルートを差し替えられる (テスト用)。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { auditClientGraph, compareWithBaseline } from "./client-graph-audit-core.mjs";

const SCRIPT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const args = process.argv.slice(2);
const rootIndex = args.indexOf("--root");
const ROOT = rootIndex === -1 ? SCRIPT_ROOT : path.resolve(args[rootIndex + 1]);
const BASELINE_PATH = path.join(ROOT, ".claude/config/client-graph-baseline.json");
const TSCONFIG_PATH = path.join(ROOT, "apps/web/tsconfig.json");

const jsonIndex = args.indexOf("--json");
const jsonOut = jsonIndex === -1 ? null : args[jsonIndex + 1];

function trackedSourceFiles() {
  const output = execFileSync("git", ["ls-files", "-z", "--", "apps/web/src", ":(glob)packages/*/src/**"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return output.split("\0").filter(Boolean).map((file) => path.join(ROOT, file));
}

function readBaseline() {
  try {
    const parsed = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
    return Array.isArray(parsed.offenders) ? parsed.offenders.map((entry) => entry.file) : [];
  } catch {
    return [];
  }
}

const startedAt = Date.now();
const result = auditClientGraph({ repoRoot: ROOT, tsconfigPath: TSCONFIG_PATH, files: trackedSourceFiles() });
const comparison = compareWithBaseline({ ...result, baselineFiles: readBaseline() });
const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);

if (jsonOut) fs.writeFileSync(path.resolve(jsonOut), `${JSON.stringify(result, null, 2)}\n`);

console.log(`client-graph-audit: "use client" ${result.clientFiles.length} 件を走査し、重い依存に届くファイルは ${result.offenders.length} 件 (${seconds} 秒)`);

if (args.includes("--write-baseline")) {
  const current = new Map(result.offenders.map((offender) => [offender.file, offender]));
  const kept = readBaseline().filter((file) => current.has(file)).sort();
  const body = {
    version: 1,
    description: "重い依存 (全指標 registry・全テーマ定義・GIS 原典処理) に値の import で届く既存の \"use client\" ファイル。縮小専用: 足すのではなく経路を断つ。検査は .claude/scripts/audit/client-graph-audit.mjs。",
    offenders: kept.map((file) => ({ file, target: current.get(file).target })),
  };
  if (comparison.added.length > 0) {
    console.error(`✗ baseline に無い ${comparison.added.length} 件があるので baseline を書かない。経路を断つか、このまま検査を落として直す:`);
  } else {
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(body, null, 2)}\n`);
    console.log(`baseline を ${kept.length} 件に更新した (縮小のみ)。`);
  }
}

for (const offender of comparison.added) {
  console.error(`✗ 増加: ${offender.file}\n    経路: ${offender.chain.join(" → ")}`);
}
if (comparison.blind) {
  console.error("✗ baseline に既存の経路があるのに 1 件も検出できなかった。import の解決 (tsconfig・paths) が壊れている疑い。");
}
if (comparison.stale.length > 0) {
  console.warn(`! baseline にあるが、もう届かなくなった ${comparison.stale.length} 件 (縮められる: --write-baseline):`);
  for (const file of comparison.stale) console.warn(`    ${file}`);
}

const failed = comparison.added.length > 0 || comparison.blind || result.clientFiles.length === 0;
if (result.clientFiles.length === 0) console.error('✗ "use client" ファイルを 1 件も見つけられなかった。走査範囲が壊れている。');
if (failed) {
  console.error(`\n失敗: 増加 ${comparison.added.length} 件。経路の上のどこかで、重い依存を持つ barrel ではなく個別のファイルから import するか、next/dynamic で遅延させる。`);
  process.exit(1);
}
console.log("OK: baseline からの増加なし。");
