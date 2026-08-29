import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRows,
  parsePrefectureTotals,
  verifyRows,
} from "../fetch-japanese-instruction-students.mjs";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県",
  "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県",
  "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

function fixture(names = PREFECTURES) {
  return names.map((name, index) => `${name} 1 2 3 ${index + 10} 0 100.0% ${index + 9}`).join("\n");
}

test("令和7年度合計列を47都道府県分だけ抽出する", () => {
  const parsed = parsePrefectureTotals(fixture());
  assert.equal(parsed.size, 47);
  assert.equal(parsed.get("北海道"), 10);
  assert.equal(parsed.get("沖縄県"), 56);
});

test("1県でも欠けた表は検証を通さない", () => {
  assert.throws(() => parsePrefectureTotals(fixture(PREFECTURES.slice(0, -1))), /46\/47/);
});

test("外国籍と日本国籍を同じ県コードで合算する", () => {
  const foreign = parsePrefectureTotals(fixture());
  const japanese = parsePrefectureTotals(fixture());
  const rows = buildRows(foreign, japanese);
  assert.deepEqual(rows[0], {
    areaCode: "01000",
    areaName: "北海道",
    yearCode: "2025",
    yearName: "2025",
    value: 20,
    unit: "人",
  });
  const sum = (values) => [...values.values()].reduce((total, value) => total + value, 0);
  assert.doesNotThrow(() => verifyRows(rows, foreign, japanese, {
    foreign: sum(foreign),
    japanese: sum(japanese),
    combined: rows.reduce((total, row) => total + row.value, 0),
  }));
});

test("負値や非整数の観測値はR2生成前に停止する", () => {
  const foreign = parsePrefectureTotals(fixture());
  const japanese = parsePrefectureTotals(fixture());
  const rows = buildRows(foreign, japanese);
  rows[0].value = -1;
  assert.throws(() => verifyRows(rows, foreign, japanese), /0以上の整数/);
});

test("都道府県コードの重複はR2生成前に停止する", () => {
  const foreign = parsePrefectureTotals(fixture());
  const japanese = parsePrefectureTotals(fixture());
  const rows = buildRows(foreign, japanese);
  rows[1].areaCode = rows[0].areaCode;
  assert.throws(() => verifyRows(rows, foreign, japanese), /重複/);
});
