import assert from "node:assert/strict";
import test from "node:test";

import { ranksFromResults } from "../kdp-search-ranks.mjs";

test("順位は重複する ASIN を 1 件に数え、自分の本だけを返す", () => {
  const ids = new Map([["B2", "K-S1-02"]]);
  assert.deepEqual(ranksFromResults(["B1", "B1", "B2", "B3"], ids), [{ id: "K-S1-02", asin: "B2", rank: 2 }]);
  assert.deepEqual(ranksFromResults(["B1"], ids), []);
});
