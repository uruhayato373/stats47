import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  findStaleSourceFields,
  findYearMentions,
  latestPartition,
  pearsonR,
  planChartRefresh,
  planScatterRefresh,
  rebuildChartData,
  rebuildScatterData,
  rebuildScatterSource,
  rebuildSource,
  REBUILT_SCATTER_SOURCE_FIELDS,
} from "../refresh-chart-year.mjs";

// 図を最新年で取り直す判定。自動で作り直すのは fetch-ranking-data-r2.mjs の形の図だけで、
// 年を固定した図 (本文がその年そのものを主題にした図) と、形の違う図には触らない (推測で作り直すと値を捏造しうる) ことを固定する。
const rankingSource = { kind: "ranking", rankingKey: "dairy-cattle-count", year: "2018" };
const rankingData = {
  title: "乳用牛飼養頭数",
  subtitle: "2018年",
  unit: "頭",
  year: "2018",
  rankingKey: "dairy-cattle-count",
  palette: "blue",
  data: [
    { rank: 1, areaName: "北海道", pref: "北海道", value: 800, areaCode: "01000" },
    { rank: 2, areaName: "栃木県", pref: "栃木県", value: 50, areaCode: "09000" },
  ],
};
const partition2025 = {
  yearCode: "2025",
  values: [
    { areaCode: "09000", areaName: "栃木県", value: 55 },
    { areaCode: "01000", areaName: "北海道", value: 830 },
    { areaCode: "13000", areaName: "東京都", value: Number.NaN },
  ],
};

describe("latestPartition", () => {
  it("年の最も新しい partition を返し、値の無い partition は飛ばす", () => {
    const values = { partitions: [{ yearCode: "2024", values: [{}] }, { yearCode: "2025", values: [] }, { yearCode: "2020", values: [{}] }] };
    assert.equal(latestPartition(values).yearCode, "2024");
    assert.equal(latestPartition({ partitions: [] }), null);
  });
});

describe("planChartRefresh", () => {
  it("新しい年があり形が合えば取り直す", () => {
    assert.deepEqual(planChartRefresh({ source: rankingSource, data: rankingData, latestYear: "2025" }), {
      status: "refresh",
      fromYear: "2018",
      toYear: "2025",
    });
  });

  it("最新年なら取り直さない (年度コードも先頭 4 桁で比べる)", () => {
    assert.equal(planChartRefresh({ source: rankingSource, data: rankingData, latestYear: "2018100000" }).status, "current");
  });

  it("yearPinnedReason のある図は年が古くても触らない", () => {
    const plan = planChartRefresh({
      source: { ...rankingSource, yearPinnedReason: "2011 年の震災直後を主題にした図" },
      data: rankingData,
      latestYear: "2025",
    });
    assert.deepEqual(plan, { status: "pinned", reason: "2011 年の震災直後を主題にした図" });
  });

  it("ranking 以外の kind・年の無い図・形の違う data は手作業に回す", () => {
    assert.equal(planChartRefresh({ source: { kind: "scatter", xKey: "a", yKey: "b", year: "2018" }, data: {}, latestYear: "2025" }).status, "unsupported");
    assert.equal(planChartRefresh({ source: { ...rankingSource, year: "最新" }, data: rankingData, latestYear: "2025" }).status, "unsupported");
    const extraField = { ...rankingData, data: [{ ...rankingData.data[0], color: "#000" }] };
    assert.equal(planChartRefresh({ source: rankingSource, data: extraField, latestYear: "2025" }).status, "unsupported");
    assert.equal(planChartRefresh({ source: rankingSource, data: rankingData.data, latestYear: "2025" }).status, "unsupported");
    assert.equal(planChartRefresh({ source: null, data: rankingData, latestYear: "2025" }).status, "unsupported");
  });

  it("R2 に値が無い指標は取り直せない", () => {
    assert.equal(planChartRefresh({ source: rankingSource, data: rankingData, latestYear: null }).status, "no-data");
  });
});

