#!/usr/bin/env node
/**
 * `.claude/scripts` にテストが増えていないかを数える (SCRIPTS-TO-PACKAGES-02・2026-11-19 オーナー判断)。
 *
 * 決まり: テストが要るほどのロジックは packages に置き、テストもそこに置く。`.claude/scripts` は packages を
 * 呼ぶ薄い入口になる。`.claude/scripts` に新しいテストを置けるのは、エージェントが居るから存在する基盤
 * (hook・セッションの検知・agent/skill の整合検査・CI の契約の検査など) だけ。
 *
 * 数えるもの: `.claude/scripts/<領域>/**` の `*.test.{mjs,cjs,js,ts,tsx}`。
 * 基準 `.claude/config/claude-scripts-test-baseline.json`:
 *   - domains: 領域ごとの上限。縮小専用で、HEAD・親 commit・origin/develop との merge-base より増えたら失敗する。
 *   - harness: エージェント基盤のテスト (path → 理由)。領域の本数に数えない。行は足せるが、置ける領域は
 *     harnessDomains だけ。
 * --init は基準が無いときだけ作る。--shrink は、テストを移して減った分だけ基準を縮める (増やす書き換えはしない)。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const BASELINE = ".claude/config/claude-scripts-test-baseline.json";
const SELF_TEST = ".claude/scripts/lib/__tests__/check-claude-scripts-tests.test.mjs";

/** テストのファイルなら領域 (最上位のディレクトリ) を返す。それ以外は null */
export function testDomain(path) {
  const match = /^\.claude\/scripts\/([^/]+)\/.+\.test\.(?:[cm]?[jt]sx?)$/.exec(path);
  return match ? match[1] : null;
}

/** 基盤の許可リストに無いテストを、領域ごとに数える */
export function countByDomain(paths, harness = {}) {
  const counts = {};
  for (const path of paths) {
    const domain = testDomain(path);
    if (!domain || harness[path]) continue;
    counts[domain] = (counts[domain] ?? 0) + 1;
  }
  return counts;
}

/** 今の本数を基準と比べる。errors は人に読ませる 1 行ずつ */
export function audit(paths, baseline, previous) {
  const errors = [];
  const { domains = {}, harness = {}, harnessDomains = [] } = baseline;
  const counts = countByDomain(paths, harness);
  const present = new Set(paths);
  for (const [domain, count] of Object.entries(counts)) {
    const rule = domains[domain];
    if (!rule) errors.push(`.claude/scripts/${domain}: テストが ${count} 本ある (基準に無い)。対象のロジックを packages へ移し、テストもそこに置く`);
    else if (count > rule.count) errors.push(`.claude/scripts/${domain}: テストが増えた (${rule.count} → ${count})。対象のロジックを packages へ移し、テストもそこに置く`);
    else if (count < rule.count) errors.push(`.claude/scripts/${domain}: 減った分だけ基準を縮める (${rule.count} → ${count})`);
  }
  for (const [domain, rule] of Object.entries(domains)) {
    if (!counts[domain]) errors.push(`.claude/scripts/${domain}: もうテストが無いので基準から外す`);
    if (!rule.reason?.trim() || !Number.isInteger(rule.count) || rule.count < 1) errors.push(`.claude/scripts/${domain}: 基準の行が不正 (count と reason が要る)`);
  }
  for (const [path, reason] of Object.entries(harness)) {
    const domain = testDomain(path);
    if (!domain) errors.push(`${path}: 基盤の許可リストに載せられるのは .claude/scripts のテストだけ`);
    else if (!harnessDomains.includes(domain)) errors.push(`${path}: 基盤のテストを置ける領域は ${harnessDomains.join("・")} だけ`);
    if (typeof reason !== "string" || !reason.trim()) errors.push(`${path}: 基盤の許可リストの行に理由が要る`);
    if (!present.has(path)) errors.push(`${path}: もう無いので基盤の許可リストから外す`);
  }
  if (previous) {
    for (const [domain, rule] of Object.entries(domains)) {
      const old = previous.domains?.[domain];
      if (!old || rule.count > old.count) errors.push(`.claude/scripts/${domain}: 基準は縮小専用 (行の追加・本数の増加は禁止)`);
    }
    for (const domain of harnessDomains) {
      if (!previous.harnessDomains?.includes(domain)) errors.push(`harnessDomains: ${domain} を足せない (基盤の領域は縮小専用)`);
    }
  }
  return errors;
}

/** 減った分だけ基準を縮める。増えた領域と新しい領域はそのまま残し、検査に落とさせる */
export function shrink(paths, baseline) {
  const present = new Set(paths);
  const harness = Object.fromEntries(Object.entries(baseline.harness ?? {}).filter(([path]) => present.has(path)));
  const counts = countByDomain(paths, harness);
  const domains = {};
  for (const [domain, rule] of Object.entries(baseline.domains ?? {})) {
    const count = Math.min(rule.count, counts[domain] ?? 0);
    if (count > 0) domains[domain] = { ...rule, count };
  }
  return { ...baseline, harness, domains };
}

function testPaths() {
  const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z", "--", ".claude/scripts"], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return [...new Set(out.split("\0").filter(Boolean))].filter((path) => testDomain(path) && existsSync(resolve(ROOT, path)));
}

export function main(args = process.argv.slice(2)) {
  const paths = testPaths();
  if (args[0] === "--init") {
    if (existsSync(resolve(ROOT, BASELINE))) throw new Error("基準は既にある。--init は上書きしない");
    const harness = { [SELF_TEST]: "この検査 (品質のゲート) 自身のテスト" };
    const domains = {};
    for (const [domain, count] of Object.entries(countByDomain(paths, harness)).sort(([a], [b]) => a.localeCompare(b))) {
      domains[domain] = { count, reason: "2026-11-19 の時点で残っていたテスト。対象のロジックを packages へ移して減らす (SCRIPTS-TO-PACKAGES-02)" };
    }
    writeFileSync(resolve(ROOT, BASELINE), JSON.stringify({
      policy: "縮小専用。テストが要るロジックは packages に置く。.claude/scripts に新しいテストを置けるのはエージェント基盤 (harness) だけ",
      harnessDomains: ["audit", "backlog-loop", "ci", "lib", "management", "model-usage"],
      harness,
      domains,
    }, null, 2) + "\n", { flag: "wx" });
    console.log(`基準を作った: ${Object.keys(domains).length} 領域`);
    return;
  }
  const loaded = JSON.parse(readFileSync(resolve(ROOT, BASELINE), "utf8"));
  const baseline = args[0] === "--shrink" ? shrink(paths, loaded) : loaded;
  if (args[0] === "--shrink") writeFileSync(resolve(ROOT, BASELINE), JSON.stringify(baseline, null, 2) + "\n");
  const git = (a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const bases = new Set(["HEAD", "HEAD^"]);
  try { bases.add(git(["merge-base", "HEAD", "origin/develop"])); } catch { /* remote の無い checkout */ }
  const previous = [];
  for (const base of bases) {
    try { git(["cat-file", "-e", `${base}:${BASELINE}`]); } catch { continue; }
    previous.push(JSON.parse(git(["show", `${base}:${BASELINE}`])));
  }
  const errors = [...new Set([undefined, ...previous].flatMap((p) => audit(paths, baseline, p)))];
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  const total = Object.values(baseline.domains).reduce((sum, rule) => sum + rule.count, 0);
  console.log(JSON.stringify({ tests: paths.length, counted: total, harness: Object.keys(baseline.harness).length, pass: errors.length === 0, failures: errors.length }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
