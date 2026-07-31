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
  decideAdUnitActions,
  plannedActionToken,
  requireCommit,
} from "../apply-allowlisted-settings.mjs";
import {
  assertAdSenseAccount,
  deriveDesiredAdUnits,
  classifyApiState,
} from "../audit-adsense.mjs";
import { sanitize, sanitizeObject, redactEmail, redactHelpToken } from "../redact.mjs";
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

test("allowlist は意図した 5 action の集合そのもの・allowlist 外は runtime で throw", () => {
  // 長さだけでなく集合を順序込みで固定する (意図しない 6 個目の混入も落とす)
  assert.deepEqual(ALLOWED_ACTIONS, [
    "create-search-console-link",
    "publish-search-console-collection",
    "create-ad-id-dimension",
    "create-ad-unit",
    "rename-ad-unit",
  ]);
  for (const a of ALLOWED_ACTIONS) assert.equal(assertAllowed(a), a);
  for (const denied of [
    "delete-search-console-link",
    "create-adsense-link",
    "change-timezone",
    "delete-custom-dimension",
    "submit-sitemap",
    "change-auto-ads",
    // ad unit のうち破壊的・配信を即時に変えるものは denylist のまま
    "delete-ad-unit",
    "archive-ad-unit",
    "change-ad-format",
    "disable-ad-unit",
  ]) {
    assert.throws(() => assertAllowed(denied), /not in allowlist/);
  }
});

