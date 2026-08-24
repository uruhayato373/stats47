import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemePrefectureProvider } from '../ThemePrefectureContext';
import { ThemeSideNav } from '../ThemeSideNav';
import { buildThemeSwitcherOptions } from '../ThemeSwitcher';

function renderWithProvider(ui: React.ReactElement) {
  return render(<ThemePrefectureProvider>{ui}</ThemePrefectureProvider>);
}

describe('ThemeSideNav — ページ内ナビ', () => {
  it('全テーマ一覧を展開せず、共通ThemeSwitcherで切り替える', () => {
    renderWithProvider(<ThemeSideNav currentThemeKey="population-dynamics" />);

    expect(screen.getByLabelText('テーマを切り替える')).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'テーマと地域' })
    ).toBeNull();
  });

  it('ページ内リンク・全指標・出典調査を役割別に表示する', () => {
    renderWithProvider(
      <ThemeSideNav
        currentThemeKey="population-dynamics"
        pageLinks={[{ href: '#theme-charts', label: 'チャート' }]}
        metrics={[{ rankingKey: 'total-population', label: '総人口' }]}
        surveys={[{ id: 'population-census', name: '国勢調査' }]}
      />
    );

    expect(
      within(
        screen.getByRole('navigation', { name: 'このページの内容' })
      ).getByRole('link', { name: 'チャート' })
    ).toHaveAttribute('href', '#theme-charts');
    expect(
      within(
        screen.getByRole('navigation', { name: 'このテーマの全指標' })
      ).getByRole('link', { name: '総人口' })
    ).toHaveAttribute('href', '/ranking/total-population');
    expect(
      within(
        screen.getByRole('navigation', { name: 'このテーマの出典調査' })
      ).getByRole('link', { name: '国勢調査' })
    ).toHaveAttribute('href', '/survey/population-census');
  });

  it('areaContextのテーマ選択肢は都道府県文脈を維持する', () => {
    const options = buildThemeSwitcherOptions({ areaCode: '13000' }, null);

    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.href).toMatch(/^\/areas\/13000\//);
    }
    expect(options.map((option) => option.href)).not.toContain(
      '/areas/13000/ports'
    );
  });
});

describe('ThemeSideNav — 地域ブロック', () => {
  it('既定では地域セレクタを出し、未選択時は47都道府県を現在値にする', () => {
    renderWithProvider(<ThemeSideNav currentThemeKey="population-dynamics" />);
    expect(screen.getByLabelText('都道府県を選択')).toHaveTextContent(
      '47都道府県'
    );
    expect(screen.getByLabelText('都道府県を選択')).not.toHaveTextContent(
      '全国'
    );
    expect(
      screen.queryByRole('button', { name: '47都道府県に戻す' })
    ).toBeNull();
  });

  it('showRegion=falseで地域ブロックを出さない', () => {
    render(<ThemeSideNav currentThemeKey="local-finance" showRegion={false} />);
    expect(screen.queryByLabelText('都道府県を選択')).toBeNull();
    expect(screen.getByLabelText('テーマを切り替える')).toBeInTheDocument();
  });

  it('県を選ぶと47都道府県へ戻す操作を表示する', async () => {
    renderWithProvider(<ThemeSideNav currentThemeKey="population-dynamics" />);

    fireEvent.click(screen.getByLabelText('都道府県を選択'));
    fireEvent.click(await screen.findByRole('option', { name: '大阪府' }));

    await waitFor(() => {
      expect(screen.getByLabelText('都道府県を選択')).toHaveTextContent(
        '大阪府'
      );
    });
    expect(
      screen.getByRole('button', { name: '47都道府県に戻す' })
    ).toBeInTheDocument();
  });
});
