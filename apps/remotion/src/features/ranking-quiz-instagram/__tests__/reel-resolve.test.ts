import { describe, expect, it } from "vitest";

import sample from "../../../fixtures/ranking-quiz-sample.json";
import { RankingQuizSpecSchema, type RankingQuizSpec } from "../quiz";
import { resolveQuizReelData } from "../reel/resolve";

const { meta, allEntries } = sample;
const spec: RankingQuizSpec = RankingQuizSpecSchema.parse(sample.quiz);

describe("resolveQuizReelData（リールもカルーセルと同じ resolveRankingQuiz を通す）", () => {
  it("正解・上位県はデータの1位から決まる", () => {
    const data = resolveQuizReelData({ meta, allEntries, quiz: spec });
    // 選択肢は 鹿児島・宮崎・熊本 の順。データの1位は宮崎なので B
    expect(data.resolved.answerLetter).toBe("B");
    expect(data.resolved.top[0].areaName).toBe("宮崎県");
    expect(data.resolved.top[0].value).toBe(14008);
  });

  it("choiceCodes に1位を含まない spec はリールでも throw する（カルーセルで失敗する spec は同じ理由で失敗する）", () => {
    const badSpec: RankingQuizSpec = { ...spec, choiceCodes: ["46", "43", "44"] };
    expect(() => resolveQuizReelData({ meta, allEntries, quiz: badSpec })).toThrow(
      /choiceCodes に1位（宮崎県）が含まれていません/,
    );
  });

  it("hint.maskedCodes に1位を含まない spec もリールで throw する", () => {
    const badSpec: RankingQuizSpec = { ...spec, hint: { ...spec.hint, maskedCodes: ["46", "43"] } };
    expect(() => resolveQuizReelData({ meta, allEntries, quiz: badSpec })).toThrow(/hint.maskedCodes に1位/);
  });
});
