import assert from "node:assert/strict";
import test from "node:test";

import {
  validateTail,
  extractIds,
  extractA8mats,
  draftA8mat,
  uniqueId,
  renderEntry,
  insertEntry,
  buildAdDraft,
} from "../lib/a8-append-core.mjs";

const SRC = `import type { AffiliateAd } from "../src/features/ads/types";

const AFFILIATE_ADS_BASE: AffiliateAd[] = [
  {
    "id": "af_existing_001",
    "title": "既存案件",
    "htmlContent": "https://px.a8.net/svt/ejp?a8mat=EXIST",
    "adType": "banner"
  },
];
`;

const EMPTY_SRC = `const AFFILIATE_ADS_BASE: AffiliateAd[] = [];\n`;

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

test("validateTail: 正常な配列 → ok", () => {
  const v = validateTail(SRC);
  assert.equal(v.ok, true);
  assert.equal(v.isEmpty, false);
});

test("validateTail: 空配列 → ok isEmpty", () => {
  const v = validateTail(EMPTY_SRC);
  assert.equal(v.ok, true);
  assert.equal(v.isEmpty, true);
});

test("validateTail: 宣言なし → error", () => {
  assert.equal(validateTail("const x = [];").ok, false);
});

test("validateTail: 閉じ括弧なし → error", () => {
  const broken = SRC.replace("];", "");
  assert.equal(validateTail(broken).ok, false);
});

test("extractIds: 既存 id を抽出", () => {
  assert.deepEqual(extractIds(SRC), ["af_existing_001"]);
});

test("extractA8mats: SSOT 全文から a8mat トークンを集合抽出", () => {
  const s = extractA8mats(SRC);
  assert.ok(s.has("EXIST"));
  assert.equal(s.size, 1);
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

test("renderEntry: 2space インデント + 末尾カンマ + null 補完", () => {
  const lit = renderEntry(draft, "2026-07-19 00:00:00");
  assert.ok(lit.startsWith("  {"));
  assert.ok(lit.endsWith("},"));
  assert.ok(lit.includes('    "id": "af_new_a8_001"'));
  assert.ok(lit.includes('"createdAt": "2026-07-19 00:00:00"'));
  // JSON として (末尾カンマ除去で) パースできる
  const parsed = JSON.parse(lit.replace(/,$/, ""));
  assert.equal(parsed.vertical, "labor");
  assert.equal(parsed.width, 300);
});

test("insertEntry: 最終 ]; 直前に挿入・全体は追記後も配列が閉じる", () => {
  const lit = renderEntry(draft, "2026-07-19 00:00:00");
  const out = insertEntry(SRC, lit);
  assert.ok(out.includes("af_new_a8_001"));
  // 既存も残る
  assert.ok(out.includes("af_existing_001"));
  // ]; は最後に 1 つ
  assert.equal((out.match(/\];/g) || []).length, 1);
  // 挿入後、新エントリは ]; より前
  assert.ok(out.indexOf("af_new_a8_001") < out.lastIndexOf("];"));
  // 既存エントリの後に新エントリ (末尾追記)
  assert.ok(out.indexOf("af_existing_001") < out.indexOf("af_new_a8_001"));
});

test("insertEntry: 空配列にも挿入できる", () => {
  const lit = renderEntry(draft, "t");
  const out = insertEntry(EMPTY_SRC, lit);
  assert.ok(out.includes("af_new_a8_001"));
  assert.equal((out.match(/\];/g) || []).length, 1);
});

test("insertEntry: 壊れた tail は throw", () => {
  assert.throws(() => insertEntry("const x = 1;", "  {},"), /invalid tail/);
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
