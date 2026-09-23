import React from "react";
import { AbsoluteFill, Sequence } from "remotion";

import type { RankingEntry, RankingMeta } from "@/shared";

import type { RankingQuizSpec } from "../quiz";
import { QuizReelAnswer } from "./QuizReelAnswer";
import { QuizReelBars } from "./QuizReelBars";
import { QuizReelChoices } from "./QuizReelChoices";
import { QuizReelHint } from "./QuizReelHint";
import { QuizReelHook } from "./QuizReelHook";
import { QuizReelOutro } from "./QuizReelOutro";
import { resolveQuizReelData } from "./resolve";
import { getQuizReelTimeline } from "./timeline";

export interface RankingQuizReelProps {
  meta: RankingMeta;
  allEntries: RankingEntry[];
  quiz: RankingQuizSpec;
}

/**
 * 予想クイズ型リール (1080x1920・9:16・音声なし)
 *
 * 「予想 → 答え合わせ」を1本の動画にする: フック → 選択肢 → ヒント(カウントダウン)
 * → 正解発表 → 上位5県 → 締め。カルーセル (`RankingQuizInstagram-Carousel`) と同じ
 * `meta` / `allEntries` / `quiz` props を受け取り、同じ `resolveRankingQuiz` を通す。
 * 正解・順位・値・倍率は allEntries から導出し、spec には書かせない。
 * choiceCodes/hint がデータと矛盾する spec はカルーセル同様レンダーを失敗させる。
 */
export const RankingQuizReel: React.FC<RankingQuizReelProps> = ({ meta, allEntries, quiz }) => {
  const { meta: resolvedMeta, precision, resolved } = resolveQuizReelData({ meta, allEntries, quiz });
  const timeline = getQuizReelTimeline();

  return (
    <AbsoluteFill>
      <Sequence from={timeline.hook.start} durationInFrames={timeline.hook.duration} name="Hook">
        <QuizReelHook spec={quiz} />
      </Sequence>
      <Sequence from={timeline.choices.start} durationInFrames={timeline.choices.duration} name="Choices">
        <QuizReelChoices spec={quiz} quiz={resolved} />
      </Sequence>
      <Sequence from={timeline.hint.start} durationInFrames={timeline.hint.duration} name="Hint">
        <QuizReelHint spec={quiz} quiz={resolved} />
      </Sequence>
      <Sequence from={timeline.answer.start} durationInFrames={timeline.answer.duration} name="Answer">
        <QuizReelAnswer spec={quiz} quiz={resolved} meta={resolvedMeta} precision={precision} />
      </Sequence>
      <Sequence from={timeline.bars.start} durationInFrames={timeline.bars.duration} name="Bars">
        <QuizReelBars quiz={resolved} meta={resolvedMeta} precision={precision} sourceLabel={quiz.sourceLabel} />
      </Sequence>
      <Sequence from={timeline.outro.start} durationInFrames={timeline.outro.duration} name="Outro">
        <QuizReelOutro spec={quiz} />
      </Sequence>
    </AbsoluteFill>
  );
};
