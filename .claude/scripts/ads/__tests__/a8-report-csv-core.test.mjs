import assert from "node:assert/strict";
import test from "node:test";

import {
  KEY,
  resolveProgramRef,
  toResultsRecords,
} from "../lib/a8-report-csv.mjs";

test("allowlist済みprogramIdだけをstable programRefへ変換する", () => {
  const map = { s00000012345001: "ad-1" };
  assert.equal(resolveProgramRef("案件名", map, "s00000012345001"), "a8:s00000012345001");
  assert.equal(resolveProgramRef("未知案件", map, "s00000099999001"), null);
});

test("単月成果recordはprogramRefとaccount-wide scopeを保持する", () => {
  const result = toResultsRecords([{
    program: "ad-1",
    programId: "s00000012345001",
    programRef: "a8:s00000012345001",
    programRaw: "案件名",
    clicks: 10,
    conversions: 4,
    approved: 3,
    revenueYen: 6000,
  }], { singleMonth: "2026-08" });
  assert.equal(result.records[0].programRef, "a8:s00000012345001");
  assert.equal(result.records[0].scope, "account-wide");
  assert.equal(KEY.results(result.records[0]), "2026-08::a8:s00000012345001");
});

test("累計期間はprogramRefがあっても月次成果へ写さない", () => {
  const result = toResultsRecords([{
    program: "ad-1",
    programId: "s00000012345001",
    programRef: "a8:s00000012345001",
    programRaw: "案件名",
    period: "202601-202608",
  }]);
  assert.equal(result.records.length, 0);
  assert.equal(result.notAttributable.length, 1);
});
