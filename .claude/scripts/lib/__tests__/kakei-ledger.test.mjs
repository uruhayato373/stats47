// 家計調査の台帳の導出と整合検査。実行: npm run estat:kakei-ledger:test
import assert from "node:assert/strict";
import test from "node:test";

import { buildKakeiLedger, checkKakeiLedger, classifyItemName, kakeiMetricInput } from "../estat-catalog/kakei-ledger.mjs";

const AMOUNT = "0004023605";
const QUANTITY = "0004023606";

function table(id, overrides = {}) {
  return {
    statsDataId: id,
    statCode: "00200561",
    title: `表 ${id}`,
    cycle: "年次",
    updatedDate: "2026-02-06",
    collectArea: "0",
    collectAreas: ["0"],
    removedAt: null,
    meta: { years: ["2024", "2025"], timeKind: "calendar-year", areaCount: 53, dims: [{ id: "cat01", name: "品目分類", count: 3 }] },
    ...overrides,
  };
}

function cls(statsDataId, code, name) {
  return { statsDataId, dim: "cat01", code, name, unit: "円", level: "5", parentCode: null };
}

const tables = [table(AMOUNT), table(QUANTITY), table("0002070005")];
const classes = [
  cls(AMOUNT, "010530030", "282 納豆"),
  cls(AMOUNT, "010100000", "1.1 穀類"),
  cls(AMOUNT, "000100000", "世帯人員"),
  cls(AMOUNT, "010110001", "100 米"),
  cls(QUANTITY, "010110001", "100 米"),
];
const metrics = [
  { key: "natto-consumption-expenditure", statsDataId: AMOUNT, cdCat02: "03", codes: ["010530030"], via: "single" },
  { key: "rice-consumption-quantity", statsDataId: QUANTITY, cdCat02: "03", codes: ["010110001"], via: "single" },
];
const decisions = {
  schemaVersion: 1,
  itemTables: { amount: AMOUNT, quantity: QUANTITY },
  tables: [],
  items: [{ code: "000100000", measure: "amount", status: "excluded", reason: "世帯の属性で消費の品目ではない", decidedAt: "2026-11-02", decidedBy: "test" }],
};
const build = (over = {}) =>
  buildKakeiLedger({ tables, classes, metrics, decisions, generatedAt: "2026-11-02T00:00:00Z", catalogGeneratedAt: null, ...over });

test("classifyItemName: 品目番号を持つ行・分類・属性を分ける", () => {
  assert.equal(classifyItemName("371 ぎょうざ"), "item");
  assert.equal(classifyItemName("38A 他の飲料"), "item");
  assert.equal(classifyItemName("1.1 穀類"), "group");
  assert.equal(classifyItemName("1 食料"), "group");
  assert.equal(classifyItemName("170-189 鮮魚"), "group"); // 品目番号の範囲は分類
  assert.equal(classifyItemName("260-269,26B,26X 他の野菜"), "group");
  assert.equal(classifyItemName("531,532 ティッシュペーパー・トイレットペーパー"), "group"); // 品目番号の列挙も分類
  assert.equal(classifyItemName("世帯人員"), "other");
  assert.equal(classifyItemName("消費支出"), "other");
});

test("kakeiMetricInput: 単品と合算 (axisSum) の取得条件を取り出し、家計調査以外は null", () => {
  const single = kakeiMetricInput({ key: "a", source: { kind: "kakei-chousa", filter: { statsDataId: AMOUNT, cdCat01: "1", cdCat02: "03" } } });
  assert.deepEqual(single, { key: "a", statsDataId: AMOUNT, cdCat02: "03", codes: ["1"], via: "single" });
  const sum = kakeiMetricInput({ key: "b", source: { kind: "kakei-chousa", filter: { statsDataId: "x", cdCat02: "03", axisSum: { axis: "cat01", codes: ["1", "2"] } } } });
  assert.deepEqual(sum.codes, ["1", "2"]);
  assert.equal(sum.via, "sum");
  assert.equal(kakeiMetricInput({ key: "c", source: { kind: "estat" } }), null);
});

