import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  UNDETERMINED_CEILING,
  buildRules,
  checkSsdsYearFormats,
  classifyPeriod,
  decideYearFormat,
  indexDefinitions,
  parseIndicatorFormulas,
  parseItemDefinitions,
  splitSurveys,
} from "../../estat/lib/ssds-year-format.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const definitions = readJson("data/estat/ssds-year-format/definitions.json");
const decisions = readJson("data/estat/ssds-year-format/decisions.json");
const index = indexDefinitions(definitions);
const rules = buildRules(decisions);
const decide = (statsDataId, cdCat01) => decideYearFormat({ statsDataId, cdCat01 }, index, rules);

/** 「統計項目の定義」の 1 節を、実ページと同じ形 (<hr> 区切り・4 列の表・末尾に調査名) で作る */
function section({ anchors = [], rows, survey }) {
  const cell = (lines) => `<td>${lines.map((line) => `<p><b>${line}</b></p>`).join("\n")}</td>`;
  const body = rows.map((row) => `<tr>${cell(row.codes)}${cell(row.names)}${cell([row.unit ?? "人"])}${cell(row.periods)}</tr>`).join("\n");
  return `<hr noshade="noshade" size="6">
<p>${anchors.map((name) => `<a name="${name}"></a>`).join("")}</p>
<table><tbody>
<tr><td><p><b>項目符号</b></p></td><td><p><b>項　　目　　名</b></p></td><td><p><b>単　位</b></p></td><td><p><b>時点又は期間</b></p></td></tr>
${body}
</tbody></table>
<p><b>定　義</b><br>省略<br><b>調査名又は報告書名</b> 　${survey}<br><b>機 関 名</b> 　省略</p>`;
}

test("定義の表: 期間が 1 つなら、同じ欄の全符号にその期間を当てる (全角の数字は半角にそろえる)", () => {
  const { items } = parseItemDefinitions(section({
    rows: [{ codes: ["A1101", "A110101", "A110102"], names: ["総人口", "総人口（男）", "総人口（女）"], periods: ["10月１日"] }],
    survey: "国勢調査、人口推計",
  }));
  assert.deepEqual(items, [
    { code: "A1101", name: "総人口", period: "10月1日", survey: "国勢調査、人口推計" },
    { code: "A110101", name: "総人口（男）", period: "10月1日", survey: "国勢調査、人口推計" },
    { code: "A110102", name: "総人口（女）", period: "10月1日", survey: "国勢調査、人口推計" },
  ]);
});

test("定義の表: 符号ごとに期間が並ぶ欄は行で対応づけ、「〃」は上の行と同じにする", () => {
  const { items } = parseItemDefinitions(section({
    rows: [{ codes: ["I6200", "I6201", "I621110", "I621111"], names: ["a", "b", "c", "d"], periods: ["12月31日", "〃", "10月1日", "〃"] }],
    survey: "医師・歯科医師・薬剤師統計、医療施設調査",
  }));
  assert.deepEqual(items.map((item) => [item.code, item.period]), [
    ["I6200", "12月31日"], ["I6201", "12月31日"], ["I621110", "10月1日"], ["I621111", "10月1日"],
  ]);
});

test("定義の表: 1 つの期間が複数行に折り返された欄は、行数が符号と同じでも 1 つの期間として読む", () => {
  const { items } = parseItemDefinitions(section({
    rows: [{ codes: ["C3501", "C350101", "C350102"], names: ["商業年間商品販売額", "卸売業", "小売業"], periods: ["調査日前", "暦年計"] },
      { codes: ["B1105", "B1106", "B1107"], names: ["a", "b", "c"], periods: ["センサス", "実施年の", "２月１日"] }],
    survey: "経済センサス-活動調査",
  }));
  assert.deepEqual(items.map((item) => item.period), ["調査日前暦年計", "調査日前暦年計", "調査日前暦年計", "センサス実施年の2月1日", "センサス実施年の2月1日", "センサス実施年の2月1日"]);
});

