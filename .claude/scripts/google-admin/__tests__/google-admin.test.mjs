/**
 * google-admin runner のテスト — allowlist/denylist・SC decision・GA4 dimension plan・
 * 承認ゲート・AdSense account assert・API pure helper・redaction・lock (README の安全契約)。
 * browser は起動しない (pure/decision 部のみ)。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ALLOWED_ACTIONS,
  AUTHORED_DIMENSIONS,
  EVENT_SCOPED_DIMENSION_CAP,
  assertAllowed,
  decideScActions,
  planCustomDimension,
  plannedActionToken,
  requireCommit,
} from "../apply-allowlisted-settings.mjs";
import { assertAdSenseAccount, collectAdUnits, deriveDesiredAdUnits } from "../audit-adsense.mjs";
import { assertPropertyId, assertStreamHost, summarizeCustomDimensions } from "../audit-ga4-api.mjs";
import { sanitize, sanitizeObject, redactEmail, redactHelpToken } from "../redact.mjs";
import { acquireLock, releaseLock, LOCK_FILE, isLoginUrl } from "../browser-context.mjs";

const SC_INV_OK = {
  gsc: { status: "ok", present: true, permissionLevel: "siteOwner" },
  scLinks: { status: "ok", linked: true },
  library: { status: "ok", hasScCollection: true, published: true },
};

// ── allowlist / denylist ──────────────────────────────────────────────────────

test("allowlist は Playwright residual の 2 action だけ・API action や AdSense write は allowlist 外", () => {
  assert.deepEqual(ALLOWED_ACTIONS, ["create-search-console-link", "publish-search-console-collection"]);
  for (const a of ALLOWED_ACTIONS) assert.equal(assertAllowed(a), a);
  for (const denied of [
    // AdSense write は制限 API・利用権限未証明のため実行経路を作らない
    "create-ad-unit",
    "rename-ad-unit",
    "delete-ad-unit",
    "change-ad-format",
    "change-auto-ads",
    // GA4 custom dimension 作成は承認付き API 経路 (Playwright allowlist ではない)
    "create-ga4-custom-dimension",
    "create-ad-id-dimension",
    // 破壊的・denylist
    "delete-search-console-link",
    "create-adsense-link",
    "change-timezone",
    "delete-custom-dimension",
    "submit-sitemap",
  ]) {
    assert.throws(() => assertAllowed(denied), /not in allowlist/);
  }
});

test("ALLOWED_ACTIONS は凍結されている (実行時に足せない)", () => {
  assert.throws(() => ALLOWED_ACTIONS.push("create-ad-unit"), TypeError);
});

// ── SC link / collection decision (Playwright residual) ───────────────────────

test("decideScActions: 全て整備済みなら no-op のみ (冪等)", () => {
  const d = decideScActions(SC_INV_OK);
  assert.deepEqual(d.actions, []);
  assert.equal(d.blockers.length, 0);
  assert.ok(d.noops.length >= 2);
});

test("decideScActions: SC link 0 件 + GSC property 実在 → create-search-console-link を 1 件だけ", () => {
  const d = decideScActions({ ...SC_INV_OK, scLinks: { status: "ok", linked: false } });
  assert.deepEqual(d.actions, ["create-search-console-link"]);
});

test("decideScActions: GSC property を API で確認できなければ link を作らない (blocker)", () => {
  const d = decideScActions({ ...SC_INV_OK, scLinks: { status: "ok", linked: false }, gsc: { status: "error", present: null } });
  assert.ok(!d.actions.includes("create-search-console-link"));
  assert.ok(d.blockers.some((b) => b.code === "gsc-property-missing"));
});

test("decideScActions: collection 未公開なら publish・未生成なら no-op (リンク後に再評価)", () => {
  const unpub = decideScActions({ ...SC_INV_OK, library: { status: "ok", hasScCollection: true, published: false } });
  assert.ok(unpub.actions.includes("publish-search-console-collection"));
  const none = decideScActions({ ...SC_INV_OK, library: { status: "ok", hasScCollection: false } });
  assert.ok(!none.actions.includes("publish-search-console-collection"));
  assert.ok(none.noops.some((n) => n.action === "publish-search-console-collection" && /未生成/.test(n.reason)));
});

test("decideScActions: selector-drift (状態不明) では mutation を決めない (fail closed)", () => {
  const d1 = decideScActions({ ...SC_INV_OK, scLinks: { status: "selector-drift" } });
  assert.ok(!d1.actions.includes("create-search-console-link"));
  assert.ok(d1.blockers.some((b) => b.code === "sc-links-unreadable"));
  const d2 = decideScActions({ ...SC_INV_OK, library: { status: "selector-drift" } });
  assert.ok(d2.blockers.some((b) => b.code === "library-unreadable"));
});

// ── GA4 custom dimension plan (承認付き API) ──────────────────────────────────

test("AUTHORED_DIMENSIONS: ad_id を含み、全て EVENT scope・parameterName 一意", () => {
  const params = AUTHORED_DIMENSIONS.map((d) => d.parameterName);
  assert.ok(params.includes("ad_id"));
  assert.deepEqual([...new Set(params)].length, params.length, "parameterName が重複している");
  for (const d of AUTHORED_DIMENSIONS) assert.equal(d.scope, "EVENT");
});

test("planCustomDimension: ⏳要登録 + authored + 未登録 + 空き枠 → 1 件だけ plan (安定順)", () => {
  const d = planCustomDimension({
    needsRegistrationParams: ["cta_id", "content_id"],
    existingParams: [],
    eventScopedCount: 5,
  });
  // 安定順 (昇順): content_id が先
  assert.equal(d.plan.parameterName, "content_id");
  assert.equal(d.plan.action, "create-ga4-custom-dimension");
  assert.equal(d.plan.scope, "EVENT");
  assert.ok(d.noops.some((n) => n.parameterName === "cta_id" && /繰り越す/.test(n.reason)));
});

test("planCustomDimension: 既存 parameter は作成しない・EVENT 以外の scope なら blocker", () => {
  const exists = planCustomDimension({ needsRegistrationParams: ["cta_id"], existingParams: ["cta_id"], eventScopedCount: 5 });
  assert.equal(exists.plan, null);
  assert.ok(exists.noops.some((n) => n.parameterName === "cta_id" && /既に存在/.test(n.reason)));

  const badScope = planCustomDimension({
    needsRegistrationParams: ["cta_id"],
    existingParams: ["cta_id"],
    existingScopeByParam: { cta_id: "USER" },
    eventScopedCount: 5,
  });
  assert.equal(badScope.plan, null);
  assert.ok(badScope.blockers.some((b) => b.code === "scope-mismatch"));
});

test("planCustomDimension: authored 定義が無い parameter は推測で作らない (blocker)", () => {
  const d = planCustomDimension({ needsRegistrationParams: ["unknown_param"], existingParams: [], eventScopedCount: 5 });
  assert.equal(d.plan, null);
  assert.ok(d.blockers.some((b) => b.code === "authored-definition-missing"));
});

test("planCustomDimension: 件数不明・上限到達では作成しない (fail closed)", () => {
  const unknown = planCustomDimension({ needsRegistrationParams: ["cta_id"], existingParams: [], eventScopedCount: null });
  assert.equal(unknown.plan, null);
  assert.ok(unknown.blockers.some((b) => b.code === "capacity-unknown"));

  const full = planCustomDimension({ needsRegistrationParams: ["cta_id"], existingParams: [], eventScopedCount: EVENT_SCOPED_DIMENSION_CAP });
  assert.equal(full.plan, null);
  assert.ok(full.blockers.some((b) => b.code === "no-capacity"));
});

test("planCustomDimension: ⏳要登録 が無ければ候補なし (plan null・blocker なし)", () => {
  const d = planCustomDimension({ needsRegistrationParams: [], existingParams: [], eventScopedCount: 5 });
  assert.equal(d.plan, null);
  assert.equal(d.blockers.length, 0);
});

// ── 承認ゲート ────────────────────────────────────────────────────────────────

test("plannedActionToken: 同一入力で安定・plan/site/propertyId が変われば変わる", () => {
  const base = { site: "stats47.jp", propertyId: "463218070", plan: { action: "create-ga4-custom-dimension", parameterName: "cta_id", scope: "EVENT" } };
  const t1 = plannedActionToken(base);
  const t2 = plannedActionToken({ ...base, plan: { scope: "EVENT", parameterName: "cta_id", action: "create-ga4-custom-dimension" } });
  assert.equal(t1, t2, "キー順が違うだけの同一 plan は同じ token");
  assert.notEqual(t1, plannedActionToken({ ...base, plan: { ...base.plan, parameterName: "content_id" } }));
  assert.notEqual(t1, plannedActionToken({ ...base, propertyId: "999" }));
  assert.notEqual(t1, plannedActionToken({ ...base, site: "other.jp" }));
});

test("requireCommit: --commit / --approve / site の 3 条件すべてが要る・--force は効かない", () => {
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

  const forced = requireCommit({ argv: ["apply", "--force", "--commit"], site: "stats47.jp", expectedSite: "stats47.jp", expectedToken: token });
  assert.equal(forced.allowed, false);
});

// ── AdSense account assert ────────────────────────────────────────────────────

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
  assert.deepEqual(deriveDesiredAdUnits(slots).map((d) => d.exportName), ["A"]);
});

// ── audit-ga4-api の pure helper ──────────────────────────────────────────────

test("assertPropertyId: properties/<expected> と一致のみ ok", () => {
  assert.equal(assertPropertyId({ name: "properties/463218070" }, "463218070").status, "ok");
  assert.equal(assertPropertyId({ name: "properties/999" }, "463218070").status, "property-mismatch");
  assert.equal(assertPropertyId({}, "463218070").status, "property-mismatch");
  assert.equal(assertPropertyId(null, "463218070").status, "property-mismatch");
});

test("assertStreamHost: expectedHost の web stream がちょうど存在するか (不一致は host を残さない)", () => {
  const ds = [
    { webStreamData: { defaultUri: "https://stats47.jp/" } },
    { webStreamData: { defaultUri: "https://other.example/" } },
  ];
  const ok = assertStreamHost(ds, "stats47.jp");
  assert.equal(ok.status, "ok");
  assert.equal(ok.host, "stats47.jp");

  // 実 GA4 の defaultUri は www.stats47.jp。apex と www は同一サイトとして受理する
  const www = assertStreamHost([{ webStreamData: { defaultUri: "https://www.stats47.jp" } }], "stats47.jp");
  assert.equal(www.status, "ok");

  const bad = assertStreamHost([{ webStreamData: { defaultUri: "https://foreign.example/" } }], "stats47.jp");
  assert.equal(bad.status, "host-mismatch");
  assert.ok(!JSON.stringify(bad).includes("foreign.example"), "別 host を state に残さない");
  // 別サイトの www サブドメインを stats47.jp と誤認しない
  assert.equal(assertStreamHost([{ webStreamData: { defaultUri: "https://stats47.jp.evil.example/" } }], "stats47.jp").status, "host-mismatch");

  const empty = assertStreamHost([], "stats47.jp");
  assert.equal(empty.status, "host-mismatch");
  assert.equal(empty.webStreamCount, 0);
});

test("summarizeCustomDimensions: parameter / scope / EVENT 件数を要約する", () => {
  const s = summarizeCustomDimensions([
    { parameterName: "ad_id", scope: "EVENT" },
    { parameterName: "user_key", scope: "USER" },
    { parameterName: "cta_id", scope: "EVENT" },
    { displayName: "no-param" },
  ]);
  assert.deepEqual(s.params.sort(), ["ad_id", "cta_id", "user_key"]);
  assert.equal(s.scopeByParam.user_key, "USER");
  assert.equal(s.eventScopedCount, 2);
  assert.equal(s.count, 4);
});

// ── redaction / lock / login ──────────────────────────────────────────────────

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

test("redactHelpToken: Google API エラーの Help Token を落とす (無害な名前のキーの値でも)", () => {
  const raw = "Permission denied to get service [adsense.googleapis.com]\nHelp Token: AdZh9GftnGif_8N7huWgdS5KtXBV_LhQ";
  const out = redactHelpToken(raw);
  assert.ok(!/AdZh9GftnGif/.test(out), "token 本体が残っている");
  assert.match(out, /Help Token: \[REDACTED\]/);
  assert.match(out, /Permission denied/, "エラー本文自体は残す (診断に要る)");
  assert.ok(!/AdZh9GftnGif/.test(sanitize(raw)));
  const obj = sanitizeObject({ audit: { adsense: { account: { status: "error", detail: raw } } } });
  assert.ok(!/AdZh9GftnGif/.test(JSON.stringify(obj)), "state JSON に token が残っている");
});

test("lock: 取得・多重拒否・解放", () => {
  acquireLock();
  try {
    assert.ok(fs.existsSync(LOCK_FILE));
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


// ── ad unit inventory: 1 client の失敗で全体を落とさない ──────────────────────

/**
 * googleapis の adsense client の最小 fake。
 * `unitsByClient` の値が Error なら、その client の adunits.list が投げる。
 */
