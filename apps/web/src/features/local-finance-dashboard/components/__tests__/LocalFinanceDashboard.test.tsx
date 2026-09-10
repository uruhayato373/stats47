import { THEME_CATALOGS } from '@stats47/data-configs/theme-catalog';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FinanceFlowData } from '@/features/finance-flow';

import { splitLocalFinanceSections } from '../../lib/finance-sections';
import { LocalFinanceDashboard } from '../LocalFinanceDashboard';

import type { FinanceCardsData, YearRecord } from '../../lib/load-finance-cards';

vi.mock('@/features/finance-flow/client', () => ({
  LOCAL_FINANCE_SOURCE_LINKS: [],
  FinanceSankey: ({ code, initialData }: { code: string; initialData?: { focusCode: string } }) => <div data-testid="flow" data-code={code} data-initial={initialData?.focusCode ?? ''} />,
}));
vi.mock('@/components/charts/MiniCharts', () => ({ MiniBarChart: () => null, MiniLineChart: () => null, MiniStackedBarChart: () => null }));
const record = { revenue: 100, expenditure: 90, standardScale: 80, realBalance: 10, fundAdjust: 1, fundRedemption: 2, fundOther: 3, localDebt: 20, fiscalIndex: 0.5, currentBalanceRatio: 95, debtServiceRatio: 8, futureBurdenRatio: 10 } satisfies YearRecord;
const cards = { averages: {}, years: [2024], latestYear: 2024, cards: { '13': { name: '東京都', years: { '2024': record } }, '28': { name: '兵庫県', years: { '2024': record } } } } as FinanceCardsData;
const sections = splitLocalFinanceSections(THEME_CATALOGS['local-finance'].sections!).dedicated;

describe('地方財政の地域・年次整合', () => {
  it('選択県の変更に追従し、異なる県のSSRフローを流用しない', () => {
    const initial = { focusCode: '13', year: 2022 } as FinanceFlowData;
    const { rerender } = render(<LocalFinanceDashboard cards={cards} sections={sections} prefCode="13" initialFinanceFlow={initial} />);
    expect(screen.getByTestId('flow')).toHaveAttribute('data-initial', '13');
    rerender(<LocalFinanceDashboard cards={cards} sections={sections} prefCode="28" initialFinanceFlow={initial} />);
    expect(screen.getByTestId('flow')).toHaveAttribute('data-code', '28');
    expect(screen.getByTestId('flow')).toHaveAttribute('data-initial', '');
    expect(screen.getByText(/決算カードは2024年度/)).toHaveTextContent('年度が異なる場合があります');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
  it('47都道府県表示で東京を代入せず県別比較表を表示する', () => {
    render(<LocalFinanceDashboard cards={cards} sections={sections} prefCode={null} />);
    expect(screen.queryByTestId('flow')).not.toBeInTheDocument();
    for (const link of screen.getAllByRole('link', { name: '兵庫県' })) {
      expect(link).toHaveAttribute('href', '/themes/local-finance?pref=28000');
    }
    expect(screen.getAllByRole('table')).toHaveLength(2);
    for (const section of sections) expect(document.getElementById(`theme-section-${section.key}`)).not.toBeNull();
  });
  it('Catalogの章順・文言を使い、専用ブロックを一度ずつ表示する', () => {
    const reordered = [...sections].reverse().map((section) => ({ ...section, title: `問い: ${section.title}` }));
    const { container } = render(<LocalFinanceDashboard cards={cards} sections={reordered} prefCode="28" />);
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(reordered.map((section) => section.title));
    expect(container.querySelectorAll('[data-theme-embedded-key]')).toHaveLength(3);
    expect(screen.getAllByTestId('flow')).toHaveLength(1);
    expect(screen.getByRole('link', { name: '財政力指数の定義・ランキング' })).toHaveAttribute('href', '/ranking/fiscal-strength-index-prefecture');
  });
});
