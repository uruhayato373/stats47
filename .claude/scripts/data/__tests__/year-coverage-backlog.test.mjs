// CYCLE-HEALTH-01 (2026-09-26): 年カバレッジ監査の指摘を自動起票する。開いているカードは 1 枚だけ・処理済みでないと閉じない
import { test } from "node:test";
import assert from "node:assert/strict";

import { planYearCoverageCard, unhandledKeys } from "../lib/year-coverage-backlog.mjs";

const row = (key, configYears, estatNonNullYears, verdict = "extend-candidate") => ({
  key, statsDataId: "0000010101", configYears, estatNonNullYears, verdict,
  availableYearCodes: Array.from({ length: estatNonNullYears }, (_, i) => String(2000 + i)),
});

test("年数差の大きい順に 10 件まで、単年確定と by-design は載せない", () => {
  const results = Object.fromEntries([
    row("small-gap", 1, 2), row("big-gap", 1, 40), row("confirmed", 1, 1, "confirmed-single-year"), row("skipped", 1, 30),
    ...Array.from({ length: 12 }, (_, i) => row(`mid-${String(i).padStart(2, "0")}`, 1, 5)),
  ].map((r) => [r.key, r]));
  const card = planYearCoverageCard({ results, openIds: [], byDesign: { skipped: { note: "定義替え" } }, today: "2026-09-26" });
  assert.equal(card.id, "YEAR-COV-20260926");
  assert.equal(card.keys.length, 10);
  assert.equal(card.keys[0], "big-gap");
  assert.ok(!card.keys.includes("confirmed") && !card.keys.includes("skipped") && !card.keys.includes("small-gap"));
  assert.match(card.markdown, /\[検証:npx tsx .claude\/scripts\/data\/assert-year-coverage-batch.ts /);
});

test("開いている YEAR-COV カードがあれば起票しない", () => {
  const results = { a: row("a", 1, 5) };
  assert.equal(planYearCoverageCard({ results, openIds: ["YEAR-COV-20260919"], byDesign: {}, today: "2026-09-26" }), null);
});

test("単年のまま・config から消えた key は未処理、複数年・all・by-design は処理済み", () => {
  const counts = { single: 1, multi: 5, all: null };
  const left = unhandledKeys(["single", "multi", "all", "gone", "kept"], {
    byDesign: { kept: { note: "系列が途中で定義替え" } },
    yearCountOf: (k) => (k in counts ? counts[k] : undefined),
  });
  assert.deepEqual(left, ["single", "gone"]);
});
