import { describe, expect, it } from 'vitest';

import sample from '../../../fixtures/ranking-quiz-sample.json';
import { RankingQuizSpecSchema, resolveRankingQuiz, type RankingQuizSpec } from '../quiz';

const entries = sample.allEntries;
const spec: RankingQuizSpec = RankingQuizSpecSchema.parse(sample.quiz);
const withSpec = (patch: Partial<RankingQuizSpec>): RankingQuizSpec => ({ ...spec, ...patch });
const withHint = (patch: Partial<RankingQuizSpec['hint']>): RankingQuizSpec => ({
  ...spec,
  hint: { ...spec.hint, ...patch },
});

describe('resolveRankingQuiz', () => {
  it('正解の記号は spec ではなくデータの1位から決まる', () => {
    // 選択肢は 鹿児島・宮崎・熊本 の順。データの1位は宮崎なので B
    const quiz = resolveRankingQuiz(spec, entries);
    expect(quiz.choices.map((c) => c.name)).toEqual(['鹿児島県', '宮崎県', '熊本県']);
    expect(quiz.answerLetter).toBe('B');

    const reordered = resolveRankingQuiz(withSpec({ choiceCodes: ['45', '46', '43'] }), entries);
    expect(reordered.answerLetter).toBe('A');
  });

  it('1位を含まない選択肢は正解の無いクイズになるのでレンダーさせない', () => {
    expect(() => resolveRankingQuiz(withSpec({ choiceCodes: ['46', '43', '44'] }), entries)).toThrow(
      /choiceCodes に1位（宮崎県）が含まれていません/,
    );
  });

  it('ヒントで1位の順位を明かすと出題が成立しないので拒否する', () => {
    expect(() => resolveRankingQuiz(withHint({ revealedCodes: ['45'] }), entries)).toThrow(
      /答えが明かされます/,
    );
  });

  it('ヒントの「?」に1位が無いと候補から正解が外れるので拒否する', () => {
    expect(() => resolveRankingQuiz(withHint({ maskedCodes: ['46', '43'] }), entries)).toThrow(
      /hint.maskedCodes に1位/,
    );
  });

  it('ランキングに無い県コードは誤植として拒否する', () => {
    expect(() => resolveRankingQuiz(withSpec({ choiceCodes: ['45', '99'] }), entries)).toThrow(
      /99 がランキングにありません/,
    );
  });

  it('2桁と5桁の県コードを同じ県として扱う', () => {
    const quiz = resolveRankingQuiz(withSpec({ choiceCodes: ['46000', '45000'] }), entries);
    expect(quiz.answerLetter).toBe('B');
    expect(quiz.revealedRanks.get('32')).toBe(5);
  });

  it('倍率は正の値どうしのときだけ出す（負の値で「約-30.8倍」を作らない）', () => {
    const quiz = resolveRankingQuiz(spec, entries);
    expect(quiz.ratioToRunnerUp).toBe('1.4');
    expect(quiz.ratioToLast).toBe('4.4');

    const withNegativeLast = entries.map((e) => (e.rank === 47 ? { ...e, value: -4687 } : e));
    expect(resolveRankingQuiz(spec, withNegativeLast).ratioToLast).toBeNull();
  });

  it('1位が同率で複数あると正解を決められないので拒否する', () => {
    const tied = entries.map((e) => (e.rank === 2 ? { ...e, rank: 1 } : e));
    expect(() => resolveRankingQuiz(spec, tied)).toThrow(/1位が 2 件/);
  });
});
