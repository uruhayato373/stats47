/**
 * buzz-map attribution core テスト (§7.3 集計 / §7.4 KPI / §11 Phase 5 score 還流) + UTM 一本化。
 * 実行: node --test .claude/scripts/sns/lib/__tests__/buzz-map-attribution-core.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

import {
  ideaIdFromCampaign,
  aggregateSessionsByIdea,
  aggregateCtaByIdea,
  computeKpis,
  buildScoreFeedback,
} from "../buzz-map-attribution-core.mjs";

const require = createRequire(import.meta.url);
const snsUtm = require("../../../lib/sns-utm.cjs");

// ── UTM 一本化 (sns-utm.cjs) ─────────────────────────────────────────────────

test("sns-utm campaignFor: 全ドメインの campaign 命名 (§4)", () => {
  assert.equal(snsUtm.campaignFor("ranking", { rankingKey: "k" }), "k");
  assert.equal(snsUtm.campaignFor("buzz-map", { ideaId: "i" }), "buzz-map-i");
  assert.equal(snsUtm.campaignFor("compare", { areaA: "13", areaB: "01" }), "compare-13-vs-01");
  assert.equal(snsUtm.campaignFor("correlation", { keyX: "a", keyY: "b" }), "correlation-a--b");
});

test("sns-utm buildUtmUrl: §4 の 4 パラメータ + clean 必須", () => {
  const u = new URL(
    snsUtm.buildUtmUrl({ canonicalUrl: "/ranking/k", platform: "x", campaign: "k", variant: "shock" }),
  );
  assert.equal(u.searchParams.get("utm_source"), "x");
  assert.equal(u.searchParams.get("utm_medium"), "social");
  assert.equal(u.searchParams.get("utm_campaign"), "k");
  assert.equal(u.searchParams.get("utm_content"), "shock");
  assert.throws(() =>
    snsUtm.buildUtmUrl({ canonicalUrl: "/r?x=1", platform: "x", campaign: "k", variant: "v" }),
  );
  assert.throws(() =>
    snsUtm.buildUtmUrl({ canonicalUrl: "/r", platform: "tiktok", campaign: "k", variant: "v" }),
  );
});

test("sns-utm youtube pinned は content に -pinned", () => {
  const u = new URL(
    snsUtm.buildUtmUrl({ canonicalUrl: "/r/k", platform: "youtube", campaign: "k", variant: "shock", pinned: true }),
  );
  assert.equal(u.searchParams.get("utm_content"), "shock-pinned");
});

test("buzz-map adapter は sns-utm と同じ URL を出す (delegation 一致)", async () => {
  const { buildUtmUrl } = await import("../buzz-map-utm-core.mjs");
  const viaAdapter = buildUtmUrl({ canonicalUrl: "/blog/x", platform: "x", ideaId: "vacant-housing-muni", variant: "question-a" });
  const viaCanonical = snsUtm.buildUtmForDomain({
    domain: "buzz-map",
    domainParams: { ideaId: "vacant-housing-muni" },
    canonicalUrl: "/blog/x",
    platform: "x",
    variant: "question-a",
  });
  assert.equal(viaAdapter, viaCanonical);
});

// ── §7.3 campaign → ideaId ──────────────────────────────────────────────────

test("ideaIdFromCampaign: buzz-map- 接頭のみ復元", () => {
  assert.equal(ideaIdFromCampaign("buzz-map-vacant-housing-muni"), "vacant-housing-muni");
  assert.equal(ideaIdFromCampaign("taxable-income"), null); // 非 buzz-map campaign
  assert.equal(ideaIdFromCampaign(null), null);
});

// ── §7.3 session 集計 ────────────────────────────────────────────────────────

test("aggregateSessionsByIdea: buzz-map campaign を ideaId 別に畳み込み + source 別", () => {
  const rows = [
    { campaign: "buzz-map-a", source: "x", sessions: 10, engagedSessions: 6, pageViews: 20 },
    { campaign: "buzz-map-a", source: "instagram", sessions: 5, engagedSessions: 2, pageViews: 8 },
    { campaign: "buzz-map-b", source: "x", sessions: 3, engagedSessions: 3, pageViews: 3 },
    { campaign: "other-campaign", source: "x", sessions: 99, engagedSessions: 99, pageViews: 99 },
  ];
  const agg = aggregateSessionsByIdea(rows);
  assert.equal(agg.a.sessions, 15);
  assert.equal(agg.a.engagedSessions, 8);
  assert.equal(agg.a.bySource.x.sessions, 10);
  assert.equal(agg.a.bySource.instagram.sessions, 5);
  assert.equal(agg.b.sessions, 3);
  assert.equal(agg["other-campaign"], undefined); // 非 buzz-map は除外
});

test("aggregateCtaByIdea: content_id 別 CTA + target 別", () => {
  const rows = [
    { contentId: "a", targetType: "ranking", eventCount: 4 },
    { contentId: "a", targetType: "theme", eventCount: 2 },
    { contentId: "b", targetType: "ranking", eventCount: 1 },
  ];
  const agg = aggregateCtaByIdea(rows);
  assert.equal(agg.a.ctaClicks, 6);
  assert.equal(agg.a.byTarget.ranking, 4);
  assert.equal(agg.b.ctaClicks, 1);
});

// ── §7.4 KPI ────────────────────────────────────────────────────────────────

test("computeKpis: engagement / deep-click / snsCTR (direct のみ)", () => {
  const sessionsByIdea = { a: { sessions: 20, engagedSessions: 10, pageViews: 40, bySource: {} } };
  const ctaByIdea = { a: { ctaClicks: 4, byTarget: {} } };
  const impByIdea = { a: { impressions: 1000, attribution: "direct" } };
  const kpis = computeKpis({ sessionsByIdea, ctaByIdea, impByIdea });
  assert.equal(kpis.a.landingSessions, 20);
  assert.equal(kpis.a.landingEngagementRate, 0.5);
  assert.equal(kpis.a.deepClickRate, 0.2);
  assert.equal(kpis.a.snsCtr, 0.02); // 20/1000
});

test("computeKpis: profile 経由は snsCTR を出さない (§7.1 過大評価回避)", () => {
  const kpis = computeKpis({
    sessionsByIdea: { a: { sessions: 20, engagedSessions: 10, pageViews: 40, bySource: {} } },
    ctaByIdea: {},
    impByIdea: { a: { impressions: 1000, attribution: "profile" } },
  });
  assert.equal(kpis.a.snsCtr, null);
});

test("computeKpis: session 0 は rate 系 null (0除算しない)", () => {
  const kpis = computeKpis({ sessionsByIdea: {}, ctaByIdea: { a: { ctaClicks: 0, byTarget: {} } } });
  assert.equal(kpis.a.landingEngagementRate, null);
  assert.equal(kpis.a.deepClickRate, null);
});

// ── §11 Phase 5 score 還流 ───────────────────────────────────────────────────

test("buildScoreFeedback: session 0 は加点 0 (推測で加点しない)", () => {
  const fb = buildScoreFeedback({ a: { landingSessions: 0, deepClickRate: null } });
  assert.equal(fb.a.outcomeScore, 0);
  assert.match(fb.a.note, /実測 session 0/);
});

test("buildScoreFeedback: 実測ありは outcomeScore > 0・上限 15", () => {
  const fb = buildScoreFeedback({ a: { landingSessions: 100, deepClickRate: 0.3 } });
  assert.ok(fb.a.outcomeScore > 0);
  assert.ok(fb.a.outcomeScore <= 15);
});

test("buildScoreFeedback: 高 session ほど score 単調増加 (log スケール)", () => {
  const low = buildScoreFeedback({ a: { landingSessions: 10, deepClickRate: 0 } }).a.outcomeScore;
  const high = buildScoreFeedback({ a: { landingSessions: 1000, deepClickRate: 0 } }).a.outcomeScore;
  assert.ok(high > low);
});

// ── 不変条件: canonical (catalog primaryUrl) に UTM を混入させない (§7.1) ─────

test("canonical 不変条件: catalog の primaryUrl に UTM/query が付いていない", () => {
  const catalog = JSON.parse(
    readFileSync(
      new URL("../../../../state/sns/buzz-map-catalog.json", import.meta.url),
      "utf8",
    ),
  );
  const dirty = catalog.entries.filter(
    (e) => typeof e.primaryUrl === "string" && /[?&]utm_/.test(e.primaryUrl),
  );
  assert.deepEqual(
    dirty.map((e) => e.ideaId ?? e.metricKey),
    [],
    `primaryUrl に UTM 混入: ${dirty.map((e) => e.primaryUrl).join(", ")}`,
  );
});

test("canonical 不変条件: buildUtmUrl は query 付き canonical を拒否 (二重付与・混入防止)", () => {
  const withUtm = snsUtm.buildUtmUrl({ canonicalUrl: "/ranking/k", platform: "x", campaign: "k", variant: "v" });
  const relWithUtm = withUtm.replace("https://stats47.jp", "");
  assert.throws(() =>
    snsUtm.buildUtmUrl({ canonicalUrl: relWithUtm, platform: "x", campaign: "k", variant: "v2" }),
  );
});
