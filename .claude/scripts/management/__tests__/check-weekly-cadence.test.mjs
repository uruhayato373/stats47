import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const script = path.join(root, ".claude/scripts/management/check-weekly-cadence.mjs");

function run(date) {
  const result = spawnSync(process.execPath, [script, "--json", "--date", date], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("日曜はレビュー後に作った翌週計画を有効とする", () => {
  const result = run("2026-09-20");
  assert.equal(result.currentWeek, "2026-W38");
  assert.equal(result.planWeek, "2026-W39");
  assert.deepEqual(result.acceptedPlanWeeks, ["2026-W38", "2026-W39"]);
  assert.deepEqual(result.missingPlans, []);
});

test("月曜はその週の計画を要求する", () => {
  const result = run("2026-09-21");
  assert.equal(result.currentWeek, "2026-W39");
  assert.equal(result.planWeek, "2026-W39");
  assert.deepEqual(result.acceptedPlanWeeks, ["2026-W39"]);
  assert.deepEqual(result.missingPlans, []);
});
