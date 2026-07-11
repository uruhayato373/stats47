import { describe, expect, it } from 'vitest';

import { getSurveyEditorialContent } from './survey-editorial';

describe('getSurveyEditorialContent', () => {
  it('国勢調査の編集情報を返す', () => {
    const content = getSurveyEditorialContent('census');

    expect(content?.readerQuestions).toContainEqual({
      question: '30代前半男性の未婚率が高い都道府県は？',
      rankingKey: 'unmarried-ratio-male-30-34',
    });
    expect(content?.caveats.length).toBeGreaterThan(0);
  });

  it('未定義の調査では現行表示へフォールバックできる', () => {
    expect(getSurveyEditorialContent('unknown-survey')).toBeNull();
  });
});
