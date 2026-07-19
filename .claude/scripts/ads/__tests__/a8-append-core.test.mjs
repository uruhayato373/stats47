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
} from "../lib/a8-append-core.mjs";

const SRC = `import type { AffiliateAd } from "../src/features/ads/types";

export const AFFILIATE_ADS: AffiliateAd[] = [
  {
    "id": "af_existing_001",
    "title": "既存案件",
    "htmlContent": "https://px.a8.net/svt/ejp?a8mat=EXIST",
    "adType": "banner"
  },
];
`;

const EMPTY_SRC = `export const AFFILIATE_ADS: AffiliateAd[] = [];\n`;

const draft = {
  id: "af_new_a8_001",
  title: "新規案件",
  htmlContent: "https://px.a8.net/svt/ejp?a8mat=NEW",
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
