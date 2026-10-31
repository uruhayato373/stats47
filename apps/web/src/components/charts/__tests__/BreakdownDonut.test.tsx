import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BreakdownList } from '../BreakdownDonut';

const ITEMS = [
  { key: 'owner', label: '持家', value: 7756, color: '#3b82f6' },
  { key: 'rental', label: '貸家', value: 10639, color: '#f97316' },
  { key: 'condo', label: '分譲住宅', value: 10063, color: '#22c55e' },
];

describe('BreakdownList', () => {
  it('共通の凡例 (ChartLegend の一覧) で、項目ごとに値・単位・合計に対する割合を出す', () => {
    render(<BreakdownList items={ITEMS} unit="戸" />);
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText('持家')).toBeInTheDocument();
    expect(rows[0]).toHaveTextContent('7,756');
    expect(rows[0]).toHaveTextContent('戸');
    expect(rows[0]).toHaveTextContent('27.3%');
    expect(rows[1]).toHaveTextContent('37.4%');
  });

  it('合計が 0 のときは割合を 0.0% にする (0 で割らない)', () => {
    render(<BreakdownList items={ITEMS.map((item) => ({ ...item, value: 0 }))} />);
    for (const row of screen.getAllByRole('listitem')) expect(row).toHaveTextContent('0.0%');
  });
});
