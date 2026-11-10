import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import editorial from '../../../../data/surveys/editorial/editorial.json';
import {
  getSurveyEditorialContent,
  requiredSurveyReaderQuestionCount,
} from '../survey-editorial';

const FILE = resolve(
  import.meta.dirname,
  '../../../../data/surveys/editorial/editorial.json'
);

describe('調査ハブの本文の台帳 (surveys.editorial)', () => {
  it('92 調査の記録を、調査 id 一意で読む', () => {
    expect(editorial.entries).toHaveLength(92);
    expect(new Set(editorial.entries.map((e) => e.surveyId)).size).toBe(92);
    for (const { surveyId } of editorial.entries)
      expect(getSurveyEditorialContent(surveyId), surveyId).not.toBeNull();
  });

  it('読み込み口は記録の形のまま返し、surveyId は持たせない', () => {
    const census = getSurveyEditorialContent('census');
    expect(census).not.toBeNull();
    expect(Object.keys(census ?? {}).sort()).toEqual(
      ['caveats', 'readerQuestions', 'summary', 'whatYouCanLearn'].sort()
    );
    expect(census?.readerQuestions[0]).toEqual({
      question: '40代前半（40〜44歳）男性の未婚率が高い都道府県は？',
      rankingKey: 'unmarried-ratio-male-40-44',
    });
    const kakei = getSurveyEditorialContent('kakei-chousa');
    expect(kakei?.areaLabel).toBe('主に県庁所在市などの都市別');
    expect(kakei?.relatedArticleSlugs).toHaveLength(6);
  });

  it('台帳にない調査 (別 ID にまとめた household-survey・継承名の constructor を含む) は null', () => {
    for (const key of ['unknown-survey', 'household-survey', 'constructor'])
      expect(getSurveyEditorialContent(key), key).toBeNull();
  });

  it('必須数は active ランキング数と 3 の小さい方', () => {
    expect([0, 1, 2, 3, 5].map(requiredSurveyReaderQuestionCount)).toEqual([
      0, 1, 2, 3, 3,
    ]);
  });

  it('台帳の本文は整形した JSON のまま (検索改善の自動置換が差分を最小に保つ)', () => {
    const text = readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
    expect(text).toBe(JSON.stringify(JSON.parse(text), null, 2) + '\n');
  });
});
