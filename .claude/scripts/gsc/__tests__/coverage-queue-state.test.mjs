import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyInspectionObservations,
  findUnhandledBatchUrls,
  getObserveAfterFixEntries,
  keepsDesignJudgment,
  normalizeQueueUrl,
  refineBySitemap,
  RESOLVED_BY_INSPECTION,
  sitemapKey,
  summarizeCoverageQueue,
} from "../lib/coverage-queue-state.mjs";

const entry = (overrides) => ({
  action: "observe-after-fix",
  status: "pending",
  verdict: "live-misflagged",
  gsc_category: "crawled-not-indexed",
  ...overrides,
});

test("done化したactionを分類総数には残し、pending集計から除外する", () => {
  const summary = summarizeCoverageQueue([
    entry({}),
    entry({ action: "fix-5xx", status: "done", verdict: "still-5xx" }),
    entry({ action: "none", status: "resolved-by-design", verdict: "now-gone" }),
  ]);

  assert.equal(summary.tracked_urls, 3);
  assert.equal(summary.pending_actionable, 1);
  assert.deepEqual(summary.by_action, {
    "observe-after-fix": 1,
    "fix-5xx": 1,
    none: 1,
  });
  assert.deepEqual(summary.pending_by_action, { "observe-after-fix": 1 });
});

test("観測CSV対象はpendingまたはin-progressだけに限定する", () => {
  const queue = [
    entry({ status: "pending" }),
    entry({ status: "in-progress" }),
    entry({ status: "done" }),
    entry({ action: "content-check", status: "pending" }),
  ];

  assert.equal(getObserveAfterFixEntries(queue).length, 2);
});

test("URL Inspection で登録済みになった actionable URL を done にし、件数を数える", () => {
  const queue = [
    entry({ url: "https://stats47.jp/ranking/a" }),
    entry({ url: "https://stats47.jp/ranking/b", status: "in-progress", action: "content-check" }),
    entry({ url: "https://stats47.jp/ranking/c" }),
    entry({ url: "https://stats47.jp/ranking/d", action: "none", status: "resolved-by-design" }),
  ];
  const observations = new Map([
    ["https://stats47.jp/ranking/a", { date: "2026-09-24", verdict: "PASS", coverageState: "送信して登録されました" }],
    ["https://stats47.jp/ranking/b", { date: "2026-09-24", verdict: "PASS", coverageState: "送信して登録されました" }],
    ["https://stats47.jp/ranking/c", { date: "2026-09-24", verdict: "NEUTRAL", coverageState: "検出 - インデックス未登録" }],
    ["https://stats47.jp/ranking/d", { date: "2026-09-24", verdict: "PASS", coverageState: "送信して登録されました" }],
  ]);

  const result = applyInspectionObservations(queue, observations);

  assert.deepEqual(result, { observed: 3, indexed: 2, reopened: 0 });
  assert.deepEqual(queue.map((e) => e.status), ["done", "done", "pending", "resolved-by-design"]);
  assert.equal(queue[0].resolved_at, "2026-09-24");
  assert.equal(queue[2].inspection.coverage_state, "検出 - インデックス未登録");
  assert.equal(queue[3].inspection, undefined);
  assert.equal(summarizeCoverageQueue(queue).indexed_by_inspection, 2);
});

test("自動で done にした URL だけを、再び未登録と観測したら pending に戻す", () => {
  const queue = [
    entry({ url: "https://stats47.jp/a", status: "done", resolved_by: RESOLVED_BY_INSPECTION, resolved_at: "2026-09-20" }),
    entry({ url: "https://stats47.jp/b", status: "done", resolved_by: null, wave_id: "2026-09-07-coverage" }),
  ];
  const observations = new Map([
    ["https://stats47.jp/a", { date: "2026-09-24", verdict: "NEUTRAL", coverageState: "クロール済み - インデックス未登録" }],
    ["https://stats47.jp/b", { date: "2026-09-24", verdict: "NEUTRAL", coverageState: "クロール済み - インデックス未登録" }],
  ]);

  const result = applyInspectionObservations(queue, observations);

  assert.equal(result.reopened, 1);
  assert.equal(queue[0].status, "pending");
  assert.equal(queue[0].resolved_at, null);
  assert.equal(queue[1].status, "done", "人が付けた done は観測で覆さない");
});

