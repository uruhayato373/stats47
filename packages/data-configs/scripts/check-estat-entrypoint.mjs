#!/usr/bin/env node
/** Guard executable sources/configs (including tests/workflows); prose and recorded datasets are not API implementations.
 * Exceptions are exact files with occurrence ceilings and reasons, never directory globs.
 * No baseline writer: migrations remove/shrink entries. HEAD/parent/merge-base constrain growth; --base adds an explicit review base.
 * Credential files are excluded before reading; only git's tracked/nonignored source inventory is inspected.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, lstatSync } from "node:fs";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const ALLOWLIST = ".claude/config/estat-entrypoint-baseline.json";
const ENTRY = new Set(["packages/estat-api/src/core/config/index.ts", "packages/estat-api/src/core/client/ingest-client.ts"]);
export function isSource(path) {
  if (/^\.env(?:\.|$)/.test(basename(path)) || /(?:^|\/)node_modules\//.test(path)) return false;
  // JSON under data/state is recorded evidence, not executable configuration. TS metric definitions remain checked.
  if (/^(data|\.claude\/(?:state|memory))\//.test(path) && !/\.[cm]?[jt]sx?$/.test(path)) return false;
  return /\.(?:[cm]?[jt]sx?|json|ya?ml|toml|sh|py|example)$/.test(path) && !/(?:package-lock|npm-shrinkwrap)\.json$/.test(path);
}
export function literalCounts(text) {
  return {
    url: [...text.matchAll(/api\.e-stat\.go\.jp/gi)].length,
    appId: [...text.matchAll(/\b(?:[A-Z][A-Z0-9]*_)*ESTAT_(?:APP_?ID|APPLICATION_?ID|API_KEY)\b/g)].length,
  };
}
export function auditSources(files, exceptions, previous) {
  const errors = [];
  if (previous) {
    for (const [path, rule] of Object.entries(exceptions)) {
      const old = previous[path];
      if (!old || rule.url > old.url || rule.appId > old.appId) errors.push(`${path}: allowlist may only shrink`);
    }
  }
  const seen = new Set();
  for (const { path, text } of files) {
    if (!isSource(path) || ENTRY.has(path)) continue;
    const counts = literalCounts(text);
    const rule = exceptions[path];
    if (!counts.url && !counts.appId) continue;
    seen.add(path);
    if (!rule || !rule.reason?.trim() || counts.url > rule.url || counts.appId > rule.appId) {
      errors.push(`${path}: entrypoint literals outside approved limits (url=${counts.url}, appId=${counts.appId})`);
    }
    if (rule && (counts.url < rule.url || counts.appId < rule.appId)) errors.push(`${path}: shrink stale allowlist counts`);
  }
  for (const [path, rule] of Object.entries(exceptions)) {
    if (!seen.has(path)) errors.push(`${path}: remove unused allowlist entry`);
    if (!rule.reason?.trim() || !Number.isInteger(rule.url) || !Number.isInteger(rule.appId) || rule.url < 0 || rule.appId < 0) errors.push(`${path}: invalid exception`);
  }
  return errors;
}
export function sourceInventory(root = ROOT) {
  const paths = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  return [...new Set(paths.split("\0").filter(Boolean))].filter(isSource).filter((path) =>
    existsSync(resolve(root, path)) && lstatSync(resolve(root, path)).isFile()).map((path) => ({ path, text: readFileSync(resolve(root, path), "utf8") }));
}
export function main(args = process.argv.slice(2)) {
  if (args.length && (args.length !== 2 || args[0] !== "--base" || args[1].startsWith("-"))) throw new Error("Usage: check-estat-entrypoint.mjs [--base ref]");
  const exceptions = JSON.parse(readFileSync(resolve(ROOT, ALLOWLIST), "utf8")).exceptions;
  const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const bases = new Set(["HEAD", "HEAD^"]);
  try { bases.add(git(["merge-base", "HEAD", "origin/develop"])); } catch { /* Offline checkouts may have no remote ref. */ }
  const previous = [];
  for (const base of bases) {
    // The first introduction has no prior manifest. Once present, malformed baselines fail closed.
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
