import React from "react";

import { useIgSeriesFonts } from "@/features/ig-series";
import { resolveRankingData, type RankingEntry, type RankingMeta } from "@/shared";
import quizSample from "@/fixtures/ranking-quiz-sample.json";

import { QuizAnswerSlide } from "../QuizAnswerSlide";
import { QuizHintSlide } from "../QuizHintSlide";
import { QuizOutroSlide } from "../QuizOutroSlide";
import { QuizQuestionSlide } from "../QuizQuestionSlide";
import { QuizTableSlide } from "../QuizTableSlide";
import { resolveRankingQuiz, type QuizSlide, type RankingQuizSpec } from "../quiz";

interface RankingQuizCarouselPreviewProps {
  slide?: QuizSlide;
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
  quiz?: RankingQuizSpec;
}

/**
 * 予想クイズ型カルーセル（4:5・5枚）
 *
 * `slide` で 出題 → ヒント → 正解 → 全47都道府県 → 締め を切り替える。
 * props を省略すると焼酎消費支出額（2024年）のサンプルで描画する。
 */
export const RankingQuizCarouselPreview: React.FC<RankingQuizCarouselPreviewProps> = ({
  slide = "question",
  meta,
  allEntries,
  quiz,
}) => {
  useIgSeriesFonts();
  const useSample = !meta || !allEntries || !quiz;
  const data = resolveRankingData(
    useSample ? { meta: quizSample.meta, allEntries: quizSample.allEntries } : { meta, allEntries },
  );
  const spec = useSample ? quizSample.quiz : quiz;
  const resolved = resolveRankingQuiz(spec, data.entries);

  switch (slide) {
    case "question":
      return <QuizQuestionSlide spec={spec} quiz={resolved} />;
    case "hint":
      return <QuizHintSlide spec={spec} quiz={resolved} />;
    case "answer":
      return <QuizAnswerSlide spec={spec} quiz={resolved} meta={data.meta} precision={data.precision} />;
    case "table":
      return <QuizTableSlide meta={data.meta} entries={data.entries} precision={data.precision} />;
    case "outro":
      return <QuizOutroSlide spec={spec} />;
  }
};