test("定義の表: 「│」「～」で書かれた範囲の間の符号と、<a name> にだけ現れる細分の符号も引ける", () => {
  const html = section({ rows: [{ codes: ["A4101", "│", "A410209"], names: ["出生数など"], periods: ["暦年計"] }], survey: "人口動態調査" })
    + section({ anchors: ["C61", "C6101", "C610117"], rows: [{ codes: ["C61"], names: ["売上金額"], periods: ["調査日前", "暦年計"] }], survey: "経済センサス-活動調査" });
  const parsed = parseItemDefinitions(html);
  assert.deepEqual(parsed.ranges, [{ from: "A4101", to: "A410209", period: "暦年計", survey: "人口動態調査" }]);
  const parsedIndex = indexDefinitions({ ...parsed, indicators: [] });
  assert.equal(decideYearFormat({ statsDataId: "0000010101", cdCat01: "A410102" }, parsedIndex, buildRules()).yearFormat, "calendar");
  assert.deepEqual(parsed.items.find((item) => item.code === "C610117"), { code: "C610117", name: null, period: "調査日前暦年計", survey: "経済センサス-活動調査" });
});

test("定義の表: 期間が割れる節では、表の符号で始まらない細分の符号に期間を当てない", () => {
  const { items } = parseItemDefinitions(section({
    anchors: ["K7201", "K7203", "K9999"],
    rows: [{ codes: ["K7201", "K7203"], names: ["a", "b"], periods: ["年度計", "３月31日"] }],
    survey: "事業年報",
  }));
  assert.deepEqual(items.map((item) => item.code), ["K7201", "K7203"]);
});

test("指標計算式: 指標コードと、式に現れる基礎項目を取り出す", () => {
  const html = `<table><tbody>
<tr><th id="measureCodeHeader">指標コード</th><th>項目名</th><th>単位</th><th>指標計算式</th></tr>
<tr id="K06101"><td id="measureCode">#K06101</td><td id="measureName">刑法犯認知件数（人口千人当たり）</td><td id="measureUnit">件</td>
<td id="measureDescription">刑法犯認知件数／総人口<br />
K4201/A1101</td></tr>
<tr id="L02101"><td id="measureCode">#L02101</td><td id="measureName">農家世帯の家計費</td><td id="measureUnit">千円</td><td id="measureDescription">農家支出（家計費）/12<br />L2201/12</td></tr>
</tbody></table>`;
  assert.deepEqual(parseIndicatorFormulas(html), [
    { code: "#K06101", name: "刑法犯認知件数（人口千人当たり）", formula: "刑法犯認知件数／総人口 K4201/A1101", baseItems: ["K4201", "A1101"] },
    { code: "#L02101", name: "農家世帯の家計費", formula: "農家支出（家計費）/12 L2201/12", baseItems: ["L2201"] },
  ]);
});

test("期間の語: 暦年・12月末・10月1日は calendar、年度・3月31日は fiscal、それ以外は決めない", () => {
  for (const period of ["暦年計", "暦年平均", "暦年", "12月末", "12月31日", "10月1日", "10月１日", "調査日前暦年計", "国勢調査調査年10月1日"]) {
    assert.equal(classifyPeriod(period), "calendar", period);
  }
  for (const period of ["年度計", "年度間", "年度", "年度末", "年度平均", "３月31日", "3月末", "調査日前年度計"]) {
    assert.equal(classifyPeriod(period), "fiscal", period);
  }
  for (const period of ["調査日", "5月1日", "4月1日", "7月1日", "年計", "年間", "1月1日", "10月末日", "10月31日", "11月30日", "2か月平均", "選挙期日", "─", "", null]) {
    assert.equal(classifyPeriod(period), null, String(period));
  }
});

test("調査名の欄は 1 調査ずつに分け、ハイフンの表記ゆれをそろえる", () => {
  assert.deepEqual(splitSurveys("経済構造実態調査、経済センサス－活動調査"), ["経済構造実態調査", "経済センサス-活動調査"]);
  assert.deepEqual(splitSurveys(null), []);
});

test("控え: 13 分野の定義と計算式が入っている", () => {
  assert.equal(definitions.sources.length, 13);
  assert.equal(definitions.indicators.length, 781);
  assert.ok(definitions.items.length > 4000, `項目 ${definitions.items.length} 件`);
  assert.deepEqual(index.items.get("A1101").map((item) => [item.period, item.survey]), [["10月1日", "国勢調査、人口推計"]]);
});

