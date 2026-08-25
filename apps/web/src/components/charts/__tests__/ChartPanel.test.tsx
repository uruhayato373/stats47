import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChartPanel } from '../ChartPanel';

describe('ChartPanel', () => {
  it('見出しでチャート領域をアクセシブルに命名する', () => {
    render(
      <ChartPanel title="出生率・死亡率の推移">
        <div>chart</div>
      </ChartPanel>
    );

    const region = screen.getByRole('region', {
      name: '出生率・死亡率の推移',
    });
    expect(region).toHaveAttribute(
      'aria-labelledby',
      screen.getByRole('heading').id
    );
  });

  it('説明がある場合だけ aria-describedby で関連付ける', () => {
    render(
      <ChartPanel title="推移" description="系列断絶に注意">
        <div>chart</div>
      </ChartPanel>
    );

    const region = screen.getByRole('region', { name: '推移' });
    expect(region).toHaveAccessibleDescription('系列断絶に注意');
  });
});
