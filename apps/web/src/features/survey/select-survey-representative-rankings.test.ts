import { describe, expect, it } from 'vitest';

import { selectSurveyRepresentativeRankings } from './select-survey-representative-rankings';

describe('selectSurveyRepresentativeRankings', () => {
  it('サイト共通代表が無い調査でも、カテゴリを分散して上限まで返す', () => {
    const items = [
      { rankingKey: 'a', title: '住宅地域割合', categoryKey: 'land' },
      { rankingKey: 'b', title: '商業地域割合', categoryKey: 'commerce' },
      { rankingKey: 'c', title: '都市計画区域面積', categoryKey: 'infra' },
      { rankingKey: 'd', title: '工業地域割合', categoryKey: 'land' },
    ];

    expect(
      selectSurveyRepresentativeRankings(items, 4).map(
        (item) => item.rankingKey
      )
    ).toEqual(['a', 'b', 'c', 'd']);
  });

  it('同じ rankingKey と括弧違いの同義タイトルを先に重ねない', () => {
    const items = [
      { rankingKey: 'a', title: '施設数（総数）', categoryKey: 'one' },
      { rankingKey: 'a', title: '施設数（重複）', categoryKey: 'one' },
      { rankingKey: 'b', title: '施設数（人口当たり）', categoryKey: 'one' },
      { rankingKey: 'c', title: '利用者数', categoryKey: 'one' },
    ];

    expect(
      selectSurveyRepresentativeRankings(items, 2).map(
        (item) => item.rankingKey
      )
    ).toEqual(['a', 'c']);
  });

  it('0件と0上限を安全に扱う', () => {
    expect(selectSurveyRepresentativeRankings([], 4)).toEqual([]);
    expect(
      selectSurveyRepresentativeRankings(
        [{ rankingKey: 'a', title: 'A', categoryKey: 'x' }],
        0
      )
    ).toEqual([]);
  });
});
