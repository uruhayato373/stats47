import assert from "node:assert/strict";
import test from "node:test";

import { mentionsAffirmatively } from "../build-metric-definition-sheet.ts";

test("否定して書いた語 (法人企業数ではなく) は対象に数えず、肯定の出現は数える", () => {
  assert.equal(mentionsAffirmatively("飼養戸数は法人企業数ではなく、飼養者の戸数", "企業"), false);
  assert.equal(mentionsAffirmatively("事業所を除く集計", "事業所"), false);
  assert.equal(mentionsAffirmatively("従業者4人以上の事業所の出荷額", "事業所"), true);
  // 否定の出現と肯定の出現が両方あれば数える
  assert.equal(mentionsAffirmatively("個人ではなく企業ではない。民営の企業が対象", "企業"), true);
});

test("補助の出典から取る年を調査欄に添え、補助が無ければ何も足さない", async () => {
  const { supplementalLabel } = await import("../build-metric-definition-sheet.ts");
  const label = supplementalLabel({
    supplementalSources: [{ years: [2025], source: { kind: "estat", statsDataId: "0004065933", displayName: "国勢調査" }, reason: "r" }],
  } as never);
  assert.equal(label, " (2025年は国勢調査 表0004065933)");
  assert.equal(supplementalLabel({}), "");
});

// BLOG-METRIC-DEFINITION-GAPS-01: 記事が使う 4 指標は、統計局・e-Stat の項目定義を description に持ち、
// 指標定義シートの「対象・分母」欄が空 (対象の記述なし) にならない。
test("大学収容力指数・年間日照時間・共働き世帯割合・高校卒業者の進学率の定義シートに対象の記述がある", async () => {
  const { buildSheet } = await import("../build-metric-definition-sheet.ts");
  const keys = ["university-capacity-index", "annual-sunshine-duration", "dual-income-household-ratio", "high-school-advancement-rate"];
  const rows = buildSheet(keys).split("\n").filter((l) => l.startsWith("| `"));
  assert.equal(rows.length, keys.length);
  for (const row of rows) assert.ok(!row.includes("対象の記述なし"), row);
  const byKey = (k: string) => rows.find((r) => r.startsWith(`| \`${k}\``)) ?? "";
  // 観測地点は県庁所在地の気象台 (埼玉・東京・滋賀は例外)。県全体の平均ではない
  assert.match(byKey("annual-sunshine-duration"), /都道府県庁所在地/);
  // 分母は一般世帯数 (世帯の種類の取り違えを防ぐ)
  assert.match(byKey("dual-income-household-ratio"), /一般世帯/);
  // 分母は新規の高等学校卒業者
  assert.match(byKey("high-school-advancement-rate"), /高等学校卒業者/);
  // 計算式は大学入学者数 ÷ 前年度の大学進学者数
  assert.match(byKey("university-capacity-index"), /大学入学者/);
});

// METRIC-GATE-FOLLOWUP-01: 「読み違い注意」は題名に「指数」があるだけで「指数 (基準=100)」と出していた。
// 大学収容力指数は入学者数 ÷ 前年度進学者数 × 100 で、全国=100 の指数ではない。基準は単位・副題が宣言するときだけ書く。
test("読み違い注意は、単位や副題が基準を宣言する指数にだけ「基準=100」を出す", async () => {
  const { buildSheet } = await import("../build-metric-definition-sheet.ts");
  const rowOf = (key: string) => buildSheet([key]).split("\n").find((l) => l.startsWith("| `")) ?? "";
  // 算式で決まる指数 (全国=100 ではない) には基準を言わない
  for (const key of ["university-capacity-index", "aging-index", "fiscal-strength-index"]) {
    assert.doesNotMatch(rowOf(key), /基準=100/, key);
  }
  // 単位が基準を宣言する指数は、その基準をそのまま出す
  assert.match(rowOf("consumer-price-difference-index-overall"), /指数 \(全国=100\): 実額に換算しない/);
  assert.match(rowOf("cpi-regional-difference-index-total-tokyo100"), /指数 \(東京=100\): 実額に換算しない/);
});
