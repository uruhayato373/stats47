import { ChartPanel } from '@stats47/components';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';


describe('ChartPanel', () => {
  it('固定IDを指定した領域と見出しを対応させる', () => {
    render(<ChartPanel id="theme-ports-map" title="港湾取扱量"><div>chart</div></ChartPanel>);
    expect(screen.getByRole('heading')).toHaveAttribute('id', 'theme-ports-map-title');
    expect(screen.getByRole('region', { name: '港湾取扱量' })).toHaveAttribute('aria-labelledby', 'theme-ports-map-title');
  });
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

  // 2026-10-29: 章の見出しと凡例が何のチャートかを示す所では、帯の題名が繰り返しになるので画面から外す
  it('hideTitle では見出しの帯を描かず、題名は読み上げの名前にだけ残す', () => {
    const { container } = render(
      <ChartPanel id="theme-x-chart-a" title="空き家率と持ち家率の推移" hideTitle>
        <div>chart</div>
      </ChartPanel>
    );
    expect(container.querySelector('[data-slot="card-header"]')).toBeNull();
    const heading = screen.getByRole('heading', { name: '空き家率と持ち家率の推移' });
    expect(heading).toHaveClass('sr-only');
    expect(screen.getByRole('region', { name: '空き家率と持ち家率の推移' })).toHaveAttribute(
      'aria-labelledby',
      'theme-x-chart-a-title'
    );
  });
});
