import { render, screen, within } from '@testing-library/react';
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
  it('ページ内移動・代表ランキング・関連分類を役割別に表示する', () => {
    render(
      <SurveySideNav
        pageLinks={pageLinks}
        representativeRankings={[
          { rankingKey: 'urban-planning-area', label: '都市計画区域面積' },
        ]}
        categories={categories}
      />
    );

    expect(screen.getByRole('link', { name: '調査一覧へ' })).toHaveAttribute(
      'href',
      '/survey'
    );
    const surveyHeadingRow = screen
      .getByRole('heading', { name: '調査' })
      .parentElement?.parentElement;
    expect(surveyHeadingRow).not.toBeNull();
    expect(
      within(surveyHeadingRow as HTMLElement).getByRole('link', {
        name: '調査一覧へ',
      })
    ).toHaveAttribute('href', '/survey');
    expect(
      within(
        screen.getByRole('navigation', { name: 'この調査ページの内容' })
      ).getByRole('link', { name: '代表ランキング' })
    ).toHaveAttribute('href', '#representative-rankings');
    expect(
      within(
        screen.getByRole('navigation', { name: 'この調査の代表ランキング' })
      ).getByRole('link', { name: '都市計画区域面積' })
    ).toHaveAttribute('href', '/ranking/urban-planning-area');
    expect(
      within(
        screen.getByRole('navigation', { name: 'この調査に関連する分類' })
      ).getByRole('link', { name: /国土・気象/ })
    ).toHaveAttribute('href', '/category/landweather');
  });

  it('狭幅代替ナビにもページ内移動と関連分類を残す', () => {
    render(<SurveyMobileNav pageLinks={pageLinks} categories={categories} />);

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
