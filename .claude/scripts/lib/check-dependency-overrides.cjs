#!/usr/bin/env node
"use strict";

/**
 * ルートの `overrides` と各 workspace の依存の版の食い違いを、package.json と package-lock.json だけで検査する。
 * (DEPS-OVERRIDES-DRIFT-GATE-01)
 *
 * 2026-10-10: dependabot が apps/web などの next だけを 15.5.27 に上げ、ルートの overrides (next 15.5.24・sharp 0.35.4)
 * が古いまま残った。next が 2 つの版で入り、PR #1119 の本番ビルドの /404 事前描画が落ちた (修正前 = commit 7ae184cb8)。
 * 2026-10-21: overrides に `"vite": "8.2.4"` を足しても npm install は lock の 8.2.2 を残し、`npm ls` が invalid を出すだけで
 * exit 0 だった (PR #1165)。
 *
 * 検査:
 *   SINGLETON_MULTIPLE_VERSIONS — next・react・react-dom (1 つの版でしか動かない部品) が lock に 2 つ以上の版で入っている
 *   OVERRIDE_OUTSIDE_RANGE      — ルート overrides の版が、その依存を持つ workspace の指定範囲を満たさない
 *   LOCK_OUTSIDE_OVERRIDE       — lock に入っている版が overrides を満たさない (= `npm ls` の invalid を lock だけで見る)
 *
 * 入口: `node .claude/scripts/lib/check-dependency-overrides.cjs [--json]`
 * 登録: .claude/config/quality-gates.json (id: dependency-overrides) → preflight:pr と pr-quality-check.yml
 */

const fs = require("node:fs");
const path = require("node:path");
const semver = require("semver");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const SINGLETON_PACKAGES = ["next", "react", "react-dom"];
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

/** `$name` 参照をルートの依存指定へ解決する。解決できなければ null。 */
function resolveOverrideSpec(spec, rootPackage) {
  if (typeof spec !== "string") return null;
  if (!spec.startsWith("$")) return spec;
  const name = spec.slice(1);
  for (const field of DEPENDENCY_FIELDS) {
    const value = rootPackage[field]?.[name];
    if (typeof value === "string") return value;
  }
  return null;
}

function lockPackageName(key) {
  const index = key.lastIndexOf("node_modules/");
  return index === -1 ? null : key.slice(index + "node_modules/".length);
}

/** 版 (または範囲) の override がこの範囲と両立するか。 */
function overrideFitsRange(overrideSpec, range) {
  if (semver.valid(overrideSpec)) return semver.satisfies(overrideSpec, range, { includePrerelease: true });
  return semver.intersects(overrideSpec, range, { includePrerelease: true });
}

/**
 * @param {{ rootPackage: Record<string, any>, workspacePackages: Record<string, Record<string, any>>, lockPackages: Record<string, { version?: string, link?: boolean }> }} input
 * @returns {Array<{ code: string, package: string, message: string }>}
 */
function inspectDependencies({ rootPackage, workspacePackages, lockPackages }) {
  const findings = [];
  const versionsByName = new Map();
  for (const [key, entry] of Object.entries(lockPackages)) {
    const name = lockPackageName(key);
    if (!name || entry?.link || typeof entry?.version !== "string") continue;
    const list = versionsByName.get(name) ?? [];
    list.push({ key, version: entry.version });
    versionsByName.set(name, list);
  }

  for (const name of SINGLETON_PACKAGES) {
    const versions = [...new Set((versionsByName.get(name) ?? []).map((item) => item.version))].sort();
    if (versions.length > 1) {
      findings.push({
        code: "SINGLETON_MULTIPLE_VERSIONS",
        package: name,
        message: `${name} が lock に ${versions.length} 版ある: ${versions.join(", ")}`,
      });
    }
  }

  for (const [name, rawSpec] of Object.entries(rootPackage.overrides ?? {})) {
    // ネストした override (親パッケージ配下だけの差し替え) は対象外。トップレベルの文字列指定だけを見る。
    if (typeof rawSpec !== "string") continue;
    const spec = resolveOverrideSpec(rawSpec, rootPackage);
    if (!spec) {
      findings.push({ code: "OVERRIDE_UNRESOLVED", package: name, message: `overrides.${name}=${rawSpec} の参照先がルートの依存に無い` });
      continue;
    }
    // file: / npm: / git などの差し替えは版の比較ができないので対象外 (例: image-size の無効化 shim)。
    if (!semver.validRange(spec)) continue;

    for (const [workspace, manifest] of Object.entries(workspacePackages)) {
      for (const field of DEPENDENCY_FIELDS) {
        const range = manifest[field]?.[name];
        if (typeof range !== "string" || !semver.validRange(range)) continue;
        if (!overrideFitsRange(spec, range)) {
          findings.push({
            code: "OVERRIDE_OUTSIDE_RANGE",
            package: name,
            message: `overrides.${name}=${spec} が ${workspace}/package.json の ${field}.${name}=${range} を満たさない`,
          });
        }
      }
    }

    for (const { key, version } of versionsByName.get(name) ?? []) {
      if (!semver.satisfies(version, spec, { includePrerelease: true })) {
        findings.push({
          code: "LOCK_OUTSIDE_OVERRIDE",
          package: name,
          message: `package-lock.json の ${key}=${version} が overrides.${name}=${spec} を満たさない`,
        });
      }
    }
  }
  return findings;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function workspaceDirectories(rootPackage) {
  const output = [];
  for (const pattern of rootPackage.workspaces ?? []) {
    if (typeof pattern !== "string" || !pattern.endsWith("/*")) continue;
    const parent = pattern.slice(0, -2);
    let entries = [];
    try { entries = fs.readdirSync(path.join(ROOT, parent), { withFileTypes: true }); } catch {}
    for (const entry of entries) {
      if (entry.isDirectory() && fs.existsSync(path.join(ROOT, parent, entry.name, "package.json"))) {
        output.push(`${parent}/${entry.name}`);
      }
    }
  }
  return output.sort();
}

function loadRepository() {
  const rootPackage = readJson(path.join(ROOT, "package.json"));
  const workspacePackages = { ".": rootPackage };
  for (const directory of workspaceDirectories(rootPackage)) {
    workspacePackages[directory] = readJson(path.join(ROOT, directory, "package.json"));
  }
  const lockPackages = readJson(path.join(ROOT, "package-lock.json")).packages ?? {};
  return { rootPackage, workspacePackages, lockPackages };
}

function main() {
  const findings = inspectDependencies(loadRepository());
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ findings }, null, 2));
  } else if (findings.length === 0) {
    console.log("✓ dependency overrides — overrides・workspace の範囲・lock の版が一致");
  } else {
    console.error(`✗ dependency overrides — ${findings.length} 件の食い違い`);
    for (const item of findings) console.error(`  [${item.code}] ${item.message}`);
    console.error("  直し方: ルートの overrides と各 workspace の指定を揃え、npm install で lock を作り直す。");
    console.error("  override が lock に反映されないときは、ルートの devDependencies に版を書き overrides は \"$<name>\" で参照する (commit ef8df73aa)。");
  }
  process.exitCode = findings.length === 0 ? 0 : 1;
}

if (require.main === module) main();

module.exports = { inspectDependencies, resolveOverrideSpec, SINGLETON_PACKAGES };
