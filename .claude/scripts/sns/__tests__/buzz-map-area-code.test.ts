import assert from "node:assert/strict";
import test from "node:test";

import { toBuzzMapAreaCode } from "../lib/buzz-map-area-code";

test("都道府県は R2 の 5 桁コードを描画側の 2 桁コードにする", () => {
  assert.equal(toBuzzMapAreaCode("45000", "pref"), "45");
  assert.equal(toBuzzMapAreaCode("01000", "pref"), "01");
});

test("市区町村は N03_007 の 5 桁コードをそのまま使う", () => {
  assert.equal(toBuzzMapAreaCode("13101", "muni"), "13101");
});
