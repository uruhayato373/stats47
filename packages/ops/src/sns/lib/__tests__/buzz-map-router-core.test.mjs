import test from "node:test";
import assert from "node:assert/strict";

import {
  SCORE_MAX,
  computeBaseScore,
  landingScoreAdjustment,
  computeCuratedScore,
  evaluateHardGate,
  resolveLanding,
  findMachineDuplicate,
  curatedToCatalogEntry,
} from "../buzz-map-router-core.mjs";

// ── fixtures ──────────────────────────────────────────────────────────────
function idea(overrides = {}) {
  return {
    ideaId: "test-idea",
    title: "テスト",
    hook: "スクロールを止める一文。",
    question: "問い？",
    metricKeys: ["vacant-housing-rate"],
    feasibility: "now",
    commercialUse: "allowed",
    sensitivity: "low",
    competitorOverlap: "none",
    channels: ["x", "instagram"],
    scoreBreakdown: {
      anomaly: 18,
      selfSearch: 14,
      replyBait: 11,
      seasonality: 4,
      externalBuzz: 7,
      gscDemand: 15,
      feasibility: 10,
      differentiation: 6,
    },
    landingPlan: {
      strategy: "existing-ranking",
      readiness: "needs-content",
      primaryUrl: "/ranking/vacant-housing-rate",
      primaryKey: "vacant-housing-rate",
      themeSlug: "living-housing",
      articleSlug: null,
      monetizationVertical: "housing",
      landingPromise: "空き家率のランキングを見る",
    },
    dataRefs: [{ year: "2023", license: "allowed", id: "test" }],
    ...overrides,
  };
}

const inventory = {
  rankingKeys: new Set(["vacant-housing-rate", "population-growth-rate"]),
  blogSlugs: new Set(["vacant-house-crisis", "food-culture-prefecture-map"]),
  themeSlugs: new Set(["living-housing", "population-dynamics"]),
};

// ── computeBaseScore ────────────────────────────────────────────────────────
test("computeBaseScore sums and clamps to SCORE_MAX", () => {
  const { base, clamped } = computeBaseScore({ anomaly: 99, gscDemand: 15 });
  assert.equal(clamped.anomaly, SCORE_MAX.anomaly); // clamped down from 99
  assert.equal(clamped.gscDemand, 15);
  assert.equal(clamped.differentiation, 0); // missing → 0
  assert.equal(base, SCORE_MAX.anomaly + 15);
});

test("computeBaseScore full breakdown = 100 possible", () => {
  const full = Object.fromEntries(Object.entries(SCORE_MAX));
  const { base } = computeBaseScore(full);
  assert.equal(base, 100);
});

// ── landingScoreAdjustment ──────────────────────────────────────────────────
test("landingScoreAdjustment: existing live ranking +10, vertical +5", () => {
  const { delta } = landingScoreAdjustment({
    strategy: "existing-ranking",
    readiness: "live",
    monetizationVertical: "housing",
  });
  assert.equal(delta, 15);
});

test("landingScoreAdjustment: create-blog -5", () => {
  const { delta } = landingScoreAdjustment({
    strategy: "create-blog",
    readiness: "needs-content",
    monetizationVertical: "none",
  });
  assert.equal(delta, -5);
});

test("computeCuratedScore clamps to 0-100", () => {
  const r = computeCuratedScore(idea());
  assert.ok(r.score >= 0 && r.score <= 100);
  assert.equal(r.score, r.base + r.delta);
});

// ── evaluateHardGate ────────────────────────────────────────────────────────
test("hard gate: clean idea is generatable + autoPostable", () => {
  const g = evaluateHardGate(idea());
  assert.equal(g.generatable, true);
  assert.equal(g.autoPostable, true);
  assert.equal(g.eligible, true);
});

test("hard gate: commercialUse=blocked → not generatable", () => {
  const g = evaluateHardGate(idea({ commercialUse: "blocked" }));
  assert.equal(g.generatable, false);
  assert.equal(g.autoPostable, false);
  assert.match(g.reasons.join(" "), /blocked/);
});

test("hard gate: sensitivity=high → not autoPostable but generatable", () => {
  const g = evaluateHardGate(idea({ sensitivity: "high", channels: [] }));
  assert.equal(g.generatable, true);
  assert.equal(g.autoPostable, false);
  assert.match(g.reasons.join(" "), /sensitivity=high/);
});

test("hard gate: competitorOverlap=exact → not generatable", () => {
  const g = evaluateHardGate(idea({ competitorOverlap: "exact" }));
  assert.equal(g.generatable, false);
});

test("hard gate: empty hook/question → not generatable", () => {
  const g = evaluateHardGate(idea({ hook: "", question: "" }));
  assert.equal(g.generatable, false);
  assert.match(g.reasons.join(" "), /hook\/question/);
});