test("buildKakeiLedger: 指標のある品目は adopted、判断のある品目は判断どおり、残りは undecided", () => {
  const ledger = build();
  const byKey = new Map(ledger.items.map((i) => [`${i.measure}:${i.code}`, i]));
  assert.equal(byKey.get(`amount:010530030`).status, "adopted");
  assert.deepEqual(byKey.get(`amount:010530030`).metrics, [{ key: "natto-consumption-expenditure", via: "single" }]);
  assert.equal(byKey.get(`amount:000100000`).status, "excluded");
  assert.equal(byKey.get(`amount:000100000`).reason, "世帯の属性で消費の品目ではない");
  assert.equal(byKey.get(`amount:010110001`).status, "undecided"); // 米の支出額は指標が無い (数量だけ)
  assert.equal(byKey.get(`quantity:010110001`).status, "adopted");
  assert.deepEqual(ledger.summary.items.amount.undecidedByKind, { group: 1, item: 1 });
  assert.equal(ledger.tables.find((t) => t.statsDataId === "0002070005").status, "undecided");
});

test("buildKakeiLedger: 二人以上の世帯 (cdCat02=03) 以外の指標は品目の採用に数えない", () => {
  const other = [{ key: "x", statsDataId: AMOUNT, cdCat02: "04", codes: ["010110001"], via: "single" }];
  const ledger = build({ metrics: other });
  assert.equal(ledger.items.find((i) => i.measure === "amount" && i.code === "010110001").status, "undecided");
});

test("checkKakeiLedger: 作ったばかりの台帳はエラーなし (未判断の表・品目は warn)", () => {
  const findings = checkKakeiLedger({ ledger: build(), metrics, decisions });
  assert.deepEqual(findings.filter((f) => f.level === "error"), []);
  assert.deepEqual(findings.map((f) => f.code), ["UNDECIDED_TABLES", "UNDECIDED_ITEMS"]);
});

test("checkKakeiLedger: 指標を足して台帳を作り直していなければ STALE_LEDGER で止める", () => {
  const ledger = build();
  const added = [...metrics, { key: "rice-consumption-expenditure", statsDataId: AMOUNT, cdCat02: "03", codes: ["010110001"], via: "single" }];
  const codes = checkKakeiLedger({ ledger, metrics: added, decisions }).filter((f) => f.level === "error").map((f) => f.code);
  assert.ok(codes.includes("STALE_LEDGER"));
});

test("checkKakeiLedger: e-Stat に無い表・品目を指す指標を止める", () => {
  const ledger = build();
  const bad = [
    ...metrics,
    { key: "ghost-table", statsDataId: "9999999999", cdCat02: "03", codes: ["1"], via: "single" },
    { key: "ghost-item", statsDataId: AMOUNT, cdCat02: "03", codes: ["019999999"], via: "single" },
  ];
  const codes = checkKakeiLedger({ ledger, metrics: bad, decisions }).map((f) => f.code);
  assert.ok(codes.includes("UNKNOWN_TABLE"));
  assert.ok(codes.includes("UNKNOWN_ITEM"));
});

test("checkKakeiLedger: 指標のある品目への見送り判断と、存在しない品目への判断を止める", () => {
  const conflicting = {
    ...decisions,
    items: [
      ...decisions.items,
      { code: "010530030", measure: "amount", status: "excluded", reason: "x", decidedAt: "2026-11-02", decidedBy: "t" },
      { code: "000000001", measure: "amount", status: "planned", reason: "x", decidedAt: "2026-11-02", decidedBy: "t" },
    ],
  };
  const codes = checkKakeiLedger({ ledger: build({ decisions: conflicting }), metrics, decisions: conflicting }).map((f) => f.code);
  assert.ok(codes.includes("DECISION_CONFLICT"));
  assert.ok(codes.includes("UNKNOWN_DECISION"));
});