function fakeAdsense(unitsByClient) {
  return {
    accounts: {
      adclients: {
        list: async () => ({ data: { adClients: Object.keys(unitsByClient).map((name) => ({ name })) } }),
        adunits: {
          list: async ({ parent }) => {
            const v = unitsByClient[parent];
            if (v instanceof Error) throw v;
            return { data: { adUnits: v } };
          },
          // native ad unit は adcode を持たない (本番で毎回投げている正常系)
          getAdcode: async () => {
            throw new Error("adcode is not supported for native ad units.");
          },
        },
      },
    },
  };
}

test("collectAdUnits: 動く client のユニットを、壊れた client があっても返す", async () => {
  // ★本番の形: content 用 ca-pub-* は読めるが、AdSense for Search の partner-pub-* は
  //   広告ユニットの概念を持たず NOT_FOUND を返す (2026-08-16 の run で実測)。
  const adsense = fakeAdsense({
    "accounts/pub-1/adclients/ca-pub-1": [
      { name: "accounts/pub-1/adclients/ca-pub-1/adunits/1", reportingDimensionId: "1", displayName: "sidebar" },
    ],
    "accounts/pub-1/adclients/partner-pub-1": new Error("Couldn't find the ad client with name 'partner-pub-1'."),
  });

  const { units, skippedClients } = await collectAdUnits(adsense, "accounts/pub-1");

  assert.equal(units.length, 1, "読めた client のユニットが落ちている");
  assert.equal(units[0].displayName, "sidebar");
  assert.equal(units[0].slotId, "", "getAdcode 失敗はユニットを落とす理由にしない");
  assert.equal(skippedClients.length, 1, "落ちた client を黙って捨てている");
  assert.match(skippedClients[0], /partner-pub-1/);
});

