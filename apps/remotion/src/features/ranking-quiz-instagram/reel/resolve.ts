import type { RankingEntry, RankingMeta } from "../../../shared/types/ranking";
import { resolveRankingData } from "../../../shared/utils/mock-data";

import { resolveRankingQuiz, type RankingQuizSpec, type ResolvedRankingQuiz } from "../quiz";

export interface QuizReelData {
  meta: RankingMeta;
  entries: RankingEntry[];
  precision: number;
  resolved: ResolvedRankingQuiz;
}

/**
 * リール用の props 解決。カルーセルと同じ `resolveRankingQuiz` を通すため、
 * 選択肢やヒントがデータと矛盾する spec はここで throw する
 * （カルーセルで失敗する spec はリールでも必ず失敗させる。正解・順位・値・倍率を
 * 新しい手書きフィールドから読ませない）。
 */
export function resolveQuizReelData(opts: {
  meta: RankingMeta;
  allEntries: RankingEntry[];
  quiz: RankingQuizSpec;
}): QuizReelData {
  const { meta, entries, precision } = resolveRankingData({ meta: opts.meta, allEntries: opts.allEntries });
  const resolved = resolveRankingQuiz(opts.quiz, entries);
  return { meta, entries, precision, resolved };
}
