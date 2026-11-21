// CYCLE-HEALTH-01 (2026-09-26): 年カバレッジ監査の指摘を自動起票する。開いているカードは 1 枚だけ・処理済みでないと閉じない
import { test } from "node:test";
import assert from "node:assert/strict";

import { planYearCoverageCard, unhandledKeys } from "../lib/year-coverage-backlog.mjs";

const row = (key, configYears, estatNonNullYears, verdict = "extend-candidate") => ({
  key, statsDataId: "0000010101", configYears, estatNonNullYears, verdict,
  availableYearCodes: Array.from({ length: estatNonNullYears }, (_, i) => String(2000 + i)),
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
