import assert from "node:assert/strict";
import test from "node:test";

import { mentionsAffirmatively } from "../build-metric-definition-sheet.ts";

test("否定して書いた語 (法人企業数ではなく) は対象に数えず、肯定の出現は数える", () => {
  assert.equal(mentionsAffirmatively("飼養戸数は法人企業数ではなく、飼養者の戸数", "企業"), false);
  assert.equal(mentionsAffirmatively("事業所を除く集計", "事業所"), false);
  assert.equal(mentionsAffirmatively("従業者4人以上の事業所の出荷額", "事業所"), true);
  // 否定の出現と肯定の出現が両方あれば数える
  assert.equal(mentionsAffirmatively("個人ではなく企業ではない。民営の企業が対象", "企業"), true);
});
