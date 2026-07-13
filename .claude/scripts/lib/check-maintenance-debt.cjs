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
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : TEXT_EXT.test(entry.name) ? [file] : [];
  });
}
function finding(code, file, line, message) { return { code, file: rel(file), line, message }; }
function key(item) { return `${item.code}:${item.file}:${item.line}:${item.message}`; }

function inspect(file) {
  const results = [];
  const relative = rel(file);
  const isTest = /(?:^|\/)(?:__tests__|tests?|fixtures?)(?:\/|$)|\.(?:spec|test)\.[cm]?[jt]sx?$/.test(relative);
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((line, index) => {
    const number = index + 1;
    const debt = line.match(/\b(TODO|FIXME|HACK)\b/i);
    if (debt && !/(?:#\d+|https?:\/\/|\b(?:MC|AFF|EXP|TODO)-?\d+\b|docs\/todo\/|remove(?:d)?\s+(?:when|after|by)|期限|削除条件)/i.test(line))
      results.push(finding("UNTRACKED_DEBT", file, number, `${debt[1].toUpperCase()} に issue/backlog/削除条件がない`));

    const legacy = line.match(/\b(legacy|deprecated|temporary|remove after)\b/i);
    if (legacy && !/(?:#\d+|https?:\/\/|\b(?:MC|AFF|EXP|TODO)-?\d+\b|remove(?:d)?\s+(?:when|after|by)|until\b|期限|削除条件|互換|compat|superseded)/i.test(line))
      results.push(finding("UNBOUNDED_LEGACY", file, number, `${legacy[1]} に期限・削除条件がない`));

    if (!isTest && !relative.startsWith(".github/workflows/") && !relative.endsWith("CLAUDE.md") && !relative.endsWith("AGENTS.md") &&
        /\bwrangler\s+d1\b|\bgetDrizzle\s*\(|@stats47\/database\/server/.test(line))
      results.push(finding("D1_RUNTIME_RETURN", file, number, "廃止済みの永続D1 runtime操作候補"));
  });
  return results;
}

function collect() {
  const files = SCAN_ROOTS.flatMap(walk);
  return { files: files.length, findings: files.flatMap(inspect) };
}

function main() {
  const result = collect();
  if (process.argv.includes("--write-baseline")) {
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
    fs.writeFileSync(BASELINE, `${JSON.stringify({ version: 1, findings: result.findings.map(key).sort() }, null, 2)}\n`);
    console.log(`✓ maintenance debt baseline 更新: ${rel(BASELINE)} (${result.findings.length} findings)`);
    return;
  }
  const known = process.argv.includes("--baseline") && fs.existsSync(BASELINE)
    ? new Set(JSON.parse(fs.readFileSync(BASELINE, "utf8")).findings || []) : new Set();
  const fresh = result.findings.filter((item) => !known.has(key(item)));
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
