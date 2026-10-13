import assert from "node:assert/strict";
import { test } from "node:test";

import { adsenseRevenueLine, adYield28d, ADSENSE_LIVE_SINCE_WEEK } from "../lib/adsense-revenue.mjs";

/**
 * AdSense の週次収益 (2026-10-11 に手動枠で再開・ADSENSE-RESTART-01)。
 * 守りたいのは「配信していない週は ¥0 と言い切る」と「再開後に取れなかった週を 0 円にしない」の区別。
 */
const HISTORY = [
  { week: "2026-W33", earnings: "118.00", page_views: "3152", impressions: "3318", viewability: "0.4852" },
  { week: "2026-W43", earnings: "64.00", page_views: "9000", impressions: "12000", viewability: "0.55" },
];

test("配信停止中の週は history.csv の行が無くても ¥0 と言い切る", () => {
  assert.match(adsenseRevenueLine({ history: [], week: "2026-W40" }), /\*\*¥0\*\*.*配信停止/);
});

test("再開後の週は history.csv の行の確定 7 日収益を出す", () => {
  const line = adsenseRevenueLine({ history: HISTORY, week: "2026-W43" });
  assert.match(line, /\*\*¥64\*\*/);
  assert.match(line, /視認率 55\.0%/);
});

test("再開後に行が無い週は 0 円にせず判定不能と書く", () => {
  const line = adsenseRevenueLine({ history: HISTORY, week: "2026-W44" });
  assert.match(line, /判定不能/);
  assert.doesNotMatch(line, /¥0/);
});

test("停止前の週は従来どおり行の値を出す", () => {
  assert.match(adsenseRevenueLine({ history: HISTORY, week: "2026-W33" }), /\*\*¥118\*\*/);
});

test("再開初週は初日が部分配信であることを添える", () => {
  const line = adsenseRevenueLine({ history: [{ week: ADSENSE_LIVE_SINCE_WEEK, earnings: "10" }], week: ADSENSE_LIVE_SINCE_WEEK });
  assert.match(line, /再開初週/);
});

test("広告収益効率は再開前の週を含む窓では値にしない", () => {
  const r = adYield28d({ history: HISTORY, weeks: ["2026-W41", "2026-W42", "2026-W43", "2026-W44"], pageviews28d: 40000 });
  assert.equal(r.status, "pending");
  assert.match(r.reason, /2026-W41/);
});
