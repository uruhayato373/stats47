import { describe, expect, it } from "vitest";

import { METRICS_REGISTRY, type MetricRegistry } from "@stats47/data-configs";
import type { ThemeCatalog } from "@stats47/data-configs/theme-catalog";

import {
  extractBlogChartSourceReferences,
  resolveBlogChartSurveyTaxonomy,
  resolveSurveyTaxonomy,
  resolveThemeSurveyTaxonomy,
} from "../survey-taxonomy";

describe("resolveSurveyTaxonomy", () => {
  it("metricKey は既存 resolveSurveyLinkage と同じ master survey へ解決する", () => {
    const result = resolveSurveyTaxonomy(
      { metricKeys: ["grilled-eel-consumption-expenditure"] },
      METRICS_REGISTRY,
    );
    expect(result.surveys.map((survey) => survey.id)).toEqual(["kakei-chousa"]);
    expect(result.unresolvedMetricKeys).toEqual([]);
  });

  it("e-Stat param は既存の param 単一規則で原典へ解決する", () => {
    const result = resolveSurveyTaxonomy(
      { estatReferences: [{ statsDataId: "0000010103", cdCat01: "#A03506" }] },
      METRICS_REGISTRY,
    );
    expect(result.surveys.map((survey) => survey.id)).toContain("census");
  });

  it.each([
    ["0000010103", "C3702", "freight-regional-flow-survey"],
    ["0000010101", "A5103", "resident-registry-migration-report"],
    ["0000010110", "J5104", "pension-insurance-annual-report"],
    ["0000010111", "K3101", "traffic-accident-statistics"],
    ["0000010209", "#I15106", "national-medical-expenditure"],
    ["0000010210", "#J05208", "late-elderly-medical-annual-report"],
  ])("SSDS 原典 %s/%s を master survey %s へ正規化する", (statsDataId, cdCat01, surveyId) => {
    const result = resolveSurveyTaxonomy(
      { estatReferences: [{ statsDataId, cdCat01 }] },
      METRICS_REGISTRY,
    );
    expect(result.surveys.map((survey) => survey.id)).toContain(surveyId);
  });

  it.each([
    ["0003130738", "port-statistics"],
    ["0003441258", "retail-price-survey"],
  ])("registry 外の一次統計 %s も statsDataId override で %s へ解決する", (statsDataId, surveyId) => {
    const result = resolveSurveyTaxonomy(
      { estatReferences: [{ statsDataId }] },
      METRICS_REGISTRY,
    );
    expect(result.surveys.map((survey) => survey.id)).toContain(surveyId);
  });

  it("幽霊 metric と未登録 statsDataId を未解決として保持する", () => {
    const result = resolveSurveyTaxonomy(
      {
        metricKeys: ["ghost-metric"],
        estatReferences: [{ statsDataId: "9999999999" }],
      },
      METRICS_REGISTRY,
    );
    expect(result.surveys).toEqual([]);
    expect(result.unresolvedMetricKeys).toEqual(["ghost-metric"]);
    expect(result.unresolvedEstatReferences).toEqual([{ statsDataId: "9999999999" }]);
  });

  it("原典名は共通辞書を経由し、master に実在する調査だけへ解決する", () => {
    const result = resolveSurveyTaxonomy(
      { sourceNames: ["過去の気象データ", "存在しない資料源"] },
      METRICS_REGISTRY,
    );
    expect(result.surveys.map((survey) => survey.id)).toEqual(["weather-statistics"]);
    expect(result.resolvedSourceNames).toEqual(["過去の気象データ"]);
    expect(result.unresolvedSourceNames).toEqual(["存在しない資料源"]);
  });
});

