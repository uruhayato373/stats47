#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const BASELINE = process.env.MAINTENANCE_DEBT_BASELINE || path.join(ROOT, ".claude/config/maintenance-debt-baseline.json");
const SCAN_ROOTS = ["apps", "packages", ".claude", ".github"].map((item) => path.join(ROOT, item));
const TEXT_EXT = /\.(?:[cm]?[jt]sx?|md|ya?ml|json|sh|css|scss)$/i;
const EXCLUDED = new Set(["node_modules", ".next", "dist", "coverage", ".git", "state"]);

function rel(file) { return path.relative(ROOT, file).split(path.sep).join("/"); }
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && EXCLUDED.has(entry.name)) return [];
    // ガードの baseline ファイル群は「debt の引用」であって debt ではない (自己参照検知の防止)
    if (!entry.isDirectory() && /-baseline\.json$/.test(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : TEXT_EXT.test(entry.name) ? [file] : [];
  });
}
function finding(code, file, line, message, content) {
  return { code, file: rel(file), line, message, content: content.trim().slice(0, 200) };
}
// baseline key は行番号を含めない「内容キー」(v2)。行番号キー (v1) は無関係な追記でも
// 行ズレ churn を起こし、「落ちたら再生成」の儀式化 = ガード形骸化を招いた (2026-07-14 教訓)。
// 同一内容が複数行ある場合は件数で ratchet する (count 超過 = 新規)。
function key(item) { return `${item.code}:${item.file}:${item.content}`; }
function countByKey(findings) {
  const counts = {};
  for (const f of findings) { const k = key(f); counts[k] = (counts[k] ?? 0) + 1; }
  return counts;
}
function loadBaselineV2() {
  if (!fs.existsSync(BASELINE)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
    if (parsed.version === 2 && parsed.findings && !Array.isArray(parsed.findings)) return parsed.findings;
  } catch { /* fallthrough */ }
  return null; // v1 (行番号キー) / 破損 → 移行が必要
}

function inspect(file) {
  const results = [];
  const relative = rel(file);
  const isTest = /(?:^|\/)(?:__tests__|tests?|fixtures?)(?:\/|$)|\.(?:spec|test)\.[cm]?[jt]sx?$/.test(relative);
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((line, index) => {
    const number = index + 1;
    const debt = line.match(/\b(TODO|FIXME|HACK)\b/i);
    if (debt && !/(?:#\d+|https?:\/\/|\b(?:MC|AFF|EXP|TODO)-?\d+\b|docs\/todo\/|remove(?:d)?\s+(?:when|after|by)|期限|削除条件)/i.test(line))
      results.push(finding("UNTRACKED_DEBT", file, number, `${debt[1].toUpperCase()} に issue/backlog/削除条件がない`, line));

    const legacy = line.match(/\b(legacy|deprecated|temporary|remove after)\b/i);
    if (legacy && !/(?:#\d+|https?:\/\/|\b(?:MC|AFF|EXP|TODO)-?\d+\b|remove(?:d)?\s+(?:when|after|by)|until\b|期限|削除条件|互換|compat|superseded)/i.test(line))
      results.push(finding("UNBOUNDED_LEGACY", file, number, `${legacy[1]} に期限・削除条件がない`, line));

    if (!isTest && !relative.startsWith(".github/workflows/") && !relative.endsWith("CLAUDE.md") && !relative.endsWith("AGENTS.md") &&
        /\bwrangler\s+d1\b|\bgetDrizzle\s*\(|@stats47\/database\/server/.test(line))
      results.push(finding("D1_RUNTIME_RETURN", file, number, "廃止済みの永続D1 runtime操作候補", line));
  });
  return results;
}

function collect() {
  const files = SCAN_ROOTS.flatMap(walk);
  return { files: files.length, findings: files.flatMap(inspect) };
}

function main() {
  const result = collect();
  const counts = countByKey(result.findings);

  if (process.argv.includes("--write-baseline")) {
    // ratchet 規律: 再生成で findings を「増やす」には --allow-growth の明示が必要。
    // 内容キー (v2) では無関係な編集による行ズレ churn が起きないため、通常の再生成は
    // 減る一方 (実修正 / ファイル削除)。増える = 本当に新しい debt を黙認しようとしている。
    // 原則はルール修正 or 実修正が先。吸収するならコミットメッセージに理由を書く。
    const prev = loadBaselineV2();
    if (prev) {
      const added = Object.entries(counts).filter(([k, n]) => n > (prev[k] ?? 0));
      const removed = Object.keys(prev).filter((k) => !(counts[k] > 0)).length;
      if (added.length && !process.argv.includes("--allow-growth")) {
        console.error(`✗ baseline への追加 ${added.length} 件を拒否 — 吸収には --allow-growth を明示し、コミットメッセージに理由を書く (原則は実修正/ルール修正が先):`);
        added.slice(0, 20).forEach(([k, n]) => console.error(`  + ${k.slice(0, 160)} (${prev[k] ?? 0}→${n})`));
        if (added.length > 20) console.error(`  … 他 ${added.length - 20} 件`);
        process.exitCode = 1;
        return;
      }
      console.log(`baseline diff: +${added.length} / -${removed}`);
    } else {
      console.log("baseline v1 (行番号キー) → v2 (内容キー) へ移行 — 行ズレ churn を根絶");
    }
    const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
    fs.writeFileSync(BASELINE, `${JSON.stringify({ version: 2, findings: sorted }, null, 2)}\n`);
    console.log(`✓ maintenance debt baseline 更新: ${rel(BASELINE)} (${result.findings.length} findings)`);
    return;
  }

  const known = process.argv.includes("--baseline") ? (loadBaselineV2() ?? {}) : {};
  // 内容キーごとに baseline 件数を超過した分だけを新規として報告する
  const seen = {};
  const fresh = result.findings.filter((item) => {
    const k = key(item);
    seen[k] = (seen[k] ?? 0) + 1;
    return seen[k] > (known[k] ?? 0);
  });
  if (process.argv.includes("--json")) console.log(JSON.stringify({ ...result, newFindings: fresh }, null, 2));
  else if (!fresh.length) console.log(`✓ maintenance debt 悪化なし — ${result.files} files / known ${result.findings.length}`);
  else {
    console.error(`✗ maintenance debt: ${fresh.length} new findings`);
    fresh.forEach((item) => console.error(`  [${item.code}] ${item.file}:${item.line} ${item.message}`));
  }
  process.exitCode = fresh.length ? 1 : 0;
}

if (require.main === module) main();
module.exports = { collect };
