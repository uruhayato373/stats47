import assert from "node:assert/strict";
import test from "node:test";

import { mergeViewpointHistory, parseViewpointHistory } from "../record-theme-viewpoints.ts";

// 週次の監査は同じ週に何度も走る (再実行・手動実行)。同じ週の行を重ねると推移が水増しされるので、上書きを固定する。
test("同じ週の行は置き換え、ほかの週は残して週・規則の順に並べる", () => {
  const existing = parseViewpointHistory(
    "week,rule,hits,themes\n2026-W40,single-year-as-trend,290,46\n2026-W41,single-year-as-trend,300,47\n",
  );
  const merged = mergeViewpointHistory(existing, [
    { week: "2026-W41", rule: "single-year-as-trend", hits: 287, themes: 46 },
    { week: "2026-W41", rule: "card-chart-duplicate", hits: 27, themes: 14 },
  ]);
  assert.deepEqual(merged, [
    { week: "2026-W40", rule: "single-year-as-trend", hits: 290, themes: 46 },
    { week: "2026-W41", rule: "card-chart-duplicate", hits: 27, themes: 14 },
    { week: "2026-W41", rule: "single-year-as-trend", hits: 287, themes: 46 },
  ]);
});

test("見出し行だけのファイルは空として読む", () => {
  assert.deepEqual(parseViewpointHistory("week,rule,hits,themes\n"), []);
});
