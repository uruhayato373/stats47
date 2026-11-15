#!/usr/bin/env node
/** Guard executable sources/configs, including tests/workflows, using exact-file occurrence ceilings.
 * --init creates the baseline once; migrations must remove/shrink entries afterwards.
 * HEAD/parent/merge-base constrain growth; --base adds an explicit review base.
 * Credential files are excluded before reading the git tracked/nonignored source inventory.
 */
import ts from "typescript";
import { PREF_NAMES } from "../../../.claude/scripts/lib/prefectures.cjs";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, lstatSync } from "node:fs";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const ALLOWLIST = ".claude/config/area-year-entrypoint-baseline.json";
const ENTRY = new Set([
  "packages/area/src/index.ts",
  ".claude/scripts/lib/prefectures.cjs",
  "packages/estat-api/src/stats-data/utils/extract-year-code.ts",
  ".claude/scripts/lib/year-code.mjs",
]);
const LITERALS = ["prefCheck", "cityCheck", "yearCheck", "prefectureNames"];
const names = new Set(PREF_NAMES.flatMap((name) => [name, name.replace(/[都府県]$/, "")]));

export function isSource(path) {
  if (/^\.env(?:\.|$)/.test(basename(path))) return false;
  if (/(?:^|\/)(?:node_modules|\.git)\//.test(path) || /^(?:\.agents|\.codex)\//.test(path)) return false;
  return /\.[cm]?[jt]sx?$/.test(path);
}

export function literalCounts(text, path = "source.ts") {
  const counts = { prefCheck: 0, cityCheck: 0, yearCheck: 0, prefectureNames: 0 };
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  function visit(node) {
    if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isVariableDeclaration(node) || ts.isMethodDeclaration(node)) && node.name) {
      const name = node.name.getText(source);
      if (name === 'isPrefCode5') counts.prefCheck++;
      if (name === 'isCityCode5') counts.cityCheck++;
      if (name === 'to4') counts.yearCheck++;
    }
    if (ts.isArrayLiteralExpression(node) && node.elements.length === 47) {
      const found = new Set();
      function collect(child) {
        if (ts.isStringLiteralLike(child) && names.has(child.text)) found.add(child.text.replace(/[都府県]$/, ''));
        ts.forEachChild(child, collect);
      }
      collect(node);
      if (found.size === 47) counts.prefectureNames++;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return counts;
}

export function auditSources(files, exceptions, previous) {
  const errors = [];
  if (previous) {
    for (const [path, rule] of Object.entries(exceptions)) {
      const old = previous[path];
      if (!old || LITERALS.some((key) => rule[key] > old[key])) errors.push(`${path}: allowlist may only shrink`);
    }
  }
  const seen = new Set();
  for (const { path, text } of files) {
    if (!isSource(path) || ENTRY.has(path)) continue;
    const counts = literalCounts(text, path);
    const rule = exceptions[path];
    if (!LITERALS.some((key) => counts[key])) continue;
    seen.add(path);
    if (!rule || !rule.reason?.trim() || LITERALS.some((key) => counts[key] > rule[key])) {
      errors.push(`${path}: entrypoint literals outside approved limits (${JSON.stringify(counts)})`);
    }
    if (rule && LITERALS.some((key) => counts[key] < rule[key])) errors.push(`${path}: shrink stale allowlist counts`);
  }
  for (const [path, rule] of Object.entries(exceptions)) {
    if (!seen.has(path)) errors.push(`${path}: remove unused allowlist entry`);
    if (!rule.reason?.trim() || LITERALS.some((key) => !Number.isInteger(rule[key]) || rule[key] < 0)) errors.push(`${path}: invalid exception`);
  }
  return errors;
}

export function sourceInventory(root = ROOT) {
  const paths = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  return [...new Set(paths.split("\0").filter(Boolean))].filter(isSource).filter((path) =>
    existsSync(resolve(root, path)) && lstatSync(resolve(root, path)).isFile()).map((path) => ({ path, text: readFileSync(resolve(root, path), "utf8") }));
}

export function main(args = process.argv.slice(2)) {
  const init = args.length === 1 && args[0] === "--init";
  if (!init && args.length && (args.length !== 2 || args[0] !== "--base" || args[1].startsWith("-"))) {
    throw new Error("Usage: check-area-year-entrypoint.mjs [--init | --base ref]");
  }
  if (init) {
    if (existsSync(resolve(ROOT, ALLOWLIST))) throw new Error("Baseline already exists; --init refuses to overwrite it");
    const exceptions = {};
    for (const { path, text } of sourceInventory().sort((a, b) => a.path.localeCompare(b.path))) {
      if (ENTRY.has(path)) continue;
      const counts = literalCounts(text, path);
      if (LITERALS.some((key) => counts[key])) {
        exceptions[path] = { ...counts, reason: "既存の名称配列。表示順・fixture・固有データとの対応を維持するため、この段では残置" };
      }
    }
    writeFileSync(resolve(ROOT, ALLOWLIST), JSON.stringify({
      version: 1,
      policy: "縮小専用。パス・出現数の追加は禁止。HEAD・親commit・origin/developとのmerge-baseからの増加を検査する。--baseで比較基準を追加できる。",
      exceptions,
    }, null, 2) + "\n", { flag: "wx" });
    console.log(`Initialized ${ALLOWLIST}: ${Object.keys(exceptions).length} entries`);
    return;
  }
  const exceptions = JSON.parse(readFileSync(resolve(ROOT, ALLOWLIST), "utf8")).exceptions;
  const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const bases = new Set(["HEAD", "HEAD^"]);
  try { bases.add(git(["merge-base", "HEAD", "origin/develop"])); } catch { /* Offline checkouts may have no remote ref. */ }
  const previous = [];
  for (const base of bases) {
    // First introduction has no prior manifest. Once present, malformed baselines fail closed.
    try { git(["cat-file", "-e", `${base}:${ALLOWLIST}`]); } catch { continue; }
    previous.push(JSON.parse(git(["show", `${base}:${ALLOWLIST}`])).exceptions);
  }
  if (args.length) previous.push(JSON.parse(git(["show", `${args[1]}:${ALLOWLIST}`])).exceptions);
  const files = sourceInventory();
  const errors = [...new Set([undefined, ...previous].flatMap((baseline) => auditSources(files, exceptions, baseline)))];
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  console.log(JSON.stringify({ checked: files.length, exceptions: Object.keys(exceptions).length, pass: errors.length === 0, failures: errors.length }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
