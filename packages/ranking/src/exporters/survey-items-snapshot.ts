import type { CategoryRankingItem, RankingItem } from "../types/ranking-item";
import { compareByRepresentativeThenRecency } from "../lib/ranking-order";
import { resolveItemOriginalSurveys } from "./survey-bucketing";

/** Canonical survey payload, shared by publication and local release staging. */
export function buildSurveyItemsSnapshot(surveyId: string, items: readonly RankingItem[], generatedAt: string) {
    const matched = items.slice().sort(compareByRepresentativeThenRecency);
    const surveyItems: (CategoryRankingItem & { areaType: string; originalSurveys: string[] })[] = matched.map((r) => ({
      rankingKey: r.rankingKey,
      areaType: r.areaType,
      title: r.title,
      readerLabel: r.readerLabel ?? r.title,
      subtitle: r.subtitle ?? null,
      unit: r.unit,
      latestYear: r.latestYear ?? null,
      availableYears: r.availableYears ?? null,
      description: r.description ?? null,
      demographicAttr: r.demographicAttr ?? null,
      normalizationBasis: r.normalizationBasis ?? null,
      groupKey: r.groupKey ?? null,
      hook: r.hook ?? null,
      top1: r.latestTop ?? null,
      // survey ページの広告 vertical 導出に使う (調査主題と広告を連動させる)。
      categoryKey: r.categoryKey ?? null,
      // 出典 (原典調査)。UI が「出典: ◯◯調査」表示に使う。SSDS は複数原典あり。
      // builder 焼き込み済み surveyIds を優先し、stale item は従来解決 (SSDS のみ) にフォールバック。
      originalSurveys:
        r.surveyIds ?? resolveItemOriginalSurveys(r).map((s) => s.id),
    }));

    return { generatedAt, surveyId, count: surveyItems.length, items: surveyItems };
}
