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

function renderWithProvider(ui: React.ReactElement) {
  return render(<ThemePrefectureProvider>{ui}</ThemePrefectureProvider>);
}

describe('ThemeSideNav — テーマナビ', () => {
  it('デスクトップはグループ別リストを表示し、現在テーマを明示する', () => {
    renderWithProvider(<ThemeSideNav currentThemeKey="population-dynamics" />);

    const themeNav = screen.getByRole('navigation', {
      name: 'テーマを切り替える',
    });
    const current = within(themeNav).getByRole('link', { name: '人口動態' });
    const themeHeadingRow = within(themeNav)
      .getByRole('heading', { name: 'テーマ' })
      .parentElement?.parentElement;

    expect(themeHeadingRow).not.toBeNull();
    expect(
      within(themeHeadingRow as HTMLElement).getByRole('link', {
        name: 'テーマ一覧へ',
      })
    ).toHaveAttribute('href', '/themes');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.closest('details')).toHaveAttribute('open');
    expect(
      screen.queryByRole('combobox', { name: 'テーマを切り替える' })
    ).toBeNull();
  });

  it('左レールから「このページ」を除き、全指標・出典調査を役割別に表示する', () => {
    renderWithProvider(
      <ThemeSideNav
        currentThemeKey="population-dynamics"
        metrics={[{ rankingKey: 'total-population', label: '総人口' }]}
        surveys={[{ id: 'population-census', name: '国勢調査' }]}
      />
    );

    expect(
      screen.queryByRole('navigation', { name: 'このページの内容' })
    ).toBeNull();
    expect(
      within(
        screen.getByRole('navigation', { name: 'このテーマの全指標' })
      ).getByRole('link', { name: '総人口' })
    ).toHaveAttribute('href', '/ranking/total-population');
    expect(
      within(
        screen.getByRole('navigation', { name: 'このテーマの出典調査' })
      ).getByRole('link', { name: '調査一覧へ' })
    ).toHaveAttribute('href', '/survey');
    expect(
      within(
        screen.getByRole('navigation', { name: 'このテーマの出典調査' })
      ).getByRole('link', { name: '国勢調査' })
    ).toHaveAttribute('href', '/survey/population-census');
    const surveyHeadingRow = screen
      .getByRole('heading', { name: '出典調査' })
      .parentElement?.parentElement;
    expect(surveyHeadingRow).not.toBeNull();
    expect(
      within(surveyHeadingRow as HTMLElement).getByRole('link', {
        name: '調査一覧へ',
      })
    ).toHaveAttribute('href', '/survey');
  });

  it('areaContextのテーマリンクは都道府県文脈を維持し、Type Bを除外する', () => {
    render(
      <ThemeSideNav
        currentThemeKey="population-dynamics"
        areaContext={{ areaCode: '13000' }}
        showRegion={false}
      />
    );
    const themeNav = screen.getByRole('navigation', {
      name: 'テーマを切り替える',
    });

    expect(
      within(themeNav).getByRole('link', { name: '観光', hidden: true })
    ).toHaveAttribute('href', '/areas/13000/tourism');
    expect(
      within(themeNav).queryByRole('link', { name: '港湾', hidden: true })
    ).toBeNull();
  });

  it('関連調査がなくても調査ハブへの導線を残す', () => {
    render(<ThemeSideNav currentThemeKey="local-finance" showRegion={false} />);

    expect(screen.getByRole('link', { name: '調査一覧へ' })).toHaveAttribute(
      'href',
      '/survey'
    );
  });
});

describe('ThemeSideNav — 地域ブロック', () => {
  it('比較単位と表示する都道府県を分けて表示する', () => {
    renderWithProvider(<ThemeSideNav currentThemeKey="population-dynamics" />);
    expect(
      screen.getByRole('navigation', { name: '統計の地域単位' })
    ).toHaveTextContent('比較単位');
    expect(screen.getByText('表示する都道府県')).toBeInTheDocument();
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

  it('showRegion=falseでは都道府県選択だけを隠し、比較単位は残す', () => {
    render(<ThemeSideNav currentThemeKey="local-finance" showRegion={false} />);
    expect(screen.queryByLabelText('都道府県を選択')).toBeNull();
    expect(
      screen.getByRole('navigation', { name: '統計の地域単位' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'テーマを切り替える' })
    ).toBeInTheDocument();
  });

  it('showScope=falseでは比較単位だけを隠し、都道府県選択は残す', () => {
    renderWithProvider(
      <ThemeSideNav
        currentThemeKey="population-dynamics"
        showScope={false}
      />
    );
    expect(
      screen.queryByRole('navigation', { name: '統計の地域単位' })
    ).toBeNull();
    expect(screen.getByLabelText('都道府県を選択')).toBeInTheDocument();
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
