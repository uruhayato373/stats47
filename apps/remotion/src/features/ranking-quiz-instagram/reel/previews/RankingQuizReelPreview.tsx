import React from "react";

import { resolveRankingData, type RankingEntry, type RankingMeta } from "@/shared";
import quizSample from "@/fixtures/ranking-quiz-sample.json";

import type { RankingQuizSpec } from "../../quiz";
import { RankingQuizReel } from "../RankingQuizReel";

interface RankingQuizReelPreviewProps {
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
  quiz?: RankingQuizSpec;
}

/**
 * 予想クイズ型リール（9:16・5枚のカルーセルと同じ props）
 *
 * props を省略すると焼酎消費支出額（2024年）のサンプルで描画する
 * （`RankingQuizCarouselPreview` と同じフォールバック方式）。
 */
export const RankingQuizReelPreview: React.FC<RankingQuizReelPreviewProps> = ({ meta, allEntries, quiz }) => {
  const useSample = !meta || !allEntries || !quiz;
  const data = resolveRankingData(
    useSample ? { meta: quizSample.meta, allEntries: quizSample.allEntries } : { meta, allEntries },
  );
  const spec = useSample ? (quizSample.quiz as RankingQuizSpec) : quiz;

  return <RankingQuizReel meta={data.meta} allEntries={data.entries} quiz={spec} />;
};
