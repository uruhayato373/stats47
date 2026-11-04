import { describe, expect, it } from 'vitest';

import { relabelYearNames } from '../year-names';

describe('relabelYearNames', () => {
  it('暦年の指標の年度の年名を年へ直し、件数を返す', () => {
    const { rows, relabeled } = relabelYearNames([{ yearCode: '2023', yearName: '2023年度' }], 'calendar');

    expect(rows[0].yearName).toBe('2023年');
    expect(relabeled).toBe(1);
  });

  it('年度の指標は変えない', () => {
    expect(relabelYearNames([{ yearCode: '2023', yearName: '2023年度' }], 'fiscal').relabeled).toBe(0);
  });

  it('時点を説明する年名は変えない', () => {
    const row = { yearCode: '2024', yearName: '2024年度末（2025年3月31日）' };

    expect(relabelYearNames([row], 'calendar')).toEqual({ rows: [row], relabeled: 0 });
  });
});