test("判定: 国勢調査・犯罪統計は calendar、財政の年度計は fiscal", () => {
  assert.equal(decide("0000010101", "A1101").yearFormat, "calendar");
  // 刑法犯認知件数 (暦年計) ÷ 総人口 (10月1日)。生成器の固定値のせいで「年度」と表示されていた型
  assert.equal(decide("0000010211", "#K06101").yearFormat, "calendar");
  const fiscal = decide("0000010104", "D3101");
  assert.equal(fiscal.yearFormat, "fiscal");
  assert.match(fiscal.reason, /年度間/);
});

test("判定: 式に年度の項目が 1 つでもあれば fiscal", () => {
  // 銀行預金残高 (3月31日) ÷ 総人口 (10月1日)
  const verdict = decide("0000010203", "#C04605");
  assert.deepEqual(verdict.basis.map((entry) => [entry.code, entry.yearFormat]), [["C360111", "fiscal"], ["A1101", "calendar"]]);
  assert.equal(verdict.yearFormat, "fiscal");
});

test("判定: 期間で決まらない項目は、調査の呼び方 (decisions.json の surveyNaming) で決める", () => {
  // 賃金構造基本統計調査 (6月中) は「令和N年賃金構造基本統計調査」と年で呼ぶ調査
  assert.equal(classifyPeriod(index.items.get("F6207")[0].period), null);
  assert.equal(decide("0000010106", "F6207").yearFormat, "calendar");
  assert.equal(decideYearFormat({ statsDataId: "0000010106", cdCat01: "F6207" }, index, buildRules()).yearFormat, null);
  // 呼び方を確かめていない調査 (台帳から学校基本調査を抜いた状態の 5月1日) は決めない。確かめて台帳に足せば決まる
  const withoutSchool = buildRules({ ...decisions, surveyNaming: decisions.surveyNaming.filter((row) => row.survey !== "学校基本調査") });
  assert.equal(decideYearFormat({ statsDataId: "0000010105", cdCat01: "E2101" }, index, withoutSchool).yearFormat, null);
  const withSchool = buildRules({ surveyNaming: [{ survey: "学校基本調査", yearFormat: "fiscal" }] });
  assert.equal(decideYearFormat({ statsDataId: "0000010105", cdCat01: "E2101" }, index, withSchool).yearFormat, "fiscal");
  // 欄に複数の調査が並ぶときは、全部の呼び方が分かっていなければ決めない
  assert.match(index.items.get("E2501")[0].survey, /学校基本調査、/);
  assert.equal(decideYearFormat({ statsDataId: "0000010105", cdCat01: "E2501" }, index, withSchool).yearFormat, null);
});

