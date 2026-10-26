"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-next-support-window.cjs");
const { parseReleaseDates, UNSUPPORTED_FLAG } = require(CHECKER);

/** OpenNext の helper.js と同じ形の期限表・next の package.json・apps/web の package.json を一時ディレクトリに作って checker を走らせる。 */
function run({ releaseDates, nextVersion, buildScript, now }) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-next-support-"));
  const table = Object.entries(releaseDates).map(([major, date]) => `    ${major}: "${date}",`).join("\n");
  const helper = path.join(directory, "helper.js");
  fs.writeFileSync(helper, `const NEXT_RELEASE_DATES = {\n${table}\n};\nexport function isNextVersionSupported() {}\n`);
  const nextPackage = path.join(directory, "next.json");
  fs.writeFileSync(nextPackage, JSON.stringify({ version: nextVersion }));
  const webPackage = path.join(directory, "web.json");
  fs.writeFileSync(webPackage, JSON.stringify({ scripts: { "workers:build": buildScript } }));
  const result = spawnSync(process.execPath, [
    CHECKER, "--helper", helper, "--next-package", nextPackage, "--web-package", webPackage, "--now", now,
  ], { encoding: "utf8" });
  fs.rmSync(directory, { recursive: true, force: true });
  return { status: result.status, lines: result.stdout.trim().split("\n"), stderr: result.stderr };
}

const PLAIN_BUILD = "opennextjs-cloudflare build --workers-runtime";

test("期限まで十分あれば「残り N 日」だけを出して通る", () => {
  const result = run({ releaseDates: { 16: "2025-10-21" }, nextVersion: "16.1.0", buildScript: PLAIN_BUILD, now: "2026-10-26" });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.lines, ["Next.js 16.1.0 (major 16) のサポート終了 2027-10-21: 残り 360 日"]);
});

test("終了日を手前に動かした期限表では 60 日を切った警告で落ちる", () => {
  const result = run({ releaseDates: { 16: "2024-12-01" }, nextVersion: "16.1.0", buildScript: PLAIN_BUILD, now: "2026-10-26" });
  assert.equal(result.status, 1);
  assert.match(result.lines[0], /残り 36 日$/);
  assert.match(result.lines[1], /60 日を切った/);
});

test("期限切れ (2026-10-21 の Next.js 15) は期限超過の警告で落ちる", () => {
  const result = run({ releaseDates: { 15: "2024-10-21" }, nextVersion: "15.5.28", buildScript: PLAIN_BUILD, now: "2026-10-26" });
  assert.equal(result.status, 1);
  assert.match(result.lines[1], /5 日過ぎている/);
});

test("回避フラグが残っていれば期限に余裕があっても毎週知らせる", () => {
  const result = run({
    releaseDates: { 16: "2025-10-21" }, nextVersion: "16.1.0", buildScript: `${PLAIN_BUILD} ${UNSUPPORTED_FLAG}`, now: "2026-10-26",
  });
  assert.equal(result.status, 1);
  assert.match(result.lines.at(-1), /外し忘れ/);
});

test("期限表に無い major は判定不能 (exit 2)", () => {
  const result = run({ releaseDates: { 15: "2024-10-21" }, nextVersion: "17.0.0", buildScript: PLAIN_BUILD, now: "2026-10-26" });
  assert.equal(result.status, 2);
});

test("導入中の OpenNext の helper.js から期限表を読める (表の書式が変わったら落ちる)", () => {
  const helper = path.join(ROOT, "node_modules/@opennextjs/aws/dist/build/helper.js");
  const dates = parseReleaseDates(fs.readFileSync(helper, "utf8"));
  assert.ok(dates && dates[15] === "2024-10-21", JSON.stringify(dates));
});
