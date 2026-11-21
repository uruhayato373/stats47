// 週のラベルを作る関数どうしの一致を確かめる基盤のテスト。
// model-usage の部品 (usage-core.mjs) は .claude に残るので、packages の部品と突き合わせるこのテストは .claude 側に置く (SCRIPTS-TO-PACKAGES-02)。
import { test } from "node:test";
import assert from "node:assert/strict";
import { jstDateOf, isoWeekOf } from "../../../../packages/ops/src/metrics/periods.mjs";

// SCRIPT-ISO-WEEK-UNIFY-01 (2026-10-21): 週のラベルを作る関数は、どこから呼んでも JST の暦日で数える。
// 以前は UTC や実行マシンの時刻で数える実装が混ざり、月曜 0〜9 時 (JST) に前の週を返していた (CI は UTC)。
test("週のラベルを作る関数は、どれも JST の暦日で数える (月曜の朝に前の週を返さない)", async () => {
  const { toIsoWeek } = await import("../../../../packages/ops/src/metrics/lib/auth.mjs");
  const { isoWeek } = await import("../../model-usage/usage-core.mjs");
  const { isoWeekOfDate } = await import("../../../../packages/ops/src/search-growth/lib/triage.mjs");
  const { currentIsoWeek } = await import("../../../../packages/ops/src/search-growth/lib/state.mjs");
  const effect = await import("../../../../packages/ops/src/effect-verdict/iso-week.mjs");
  const cases = [
    ["2026-10-18T16:30:00Z", "2026-W43"], // 月曜 01:30 JST (UTC ではまだ日曜)
    ["2026-10-18T14:30:00Z", "2026-W42"], // 日曜 23:30 JST
    ["2026-12-31T20:00:00Z", "2026-W53"], // 2027-01-01 05:00 JST。2026 年は 53 週ある
  ];
  for (const [iso, week] of cases) {
    const d = new Date(iso);
    assert.equal(isoWeekOf(jstDateOf(d)), week, `正本 ${iso}`);
    for (const [name, got] of [["auth.toIsoWeek", toIsoWeek(d)], ["usage-core.isoWeek", isoWeek(iso)], ["triage.isoWeekOfDate", isoWeekOfDate(iso)],
      ["state.currentIsoWeek", currentIsoWeek(d)], ["effect-verdict.isoWeekOf", effect.isoWeekOf(d)]]) {
      assert.equal(got, week, `${name} ${iso}`);
    }
  }
});
