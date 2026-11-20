import assert from "node:assert/strict";
import test from "node:test";

import { observedOnly } from "../blog-observed-values.mjs";

test("値の無い県 (null / 欠け / 非有限) は行ごと落とし、観測された 0 は残す", () => {
  const rows = [
    { areaName: "静岡県", value: 60000 },
    { areaName: "秋田県", value: 0 },
    { areaName: "京都府", value: null },
    { areaName: "大阪府" },
    { areaName: "兵庫県", value: Number.NaN },
  ];
  assert.deepEqual(observedOnly(rows).map((r) => r.areaName), ["静岡県", "秋田県"]);
});
