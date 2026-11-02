import { describe, expect, it } from 'vitest';

import {
  prioritizeSurveyRankings,
  selectSurveyRepresentativeRankings,
} from './select-survey-representative-rankings';

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

  it('読者の問いが指すランキングを、カテゴリ分散より先に与えた順で取る', () => {
    // 家計調査の実例: 件数の少ない分類の情報通信係数が、需要上位の納豆・米より先に代表になっていた
    const items = [
      { rankingKey: 'aircon', title: 'エアコン消費量', categoryKey: 'economy' },
      { rankingKey: 'ict', title: '情報通信係数', categoryKey: 'ict' },
      { rankingKey: 'natto', title: '納豆消費支出額', categoryKey: 'economy' },
      { rankingKey: 'rice', title: '米消費量', categoryKey: 'economy' },
    ];

    expect(
      selectSurveyRepresentativeRankings(items, 3, ['rice', 'natto', 'missing']).map(
        (item) => item.rankingKey
      )
    ).toEqual(['rice', 'natto', 'ict']);
  });
});

describe('prioritizeSurveyRankings', () => {
  it('指定したランキングを指定順で先頭に並べ、残りは元の順を保つ', () => {
    const items = [{ rankingKey: 'a' }, { rankingKey: 'b' }, { rankingKey: 'c' }, { rankingKey: 'd' }];

    expect(prioritizeSurveyRankings(items, ['c', 'x', 'b']).map((item) => item.rankingKey)).toEqual([
      'c',
      'b',
      'a',
      'd',
    ]);
  });
});
