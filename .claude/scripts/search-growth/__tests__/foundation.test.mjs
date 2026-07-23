/**
 * foundation tests — contracts / freshness / redaction / join-url (§13 Normalize)。
 *   node --test .claude/scripts/search-growth/__tests__/foundation.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createObservation, validateObservation } from "../lib/contracts.mjs";
import { daysBetween, classifyAge, freshnessForSource, worstFreshness } from "../lib/freshness.mjs";
import { hashQuery, redactString, redactUrl, redactObject } from "../lib/redaction.mjs";
import { toPathKey, toCanonicalUrl, isAllowedUrl, stripTrackingParams } from "../lib/join-url.mjs";

// ── contracts ──
test("createObservation: 正常な Observation を生成し検証する", () => {
  const o = createObservation({
    source: "gsc", metric: "clicks", dimensions: { page: "/x" }, value: 10,
    periodStart: "2026-07-13", periodEnd: "2026-07-19", freshness: "fresh",
  });
  assert.equal(validateObservation(o).ok, true);
  assert.equal(o.value, 10);
});
test("createObservation: 不正 source は throw", () => {
  assert.throws(() => createObservation({ source: "bogus", metric: "x", value: 1 }));
});
test("createObservation: NaN 数値は拒否", () => {
  assert.throws(() => createObservation({ source: "gsc", metric: "x", value: NaN, freshness: "fresh" }));
});
test("createObservation: value 省略時は freshness=missing (0 と混同しない)", () => {
  const o = createObservation({ source: "ga4", metric: "sessions" });
  assert.equal(o.value, null);
  assert.equal(o.freshness, "missing");
});

// ── freshness ──
test("daysBetween: 日数差", () => {
  assert.equal(daysBetween("2026-07-20T00:00:00Z", "2026-07-18T00:00:00Z"), 2);
  assert.equal(daysBetween("bad", "2026-07-18"), null);
});
test("classifyAge: 閾値内=fresh / 超過=stale", () => {
  const now = "2026-07-23T00:00:00Z";
  assert.equal(classifyAge({ observedAt: "2026-07-20T00:00:00Z", now, staleAfterDays: 5 }), "fresh");
  assert.equal(classifyAge({ observedAt: "2026-07-10T00:00:00Z", now, staleAfterDays: 5 }), "stale");
});
test("freshnessForSource: failed/skipped は missing", () => {
  assert.equal(freshnessForSource({ status: "failed", observedAt: "2026-07-23T00:00:00Z", staleAfterDays: 5 }), "missing");
  assert.equal(freshnessForSource({ status: "skipped", observedAt: null, staleAfterDays: 5 }), "missing");
});
test("worstFreshness: 最悪値 / 空は missing", () => {
  assert.equal(worstFreshness(["fresh", "stale", "fresh"]), "stale");
  assert.equal(worstFreshness(["fresh", "missing"]), "missing");
  assert.equal(worstFreshness([]), "missing");
});

// ── redaction ──
test("hashQuery: 非可逆・安定・元文字列を含まない", () => {
  const h = hashQuery("年収 ランキング");
  assert.match(h, /^q_[0-9a-f]{16}$/);
  assert.equal(h, hashQuery("年収 ランキング")); // 安定
  assert.notEqual(h, hashQuery("別 query"));
  assert.ok(!h.includes("年収"));
});
test("redactString: private key / bearer / jwt / key= をマスク", () => {
  assert.match(redactString("-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----"), /REDACTED_PRIVATE_KEY/);
  assert.match(redactString("Authorization: Bearer abc.def-123"), /Bearer \[REDACTED\]/);
  assert.match(redactString("https://x?api_key=SECRETVAL&y=1"), /api_key=\[REDACTED\]/);
  assert.ok(!redactString("token=abcdef123").includes("abcdef123"));
});
test("redactUrl: query/fragment を落とす", () => {
  assert.equal(redactUrl("https://stats47.jp/ranking/x?q=secret#frag"), "https://stats47.jp/ranking/x");
});
test("redactObject: cookie/token key を深く [REDACTED]", () => {
  const r = redactObject({ a: 1, headers: { cookie: "sid=xyz", authorization: "Bearer t" }, nested: [{ api_key: "k" }] });
  assert.equal(r.headers.cookie, "[REDACTED]");
  assert.equal(r.headers.authorization, "[REDACTED]");
  assert.equal(r.nested[0].api_key, "[REDACTED]");
  assert.equal(r.a, 1);
});

// ── join-url ──
test("toPathKey: trailing slash / query / fragment を正規化", () => {
  assert.equal(toPathKey("https://stats47.jp/ranking/x/"), "/ranking/x");
  assert.equal(toPathKey("https://stats47.jp/ranking/x?a=1#f"), "/ranking/x");
  assert.equal(toPathKey("/ranking/x/"), "/ranking/x");
  assert.equal(toPathKey("https://stats47.jp/"), "/");
  assert.equal(toPathKey(""), null);
});
test("toPathKey: Unicode query (percent-encoded と生を一致)", () => {
  assert.equal(toPathKey("https://stats47.jp/blog/tags/%E5%B9%B3%E5%9D%87%E4%BD%93%E9%87%8D"), "/blog/tags/平均体重");
  assert.equal(toPathKey("/blog/tags/平均体重"), "/blog/tags/平均体重");
});
test("toCanonicalUrl: host 統一・絶対 URL", () => {
  assert.equal(toCanonicalUrl("/ranking/x/"), "https://stats47.jp/ranking/x");
  assert.equal(toCanonicalUrl("https://www.stats47.jp/ranking/x?utm_source=x"), "https://stats47.jp/ranking/x");
});
test("isAllowedUrl: stats47.jp allowlist", () => {
  assert.equal(isAllowedUrl("https://stats47.jp/x"), true);
  assert.equal(isAllowedUrl("/x"), true);
  assert.equal(isAllowedUrl("https://evil.example.com/x"), false);
  assert.equal(isAllowedUrl("javascript:alert(1)"), false);
});
test("stripTrackingParams: utm を除去し他は保持", () => {
  const r = stripTrackingParams("https://stats47.jp/x?utm_source=x&page=2");
  assert.ok(!r.includes("utm_source"));
  assert.ok(r.includes("page=2"));
});
