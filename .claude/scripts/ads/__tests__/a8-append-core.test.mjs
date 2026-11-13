import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { datasetPath } from "../../../../config/datasets.mjs";
import {
  validateAdsDoc,
  parseAdsDoc,
  serializeAdsDoc,
  extractIds,
  extractA8mats,
  draftA8mat,
  uniqueId,
  renderEntry,
  appendEntry,
  buildAdDraft,
  validateDecisionTargets,
} from "../lib/a8-append-core.mjs";

const ROOT = join(import.meta.dirname, "../../../..");

const SRC = `{
  "ads": [
    {
      "id": "af_existing_001",
      "title": "既存案件",
      "htmlContent": "https://px.a8.net/svt/ejp?a8mat=EXIST",
      "adType": "banner"
    }
  ]
}
`;

const DOC = JSON.parse(SRC);
const EMPTY_DOC = { ads: [] };

const draft = {
  id: "af_new_a8_001",
  title: "新規案件",
  htmlContent: "https://px.a8.net/svt/ejp?a8mat=NEW",
  programRef: "a8:s00000000000001",
  areaCode: null,
  vertical: "labor",
  categoryKey: null,
  locationCode: "blog-bottom",
  isActive: true,
  priority: 50,
  startDate: null,
  endDate: null,
  targetCategories: null,
  adType: "banner",
  imageUrl: "https://www01.a8.net/svt/bgt?x",
  trackingPixelUrl: "https://www01.a8.net/0.gif?a8mat=NEW",
  width: 300,
  height: 250,
  createdAt: null,
  updatedAt: null,
};

test("parseAdsDoc / validateAdsDoc: 正常な台帳 → ok", () => {
  const parsed = parseAdsDoc(SRC);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.doc, DOC);
  const v = validateAdsDoc(DOC);
  assert.equal(v.ok, true);
  assert.equal(v.isEmpty, false);
});

test("validateAdsDoc: 空配列 → ok isEmpty", () => {
  const v = validateAdsDoc(EMPTY_DOC);
  assert.equal(v.ok, true);
  assert.equal(v.isEmpty, true);
});

test("parseAdsDoc: JSON として読めない (途中で切れた台帳) → error", () => {
  const r = parseAdsDoc(SRC.slice(0, SRC.length - 10));
  assert.equal(r.ok, false);
  assert.match(r.error, /^invalid-json:/);
});

test("validateAdsDoc: ads が無い・配列でない・id の無い要素 → error", () => {
  assert.equal(validateAdsDoc({}).ok, false);
  assert.equal(validateAdsDoc([]).ok, false);
  assert.equal(validateAdsDoc({ ads: {} }).ok, false);
  assert.equal(validateAdsDoc({ ads: [{ title: "id なし" }] }).ok, false);
  assert.equal(parseAdsDoc('{"ads": null}').ok, false);
});

test("serializeAdsDoc: 書き手の書き方は JSON.stringify(doc, null, 2) + 改行 で、読んで書き直しても変わらない", () => {
  assert.equal(serializeAdsDoc(DOC), SRC);
  assert.equal(serializeAdsDoc(parseAdsDoc(SRC).doc), SRC);
});

test("台帳 affiliate.ads は最初から書き手の書く形 (最初の追記で全行が差分にならない)", () => {
  const text = readFileSync(join(ROOT, datasetPath("affiliate.ads")), "utf8");
  const parsed = parseAdsDoc(text);
  assert.equal(parsed.ok, true, parsed.error);
  assert.equal(serializeAdsDoc(parsed.doc), text);
});

test("extractIds: 既存 id を抽出", () => {
  assert.deepEqual(extractIds(DOC), ["af_existing_001"]);
});

test("extractA8mats: 台帳の全項目から a8mat トークンを集合抽出", () => {
  const s = extractA8mats({
    ads: [
      { id: "a", htmlContent: "https://px.a8.net/svt/ejp?a8mat=EXIST" },
      { id: "b", htmlContent: "https://example.com", trackingPixelUrl: "https://www1.a8.net/0.gif?a8mat=PIXEL+X" },
    ],
  });
  assert.ok(s.has("EXIST"));
  assert.ok(s.has("PIXEL+X"));
  assert.equal(s.size, 2);
});

test("draftA8mat: draft の htmlContent から a8mat / 無ければ null", () => {
  assert.equal(draftA8mat({ htmlContent: "https://px.a8.net/svt/ejp?a8mat=NEW+X+Y+Z" }), "NEW+X+Y+Z");
  assert.equal(draftA8mat({ htmlContent: "https://example.com" }), null);
  assert.equal(draftA8mat({}), null);
});

