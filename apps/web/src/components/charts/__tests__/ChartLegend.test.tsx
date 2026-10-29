import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChartLegend } from '../ChartLegend';

const items = [
  { key: 'a', label: '拠点空港', color: 'hsl(var(--chart-3))', value: '4 か所' },
  { key: 'b', label: '国管理空港', color: 'hsl(var(--chart-2))', value: '19 か所' },
];

describe('ChartLegend', () => {
  it('onToggle が無ければ切り替えボタンを出さない (従来の色の説明だけ)', () => {
    render(<ChartLegend items={items} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText('拠点空港')).toBeTruthy();
  });

  it('切り替えボタンは表示中を aria-pressed=true、切った項目を false で伝え、押すと key を返す', () => {
    const onToggle = vi.fn();
    render(<ChartLegend items={items} layout="list" hiddenKeys={new Set(['b'])} onToggle={onToggle} label="表示する種別" />);
    const [shown, hidden] = screen.getAllByRole('button');
    expect(shown.getAttribute('aria-pressed')).toBe('true');
    expect(hidden.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(hidden);
    expect(onToggle).toHaveBeenCalledWith('b');
  });

  it('list のときだけ値を出し、単位が折り返さない', () => {
    const { rerender } = render(<ChartLegend items={items} />);
    expect(screen.queryByText('19 か所')).toBeNull();
    rerender(<ChartLegend items={items} layout="list" />);
    expect(screen.getByText('19 か所').className).toContain('whitespace-nowrap');
  });
});
