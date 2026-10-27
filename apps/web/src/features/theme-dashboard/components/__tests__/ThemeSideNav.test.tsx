import {
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { THEME_SWITCHER_THEMES } from '../../config/theme-switcher-themes';
import { ThemePrefectureProvider } from '../ThemePrefectureContext';
import { ThemeSideNav } from '../ThemeSideNav';

vi.mock('server-only', () => ({}));

function renderWithProvider(ui: React.ReactElement) {
  return render(<ThemePrefectureProvider>{ui}</ThemePrefectureProvider>);
}

describe('ThemeSideNav — テーマナビ', () => {
  it('テーマ一覧はサイドバーの「テーマ」と重複するので描かない', () => {
    renderWithProvider(<ThemeSideNav themes={THEME_SWITCHER_THEMES} currentThemeKey="population-dynamics" />);

    expect(
      screen.queryByRole('navigation', { name: 'テーマを切り替える' })
    ).toBeNull();
    expect(screen.queryByRole('link', { name: '人口動態' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'テーマ' })).toBeNull();
    expect(
      screen.queryByRole('combobox', { name: 'テーマを切り替える' })
    ).toBeNull();
  });

  it('左レールから「このページ」を除き、全指標・出典調査を役割別に表示する', () => {
    renderWithProvider(
      <ThemeSideNav themes={THEME_SWITCHER_THEMES}
        currentThemeKey="population-dynamics"
        metrics={[{ rankingKey: 'total-population', label: '総人口' }]}
        surveys={[{ id: 'population-census', name: '国勢調査' }]}
      />
    );

    expect(
      screen.queryByRole('navigation', { name: 'このページの内容' })
    ).toBeNull();
    // 全指標は折りたたみ (既定は閉)。閉じていてもリンクは DOM に残す (keepMounted) ので hidden も含めて探す
    expect(
      within(
        screen.getByRole('navigation', { name: 'このテーマの全指標', hidden: true })
      ).getByRole('link', { name: '総人口', hidden: true })
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

  it('areaContext を渡してもテーマリンクを描かない (テーマ間の移動はページ上部の切替が持つ)', () => {
    render(
      <ThemeSideNav themes={THEME_SWITCHER_THEMES}
        currentThemeKey="population-dynamics"
        areaContext={{ areaCode: '13000' }}
        showRegion={false}
      />
    );

    expect(
      screen.queryByRole('link', { name: '観光', hidden: true })
    ).toBeNull();
    expect(
      screen.queryByRole('navigation', { name: 'テーマを切り替える' })
    ).toBeNull();
  });

  it('関連調査がなくても調査ハブへの導線を残す', () => {
    render(<ThemeSideNav themes={THEME_SWITCHER_THEMES} currentThemeKey="local-finance" showRegion={false} />);

    expect(screen.getByRole('link', { name: '調査一覧へ' })).toHaveAttribute(
      'href',
      '/survey'
    );
  });
});

describe('ThemeSideNav — 地域ブロック', () => {
  it('比較単位と表示する都道府県を分けて表示する', () => {
    renderWithProvider(<ThemeSideNav themes={THEME_SWITCHER_THEMES} currentThemeKey="population-dynamics" />);
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
    render(<ThemeSideNav themes={THEME_SWITCHER_THEMES} currentThemeKey="local-finance" showRegion={false} />);
    expect(screen.queryByLabelText('都道府県を選択')).toBeNull();
    expect(
      screen.getByRole('navigation', { name: '統計の地域単位' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'テーマを切り替える' })
    ).toBeNull();
  });

  it('showScope=falseでは比較単位だけを隠し、都道府県選択は残す', () => {
    renderWithProvider(
      <ThemeSideNav themes={THEME_SWITCHER_THEMES}
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
    renderWithProvider(<ThemeSideNav themes={THEME_SWITCHER_THEMES} currentThemeKey="population-dynamics" />);

    // Base UI の Select は pointer の一連の操作で選ぶので、fireEvent.click ではなく user-event で操作する
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('都道府県を選択'));
    await user.click(await screen.findByRole('option', { name: '大阪府' }));

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