test("判定: 年度で呼ぶ調査 (学校基本調査・学校保健統計調査・建設工事施工統計調査) は fiscal、年で呼ぶ都道府県地価調査は calendar", () => {
  // 学校基本調査 (5月1日)。e-Stat の提供分類は「令和7年度」
  const school = decide("0000010105", "E2101");
  assert.equal(school.yearFormat, "fiscal");
  assert.match(school.reason, /調査の呼び方 \(学校基本調査/);
  // 欄に 2 つの調査が並ぶ項目は、どちらも年度で呼ぶと確かめたので決まる
  assert.match(index.items.get("E2501")[0].survey, /学校基本調査、児童生徒の問題行動/);
  assert.equal(decide("0000010105", "E2501").yearFormat, "fiscal");
  // 学校保健統計調査 (4月～6月中の任意の日) の身長・建設工事施工統計調査 (決算期までの1年間) の建設業者数
  assert.equal(decide("0000010209", "#I0210106").yearFormat, "fiscal");
  assert.equal(decide("0000010103", "C3306").yearFormat, "fiscal");
  // 都道府県地価調査 (7月1日) は「令和N年都道府県地価調査」。基礎項目の表でも指標の表でも同じ区切りになる
  assert.equal(decide("0000010103", "C5405").yearFormat, "calendar");
  assert.equal(decide("0000010103", "C5501").yearFormat, "calendar");
  assert.equal(decide("0000010212", "#L04304").yearFormat, "calendar");
});

test("判定: 期間が年度でも暦年でもなく、調査の呼び方も確かめられていない項目は決めない", () => {
  const verdict = decide("0000010108", "H7207");
  assert.equal(verdict.yearFormat, null);
  assert.match(verdict.reason, /7月1日/);
  assert.equal(decide("0000010101", "A9999999").yearFormat, null);
  assert.equal(decide("0000010201", "#Z99999").yearFormat, null);
});

test("判定: 市区町村の指標の表は、同じ定義だと確かめた符号 (decisions.json の cityIndicators) だけ都道府県の計算式で決める", () => {
  assert.equal(decide("0000010211", "#K06101").yearFormat, "calendar");
  // 確かめた記録が無ければ、計算式のページ (都道府県の指標) を当てはめない
  const unconfirmed = decideYearFormat({ statsDataId: "0000020311", cdCat01: "#K06101" }, index, buildRules({ ...decisions, cityIndicators: [] }));
  assert.equal(unconfirmed.yearFormat, null);
  assert.match(unconfirmed.reason, /市区町村の指標 #K06101[\s\S]*cityIndicators/);
  // 項目名が都道府県の指標と同じと確かめた符号は、都道府県の指標と同じ区切りになる
  const city = decide("0000020311", "#K06101");
  assert.equal(city.yearFormat, "calendar");
  assert.deepEqual(city.basis.map((entry) => entry.code), ["K4201", "A1101"]);
  assert.equal(decide("0000020304", "#D02215").yearFormat, "fiscal");
  // 項目名が違う定義を指す符号 (#B01101 は都道府県が全国面積、市区町村が都道府県面積に占める割合) は台帳に足さず、決めない
  assert.equal(decisions.cityIndicators.some((row) => row.code === "#B01101"), false);
  assert.equal(decide("0000020302", "#B01101").yearFormat, null);
  // 確かめた符号でも、基礎項目の区切りが決まらなければ決めない (課税対象所得 7月1日)
  assert.equal(decide("0000020304", "#D02206").yearFormat, null);
  assert.match(decide("0000020304", "#D02206").reason, /7月1日/);
  // 市区町村の基礎データの表は符号が都道府県と同じなので決まる
  assert.equal(decide("0000020201", "A1101").yearFormat, "calendar");
});

test("台帳: cityIndicators は市区町村の指標の符号だけで、重複が無く、指標計算式のページに同じ符号がある", () => {
  const codes = decisions.cityIndicators.map((row) => row.code);
  assert.equal(new Set(codes).size, codes.length);
  for (const code of codes) assert.ok(index.indicators.has(code), `${code} が指標計算式のページに無い`);
});

test("判定: 定義ページの期間が誤っている項目は、理由付きの上書き (itemOverrides) で決める", () => {
  // 住宅・土地統計調査の畳数別住宅数だけ、定義ページの期間が「年度計」になっている
  assert.equal(index.items.get("H2103")[0].period, "年度計");
  assert.equal(decideYearFormat({ statsDataId: "0000020208", cdCat01: "H2103" }, index, buildRules({ ...decisions, itemOverrides: [] })).yearFormat, "fiscal");
  const verdict = decide("0000020208", "H2103");
  assert.equal(verdict.yearFormat, "calendar");
  assert.match(verdict.reason, /上書き/);
});

test("判定: 複数の符号から計算する指標は、全部の符号で決める", () => {
  assert.equal(decide("0000010101", ["A811105", "A1303"]).yearFormat, "calendar");
  assert.equal(decide("0000010101", ["A1101", "H7207"]).yearFormat, null);
});

const METRICS = [
  { key: "total-population", statsDataId: "0000010101", cdCat01: "A1101", yearFormat: "calendar" },
  { key: "penal-code-offenses-recognized-per-1000", statsDataId: "0000010211", cdCat01: "#K06101", yearFormat: "calendar" },
  { key: "per-capita-prefectural-income-h27", statsDataId: "0000010203", cdCat01: "#C01321", yearFormat: "fiscal" },
];
const NO_UNDETERMINED = { ...decisions, undetermined: [] };

test("検査: 誤った yearFormat を 1 件注入すると MISMATCH で落ち、直すと通る", () => {
  assert.deepEqual(checkSsdsYearFormats(METRICS, index, NO_UNDETERMINED).errors, []);
  // 生成器が固定で書いていた誤り: 犯罪統計 (暦年計) の指標を「年度」にする
  const injected = METRICS.map((metric) => (metric.key === "penal-code-offenses-recognized-per-1000" ? { ...metric, yearFormat: "fiscal" } : metric));
  const { errors } = checkSsdsYearFormats(injected, index, NO_UNDETERMINED);
  assert.deepEqual(errors.map((error) => [error.code, error.key]), [["MISMATCH", "penal-code-offenses-recognized-per-1000"]]);
  assert.match(errors[0].message, /fiscal だが、定義からは calendar/);
  const fixed = injected.map((metric) => ({ ...metric, yearFormat: metric.key === "penal-code-offenses-recognized-per-1000" ? "calendar" : metric.yearFormat }));
  assert.deepEqual(checkSsdsYearFormats(fixed, index, NO_UNDETERMINED).errors, []);
});

test("検査: 市区町村の指標に誤った yearFormat を 1 件注入すると MISMATCH で落ち、直すと通る", () => {
  // 生成器の固定値が残っていた型: 同じ符号の都道府県の指標は calendar なのに、市区町村の指標だけ fiscal
  const city = { key: "crime-rate-per-1k", statsDataId: "0000020311", cdCat01: "#K06101" };
  const injected = [...METRICS, { ...city, yearFormat: "fiscal" }];
  const { errors } = checkSsdsYearFormats(injected, index, NO_UNDETERMINED);
  assert.deepEqual(errors.map((error) => [error.code, error.key]), [["MISMATCH", "crime-rate-per-1k"]]);
  assert.deepEqual(checkSsdsYearFormats([...METRICS, { ...city, yearFormat: "calendar" }], index, NO_UNDETERMINED).errors, []);
});

test("検査: 逆向きの誤り (年度の指標を暦年にする) と yearFormat の書き忘れも落とす", () => {
  const wrong = METRICS.map((metric) => (metric.key === "per-capita-prefectural-income-h27" ? { ...metric, yearFormat: "calendar" } : metric));
  assert.deepEqual(checkSsdsYearFormats(wrong, index, NO_UNDETERMINED).errors.map((error) => error.code), ["MISMATCH"]);
  const missing = METRICS.map((metric) => (metric.key === "total-population" ? { ...metric, yearFormat: undefined } : metric));
  assert.deepEqual(checkSsdsYearFormats(missing, index, NO_UNDETERMINED).errors.map((error) => error.code), ["MISMATCH"]);
});

test("検査: 判定できない指標は、理由付きの一覧に無ければ落とす (どちらかへ黙って倒さない)", () => {
  const metrics = [...METRICS, { key: "kei-car-count", statsDataId: "0000010108", cdCat01: "H7207", yearFormat: "fiscal" }];
  assert.deepEqual(checkSsdsYearFormats(metrics, index, NO_UNDETERMINED).errors.map((error) => [error.code, error.key]), [["UNDETERMINED_UNLISTED", "kei-car-count"]]);
  const listed = { ...decisions, undetermined: [{ key: "kei-car-count", reason: "期間「7月1日」は年度か暦年か決まらない" }] };
  const result = checkSsdsYearFormats(metrics, index, listed);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.undetermined.map((row) => row.key), ["kei-car-count"]);
});

test("検査: 一覧は縮小専用。決まるようになった指標・消えた指標・上限超えを落とす", () => {
  const stale = { ...decisions, undetermined: [{ key: "total-population", reason: "古い行" }] };
  assert.deepEqual(checkSsdsYearFormats(METRICS, index, stale).errors.map((error) => [error.code, error.key]), [["STALE_UNDETERMINED", "total-population"]]);
  const unknown = { ...decisions, undetermined: [{ key: "no-such-metric", reason: "消えた指標" }] };
  assert.deepEqual(checkSsdsYearFormats(METRICS, index, unknown).errors.map((error) => [error.code, error.key]), [["UNKNOWN_KEY", "no-such-metric"]]);
  const metrics = [...METRICS, { key: "kei-car-count", statsDataId: "0000010108", cdCat01: "H7207", yearFormat: "fiscal" }];
  const listed = { ...decisions, undetermined: [{ key: "kei-car-count", reason: "期間「7月1日」は年度か暦年か決まらない" }] };
  assert.deepEqual(checkSsdsYearFormats(metrics, index, listed, { ceiling: 0 }).errors.map((error) => error.code), ["OVER_CEILING"]);
});

test("台帳: 判定できない指標の一覧は上限以内で、key の重複が無い", () => {
  const keys = decisions.undetermined.map((row) => row.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(keys.length <= UNDETERMINED_CEILING, `一覧 ${keys.length} 件 / 上限 ${UNDETERMINED_CEILING} 件`);
  // 一覧を減らしたら上限も同じ数まで下げる (上限に余りがあると、その分だけ黙って増やせる)
  assert.equal(UNDETERMINED_CEILING, keys.length);
});

/** 生成器を --dry-run で動かし、書くはずの指標の定義を標準出力から読む (data/metrics には書かない) */
function runGenerator(specs) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ssds-gen-"));
  const batch = path.join(dir, "batch.json");
  fs.writeFileSync(batch, JSON.stringify(specs));
  try {
    return spawnSync(process.execPath, [path.join(ROOT, ".claude/scripts/estat/gen-ssds-configs.mjs"), batch, "--dry-run"], { cwd: ROOT, encoding: "utf8" });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
const spec = (fields) => ({ unit: "人", category: "population", decimals: 0, norm: "none", ...fields });
const yearFormatOf = (stdout, key) => stdout.match(new RegExp(`"key": "${key}"[\\s\\S]*?"yearFormat": "(\\w+)"`))?.[1] ?? null;

test("生成器: 年の区切りを固定の fiscal ではなく、出典の期間から書く", () => {
  const result = runGenerator([
    spec({ statsDataId: "0000010101", cdCat01: "A1101", key: "zz-year-format-probe-census", title: "年の区切りの検査用の指標その一" }),
    spec({ statsDataId: "0000010104", cdCat01: "D3101", key: "zz-year-format-probe-finance", title: "年の区切りの検査用の指標その二" }),
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(yearFormatOf(result.stdout, "zz-year-format-probe-census"), "calendar");
  assert.equal(yearFormatOf(result.stdout, "zz-year-format-probe-finance"), "fiscal");
  assert.equal(fs.existsSync(path.join(ROOT, "data/metrics/zz-year-format-probe-census.ts")), false);
});

test("生成器: 年の区切りが決まらない指標は書かずに止まる", () => {
  const result = runGenerator([
    spec({ statsDataId: "0000010101", cdCat01: "A1101", key: "zz-year-format-probe-census", title: "年の区切りの検査用の指標その一" }),
    spec({ statsDataId: "0000010108", cdCat01: "H7207", key: "zz-year-format-probe-unknown", title: "年の区切りの検査用の指標その三" }),
  ]);
  assert.equal(result.status, 1);
  assert.equal(yearFormatOf(result.stdout, "zz-year-format-probe-unknown"), null);
  assert.match(result.stdout + result.stderr, /zz-year-format-probe-unknown[\s\S]*7月1日/);
  // 決まる指標まで巻き添えで止めない
  assert.equal(yearFormatOf(result.stdout, "zz-year-format-probe-census"), "calendar");
});

/** --dry-run の標準出力から、key の指標の定義 (export const x: MetricConfig = {...};) を読んで normalizationOptions を返す */
const normalizationOf = (stdout, key) => {
  const file = stdout.split("--- ").find((chunk) => chunk.startsWith(`${key}.ts ---`));
  if (!file) return null;
  const body = file.slice(file.indexOf("= {") + 2, file.lastIndexOf("};") + 1).replace(/\.\.\.DEFAULT_METRIC_PRESENTATION,/, "");
  return JSON.parse(body).calculation.normalizationOptions;
};

test("生成器: 公式の項目名が「…当たり」の率には、spec が count でも換算の選択肢を付けない", () => {
  const result = runGenerator([
    // #I0910105 の公式の項目名は「一般診療所数（人口10万人当たり）」。算式で割り終えた率
    spec({ statsDataId: "0000010209", cdCat01: "#I0910105", key: "zz-rate-probe-clinic", title: "率の検査用の指標その一", norm: "count" }),
    // A1700 は外国人人口の実数。名前が分母を名乗らないので換算を保つ
    spec({ statsDataId: "0000010101", cdCat01: "A1700", key: "zz-rate-probe-foreign", title: "率の検査用の指標その二", norm: "count" }),
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(normalizationOf(result.stdout, "zz-rate-probe-clinic"), []);
  assert.deepEqual(normalizationOf(result.stdout, "zz-rate-probe-foreign")?.map((option) => option.type), ["per_population", "per_area"]);
});
