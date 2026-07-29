import { describe, expect, it } from "vitest";

import type { RankingItem } from "../types/ranking-item";
import {
  isSsdsItem,
  resolveItemOriginalSurveys,
  surveyBucketsForItem,
} from "./survey-bucketing";

// 0000010103 = SSDS 都道府県テーブル / 0003445758 = 非SSDS (賃金構造基本統計調査)
const SSDS_TABLE = "0000010103";
const NON_SSDS = "0003445758";

function item(partial: Partial<RankingItem>): RankingItem {
  return {
    rankingKey: "test",
    areaType: "prefecture",
    rankingName: "test",
    title: "test",
    unit: "件",
    isActive: true,
    dataSourceId: "estat",
    ...partial,
  } as RankingItem;
}

describe("survey-bucketing (param 統一)", () => {
  it("baked surveyIds (builder 焼き込み) があれば最優先", () => {
    const it1 = item({
      surveyId: "census", // 旧 baked (誤り) が残っていても
      surveyIds: ["kakei-chousa"], // 焼き込みが正
      sourceConfig: { statsDataId: NON_SSDS } as never,
    });
    expect(surveyBucketsForItem(it1)).toEqual(["kakei-chousa"]);
  });

  it("baked surveyIds が空配列 = 未分類確定。baked surveyId にフォールバックしない", () => {
    const it1 = item({
      surveyId: "ssds",
      surveyIds: [],
      sourceConfig: { statsDataId: SSDS_TABLE, cdCat01: "ZZZ9999" } as never,
    });
    expect(surveyBucketsForItem(it1)).toEqual([]);
  });

  it("kakei-chousa kind は surveyIds 未焼き込みでも kakei-chousa に入る (stale 安全網)", () => {
    const it1 = item({
      surveyId: null,
      dataSourceId: "kakei-chousa",
    });
    expect(surveyBucketsForItem(it1)).toEqual(["kakei-chousa"]);
  });

  it("非SSDS estat は surveyIds 未焼き込みなら statsDataId 辞書で解決 (stale 安全網)", () => {
    const it1 = item({
      surveyId: null, // 2026-06-07 再生成で null 化した stale item を想定
      sourceConfig: { statsDataId: NON_SSDS } as never,
    });
    expect(isSsdsItem(it1)).toBe(false);
    expect(surveyBucketsForItem(it1)).toEqual(["wage-structure-survey"]);
    expect(resolveItemOriginalSurveys(it1)).toEqual([]);
  });

  it("SSDS item は statsDataId+cdCat01 から原典へ再分配 (誤った baked surveyId を是正)", () => {
    // C2101 事業所数 が census(国勢調査) バケットに誤入 → 事業所企業統計へ
    const it1 = item({
      surveyId: "census",
      sourceConfig: { statsDataId: SSDS_TABLE, cdCat01: "C2101" } as never,
    });
    expect(isSsdsItem(it1)).toBe(true);
    expect(surveyBucketsForItem(it1)).toEqual(["establishment-enterprise-census"]);
    expect(surveyBucketsForItem(it1)).not.toContain("census");
  });

  it("SSDS item が複数原典を持つ場合は複数バケットに入る", () => {
    // A1101 総人口 → census + population-estimates
    const it1 = item({
      surveyId: "ssds",
      sourceConfig: { statsDataId: SSDS_TABLE, cdCat01: "A1101" } as never,
    });
    expect(surveyBucketsForItem(it1).sort()).toEqual(["census", "population-estimates"]);
  });

  it("SSDS だが cdCat01 が無い → baked surveyId にフォールバック (無regression)", () => {
    const it1 = item({
      surveyId: "ssds",
      sourceConfig: { statsDataId: SSDS_TABLE } as never,
    });
    expect(surveyBucketsForItem(it1)).toEqual(["ssds"]);
  });

  it("SSDS だが原典解決不能 → baked surveyId にフォールバック", () => {
    const it1 = item({
      surveyId: "ssds",
      sourceConfig: { statsDataId: SSDS_TABLE, cdCat01: "ZZZ9999" } as never,
    });
    expect(surveyBucketsForItem(it1)).toEqual(["ssds"]);
  });

  it("原典が合成 id (ssds-src:, master 不在) のみ → baked にフォールバック (孤児バケット防止)", () => {
    // K5112 災害被害額 → ssds-src:消防白書 (auto-slug、surveys.json に無い)
    const it1 = item({
      surveyId: "ssds",
      sourceConfig: { statsDataId: SSDS_TABLE, cdCat01: "K5112" } as never,
    });
    expect(surveyBucketsForItem(it1)).toEqual(["ssds"]);
  });
});
