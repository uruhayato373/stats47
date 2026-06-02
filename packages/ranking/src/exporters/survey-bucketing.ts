/**
 * survey バケット解決ロジック (純粋関数)。exporter から呼ぶ。
 *
 * 背景: ranking item の baked `surveyId` (旧 D1 由来) は、SSDS (社会・人口統計体系=二次統計) 由来の
 * item で頻繁に誤分類されている (実測: SSDS item の 62.9% がミスバケット)。一方、非SSDS の一次統計
 * (国勢調査・家計調査 等) は baked surveyId が正しい (resolver 一致率 95.5%)。
 *
 * よって **再分配は SSDS 由来 item に限定**する:
 *   - SSDS item  → sourceConfig.cdCat01 から resolveSourceProvenance で原典 survey を解決して再分配
 *                  (解決できなければ baked surveyId にフォールバック = 無regression)
 *   - 非SSDS item → baked surveyId をそのまま使う (変更なし)
 *
 * 1 つの SSDS item が複数原典を持つ場合は複数バケットに入る (正しい挙動)。
 */

import {
  isSsdsStatsDataId,
  resolveProvenanceByParams,
  type ProvenanceSurvey,
} from "@stats47/data-configs";

import type { RankingItem } from "../types/ranking-item";

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
 *   - SSDS: 解決した原典 survey id 群 (マスタに無い合成 id は除外。残らなければ baked にフォールバック)
 *   - 非SSDS: baked surveyId のみ
 */
export function surveyBucketsForItem(item: RankingItem): string[] {
  const baked = item.surveyId ? [item.surveyId] : [];
  if (!isSsdsItem(item)) return baked;
  const resolved = resolveItemOriginalSurveys(item)
    .map((s) => s.id)
    .filter((id) => !isSyntheticSurveyId(id));
  return resolved.length > 0 ? resolved : baked;
}
