import assert from "node:assert/strict";
import { test } from "node:test";

import { applyYearFreshness } from "../lib/year-freshness.mjs";

const done = { rankingKey: "room-utilization-rate", status: "done", reason: "ok", blockers: [] };

test("解説の年より新しい年が values にあれば作り直しの対象に戻す (監査は年を見ないので done のまま古い年を語り続ける)", () => {
  const entry = applyYearFreshness(done, { contentYear: "2023", dataYear: "2024" });
  assert.equal(entry.status, "needs-regen");
  assert.equal(entry.reason, "stale-year");
  assert.equal(entry.contentYear, "2023");
  assert.equal(entry.dataYear, "2024");
});

test("年が同じか、どちらかが取れないときは変えない (R2 の一時障害で全件を作り直しにしない)", () => {
  assert.equal(applyYearFreshness(done, { contentYear: "2024", dataYear: "2024" }), done);
  assert.equal(applyYearFreshness(done, { contentYear: "2024", dataYear: null }), done);
  assert.equal(applyYearFreshness(done, { contentYear: undefined, dataYear: "2024" }), done);
});

test("作り直し待ち・対象外の行は理由を上書きしない", () => {
  const pending = { ...done, status: "needs-regen", reason: "blocker", blockers: ["x"] };
  assert.equal(applyYearFreshness(pending, { contentYear: "2020", dataYear: "2024" }), pending);
});