test("ALLOWED_ACTIONS は凍結されている (実行時に足せない)", () => {
  assert.throws(() => ALLOWED_ACTIONS.push("create-ad-unit-2"), TypeError);
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
  // (ad unit の 2 action は allowlist に入ったので、名前の部分一致ではなく明示的に判定する)
  assert.ok(!d.actions.includes("create-adsense-link"));
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

// ── ad unit action (C1) ───────────────────────────────────────────────────────

const AD_UNIT_INV_OK = {
  adsenseAccount: { status: "ok", accountId: "accounts/pub-7995274743017484" },
  adUnits: {
    status: "ok",
    source: "api",
    units: [
      { id: "111", displayName: "stats47-hub-incontent", slotId: "8185387982" },
      { id: "222", displayName: "サイドバー右上", slotId: "6180558947" },
    ],
    desired: [],
    codeSlots: [
      { exportName: "HUB_INCONTENT", slotId: "8185387982", adUnitName: "stats47-hub-incontent" },
    ],
  },
};

test("decision: inv.adUnits が無い呼び出しでは unit action を出さない (後方互換)", () => {
  const d = decideActions(BASE_INV);
  assert.ok(!d.actions.includes("create-ad-unit"));
  assert.ok(!d.actions.includes("rename-ad-unit"));
});

test("decideAdUnitActions: desired と同名の unit が既存なら作成しない (exact duplicate check)", () => {
  const inv = {
    ...AD_UNIT_INV_OK,
    adUnits: {
      ...AD_UNIT_INV_OK.adUnits,
      desired: [{ adUnitName: "stats47-hub-incontent", format: "article", exportName: "HUB_INCONTENT" }],
    },
  };
  const d = decideAdUnitActions(inv);
  assert.ok(!d.actions.includes("create-ad-unit"));
  assert.ok(d.noops.some((n) => n.action === "create-ad-unit" && /重複作成しない/.test(n.reason)));
});

test("decideAdUnitActions: 未作成の desired は 1 件だけ作成し残りは繰り越す", () => {
  const inv = {
    ...AD_UNIT_INV_OK,
    adUnits: {
      ...AD_UNIT_INV_OK.adUnits,
      desired: [
        { adUnitName: "stats47-new-a", format: "article", exportName: "NEW_A" },
        { adUnitName: "stats47-new-b", format: "rectangle", exportName: "NEW_B" },
      ],
    },
  };
  const d = decideAdUnitActions(inv);
  assert.deepEqual(d.actions.filter((a) => a === "create-ad-unit"), ["create-ad-unit"]);
  const planned = d.plan.filter((p) => p.action === "create-ad-unit");
  assert.equal(planned.length, 1);
  assert.equal(planned[0].adUnitName, "stats47-new-a");
  assert.ok(d.noops.some((n) => /繰り越す/.test(n.reason)));
});

test("decideAdUnitActions: slotId 一致で表示名が違えば rename・ID が引けなければ何もしない", () => {
  const mismatch = {
    ...AD_UNIT_INV_OK,
    adUnits: {
      ...AD_UNIT_INV_OK.adUnits,
      codeSlots: [{ exportName: "RANKING_SIDEBAR_TOP", slotId: "6180558947", adUnitName: "stats47-ranking-sidebar-top" }],
    },
  };
  const d = decideAdUnitActions(mismatch);
  assert.ok(d.actions.includes("rename-ad-unit"));
  const r = d.plan.find((p) => p.action === "rename-ad-unit");
  assert.equal(r.unitId, "222");
  assert.equal(r.from, "サイドバー右上");
  assert.equal(r.to, "stats47-ranking-sidebar-top");

  // slotId が inventory に無い = ID が引けない → 推測で rename しない
  const noId = {
    ...AD_UNIT_INV_OK,
    adUnits: {
      ...AD_UNIT_INV_OK.adUnits,
      codeSlots: [{ exportName: "UNKNOWN", slotId: "9999999999", adUnitName: "stats47-unknown" }],
    },
  };
  const d2 = decideAdUnitActions(noId);
  assert.ok(!d2.actions.includes("rename-ad-unit"));
});

test("decideAdUnitActions: inventory 不明・account assert 失敗では action 0 (fail closed)", () => {
  const drift = decideAdUnitActions({ ...AD_UNIT_INV_OK, adUnits: { status: "selector-drift" } });
  assert.deepEqual(drift.actions, []);
  assert.ok(drift.blockers.some((b) => b.code === "adunits-unreadable"));

  const badAccount = decideAdUnitActions({
    ...AD_UNIT_INV_OK,
    adsenseAccount: { status: "account-mismatch" },
    adUnits: { ...AD_UNIT_INV_OK.adUnits, desired: [{ adUnitName: "stats47-new", exportName: "NEW" }] },
  });
  assert.deepEqual(badAccount.actions, []);
  assert.ok(badAccount.blockers.some((b) => b.code === "adsense-account-assert-failed"));
});

// ── 承認ゲート (C2) ───────────────────────────────────────────────────────────

test("plannedActionToken: 同一入力で安定・計画が変われば変わる", () => {
  const base = { site: "stats47.jp", accountId: "accounts/pub-1", actions: ["create-ad-unit"], plan: [{ action: "create-ad-unit", adUnitName: "a" }] };
  const t1 = plannedActionToken(base);
  const t2 = plannedActionToken({ ...base, plan: [{ adUnitName: "a", action: "create-ad-unit" }] });
  assert.equal(t1, t2, "キー順が違うだけの同一計画は同じ token");
  assert.notEqual(t1, plannedActionToken({ ...base, plan: [{ action: "create-ad-unit", adUnitName: "b" }] }));
  assert.notEqual(t1, plannedActionToken({ ...base, actions: ["rename-ad-unit"] }));
  assert.notEqual(t1, plannedActionToken({ ...base, accountId: "accounts/pub-2" }));
  assert.notEqual(t1, plannedActionToken({ ...base, site: "other.jp" }));
});

test("requireCommit: --commit / --approve / site の 3 条件すべてが要る", () => {
  const token = "abc123";
  const ok = requireCommit({ argv: ["apply", "--confirm-site", "stats47.jp", "--commit", "--approve", token], site: "stats47.jp", expectedSite: "stats47.jp", expectedToken: token });
  assert.equal(ok.allowed, true);

  const noCommit = requireCommit({ argv: ["apply", "--approve", token], site: "stats47.jp", expectedSite: "stats47.jp", expectedToken: token });
  assert.equal(noCommit.allowed, false);
  assert.match(noCommit.reason, /--commit/);

  const noApprove = requireCommit({ argv: ["apply", "--commit"], site: "stats47.jp", expectedSite: "stats47.jp", expectedToken: token });
  assert.equal(noApprove.allowed, false);
  assert.match(noApprove.reason, /--approve/);

  const wrongToken = requireCommit({ argv: ["apply", "--commit", "--approve", "zzz"], site: "stats47.jp", expectedSite: "stats47.jp", expectedToken: token });
  assert.equal(wrongToken.allowed, false);
  assert.match(wrongToken.reason, /一致しない/);

  const wrongSite = requireCommit({ argv: ["apply", "--commit", "--approve", token], site: "other.jp", expectedSite: "stats47.jp", expectedToken: token });
  assert.equal(wrongSite.allowed, false);

  // --force 相当の迂回が効かないこと (そんなフラグは実装していない)
  const forced = requireCommit({ argv: ["apply", "--force", "--commit"], site: "stats47.jp", expectedSite: "stats47.jp", expectedToken: token });
  assert.equal(forced.allowed, false);
});

// ── AdSense account assert (C3) ───────────────────────────────────────────────

test("assertAdSenseAccount: ちょうど 1 件で expected 一致のみ ok (他は fail closed)", () => {
  const expected = "accounts/pub-7995274743017484";
  assert.equal(assertAdSenseAccount([{ name: expected }], expected).status, "ok");
  assert.equal(assertAdSenseAccount([], expected).status, "no-account");
  assert.equal(assertAdSenseAccount([{ name: expected }, { name: "accounts/pub-2" }], expected).status, "multiple-accounts");
  assert.equal(assertAdSenseAccount([{ name: "accounts/pub-999" }], expected).status, "account-mismatch");
  assert.equal(assertAdSenseAccount([{ name: expected }], null).status, "expected-missing");
});

test("assertAdSenseAccount: 不一致の detail に実アカウント ID を出さない (漏洩防止)", () => {
  const r = assertAdSenseAccount([{ name: "accounts/pub-999999" }], "accounts/pub-111111");
  assert.equal(r.status, "account-mismatch");
  assert.ok(!/pub-999999/.test(r.detail), "detail に別アカウントの ID を書かない");
});

test("deriveDesiredAdUnits: pending かつ slotId 未発行のものだけを対象にする", () => {
  const slots = [
    { exportName: "A", slotId: "", adUnitName: "stats47-a", format: "article", pending: true },
    { exportName: "B", slotId: "1234567890", adUnitName: "stats47-b", format: "article", pending: true },
    { exportName: "C", slotId: "", adUnitName: "stats47-c", format: "article", pending: false },
    { exportName: "D", slotId: "", adUnitName: null, format: "article", pending: true },
  ];
  const desired = deriveDesiredAdUnits(slots);
  assert.deepEqual(desired.map((d) => d.exportName), ["A"]);
});

// ── API 有効化チェック (手順 2 の自動化) ─────────────────────────────────────

test("classifyApiState: ENABLED のみ ok。DISABLED と不明は fail closed", () => {
  assert.equal(classifyApiState({ state: "ENABLED" }).status, "ok");

  const disabled = classifyApiState({ state: "DISABLED" });
  assert.equal(disabled.status, "api-not-enabled");
  assert.match(disabled.detail, /有効化/);

  // 不明な state を「有効」に倒さない (2026-07-30 の事故: 未有効化に CI で初めて気づいた)
  assert.equal(classifyApiState({ state: "STATE_UNSPECIFIED" }).status, "api-state-unknown");
  assert.equal(classifyApiState({}).status, "api-state-unknown");
  assert.equal(classifyApiState(null).status, "api-state-unknown");
  assert.equal(classifyApiState(undefined).status, "api-state-unknown");
});

test("redactHelpToken: Google API エラーの Help Token を落とす (無害な名前のキーの値でも)", () => {
  const raw = "Permission denied to get service [adsense.googleapis.com]\nHelp Token: AdZh9GftnGif_8N7huWgdS5KtXBV_LhQ";
  const out = redactHelpToken(raw);
  assert.ok(!/AdZh9GftnGif/.test(out), "token 本体が残っている");
  assert.match(out, /Help Token: \[REDACTED\]/);
  assert.match(out, /Permission denied/, "エラー本文自体は残す (診断に要る)");

  // sanitize / sanitizeObject の経路でも落ちること。
  // `detail` はキー名が機密パターンに当たらないので、文字列側で落とせているかが要点。
  assert.ok(!/AdZh9GftnGif/.test(sanitize(raw)));
  const obj = sanitizeObject({ audit: { adsenseApi: { status: "api-check-failed", detail: raw } } });
  assert.ok(!/AdZh9GftnGif/.test(JSON.stringify(obj)), "state JSON に token が残っている");
});
