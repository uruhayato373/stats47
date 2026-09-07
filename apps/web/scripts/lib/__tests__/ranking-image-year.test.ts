import { describe, expect, it } from 'vitest';

import { selectRankingImagePartition } from '../ranking-image-year';

describe('ranking OGP/card latest year', () => {
  const years = [{ yearCode: '2024', yearName: '2024年' }, { yearCode: '2007', yearName: '2007年' }];
  const partitions = [{ yearCode: '2024', values: [2024] }, { yearCode: '2007', values: [2007] }];

  it('selects declared 2024 rather than the last entry 2007 in the real descending inventory', () => {
    expect(selectRankingImagePartition({ latestYear: years[0], availableYears: years }, partitions)).toEqual({
      partition: partitions[0], yearCode: '2024', yearName: '2024年',
    });
  });

  it.each([years, [...years].reverse()])('does not depend on availableYears sort direction', (first, second) => {
    expect(selectRankingImagePartition({ availableYears: [first, second] }, partitions).yearCode).toBe('2024');
  });

  it('derives the newest actual partition when metadata has no year inventory', () => {
    expect(selectRankingImagePartition({}, [...partitions].reverse()).yearCode).toBe('2024');
  });

  it('rejects missing latest values rather than silently drawing an old year', () => {
    expect(() => selectRankingImagePartition({ latestYear: years[0] }, [partitions[1]])).toThrow('2024 has no values partition');
  });

  it('rejects absent or invalid year codes', () => {
    expect(() => selectRankingImagePartition({}, [])).toThrow('missing or invalid');
    expect(() => selectRankingImagePartition({ latestYear: { yearCode: 'latest' } }, partitions)).toThrow('missing or invalid');
  });
});