test("collectAdUnits: 全 client が失敗したときだけ throw する (0 件を「ユニット無し」と誤読させない)", async () => {
  const adsense = fakeAdsense({
    "accounts/pub-1/adclients/ca-pub-1": new Error("boom"),
    "accounts/pub-1/adclients/partner-pub-1": new Error("NOT_FOUND"),
  });

  await assert.rejects(() => collectAdUnits(adsense, "accounts/pub-1"), /全 2 件の ad client/);
});

test("collectAdUnits: ad client が 0 件なら throw せず空を返す", async () => {
  const { units, skippedClients } = await collectAdUnits(fakeAdsense({}), "accounts/pub-1");
  assert.deepEqual(units, []);
  assert.deepEqual(skippedClients, []);
});

test("collectAdUnits: ページングを辿る", async () => {
  let call = 0;
  const adsense = {
    accounts: {
      adclients: {
        list: async () => ({ data: { adClients: [{ name: "c1" }] } }),
        adunits: {
          list: async () => {
            call += 1;
            return call === 1
              ? { data: { adUnits: [{ name: "c1/adunits/1", reportingDimensionId: "1" }], nextPageToken: "t" } }
              : { data: { adUnits: [{ name: "c1/adunits/2", reportingDimensionId: "2" }] } };
          },
          getAdcode: async () => ({ data: { adCode: '<ins data-ad-slot="12345"></ins>' } }),
        },
      },
    },
  };

  const { units } = await collectAdUnits(adsense, "accounts/pub-1");
  assert.deepEqual(units.map((u) => u.id), ["1", "2"]);
  assert.equal(units[0].slotId, "12345");
});