describe("rebuildChartData", () => {
  it("最新年の値で行を作り直し、value 降順で rank を振り直す。表示用の項目は残す", () => {
    const { data, notes } = rebuildChartData(rankingData, partition2025, { fromYear: "2018", toYear: "2025" });
    assert.deepEqual(data.data, [
      { rank: 1, areaName: "北海道", pref: "北海道", value: 830, areaCode: "01000" },
      { rank: 2, areaName: "栃木県", pref: "栃木県", value: 55, areaCode: "09000" },
    ]);
    assert.equal(data.year, "2025");
    assert.equal(data.subtitle, "2025年");
    assert.equal(data.palette, "blue");
    assert.deepEqual(notes, []);
  });

  it("タイルマップの行 (rank なし) は同じ項目だけで作り直す", () => {
    const map = { ...rankingData, data: [{ pref: "北海道", areaName: "北海道", value: 800 }] };
    const { data } = rebuildChartData(map, partition2025, { fromYear: "2018", toYear: "2025" });
    assert.deepEqual(data.data[0], { pref: "北海道", areaName: "北海道", value: 830 });
  });

  it("見出しの古い年は置き換え、別の年が残れば知らせる", () => {
    const titled = { ...rankingData, title: "乳用牛（2018年）", subtitle: "2016〜2018年" };
    const { data, notes } = rebuildChartData(titled, partition2025, { fromYear: "2018", toYear: "2025" });
    assert.equal(data.title, "乳用牛（2025年）");
    assert.deepEqual(notes, ["subtitle に別の年 (2016年) が残る"]);
  });
});

describe("rebuildSource / findYearMentions", () => {
  it("source.json の年を進め、取り直した元の年を残す", () => {
    assert.deepEqual(rebuildSource({ ...rankingSource, year: 2018 }, { fromYear: "2018", toYear: "2025" }, "T"), {
      ...rankingSource,
      year: 2025,
      fetchedAt: "T",
      refreshedFromYear: "2018",
    });
  });

  it("本文で古い年を書いた行を返す", () => {
    const md = "---\ntitle: 2018年の乳牛\n---\n\n北海道が1位です。\n2018年は800頭でした。";
    assert.deepEqual(findYearMentions(md, ["2018", "2018"]).map((m) => m.line), [2, 6]);
    assert.deepEqual(findYearMentions(md, []), []);
  });
});

describe("findStaleSourceFields", () => {
  it("取り直し後の source.json に元の年が残る欄を列挙し、作り直した年の欄は数えない", () => {
    const source = {
      kind: "ranking",
      rankingKey: "fishery-species-catch-bonito",
      year: "2023",
      refreshedFromYear: "2015",
      fetchedAt: "2026-10-21T00:00:00.000Z",
      coverage: "2015年は 39 県",
      supplementary: { tunaCorrelation: { year: 2015, r: 0.8 }, note: "20150 件は対象外" },
    };
    assert.deepEqual(findStaleSourceFields(source, "2015"), ["coverage", "supplementary.tunaCorrelation.year"]);
  });

  it("元の年が残っていなければ空", () => {
    assert.deepEqual(findStaleSourceFields({ kind: "ranking", year: "2023", refreshedFromYear: "2015" }, "2015"), []);
  });
});

