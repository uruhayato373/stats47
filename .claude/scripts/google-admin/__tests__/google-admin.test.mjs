/**
 * google-admin runner のテスト — allowlist/denylist・decision fixtures・冪等 no-op・
 * redaction・lock (READMEの安全契約)。browser は起動しない (pure/decision 部のみ)。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ALLOWED_ACTIONS,
  AD_ID_DIMENSION,
  assertAllowed,
  decideActions,
} from "../apply-allowlisted-settings.mjs";
import { sanitize, sanitizeObject, redactEmail } from "../redact.mjs";
import { acquireLock, releaseLock, LOCK_FILE, isLoginUrl } from "../browser-context.mjs";

const BASE_INV = {
  gsc: { status: "ok", present: true, permissionLevel: "siteOwner" },
  scLinks: { status: "ok", linked: true },
  adsenseLinks: { status: "ok", linked: true, publisherId: "pub-7995274743017484" },
  customDimensions: { status: "ok", hasAdId: false },
  library: { status: "ok", hasScCollection: true, published: true },
  ledger: { adIdStatus: "要登録" },
  ga4AdImpressionObserved: true,
};

test("allowlist は 3 action のみ・allowlist 外は runtime で throw", () => {
  assert.equal(ALLOWED_ACTIONS.length, 3);
  for (const a of ALLOWED_ACTIONS) assert.equal(assertAllowed(a), a);
  for (const denied of [
    "delete-search-console-link",
    "create-adsense-link",
    "change-timezone",
    "delete-custom-dimension",
    "submit-sitemap",
    "change-auto-ads",
  ]) {
    assert.throws(() => assertAllowed(denied), /not in allowlist/);
  }
});

test("ad_id dimension の固定値", () => {
  assert.deepEqual(AD_ID_DIMENSION, { displayName: "Affiliate ad ID", scope: "Event", eventParameter: "ad_id" });
});

test("decision: 全て整備済みなら no-op のみ (冪等)", () => {
  const inv = { ...BASE_INV, customDimensions: { status: "ok", hasAdId: true } };
  const d = decideActions(inv);
  assert.deepEqual(d.actions, []);
  assert.equal(d.blockers.length, 0);
  assert.ok(d.noops.length >= 3);
});

test("decision: SC link 0 件 + GSC property 実在 → create-search-console-link を 1 件だけ", () => {
  const inv = { ...BASE_INV, scLinks: { status: "ok", linked: false }, customDimensions: { status: "ok", hasAdId: true } };
  const d = decideActions(inv);
  assert.deepEqual(d.actions, ["create-search-console-link"]);
});

test("decision: GSC property を API で確認できなければ link を作らない (blocker)", () => {
  const inv = { ...BASE_INV, scLinks: { status: "ok", linked: false }, gsc: { status: "error", present: null } };
  const d = decideActions(inv);
  assert.ok(!d.actions.includes("create-search-console-link"));
  assert.ok(d.blockers.some((b) => b.code === "gsc-property-missing"));
});

test("decision: collection 未公開なら publish・未生成なら no-op (リンク後に再評価)", () => {
  const unpub = decideActions({ ...BASE_INV, library: { status: "ok", hasScCollection: true, published: false, unpublished: true } });
  assert.ok(unpub.actions.includes("publish-search-console-collection"));
  const none = decideActions({ ...BASE_INV, library: { status: "ok", hasScCollection: false } });
  assert.ok(!none.actions.includes("publish-search-console-collection"));
  assert.ok(none.noops.some((n) => n.action === "publish-search-console-collection" && /未生成/.test(n.reason)));
});

test("decision: ad_id — 台帳が要登録 + 未存在なら作成・既存 (別名でも) なら作成しない", () => {
  const create = decideActions(BASE_INV);
  assert.ok(create.actions.includes("create-ad-id-dimension"));
  const exists = decideActions({ ...BASE_INV, customDimensions: { status: "ok", hasAdId: true } });
  assert.ok(!exists.actions.includes("create-ad-id-dimension"));
  assert.ok(exists.noops.some((n) => n.action === "create-ad-id-dimension" && /既に存在/.test(n.reason)));
  const ledgerDone = decideActions({ ...BASE_INV, ledger: { adIdStatus: "登録済" } });
  assert.ok(!ledgerDone.actions.includes("create-ad-id-dimension"));
});

test("decision: AdSense link 未リンク表示 × ad_impression 実データあり = 矛盾 blocker (作成しない)", () => {
  const inv = { ...BASE_INV, adsenseLinks: { status: "ok", linked: false }, customDimensions: { status: "ok", hasAdId: true } };
  const d = decideActions(inv);
  assert.ok(d.blockers.some((b) => b.code === "adsense-link-contradiction"));
  // AdSense link を作る action は allowlist に存在しない
  assert.ok(!d.actions.some((a) => /adsense/.test(a)));
});

test("decision: selector-drift (状態不明) では mutation を決めない (fail closed)", () => {
  const d1 = decideActions({ ...BASE_INV, scLinks: { status: "selector-drift" } });
  assert.ok(!d1.actions.includes("create-search-console-link"));
  assert.ok(d1.blockers.some((b) => b.code === "sc-links-unreadable"));
  const d2 = decideActions({ ...BASE_INV, customDimensions: { status: "selector-drift" } });
  assert.ok(!d2.actions.includes("create-ad-id-dimension"));
});

test("redaction: email / bearer / cookie / URL query を出力しない", () => {
  assert.equal(redactEmail("owner uruhayato373@gmail.com here"), "owner [REDACTED_EMAIL] here");
  const s = sanitize("Authorization: Bearer ya29.abcDEF-123 cookie=SID=xyz https://x.com/p?token=abc");
  assert.ok(!s.includes("ya29.abcDEF-123"));
  assert.ok(!s.includes("token=abc"));
  const obj = sanitizeObject({ note: "a@b.co", cookie: "SID=1", nested: { authorization: "Bearer x" } });
  assert.equal(obj.cookie, "[REDACTED]");
  assert.equal(obj.nested.authorization, "[REDACTED]");
  assert.ok(!JSON.stringify(obj).includes("a@b.co"));
});

test("lock: 取得・多重拒否・解放", () => {
  acquireLock();
  try {
    assert.ok(fs.existsSync(LOCK_FILE));
    // 同一プロセスの二重取得は「実行中」として拒否される
    assert.throws(() => acquireLock(), /既に実行中/);
  } finally {
    releaseLock();
  }
  assert.ok(!fs.existsSync(LOCK_FILE));
});

test("isLoginUrl: Google ログイン画面の検知", () => {
  assert.ok(isLoginUrl("https://accounts.google.com/v3/signin/identifier?x=1"));
  assert.ok(!isLoginUrl("https://analytics.google.com/analytics/web/#/p463218070/admin"));
});
