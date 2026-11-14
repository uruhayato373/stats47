// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { groupSurveysByMinistry, ministryOf } from './group-surveys-by-ministry';

/**
 * /survey は約 100 の調査が分類・並び順の規則なしで並んでいた (HUB-LIST-FINDABILITY-01)。
 * 作成した府省庁で分け、各分類の中はランキングの多い順に並べる。
 */
describe('ministryOf', () => {
  it('作成機関の名前から最初の府省庁を取り出す', () => {
    expect(ministryOf('総務省統計局')).toBe('総務省');
    expect(ministryOf('内閣府男女共同参画局')).toBe('内閣府');
    expect(ministryOf('総務省・経済産業省')).toBe('総務省');
    expect(ministryOf('文部科学省・国立教育政策研究所')).toBe('文部科学省');
    expect(ministryOf('観光庁')).toBe('観光庁');
  });

  it('府省庁の名前を持たない機関と空の値は null にする', () => {
    expect(ministryOf('国立社会保障・人口問題研究所')).toBeNull();
    expect(ministryOf('日本銀行')).toBeNull();
    expect(ministryOf(null)).toBeNull();
    expect(ministryOf('')).toBeNull();
  });
});

describe('groupSurveysByMinistry', () => {
  const survey = (id: string, organization: string | null, name = id) => ({ id, name, organization });

  it('府省庁ごとに分け、分類は調査の多い順、分類の中はランキングの多い順、同数は調査名の順に並べる', () => {
    const counts: Record<string, number> = { a: 5, b: 50, c: 5, d: 9, e: 1, f: 2, g: 3, h: 4 };
    const groups = groupSurveysByMinistry(
      [
        survey('a', '厚生労働省', 'い調査'),
        survey('b', '厚生労働省'),
        survey('c', '厚生労働省', 'あ調査'),
        survey('d', '総務省統計局'),
        survey('e', '総務省'),
        survey('f', '総務省'),
        survey('g', '気象庁'),
        survey('h', '日本銀行'),
      ],
      (id) => counts[id] ?? 0,
    );

    expect(groups.map((group) => [group.label, group.surveys.map((item) => item.id)])).toEqual([
      ['厚生労働省', ['b', 'c', 'a']],
      ['総務省', ['d', 'f', 'e']],
      // 3 調査未満の府省庁と府省庁を持たない機関は「その他の機関」へまとめ、最後に置く
      ['その他の機関', ['h', 'g']],
    ]);
    expect(new Set(groups.map((group) => group.id)).size).toBe(groups.length);
  });

  it('調査が無ければ分類も出さない', () => {
    expect(groupSurveysByMinistry([], () => 0)).toEqual([]);
  });
});
