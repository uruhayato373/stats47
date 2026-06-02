import { describe, expect, it } from "vitest";

import type { MetricConfig } from "../types";
import { resolveMetricProvenance } from "./resolve-metric-provenance";

function metric(source: MetricConfig["source"]): MetricConfig {
  return {
    key: "test",
    title: "test",
    unit: "人",
    category: "population",
    source,
    entities: ["prefecture"],
    years: "all",
  };
}

const ids = (m: MetricConfig) => resolveMetricProvenance(m).map((s) => s.id).sort();

describe("resolveMetricProvenance", () => {
  it("家計調査 (kakei-chousa) は household-survey へ", () => {
    expect(ids(metric({ kind: "kakei-chousa" }))).toEqual(["household-survey"]);
  });

  it("一次統計 estat は displayName で survey へ", () => {
    const m = metric({
      kind: "estat",
      statsDataId: "0003000000",
      displayName: "社会生活基本調査",
    });
    expect(ids(m)).toEqual(["social-life-basic-survey"]);
  });

  it("SSDS 基礎項目は cdCat01 → 原典 (複数可) を解決する", () => {
    // A1101 総人口 → 国勢調査報告 + 人口推計
    const m = metric({
      kind: "estat",
      statsDataId: "0000020201",
      cdCat01: "A1101",
      displayName: "社会・人口統計体系",
    });
    expect(ids(m)).toEqual(["census", "population-estimates"]);
  });

  it("SSDS 指標は計算式を基礎項目へ分解し原典を union する", () => {
    // #A01202 可住地面積人口密度 = A1101/B1103 → census + population-estimates + area-survey
    const m = metric({
      kind: "estat",
      statsDataId: "0000020301",
      cdCat01: "#A01202",
      displayName: "社会・人口統計体系",
    });
    expect(ids(m)).toEqual(["area-survey", "census", "population-estimates"]);
  });

  it("CDCAT01_SOURCE_OVERRIDE: Excel に資料源が無い派生項目も解決する", () => {
    // #A03506 65歳以上人口割合 → census (override)
    const m = metric({
      kind: "estat",
      statsDataId: "0000020301",
      cdCat01: "#A03506",
      displayName: "社会・人口統計体系",
    });
    expect(ids(m)).toEqual(["census"]);
  });

  it("SSDS の市区町村版 displayName 変種も cdCat01 で解決する", () => {
    const m = metric({
      kind: "estat",
      statsDataId: "0000020301",
      cdCat01: "A1101",
      displayName: "社会・人口統計体系（市区町村データ・廃置分合処理済）",
    });
    expect(ids(m)).toEqual(["census", "population-estimates"]);
  });

  it("displayName が指標ラベル (未登録) の tail は空配列 (偽 survey を作らない)", () => {
    const m = metric({
      kind: "estat",
      statsDataId: "0003000000",
      displayName: "コンビニエンスストア販売額（都道府県別・年計）",
    });
    expect(resolveMetricProvenance(m)).toEqual([]);
  });
});