// 散布図の取り直し (BLOG-REFRESH-DERIVED-SCATTER-01)。軸の指標と今の年は「今の点が R2 の値と一致するか」で決め、
// 一致しない図には触らない。取り直し先は両軸の最新の共通年 (無ければ軸ごとの最新年)。
const part = (year, rows) => ({
  yearCode: year,
  values: rows.map(([areaCode, areaName, value]) => ({ areaCode, areaName, value })),
});
const vacancy = {
  partitions: [
    part("2018", [["01000", "北海道", 13.51], ["02000", "青森県", 15.02], ["13000", "東京都", 10.63], ["00000", "全国", 13.6]]),
    part("2023", [["01000", "北海道", 15.64], ["02000", "青森県", 16.72], ["13000", "東京都", 10.92]]),
  ],
};
const aging = {
  partitions: [
    part("2018", [["01000", "北海道", 31.9], ["02000", "青森県", 32.8], ["13000", "東京都", 23.1]]),
    part("2023", [["01000", "北海道", 33.0], ["02000", "青森県", 35.0], ["13000", "東京都", 22.8]]),
    part("2025", [["01000", "北海道", 33.6], ["02000", "青森県", 36.4]]),
  ],
};
const scatterValues = { "vacant-housing-rate": vacancy, "ratio-65-plus": aging };
// 2018 年の値を小数第 1 位に丸めて描いた図
const scatter2018 = {
  chartType: "scatter",
  title: "空き家率と65歳以上人口割合 (2018年)",
  xLabel: "空き家率(2018年)",
  xUnit: "％",
  yLabel: "65歳以上人口割合(2018年)",
  points: [
    { x: 13.5, y: 31.9, label: "北海道" },
    { x: 15.0, y: 32.8, label: "青森県" },
    { x: 10.6, y: 23.1, label: "東京都" },
  ],
};
const scatterSource = { kind: "scatter", xKey: "vacant-housing-rate", yKey: "ratio-65-plus", year: "2018", pearsonR: 0.9 };
const mixedYears = () => ({
  values: { "vacant-housing-rate": { partitions: [vacancy.partitions[0]] }, "ratio-65-plus": { partitions: aging.partitions.slice(1) } },
  data: {
    ...scatter2018,
    title: "空き家率(2018年)と65歳以上人口割合(2023年)",
    yLabel: "65歳以上人口割合(2023年)",
    points: [
      { x: 13.5, y: 33.0, label: "北海道" },
      { x: 15.0, y: 35.0, label: "青森県" },
      { x: 10.6, y: 22.8, label: "東京都" },
    ],
  },
});