test("uniqueId: 衝突なし → そのまま / 衝突 → 連番", () => {
  assert.equal(uniqueId("af_new_a8_001", ["af_existing_001"]), "af_new_a8_001");
  assert.equal(uniqueId("af_new_a8_001", ["af_new_a8_001"]), "af_new_a8_002");
  assert.equal(uniqueId("af_new_a8_001", ["af_new_a8_001", "af_new_a8_002"]), "af_new_a8_003");
});

test("renderEntry: 台帳の項目の順にそろえ、null を補完し、時刻を入れる", () => {
  const entry = renderEntry(draft, "2026-07-19 00:00:00");
  assert.equal(Object.keys(entry)[0], "id");
  assert.deepEqual(Object.keys(entry).slice(-2), ["createdAt", "updatedAt"]);
  assert.equal(entry.id, "af_new_a8_001");
  assert.equal(entry.createdAt, "2026-07-19 00:00:00");
  assert.equal(entry.vertical, "labor");
  assert.equal(entry.width, 300);
  assert.equal(renderEntry({ id: "x" }, "t").imageUrl, null);
});

test("appendEntry: 末尾に足し、既存を残し、元の文書は変えない", () => {
  const out = appendEntry(DOC, renderEntry(draft, "2026-07-19 00:00:00"));
  assert.deepEqual(out.ads.map((ad) => ad.id), ["af_existing_001", "af_new_a8_001"]);
  assert.equal(DOC.ads.length, 1);
  // 書き出すと既存の行はそのまま残り、追記分の行だけが増える
  const before = serializeAdsDoc(DOC).split("\n");
  const after = serializeAdsDoc(out).split("\n");
  assert.deepEqual(after.slice(0, 8), [...before.slice(0, 7), "    },"]);
  assert.deepEqual(after.slice(-4), ["    }", "  ]", "}", ""]);
  // 書き出した文字列は読み直せて、書き直しても変わらない
  assert.equal(serializeAdsDoc(parseAdsDoc(serializeAdsDoc(out)).doc), serializeAdsDoc(out));
});

test("appendEntry: 空配列にも足せる", () => {
  const out = appendEntry(EMPTY_DOC, renderEntry(draft, "t"));
  assert.deepEqual(out.ads.map((ad) => ad.id), ["af_new_a8_001"]);
});

test("appendEntry: 形の崩れた文書・既にある id は throw", () => {
  assert.throws(() => appendEntry({ ads: null }, renderEntry(draft, "t")), /invalid doc/);
  assert.throws(() => appendEntry(DOC, renderEntry({ ...draft, id: "af_existing_001" }, "t")), /id が重複/);
});

// ── buildAdDraft の locationCode 振り分け (2026-07-28 追加) ─────────────────
// banner 解決は locationCode を見ないが text 解決は見る (sidebar-bottom / footer)。
// text を blog-bottom に置くと banner 経路にも text 経路にも乗らず永久に表示されない。

const BANNER_FIELDS = {
  htmlContent: "https://px.a8.net/svt/ejp?a8mat=BANNER",
  imageUrl: "https://www23.a8.net/svt/bgt?aid=1&mid=s00000000000001001000",
  trackingPixelUrl: "https://www15.a8.net/0.gif?a8mat=BANNER",
  width: 300,
  height: 250,
  adType: "banner",
};
const TEXT_FIELDS = {
  htmlContent: "https://px.a8.net/svt/ejp?a8mat=TEXT",
  imageUrl: null,
  trackingPixelUrl: null,
  width: null,
  height: null,
  adType: "text",
};

test("buildAdDraft: text は sidebar-bottom に置く (blog-bottom だと表示されない)", () => {
  const d = buildAdDraft({ name: "Sample Program", programId: "s00000000000001", vertical: "energy" }, TEXT_FIELDS);
  assert.equal(d.locationCode, "sidebar-bottom");
  assert.equal(d.adType, "text");
  assert.equal(d.width, null);
  assert.equal(d.programRef, "a8:s00000000000001");
});

test("buildAdDraft: banner は blog-bottom (banner 解決は locationCode を見ないため既定のまま)", () => {
  const d = buildAdDraft({ name: "Sample Program", programId: "s00000000000001", vertical: "energy" }, BANNER_FIELDS);
  assert.equal(d.locationCode, "blog-bottom");
  assert.equal(d.adType, "banner");
  assert.equal(d.width, 300);
});

