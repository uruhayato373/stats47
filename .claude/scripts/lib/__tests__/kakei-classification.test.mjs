import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { checkKakeiMetric, itemNumberFromCat01Name } from "../../estat/lib/kakei-classification.mjs";
import { parseClassificationRows } from "../../estat/build-kakei-classification.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const classification = JSON.parse(fs.readFileSync(path.join(ROOT, "data/estat/kakei-classification/2020.json"), "utf8"));
const names = new Map([
  ["010920070", "371 ぎょうざ"],
  ["010920100", "370 冷凍調理食品"],
  ["010000000", "1 食料"],
  ["010900000", "1.9 調理食品"],
]);
const gyoza = (fields) => ({ key: "gyoza-frozen-consumption-expenditure", title: "ぎょうざ消費支出額", cdCat01: "010920070", ...fields });

test("正本は 371 ぎょうざ の冷凍品を 370 へ移すと記録している (2026-10-08 の誤りの根拠)", () => {
  assert.deepEqual(classification.items["371"].excludes, [{ text: "ぎょうざの冷凍品", movedTo: "370" }]);
  assert.equal(classification.items["371"].group.code, "1.9.2");
});

test("ぎょうざに冷凍が含まれると書いた 2026-10-08 以前の注記を指摘する", () => {
  const before = gyoza({ note: "家計調査の「ぎょうざ」は県庁所在市の二人以上世帯が持ち帰り（冷凍・調理済み）で購入した支出額。店内で食べた分は外食に含まれ、この値には入らない" });
  const { findings } = checkKakeiMetric(before, names, classification);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].code, "CONTRADICTS_EXCLUSION");
  assert.match(findings[0].message, /ぎょうざの冷凍品→370/);
});

test("冷凍品を除くと書いた注記・副題は指摘しない", () => {
  const after = gyoza({
    subtitle: "都道府県庁所在市の二人以上世帯の年間ぎょうざ消費支出額（冷凍品を除く）",
    note: "冷凍品は別品目の「冷凍調理食品」に入り、この値には含まれない。",
  });
  assert.deepEqual(checkKakeiMetric(after, names, classification).findings, []);
});

test("品目名に含まれる語 (370 冷凍調理食品 の冷凍) は矛盾として扱わない", () => {
  const frozen = { key: "frozen-food-consumption-expenditure", title: "冷凍調理食品消費支出額", cdCat01: "010920100" };
  assert.deepEqual(checkKakeiMetric(frozen, names, classification).findings, []);
});

test("十大費目・中分類は品目番号に解決しない", () => {
  assert.equal(itemNumberFromCat01Name("1 食料"), null);
  assert.equal(itemNumberFromCat01Name("1.9 調理食品"), null);
  assert.equal(itemNumberFromCat01Name("38A 乳飲料"), "38A");
  assert.equal(checkKakeiMetric({ key: "food", cdCat01: "010000000" }, names, classification).item, null);
});

test("メタ控えに無い cdCat01 は解決不能として指摘する", () => {
  assert.equal(checkKakeiMetric({ key: "x", cdCat01: "999999999" }, names, classification).findings[0].code, "UNRESOLVED_CAT01");
});

test("Excel の行から品目・グループ・折り返しの例示を組み立てる", () => {
  const row = (a, d, f, g, o) => { const r = new Array(15).fill(null); r[0] = a; r[3] = d; r[5] = f; r[6] = g; r[14] = o; return r; };
  const items = parseClassificationRows([
    row("(364～376)", "1.9.2", null, "他の調理食品", null),
    row("370", null, null, "冷凍調理食品", "｢1.9.2 他の調理食品｣の冷凍食品。"),
    row(null, null, null, null, "○  冷凍食品（コロッケ ぎょうざ"),
    row(null, null, null, null, "からあげ）"),
    row("371", null, null, "ぎょうざ", "生も含む。"),
    row(null, null, null, null, "×  ぎょうざの冷凍品→370"),
    row("380～389\n・38A", "1.10", "飲料", null, null),
    row("38A", null, null, "乳飲料", null),
  ], "2消費支出");
  assert.deepEqual(items["370"].includes, ["冷凍食品（コロッケ ぎょうざ からあげ）"]);
  assert.deepEqual(items["371"].excludes, [{ text: "ぎょうざの冷凍品", movedTo: "370" }]);
  assert.deepEqual(items["38A"].group, { code: "1.10", codeKind: "number", name: "飲料", range: "380～389・38A" });
});

// KAKEI-CLASSIFICATION-GROUP-CODE-01: 公式表のどの列にも分類番号が無い見出し (「鮮　魚」「食事代」) で
// group.code が null になっていた。番号を作らず A 列の品目範囲を code にし、名前の空白・改行を詰める。
test("分類番号の無い見出しは品目範囲を code にし、名前の空白と改行を詰める", () => {
  const row = (a, d, f, g, o) => { const r = new Array(15).fill(null); r[0] = a; r[3] = d; r[5] = f; r[6] = g; r[14] = o; return r; };
  const items = parseClassificationRows([
    row("(170～194)", "1.2.1", null, "生鮮魚介", null),
    row("(170～189)", null, null, "鮮　魚", "刺身，切身(フィレ)を問わない。"),
    row("170", null, null, "まぐろ", null),
    row("390～396　 ･399･39A　　･39B ", null, null, "食事代", null),
    row("390", null, null, "日本そば・うどん", null),
    row("(040～049･052)", null, "実収入以外の受取\n（繰入金を除く）", null, null),
    row("041", null, null, "財産売却", null),
    row("451～459   ・45X ", "4.1.1", null, "家事用耐久財", null),
    row("・45X", null, null, null, "×  付属品→529"),
    row("451", null, null, "電子レンジ", null),
  ], "2消費支出");
  assert.deepEqual(items["170"].group, { code: "170～189", codeKind: "range", name: "鮮魚", range: "170～189" });
  assert.deepEqual(items["390"].group, { code: "390～396・399・39A・39B", codeKind: "range", name: "食事代", range: "390～396・399・39A・39B" });
  assert.deepEqual(items["041"].group, { code: "040～049・052", codeKind: "range", name: "実収入以外の受取（繰入金を除く）", range: "040～049・052" });
  // A 列だけの折り返し行は新しい見出しにしない (以前は code null・name "" の見出しになっていた)
  assert.equal(items["451"].group.code, "4.1.1");
  assert.equal(items["451"].group.name, "家事用耐久財");
});

test("控えの全品目に group.code がある (2020・2025)", () => {
  for (const revision of ["2020", "2025"]) {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, `data/estat/kakei-classification/${revision}.json`), "utf8"));
    const missing = Object.values(data.items).filter((item) => !item.group?.code).map((item) => item.code);
    assert.deepEqual(missing, [], `${revision}: group.code が無い品目`);
    const spaced = Object.values(data.items).filter((item) => /\s/.test(item.group?.name ?? "")).map((item) => item.code);
    assert.deepEqual(spaced, [], `${revision}: 見出し名に空白・改行が残る品目`);
  }
});
