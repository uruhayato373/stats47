import { describe, expect, it } from "vitest";

import type { RankingItem } from "../types/ranking-item";
import {
  isSsdsItem,
  resolveItemOriginalSurveys,
  surveyBucketsForItem,
} from "./survey-bucketing";

function item(partial: Partial<RankingItem>): RankingItem {
  return {
    rankingKey: "test",
    areaType: "prefecture",
    rankingName: "test",
    title: "test",
    unit: "件",
    isActive: true,
    isFeatured: false,
    dataSourceId: "estat",
    ...partial,
  } as RankingItem;
}

describe("survey-bucketing", () => {
  it("非SSDS item は baked surveyId をそのまま使う", () => {
    const it1 = item({
      surveyId: "kakei-chousa",
      sourceConfig: { source: { name: "家計調査" } } as never,
    });
    expect(isSsdsItem(it1)).toBe(false);
    expect(surveyBucketsForItem(it1)).toEqual(["kakei-chousa"]);
    expect(resolveItemOriginalSurveys(it1)).toEqual([]);
  });

  it("SSDS item は cdCat01 から原典へ再分配される (誤った baked surveyId を是正)", () => {
    // C2101 事業所数 が census(国勢調査) バケットに誤って入っている → 事業所企業統計へ
    const it1 = item({
      surveyId: "census",
      sourceConfig: {
        statsDataId: "0000010103",
        cdCat01: "C2101",
        source: { name: "社会・人口統計体系" },
      } as never,
    });
    expect(isSsdsItem(it1)).toBe(true);
    expect(surveyBucketsForItem(it1)).toEqual(["establishment-enterprise-census"]);
    expect(surveyBucketsForItem(it1)).not.toContain("census");
  });

  it("SSDS item が複数原典を持つ場合は複数バケットに入る", () => {
    // A1101 総人口 → census + population-estimates
    const it1 = item({
      surveyId: "ssds",
      sourceConfig: {
        cdCat01: "A1101",
        collection: { name: "社会・人口統計体系" },
      } as never,
    });
    expect(surveyBucketsForItem(it1).sort()).toEqual([
      "census",
      "population-estimates",
    ]);
  });

  it("SSDS だが cdCat01 が無い → baked surveyId にフォールバック (無regression)", () => {
    const it1 = item({
      surveyId: "ssds",
      sourceConfig: { source: { name: "社会・人口統計体系" } } as never,
    });
    expect(surveyBucketsForItem(it1)).toEqual(["ssds"]);
  });

  it("SSDS だが原典解決不能 → baked surveyId にフォールバック", () => {
    const it1 = item({
      surveyId: "ssds",
      sourceConfig: {
        cdCat01: "ZZZ9999",
        source: { name: "社会・人口統計体系" },
      } as never,
    });
    expect(surveyBucketsForItem(it1)).toEqual(["ssds"]);
  });

  it("原典が合成 id (ssds-src:, master 不在) のみ → baked にフォールバック (孤児バケット防止)", () => {
    // K5112 災害被害額 → ssds-src:消防白書 (auto-slug、surveys.json に無い)
    const it1 = item({
      surveyId: "ssds",
      sourceConfig: {
        cdCat01: "K5112",
        source: { name: "社会・人口統計体系" },
      } as never,
    });
    expect(surveyBucketsForItem(it1)).toEqual(["ssds"]);
  });
});
