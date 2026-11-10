// 調査の切り口台帳の検査と集計。実行: npm run surveys:lenses:test
import assert from "node:assert/strict";
import test from "node:test";

import { checkLensLedgers, lensStatus } from "../survey-lenses.mjs";

const ledger = {
  surveyId: "kakei-chousa",
  relatedSurveyIds: ["household-survey"],
  statCode: "00200561",
  lenses: [
    { id: "kakei-city-comparison", name: "都市の間で比べる", dataTables: ["0004023605"], channels: { ranking: "r", blog: "b" } },
    { id: "kakei-income-class", name: "年収階級で比べる", dataTables: ["0004023607"], channels: { blog: "b", kindle: "k" }, readiness: { state: "blocked", blockers: ["接地器が旧表"] } },
  ],
};
const base = {
  ledgers: [ledger],
  tablesBySurvey: new Map([["kakei-chousa", new Set(["0004023605", "0004023607"])]]),
  analyses: [
    { id: "book-2015-a01", surveyIds: ["kakei-chousa"], lensIds: ["kakei-city-comparison"], resolution: "combined-analysis" },
    { id: "book-2015-a02", surveyIds: [], lensIds: ["kakei-income-class"], resolution: "context-only" },
  ],
  units: [{ id: "natto-city-spending", lensId: "kakei-city-comparison" }],
};
const codes = (findings) => findings.filter((f) => f.level === "error").map((f) => f.code);

test("整った台帳はエラーなし", () => {
  assert.deepEqual(codes(checkLensLedgers(base)), []);
});

test("切り口台帳のある調査の問いが切り口に結ばれていなければ止める (資料ごとの札にしない)", () => {
  const analyses = [...base.analyses, { id: "other-2020-a29", surveyIds: ["kakei-chousa"], resolution: "reuse-existing-metric" }];
  assert.ok(codes(checkLensLedgers({ ...base, analyses })).includes("UNLINKED_QUESTION"));
  // 関連する調査 (household-survey) の問いも同じ台帳の切り口に結ぶ
  const related = [...base.analyses, { id: "other-2020-a30", surveyIds: ["household-survey"], resolution: "combined-analysis" }];
  assert.ok(codes(checkLensLedgers({ ...base, analyses: related })).includes("UNLINKED_QUESTION"));
  // 文脈だけの資料は結び付けを要求しない
  const context = [...base.analyses, { id: "other-2020-a31", surveyIds: ["kakei-chousa"], resolution: "context-only" }];
  assert.deepEqual(codes(checkLensLedgers({ ...base, analyses: context })), []);
});

test("存在しない切り口・表への参照と、理由の無い blocked を止める (調査 id の実在は check-datasets の refs が止める)", () => {
  const broken = {
    ...base,
    ledgers: [{ ...ledger, lenses: [...ledger.lenses, { id: "kakei-seasonality", name: "季節", dataTables: ["9999999999"], channels: { blog: "b" }, readiness: { state: "blocked" } }] }],
    units: [...base.units, { id: "x", lensId: "kakei-no-such-lens" }],
  };
  const c = codes(checkLensLedgers(broken));
  for (const code of ["UNKNOWN_TABLE", "BLOCKED_WITHOUT_REASON", "UNKNOWN_LENS"]) assert.ok(c.includes(code), code);
});

test("lensStatus は台帳に書いたチャネルごとに、展開記録の行を切り口で数える", () => {
  const rows = [
    { analysis: base.analyses[0], channel: "blog", state: "done" },
    { analysis: base.analyses[0], channel: "ranking", state: "derived" },
    { analysis: base.analyses[0], channel: "note", state: "pending" }, // 台帳に note の役割が無いので数えない
  ];
  const [city, income] = lensStatus({ ...base, rows });
  assert.equal(city.questions, 1);
  assert.equal(city.units, 1);
  assert.deepEqual(city.channels.map((c) => c.channel), ["ranking", "blog"]);
  assert.equal(city.channels.find((c) => c.channel === "blog").counts.done, 1);
  assert.equal(income.readiness, "blocked");
  assert.deepEqual(income.blockers, ["接地器が旧表"]);
});
