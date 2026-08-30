/**
 * prepare-buzz-map-batch の純粋コア (batch-core / utm-core) テスト。
 * asset plan / R2 key / 動画上限 / idempotent skip / caption 完全性 / UTM。
 * 実行: node --test .claude/scripts/sns/lib/__tests__/buzz-map-batch-core.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  assetPlanForType,
  compositionsForType,
  r2KeysFor,
  expectedContentType,
  capVideos,
  idempotencyDecision,
  captionComplete,
  buildCandidatePlan,
} from "../buzz-map-batch-core.mjs";
import {
  buildUtmUrl,
  utmCampaignFor,
  validateAttributionContract,
} from "../buzz-map-utm-core.mjs";

// ── §8.1 asset plan ─────────────────────────────────────────────────────────

test("assetPlanForType: A/C/E は静止画のみ", () => {
  for (const t of ["A", "C", "E"]) {
    const p = assetPlanForType(t);
    assert.equal(p.still, true);
    assert.equal(p.xVideo, false);
    assert.equal(p.igReel, false);
    assert.equal(p.renderable, true);
  }
});

test("assetPlanForType: B/D は静止画 + X動画 + IGリール", () => {
  for (const t of ["B", "D"]) {
    const p = assetPlanForType(t);
    assert.equal(p.still, true);
    assert.equal(p.xVideo, true);
    assert.equal(p.igReel, true);
  }
});

test("assetPlanForType: F/flow は renderer 未整備で renderable=false", () => {
  assert.equal(assetPlanForType("F").renderable, false);
  assert.equal(assetPlanForType("flow").renderable, false);
});

test("compositionsForType: still=4:5, IGリール=9:16", () => {
  assert.equal(compositionsForType("A").still, "BuzzMap-Still-45");
  assert.equal(compositionsForType("D").igReel, "BuzzMap-Reel-916");
});

// ── §8.2 R2 key ─────────────────────────────────────────────────────────────

test("r2KeysFor: §8.2 のキー構造 (still)", () => {
  const keys = r2KeysFor("vacant-housing-muni", assetPlanForType("A"));
  assert.equal(keys.xStill, "sns/buzz-map/vacant-housing-muni/x/stills/vacant-housing-muni-45.png");
  assert.equal(
    keys.igStill,
    "sns/buzz-map/vacant-housing-muni/instagram/stills/slide-1-cover-1080x1350.png",
  );
  assert.equal(keys.xCaption, "sns/buzz-map/vacant-housing-muni/x/caption.txt");
});

test("r2KeysFor: B/D は reel キーも含む", () => {
  const keys = r2KeysFor("x", assetPlanForType("D"));
  assert.equal(keys.xReel, "sns/buzz-map/x/x/reel.mp4");
  assert.equal(keys.igReel, "sns/buzz-map/x/instagram/reel.mp4");
});

test("expectedContentType: 拡張子 → Content-Type", () => {
  assert.equal(expectedContentType("a/b.png"), "image/png");
  assert.equal(expectedContentType("a/b.mp4"), "video/mp4");
  assert.equal(expectedContentType("a/b.txt"), "text/plain");
  assert.equal(expectedContentType("a/b.bin"), null);
});

// ── 動画上限 (1 batch 最大 3) ──────────────────────────────────────────

test("capVideos: 動画候補が上限内なら全て保持", () => {
  const cands = [
    { ideaId: "a", assetPlan: assetPlanForType("D") },
    { ideaId: "b", assetPlan: assetPlanForType("D") },
    { ideaId: "c", assetPlan: assetPlanForType("D") },
  ];
  const out = capVideos(cands, 3);
  assert.equal(out.every((c) => !c.videoDeferred), true);
  assert.equal(out.every((c) => c.assetPlan.xVideo), true);
});

test("capVideos: 上限超過分は静止画のみに降格 (videoDeferred)", () => {
  const cands = [
    { ideaId: "a", assetPlan: assetPlanForType("D") },
    { ideaId: "b", assetPlan: assetPlanForType("B") },
    { ideaId: "c", assetPlan: assetPlanForType("D") },
    { ideaId: "d", assetPlan: assetPlanForType("D") }, // 4本目 → 動画落とす
  ];
  const out = capVideos(cands, 3);
  assert.equal(out[3].videoDeferred, true);
  assert.equal(out[3].assetPlan.xVideo, false);
  assert.equal(out[3].assetPlan.igReel, false);
  assert.equal(out[3].assetPlan.still, true); // 静止画は残る
});

test("capVideos: 静止画のみ候補は videoDeferred=false でカウントしない", () => {
  const cands = [
    { ideaId: "a", assetPlan: assetPlanForType("A") },
    { ideaId: "b", assetPlan: assetPlanForType("A") },
    { ideaId: "c", assetPlan: assetPlanForType("D") },
    { ideaId: "d", assetPlan: assetPlanForType("D") },
    { ideaId: "e", assetPlan: assetPlanForType("D") }, // 動画3本目 → OK
  ];
  const out = capVideos(cands, 3);
  assert.equal(out.filter((c) => c.videoDeferred).length, 0);
});

// ── idempotent skip ─────────────────────────────────────────────────────────

test("idempotencyDecision: 既 draft + R2 全存在 → skip", () => {
  const keys = ["k1", "k2"];
  const d = idempotencyDecision({
    requiredKeys: keys,
    existingR2Keys: new Set(keys),
    alreadyDraft: true,
  });
  assert.equal(d.skip, true);
});

test("idempotencyDecision: draft あるが R2 欠落 → skip しない (missingKeys 返す)", () => {
  const d = idempotencyDecision({
    requiredKeys: ["k1", "k2"],
    existingR2Keys: new Set(["k1"]),
    alreadyDraft: true,
  });
  assert.equal(d.skip, false);
  assert.deepEqual(d.missingKeys, ["k2"]);
});

test("idempotencyDecision: draft 無し → skip しない", () => {
  const d = idempotencyDecision({
    requiredKeys: ["k1"],
    existingR2Keys: new Set(["k1"]),
    alreadyDraft: false,
  });
  assert.equal(d.skip, false);
});

// ── caption 完全性 ────────────────────────────────────────────────────

test("captionComplete: 出典 + 年度 + 対象単位 揃えば complete", () => {
  const c = captionComplete("出典: 総務省 2023年 空き家率(％)…", {
    requiredYear: "2023",
    requiredUnitTerms: ["空き家率", "％"],
  });
  assert.equal(c.complete, true);
});

test("captionComplete: 出典欠落を検出", () => {
  const c = captionComplete("2023年のデータ", { requiredYear: "2023" });
  assert.equal(c.complete, false);
  assert.ok(c.missing.includes("出典"));
});

test("captionComplete: 年度欠落を検出", () => {
  const c = captionComplete("出典: e-Stat", { requiredYear: "2023" });
  assert.equal(c.complete, false);
  assert.ok(c.missing.some((m) => m.includes("2023")));
});

// ── UTM ─────────────────────────────────────────────────────────────────

test("buildUtmUrl: 4つのUTMパラメータ", () => {
  const url = buildUtmUrl({
    canonicalUrl: "/ranking/vacant-housing-rate",
    platform: "x",
    ideaId: "vacant-housing-muni",
    variant: "question-a",
  });
  const u = new URL(url);
  assert.equal(u.searchParams.get("utm_source"), "x");
  assert.equal(u.searchParams.get("utm_medium"), "social");
  assert.equal(u.searchParams.get("utm_campaign"), "buzz-map-vacant-housing-muni");
  assert.equal(u.searchParams.get("utm_content"), "question-a");
  assert.equal(u.origin + u.pathname, "https://stats47.jp/ranking/vacant-housing-rate");
});

test("buildUtmUrl: instagram source / 絶対 URL も可", () => {
  const url = buildUtmUrl({
    canonicalUrl: "https://stats47.jp/blog/vacant-house-crisis",
    platform: "instagram",
    ideaId: "vacant-housing-muni",
    variant: "cover",
  });
  assert.ok(url.includes("utm_source=instagram"));
});

test("buildUtmUrl: canonical に query があれば拒否（clean URL必須）", () => {
  assert.throws(() =>
    buildUtmUrl({
      canonicalUrl: "/ranking/x?utm_source=x",
      platform: "x",
      ideaId: "i",
      variant: "v",
    }),
  );
});

test("buildUtmUrl: 未対応 platform / 空 variant を拒否", () => {
  assert.throws(() =>
    buildUtmUrl({ canonicalUrl: "/r/x", platform: "tiktok", ideaId: "i", variant: "v" }),
  );
  assert.throws(() =>
    buildUtmUrl({ canonicalUrl: "/r/x", platform: "x", ideaId: "i", variant: "" }),
  );
});

test("utmCampaignFor: buzz-map-<ideaId>", () => {
  assert.equal(utmCampaignFor("natto-east-west-boundary"), "buzz-map-natto-east-west-boundary");
});

test("validateAttributionContract: 同一 campaign + direct だけ通す", () => {
  const ideaId = "natto-east-west-boundary";
  const utmUrl = buildUtmUrl({
    canonicalUrl: "/ranking/natto",
    platform: "x",
    ideaId,
    variant: "question-a",
  });
  assert.equal(
    validateAttributionContract({ utmUrl, ideaId, platform: "x", attribution: "direct" }).valid,
    true,
  );
  assert.equal(
    validateAttributionContract({ utmUrl, ideaId: "other", platform: "x", attribution: "direct" }).valid,
    false,
  );
  assert.equal(
    validateAttributionContract({ utmUrl, ideaId, platform: "x", attribution: "profile" }).valid,
    false,
  );
});

// ── buildCandidatePlan (統合) ────────────────────────────────────────────────

test("buildCandidatePlan: A 型は spec 再利用 + 9 steps", () => {
  const plan = buildCandidatePlan(
    { ideaId: "vacant-housing-muni", recommendedType: "A", commercialUse: "allowed", sensitivity: "low" },
    { specExists: true, specId: "vacant-housing-muni" },
  );
  assert.equal(plan.blocked, false);
  assert.equal(plan.renderable, true);
  assert.ok(plan.steps[0].includes("再利用"));
});

test("buildCandidatePlan: F 型は renderer 未整備で blocked", () => {
  const plan = buildCandidatePlan(
    { ideaId: "inhabited-mesh", recommendedType: "F", commercialUse: "allowed", sensitivity: "low" },
    { specExists: false, specId: "inhabited-mesh" },
  );
  assert.equal(plan.blocked, true);
  assert.equal(plan.renderable, false);
});

test("buildCandidatePlan: commercialUse != allowed / sensitivity high で blocked", () => {
  const p1 = buildCandidatePlan(
    { ideaId: "x", recommendedType: "A", commercialUse: "review-required", sensitivity: "low" },
    { specExists: true, specId: "x" },
  );
  assert.equal(p1.blocked, true);
  const p2 = buildCandidatePlan(
    { ideaId: "y", recommendedType: "A", commercialUse: "allowed", sensitivity: "high" },
    { specExists: true, specId: "y" },
  );
  assert.equal(p2.blocked, true);
});
