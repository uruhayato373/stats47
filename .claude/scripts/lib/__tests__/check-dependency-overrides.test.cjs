"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-dependency-overrides.cjs");
const { inspectDependencies } = require(CHECKER);
// 2026-10-10 の修正前 (commit 7ae184cb8) の package.json と lock から、overrides と next・react・react-dom に関わる項目だけを抜粋したもの。
const BEFORE_FIX = require("./fixtures/dependency-overrides/7ae184cb8.json");

const codesFor = (findings, name) => new Set(findings.filter((item) => item.package === name).map((item) => item.code));

test("2026-10-10 の修正前 (7ae184cb8) は next の 2 版混在と overrides の取り残しで落ちる", () => {
  const findings = inspectDependencies(BEFORE_FIX);
  assert.deepEqual(
    codesFor(findings, "next"),
    new Set(["SINGLETON_MULTIPLE_VERSIONS", "OVERRIDE_OUTSIDE_RANGE", "LOCK_OUTSIDE_OVERRIDE"]),
  );
  assert.ok(codesFor(findings, "sharp").has("OVERRIDE_OUTSIDE_RANGE"), "sharp 0.35.4 の override は ^0.35.5 を満たさない");
});

test("overrides を workspace に揃えた fixture は通る (検査が版の食い違いだけに反応する)", () => {
  const fixed = structuredClone(BEFORE_FIX);
  fixed.rootPackage.overrides.next = "15.5.27";
  fixed.rootPackage.overrides.sharp = "0.35.5";
  for (const [key, entry] of Object.entries(fixed.lockPackages)) {
    if (key.endsWith("node_modules/next")) entry.version = "15.5.27";
    if (key.endsWith("node_modules/sharp")) entry.version = "0.35.5";
    if (key.endsWith("node_modules/postcss")) entry.version = "8.5.26";
  }
  assert.deepEqual(inspectDependencies(fixed), []);
});

test("override を足しても lock が古い版のまま (2026-10-21 の vite 8.2.2) なら LOCK_OUTSIDE_OVERRIDE", () => {
  const input = {
    rootPackage: { devDependencies: { vite: "^8.2.4" }, overrides: { vite: "8.2.4" } },
    workspacePackages: { ".": { devDependencies: { vite: "^8.2.4" } } },
    lockPackages: { "node_modules/vite": { version: "8.2.2" } },
  };
  assert.deepEqual(inspectDependencies(input).map((item) => item.code), ["LOCK_OUTSIDE_OVERRIDE"]);
  input.lockPackages["node_modules/vite"].version = "8.2.4";
  assert.deepEqual(inspectDependencies(input), []);
});

test("\"$name\" 参照はルートの依存指定に解決し、file: の差し替えは版比較の対象外", () => {
  const input = {
    rootPackage: {
      devDependencies: { vite: "^8.2.4", "image-size": "file:shims/image-size" },
      overrides: { vite: "$vite", "image-size": "$image-size", missing: "$missing" },
    },
    workspacePackages: { "packages/a": { devDependencies: { vite: "^8.0.0" } } },
    lockPackages: { "node_modules/vite": { version: "8.2.4" }, "node_modules/image-size": { version: "0.0.0" } },
  };
  assert.deepEqual(inspectDependencies(input).map((item) => `${item.code}:${item.package}`), ["OVERRIDE_UNRESOLVED:missing"]);
});

test("現在のリポジトリは通る", () => {
  const result = spawnSync(process.execPath, [CHECKER], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
