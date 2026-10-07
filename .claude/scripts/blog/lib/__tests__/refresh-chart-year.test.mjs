import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  findYearMentions,
  latestPartition,
  planChartRefresh,
  rebuildChartData,
  rebuildSource,
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
