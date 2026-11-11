import { describe, expect, it } from "vitest";

import { KAKEI_ANALYSES } from "@stats47/data-configs";

import { resolveKakeiAxisSource, selectKakeiAxisRows, SPECS, stripKakeiLabelNote } from "../generate-kakei-axis-charts";

const CLASS_OBJ = [
  { "@id": "cat03", CLASS: [{ "@code": "01", "@name": "持家" }, { "@code": "03", "@name": "民営借家" }] },
  { "@id": "time", CLASS: [{ "@code": "2025000101", "@name": "2025年1月" }, { "@code": "2025000202", "@name": "2025年2月" }] },
];
const response = (VALUE: Record<string, string>[]) => ({
  GET_STATS_DATA: { STATISTICAL_DATA: { CLASS_INF: { CLASS_OBJ }, DATA_INF: { VALUE } } },
});
const row = (axis: Record<string, string>, unit: string, value: string) => ({
  "@area": "00000", "@cat01": "011100030", "@cat02": "03", "@unit": unit, $: value, ...axis,
});
const monthly = {
  id: "beer", themeSlug: "t", title: "t", description: "d", axis: "月",
  axisCodes: ["2025000101", "2025000202"], axisDim: "time" as const,
  expectedUnit: "l", period: "month-total" as const,
};
const FILTERS = { cdCat01: "011100030", cdCat02: "03" };

describe("stripKakeiLabelNote", () => {
  it("分類名の末尾の年の注記を除く", () => {
    expect(stripKakeiLabelNote("民営借家（2017年以前は設備共用及び借間を除く）")).toBe("民営借家");
  });
  it("注記の無い分類名と月は変えない", () => {
    for (const label of ["持家", "公営借家", "（持家）住宅ローン返済世帯", "200～250万円", "年収五分位1", "6人以上", "2025年1月"]) {
      expect(stripKakeiLabelNote(label)).toBe(label);
    }
  });
});

describe("selectKakeiAxisRows", () => {
  it("月次の表は月を軸に 1 年分の行を選び、1l の単位を l にそろえる", () => {
    const rows = selectKakeiAxisRows(response([
      row({ "@time": "2025000101" }, "1l", "1.5"),
      row({ "@time": "2025000202" }, "1l", "1.2"),
      row({ "@time": "2024000101" }, "1l", "9"),
    ]), monthly, FILTERS);
    expect(rows).toEqual([
      { code: "2025000101", label: "2025年1月", value: 1.5 },
      { code: "2025000202", label: "2025年2月", value: 1.2 },
    ]);
  });
  it("月が欠けていれば途中の月を年の図にせず止める", () => {
    expect(() => selectKakeiAxisRows(response([row({ "@time": "2025000101" }, "1l", "1.5")]), monthly, FILTERS))
      .toThrow("beer: 2025000202 has 0 matching 2025 rows");
  });
  it("単位が想定と違えば止める", () => {
    expect(() => selectKakeiAxisRows(response([
      row({ "@time": "2025000101" }, "円", "1.5"),
      row({ "@time": "2025000202" }, "円", "1.2"),
    ]), monthly, FILTERS)).toThrow("unit 円 != l");
  });
  it("分類軸の表は 2025 年の行だけを読む", () => {
    const rows = selectKakeiAxisRows(response([
      row({ "@time": "2025000000", "@cat03": "01" }, "円", "300"),
      row({ "@time": "2024000000", "@cat03": "01" }, "円", "999"),
    ]), { ...monthly, axisDim: undefined, axisCodes: ["01"], expectedUnit: "円", period: "monthly-average" }, FILTERS);
    expect(rows).toEqual([{ code: "01", label: "持家", value: 300 }]);
  });
});

describe("resolveKakeiAxisSource", () => {
  it("どの図も分析単位の台帳から表と絞り込みを引く (図の側に表 ID と分析単位の絞り込みを持たない)", () => {
    for (const spec of SPECS) {
      const { analysis, filters } = resolveKakeiAxisSource(spec);
      expect(analysis.id).toBe(spec.analysisId ?? spec.id);
      for (const [key, value] of Object.entries(analysis.source.filters ?? {})) expect(filters[key]).toBe(value);
    }
  });
  it("負債の図は貯蓄と負債の分析単位を ID で指し、表の分類だけを足す", () => {
    const debt = SPECS.find(spec => spec.id === "debt-income-quintile");
    expect(debt && resolveKakeiAxisSource(debt).filters).toEqual({ cdCat01: "028", cdCat02: "03", cdCat04: "01" });
  });
  it("[mutation] 図だけの分類で分析単位の絞り込みを上書きすると止める", () => {
    const analysis = KAKEI_ANALYSES.find(item => item.id === "food-income-quintile");
    expect(analysis?.source.filters?.cdCat02).toBe("03");
    expect(() => resolveKakeiAxisSource({ ...monthly, id: "food-income-quintile", extraFilters: { cdCat02: "21" } })).toThrow("overrides");
  });
  it("[mutation] 台帳に無い分析単位を指すと止める", () => {
    expect(() => resolveKakeiAxisSource({ ...monthly, id: "no-such-analysis" })).toThrow("analysis catalog mismatch");
  });
});