describe("planScatterRefresh", () => {
  it("両軸の最新の共通年で取り直す (片方だけ新しい年があっても共通年を選ぶ)", () => {
    const plan = planScatterRefresh({ source: scatterSource, data: scatter2018, valuesByKey: scatterValues });
    assert.equal(plan.status, "refresh");
    assert.equal(plan.fromYear, "2018");
    assert.equal(plan.toYear, "2023");
    assert.deepEqual(plan.axes.y, { key: "ratio-65-plus", fromYear: "2018", toYear: "2023" });
  });

  it("derived-scatter の rankingKeys の順が逆でも、点の値の一致で x と y を決める", () => {
    const source = { kind: "derived-scatter", rankingKeys: ["ratio-65-plus", "vacant-housing-rate"], year: "2018" };
    const plan = planScatterRefresh({ source, data: scatter2018, valuesByKey: scatterValues });
    assert.equal(plan.status, "refresh");
    assert.equal(plan.axes.x.key, "vacant-housing-rate");
    assert.equal(plan.axes.y.key, "ratio-65-plus");
  });

  it("calculated は入力が 2 指標ならその 2 つ、3 つ以上なら years に書いた 2 指標を軸にする", () => {
    const two = {
      kind: "calculated",
      formula: "f",
      inputs: [
        { rankingKey: "vacant-housing-rate", year: "2018" },
        { rankingKey: "ratio-65-plus", year: "2018" },
      ],
    };
    assert.equal(planScatterRefresh({ source: two, data: scatter2018, valuesByKey: scatterValues }).status, "refresh");
    const many = {
      ...two,
      inputs: [...two.inputs, { rankingKey: "total-population", year: "2018" }],
      years: { "vacant-housing-rate": "2018", "ratio-65-plus": "2018" },
    };
    assert.equal(planScatterRefresh({ source: many, data: scatter2018, valuesByKey: scatterValues }).status, "refresh");
    const noAxes = { ...many, years: undefined };
    assert.equal(planScatterRefresh({ source: noAxes, data: scatter2018, valuesByKey: scatterValues }).status, "unsupported");
  });

  it("同じ指標の 2 つの年を比べる calculated は自動で取り直さない", () => {
    const source = {
      kind: "calculated",
      formula: "f",
      inputs: [
        { rankingKey: "ratio-65-plus", year: "2018" },
        { rankingKey: "ratio-65-plus", year: "2023" },
      ],
    };
    const plan = planScatterRefresh({ source, data: scatter2018, valuesByKey: scatterValues });
    assert.equal(plan.status, "unsupported");
    assert.match(plan.reason, /同じ指標/);
  });

  it("点の値が R2 のどの年とも一致しない図 (計算で作った軸) は手作業に回す", () => {
    const computed = { ...scatter2018, points: scatter2018.points.map((p) => ({ ...p, y: p.y * 2 })) };
    const plan = planScatterRefresh({ source: scatterSource, data: computed, valuesByKey: scatterValues });
    assert.equal(plan.status, "unsupported");
    assert.match(plan.reason, /一致しない/);
  });

  it("最新の共通年なら取り直さず、年を固定した図・R2 に無い指標・形の違う data も触らない", () => {
    const current = {
      ...scatter2018,
      points: [
        { x: 15.6, y: 33.0, label: "北海道" },
        { x: 16.7, y: 35.0, label: "青森県" },
        { x: 10.9, y: 22.8, label: "東京都" },
      ],
    };
    assert.equal(planScatterRefresh({ source: scatterSource, data: current, valuesByKey: scatterValues }).status, "current");
    const pinned = { ...scatterSource, yearPinnedReason: "2018 年を論じる" };
    assert.equal(planScatterRefresh({ source: pinned, data: scatter2018, valuesByKey: scatterValues }).status, "pinned");
    assert.equal(planScatterRefresh({ source: scatterSource, data: scatter2018, valuesByKey: { "ratio-65-plus": aging } }).status, "no-data");
    const extra = { ...scatter2018, points: scatter2018.points.map((p) => ({ ...p, color: "#000" })) };
    assert.equal(planScatterRefresh({ source: scatterSource, data: extra, valuesByKey: scatterValues }).status, "unsupported");
    const joined = { kind: "scatter", xKey: "a + b", yKey: "c", year: "2018" };
    assert.equal(planScatterRefresh({ source: joined, data: scatter2018, valuesByKey: scatterValues }).status, "unsupported");
  });

  it("共通年へそろえると今より古い年に戻る軸があれば、そろえずに軸ごとの最新年を使う (図を古くしない)", () => {
    // 空き家率は 2023 年まで、65 歳以上割合は 2025 年まである。今の図は x 2023 / y 2025 (vacant-housing-vs-aging と同じ形)
    const values = { "vacant-housing-rate": vacancy, "ratio-65-plus": aging };
    const data = {
      ...scatter2018,
      points: [
        { x: 15.6, y: 33.6, label: "北海道" },
        { x: 16.7, y: 36.4, label: "青森県" },
      ],
    };
    const plan = planScatterRefresh({ source: scatterSource, data, valuesByKey: values });
    assert.equal(plan.status, "current");
    assert.equal(plan.toYear, "x:2023/y:2025");
    assert.match(plan.reason, /古い年に戻る/);
  });

  it("共通年が無ければ軸ごとの最新年を使い、両方の年を toYear に出す", () => {
    const { values, data } = mixedYears();
    const plan = planScatterRefresh({ source: scatterSource, data, valuesByKey: values });
    assert.equal(plan.status, "refresh");
    assert.equal(plan.fromYear, "x:2018/y:2023");
    assert.equal(plan.toYear, "x:2018/y:2025");
  });
});

