#!/usr/bin/env node
/** Guard executable sources/configs, including tests/workflows, using exact-file occurrence ceilings.
 * --init creates the baseline once; migrations must remove/shrink entries afterwards.
 * HEAD/parent/merge-base constrain growth; --base adds an explicit review base.
 * Credential files are excluded before reading the git tracked/nonignored source inventory.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, lstatSync } from "node:fs";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const ALLOWLIST = ".claude/config/r2-entrypoint-baseline.json";
const ENTRY = new Set([
  "packages/r2-storage/src/keys.ts",
  ".claude/scripts/lib/r2-keys.mjs",
  "packages/r2-storage/src/scripts/r2-key-classes.ts",
  "packages/r2-storage/src/lib/clients/private-r2-store.mjs",
  "packages/r2-storage/src/lib/clients/get-s3-client.ts",
]);
const LITERALS = ["stats", "ranking", "origin", "s3Client"];

export function isSource(path) {
  // The baseline stores source paths (which may themselves contain a guarded prefix), not R2 calls.
  if (path === ALLOWLIST) return false;
  if (/^\.env(?:\.|$)/.test(basename(path)) || /(?:^|\/)node_modules\//.test(path)) return false;
  // JSON under data/state is recorded evidence, not executable configuration. TS metrics remain checked.
  if (/^(data|\.claude\/(?:state|memory))\//.test(path) && !/\.[cm]?[jt]sx?$/.test(path)) return false;
  return /\.(?:[cm]?[jt]sx?|json|ya?ml|toml|sh|py|example)$/.test(path) && !/(?:package-lock|npm-shrinkwrap)\.json$/.test(path);
}

export function literalCounts(text) {
  return {
    stats: [...text.matchAll(/app\/stats\//g)].length,
    ranking: [...text.matchAll(/app\/ranking\//g)].length,
    origin: [...text.matchAll(/storage\.stats47\.jp/gi)].length,
    s3Client: [...text.matchAll(/\bnew\s+S3Client\s*\(/g)].length,
  };
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
    const counts = literalCounts(text);
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
    throw new Error("Usage: check-r2-entrypoint.mjs [--init | --base ref]");
  }
  if (init) {
    if (existsSync(resolve(ROOT, ALLOWLIST))) throw new Error("Baseline already exists; --init refuses to overwrite it");
    const exceptions = {};
    for (const { path, text } of sourceInventory().sort((a, b) => a.path.localeCompare(b.path))) {
      if (ENTRY.has(path)) continue;
      const counts = literalCounts(text);
      if (LITERALS.some((key) => counts[key])) {
        exceptions[path] = { ...counts, reason: "2026-11-15 現状 (段 3 で入口へ載せ替える)" };
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
