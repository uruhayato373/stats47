import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ChartFooter } from '../ChartFooter';

describe('ChartFooter', () => {
  it('単一の出典・ランキングをアイコン付きの短い導線で表示する', async () => {
    const user = userEvent.setup();
    render(
      <ChartFooter
        source="人口動態統計"
        sourceLinks={[{ label: '人口動態統計', url: '/survey/vital-statistics' }]}
        rankingLink="/ranking/primary"
        rankingLabel="指標の定義・ランキング"
      />
    );

    const sourceLink = screen.getByRole('link', { name: '出典: 人口動態統計' });
    expect(sourceLink).toHaveAttribute('href', '/survey/vital-statistics');
    expect(screen.getByText('出典')).toBeVisible();
    expect(screen.queryByText('人口動態統計')).toBeNull();
    await user.hover(sourceLink);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('出典: 人口動態統計');
    expect(screen.getByText('ランキング')).toBeVisible();
    expect(
      screen.getByRole('link', { name: '指標の定義・ランキング' })
    ).toHaveAttribute('href', '/ranking/primary');
  });

  it('複数の出典・指標ハブを省略せず操作可能なメニューへまとめる', async () => {
    const user = userEvent.setup();
    render(
      <ChartFooter
        annotation="2020年に系列が接続しません。"
        source="複数調査"
        sourceLinks={[
          { label: '人口動態統計', url: '/survey/vital-statistics' },
          { label: '国勢調査', url: '/survey/census' },
        ]}
        rankingLink="/ranking/primary"
        rankingLabel="指標の定義・ランキング"
        rankingLinks={[
          {
            label: '関連指標の定義・ランキング',
            url: '/ranking/secondary',
          },
        ]}
      />
    );

    expect(screen.getByText('2020年に系列が接続しません。')).toBeVisible();
    await user.click(screen.getByRole('button', { name: '出典2件を表示' }));
    expect(await screen.findByRole('menuitem', { name: '人口動態統計' })).toHaveAttribute(
      'href',
      '/survey/vital-statistics'
    );
    fireEvent.keyDown(document, { key: 'Escape' });

    await user.click(screen.getByRole('button', { name: 'ランキング2件を表示' }));
    expect(
      screen.getByRole('menuitem', { name: '指標の定義・ランキング' })
    ).toHaveAttribute('href', '/ranking/primary');
    expect(
      screen.getByRole('menuitem', { name: '関連指標の定義・ランキング' })
    ).toHaveAttribute('href', '/ranking/secondary');
  });

  it('リンク先が無い出典はアイコン付き文字列として残す', () => {
    render(<ChartFooter source="独自集計" />);
    expect(screen.getByText('独自集計')).toBeVisible();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
