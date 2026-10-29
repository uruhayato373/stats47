import {
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ALL_THEMES } from '../../config/all-themes';
import { THEME_SWITCHER_THEMES } from '../../config/theme-switcher-themes';
import { ThemePrefectureProvider } from '../ThemePrefectureContext';
import { ThemeSwitcher, buildThemeSwitcherOptions } from '../ThemeSwitcher';

// router.push を安定した spy にするため next/navigation をこのファイルで上書きする
// (test.setup.tsx のグローバルモックは呼び出しごとに新しい push を返すため assert できない)。
vi.mock('server-only', () => ({}));

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

const TYPE_B = ['ports', 'railway', 'roads'];

beforeEach(() => {
  pushMock.mockClear();
});

describe('buildThemeSwitcherOptions', () => {
  it('全国 (areaContext なし): 全テーマを /themes/{key} で返す', () => {
    const opts = buildThemeSwitcherOptions(THEME_SWITCHER_THEMES);
    expect(opts.length).toBe(ALL_THEMES.length);
    for (const o of opts) {
      expect(o.href).toBe(`/themes/${o.themeKey}`);
    }
    expect(opts.map((o) => o.themeKey)).not.toContain('local-finance-city');
  });

  it('areaContext: 都道府県文脈を維持し /areas/{code}/{key} を返す', () => {
    const opts = buildThemeSwitcherOptions(THEME_SWITCHER_THEMES, { areaCode: '13000' });
    for (const o of opts) {
      expect(o.href).toBe(`/areas/13000/${o.themeKey}`);
    }
  });

  it('areaContext: 都道府県ページで 410 になる Type B テーマを除外する', () => {
    const keys = buildThemeSwitcherOptions(THEME_SWITCHER_THEMES, { areaCode: '13000' }).map(
      (o) => o.themeKey
    );
    for (const b of TYPE_B) {
      expect(keys).not.toContain(b);
    }
    // Type A の代表は残る
    expect(keys).toContain('population-dynamics');
    expect(keys).toContain('tourism');
  });

  it('通常テーマ間のリンクへ選択中の都道府県を引き継ぐ', () => {
    const opts = buildThemeSwitcherOptions(THEME_SWITCHER_THEMES, undefined, '28000');
    expect(opts.find((o) => o.themeKey === 'tourism')?.href).toBe(
      '/themes/tourism?pref=28000'
    );
  });

  it('47都道府県の明示選択もテーマ間リンクへ引き継ぐ', () => {
    const opts = buildThemeSwitcherOptions(THEME_SWITCHER_THEMES, undefined, null);
    expect(opts.find((o) => o.themeKey === 'tourism')?.href).toBe(
      '/themes/tourism?pref=all'
    );
  });
});

describe('ThemeSwitcher (Sheet)', () => {
  /** ボタンを押して Sheet を開き、テーマのリンクの一覧を返す */
  async function openSheet() {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'テーマを切り替える' }));
    return screen.findByRole('dialog');
  }

  it('ボタンは「テーマを切り替える」と読み上げられ、今のテーマ名を表示する', () => {
    const current = ALL_THEMES.find((t) => t.themeKey === 'tourism')!;
    render(<ThemeSwitcher themes={THEME_SWITCHER_THEMES} currentThemeKey="tourism" />);
    expect(screen.getByRole('button', { name: 'テーマを切り替える' })).toHaveTextContent(current.title);
  });

  it('Sheet にテーマ一覧への出口と、系統ごとの全テーマのリンクを出す (今のテーマは現在地)', async () => {
    render(<ThemeSwitcher themes={THEME_SWITCHER_THEMES} currentThemeKey="population-dynamics" />);
    const sheet = await openSheet();
    expect(within(sheet).getByRole('link', { name: 'テーマ一覧を見る' })).toHaveAttribute('href', '/themes');
    // どのテーマも Sheet から辿れる (系統に入っていないテーマは「その他」)
    const themeLinks = within(sheet).getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/themes/'));
    expect(themeLinks).toHaveLength(THEME_SWITCHER_THEMES.length);
    const current = ALL_THEMES.find((t) => t.themeKey === 'population-dynamics')!;
    expect(within(sheet).getByRole('link', { name: current.title })).toHaveAttribute('aria-current', 'page');
  });

  it('全国: テーマのリンクは /themes/{key}', async () => {
    render(<ThemeSwitcher themes={THEME_SWITCHER_THEMES} currentThemeKey="population-dynamics" />);
    const sheet = await openSheet();
    const target = ALL_THEMES.find((t) => t.themeKey === 'tourism')!;
    expect(within(sheet).getByRole('link', { name: target.title })).toHaveAttribute('href', '/themes/tourism');
  });

  it('Provider 配下では選択中の都道府県をリンクへ引き継ぐ', async () => {
    render(
      <ThemePrefectureProvider initialAreaCode="28000" initialAreaName="兵庫県">
        <ThemeSwitcher themes={THEME_SWITCHER_THEMES} currentThemeKey="population-dynamics" />
      </ThemePrefectureProvider>
    );
    const sheet = await openSheet();
    const target = ALL_THEMES.find((t) => t.themeKey === 'tourism')!;
    expect(within(sheet).getByRole('link', { name: target.title })).toHaveAttribute('href', '/themes/tourism?pref=28000');
  });

  it('areaContext: 都道府県文脈の /areas/{code}/{key} へ。Type B テーマは出さない', async () => {
    render(
      <ThemeSwitcher themes={THEME_SWITCHER_THEMES}
        currentThemeKey="population-dynamics"
        areaContext={{ areaCode: '13000' }}
      />
    );
    const sheet = await openSheet();
    const target = ALL_THEMES.find((t) => t.themeKey === 'tourism')!;
    expect(within(sheet).getByRole('link', { name: target.title })).toHaveAttribute('href', '/areas/13000/tourism');
    for (const key of TYPE_B) {
      expect(within(sheet).queryAllByRole('link').some((a) => a.getAttribute('href')?.endsWith(`/${key}`))).toBe(false);
    }
  });
});
