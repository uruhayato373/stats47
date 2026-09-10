import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { partitionObservedSeries, SingleYearSeriesTable } from '../SingleYearSeriesTable';

describe('単年と推移の分離', () => {
  const series = [{ dataKey: 'a', name: '求人倍率', unit: '倍' }, { dataKey: 'b', name: '失業率', unit: '%' }];
  it('別々の1年を2年分の推移として扱わない', () => {
    const rows: Array<Record<string, string | number>> = [{ year: '2020年', b: 3 }, { year: '2022年', a: 1.2 }];
    const result = partitionObservedSeries(rows, series);
    expect(result.history).toEqual([]);
    expect(result.single).toEqual(series);
    expect(result.commonYears).toBe(0);
    render(<SingleYearSeriesTable rows={rows} series={result.single} yearKey="year" />);
    expect(screen.getByRole('row', { name: '求人倍率 2022年 1.2 倍' })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: '失業率 2020年 3 %' })).toBeInTheDocument();
  });
  it('単年の相手に履歴がある場合、履歴は残す', () => {
    const result = partitionObservedSeries([{ year: '2020年', b: 3 }, { year: '2022年', a: 1.2, b: 2 }], series);
    expect(result.history.map((item) => item.dataKey)).toEqual(['b']);
    expect(result.single.map((item) => item.dataKey)).toEqual(['a']);
  });
  it('欠測を0にしないが、観測された0は残す', () => {
    const result = partitionObservedSeries([{ year: '2022年', a: 0 }], series);
    expect(result.single.map((item) => item.dataKey)).toEqual(['a']);
  });
});