// ── 2026-11-02: 分析単位も使い手として数え、切り口台帳との整合と未判断の上限を検査する ──
const QUINTILE = "0002070005";
const lensTables = (entries) => new Map(entries);
const errorCodes = (findings) => findings.filter((f) => f.level === "error").map((f) => f.code);

test("buildKakeiLedger: 作成済みの分析単位がある表は adopted、候補だけなら planned", () => {
  const staged = build({ analyses: [{ id: "food-quintile", statsDataId: QUINTILE, state: "staged" }] });
  assert.equal(staged.tables.find((t) => t.statsDataId === QUINTILE).status, "adopted");
  assert.deepEqual(staged.tables.find((t) => t.statsDataId === QUINTILE).analyses, ["food-quintile"]);
  const proposed = build({ analyses: [{ id: "food-quintile", statsDataId: QUINTILE, state: "proposed" }] });
  assert.equal(proposed.tables.find((t) => t.statsDataId === QUINTILE).status, "planned");
});

test("checkKakeiLedger: 切り口が使う表を未判断のままにすると LENS_TABLE_UNDECIDED で止め、判断を書けば通す", () => {
  const lenses = lensTables([[AMOUNT, ["city"]], [QUANTITY, ["city"]], [QUINTILE, ["income"]]]);
  assert.ok(errorCodes(checkKakeiLedger({ ledger: build(), metrics, lensTables: lenses, decisions })).includes("LENS_TABLE_UNDECIDED"));
  const decided = { ...decisions, tables: [{ statsDataId: QUINTILE, status: "planned", reason: "年収五分位の図", decidedAt: "2026-11-02", decidedBy: "test" }] };
  assert.deepEqual(errorCodes(checkKakeiLedger({ ledger: build({ decisions: decided }), metrics, lensTables: lenses, decisions: decided })), []);
});

test("checkKakeiLedger: 採用した表がどの切り口にも無ければ TABLE_WITHOUT_LENS、除外した表を切り口が使えば LENS_USES_EXCLUDED", () => {
  const onlyAmount = lensTables([[AMOUNT, ["city"]]]);
  assert.ok(errorCodes(checkKakeiLedger({ ledger: build(), metrics, lensTables: onlyAmount, decisions })).includes("TABLE_WITHOUT_LENS"));
  const excluded = { ...decisions, tables: [{ statsDataId: QUINTILE, status: "excluded", reason: "二重", decidedAt: "2026-11-02", decidedBy: "test" }] };
  const lenses = lensTables([[AMOUNT, ["city"]], [QUANTITY, ["city"]], [QUINTILE, ["income"]]]);
  assert.ok(errorCodes(checkKakeiLedger({ ledger: build({ decisions: excluded }), metrics, lensTables: lenses, decisions: excluded })).includes("LENS_USES_EXCLUDED"));
});

test("checkKakeiLedger: 未判断の表が上限を超えたら UNDECIDED_GREW で止め、上限内なら通す", () => {
  const ledger = build();
  assert.ok(errorCodes(checkKakeiLedger({ ledger, metrics, decisions: { ...decisions, maxUndecidedTables: 0 } })).includes("UNDECIDED_GREW"));
  assert.ok(!errorCodes(checkKakeiLedger({ ledger, metrics, decisions: { ...decisions, maxUndecidedTables: 1 } })).includes("UNDECIDED_GREW"));
});

test("checkKakeiLedger: 分析単位を足して台帳を作り直していなければ STALE_LEDGER で止める", () => {
  const codes = errorCodes(checkKakeiLedger({ ledger: build(), metrics, analyses: [{ id: "new", statsDataId: QUINTILE, state: "staged" }], decisions }));
  assert.ok(codes.includes("STALE_LEDGER"));
});
