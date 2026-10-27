import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { SurveyMobileNav, SurveySideNav } from './SurveySideNav';

const pageLinks = [
  { href: '#representative-rankings' as const, label: '代表ランキング' },
  { href: '#all-rankings' as const, label: '全8件のランキング' },
];
const categories = [
  { categoryKey: 'landweather', label: '国土・気象', count: 5 },
  { categoryKey: 'commercial', label: '商業・サービス業', count: 2 },
];

describe('SurveySideNav', () => {
  it('本文上部のカードに、ページ内移動と関連分類を置く (見出しだけの「調査」カードは作らない)', () => {
    const { container } = render(
      <SurveySideNav pageLinks={pageLinks} categories={categories} />
    );

    expect(screen.queryByRole('heading', { name: '調査' })).toBeNull();
    // 調査一覧への出口は「このページ」の見出しの右端に置く
    const pageHeadingRow = screen
      .getByRole('heading', { name: 'このページ' })
      .parentElement?.parentElement;
    expect(pageHeadingRow).not.toBeNull();
    expect(
      within(pageHeadingRow as HTMLElement).getByRole('link', {
        name: '調査一覧',
      })
    ).toHaveAttribute('href', '/survey');
    expect(
      within(
        screen.getByRole('navigation', { name: 'この調査ページの内容' })
      ).getByRole('link', { name: '代表ランキング' })
    ).toHaveAttribute('href', '#representative-rankings');
    // 代表ランキングは本文の節が持つので、ナビで繰り返さない
    expect(
      screen.queryByRole('navigation', { name: 'この調査の代表ランキング' })
    ).toBeNull();
    expect(
      within(
        screen.getByRole('navigation', { name: 'この調査に関連する分類' })
      ).getByRole('link', { name: /国土・気象/ })
    ).toHaveAttribute('href', '/category/landweather');
    // 左レール (2 本目の列) ではなく、本文の上に 2 枚並べるグリッド
    expect(container.firstElementChild).toHaveClass('grid-cols-2');
    // 「このページ」のリンクは 1 列 (1024px 幅で項目名を省略させない)
    expect(
      screen.getByRole('navigation', { name: 'この調査ページの内容' })
    ).not.toHaveClass('grid-cols-2');
    // 一覧への導線は見える文字で行き先を示し、文字の矢印を書かない
    expect(screen.getByRole('link', { name: '調査一覧' }).textContent).not.toContain('→');
  });

  it('狭幅代替ナビにもページ内移動と関連分類を残し、開閉の向きを示す', async () => {
    const { container } = render(
      <SurveyMobileNav pageLinks={pageLinks} categories={categories} />
    );

    // 開閉は共通の RailCard (collapsible)。見出しのボタンで開き、向きは ChevronDown で示す
    expect(container.querySelector('svg.lucide-chevron-down')).not.toBeNull();
    expect(container.querySelector('svg.lucide-list-tree')).toBeNull();
    const trigger = screen.getByRole('button', { name: 'このページと関連する分類' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.setup().click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    expect(screen.getByRole('link', { name: '調査一覧へ' })).toHaveAttribute(
      'href',
      '/survey'
    );
    expect(
      screen.getByRole('navigation', {
        name: 'この調査ページの内容（モバイル）',
      })
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('navigation', {
          name: 'この調査に関連する分類（モバイル）',
        })
      ).getByRole('link', { name: '商業・サービス業（2）' })
    ).toHaveAttribute('href', '/category/commercial');
  });
});
