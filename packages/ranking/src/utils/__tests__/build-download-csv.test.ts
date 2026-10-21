import { describe, expect, it } from "vitest";

import { buildAllBasesCsv, buildSingleSeriesCsv, type CsvCitation } from "../build-download-csv";

const values = [
  { areaCode: "13000", areaName: "東京都", yearCode: "2025100000", yearName: "2025年", value: 100, unit: "人", rank: 1 },
  { areaCode: "01000", areaName: "北海道", yearCode: "2025100000", yearName: "2025年", value: 50, unit: "人", rank: 2 },
] as Parameters<typeof buildSingleSeriesCsv>[0];

const ssds: CsvCitation = {
  title: "総人口",
  attribution: {
    compilation: { name: "社会・人口統計体系", url: "https://www.stat.go.jp/data/ssds/index.htm" },
    originalSurveys: [{ id: "population-estimates", name: "人口推計" }, { id: "census", name: "国勢調査報告" }],
  },
  dataSourceId: "estat",
  pageUrl: "https://stats47.jp/ranking/total-population",
  createdOn: "2026-10-21",
};

describe("download CSV citation", () => {
  it("列見出しを先頭に保ち、表の後に出典・加工・掲載ページ・作成日を置く", () => {
    const lines = buildSingleSeriesCsv(values, ssds).replace(/^﻿/, "").split("\n");
    expect(lines[0]).toBe("都道府県コード,都道府県名,2025年");
    expect(lines.slice(3)).toEqual([
      "",
      "指標,総人口",
      "出典,社会・人口統計体系（https://www.stat.go.jp/data/ssds/index.htm）（原典: 人口推計・国勢調査報告）",
      "統計の取得元,政府統計の総合窓口(e-Stat)（https://www.e-stat.go.jp/）",
      "加工,上記の統計を stats47（https://stats47.jp/）が加工して作成。人口・面積当たりの値は stats47 が算出",
      "掲載ページ,https://stats47.jp/ranking/total-population",
      "作成日,2026-10-21",
    ]);
  });

  it("全基準まとめの CSV にも同じ表記が付き、出典が分からなければ掲載ページを指す", () => {
    const csv = buildAllBasesCsv([{ basisKey: "original", basisLabel: "総数", values }], {
      pageUrl: "https://stats47.jp/ranking/x",
      createdOn: "2026-10-21",
    });
    expect(csv).toContain("\n\n出典,掲載ページの出典欄を参照\n加工,");
    expect(csv).not.toContain("統計の取得元");
  });

  it("出典を渡さない呼び出しは従来どおり表だけを返す", () => {
    expect(buildSingleSeriesCsv(values)).not.toContain("出典");
  });
});
