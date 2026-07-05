/**
 * survey バケット解決ロジック (純粋関数)。exporter から呼ぶ。
 *
 * 2026-07 再設計 (正典: .claude/rules/survey-linkage-standards.md):
 * 紐付けの正は builder (`build-ranking-item-from-metric.ts` の `resolveSurveyLinkage`) が
 * config.source から決定的導出して item.json に焼き込む **`surveyIds`**。本モジュールは
 * それを尊重してバケットするだけ。焼き込み前の stale item に対しては sourceConfig からの
 * 再解決 (SSDS=cdCat01 / kakei=kind / 非SSDS=statsDataId 辞書) を安全網として持つ。
 *
 * 旧背景: baked `surveyId` (旧 D1 マスタ由来) は SSDS item の 62.9% がミスバケットだった。
 * また 2026-06-07 の item.json 再生成で surveyId が全 null 化し、非SSDS を baked 依存で
 * バケットすると全滅する時限バグがあった (本再設計で解消)。
 *
 * 1 つの SSDS item が複数原典を持つ場合は複数バケットに入る (正しい挙動)。
 */

import {
  isSsdsStatsDataId,
  resolveAttribution,
  resolveProvenanceByParams,
  type ProvenanceSurvey,
  type SourceAttribution,
} from "@stats47/data-configs";

import type { RankingItem } from "../types/ranking-item";

/** item の sourceConfig (statsDataId/cdCat01) から出典表記 (2 階層) を解決する。 */
export function resolveItemAttribution(item: RankingItem): SourceAttribution {
  return resolveAttribution(
    item.sourceConfig?.statsDataId,
    item.sourceConfig?.cdCat01,
  );
}

/** item が SSDS (二次統計) 由来か = statsDataId が SSDS テーブル (param 統一ルールと整合)。 */
export function isSsdsItem(item: RankingItem): boolean {
  return isSsdsStatsDataId(item.sourceConfig?.statsDataId);
}

/**
 * SSDS item の原典 survey を sourceConfig (statsDataId/cdCat01) から解決する。
 * 非SSDS / 解決不能なら空配列。param 単一ルール (resolveProvenanceByParams) を共有。
 */
export function resolveItemOriginalSurveys(item: RankingItem): ProvenanceSurvey[] {
  if (!isSsdsItem(item)) return [];
  return resolveProvenanceByParams(
    item.sourceConfig?.statsDataId,
    item.sourceConfig?.cdCat01,
  );
}

/**
 * survey マスタ (surveys.json) に存在しない合成 id。これらでバケットを作ると /survey が
 * 孤児 (all.json に無く 404) になるため再分配先から除外する。
 *   - `ssds-src:<原典名>` … SSDS 原典の auto-slug fallback (辞書未登録の低頻度テール)
 *   - `src:<displayName>` … mlit/external の auto fallback
 */
function isSyntheticSurveyId(id: string): boolean {
  return id.startsWith("ssds-src:") || id.startsWith("src:");
}

/**
 * item を入れるべき survey バケット id の集合。
 *   1. baked `surveyIds` (builder が config から決定的導出して焼き込んだ正) があれば最優先
 *   2. 無ければ (stale item.json への安全網) sourceConfig から再解決:
 *      - SSDS: cdCat01 → 原典 survey 群 (合成 id 除外。残らなければ baked surveyId)
 *      - kakei-chousa kind: 固定で kakei-chousa
 *      - 非SSDS estat: statsDataId → survey 辞書
 *      - それでも無ければ baked surveyId (旧マスタ由来) にフォールバック
 * 正典: .claude/rules/survey-linkage-standards.md
 */
export function surveyBucketsForItem(item: RankingItem): string[] {
  // 1. builder 焼き込み済み (2026-07 以降の item.json)。空配列は「未分類が確定」なので尊重する
  if (item.surveyIds !== undefined) {
    return item.surveyIds.filter((id) => !isSyntheticSurveyId(id));
  }
  // 2. 安全網: 焼き込み前の stale item から従来解決
  const baked = item.surveyId ? [item.surveyId] : [];
  if (item.dataSourceId === "kakei-chousa") return ["kakei-chousa"];
  const resolved = resolveProvenanceByParams(
    item.sourceConfig?.statsDataId,
    item.sourceConfig?.cdCat01,
  )
    .map((s) => s.id)
    .filter((id) => !isSyntheticSurveyId(id));
  return resolved.length > 0 ? resolved : baked;
}