test("buildAdDraft: 日本語のみの名前でも programId から一意な id を作る", () => {
  const d = buildAdDraft({ name: "【公式】通信サービス", programId: "s00000012345001", vertical: "energy" }, BANNER_FIELDS);
  assert.equal(d.id, "af_s00000012345001_a8_001");
});

test("buildAdDraft: 混在名は ascii 部分だけを繋いで slug 化する", () => {
  // 非 ascii 連続は 1 個の "-" に畳まれる ("gmo とくとく bb" → "gmo-bb")。
  // 実在の af_gmo-bb-au_a8_001 と同じ作られ方。
  const d = buildAdDraft({ name: "GMO とくとく BB", programId: "s1", vertical: "energy" }, BANNER_FIELDS);
  assert.equal(d.id, "af_gmo-bb_a8_001");
});

test("buildAdDraft: vertical 未解決なら null を保つ (append 側で弾かせる)", () => {
  const d = buildAdDraft({ name: "X", programId: "s1" }, BANNER_FIELDS);
  assert.equal(d.vertical, null);
});

test("buildAdDraft: text の id は _text_ を挟んで種別が読める", () => {
  const b = buildAdDraft({ name: "Sample", programId: "s1", vertical: "energy" }, BANNER_FIELDS);
  const t = buildAdDraft({ name: "Sample", programId: "s1", vertical: "energy" }, TEXT_FIELDS);
  assert.equal(b.id, "af_sample_a8_001", "banner は従来の命名を変えない");
  assert.equal(t.id, "af_sample_a8_text_001");
  assert.notEqual(b.id, t.id, "同一プログラムでも id が衝突しない");
});

test("同一プログラムの banner と text は a8mat が別なので両方登録できる", () => {
  // A8 の a8mat は 4 セグメントで素材ごとに末尾が変わる (実データで確認済み)
  const b = buildAdDraft({ name: "S", programId: "s1", vertical: "energy" },
    { ...BANNER_FIELDS, htmlContent: "https://px.a8.net/svt/ejp?a8mat=4B5LK5+5YC2K2+5P1E+5ZEMP" });
  const t = buildAdDraft({ name: "S", programId: "s1", vertical: "energy" },
    { ...TEXT_FIELDS, htmlContent: "https://px.a8.net/svt/ejp?a8mat=4B5LK5+5YC2K2+5P1E+5YJRM" });
  const ab = draftA8mat(b), at = draftA8mat(t);
  assert.notEqual(ab, at, "a8mat が違えば dedup で skip されない");
  const existing = new Set([ab]);
  assert.equal(existing.has(at), false, "text は既登録扱いにならない");
});

// AFF-APPEND-TARGET-KEYS-01 (2026-10-19): 追記スクリプトが targetRankingKeys を書き出さず、decision レーンの 13 件を手で直した
test("renderEntry: targetRankingKeys があれば書き出し、無ければ出さない", () => {
  const withKeys = renderEntry({ ...draft, targetRankingKeys: ["real-disposable-income", "engel-coefficient"] }, "2026-10-19 00:00:00");
  assert.deepEqual(withKeys.targetRankingKeys, ["real-disposable-income", "engel-coefficient"]);
  const keys = Object.keys(withKeys);
  assert.ok(keys.indexOf("targetCategories") < keys.indexOf("targetRankingKeys"));
  assert.equal("targetRankingKeys" in renderEntry(draft, "2026-10-19 00:00:00"), false);
  assert.equal("targetRankingKeys" in renderEntry({ ...draft, targetRankingKeys: [] }, "2026-10-19 00:00:00"), false);
});

test("validateDecisionTargets: decision レーンは対象ランキングが空・実在しない key なら問題を返す", () => {
  const exists = (key) => key === "real-disposable-income";
  assert.deepEqual(validateDecisionTargets({ lane: "decision" }, ["real-disposable-income"], exists), []);
  assert.equal(validateDecisionTargets({ lane: "decision" }, [], exists).length, 1);
  assert.equal(validateDecisionTargets({ lane: "decision" }, undefined, exists).length, 1);
  assert.match(validateDecisionTargets({ lane: "decision" }, ["no-such-key"], exists)[0], /no-such-key/);
  assert.deepEqual(validateDecisionTargets({ lane: "discovery" }, [], exists), []);
});
