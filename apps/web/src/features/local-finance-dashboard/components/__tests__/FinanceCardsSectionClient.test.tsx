import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FinanceCardsSectionClient } from '../FinanceCardsSectionClient';

import type { FinanceCardsData, YearRecord } from '../../lib/load-finance-cards';

const selected = vi.hoisted(() => ({ code: null as string | null }));
vi.mock('@/features/theme-dashboard', () => ({
  useThemePrefecture: () => ({ selectedPrefectureCode: selected.code }),
}));
vi.mock('@/features/finance-flow/client', () => ({ LOCAL_FINANCE_SOURCE_LINKS: [] }));
vi.mock('@/components/charts/MiniCharts', () => ({ MiniBarChart: () => null, MiniLineChart: () => null, MiniStackedBarChart: () => null }));

const record = { revenue: 100, expenditure: 90, standardScale: 80, realBalance: 10, fundAdjust: 1, fundRedemption: 2, fundOther: 3, localDebt: 20, fiscalIndex: 0.5, currentBalanceRatio: 95, debtServiceRatio: 8, futureBurdenRatio: 10 } satisfies YearRecord;
const cards = { averages: {}, years: [2024], latestYear: 2024, cards: { '13': { name: '東京都', years: { '2024': record } } } } as FinanceCardsData;

/**
 * 地方財政の決算カードの章 (2026-11-12 オーナー決定で専用ページをやめ、テーマの共通の埋め込みの章にした)。
 * 県は共通の地域の選択から読み、県を選んでいないときは 47 都道府県の比較も東京の代入もしない。
 */
describe('FinanceCardsSectionClient', () => {
  it('県を選んでいないときは何も描かない', () => {
    selected.code = null;
    const { container } = render(<FinanceCardsSectionClient cards={cards} part="finance-overview" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('選んだ県 (5 桁) の決算カードの主要指標を描く', () => {
    selected.code = '13000';
    render(<FinanceCardsSectionClient cards={cards} part="finance-overview" />);
    expect(screen.getByText('東京都（都道府県の会計）')).toBeInTheDocument();
    expect(screen.getByText('地方債現在高')).toBeInTheDocument();
  });

  it('財政の持続性の章は指標ごとに定義・ランキングへの導線を持つ', async () => {
    selected.code = '13000';
    render(<FinanceCardsSectionClient cards={cards} part="finance-sustainability" />);
    const opener = screen.getAllByRole('button', { name: '出典・指標の定義' })[0];
    fireEvent.click(opener);
    const sheet = within(await screen.findByRole('dialog'));
    expect(sheet.getByRole('link', { name: '財政力指数の定義・ランキング' })).toHaveAttribute('href', '/ranking/fiscal-strength-index-prefecture');
  });
});
