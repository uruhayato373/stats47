import test from "node:test";
import assert from "node:assert/strict";

import { verifySite, assertSiteOrThrow, extractSiteId, SiteAttributionError } from "../lib/asp-site-guard.mjs";

// ── ID read-back が取れているケース (最も強い証拠) ──────────────────────────

test("ID が一致すれば通す", () => {
  const r = verifySite({ actualSiteId: "959426", expectedSiteId: "959426" });
  assert.equal(r.ok, true);
  assert.equal(r.matchedBy, "id");
});

test("ID が不一致なら落とす", () => {
  const r = verifySite({ actualSiteId: "984453", expectedSiteId: "959426" });
  assert.equal(r.ok, false);
  assert.match(r.reason, /不一致/);
  assert.equal(r.actualSiteId, "984453");
});

test("ID が数値でも文字列の期待値と一致扱いにする", () => {
  const r = verifySite({ actualSiteId: 959426, expectedSiteId: "959426" });
  assert.equal(r.ok, true);
});

test("ID が取れているときは禁止文字列を見ない (切替 UI が全サイト名を列挙するため)", () => {
  // afb のサイト切替ドロップダウンには他サイト名も必ず表示される。
  // ここで禁止文字列を効かせると「ID は正しいのに停止」する誤検知になる。
  const r = verifySite({
    actualSiteId: "959426",
    expectedSiteId: "959426",
    visibleText: "サイト選択: 統計で見る都道府県 / doboku-note",
    forbiddenText: ["doboku-note"],
  });
  assert.equal(r.ok, true);
});

// ── ID が取れない弱い判定 (表示名フォールバック) ────────────────────────────

test("ID が取れないとき、表示名が見えていれば通す", () => {
  const r = verifySite({
    actualSiteId: null,
    expectedSiteId: null,
    expectedSiteName: "統計で見る都道府県",
    visibleText: "メディア: 統計で見る都道府県",
  });
  assert.equal(r.ok, true);
  assert.equal(r.matchedBy, "name");
});

test("ID が取れず他サイトの識別子が見えていれば落とす", () => {
  const r = verifySite({
    actualSiteId: null,
    expectedSiteId: null,
    expectedSiteName: "統計で見る都道府県",
    visibleText: "メディア: 統計で見る都道府県 / doboku-note",
    forbiddenText: ["doboku-note"],
  });
  assert.equal(r.ok, false);
  assert.match(r.reason, /他サイトの識別子/);
});

test("ID が取れず期待表示名も見当たらなければ落とす", () => {
  const r = verifySite({
    actualSiteId: null,
    expectedSiteId: null,
    expectedSiteName: "統計で見る都道府県",
    visibleText: "ログインしてください",
  });
  assert.equal(r.ok, false);
  assert.match(r.reason, /見当たらない/);
});

test("空白だけの actualSiteId は read-back 失敗として扱う", () => {
  const r = verifySite({
    actualSiteId: "   ",
    expectedSiteId: "959426",
    expectedSiteName: "統計で見る都道府県",
    visibleText: "統計で見る都道府県",
  });
  // ID 判定に入らず表示名フォールバックへ落ちる
  assert.equal(r.matchedBy, "name");
  assert.equal(r.ok, true);
});

test("expectedSiteId も expectedSiteName も無ければ config の設定漏れとして落とす", () => {
  const r = verifySite({ actualSiteId: "959426" });
  assert.equal(r.ok, false);
  assert.match(r.reason, /設定されていない/);
});

test("ID も表示名も無ければ落とす (read-back 不能)", () => {
  const r = verifySite({ actualSiteId: null, expectedSiteId: "959426" });
  assert.equal(r.ok, false);
  assert.match(r.reason, /read-back/);
});

// ── assert (握り潰せない形) ────────────────────────────────────────────────

test("assertSiteOrThrow は不一致で SiteAttributionError を投げる", () => {
  assert.throws(
    () => assertSiteOrThrow({ actualSiteId: "984453", expectedSiteId: "959426" }),
    (e) => e instanceof SiteAttributionError && e.expectedSiteId === "959426",
  );
});

test("assertSiteOrThrow は一致すれば判定結果を返す", () => {
  const r = assertSiteOrThrow({ actualSiteId: "959426", expectedSiteId: "959426" });
  assert.equal(r.ok, true);
});

// ── ID 抽出 (実機で確認した書式のみ) ────────────────────────────────────────

test("afb の【SID】書式から ID を抜く", () => {
  const id = extractSiteId("現在選択中のサイト情報【SID】959426 統計で見る都道府県", "【SID】\\s*(\\d+)");
  assert.equal(id, "959426");
});

test("A8 のメディア ID 書式から口座 ID を抜く", () => {
  const id = extractSiteId("メディアID a25050375786", "(a\\d{11})");
  assert.equal(id, "a25050375786");
});

test("マッチしなければ null", () => {
  assert.equal(extractSiteId("サイト情報なし", "【SID】\\s*(\\d+)"), null);
});

test("入力が空なら null (例外にしない)", () => {
  assert.equal(extractSiteId("", "(\\d+)"), null);
  assert.equal(extractSiteId("959426", ""), null);
  assert.equal(extractSiteId(null, "(\\d+)"), null);
});
