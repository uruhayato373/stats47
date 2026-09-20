/**
 * 収益計測ガード (check-revenue-guards.mjs) の自己テスト。
 *
 * ガード自身が壊れていたら「見えない劣化」を検出できないので、
 * 正常系だけでなく「閾値を動かすと判定が変わる」ことまで固定する。
 *
 * 実行: node --test .claude/scripts/lib/__tests__/revenue-guards.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  evaluateGuards,
  readAffiliateTotals,
  unresolvedVerticalShare,
} from "../../metrics/check-revenue-guards.mjs";

const PROJECT_ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "../../../..");

const THRESHOLDS = JSON.parse(
  readFileSync(join(PROJECT_ROOT, ".claude/config/revenue-guards.json"), "utf-8"),
).guards;

const HEADER = "date,days,affiliate_vertical,link_position,impressions,clicks,ctr";

/** 健全な週: 観測が新しく、意図軸もほぼ解決している。 */
const HEALTHY_CSV = [
  HEADER,
  "2026-09-20,28,housing,ranking-sidebar,900,3,0.003333",
  "2026-09-20,28,labor,article-inline,80,1,0.012500",
  "2026-09-20,28,other,sidebar,20,0,0.000000",
  "2026-09-20,28,_all,_all,1000,4,0.004000",
].join("\n");

test("閾値 SSOT が 3 つのガードを持つ", () => {
  assert.ok(THRESHOLDS.affiliateObservationMaxAgeDays.value > 0);
  assert.ok(THRESHOLDS.unresolvedVerticalShareMax.value > 0);
  assert.ok(THRESHOLDS.impressionsPerPageviewMax.value > 0);
});

test("健全な週は失敗を返さない", () => {
  const failures = evaluateGuards({
    thresholds: THRESHOLDS,
    affiliateCsv: HEALTHY_CSV,
    asof: "2026-09-21",
  });
  assert.deepEqual(failures, []);
});

test("観測が閾値より古いと stale で落ちる", () => {
  const failures = evaluateGuards({
    thresholds: THRESHOLDS,
    affiliateCsv: HEALTHY_CSV,
    // 閾値 10 日に対して 30 日後に評価する
    asof: "2026-10-20",
  });
  assert.equal(failures.length, 1);
  assert.equal(failures[0].id, "affiliate-observation-stale");
});

test("観測ファイルが無いと missing で落ちる", () => {
  const failures = evaluateGuards({
    thresholds: THRESHOLDS,
    affiliateCsv: null,
    asof: "2026-09-21",
  });
  assert.equal(failures.length, 1);
  assert.equal(failures[0].id, "affiliate-observation-missing");
});

test("意図軸が未解決の表示が多いと落ちる", () => {
  const degraded = [
    HEADER,
    "2026-09-20,28,housing,ranking-sidebar,300,1,0.003333",
    "2026-09-20,28,other,sidebar,700,2,0.002857",
    "2026-09-20,28,_all,_all,1000,3,0.003000",
  ].join("\n");
  const failures = evaluateGuards({
    thresholds: THRESHOLDS,
    affiliateCsv: degraded,
    asof: "2026-09-21",
  });
  assert.equal(failures.length, 1);
  assert.equal(failures[0].id, "affiliate-vertical-unresolved");
  // 実測値を本文に出す (閾値だけ書いて値を隠さない)
  assert.match(failures[0].title, /70\.0%/);
});

test("閾値を緩めると同じ入力が PASS になる (閾値が実際に効いている)", () => {
  const degraded = [
    HEADER,
    "2026-09-20,28,housing,ranking-sidebar,300,1,0.003333",
    "2026-09-20,28,other,sidebar,700,2,0.002857",
    "2026-09-20,28,_all,_all,1000,3,0.003000",
  ].join("\n");
  const loosened = {
    ...THRESHOLDS,
    unresolvedVerticalShareMax: { value: 0.9, why: "test" },
  };
  const failures = evaluateGuards({
    thresholds: loosened,
    affiliateCsv: degraded,
    asof: "2026-09-21",
  });
  assert.deepEqual(failures, []);
});

test("`(not set)` と空文字も未解決として数える", () => {
  const csv = [
    HEADER,
    "2026-09-20,28,housing,ranking-sidebar,400,1,0.002500",
    "2026-09-20,28,(not set),sidebar,600,0,0.000000",
    "2026-09-20,28,_all,_all,1000,1,0.001000",
  ].join("\n");
  assert.equal(unresolvedVerticalShare(csv, "2026-09-20"), 0.6);
});

test("_all 行だけを総計として読む", () => {
  const totals = readAffiliateTotals(HEALTHY_CSV);
  assert.equal(totals.length, 1);
  assert.equal(totals[0].impressions, 1000);
  assert.equal(totals[0].clicks, 4);
});

test("backfill 行が末尾に来ても日付順に並べ、最新観測を誤認しない", () => {
  const csv = [
    HEADER,
    "2026-09-20,28,_all,_all,1000,4,0.004000",
    "2026-09-01,7,_all,_all,100,1,0.010000",
  ].join("\n");
  assert.deepEqual(readAffiliateTotals(csv).map((row) => row.date), ["2026-09-01", "2026-09-20"]);
  assert.deepEqual(evaluateGuards({
    thresholds: THRESHOLDS,
    affiliateCsv: csv,
    asof: "2026-09-21",
  }), []);
});

test("週次収益summaryはaffiliateの実際のwindow日数を表示する", () => {
  const source = readFileSync(
    join(PROJECT_ROOT, ".claude/scripts/metrics/generate-weekly-metrics-issue.mjs"),
    "utf-8",
  );
  assert.match(source, /windowDays = num\(latestAff\.days\)/);
  assert.doesNotMatch(source, /観測 \$\{latestAff\.date\}（28 日）/);
});