describe("resolveThemeSurveyTaxonomy", () => {
  const catalog: ThemeCatalog = {
    key: "fixture",
    title: "fixture",
    description: "",
    category: "demographics",
    usage: "theme",
    metrics: [
      { rankingKey: "grilled-eel-consumption-expenditure", shortLabel: "うなぎ", role: "primary" },
    ],
    charts: [
      {
        componentKey: "estat-chart",
        componentType: "line-chart",
        title: "人口",
        componentProps: { estatParams: { statsDataId: "0000010103", cdCat01: "#A03506" } },
        sortOrder: 1,
      },
      {
        componentKey: "markdown",
        componentType: "markdown-section",
        title: "解説",
        componentProps: { markdown: "本文" },
        sortOrder: 2,
      },
    ],
  };

  it("raw e-Stat chart も survey へ接続し、解説は対象外にする", () => {
    const result = resolveThemeSurveyTaxonomy(catalog, METRICS_REGISTRY);
    expect(result.charts[0].status).toBe("resolved");
    expect(result.charts[0].surveys.map((survey) => survey.id)).toContain("census");
    expect(result.charts[1].status).toBe("not-applicable");
    expect(result.surveys.map((survey) => survey.id)).toEqual(
      expect.arrayContaining(["kakei-chousa", "census"]),
    );
  });

  it("参照のない data chart は missing-lineage で黙って成功しない", () => {
    const broken: ThemeCatalog = {
      ...catalog,
      charts: [{
        componentKey: "broken-kpi",
        componentType: "kpi-card",
        title: "壊れ",
        componentProps: {},
        sortOrder: 1,
      }],
    };
    expect(resolveThemeSurveyTaxonomy(broken, METRICS_REGISTRY).charts[0].status)
      .toBe("missing-lineage");
  });
});

describe("blog chart taxonomy", () => {
  it("複数 rankingKey・nested ref・R2 path を決定的に抽出する", () => {
    const refs = extractBlogChartSourceReferences({
      kind: "derived",
      rankingKey: "a + b",
      inputs: [{ rankingKey: "c", statsDataId: "0000010103", cdCat01: "#A03506" }],
      source: "r2:app/ranking/d/values.json",
    });
    expect(refs.rankingKeys).toEqual(["a", "b", "c", "d"]);
    expect(refs.estatReferences).toEqual([
      { statsDataId: "0000010103", cdCat01: "#A03506" },
    ]);
  });

  it("手動取得の統計 chart は surveyId 直書きなしで原典名から調査へ接続する", () => {
    const result = resolveBlogChartSurveyTaxonomy(
      {
        kind: "manual",
        sourceName: "過去の気象データ",
        source: "https://www.data.jma.go.jp/obd/stats/etrn/index.php",
      },
      METRICS_REGISTRY,
    );
    expect(result.status).toBe("resolved");
    expect(result.references.sourceNames).toEqual(["過去の気象データ"]);
    expect(result.surveys.map((survey) => survey.id)).toEqual(["weather-statistics"]);
  });

  it("辞書に無い原典名は unresolved、原典名なしの既存 manual は対象外を維持する", () => {
    expect(resolveBlogChartSurveyTaxonomy(
      { kind: "manual", sourceName: "不明な資料源", source: "https://example.com" },
      METRICS_REGISTRY,
    ).status).toBe("unresolved");
    expect(resolveBlogChartSurveyTaxonomy(
      { kind: "manual", source: "https://example.com" },
      METRICS_REGISTRY,
    ).status).toBe("not-applicable");
  });

  it("ranking source を survey へ接続する", () => {
    const result = resolveBlogChartSurveyTaxonomy(
      { kind: "ranking", rankingKey: "grilled-eel-consumption-expenditure" },
      METRICS_REGISTRY,
    );
    expect(result.status).toBe("resolved");
    expect(result.surveys.map((survey) => survey.id)).toEqual(["kakei-chousa"]);
  });

  it("authored は survey 対象外、欠落 manifest は missing-lineage", () => {
    expect(resolveBlogChartSurveyTaxonomy({ kind: "authored" }, METRICS_REGISTRY).status)
      .toBe("not-applicable");
    expect(resolveBlogChartSurveyTaxonomy(null, {} as MetricRegistry).status)
      .toBe("missing-lineage");
  });
});
