/**
 * AREA_EDITORIALS — 県別編集コンテンツ (特産品・県シンボル) の登録簿。
 *
 * 規約: `.claude/rules/area-databook-standards.md`
 * オーナー: area-curator (単一オーナー。品名・産地は事実、解説は出典付き独自文)
 *
 * 横展開: 県 1 件ずつ `editorial/<code>.ts` を追加 → ここに登録 → validator green → commit。
 * 未登録県は UI がセクションごと非表示にフォールバックする (欠損で壊さない)。
 */
import type { AreaEditorial } from "../types";

/** 県別編集コンテンツの登録簿 (areaCode → editorial)。 */
export const AREA_EDITORIALS: Record<string, AreaEditorial> = {};

/** 登録済み editorial 配列。 */
export function listAreaEditorials(): AreaEditorial[] {
  return Object.values(AREA_EDITORIALS);
}
