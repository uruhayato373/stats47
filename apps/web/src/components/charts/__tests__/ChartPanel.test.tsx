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

  // UI-FIX-RANKING-20261011: スマホで題名が年の選択に押されて「都道府県別ランキン/グ」と語の途中で折れていた。
  // 説明の無い見出しは折り返す横並びにして、入りきらない操作を次の行へ回す (grid の 1fr_auto だと題名の列が縮む)
  it('操作があり説明が無い見出しは折り返す横並びで、操作を右へ寄せる', () => {
    const { container } = render(
      <ChartPanel title="都道府県別ランキング" action={<select aria-label="年" />}>
        <div>chart</div>
      </ChartPanel>
    );
    const header = container.querySelector('[data-slot="card-header"]');
    expect(header).toHaveClass('flex', 'flex-wrap');
    expect(header).not.toHaveClass('grid');
    expect(container.querySelector('[data-slot="card-action"]')).toHaveClass('ml-auto');
  });

  it('説明があるときは題名・説明・操作の格子のまま', () => {
    const { container } = render(
      <ChartPanel title="推移" description="注記" action={<button type="button">切替</button>}>
        <div>chart</div>
      </ChartPanel>
    );
    expect(container.querySelector('[data-slot="card-header"]')).toHaveClass('grid');
  });
});
