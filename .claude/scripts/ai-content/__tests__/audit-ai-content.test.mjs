import assert from "node:assert/strict";
import test from "node:test";

import { auditRow } from "../audit-ai-content.mjs";

function rowWithCommentary(count) {
  return {
    rankingKey: "sparse-prefecture-fixture",
    insights: "観測対象の範囲だけを比較し、未収録の地域を全国傾向へ一般化しません。".repeat(4),
    regionalAnalysis: "地域別の収録数を併記し、対象数が異なる集団を同列に扱いません。".repeat(4),
    faq: { items: [{ question: "何を比較しますか", answer: "収録された観測値だけを比較します。" }] },
    prefectureCommentary: {
      items: Array.from({ length: count }, () => ({ commentary: "観測値と順位を示し、未収録の地域を補完しない説明です。".repeat(2) })),
    },
  };
}

test("pref-countは実データの疎なpartition件数と一致すれば警告しない", () => {
  const result = auditRow(rowWithCommentary(11), {
    valueContext: { count: 11, byAreaName: new Map(), allowed: [], min: 0, max: 100, unitMult: 1 },
  });
  assert.equal(result.warns.some((finding) => finding.code === "pref-count"), false);
});

test("pref-countは実データ件数と生成件数が違えば警告する", () => {
  const result = auditRow(rowWithCommentary(10), {
    valueContext: { count: 11, byAreaName: new Map(), allowed: [], min: 0, max: 100, unitMult: 1 },
  });
  assert.equal(result.warns.some((finding) => finding.code === "pref-count"), true);
});