describe("rebuildScatterData / rebuildScatterSource", () => {
  it("取り直した年の値を元の図の桁に丸めて点を作り、見出しの年・相関係数を作り直す", () => {
    const plan = planScatterRefresh({ source: scatterSource, data: scatter2018, valuesByKey: scatterValues });
    const rebuilt = rebuildScatterData(scatter2018, plan, scatterValues);
    assert.deepEqual(rebuilt.data.points, [
      { x: 15.6, y: 33.0, label: "北海道" },
      { x: 16.7, y: 35.0, label: "青森県" },
      { x: 10.9, y: 22.8, label: "東京都" },
    ]);
    assert.equal(rebuilt.data.title, "空き家率と65歳以上人口割合 (2023年)");
    assert.equal(rebuilt.data.xLabel, "空き家率(2023年)");
    assert.equal(rebuilt.data.yLabel, "65歳以上人口割合(2023年)");
    assert.deepEqual(rebuilt.excluded, []);
    assert.deepEqual(rebuilt.notes, []);
    assert.ok(Math.abs(rebuilt.pearsonR - pearsonR(rebuilt.data.points)) < 1e-12);
    assert.notEqual(rebuilt.pearsonR, null);

    const source = rebuildScatterSource(scatterSource, plan, { ...rebuilt, pointCount: 3 }, "T");
    assert.equal(source.year, "2023");
    assert.equal(source.refreshedFromYear, "2018");
    assert.equal(source.pearsonR, rebuilt.pearsonR);
    assert.equal(source.pointCount, 3);
    assert.equal(source.excludedAreas, undefined);
  });

  it("「東京」のような都府県を落とした名前の図も照合し、同じ書き方で作り直す", () => {
    const short = { ...scatter2018, points: scatter2018.points.map((p) => ({ ...p, label: p.label === "北海道" ? p.label : p.label.slice(0, -1) })) };
    const plan = planScatterRefresh({ source: scatterSource, data: short, valuesByKey: scatterValues });
    assert.equal(plan.status, "refresh");
    const rebuilt = rebuildScatterData(short, plan, scatterValues);
    assert.deepEqual(rebuilt.data.points.map((p) => p.label), ["北海道", "青森", "東京"]);
  });

  it("軸の表示ラベルの calculated は指標として扱わない", () => {
    const source = { kind: "scatter", xKey: "vacant-housing-rate", yKey: "calculated", year: "2018" };
    assert.equal(planScatterRefresh({ source, data: scatter2018, valuesByKey: scatterValues }).status, "unsupported");
  });

  it("軸ごとに年が違うときは見出しの年を軸ごとに置き換え、値の無い県は除外県として source.json に残す", () => {
    const { values, data } = mixedYears();
    const calculated = {
      kind: "calculated",
      formula: "2023年の値で r を計算",
      inputs: [
        { rankingKey: "vacant-housing-rate", year: "2018" },
        { rankingKey: "ratio-65-plus", year: "2023" },
      ],
    };
    const plan = planScatterRefresh({ source: calculated, data, valuesByKey: values });
    const rebuilt = rebuildScatterData(data, plan, values);
    assert.equal(rebuilt.data.title, "空き家率(2018年)と65歳以上人口割合(2025年)");
    assert.deepEqual(rebuilt.excluded, ["東京都"]);
    assert.equal(rebuilt.data.points.length, 2);
    const source = rebuildScatterSource(calculated, plan, { ...rebuilt, pointCount: 2 }, "T");
    assert.deepEqual(source.inputs.map((i) => i.year), ["2018", "2025"]);
    assert.deepEqual(source.excludedAreas, ["東京都"]);
    assert.equal(source.expectedPointCount, 2);
    assert.equal(source.year, "x:2018/y:2025");
    // 計算式の文章は作り直さないので、古い年の残りとして手作業に出る
    assert.deepEqual(findStaleSourceFields(source, "2023", REBUILT_SCATTER_SOURCE_FIELDS), ["formula"]);
  });
});