test("hard gate: review-required adds note but stays generatable", () => {
  const g = evaluateHardGate(idea({ commercialUse: "review-required" }));
  assert.equal(g.generatable, true);
  assert.match(g.reasons.join(" "), /review-required/);
});

// ── resolveLanding ──────────────────────────────────────────────────────────
test("resolveLanding: existing-ranking with inventory hit stays existing-ranking", () => {
  const r = resolveLanding(idea(), inventory);
  assert.equal(r.strategy, "existing-ranking");
  assert.equal(r.primaryKey, "vacant-housing-rate");
});

test("resolveLanding: existing-ranking with missing key → blocked (ranking 投入待ち)", () => {
  const r = resolveLanding(
    idea({
      metricKeys: ["nonexistent-key"],
      landingPlan: {
        strategy: "existing-ranking",
        primaryKey: "nonexistent-key",
        primaryUrl: "/ranking/nonexistent-key",
      },
    }),
    inventory,
  );
  assert.equal(r.strategy, "blocked");
  assert.match(r.resolvedReasons.join(" "), /ranking 未公開/);
});

test("resolveLanding: existing-blog missing slug → downgrade to create-blog", () => {
  const r = resolveLanding(
    idea({
      landingPlan: { strategy: "existing-blog", articleSlug: "no-such-blog" },
    }),
    inventory,
  );
  assert.equal(r.strategy, "create-blog");
  assert.match(r.resolvedReasons.join(" "), /降格/);
});

test("resolveLanding: existing-blog present slug stays existing-blog", () => {
  const r = resolveLanding(
    idea({ landingPlan: { strategy: "existing-blog", articleSlug: "vacant-house-crisis" } }),
    inventory,
  );
  assert.equal(r.strategy, "existing-blog");
});

test("resolveLanding: existing-theme missing slug → blocked", () => {
  const r = resolveLanding(
    idea({ landingPlan: { strategy: "existing-theme", themeSlug: "no-such-theme" } }),
    inventory,
  );
  assert.equal(r.strategy, "blocked");
});

test("resolveLanding: hard-gate fail → blocked regardless of inventory", () => {
  const r = resolveLanding(idea({ commercialUse: "blocked" }), inventory);
  assert.equal(r.strategy, "blocked");
  assert.equal(r.readiness, "blocked");
});

test("resolveLanding: feasibility needs-renderer overrides readiness", () => {
  const r = resolveLanding(
    idea({
      feasibility: "needs-renderer",
      metricKeys: ["vacant-housing-rate"],
      landingPlan: { strategy: "existing-ranking", primaryKey: "vacant-housing-rate" },
    }),
    inventory,
  );
  assert.equal(r.strategy, "existing-ranking");
  assert.equal(r.readiness, "needs-renderer");
});

// ── findMachineDuplicate ────────────────────────────────────────────────────
test("findMachineDuplicate: metricKey match", () => {
  const machineKeys = new Set(["vacant-housing-rate", "population-growth-rate"]);
  const r = findMachineDuplicate(idea(), machineKeys);
  assert.equal(r.isDuplicate, true);
  assert.deepEqual(r.matchedKeys, ["vacant-housing-rate"]);
});

test("findMachineDuplicate: alias match (ksj id)", () => {
  const machineKeys = new Set(["ksj:S12"]);
  const r = findMachineDuplicate(
    idea({ metricKeys: [], aliases: ["station-5k-plot", "ksj:S12"] }),
    machineKeys,
  );
  assert.equal(r.isDuplicate, true);
  assert.deepEqual(r.matchedKeys, ["ksj:S12"]);
});

test("findMachineDuplicate: no match", () => {
  const r = findMachineDuplicate(idea({ metricKeys: ["unique-key"] }), new Set(["other"]));
  assert.equal(r.isDuplicate, false);
});

// ── curatedToCatalogEntry ───────────────────────────────────────────────────
test("curatedToCatalogEntry projects to catalog shape", () => {
  const scored = computeCuratedScore(idea());
  const landing = resolveLanding(idea(), inventory);
  const gate = evaluateHardGate(idea());
  const e = curatedToCatalogEntry(idea(), scored, landing, gate);
  assert.equal(e.metricKey, "curated:test-idea");
  assert.equal(e.lane, "curated");
  assert.equal(e.source, "curated");
  assert.equal(e.ideaId, "test-idea");
  assert.equal(e.landingStrategy, "existing-ranking");
  assert.equal(e.eligible, true);
  assert.equal(e.requiredYear, "2023");
  assert.equal(e.landingPromise, "空き家率のランキングを見る");
  assert.equal(e.status, "candidate");
});
