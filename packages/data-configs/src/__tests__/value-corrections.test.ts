import { describe, expect, it } from 'vitest';

import { applyValueCorrections } from '../value-corrections';

const correction = {
  areaCode: '14131',
  year: 1986,
  sourceValue: 5840455,
  value: 3066860,
  reason: '区の欄に市全体の値が入っている',
  sourceUrl: 'https://example.com/1986.xls',
};

describe('applyValueCorrections', () => {
  it('指定した地域と年の値だけを置き換える', () => {
    const rows = [
      { areaCode: '14131', yearCode: '1986', value: 5840455 },
      { areaCode: '14131', yearCode: '1985', value: 3970512 },
    ];

    const corrected = applyValueCorrections('m', rows, [correction]);

    expect(corrected.map((r) => r.value)).toEqual([3066860, 3970512]);
    expect(rows[0].value).toBe(5840455);
  });

  it('元の表の値が変わっていたら古い補正を当てずに止める', () => {
    const rows = [{ areaCode: '14131', yearCode: '1986', value: 3066900 }];

    expect(() => applyValueCorrections('m', rows, [correction])).toThrow('補正の前提');
  });

  it('補正先の行が無ければ止める', () => {
    expect(() => applyValueCorrections('m', [], [correction])).toThrow('補正先の行が無い');
  });
});