test("fragment 付きの URL も同じ URL として照合する", () => {
  assert.equal(normalizeQueueUrl("https://stats47.jp/blog/x#s1"), "https://stats47.jp/blog/x");
  assert.equal(normalizeQueueUrl("not-a-url"), null);
});

test("sitemap に無い 404 は放置確定、sitemap に無い 200 は掲載判断へ回す", () => {
  const still404 = { verdict: "still-404", action: "verify-intent", design: false };
  const live = { verdict: "live-misflagged", action: "observe-after-fix", design: false };

  assert.deepEqual(refineBySitemap(still404, false), { verdict: "dead-unlisted", action: "none", design: true });
  assert.equal(refineBySitemap(live, false).action, "sitemap-gap");
  // sitemap に載っている 404 は sitemap の不具合なので確認対象のまま残す
  assert.equal(refineBySitemap(still404, true), still404);
  assert.equal(refineBySitemap(live, true), live);
  // sitemap を全件取れなかったときは判定を変えない
  assert.equal(refineBySitemap(still404, null), still404);
  assert.equal(refineBySitemap(live, null), live);
});

test("sitemap 照合は末尾スラッシュと fragment の差を吸収する", () => {
  assert.equal(sitemapKey("https://stats47.jp/ranking/a/"), sitemapKey("https://stats47.jp/ranking/a#x"));
});

test("カードの gate は pending と理由なしの処理を未処理として返す", () => {
  const queue = [
    entry({ url: "https://stats47.jp/a", status: "pending" }),
    entry({ url: "https://stats47.jp/b", status: "in-progress", note: "sitemap へ追加 (commit abc)" }),
    entry({ url: "https://stats47.jp/c", status: "resolved-by-design", note: "" }),
    entry({ url: "https://stats47.jp/d", status: "done" }),
  ];
  assert.deepEqual(
    findUnhandledBatchUrls(queue, [
      "https://stats47.jp/a",
      "https://stats47.jp/b",
      "https://stats47.jp/c",
      "https://stats47.jp/d",
      "https://stats47.jp/gone-from-export",
    ]),
    ["https://stats47.jp/a", "https://stats47.jp/c"],
  );
});

test("カードで対応不要と判断した 200 の URL は、同じ分類のままなら週次の再構築で pending に戻さない", () => {
  // --mark-by-design は status と note しか変えないので、判断時の action が old に残る
  const judged = entry({ action: "sitemap-gap", status: "resolved-by-design", note: "意図的に sitemap 外" });
  assert.equal(keepsDesignJudgment(judged, "sitemap-gap", 200), true);
  assert.equal(keepsDesignJudgment({ ...judged, action: "content-check" }, "content-check", 200), true);
  // 測定できなかった週 (recheck) は判断を変える材料が無い
  assert.equal(keepsDesignJudgment(judged, "recheck", 0), true);
  // 状況が変わったら通常分類へ戻して再確認する
  assert.equal(keepsDesignJudgment(judged, "observe-after-fix", 200), false); // sitemap に載った
  assert.equal(keepsDesignJudgment(judged, "fix-5xx", 503), false);
  // 従来どおり: 404 のままの by-design は保つ。by-design でない URL は対象外
  assert.equal(keepsDesignJudgment(entry({ action: "verify-intent", status: "resolved-by-design" }), "verify-intent", 404), true);
  assert.equal(keepsDesignJudgment(entry({ action: "sitemap-gap", status: "pending" }), "sitemap-gap", 200), false);
  assert.equal(keepsDesignJudgment(undefined, "sitemap-gap", 200), false);
});
