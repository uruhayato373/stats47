import assert from "node:assert/strict";
import { test } from "node:test";

import { findStaleDataYears } from "../stale-data-years.mjs";

const latest = new Map([
  ["income", "2024"],
  ["rent", "2023"],
]);

test("図の年が指標の最新年より古い公開記事を、遅れの大きい順に出す", () => {
  const out = findStaleDataYears(
    [
      { slug: "a", title: "A", published: true, rankingRefs: [{ rankingKey: "income", year: "2023" }] },
      { slug: "b", title: "B", published: true, rankingRefs: [{ rankingKey: "income", year: "2020" }, { rankingKey: "rent", year: "2023" }] },
    ],
    latest,
  );
  assert.deepEqual(out.map((x) => x.slug), ["b", "a"]);
  assert.deepEqual(out[0].stale, [{ rankingKey: "income", articleYear: "2020", latestYear: "2024" }]);
});

test("下書き・年の無い参照・最新年の分からない指標は判定しない (古いと決めつけない)", () => {
  const out = findStaleDataYears(
    [
      { slug: "draft", published: false, rankingRefs: [{ rankingKey: "income", year: "2001" }] },
      { slug: "link-only", published: true, rankingRefs: [{ rankingKey: "income" }] },
      { slug: "unknown", published: true, rankingRefs: [{ rankingKey: "no-item", year: "2001" }] },
      { slug: "fresh", published: true, rankingRefs: [{ rankingKey: "rent", year: "2023" }] },
    ],
    latest,
  );
  assert.deepEqual(out, []);
});
